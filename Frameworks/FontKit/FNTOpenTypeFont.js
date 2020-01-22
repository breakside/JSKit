// #import Foundation
/* global FNTOpenTypeConstructor */
'use strict';

(function(){

// Required:
// cmap  Character to glyph mapping
// head  Font header
// hhea  Horizontal header
// hmtx  Horizontal metrics
// maxp  Maximum profile
// name  Naming table
// OS/2  OS/2 and Windows specific metrics
// post  PostScript information
//
// TrueType:
// cvt   Control Value Table (optional table)
// fpgm  Font program (optional table)
// glyf  Glyph data
// loca  Index to location
// prep  CVT Program (optional table)
// gasp  Grid-fitting/Scan-conversion (optional table)
//
// CFF (Type1):
// CFF   Compact Font Format 1.0
// CFF2  Compact Font Format 2.0
// VORG  Vertical Origin (optional table)
//
// Multiple Master support in OpenType has been discontinued as of version 1.3 of the specification. The MMSD and MMFX tables that were defined in versions prior to version 1.3 are no longer supported.
//
// SVG:
// SVG   The SVG (Scalable Vector Graphics) table
//
// Bitmap:
// EBDT  Embedded bitmap data
// EBLC  Embedded bitmap location data
// EBSC  Embedded bitmap scaling data
// CBDT  Color bitmap data
// CBLC  Color bitmap location data
// sbix  Standard bitmap graphics

JSClass("FNTOpenTypeFont", JSObject, {

    data: null,
    dataView: null,

    version: 0,
    tableCount: 0,
    tableIndex: null,
    tables: null,
    searchRange: 0,
    entrySelector: 0,
    rangeShift: 0,

    cmap: JSLazyInitProperty('_getUnicodeCmap'),

    // MARK: - Reading

    initWithData: function(data){
        this.data = data;
        this.dataView = data.dataView();
        this.tableIndex = {};
        this.tables = {};
        this.readHeader();
        this.readTableIndex();
    },

    readHeader: function(){
        if (this.data.length < 12){
            throw new Error("Not enough data to be a OTF");
        }
        this.version = this.dataView.getUint32(0);
        // 0x00010000 -  1.0   - TrueType font or OpenType font with True Type glyphs in `glyf` table
        // 0x4F54544F - 'OTTO' - OpenType font with Compact Font Format glyphs in `CFF ` table
        // 0x74727565 - 'true' - Recognized by Apple as a TrueType Font
        if (this.version != 0x00010000 && this.version != 0x4F54544F && this.version != 0x74727565){
            throw new Error("Invalid OTF version");
        }
        this.tableCount = this.dataView.getUint16(4);
        this.searchRange = this.dataView.getUint16(6);
        this.entrySelector = this.dataView.getUint16(8);
        this.rangeShift = this.dataView.getUint16(10);
    },

    readTableIndex: function(){
        var offset = 12;
        if (this.data.length < offset + this.tableCount * 16){
            throw new Error("Not enough data for table index");
        }
        var tag;
        var checksum;
        var tableOffset;
        var tableLength;
        for (var i = 0; i < this.tableCount; ++i, offset += 16){
            tag = String.fromCharCode(this.dataView.getUint8(offset), this.dataView.getUint8(offset + 1), this.dataView.getUint8(offset + 2), this.dataView.getUint8(offset + 3));
            checksum = this.dataView.getUint32(offset + 4);
            tableOffset = this.dataView.getUint32(offset + 8);
            tableLength = this.dataView.getUint32(offset + 12);
            this.tableIndex[tag] = {offset: tableOffset, checksum: checksum, length: tableLength};
            this._defineTableProperty(tag, checksum, tableOffset, tableLength);
        }
    },

    validateChecksums: function(){
        var property;
        var data;
        for (var tag in this.tableIndex){
            property = tag.trim();
            data = this.tables[property].data;
            var sum;
            if (tag == 'head'){
                var adjustment = data.subdataInRange(JSRange(8, 4));
                data[8] = 0;
                data[9] = 0;
                data[10] = 0;
                data[11] = 0;
                sum = tableChecksum(data);
                adjustment.copyTo(data, 8);
            }else{
                sum = tableChecksum(data);
            }
            if (sum != this.tableIndex[tag].checksum){
                throw new Error("Invalid checksum for %s table at 0x%08x".sprintf(tag, this.tableIndex[tag].offset));
            }
        }
    },

    _defineTableProperty: function(tag, checksum, tableOffset, tableLength){
        var property = tag.trim();
        var font = this;
        Object.defineProperty(this.tables, property, {
            configurable: true,
            enumerable: true,
            get: function FNTOpenTypeFont_getTable(){
                var data = font.data.subdataInRange(JSRange(tableOffset, tableLength));
                var table = FNTOpenTypeFontTable.initWithTag(tag, font, data);
                Object.defineProperty(this, property, {enumerable: true, value: table});
                return table;
            }
        });
    },

    // MARK: - Glyphs

    widthOfGlyph: function(glyphIndex){
        var hmtx = this.tables.hmtx;
        if (hmtx){
            return hmtx.widthOfGlyph(glyphIndex) / this.tables.head.unitsPerEM;
        }
        return 0;
    },

    glyphForCharacter: function(character){
        return this.cmap.glyphForCharacterCode(character.code);
    },

    _getUnicodeCmap: function(){
        var cmap = this.tables.cmap;
        if (cmap){
            // each pair is a (platformId, specificId) set.
            // consult the true type reference for details
            // basic idea is to get a unicode map, preferring
            // the unicode platform (0) first, then windows (3)
            var unicodeMap = cmap.getMap(
                [0, 4],
                [0, 3],
                [0, 2],
                [0, 1],
                [0, 0],
                [3, 10],
                [3, 1]
            );
            if (unicodeMap){
                return unicodeMap;
            }

            // If we don't have a unicode based map, we'll look for a Mac
            // map.  It is common for PDF embedded fonts to only include
            // a 1,0 mac roman cmap.
            //
            // Since the mac roman encoding isn't aligned with unicode,
            // we'll wrap it in a map-like object that can convert from
            // unicode to mac roman, and then lookup the glyph.
            var macRomanMap = cmap.getMap([1,0]);
            return UnicodeConvertingCmap(UnicodeToMacRoman, macRomanMap);
        }
        return FNTOpenTypeFontCmapNull.init();
    },

    /// If needed, regenerate this font with common errors corrected. 
    ///
    /// Fonts embedded in PDFs often have errors such as misaligned tables or
    /// missing OS/2 tables.  Safari doesn't care about these errors, but
    /// Chrome and Firefox do, so we need to correct them in order to use the
    /// font in those browsers.
    ///
    /// Chrome and Firefox use the OTS (https://github.com/khaledhosny/ots)
    /// OpenType sanitizer, which checks for a lot of common errors.
    /// While an ideal method here would check for all the same errors, we've
    /// started with only those observed in PDF files in the wild:
    ///
    /// - Missing OS/2 table
    /// - Missing post table
    /// - Missing cmap table
    /// - Missing unicode cmap
    /// - Tables not aligned to 4 byte boundaries
    /// - Invalid table search parameters in header
    getCorrectedFont: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var errors = {
            alignment: false,
            os2: false,
            post: false,
            unicode: false,
            tableSearchParams: false
        };
        var tables = [];

        // Table alignment
        var tag;
        for (tag in this.tableIndex){
            if (this.tableIndex[tag].offset % 4){
                errors.alignment = true;
                break;
            }
        }

        // Missing OS/2 
        if (!('OS/2' in this.tables)){
            errors.os2 = true;
        }

        // Missing post
        if (!('post' in this.tables)){
            errors.post = true;
        }

        // Missing Unicode cmap
        errors.unicode = !this.tables.cmap || !this.tables.cmap.getMap([0, 3], [3, 10], [3, 1]);

        // Table Search params
        var entrySelector = log2(this.tableCount);
        var searchRange = 1 << (entrySelector + 4);
        var rangeShift = this.tableCount * 16 - searchRange;

        errors.tableSearchParams = (entrySelector != this.entrySelector) || (searchRange != this.searchRange) || (rangeShift != this.rangeShift);

        if (errors.alignment || errors.os2 || errors.post || errors.unicode){
            var head;
            var cmap;
            for (tag in this.tables){
                if (tag == 'head'){
                    // Need to reset the head table checksum adjustment to 0
                    // so the constructor can properly calculate checksums.
                    // Make a copy so we don't change this original font
                    head = this.tables.head.copy();
                    head.checksumAdjustment = 0;
                    tables.push(head);
                }else if (tag == 'cmap' && errors.unicode){
                    cmap = this.tables.cmap.copy();
                    tables.push(cmap);
                }else{
                    tables.push(this.tables[tag]);
                }
            }
            var index = this.tableIndex;
            // Keep the tables in their orignal order
            tables.sort(function(a, b){
                return index[a.tag].offset - index[b.tag].offset;
            });
            if (errors.os2){
                var os2 = FNTOpenTypeFontTableOS2.init();
                os2.setLineHeight(this.tables.head.ascender, this.tables.head.descender);
                tables.push(os2);
            }
            if (errors.post){
                var post = FNTOpenTypeFontTablePost.init();
                tables.push(post);
            }
            if (errors.unicode){
                var map;
                if (!this.tables.cmap){
                    cmap = FNTOpenTypeFontTableCmap.init();
                    tables.push(cmap);
                    // Have a PDF with a font, no cmap table at all, and over 4000 glyphs
                    // (WRONG) Just assume that char code == glyph??
                    // (WRONG) Assume standard encoding and ingore most of the glyphs??
                    // Use mapping from pdf somehow??
                    map = FNTOpenTypeFontCmap12.initWithUnicodeGlyphPairs([[32, 1], [33, 2], [34, 3], [35, 4], [36, 5], [37, 6], [38, 7], [39, 8], [40, 9], [41, 10], [42, 11], [43, 12], [44, 13], [45, 14], [46, 15], [47, 16], [48, 17], [49, 18], [50, 19], [51, 20], [51, 21], [53, 22], [54, 23], [55, 24], [56, 25], [57, 26], [58, 27], [59, 28], [60, 29], [61, 30], [62, 31], [63, 32], [64, 33], [65, 34], [66, 35], [67, 36], [68, 37], [69, 38], [70, 39], [71, 40], [72, 41], [73, 42], [74, 43], [75, 44], [76, 45], [77, 46], [78, 47], [79, 48], [80, 49], [81, 50], [82, 51], [83, 52], [84, 53], [85, 54], [86, 55], [87, 56], [88, 57], [89, 58], [90, 59], [91, 60], [92, 61], [93, 62], [94, 63], [96, 64], [97, 65], [98, 66], [99, 67], [100, 68], [101, 69], [102, 70], [103, 71], [104, 72], [105, 73], [106, 74], [107, 75], [108, 76], [109, 77], [110, 78], [111, 79], [112, 80], [113, 81], [114, 82], [115, 83], [116, 84], [117, 85], [118, 86], [119, 87], [120, 88], [121, 89], [122, 90], [123, 91], [124, 92], [125, 93], [126, 94], [137, 95], [161, 96], [162, 97], [163, 98], [164, 99], [165, 100], [166, 101], [167, 102], [168, 103], [169, 104], [170, 105], [171, 106], [172, 107], [173, 108], [174, 109], [175, 110], [177, 111], [178, 112], [179, 113], [180, 114], [182, 115], [183, 116], [184, 117], [185, 118], [186, 119], [187, 120], [188, 121], [189, 122], [191, 123], [193, 124], [194, 125], [195, 126], [196, 127], [197, 128], [198, 129], [199, 130], [200, 131], [202, 132], [203, 133], [205, 134], [206, 135], [207, 136], [208, 137], [225, 138], [227, 139], [232, 140], [233, 141], [234, 142], [235, 143], [241, 144], [245, 145], [248, 146], [249, 147], [250, 148], [251, 149]]);
                }else{
                    // FIXME: no assurance we have a 1,0 mac roman map
                    var macRomanMap = this.tables.cmap.getMap([1, 0]);
                    var unicodeMap = UnicodeConvertingCmap(UnicodeToMacRoman, macRomanMap);
                    map = FNTOpenTypeFontCmap12.initWithUnicodeGlyphPairs(unicodeMap.getUnicodeGlyphPairs());
                }
                cmap.addMap(3, 10, map);
            }
            var constructor = FNTOpenTypeConstructor.initWithTables(tables);
            constructor.getData(function(data){
                if (data === null){
                    completion.call(target, null);
                    return;
                }
                var font = FNTOpenTypeFont.initWithData(data);
                completion.call(target, font);
            }, this);
        }else if (errors.tableSearchParams){
            // If we only have table search params issues, we can simply do
            // a copy of the data and overwrite those entries; nothing has to
            // be realigned or added.
            var data = JSData.initWithLength(this.data.length);
            var dataView = data.dataView();
            this.data.copyTo(data);
            dataView.setUint16(6, searchRange);
            dataView.setUint16(8, entrySelector);
            dataView.setUint16(10, rangeShift);
            var font = FNTOpenTypeFont.initWithData(data);
            completion.call(target, font);
        }else{
            completion.call(target, this);
        }
        return completion.promise;
    }

});

var tableChecksum = function(data){
    var dataView = data.dataView();
    var sum = new Uint32Array(1);
    sum[0] = 0;
    for (var offset = 0, l = data.length; offset < l - 3; offset += 4){
        sum[0] += dataView.getUint32(offset);
    }
    if (offset == l - 1){
        sum[0] += dataView.getUint8(offset) << 24;
    }else if (offset == l - 2){
        sum[0] += dataView.getUint16(offset) << 16;
    }else if (offset == l - 3){
        sum[0] = (dataView.getUint8(offset) << 24) | (dataView.getUint16(offset + 1) << 8);
    }
    return sum[0];
};

JSClass("FNTOpenTypeFontTable", JSObject, {

    tag: null,
    data: null,
    dataView: null,

    initWithDataLength: function(length){
        this.data = JSData.initWithLength(length);
        this.dataView = this.data.dataView();
    },

    initWithData: function(data){
        this.data = data;
        this.dataView = data.dataView();
    },

    initWithTag: function(tag, font, data){
        var cls = FNTOpenTypeFontTable.ClassesByTag[tag];
        if (cls){
            return cls.initWithData(data, font);
        }
        var table = FNTOpenTypeFontTable.initWithData(data);
        table.tag = tag;
        return table;
    },

    alignedLength: JSReadOnlyProperty(),

    getAlignedLength: function(){
        var remainder = this.data.length % 4;
        if (remainder !== 0){
            return this.data.length + 4 - remainder;
        }
        return this.data.length;
    },

    calculateChecksum: function(){
        return tableChecksum(this.data);
    }
});

FNTOpenTypeFontTable.ClassesByTag = {};

FNTOpenTypeFontTable.$extend = function(extensions, name){
    var subclass = JSClass.prototype.$extend.call(this, extensions, name);
    this.ClassesByTag[extensions.tag] = subclass;
    return subclass;
};

var DataBackedProperty = function(offset, dataType){
    if (this === undefined){
        return new DataBackedProperty(offset, dataType);
    }else{
        this.offset = offset;
        this.dataType = dataType;
    }
};

DataBackedProperty.prototype = Object.create(JSCustomProperty.prototype);

DataBackedProperty.prototype.define = function(C, publicKey, extensions){
    var privateKey = "_" + publicKey;
    var upperType = this.dataType.capitalizedString();
    var dataGetter = DataView.prototype['get' + upperType];
    var dataSetter = DataView.prototype['set' + upperType];
    var offset = this.offset;
    Object.defineProperty(this, privateKey, {writable: true, value: undefined});
    Object.defineProperty(C.prototype, publicKey, {
        get: function DataBackedProperty_get(){
            if (this[privateKey] === undefined){
                var value = dataGetter.call(this.dataView, offset);
                this[privateKey]=  value;
            }
            return this[privateKey];
        },
        set: function DataBackedProperty_set(value){
            dataSetter.call(this.dataView, offset, value);
            this[privateKey] = value;
        }
    });
};

JSClass("FNTOpenTypeFontTableHead", FNTOpenTypeFontTable, {
    tag: 'head',

    majorVersion:       DataBackedProperty(0, 'uint16'),
    minorVersion:       DataBackedProperty(2, 'uint16'),
    majorRevision:      DataBackedProperty(4, 'uint16'),
    minorRevision:      DataBackedProperty(6, 'uint16'),
    checksumAdjustment:  DataBackedProperty(8, 'uint32'),
    magicNumber:        DataBackedProperty(12, 'uint32'),
    flags:              DataBackedProperty(16, 'uint16'),
    unitsPerEM:         DataBackedProperty(18, 'uint16'),
    createdHigh:        DataBackedProperty(20, 'uint32'),
    createdLow:         DataBackedProperty(24, 'uint32'),
    modifiedHigh:       DataBackedProperty(28, 'uint32'),
    modifiedLow:        DataBackedProperty(32, 'uint32'),
    xMin:               DataBackedProperty(36, 'int16'),
    yMin:               DataBackedProperty(38, 'int16'),
    xMax:               DataBackedProperty(40, 'int16'),
    yMax:               DataBackedProperty(42, 'int16'),
    macStyle:           DataBackedProperty(44, 'uint16'),
    lowestRecPPEM:      DataBackedProperty(46, 'uint16'),
    fontDirectionHint:  DataBackedProperty(48, 'int16'),
    indexToLocFormat:   DataBackedProperty(50, 'int16'),
    glyphDataFormat:    DataBackedProperty(52, 'int16'),

    init: function(){
        FNTOpenTypeFontTableHead.$super.initWithDataLength.call(this, 54);
        this.majorVersion = 1;
        this.magicNumber = 0x5F0F3CF5;
        this.unitsPerEM = 2048;
        this.lowestRecPPEM = 1;
        this.fontDirectionHint = 2; // Deprecated (Set to 2)
        this.indexToLocFormat = 1; // (1 = 32 bit offsets)
        this.glyphDataFormat = 0; // (0 = current format)
    },

    initWithData: function(data, font){
        FNTOpenTypeFontTableHead.$super.initWithData.call(this, data);
        if (data.length < 20){
            throw new Error("head data not long enough");
        }
    },

    copy: function(){
        var data = JSData.initWithLength(this.data.length);
        this.data.copyTo(data);
        return FNTOpenTypeFontTableHead.initWithData(data);
    },

    setFileChecksum: function(sum){
        this.checksumAdjustment = 0xB1B0AFBA - sum;
    },

    setItalic: function(){
        this.macStyle = this.macStyle | 0x2;
    },

    setBold: function(){
        this.macStyle = this.macStyle | 0x1;
    },

    setBoundingBox: function(box){
        this.xMin = box[0];
        this.yMin = box[1];
        this.xMax = box[2];
        this.yMax = box[3];
    }
});

JSClass("FNTOpenTypeFontTableName", FNTOpenTypeFontTable, {
    tag: 'name',

    format: DataBackedProperty(0, 'uint16'),
    count: DataBackedProperty(2, 'uint16'),
    stringsOffset: DataBackedProperty(4, 'uint16'),

    lookup: null,

    init: function(){
        FNTOpenTypeFontTableName.$super.initWithDataLength.call(this, 6);
        this.format = 0;
        this.count = 0;
        this.stringsOffset = 6;
        this.lookup = {};
    },

    initWithData: function(data, font){
        FNTOpenTypeFontTableName.$super.initWithData.call(this, data);
        if (data.length < 6){
            throw new Error("name data not long enough");
        }
        this.records = [];
        if (data.length < 6 + this.count * 12){
            throw new Error("name data not long enough");
        }
        this.lookup = {};
        var platformId;
        var encodingId;
        var languageId;
        var nameId;
        var stringLength;
        var stringOffset;
        var offset = 6;
        var key;
        for (var i = 0; i < this.count; ++i, offset += 12){
            platformId = this.dataView.getUint16(offset);
            encodingId = this.dataView.getUint16(offset + 2);
            languageId = this.dataView.getUint16(offset + 4);
            nameId = this.dataView.getUint16(offset + 6);
            stringLength = this.dataView.getUint16(offset + 8);
            stringOffset = this.dataView.getUint16(offset + 10);
            key = "%d:%d:%d".sprintf(platformId, encodingId, languageId);
            if (!(key in this.lookup)){
                this.lookup[key] = {};
            }
            this.lookup[key][nameId] = data.subdataInRange(JSRange(this.stringsOffset + stringOffset, stringLength));
        }
    },

    addName: function(platformId, encodingId, languageId, nameId, nameData){
        var header = this.data.subdataInRange(JSRange(0, 6));
        var recordsRange = JSRange(6, 12 * this.count);
        var records = this.data.subdataInRange(recordsRange);
        var strings = this.data.subdataInRange(JSRange(recordsRange.end, this.data.length - recordsRange.end));
        var newRecord = JSData.initWithLength(12);
        var newRecordView = newRecord.dataView();
        newRecordView.setUint16(0, platformId);
        newRecordView.setUint16(2, encodingId);
        newRecordView.setUint16(4, languageId);
        newRecordView.setUint16(6, nameId);
        newRecordView.setUint16(8, nameData.length);
        newRecordView.setUint16(10, strings.length);
        this.data = JSData.initWithChunks([
            header,
            records,
            newRecord,
            strings,
            nameData
        ]);
        this.dataView = this.data.dataView();
        this.count = this.count + 1;
        this.stringsOffset = 6 + 12 * this.count;
        var key = "%d:%d:%d".sprintf(platformId, encodingId, languageId);
        if (!(key in this.lookup)){
            this.lookup[key] = {};
        }
        this.lookup[key][nameId] = nameData;
    },

    getName: function(){
        var preferences = Array.prototype.slice.call(arguments, 0);
        var key;
        var nameId;
        for (var i = 0, l = preferences.length; i < l; ++i){
            key = "%d:%d:%d".sprintf(preferences[i][0], preferences[i][1], preferences[i][2]);
            nameId = preferences[i][3];
            if (key in this.lookup){
                if (nameId in this.lookup[key]){
                    return this.lookup[key][nameId];
                }
            }
        }
        return null;
    },

    _getNameString: function(){
        var nameIds = Array.prototype.slice.call(arguments, 0);
        var mac = this.lookup["1:0:0"];
        var win = this.lookup["3:1:1033"];
        var macEncoding = String.Encoding.utf8;
        var winEncoding = String.Encoding.utf16be;
        var i, l;
        var nameId;
        if (mac){
            for (i = 0, l = nameIds.length; i < l; ++i){
                nameId = nameIds[i];
                if (nameId in mac){
                    return String.initWithData(mac[nameId], macEncoding);
                }
            }
        }
        if (win){
            for (i = 0, l = nameIds.length; i < l; ++i){
                nameId = nameIds[i];
                if (nameId in win){
                    return String.initWithData(win[nameId], winEncoding);
                }
            }
        }
        return null;
    },

    family: JSReadOnlyProperty(),

    getFamily: function(){
        return this._getNameString(16, 1);
    },

    face: JSReadOnlyProperty(),

    getFace: function(){
        return this._getNameString(17, 2);
    },

    uniqueID: JSReadOnlyProperty(),

    getUniqueID: function(){
        return this._getNameString(3);
    },

    postscript: JSReadOnlyProperty(),

    getPostscript: function(){
        return this._getNameString(6);
    },

    fullName: JSReadOnlyProperty(),

    getFullName: function(){
        return this._getNameString(4);
    }
});

JSClass("FNTOpenTypeFontTableHhea", FNTOpenTypeFontTable, {
    tag: 'hhea',

    majorVersion:           DataBackedProperty(0, 'uint16'),
    minorVersion:           DataBackedProperty(2, 'uint16'),
    ascender:               DataBackedProperty(4, 'int16'),
    descender:              DataBackedProperty(6, 'int16'),
    lineGap:                DataBackedProperty(8, 'int16'),
    advanceWidthMax:        DataBackedProperty(10, 'uint16'),
    minLeftSideBearing:     DataBackedProperty(12, 'int16'),
    minRightSideBearing:    DataBackedProperty(14, 'int16'),
    xMaxExtent:             DataBackedProperty(16, 'uint16'),
    caretSlopeRise:         DataBackedProperty(18, 'int16'),
    caretSlopeRun:          DataBackedProperty(20, 'int16'),
    caretOffset:            DataBackedProperty(22, 'int16'),
    reserved1:              DataBackedProperty(24, 'int16'),
    reserved2:              DataBackedProperty(26, 'int16'),
    reserved3:              DataBackedProperty(28, 'int16'),
    reserved4:              DataBackedProperty(30, 'int16'),
    metricDataFormat:       DataBackedProperty(32, 'int16'),
    numberOfHMetrics:       DataBackedProperty(34, 'uint16'),

    init: function(){
        FNTOpenTypeFontTableHhea.$super.initWithDataLength.call(this, 36);
        this.majorVersion = 1;
        this.caretSlopeRise = 1;
        this.caretSlopeRun = 0;
        this.metricDataFormat = 0;
    },

    initWithData: function(data, font){
        FNTOpenTypeFontTableHhea.$super.initWithData.call(this, data);
        if (data.length < 36){
            throw new Error("hhea data not long enough");
        }
        this.dataView = data.dataView();
    }
});

JSClass("FNTOpenTypeFontTableHmtx", FNTOpenTypeFontTable, {
    tag: 'hmtx',
    widthCount: 0,

    init: function(){
        FNTOpenTypeFontTableHmtx.$super.initWithDataLength.call(this, 0);
    },

    initWithData: function(data, font){
        FNTOpenTypeFontTableHmtx.$super.initWithData.call(this, data);
        this.widthCount = font.tables.hhea.numberOfHMetrics;
        this.dataView = data.dataView();
        if (data.length < this.widthCount * 4){
            throw new Error("hmtx length not enough");
        }
    },

    widthOfGlyph: function(glyphIndex){
        var offset = Math.min(glyphIndex, this.widthCount - 1) * 4;
        return this.dataView.getUint16(offset);
    },

    setWidths: function(widths){
        this.data = JSData.initWithLength(widths.length * 4);
        this.dataView = this.data.dataView();
        var offset = 0;
        for (var i = 0, l = widths.length; i < l; ++i, offset += 4){
            this.dataView.setUint16(offset, widths[i]);
        }
        this.widthCount = widths.length;
    }
});

JSClass("FNTOpenTypeFontTableCmap", FNTOpenTypeFontTable, {
    tag: 'cmap',

    version:    DataBackedProperty(0, 'uint16'),
    count:      DataBackedProperty(2, 'uint16'),

    maps: null,

    init: function(){
        FNTOpenTypeFontTableCmap.$super.initWithDataLength.call(this, 4);
        this.maps = {};
    },

    initWithData: function(data, font){
        FNTOpenTypeFontTableCmap.$super.initWithData.call(this, data);
        this.maps = {};
        var offset = 4;
        var platformId;
        var specificId;
        var mapOffset;
        var candidates = [];
        // True Type spec says every font should have a unicode cmap
        // Preferred order is:
        // platform: 0, specific: 4
        // platform: 0, specific: < 4
        // platform: 3, specific: 10
        // platform: 3, specific: 1
        // platform: 3, specific: 0
        for (var i = 0; i < this.count; ++i, offset += 8){
            platformId = this.dataView.getUint16(offset);
            specificId = this.dataView.getUint16(offset + 2);
            mapOffset = this.dataView.getUint32(offset + 4);
            this._defineMapProperty(platformId, specificId, mapOffset);
        }
    },

    copy: function(){
        var data = JSData.initWithLength(this.data.length);
        this.data.copyTo(data);
        return FNTOpenTypeFontTableCmap.initWithData(data);
    },

    _defineMapProperty: function(platformId, specificId, mapOffset){
        var key = "%d:%d".sprintf(platformId, specificId);
        var cmap = this;
        Object.defineProperty(this.maps, key, {
            enumerable: true,
            configurable: true,
            get: function FNTOpenTypeFontTableCmap_getMap(){
                var version = cmap.dataView.getUint16(mapOffset);
                var length;
                if (version < 10){
                    length = cmap.dataView.getUint16(mapOffset + 2);
                }else{
                    length = cmap.dataView.getUint32(mapOffset + 4);
                }
                var data = cmap.data.subdataInRange(JSRange(mapOffset, length));
                var map = FNTOpenTypeFontCmap.initWithVersion(version, data);
                Object.defineProperty(this, key, {enumerable: true, configurable: true, value: map});
                return map;
            }
        });
    },

    getMap: function(){
        var preferences = Array.prototype.slice.call(arguments, 0);
        var key;
        for (var i = 0, l = preferences.length; i < l; ++i){
            key = "%d:%d".sprintf(preferences[i][0], preferences[i][1]);
            if (key in this.maps){
                return this.maps[key];
            }
        }
        return null;
    },

    addMap: function(platformId, specificId, map){
        var header = this.data.subdataInRange(JSRange(0, 4));
        var recordsRange = JSRange(4, 8 * this.count);
        var records = this.data.subdataInRange(recordsRange);
        var maps = this.data.subdataInRange(JSRange(recordsRange.end, this.data.length - recordsRange.end));
        var newRecord = JSData.initWithLength(8);
        var newRecordView = newRecord.dataView();
        var offset = 4 + 8 * (this.count + 1) + maps.length;
        newRecordView.setUint16(0, platformId);
        newRecordView.setUint16(2, specificId);
        newRecordView.setUint32(4, offset);
        this.data = JSData.initWithChunks([
            header,
            records,
            newRecord,
            maps,
            map.data
        ]);
        this.dataView = this.data.dataView();
        this.count = this.count + 1;
        this._defineMapProperty(platformId, specificId, offset);
        offset = 8;
        var mapOffset;
        for (var i = 0; i < this.count - 1; ++i, offset += 8){
            mapOffset = this.dataView.setUint32(offset, this.dataView.getUint32(offset) + 8);
            this._defineMapProperty(platformId, specificId, mapOffset);
        }
    }
});

JSClass("FNTOpenTypeFontTableOS2", FNTOpenTypeFontTable, {
    tag: "OS/2",

    version: DataBackedProperty(0, 'uint16'),
    xAvgCharWidth: DataBackedProperty(2, 'int16'),
    usWeightClass: DataBackedProperty(4, 'uint16'),
    usWidthClass: DataBackedProperty(6, 'uint16'),
    fsType: DataBackedProperty(8, 'uint16'),
    ySubscriptXSize: DataBackedProperty(10, 'int16'),
    ySubscriptYSize: DataBackedProperty(12, 'int16'),
    ySubscriptXOffset: DataBackedProperty(14, 'int16'),
    ySubscriptYOffset: DataBackedProperty(16, 'int16'),
    ySuperscriptXSize: DataBackedProperty(18, 'int16'),
    ySuperscriptYSize: DataBackedProperty(20, 'int16'),
    ySuperscriptXOffset: DataBackedProperty(22, 'int16'),
    ySuperscriptYOffset: DataBackedProperty(24, 'int16'),
    yStrikeoutSize: DataBackedProperty(26, 'int16'),
    yStrikeoutPosition: DataBackedProperty(28, 'int16'),
    sFamilyClass: DataBackedProperty(30, 'int16'),
    panose0: DataBackedProperty(32, 'uint8'),
    panose1: DataBackedProperty(33, 'uint8'),
    panose2: DataBackedProperty(34, 'uint8'),
    panose3: DataBackedProperty(35, 'uint8'),
    panose4: DataBackedProperty(36, 'uint8'),
    panose5: DataBackedProperty(37, 'uint8'),
    panose6: DataBackedProperty(38, 'uint8'),
    panose7: DataBackedProperty(39, 'uint8'),
    panose8: DataBackedProperty(40, 'uint8'),
    panose9: DataBackedProperty(41, 'uint8'),
    ulUnicodeRange1: DataBackedProperty(42, 'uint32'),
    ulUnicodeRange2: DataBackedProperty(46, 'uint32'),
    ulUnicodeRange3: DataBackedProperty(50, 'uint32'),
    ulUnicodeRange4: DataBackedProperty(54, 'uint32'),
    achVendID: DataBackedProperty(58, 'uint32'),
    fsSelection: DataBackedProperty(62, 'uint16'),
    usFirstCharIndex: DataBackedProperty(64, 'uint16'),
    usLastCharIndex: DataBackedProperty(66, 'uint16'),
    sTypoAscender: DataBackedProperty(68, 'int16'),
    sTypoDescender: DataBackedProperty(70, 'int16'),
    sTypoLineGap: DataBackedProperty(72, 'int16'),
    usWinAscent: DataBackedProperty(74, 'uint16'),
    usWinDescent: DataBackedProperty(76, 'uint16'),
    ulCodePageRange1: DataBackedProperty(78, 'uint32'),
    ulCodePageRange2: DataBackedProperty(82, 'uint32'),
    sxHeight: DataBackedProperty(86, 'int16'),
    sCapHeight: DataBackedProperty(88, 'int16'),
    usDefaultChar: DataBackedProperty(90, 'uint16'),
    usBreakChar: DataBackedProperty(92, 'uint16'),
    usMaxContext: DataBackedProperty(94, 'uint16'),
    usLowerOpticalPointSize: DataBackedProperty(96, 'uint16'),
    usUpperOpticalPointSize: DataBackedProperty(98, 'uint16'),

    init: function(){
        FNTOpenTypeFontTableOS2.$super.initWithDataLength.call(this, 100);
        this.version = 5;
        this.usWeightClass = 400;
        this.usWidthClass = 5;
        this.usBreakChar = 0x20;
        this.usMaxContext = 3;
        this.usLowerOpticalPointSize = 0;
        this.usUpperOpticalPointSize = 0xFFFF;
    },

    setLineHeight: function(ascender, descender){
        this.sTypoAscender = ascender;
        this.sTypoDescender = descender;
        this.usWinAscent = ascender;
        this.usWinDescent = -descender;
    }
});

JSClass("FNTOpenTypeFontTableMaxp", FNTOpenTypeFontTable, {
    tag: 'maxp',

    majorVersion:           DataBackedProperty(0, 'uint16'),
    minorVersion:           DataBackedProperty(2, 'uint16'),
    numberOfGlyphs:         DataBackedProperty(4, 'uint16'),

    // Version 1 only
    maxPoints:              DataBackedProperty(6, 'uint16'),
    maxContours:            DataBackedProperty(8, 'uint16'),
    maxCompositePoints:     DataBackedProperty(10, 'uint16'),
    maxCompositeContours:   DataBackedProperty(12, 'uint16'),
    maxZones:               DataBackedProperty(14, 'uint16'),
    maxTwilightPoints:      DataBackedProperty(16, 'uint16'),
    maxStorage:             DataBackedProperty(18, 'uint16'),
    maxFunctionDefs:        DataBackedProperty(20, 'uint16'),
    maxInstructionDefs:     DataBackedProperty(22, 'uint16'),
    maxStackElements:       DataBackedProperty(24, 'uint16'),
    maxSizeOfInstructions:  DataBackedProperty(26, 'uint16'),
    maxComponentElements:   DataBackedProperty(28, 'uint16'),
    maxComponentDepth:      DataBackedProperty(30, 'uint16'),

    initVersion05: function(){
        FNTOpenTypeFontTableMaxp.$super.initWithDataLength.call(this, 6);
        this.majorVersion = 0;
        this.minorVersion = 0x5000;
        this.numberOfGlyphs = 0;
    },

    initVersion1: function(){
        FNTOpenTypeFontTableMaxp.$super.initWithDataLength.call(this, 32);
        this.majorVersion = 1;
        this.minorVersion = 0;
        this.numberOfGlyphs = 0;
    }
});

JSClass("FNTOpenTypeFontTablePost", FNTOpenTypeFontTable, {
    tag: 'post',

    majorVersion: DataBackedProperty(0, 'uint16'),
    minorVersion: DataBackedProperty(2, 'uint16'),
    italicAngleWhole: DataBackedProperty(4, 'int16'),
    italicAngleFraction: DataBackedProperty(6, 'uint16'),
    underlinePosition: DataBackedProperty(8, 'int16'),
    underlineThickness: DataBackedProperty(10, 'int16'),
    isFixedPitch: DataBackedProperty(12, 'uint32'),
    minMemType42: DataBackedProperty(16, 'uint32'),
    maxMemType42: DataBackedProperty(20, 'uint32'),
    minMemType1: DataBackedProperty(24, 'uint32'),
    maxMemType1: DataBackedProperty(28, 'uint32'),

    init: function(){
        FNTOpenTypeFontTableMaxp.$super.initWithDataLength.call(this, 32);
        this.majorVersion = 3;
        this.minorVersion = 0;
    }
});

JSClass("FNTOpenTypeFontTableCFF", FNTOpenTypeFontTable, {
    tag: 'CFF ',
});

var UnicodeConvertingCmap = function(unicodeMap, map){
    if (this === undefined){
        return new UnicodeConvertingCmap(unicodeMap, map);
    }
    this.unicodeMap = unicodeMap;
    this.map = map;
};

UnicodeConvertingCmap.prototype = {

    glyphForCharacterCode: function(code){
        if (code >= 128){
            code = this.unicodeMap[code] || 0;
        }
        return this.map.glyphForCharacterCode(code);
    },

    getUnicodeGlyphPairs: function(){
        var pairs = [];
        for (var i = 0; i < 128; ++i){
            pairs.push([i, this.map.glyphForCharacterCode(i)]);
        }
        for (var code in this.unicodeMap){
            pairs.push([parseInt(code), this.map.glyphForCharacterCode(this.unicodeMap[code])]);
        }
        return pairs;
    }

};

// From Unicode to Mac Roman encoding
var UnicodeToMacRoman = {
    196: 128,
    197: 129,
    199: 130,
    201: 131,
    209: 132,
    214: 133,
    220: 134,
    225: 135,
    224: 136,
    226: 137,
    228: 138,
    227: 139,
    229: 140,
    231: 141,
    233: 142,
    232: 143,
    234: 144,
    235: 145,
    237: 146,
    236: 147,
    238: 148,
    239: 149,
    241: 150,
    243: 151,
    242: 152,
    244: 153,
    246: 154,
    245: 155,
    250: 156,
    249: 157,
    251: 158,
    252: 159,
    8224: 160,
    176: 161,
    162: 162,
    163: 163,
    167: 164,
    8226: 165,
    182: 166,
    223: 167,
    174: 168,
    169: 169,
    8482: 170,
    180: 171,
    168: 172,
    8800: 173,
    198: 174,
    216: 175,
    8734: 176,
    177: 177,
    8804: 178,
    8805: 179,
    165: 180,
    181: 181,
    8706: 182,
    8721: 183,
    8719: 184,
    960: 185,
    8747: 186,
    170: 187,
    186: 188,
    937: 189,
    230: 190,
    248: 191,
    191: 192,
    161: 193,
    172: 194,
    8730: 195,
    402: 196,
    8776: 197,
    8710: 198,
    171: 199,
    187: 200,
    8230: 201,
    160: 202,
    192: 203,
    195: 204,
    213: 205,
    338: 206,
    339: 207,
    8211: 208,
    8212: 209,
    8220: 210,
    8221: 211,
    8216: 212,
    8217: 213,
    247: 214,
    9674: 215,
    255: 216,
    376: 217,
    8260: 218,
    8364: 219,
    8249: 220,
    8250: 221,
    64257: 222,
    64258: 223,
    8225: 224,
    183: 225,
    8218: 226,
    8222: 227,
    8240: 228,
    194: 229,
    202: 230,
    193: 231,
    203: 232,
    200: 233,
    205: 234,
    206: 235,
    207: 236,
    204: 237,
    211: 238,
    212: 239,
    63743: 240,
    210: 241,
    218: 242,
    219: 243,
    217: 244,
    305: 245,
    710: 246,
    732: 247,
    175: 248,
    728: 249,
    729: 250,
    730: 251,
    184: 252,
    733: 253,
    731: 254,
    711: 255
};

JSClass("FNTOpenTypeFontCmap", JSObject, {

    data: null,
    dataView: null,

    initWithVersion: function(version, data){
        switch (version){
            case 0:
                return FNTOpenTypeFontCmap0.initWithData(data);
            case 4:
                return FNTOpenTypeFontCmap4.initWithData(data);
            case 6:
                return FNTOpenTypeFontCmap6.initWithData(data);
            case 10:
                return FNTOpenTypeFontCmap10.initWithData(data);
            case 12:
                return FNTOpenTypeFontCmap12.initWithData(data);
            case 13:
                return FNTOpenTypeFontCmap13.initWithData(data);
        }
        return null;
    },

    initWithData: function(data){
        this.data = data;
        this.dataView = data.dataView();
    },

    glyphForCharacterCode: function(code){
    },

});

JSClass("FNTOpenTypeFontCmapNull", FNTOpenTypeFontCmap, {
    glyphForCharacterCode: function(code){
        return 0;
    }
});

// Format 0 is a simple 8 bit mapping
JSClass("FNTOpenTypeFontCmap0", FNTOpenTypeFontCmap, {

    format: DataBackedProperty(0, 'uint16'),
    length: DataBackedProperty(2, 'uint16'),
    language: DataBackedProperty(4, 'uint16'),

    glyphForCharacterCode: function(code){
        if (code > 255){
            return 0;
        }
        return this.dataView.getUint8(6 + code);
    },

    toString: function(){
        var lines = ["Version 0"];
        for (var i = 0; i < 256;){
            var line = [];
            for (var col = 0; col < 16; ++col, ++i){
                line.push("0x%04x".sprintf(this.glyphForCharacterCode(i)));
            }
            lines.push(line.join(" "));
        }
        return lines.join("\n");
    }

});


// Format 2 is for Asian languages on Mac. No need to support
// because fonts should have Unicode encoding 

// Format 4 is a set of sparse ranges with 16 bit values
JSClass("FNTOpenTypeFontCmap4", FNTOpenTypeFontCmap, {

    format: DataBackedProperty(0, 'uint16'),
    length: DataBackedProperty(2, 'uint16'),
    language: DataBackedProperty(4, 'uint16'),
    numberOfGroupsX2: DataBackedProperty(6, 'uint16'),
    searchRange: DataBackedProperty(8, 'uint16'),
    entrySelector: DataBackedProperty(10, 'uint16'),
    rangeShift: DataBackedProperty(12, 'uint16'),

    numberOfGroups: 0,
    endOffset: 14,
    startOffset: 0,
    idDeltaOffset: 0,
    idRangeOffset: 0,

    initWithUnicodeGlyphPairs: function(pairs){
        var i, l;
        var ranges = [];
        pairs.sort(function(a, b){
            return a[0] - b[0];
        });
        var lastCode = -2;
        var lastGlyph = -2;
        var range;
        var code, glyph;
        var delta;
        for (i = 0, l = pairs.length; i < l; ++i){
            code = pairs[i][0];
            glyph = pairs[i][1];
            if (code <= 0xFFFF && glyph !== 0){
                if (code == lastCode + 1 && glyph == lastGlyph + 1){
                    range.glyphs.push(glyph);
                }else{
                    delta = glyph - code;
                    if (delta <= -0x8000){
                        delta = 0xFFFF + delta;
                    }
                    range = {start: code, glyphs: [glyph], idDelta: delta};
                    ranges.push(range);
                }
                lastCode = code;
                lastGlyph = glyph;
            }
        }

        if (lastCode < 0xFFFF){
            ranges.push({start: 0xFFFF, glyphs: [0], idDelta: 1});
        }

        this.numberOfGroups = ranges.length;
        var length = 16 + 8 * this.numberOfGroups;
        var data = JSData.initWithLength(length);
        FNTOpenTypeFontCmap4.$super.initWithData.call(this, data);
        this.startOffset = this.endOffset + 2 * this.numberOfGroups + 2;
        this.idDeltaOffset = this.startOffset + 2 * this.numberOfGroups;
        this.idRangeOffset = this.idDeltaOffset + 2 * this.numberOfGroups;

        this.format = 4;
        this.length = length;
        this.language = 0;
        this.numberOfGroupsX2 = this.numberOfGroups * 2;
        // searchRange = 2 × (2**floor(log2(segCount)))
        //               2**(floor(log2(segCount)) + 1)
        //               2**(entrySelector + 1)
        // entrySelector = log2(searchRange/2)
        //                 log2(2**(floor(log2(segCount))))
        //                 floor(log2(segCount))
        // rangeShift = 2 × segCount - searchRange
        //
        this.entrySelector = log2(this.numberOfGroups);
        this.searchRange = 1 << (this.entrySelector + 1);
        this.rangeShift = 2 * this.numberOfGroups - this.searchRange;

        var endOffset = this.endOffset;
        var startOffset = this.startOffset;
        var idDeltaOffset = this.idDeltaOffset;
        var idRangeOffset = this.idRangeOffset;
        for (i = 0, l = ranges.length; i < l; ++i, endOffset += 2, startOffset += 2, idDeltaOffset += 2, idRangeOffset += 2){
            range = ranges[i];
            this.dataView.setUint16(endOffset, range.start + range.glyphs.length - 1);
            this.dataView.setUint16(startOffset, range.start);
            this.dataView.setInt16(idDeltaOffset, range.idDelta);
            this.dataView.setUint16(idRangeOffset, 0);
        }
    },

    initWithData: function(data){
        FNTOpenTypeFontCmap4.$super.initWithData.call(this, data);
        this.numberOfGroups = this.numberOfGroupsX2 / 2;
        this.startOffset = this.endOffset + 2 * this.numberOfGroups + 2;
        this.idDeltaOffset = this.startOffset + 2 * this.numberOfGroups;
        this.idRangeOffset = this.idDeltaOffset + 2 * this.numberOfGroups;
    },

    glyphForCharacterCode: function(code){
        var start;
        var end;
        var idDelta;
        var idRangeOffset;
        var min = 0;
        var max = this.numberOfGroups;
        var mid;
        var glyph;
        while (min < max){
            mid = min + Math.floor((max - min) / 2);
            start = this.dataView.getUint16(this.startOffset + 2 * mid);
            end = this.dataView.getUint16(this.endOffset + 2 * mid);
            if (code < start){
                max = mid;
            }else if (code > end){
                min = mid + 1;
            }else{
                idDelta = this.dataView.getInt16(this.idDeltaOffset + 2 * mid);
                idRangeOffset = this.dataView.getUint16(this.idRangeOffset + 2 * mid);
                if (idRangeOffset === 0){
                    return (code + idDelta) % 0xFFFF;
                }
                glyph = this.dataView.getUint16(this.idRangeOffset + 2 * mid + idRangeOffset + 2 * (code - start));
                if (glyph !== 0){
                    glyph = (glyph + idDelta) % 0xFFFF;
                }
                return glyph;
            }
        }
        return 0;
    },

    toString: function(){
        return "Version 4";
    }


});


// Format 6 is a simple mapping of contiguous 16 bit codes
JSClass("FNTOpenTypeFontCmap6", FNTOpenTypeFontCmap, {

    range: null,

    initWithData: function(data){
        FNTOpenTypeFontCmap6.$super.initWithData.call(this, data);
        this.range = JSRange(this.dataView.getUint16(6), this.dataView.getUint16(8));
    },

    glyphForCharacterCode: function(code){
        if (!this.range.contains(code)){
            return 0;
        }
        return this.dataView.getUint16(10 + 2 * (code - this.range.location));
    },

    toString: function(){
        return "Version 6\n[%d - %d]".sprintf(this.range.location, this.range.location + this.range.length - 1);
    }

});

// Format 8 is a mixed 16/32 bit mapping, but its use is discouraged
// and therefore we don't support it

// Format 10 is a simple mapping of contigugous 32 bit codes
JSClass("FNTOpenTypeFontCmap10", FNTOpenTypeFontCmap, {

    range: null,

    initWithData: function(data){
        FNTOpenTypeFontCmap10.$super.initWithData.call(this, data);
        this.range = JSRange(this.dataView.getUint32(12), this.dataView.getUint32(16));
    },

    glyphForCharacterCode10: function(code){
        if (!this.range.contains(code)){
            return 0;
        }
        return this.dataView.getUint16(20 + 2 * (code - this.range.location));
    },

    toString: function(){
        return "Version 10\n[%d - %d]".sprintf(this.range.location, this.range.location + this.range.length - 1);
    }

});


// Format 12 is a set of sparse ranges with 32 bit values
JSClass("FNTOpenTypeFontCmap12", FNTOpenTypeFontCmap, {

    format: DataBackedProperty(0, 'uint16'),
    length: DataBackedProperty(4, 'uint32'),
    language: DataBackedProperty(8, 'uint32'),
    numberOfGroups: DataBackedProperty(12, 'uint32'),

    groups: null,

    initWithUnicodeGlyphPairs: function(pairs){
        var i, l;
        var ranges = [];
        pairs.sort(function(a, b){
            return a[0] - b[0];
        });
        var lastCode = -2;
        var lastGlyph = -2;
        var range;
        var code, glyph;
        var delta;
        for (i = 0, l = pairs.length; i < l; ++i){
            code = pairs[i][0];
            glyph = pairs[i][1];
            if (glyph !== 0){
                if (code == lastCode + 1 && glyph == lastGlyph + 1){
                    range.end++;
                }else{
                    range = {start: code, glyph: glyph, end: code};
                    ranges.push(range);
                }
                lastCode = code;
                lastGlyph = glyph;
            }
        }

        this.initWithRanges(ranges);
    },

    initWithRanges: function(ranges){
        var length = 16 + 12 * ranges.length;
        var data = JSData.initWithLength(length);
        FNTOpenTypeFontCmap12.$super.initWithData.call(this, data);

        this.format = 12;
        this.length = length;
        this.language = 0;
        this.numberOfGroups = ranges.length;

        var offset = 16;
        var range;
        var i, l;
        for (i = 0, l = ranges.length; i < l; ++i, offset += 12){
            range = ranges[i];
            this.dataView.setUint32(offset, range.start);
            this.dataView.setUint32(offset + 4, range.end);
            this.dataView.setUint32(offset + 8, range.glyph);
        }
    },

    initWithData: function(data){
        FNTOpenTypeFontCmap12.$super.initWithData.call(this, data);
    },

    glyphForCharacterCode: function(code){
        var min = 0;
        var max = this.numberOfGroups;
        var mid;
        var start;
        var end;
        var i;
        while (min < max){
            mid = min + Math.floor((max - min) / 2);
            i = 16 + mid * 12;
            start = this.dataView.getUint32(i);
            end = this.dataView.getUint32(i + 4);
            if (code < start){
                max = mid;
            }else if (code > end){
                min = mid + 1;
            }else{
                return this.dataView.getUint32(i + 8) + (code - start);
            }
        }
        return 0;
    },

    toString: function(){
        return "Version 12";
    }

});

// Format 13 is nearly identical to 12, but the codes are interpreted
// directly rather than adding (code - start).  Apple uses this
// for its last resort font.
JSClass("FNTOpenTypeFontCmap13", FNTOpenTypeFontCmap, {

    numberOfGroups: 0,

    initWithData: function(data){
        FNTOpenTypeFontCmap13.$super.initWithData.call(this, data);
        this.numberOfGroups = this.dataView.getUint32(12);
    },

    glyphForCharacterCode: function(code){
        var min = 0;
        var max = this.numberOfGroups;
        var mid;
        var start;
        var end;
        var i;
        while (min < max){
            mid = min + Math.floor((max - min) / 2);
            i = 16 + mid * 12;
            start = this.dataView.getUint32(i);
            end = this.dataView.getUint32(i + 4);
            if (code < start){
                max = mid;
            }else if (code > end){
                min = mid + 1;
            }else{
                return this.dataView.getUint32(i + 8);
            }
        }
        return 0;
    },

    toString: function(){
        return "Version 13";
    }

});

Object.defineProperties(DataView.prototype, {

    getOTFFixed: function(offset){
        var whole = this.getUint16(offset);
        var frac = this.getUint16(offset + 2);
        return whole + frac / 0x10000;
    }

});

var log2 = function(n){
    if (n === 0){
        return -Infinity;
    }
    var i = 0;
    while (n > 1){
        n >>= 1;
        ++i;
    }
    return i;
};

})();