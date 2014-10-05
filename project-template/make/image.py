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

    fp = None

    def __init__(self, fp):
        self.fp = fp

    def populate_dict(self, info):
        self.fp.seek(8)
        (datalength, chunk_type, width, height) = struct.unpack('!I4s2I', self.fp.read(16))
        if chunk_type == 'IHDR' and datalength >= 8:
            info['width'] = width
            info['height'] = height


class TIFFInfoExtractor(ImageInfoExtractor):

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
        self.tiffoffset = self.fp.tell()
        header = self.fp.read(8)
        if struct.unpack('2s', header[0:2])[0] == 'II':
            self.order = '<'
        else:
            self.order = '>'
        fixed, ifdoffset = struct.unpack(self.order + 'HI', header[2:])
        if fixed == self.MAGIC_NUMBER:
            self.ifd_populate_dict(ifdoffset, info)

    def entry_populate_dict(self, entry, info):
        if entry.tag == self.HEIGHT_TAG_ID:
            info['height'] = entry.offsetOrValue
        elif entry.tag == self.WIDTH_TAG_ID:
            info['width'] = entry.offsetOrValue

    def ifd_populate_dict(self, ifdoffset, info):
        self.fp.seek(self.tiffoffset + ifdoffset)
        entrycount = struct.unpack(self.order + 'H', self.fp.read(2))[0]
        # Go ahead and read all the entries because it's more efficient
        # AND because some entries could cause us to read elsewhere in the file (see JPEG EXIF_IFD_TAG_ID)
        entriesbuff = self.fp.read(entrycount * self.ENTRY_SIZE)
        for buffoffset in range(0, entrycount * self.ENTRY_SIZE, self.ENTRY_SIZE):
            entry = self.Entry._make(struct.unpack(self.order + self.ENTRY_STRUCT, entriesbuff[buffoffset:buffoffset + self.ENTRY_SIZE]))
            self.entry_populate_dict(entry, info)


class JPEGInfoExtractor(TIFFInfoExtractor):

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
        self.fp.seek(2)
        markerinfo = self.fp.read(4)
        # Scan through markers to find EXIF data
        while len(markerinfo) == 4:
            marker, datalength = struct.unpack('!2sH', markerinfo)
            if marker[0] != '\xFF':
                break  # not a marker...we're in the wrong place or the file is corrupt
            if marker[1] == '\x00':
                break  # invalid marker
            if marker[1] == '\xFF':
                # we've landed in a run of filler bytes
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
                # self.fp.seek(datalength - 7, os.SEEK_CUR)  # minus 7, 2 for datalength and 5 for header data we've already read
            elif marker[1] == self.MARKER_EXIF:
                exifoffset = self.fp.tell()
                exif = self.fp.read(6)
                # TODO: haven't found a spec on this exif identifier sequence, but it apepars to be 'Exif' followed by two null bytes
                # For now we'll check for 'Exif' and then skip the next two bytes
                if exif[0:4] == 'Exif':
                    self.tiff_populate_dict(info)
                self.fp.seek(exifoffset + datalength - 2)
            else:
                self.fp.seek(datalength - 2, os.SEEK_CUR)  # Minus 2 because we already read the datalength, which includes itself
            markerinfo = self.fp.read(4)

    def entry_populate_dict(self, entry, info):
        if entry.tag == self.EXIF_IFD_TAG_ID:
            self.ifd_populate_dict(entry.offsetOrValue, info)
        elif entry.tag == self.EXIF_HEIGHT_TAG_ID:
            info['height'] = entry.offsetOrValue
        elif entry.tag == self.EXIF_WIDTH_TAG_ID:
            info['width'] = entry.offsetOrValue
        else:
            super(JPEGInfoExtractor, self).entry_populate_dict(entry, info)


class SVGInfoExtractor(ImageInfoExtractor, xml.sax.handler.ContentHandler):

    SVGNS = 'http://www.w3.org/2000/svg'

    fp = None
    currentInfo = None

    def __init__(self, fp):
        self.fp = fp

    def populate_dict(self, info):
        self.fp.seek(0)
        self.currentInfo = info
        self.parser = xml.sax.make_parser()
        self.parser.setFeature(xml.sax.handler.feature_namespaces, True)
        self.parser.setFeature(xml.sax.handler.feature_external_ges, False)  # reaaaaly slow with external_ges enabled
        self.parser.setContentHandler(self)
        try:
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
        raise self.StopParser

    def endElement(self, name):
        pass

    def startElementNS(self, name, qname, attrs):
        def svgnumber(s):
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
            widthkey = (None, 'width')
            heightkey = (None, 'height')
            if widthkey in attrs and heightkey in attrs and attrs[widthkey] and attrs[heightkey]:
                width, wu = svgnumber(attrs[widthkey])
                height, hu = svgnumber(attrs[heightkey])
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
