import struct
import os.path
import zlib


class FontInfoExtractor(object):

    def populate_dict(self, info):
        pass

    @staticmethod
    def for_path(path):
        fp = open(path, 'r')
        sig = fp.read(4)
        # WOFF files begin with the magic string 'wOFF'
        if sig == '\x77\x4f\x46\x46':
            return WOFFInfoExtractor(fp)
        # TTF doesn't really have a magic signature, but it always starts with
        # a version number: 0x00 0x01 0x00 0x00.
        # OTF may have the TTF version, or may have 'OTTO' for its version.  For our purposes
        # of extracting name & overall metrics, OTF is identical to TTF
        elif sig == '\x00\x01\x00\x00' or sig[0:4] == '\x4F\x54\x54\x4F':
            return TTFInfoExtractor(fp)
        return FontInfoExtractor()


class TTFInfoExtractor(FontInfoExtractor):
    """
    See https://developer.apple.com/fonts/TrueType-Reference-Manual/
    See https://www.microsoft.com/typography/otspec/otff.htm (OTF is identical to TTF for what we care about)
    """

    fp = None
    tables = None

    def __init__(self, fp):
        self.fp = fp
        self.tables = dict()

    def populate_dict(self, info):
        """
        A TTF file begins with a small header, followed by a list of tables, followed by the table data.

        So we
        1) read the header to find out how many tables there are
        2) read the table list to find the names, offsets, and lengths of each table
        3) read specific tables to extract the information we want

        In particular, we're looking for
        1) Font names (family, face, postscript, full name)
        2) Ascender and descender lengths (for the font as a whole, not per glyph)
        3) Weight (as in integer 100 - 900), and style (italic or normal)
        """
        self.fp.seek(0)
        (version, table_count, search_range, entry_selector, range_shift) = struct.unpack('!IHHHH', self.fp.read(12))
        for i in range(table_count):
            (tag, checksum, offset, length) = struct.unpack('!4sIII', self.fp.read(16))
            self.tables[tag] = (offset, length)
        self.read_name(info)
        self.read_head(info)
        self.read_os2(info)

    def read_table(self, tag):
        if tag not in self.tables:
            return None
        offset = self.tables[tag][0]
        length = self.tables[tag][1]
        self.fp.seek(offset)
        data = self.fp.read(length)
        return data

    def read_head(self, info):
        data = self.read_table('head')
        if data is None:
            return
        (flags, units_per_em, unused_created, unused_modified, x_min, y_min, x_max, y_max) = struct.unpack('!HHQQhhhh', data[16:44])
        info['ascender'] = float(y_max) / float(units_per_em)
        info['descender'] = float(y_min) / float(units_per_em)

    def read_name(self, info):
        data = self.read_table('name')
        if data is None:
            return
        (format_selector, names_count, strings_offset) = struct.unpack('!HHH', data[0:6])
        offset = 6
        names_lookup = dict()
        for i in range(names_count):
            (platform_id, encoding_id, language_id, name_id, string_length, string_offset) = struct.unpack('!HHHHHH', data[offset:offset+12])
            offset += 12
            self.fp.seek(strings_offset + string_offset)
            name = data[strings_offset+string_offset:strings_offset+string_offset+string_length]
            if platform_id == 3 and encoding_id == 1:
                name = name.decode('utf-16be').encode('utf-8')
            key = (platform_id, encoding_id, language_id)
            if key not in names_lookup:
                names_lookup[key] = dict()
            names_lookup[key][name_id] = name

        preferred_names = (
            (1, 0, 0),  # Macintosh, Roman, English
            (3, 1, 1033),  # Windows, UGL, American English (Codepage 1252?)
        )

        for preferred_name in preferred_names:
            if preferred_name in names_lookup:
                names = names_lookup[preferred_name]
                if 'family' not in info and (16 in names or 1 in names):
                    info['family'] = names[16] if 16 in names else names[1]
                if 'face' not in info and (17 in names or 2 in names):
                    info['face'] = names[17] if 17 in names else names[2]
                if 'unique_identifier' not in info and 3 in names:
                    info['unique_identifier'] = names[3]
                if 'name' not in info and 4 in names:
                    info['name'] = names[4]
                if 'postscript_name' not in info and 6 in names:
                    info['postscript_name'] = names[6]

    def read_os2(self, info):
        data = self.read_table('OS/2')
        if data is None:
            return
        info['weight'] = struct.unpack('!H', data[4:6])[0]
        fs_selection = struct.unpack('!H', data[62:64])[0]
        info['style'] = 'italic' if fs_selection & 0x0001 else 'normal'


class WOFFInfoExtractor(TTFInfoExtractor):
    """
    See https://www.w3.org/TR/WOFF

    WOFF files contain all the TTF/OTF data, but possibly in a compressed format.
    They also start with a different header format.  But since most of the logic will
    be the same for our puposes of extracting name & overall metric information, we
    can leverage the TTFInfoExtractor and overwrite how to read the initial header and how
    to read table data with decompression
    """

    def populate_dict(self, info):
        self.fp.seek(4)
        (flavor, length, table_count) = struct.unpack('!IIH', self.fp.read(10))
        self.fp.seek(44)
        for i in range(table_count):
            (tag, offset, compressed_length, original_length, original_checksum) = struct.unpack('!4sIIII', self.fp.read(20))
            self.tables[tag] = (offset, compressed_length, original_length)
        self.read_name(info)
        self.read_head(info)
        self.read_os2(info)

    def read_table(self, name):
        if name not in self.tables:
            return None
        offset = self.tables[name][0]
        compressed_length = self.tables[name][1]
        original_length = self.tables[name][2]
        self.fp.seek(offset)
        data = self.fp.read(compressed_length)
        if compressed_length < original_length:
            data = zlib.decompress(data)
        return data


def main():
    import sys
    import json
    info = dict()
    extractor = FontInfoExtractor.for_path(sys.argv[1])
    extractor.populate_dict(info)
    print json.dumps(info, indent=2)


if __name__ == "__main__":
    main()
