import struct
import os.path
import zlib
import base64


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
        # a version number: 0x00 0x01 0x00 0x00.  (Some mac fonts may start with 'true').
        # OTF may have the TTF version, or may have 'OTTO' for its version.  For our purposes
        # of extracting name & overall metrics, OTF is identical to TTF
        elif sig == '\x00\x01\x00\x00' or sig[0:4] == '\x4F\x54\x54\x4F' or sig[0:4] == '\x74\x72\x75\x65':
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
        self.read_cmap(info)
        self.read_horizontal_metrics(info)
        sizes = sorted([(tag, self.tables[tag][1]) for tag in self.tables], key=lambda x: -x[1])
        # info['sizes'] = sizes

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
            print (platform_id, platform_specific_id)
            offset += 8
            # 0 = Unicode
            if platform_id == 0:
                # 0 = Default
                # 1 = Version 1.1
                # 2 = ISO 10646 1993 semantics (deprecated)
                # 3 = Unicode 2.0 or later semantics (BMP only)
                # 4 = Unicode 2.0 or later semantics (non-BMP characters allowed)
                if platform_specific_id <= 4:
                    candidates.append((platform_id, platform_specific_id, map_offset))
                # (not supported) 5 = Unicode Variation Sequences
                # (not supported) 6 = Full Unicode coverage (used with type 13.0 cmaps by OpenType)
            # 3 = Windows
            if platform_id == 3:
                # 1 = Unicode BMP (UCS-2)
                # 10 = Unicode UCS-4
                # Fonts that support Unicode BMP characters on the Windows platform must have a format 4 'cmap' subtable for platform ID 3, platform-specific encoding 1. 
                # Fonts that support Unicode supplementary-plane characters on the Windows platform must have a format 12 subtable for platform ID 3, encoding ID 10. 
                # To ensure backward compatibility with older software and devices, a format 4 subtable for platform ID 3, encoding ID 1 is also required
                if platform_specific_id in (1, 10):
                    candidates.append((platform_id, platform_specific_id, map_offset))

        candidates.sort(key=lambda x: (x[0], -x[1]))
        if len(candidates) > 0:
            map_offset = candidates[0][2]
            cmap_format = struct.unpack('!H', data[map_offset:map_offset+2])[0]
            info["cmap"] = dict(
                format=cmap_format
            )
            # if cmap_format == 0:
            #     info["cmap"]["data"] = base64.b64encode(zlib.compress(data[map_offset+6:map_offset+262]))
            # else:
            adjustment = 0
            if cmap_format in (4, 6):
                struct_format = '!HH'
                struct_length = 4
            elif cmap_format == 8:
                # 8 is a mixed 16-bit to 32-bit format, and is discouraged because
                # rendering systems typically will already know if a character is
                # 16 or 32 bit.  Aside from telling which characters are which width,
                # format 8 looks identical to format 12, so we'll just call it 12 and
                # take the relevant slice of data
                info["cmap"]["format"] = 12
                adjustment = 65536
            elif cmap_format in (8, 10, 12, 13):
                struct_format = '!II'
                struct_length = 8
            else:
                raise Exception(u"%s: cmap type %d not supported" % (self.fp.name, cmap_format))
            length, langauge = struct.unpack(struct_format, data[map_offset+2:map_offset+2+struct_length])
            info["cmap"]["data"] = base64.b64encode(zlib.compress(data[map_offset+6+adjustment:map_offset+length-adjustment]))
        else:
            raise Exception(u"%s: no suitable cmap found" % self.fp.name)

    def read_horizontal_metrics(self, info):
        data = self.read_table('hhea')
        ascent, descent, line_gap = struct.unpack('!hhh', data[4:10])
        info['ascender'] = ascent
        info['descender'] = descent
        num_of_long_horiz_metrics = struct.unpack('!H', data[34:36])[0]
        data = self.read_table('hmtx')
        widths = ""
        offset = 0
        for i in range(num_of_long_horiz_metrics):
            advance_width, left_side_bearing = struct.unpack('!HH', data[offset:offset+4])
            widths += struct.pack('!H', advance_width)
            offset += 4
        info['widths'] = base64.b64encode(zlib.compress(widths))


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
