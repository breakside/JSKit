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
            # print tag
        self.read_name(info)
        self.read_head(info)
        self.read_os2(info)
        # self.read_cmap(info)
        self.read_horizontal_metrics(info)

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
        info['yMax'] = y_max
        info['yMin'] = y_min
        info['unitsPerEM'] = units_per_em

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

    def read_cmap(self, info):
        data = self.read_table('cmap')
        version, subtableCount = struct.unpack('!HH', data[0:4])
        offset = 4
        candidates = []
        for i in range(subtableCount):
            platform_id, platform_specific_id, map_offset = struct.unpack('!HHI', data[offset:offset+8])
            offset += 8
            if platform_id == 0:
                if platform_specific_id <= 4:
                    candidates.append((platform_id, platform_specific_id, map_offset))
            if platform_id == 3:
                if platform_specific_id in (1, 10):
                    candidates.append((platform_id, platform_specific_id, map_offset))

        candidates.sort(key=lambda x: (x[0], -x[1]))
        if len(candidates) > 0:
            map_offset = candidates[0][2]
            cmap_format = struct.unpack('!H', data[map_offset:map_offset+2])[0]
            print "cmap %d" % cmap_format
            if cmap_format == 0:
                self.read_cmap_0(info, data[map_offset+6:map_offset+262])
            elif cmap_format == 2:
                length, langauge = struct.unpack('!HH', data[map_offset+2:map_offset+6])
                self.read_cmap_2(info, data[map_offset+6:map_offset+length])
            elif cmap_format == 4:
                length, langauge = struct.unpack('!HH', data[map_offset+2:map_offset+6])
                self.read_cmap_4(info, data[map_offset+6:map_offset+length])
            elif cmap_format == 6:
                length, langauge = struct.unpack('!HH', data[map_offset+2:map_offset+6])
                self.read_cmap_6(info, data[map_offset+6:map_offset+length])
            elif cmap_format == 8:
                length, langauge = struct.unpack('!II', data[map_offset+4:map_offset+12])
                self.read_cmap_8(info, data[map_offset+12:map_offset+length])
            elif cmap_format == 10:
                length, langauge = struct.unpack('!II', data[map_offset+4:map_offset+12])
                self.read_cmap_10(info, data[map_offset+12:map_offset+length])
            elif cmap_format == 12:
                length, langauge = struct.unpack('!II', data[map_offset+4:map_offset+12])
                self.read_cmap_12(info, data[map_offset+12:map_offset+length])
            elif cmap_format == 13:
                length, langauge = struct.unpack('!II', data[map_offset+4:map_offset+12])
                self.read_cmap_13(info, data[map_offset+12:map_offset+length])
            elif cmap_format == 14:
                raise Exception(u"%s: cmap type 14 not supported" % self.fp.name)
        else:
            raise Exception(u"%s: no suitable cmap found" % self.fp.name)

    def read_cmap_0(self, info, data):
        glyph_indexes = struct.unpack('!256b', data)
        entry = dict(start=None, glyphs=[])
        info['character_map'] = dict()
        for character_code in range(256):
            if glyph_indexes[character_code] == 0:
                if entry['start'] is not None:
                    info['character_map'].append(entry)
                entry = dict(start=None, glyphs=[])
            else:
                info['character_map'][character_code] = glyph_indexes[character_code]

    def read_cmap_2(self, info, data):
        sub_header_keys = struct.unpack('!256H', data[0:512])
        for i in range(256):
            value = sub_header_keys[i] / 8

    def read_cmap_4(self, info, data):
        # Useful for Basic Multilingual Plane (BMP) Unicode
        seg_count_x2, search_range, entry_selector, range_shift = struct.unpack('!HHHH', data[0:8])
        seg_count = seg_count_x2 / 2

    def read_cmap_6(self, info, data):
        # Useful for 
        first_code, entry_count = struct.unpack('!HH', data[0:4])
        glyph_indexes = struct.unpack('!%dH' % entry_count, data[4:])


    def read_cmap_8(self, info, data):
        pass

    def read_cmap_10(self, info, data):
        pass

    def read_cmap_12(self, info, data):
        # Useful for 32-bit unicode sparse groups
        group_count = struct.unpack('!I',  data[0:4])[0]
        offset = 4
        info['cmap'] = []
        for i in range(group_count):
            start_code, end_code, start_glyph_index = struct.unpack('!III', data[offset:offset+12])
            info['cmap'].append((start_code,end_code,start_glyph_index))
            offset += 12

    def read_cmap_13(self, info, data):
        pass

    def read_cmap_14(self, info, data):
        pass

    def read_horizontal_metrics(self, info):
        data = self.read_table('hhea')
        ascent, descent, line_gap = struct.unpack('!hhh', data[4:10])
        info['ascender'] = ascent
        info['descender'] = descent
        # num_of_long_horiz_metrics = struct.unpack('!H', data[34:36])[0]
        # data = self.read_table('hmtx')
        # info['widths'] = []
        # offset = 0
        # for i in range(num_of_long_horiz_metrics):
        #     advance_width, left_side_bearing = struct.unpack('!HH', data[offset:offset+4])
        #     info['widths'].append(advance_width)
        #     offset += 4
        # i = num_of_long_horiz_metrics - 1
        # while i > 0 and info['widths'][i] == info['widths'][i - 1]:
        #     i -= 1
        # info['widths'] = info['widths'][0:i+1]


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
