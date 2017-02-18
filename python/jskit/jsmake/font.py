import struct
import os.path


class FontInfoExtractor(object):

    def populate_dict(self, info):
        pass

    @staticmethod
    def for_path(path):
        fp = open(path, 'r')
        (dontcare, ext) = os.path.splitext(path)
        ext = ext.lower()
        if ext == ".ttf":
            return TTFInfoExtractor(fp)
        return FontInfoExtractor()


class TTFInfoExtractor(FontInfoExtractor):

    fp = None
    tables = None

    def __init__(self, fp):
        self.fp = fp
        self.tables = dict()

    def populate_dict(self, info):
        self.fp.seek(0)
        (version, table_count, search_range, entry_selector, range_shift) = struct.unpack('!IHHHH', self.fp.read(12))
        for i in range(table_count):
            (tag, checksum, offset, length) = struct.unpack('!4sIII', self.fp.read(16))
            self.tables[tag] = (offset, length)
        self.read_name(info)
        self.read_head(info)
        self.read_os2(info)

    def read_head(self, info):
        if 'head' not in self.tables:
            return
        offset = self.tables['head'][0]
        # skip over version, revision, check sum adjustment, and magic number
        offset += 16
        self.fp.seek(offset)
        (flags, units_per_em, unused_created, unused_modified, x_min, y_min, x_max, y_max) = struct.unpack('!HHQQhhhh', self.fp.read(28))
        info['ascender'] = float(y_max) / float(units_per_em)
        info['descender'] = float(y_min) / float(units_per_em)

    def read_name(self, info):
        if 'name' not in self.tables:
            return
        offset = self.tables['name'][0]
        self.fp.seek(offset)
        (format_selector, names_count, relative_strings_offset) = struct.unpack('!HHH', self.fp.read(6))
        strings_offset = offset + relative_strings_offset
        names_table = self.fp.read(names_count * 12)
        names_offset = 0
        names_lookup = dict()
        for i in range(names_count):
            (platform_id, encoding_id, language_id, name_id, string_length, string_offset) = struct.unpack('!HHHHHH', names_table[names_offset:names_offset+12])
            names_offset += 12
            self.fp.seek(strings_offset + string_offset)
            name = self.fp.read(string_length)
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
                info['family'] = names[16] if 16 in names else names[1]
                info['face'] = names[17] if 17 in names else names[2]
                info['unique_identifier'] = names[3]
                info['name'] = names[4]
                info['postscript_name'] = names[6]
                break

    def read_os2(self, info):
        if 'OS/2' not in self.tables:
            return
        offset = self.tables['OS/2'][0]
        # skipping first two 16 bit fields
        offset += 4
        self.fp.seek(offset)
        info['weight'] = struct.unpack('!H', self.fp.read(2))[0]
        # skipping a bunch of fields
        offset += 58
        self.fp.seek(offset)
        fs_selection = struct.unpack('!H', self.fp.read(2))[0]
        info['style'] = 'italic' if fs_selection & 0x0001 else 'normal'


def main():
    import sys
    info = dict()
    extractor = FontInfoExtractor.for_path(sys.argv[1])
    extractor.populate_dict(info)
    print info


if __name__ == "__main__":
    main()
