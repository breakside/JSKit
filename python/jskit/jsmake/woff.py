import sys
import struct
import zlib
import os.path


def sfnt_to_woff(input_filename, output_filename):
    infile = open(input_filename, 'r')
    outfile = open(output_filename, 'w+')

    tables = []

    infile.seek(0)
    (version, table_count, search_range, entry_selector, range_shift) = struct.unpack('!IHHHH', infile.read(12))
    for i in range(table_count):
        # table is (tag, checksum, offset, length)
        table = struct.unpack('!IIII', infile.read(16))
        tables.append(table)

    sfnt_size = 12 + (16 * table_count)
    for table in tables:
        sfnt_size += (table[3] + 3) & 0xFFFFFFFC

    new_head_checksum = _head_checksum(version, tables)

    # write woff header
    outfile.write(struct.pack('!4sIIHHIHHIIIII',
        'wOFF',         # signature
        version,        # flavor (sfnt version)
        0,              # woff length, will be overwritten later
        table_count,    # table count
        0,              # reserved
        sfnt_size,      # size of original sfnt file data
        1,              # woff major version
        0,              # woff minor version
        0,              # meta offset
        0,              # meta compressed length
        0,              # meta original length
        0,              # private data offset
        0               # private data length
    ))
    offset = 44

    # write placeholder for table index
    table_index_length = 20 * table_count
    outfile.write('\x00' * table_index_length)
    offset += table_index_length

    output_tables = []

    # compress and write table data
    # we'll preserve the original ordering of the table data by sorting by offset
    # preserving the order is important to ensure the original checksums match when
    # a ttf is reconstructed
    tables = sorted(tables, key=lambda table: table[2])
    for table in tables:
        infile.seek(table[2])
        data = infile.read(table[3])
        if _is_tag(table[0], 'head'):
            # This is just a precaution in case there was incorrect data in the original file.
            # I haven't seen it in practice, but woff->ttf will recaculate a few ttf header fields
            # and the recalcuation differs from the original, it'll mess up the checksums
            old_head_checksum = struct.unpack('!I', data[8:12])[0]
            if old_head_checksum != new_head_checksum:
                data[8:12] = struct.pack('!I', new_head_checksum)
        # don't bother compressing small tables...may need to adjust threshhold
        if len(data) > 256:
            compressed = zlib.compress(data)
            # make sure the compressed data is actually smaller than the original
            if len(compressed) < len(data):
                data = compressed
        table_length = len(data)
        outfile.write(data)
        padded_length = (table_length + 3) & 0xFFFFFFFC
        if padded_length > table_length:
            outfile.write('\x00' * (padded_length - table_length))
        output_tables.append((table[0], offset, table_length, table[3], table[1]))
        offset += padded_length

    # overwrite the placeholder woff length in the header
    outfile.seek(8)
    outfile.write(struct.pack('!I', offset))

    # overwrite the placeholder table index
    # tables must be sorted by tag
    output_tables = sorted(output_tables, key=lambda table: table[0])
    outfile.seek(44)
    for table in output_tables:
        outfile.write(struct.pack('!IIIII', *table))

    infile.close()
    outfile.close()


def many_sfnt_to_woff(input_filenames):
    for input_filename in input_filenames:
        output_filename = os.path.splitext(input_filename)[0] + '.woff'
        sfnt_to_woff(input_filename, output_filename)


def _head_checksum(version, tables):
    table_count = len(tables)
    x = table_count
    entry_selector = 0
    while x > 1:
        x = x >> 1
        entry_selector += 1
    search_range = (2 ** entry_selector) * 16
    range_shift = table_count * 16 - search_range
    data = struct.pack('!IHHHH', version, table_count, search_range, entry_selector, range_shift)
    checksum = 0
    offset = len(data) + 16 * table_count
    rebuilt_tables = []
    for table in sorted(tables, key=lambda table: table[2]):
        rebuilt_tables.append((table[0], table[1], offset, table[3]))
        checksum = _checksum32(checksum, table[1])
        padded_length = (table[3] + 3) & 0xFFFFFFFC
        offset += padded_length
    for table in sorted(rebuilt_tables, key=lambda table: table[0]):
        data += struct.pack('!IIII', *table)
    values = struct.unpack('!%dI' % (len(data) / 4), data)
    for value in values:
        checksum = _checksum32(checksum, value)
    checksum = (0xB1B0AFBA - checksum) & 0xFFFFFFFF
    return checksum


def _is_tag(tag_integer, tag_string):
    return \
        (tag_integer >> 24) == ord(tag_string[0]) and \
        ((tag_integer >> 16) & 0xFF) == ord(tag_string[1]) and \
        ((tag_integer >> 8) & 0xFF) == ord(tag_string[2]) and \
        (tag_integer & 0xFF) == ord(tag_string[3])


def _checksum32(checksum, value):
    return (checksum + value) % 0x100000000


def usage():
    print "Usage:\n"
    print "    %s ttf_or_otf_file1 [ttf_or_otf_file2 ...]\n" % sys.argv[0]


def main():
    input_filenames = sys.argv[1:]
    if len(input_filenames) > 0:
        many_sfnt_to_woff(input_filenames)
    else:
        usage()


if __name__ == "main":
    main()
