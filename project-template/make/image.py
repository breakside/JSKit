import os
import struct
import re
from collections import namedtuple
import xml.sax
import xml.sax.handler


class ImageInfoExtractor(object):

    def populate_dict(self, info):
        pass

    @staticmethod
    def for_path(path):
        f = open(path)
        sig = f.read(8)
        if sig == '\x89\x50\x4E\x47\x0D\x0A\x1A\x0A':
            return PNGInfoExtractor(f)
        elif sig[0:2] == '\xFF\xD8':
            return JPEGInfoExtractor(f)
        elif sig[0:4] == 'II\x2A\x00' or sig[0:4] == 'MM\x00\x2A':
            return TIFFInfoExtractor(f)
        elif sig[0:5] == '<?xml':
            return SVGInfoExtractor(f)
        return ImageInfoExtractor()


class PNGInfoExtractor(ImageInfoExtractor):
    """
    See http://www.w3.org/TR/PNG/ for a PNG file format specification
    """

    fp = None

    def __init__(self, fp):
        self.fp = fp

    def populate_dict(self, info):
        # The first 8 bytes are the PNG signature, \x89\x50\x4E\x47\x0D\x0A\x1A\x0A, which we'll skip
        # because we assume that we've been handed a PNG by ImageInfoExtractor.for_path and don't need to double-check
        self.fp.seek(8)
        # Then there's a header struct, which we'll only read the first few fields of because
        # all we really care about here is the width and height.
        # The struct is defined in the PNG specification, and it's basically:
        # * 1 16-bit length
        # * 4 characters representing a type label ("IHDR")
        # * 1 16-bit width
        # * 1 16-bit height
        (datalength, chunk_type, width, height) = struct.unpack('!I4s2I', self.fp.read(16))
        if chunk_type == 'IHDR' and datalength >= 8:
            info['width'] = width
            info['height'] = height


class TIFFInfoExtractor(ImageInfoExtractor):
    """
    See http://partners.adobe.com/public/developer/en/tiff/TIFF6.pdf for a TIFF file format specification
    """

    fp = None
    tiffoffset = 0
    oder = None

    MAGIC_NUMBER = 42
    WIDTH_TAG_ID = 256
    HEIGHT_TAG_ID = 257
    ENTRY_SIZE = 12
    ENTRY_STRUCT = 'HHII'
    Entry = namedtuple('TIFFIFDEntry', ('tag', 'type', 'count', 'offsetOrValue'))

    def __init__(self, fp):
        self.fp = fp

    def populate_dict(self, info):
        self.fp.seek(0)
        self.tiff_populate_dict(info)

    def tiff_populate_dict(self, info):
        # This is split into its own function to accomodate a true TIFF file, which starts at offset 0,
        # and a TIFF structure inside a JPEG, which could start at a non-zero offset.
        # Essentially, this class or a sub-class (like JPEGInfoExtractor) can seek to the start of a TIFF
        # structure, and then call this method to do the common parsing.
        self.tiffoffset = self.fp.tell()
        header = self.fp.read(8)
        # TIFFs can be either big or little endian, and the first couple bytes of the header tell use
        # which we're dealing with.  We've gotta read this first so we can tell python the proper way
        # to unpack all subsequent data
        if struct.unpack('2s', header[0:2])[0] == 'II':
            self.order = '<'
        else:
            self.order = '>'
        # Next come a couple fields, one to verify we have the right kind of file, and another to
        # tell us where to go find the Image File Directory (IFD), which has the metadata we're looking for.
        fixed, ifdoffset = struct.unpack(self.order + 'HI', header[2:])
        if fixed == self.MAGIC_NUMBER:
            self.ifd_populate_dict(ifdoffset, info)

    def ifd_populate_dict(self, ifdoffset, info):
        # This is split into its own function because JPEG EXIF has an Image File Directory that's
        # different from the main TIFF IFD.  So as above, it's useful to allow just this parsing to be called
        # separately from the main TIFF parsing logic, since we need to do the same exact thing, just from a
        # different offset that's only known to a subclass like JPEGInfoExtractor.
        self.fp.seek(self.tiffoffset + ifdoffset)
        # The IFD is pretty simple: it starts with a count of entries, then lists all the entries.  An entry
        # is basically a key/value pair, with its type specified (some keys can be different types depding on the file)
        # It's a little bit strage, but the value of an entry could be an offset to the true value.  That allows the entries
        # to be fixed sizes, even if the information they represent is variable sized.
        entrycount = struct.unpack(self.order + 'H', self.fp.read(2))[0]
        # Go ahead and read all the entries because it's more efficient
        # AND because some entries could cause us to read elsewhere in the file (see JPEG EXIF_IFD_TAG_ID)
        entriesbuff = self.fp.read(entrycount * self.ENTRY_SIZE)
        for buffoffset in range(0, entrycount * self.ENTRY_SIZE, self.ENTRY_SIZE):
            entry = self.Entry._make(struct.unpack(self.order + self.ENTRY_STRUCT, entriesbuff[buffoffset:buffoffset + self.ENTRY_SIZE]))
            self.entry_populate_dict(entry, info)

    def entry_populate_dict(self, entry, info):
        # This method is split out so subclasses can override it and extract information based on their custom
        # tags.  By default, we'll check for the standard width and height tags.
        if entry.tag == self.HEIGHT_TAG_ID:
            info['height'] = entry.offsetOrValue
        elif entry.tag == self.WIDTH_TAG_ID:
            info['width'] = entry.offsetOrValue


class JPEGInfoExtractor(TIFFInfoExtractor):

    """
    See http://www.w3.org/Graphics/JPEG/itu-t81.pdf for a JPEG file specification, especially Annex B
    """

    MARKER_EXIF = '\xE1'
    STAND_ALONES = ('\xD0', '\xD1', '\xD2', '\xD3', '\xD4', '\xD5', '\xD6', '\xD7', '\xD8', '\xD9')
    FRAME_MARKERS = ('\xC0', '\xC1', '\xC2', '\xC3', '\xC5', '\xC6', '\xC7', '\xC8', '\xC9', '\xCA', '\xCB', '\xCD', '\xCE', '\xCF')
    EXIF_IFD_TAG_ID = 34665
    EXIF_WIDTH_TAG_ID = 40962
    EXIF_HEIGHT_TAG_ID = 40963
    FRAME_STRUCT = '!BHH'
    FrameHeader = namedtuple('JPEGFrameHeader', ('P', 'Y', 'X'))

    def __init__(self, fp):
        super(JPEGInfoExtractor, self).__init__(fp)

    def populate_dict(self, info):
        # A JPEG file is structured as a series of blocks.  Each block starts with a marker, and most have a length and data,
        # although a few are just standalone markers (like the Start Of File marker).
        # The width and height of an image can be stored in a few different places of a JPEG, and sometimes in multiple places.
        # One place we might find the width and height is in a frame header.  There are many different kinds of frames, but they
        # all store width and height in the same place.
        # Another place we might find the width and height is in the TIFF data of the Exif block.  This class extends from the
        # TIFF class so it can share parsing code easily.  Now, exif defines its own TIFF tags for width and height, so there
        # are actually two places in the TIFF data where we might find width and height.
        # Anyway, the parsing job is simple enough: skip through the JPEG blocks until we find the first frame or the exif data.
        self.fp.seek(2)
        markerinfo = self.fp.read(4)
        while len(markerinfo) == 4:
            marker, datalength = struct.unpack('!2sH', markerinfo)
            if marker[0] != '\xFF':
                break  # Markers always start with \xFF, so if that's not what we're seeing, then we're not at a marker...we're in the wrong place or the file is corrupt
            if marker[1] == '\x00':
                break  # invalid marker (as per the spec, \xFF\x00 is not valid)
            if marker[1] == '\xFF':
                # we've landed in a run of filler bytes (a block can end with a sequence of \xFFs in order to align properly on certain byte boundaries)
                # moving one byte at a time really slow way of finding the next marker, but we probably
                # won't ever hit this when looking for exif, which should be at or near the start
                markerinfo = markerinfo[1:] + self.fp.read(1)
                continue
            if marker[1] in self.STAND_ALONES:
                # Stand-alone marker, doesn't have a datalength field, so what we assumed would be a datalength is really another marker
                markerinfo = markerinfo[2:] + self.fp.read(2)
                continue
            if marker[1] in self.FRAME_MARKERS:
                header = self.FrameHeader._make(struct.unpack(self.FRAME_STRUCT, self.fp.read(5)))
                info['width'] = header.X
                info['height'] = header.Y
                break
                # I changed this to a break because the frame data should trump the exif data, so if we find the frame
                # first, there's no reason to continue looking for the exif data.
                # self.fp.seek(datalength - 7, os.SEEK_CUR)  # minus 7, 2 for datalength and 5 for header data we've already read
            elif marker[1] == self.MARKER_EXIF:
                exifoffset = self.fp.tell()
                exif = self.fp.read(6)
                # TODO: haven't found a spec on this exif identifier sequence, but it apepars to be 'Exif' followed by two null bytes
                # For now we'll check for 'Exif' and then skip the next two bytes
                if exif[0:4] == 'Exif':
                    # Exif data is based on the TIFF format, so we'll use the superclass parsing logic to make it through
                    # Although, Exif defines custom TIFF IFD entries, so we overwrite entry_popuplate_dict() below
                    self.tiff_populate_dict(info)
                self.fp.seek(exifoffset + datalength - 2)
            else:
                self.fp.seek(datalength - 2, os.SEEK_CUR)  # Minus 2 because we already read the datalength, which includes itself
            markerinfo = self.fp.read(4)

    def entry_populate_dict(self, entry, info):
        if entry.tag == self.EXIF_IFD_TAG_ID:
            # So when we start reading the Exif data, we start parsing a TIFF file, which points to the main IFD
            # within the TIFF data.  In that main IFD, exif places this tag, which points to a second, Exif-specific IFD.
            # We recurse into this second IFD in order to find the exif width and height fields
            # Note that the implementation of ifd_populate_dict ensures that we can seek to a new place in the file
            # without affecting the reading of the original IFD
            self.ifd_populate_dict(entry.offsetOrValue, info)
        elif entry.tag == self.EXIF_HEIGHT_TAG_ID:
            info['height'] = entry.offsetOrValue
        elif entry.tag == self.EXIF_WIDTH_TAG_ID:
            info['width'] = entry.offsetOrValue
        else:
            super(JPEGInfoExtractor, self).entry_populate_dict(entry, info)


class SVGInfoExtractor(ImageInfoExtractor, xml.sax.handler.ContentHandler):

    """
    See http://www.w3.org/TR/SVG/struct.html for an SVG specification
    """

    SVGNS = 'http://www.w3.org/2000/svg'

    fp = None
    currentInfo = None

    def __init__(self, fp):
        self.fp = fp

    def populate_dict(self, info):
        self.fp.seek(0)
        self.currentInfo = info
        # Using sax, an event-based xml parse, because we only need to read the opening tag of the file.
        # A tree parser, like dom, would have to read the entire file.
        self.parser = xml.sax.make_parser()
        self.parser.setFeature(xml.sax.handler.feature_namespaces, True)
        self.parser.setFeature(xml.sax.handler.feature_external_ges, False)  # reaaaaly slow with external_ges enabled
        self.parser.setContentHandler(self)
        try:
            # This is a little silly, but python's sax parser doesn't have a built-in way to stop parsing.
            # So, we'll just throw a special exception when we want to stop, and catch it.  Not really what
            # exceptions should be used for, but it works and I couldn't think of anything better
            self.parser.parse(self.fp)
        except self.StopParser:
            pass

    def startDocument(self):
        pass

    def endDocument(self):
        pass

    def startPrefixMapping(self, prefix, uri):
        pass

    def endPrefixMapping(self, prefix):
        pass

    def startElement(self, name, attrs):
        # The document element should be in the SVG namespace, so it should trigger startElementNS.
        # If instead we see a non-namespaced element first, this isn't a valid svg document
        raise self.StopParser

    def endElement(self, name):
        pass

    def startElementNS(self, name, qname, attrs):
        def svgnumber(s):
            # See http://www.w3.org/TR/SVG/types.html#DataTypeLength, and make sure you're looking at the
            # instructions for SVG attributes rather than CSS properties
            matches = re.match(r'^(.*?)(em|ex|px|in|cm|mm|pt|pc|%)?$', s)
            units = matches.group(2)
            n = matches.group(1)
            matches = re.match(r'(.*?)[eE]([+\-]?[0-9]+)$', n)
            if matches:
                exponent = int(matches.group(2))
                n = matches.group(1)
            else:
                exponent = 0
            if re.match(r'^[+\-]?[0-9]+$', n):
                return int(n) * 10 ** exponent, units
            if re.match(r'^[+\-]?[0-9]*\.[0-9]+$', n):
                return float(n) * 10 ** exponent, units
            return None, None

        def pxlength(n, units):
            # I know these conversions aren't exact, but they'll be fine for any normal cases
            # where the svg size is defined in non-relative units (like px instead of em), and
            # where width and height are defined in the same units (the only sane thing to do).
            # In other strange, but still allowed cases, the conversions here will be close and
            # better than nothing, but probably not perfect.
            if units == 'px' or units == 'pt':
                return n
            if units == 'pc':
                return 12 * n
            if units == 'em':
                return 12 * n
            if units == 'ex':
                return 24 * n
            if units == 'in':
                return 72 * n
            if units == 'cm':
                return 72 * n / 2.54
            if units == 'mm':
                return 72 * n / 25.4

        if name[0] == self.SVGNS and name[1] == 'svg':
            # sax attribute keys on a namespaced element are tuples in the form of (nsurl, name)
            # with and height aren't namespaced, and I discovered via trial that None was proper for the url in these cases
            widthkey = (None, 'width')
            heightkey = (None, 'height')
            if widthkey in attrs and heightkey in attrs and attrs[widthkey] and attrs[heightkey]:
                width, wu = svgnumber(attrs[widthkey])
                height, hu = svgnumber(attrs[heightkey])
                # If either value is specified as a percentage, there's no inherit absolute width and height, so we'll skip it
                if wu and hu and wu != '%' and hu != '%':
                    self.currentInfo['width'] = pxlength(width, wu)
                    self.currentInfo['height'] = pxlength(height, wu)
        raise self.StopParser

    def endElementNS(self, name, qname):
        pass

    def characters(self, content):
        pass

    def ignorableWhitespace(self, whitespace):
        pass

    def processingInstruction(self, target, data):
        pass

    def skippedEntity(self, name):
        pass

    class StopParser(Exception):
        pass
