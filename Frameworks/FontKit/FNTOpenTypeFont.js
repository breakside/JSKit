// #import "Foundation/Foundation.js"
/* global JSClass, JSLazyInitProperty, JSReadOnlyProperty, JSCustomProperty, JSObject, JSData, JSRange, FNTOpenTypeFont, UnicodeChar */
/* global FNTOpenTypeFontTable, FNTOpenTypeFontTableHead, FNTOpenTypeFontTableName, FNTOpenTypeFontTableCmap, FNTOpenTypeFontTableHhea, FNTOpenTypeFontTableHmtx, FNTOpenTypeFontTableGlyf, FNTOpenTypeFontTableOS2, FNTOpenTypeFontTableLoca, FNTOpenTypeFontTableMaxp */
/* global FNTOpenTypeFontCmapNull, FNTOpenTypeFontCmap, FNTOpenTypeFontCmap0, FNTOpenTypeFontCmap4, FNTOpenTypeFontCmap6, FNTOpenTypeFontCmap10, FNTOpenTypeFontCmap12, FNTOpenTypeFontCmap13 */
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
        // 0x4F54544F - 'OTTO' - OpenType font
        // 0x00010000 - Reconized by Apple as a TrueType or OpenType Font; must be used for TrueType font in Windows or Adobe environments
        // 0x74727565 - 'true' - Recognized by Apple as a TrueType Font
        if (this.version != 0x00010000 && this.version != 0x4F54544F && this.version != 0x74727565){
            throw new Error("Invalid OTF version");
        }
        this.tableCount = this.dataView.getUint16(4);
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

    _defineTableProperty: function(tag, checksum, tableOffset, tableLength){
        var property = tag.trim();
        var font = this;
        Object.defineProperty(this.tables, property, {
            configurable: true,
            enumerable: true,
            get: function FNTOpenTypeFont_getTable(){
                var data = font.data.subdataInRange(JSRange(tableOffset, tableLength));
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
                if (sum != checksum){
                    throw new Error("Invalid checksum for %s table at 0x%08x".sprintf(tag, tableOffset));
                }
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

    initWithDataLengthh: function(length){
        this.data = JSData.initWithLength(length);
        this.dataView = this.data.dataView();
    },

    initWithData: function(data){
        this.data = data;
        this.dataView = data.dataView();
    },

    initWithTag: function(tag, font, data){
        var cls = FNTOpenTypeFontTable.ClassesByTag[tag] || FNTOpenTypeFontTable;
        return cls.initWithData(data, font);
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

var TableDataBackedProperty = function(offset, dataType){
    if (this === undefined){
        return new TableDataBackedProperty(offset, dataType);
    }else{
        this.offset = offset;
        this.dataType = dataType;
    }
};

TableDataBackedProperty.prototype = Object.create(JSCustomProperty.prototype);

TableDataBackedProperty.prototype.define = function(C, publicKey, extensions){
    var privateKey = "_" + publicKey;
    var upperType = this.dataType.ucFirst();
    var dataGetter = DataView.prototype['get' + upperType];
    var dataSetter = DataView.prototype['set' + upperType];
    var offset = this.offset;
    Object.defineProperty(this, privateKey, {writable: true, value: undefined});
    Object.defineProperty(C.prototype, publicKey, {
        get: function TableDataBackedProperty_get(){
            if (this[privateKey] === undefined){
                var value = dataGetter.call(this.dataView, offset);
                this[privateKey]=  value;
            }
            return this[privateKey];
        },
        set: function TableDataBackedProperty_set(value){
            dataSetter.call(this.dataView, offset, value);
            this[privateKey] = value;
        }
    });
};

JSClass("FNTOpenTypeFontTableHead", FNTOpenTypeFontTable, {
    tag: 'head',

    majorVersion:       TableDataBackedProperty(0, 'uint16'),
    minorVersion:       TableDataBackedProperty(2, 'uint16'),
    majorRevision:      TableDataBackedProperty(4, 'uint16'),
    minorRevision:      TableDataBackedProperty(6, 'uint16'),
    cheksumAdjustment:  TableDataBackedProperty(8, 'uint32'),
    magicNumber:        TableDataBackedProperty(12, 'uint32'),
    flags:              TableDataBackedProperty(16, 'uint16'),
    unitsPerEM:         TableDataBackedProperty(18, 'uint16'),
    createdHigh:        TableDataBackedProperty(20, 'uint32'),
    createdLow:         TableDataBackedProperty(24, 'uint32'),
    modifiedHigh:       TableDataBackedProperty(28, 'uint32'),
    modifiedLow:        TableDataBackedProperty(32, 'uint32'),
    xMin:               TableDataBackedProperty(36, 'int16'),
    yMin:               TableDataBackedProperty(38, 'int16'),
    xMax:               TableDataBackedProperty(40, 'int16'),
    yMax:               TableDataBackedProperty(42, 'int16'),
    macStyle:           TableDataBackedProperty(44, 'uint16'),
    lowestRecPPEM:      TableDataBackedProperty(46, 'uint16'),
    fontDirectionHint:  TableDataBackedProperty(48, 'int16'),
    indexToLocFormat:   TableDataBackedProperty(50, 'int16'),
    glyphDataFormat:    TableDataBackedProperty(52, 'int16'),

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

    setFileChecksum: function(sum){
        this.cheksumAdjustment = 0xB1B0AFBA - sum;
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

    format: TableDataBackedProperty(0, 'uint16'),
    count: TableDataBackedProperty(2, 'uint16'),
    stringsOffset: TableDataBackedProperty(4, 'uint16'),

    lookup: null,

    init: function(){
        FNTOpenTypeFontTableName.$super.initWithDataLength(this, 6);
        this.stringsOffset = 6;
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

    getName: function(){
        var preferences = Array.prototype.slice.call(arguments, 0);
        var key;
        var nameId;
        for (var i = 0, l = preferences.length; i < l; ++i){
            key = "%d:%d:%d".sprintf(preferences[i][0], preferences[i][1], preferences[i][2]);
            if (key in this.lookup){
                if (nameId in this.lookup[key]){
                    return this.lookup[key][nameId];
                }
            }
        }
        return null;
    }
});

JSClass("FNTOpenTypeFontTableHhea", FNTOpenTypeFontTable, {
    tag: 'hhea',

    majorVersion:           TableDataBackedProperty(0, 'uint16'),
    minorVersion:           TableDataBackedProperty(2, 'uint16'),
    ascender:               TableDataBackedProperty(4, 'int16'),
    descender:              TableDataBackedProperty(6, 'int16'),
    lineGap:                TableDataBackedProperty(8, 'int16'),
    advanceWidthMax:        TableDataBackedProperty(10, 'uint16'),
    minLeftSideBearing:     TableDataBackedProperty(12, 'int16'),
    minRightSideBearing:    TableDataBackedProperty(14, 'int16'),
    xMaxExtent:             TableDataBackedProperty(16, 'uint16'),
    caretSlopeRise:         TableDataBackedProperty(18, 'int16'),
    caretSlopeRun:          TableDataBackedProperty(20, 'int16'),
    caretOffset:            TableDataBackedProperty(22, 'int16'),
    reserved1:              TableDataBackedProperty(24, 'int16'),
    reserved2:              TableDataBackedProperty(26, 'int16'),
    reserved3:              TableDataBackedProperty(28, 'int16'),
    reserved4:              TableDataBackedProperty(30, 'int16'),
    metricDataFormat:       TableDataBackedProperty(32, 'int16'),
    numberOfHMetrics:       TableDataBackedProperty(34, 'uint16'),

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

    init: function(){
        FNTOpenTypeFontTableHmtx.$super.initWithDataLength(this, 0);
    },

    initWithData: function(data, font){
        FNTOpenTypeFontTableHmtx.$super.initWithData.call(this, data);
        this.widthCount = font.tables.hhea.longMetricsCount;
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
        this.data = JSData.initWithLength(widths * 4);
        this.dataView = this.data.dataView();
        var offset = 0;
        for (var i = 0, l = widths.length; i < l; ++i, offset += 4){
            this.dataView.setUint16(offset, widths[i]);
        }
    }
});

JSClass("FNTOpenTypeFontTableCmap", FNTOpenTypeFontTable, {
    tag: 'cmap',

    version:    TableDataBackedProperty(0, 'uint16'),
    count:      TableDataBackedProperty(2, 'uint16'),

    maps: null,

    init: function(){
        FNTOpenTypeFontTableCmap.$super.initWithDataLength.call(this, 4);
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
        var lastResort;
        for (var i = 0; i < this.count; ++i, offset += 8){
            platformId = this.dataView.getUint16(offset);
            specificId = this.dataView.getUint16(offset + 2);
            mapOffset = this.dataView.getUint32(offset + 4);
            this._defineMapProperty(platformId, specificId, mapOffset);
        }
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
                Object.defineProperty(this, key, {enumerable: true, value: map});
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
});

JSClass("FNTOpenTypeFontTableOS2", FNTOpenTypeFontTable, {
    tag: "OS/2",

    version: TableDataBackedProperty(0, 'uint16'),
    xAvgCharWidth: TableDataBackedProperty(2, 'int16'),
    usWeightClass: TableDataBackedProperty(4, 'uint16'),
    usWidthClass: TableDataBackedProperty(6, 'uint16'),
    fsType: TableDataBackedProperty(8, 'uint16'),
    ySubscriptXSize: TableDataBackedProperty(10, 'int16'),
    ySubscriptYSize: TableDataBackedProperty(12, 'int16'),
    ySubscriptXOffset: TableDataBackedProperty(14, 'int16'),
    ySubscriptYOffset: TableDataBackedProperty(16, 'int16'),
    ySuperscriptXSize: TableDataBackedProperty(18, 'int16'),
    ySuperscriptYSize: TableDataBackedProperty(20, 'int16'),
    ySuperscriptXOffset: TableDataBackedProperty(22, 'int16'),
    ySuperscriptYOffset: TableDataBackedProperty(24, 'int16'),
    yStrikeoutSize: TableDataBackedProperty(26, 'int16'),
    yStrikeoutPosition: TableDataBackedProperty(28, 'int16'),
    sFamilyClass: TableDataBackedProperty(30, 'int16'),
    panose0: TableDataBackedProperty(32, 'uint8'),
    panose1: TableDataBackedProperty(33, 'uint8'),
    panose2: TableDataBackedProperty(34, 'uint8'),
    panose3: TableDataBackedProperty(35, 'uint8'),
    panose4: TableDataBackedProperty(36, 'uint8'),
    panose5: TableDataBackedProperty(37, 'uint8'),
    panose6: TableDataBackedProperty(38, 'uint8'),
    panose7: TableDataBackedProperty(39, 'uint8'),
    panose8: TableDataBackedProperty(40, 'uint8'),
    panose9: TableDataBackedProperty(41, 'uint8'),
    ulUnicodeRange1: TableDataBackedProperty(42, 'uint32'),
    ulUnicodeRange2: TableDataBackedProperty(46, 'uint32'),
    ulUnicodeRange3: TableDataBackedProperty(50, 'uint32'),
    ulUnicodeRange4: TableDataBackedProperty(54, 'uint32'),
    achVendID: TableDataBackedProperty(58, 'uint32'),
    fsSelection: TableDataBackedProperty(62, 'uint16'),
    usFirstCharIndex: TableDataBackedProperty(64, 'uint16'),
    usLastCharIndex: TableDataBackedProperty(66, 'uint16'),
    sTypoAscender: TableDataBackedProperty(68, 'int16'),
    sTypoDescender: TableDataBackedProperty(70, 'int16'),
    sTypoLineGap: TableDataBackedProperty(72, 'int16'),
    usWinAscent: TableDataBackedProperty(74, 'uint16'),
    usWinDescent: TableDataBackedProperty(76, 'uint16'),
    ulCodePageRange1: TableDataBackedProperty(78, 'uint32'),
    ulCodePageRange2: TableDataBackedProperty(82, 'uint32'),
    sxHeight: TableDataBackedProperty(86, 'int16'),
    sCapHeight: TableDataBackedProperty(88, 'int16'),
    usDefaultChar: TableDataBackedProperty(90, 'uint16'),
    usBreakChar: TableDataBackedProperty(92, 'uint16'),
    usMaxContext: TableDataBackedProperty(94, 'uint16'),
    usLowerOpticalPointSize: TableDataBackedProperty(96, 'uint16'),
    usUpperOpticalPointSize: TableDataBackedProperty(98, 'uint16'),

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

    majorVersion:           TableDataBackedProperty(0, 'uint16'),
    minorVersion:           TableDataBackedProperty(2, 'uint16'),
    numberOfGlyphs:         TableDataBackedProperty(4, 'uint16'),

    // Version 1 only
    maxPoints:              TableDataBackedProperty(6, 'uint16'),
    maxContours:            TableDataBackedProperty(8, 'uint16'),
    maxCompositePoints:     TableDataBackedProperty(10, 'uint16'),
    maxCompositeContours:   TableDataBackedProperty(12, 'uint16'),
    maxZones:               TableDataBackedProperty(14, 'uint16'),
    maxTwilightPoints:      TableDataBackedProperty(16, 'uint16'),
    maxStorage:             TableDataBackedProperty(18, 'uint16'),
    maxFunctionDefs:        TableDataBackedProperty(20, 'uint16'),
    maxInstructionDefs:     TableDataBackedProperty(22, 'uint16'),
    maxStackElements:       TableDataBackedProperty(24, 'uint16'),
    maxSizeOfInstructions:  TableDataBackedProperty(26, 'uint16'),
    maxComponentElements:   TableDataBackedProperty(28, 'uint16'),
    maxComponentDepth:      TableDataBackedProperty(30, 'uint16'),

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

    majorVersion: TableDataBackedProperty(0, 'uint16'),
    minorVersion: TableDataBackedProperty(2, 'uint16'),
    italicAngleWhole: TableDataBackedProperty(4, 'int16'),
    italicAngleFraction: TableDataBackedProperty(6, 'uint16'),
    underlinePosition: TableDataBackedProperty(8, 'int16'),
    underlineThickness: TableDataBackedProperty(10, 'int16'),
    isFixedPitch: TableDataBackedProperty(12, 'uint32'),
    minMemType42: TableDataBackedProperty(16, 'uint32'),
    maxMemType42: TableDataBackedProperty(20, 'uint32'),
    minMemType1: TableDataBackedProperty(24, 'uint32'),
    maxMemType1: TableDataBackedProperty(28, 'uint32'),

    init: function(){
        FNTOpenTypeFontTableMaxp.$super.initWithDataLength.call(this, 6);
        this.majorVersion = 3;
        this.minorVersion = 0;
    }
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
        if (code > 128){
            code = this.unicodeMap[code] || 0;
        }
        return this.map.glyphForCharacterCode(code);
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

    numberOfGroups: 0,
    endOffset: 14,
    startOffset: 0,
    idDeltaOffset: 0,
    idRangeOffset: 0,

    initWithData: function(data){
        FNTOpenTypeFontCmap4.$super.initWithData.call(this, data);
        this.numberOfGroups = this.dataView.getUint16(6) / 2;
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
                return this.dataView.getUint16(this.idRangeOffset + 2 * mid + idRangeOffset + 2 * (code - start));
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

Object.droperties(DataView.prototype, {

    getOTFFixed: function(offset){
        var whole = this.getUint16(offset);
        var frac = this.getUint16(offset + 2);
        return whole + frac / 0x10000;
    }

});

})();