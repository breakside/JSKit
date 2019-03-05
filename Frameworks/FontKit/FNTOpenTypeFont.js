// #import "Foundation/Foundation.js"
/* global JSClass, JSLazyInitProperty, JSObject, JSRange, FNTOpenTypeFont, UnicodeChar */
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
                // var sum = tableChecksum(data);
                // if (sum != checksum){
                //     throw new Error("Invalid checksum for %s table at 0x%08x".sprintf(tag, tableOffset));
                // }
                var table = FNTOpenTypeFontTable.initWithTag(tag, font, data);
                Object.defineProperty(this, property, {enumerable: true, value: table});
                return table;
            }
        });
    },

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
    for (var offset = 0, l = data.length; offset < l; offset += 4){
        sum[0] += dataView.getUint32(offset);
    }
    return sum[0];
};

JSClass("FNTOpenTypeFontTable", JSObject, {

    tag: null,
    data: null,
    font: null,

    initWithData: function(font, data){
        this.font = font;
        this.data = data;
    },

    initWithTag: function(tag, font, data){
        var cls = FNTOpenTypeFontTable.ClassesByTag[tag] || FNTOpenTypeFontTable;
        return cls.initWithData(font, data);
    }
});

FNTOpenTypeFontTable.ClassesByTag = {};

FNTOpenTypeFontTable.$extend = function(extensions, name){
    var subclass = JSClass.prototype.$extend.call(this, extensions, name);
    this.ClassesByTag[extensions.tag] = subclass;
    return subclass;
};

JSClass("FNTOpenTypeFontTableHead", FNTOpenTypeFontTable, {

    tag: 'head',
    versionHigh: 0,
    revision: 0,
    checksumAdjustment: 0,
    magicNumber: 0,
    flags: 0,
    unitsPerEM: 0,

    initWithData: function(font, data){
        FNTOpenTypeFontTableHead.$super.initWithData.call(this, font, data);
        if (data.length < 20){
            throw new Error("head data not long enough");
        }
        var dataView = data.dataView();
        this.version = dataView.getUint32(0);
        this.revision = dataView.getUint32(4);
        this.checksumAdjustment = dataView.getUint32(8);
        this.magicNumber = dataView.getUint32(12);
        this.flags = dataView.getUint16(16);
        this.unitsPerEM = dataView.getUint16(18);
    }

});

JSClass("FNTOpenTypeFontTableName", FNTOpenTypeFontTable, {

    tag: 'name',
    lookup: null,

    initWithData: function(font, data){
        FNTOpenTypeFontTableName.$super.initWithData.call(this, font, data);
        if (data.length < 6){
            throw new Error("name data not long enough");
        }
        this.records = [];
        var dataView = data.dataView();
        var format = dataView.getUint16(0);
        var count = dataView.getUint16(2);
        var stringsOffset = dataView.getUint16(4);
        if (data.length < 6 + count * 12){
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
        for (var i = 0; i < count; ++i, offset += 12){
            platformId = dataView.getUint16(offset);
            encodingId = dataView.getUint16(offset + 2);
            languageId = dataView.getUint16(offset + 4);
            nameId = dataView.getUint16(offset + 6);
            stringLength = dataView.getUint16(offset + 8);
            stringOffset = dataView.getUint16(offset + 10);
            key = "%d:%d:%d".sprintf(platformId, encodingId, languageId);
            if (!(key in this.lookup)){
                this.lookup[key] = {};
            }
            this.lookup[key][nameId] = data.subdataInRange(JSRange(stringsOffset + stringOffset, stringLength));
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
    ascender: 0,
    descender: 0,
    longMetricsCount: 0,

    initWithData: function(font, data){
        FNTOpenTypeFontTableHhea.$super.initWithData.call(this, font, data);
        if (data.length < 36){
            throw new Error("hhea data not long enough");
        }
        var dataView = data.dataView();
        this.ascender = dataView.getInt16(4);
        this.descender = dataView.getInt16(6);
        this.longMetricsCount = dataView.getUint16(34);
    }

});

JSClass("FNTOpenTypeFontTableHmtx", FNTOpenTypeFontTable, {

    tag: 'hmtx',
    dataView: null,
    widthCount: 0,

    initWithData: function(font, data){
        FNTOpenTypeFontTableHmtx.$super.initWithData.call(this, font, data);
        this.widthCount = font.tables.hhea.longMetricsCount;
        this.dataView = data.dataView();
        if (data.length < this.widthCount * 4){
            throw new Error("hmtx length not enough");
        }
    },

    widthOfGlyph: function(glyphIndex){
        var offset = Math.min(glyphIndex, this.widthCount - 1) * 4;
        return this.dataView.getUint16(offset);
    }

});

JSClass("FNTOpenTypeFontTableCmap", FNTOpenTypeFontTable, {

    tag: 'cmap',
    maps: null,
    data: null,
    dataView: null,

    initWithData: function(font, data){
        FNTOpenTypeFontTableCmap.$super.initWithData.call(this, font, data);
        this.data = data;
        this.dataView = data.dataView();
        this.maps = {};
        var dataView = data.dataView();
        var count = dataView.getUint16(2);
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
        for (var i = 0; i < count; ++i, offset += 8){
            platformId = dataView.getUint16(offset);
            specificId = dataView.getUint16(offset + 2);
            mapOffset = dataView.getUint32(offset + 4);
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

JSClass("FNTOpenTypeFontTableOS2", FNTOpenTypeFontTable, {

    tag: 'OS/2',
    weight: 0,
    selection: 0,

    initWithData: function(font, data){
        FNTOpenTypeFontTableOS2.$super.initWithData.call(this, font, data);
        var dataView = data.dataView();
        this.weight = dataView.getUint16(4);
        this.selection = dataView.getUint16(62);
    },



});

JSClass("FNTOpenTypeFontTableLoca", FNTOpenTypeFontTable, {

    tag: 'loca',

    initWithData: function(font, data){
        FNTOpenTypeFontTableLoca.$super.initWithData.call(this, font, data);
    }

});

JSClass("FNTOpenTypeFontTableMaxp", FNTOpenTypeFontTable, {

    tag: 'maxp',

    initWithData: function(font, data){
        FNTOpenTypeFontTableMaxp.$super.initWithData.call(this, font, data);
    }

});

JSClass("FNTOpenTypeFontTableGlyf", FNTOpenTypeFontTable, {

    tag: 'glyf',

    initWithData: function(font, data){
        FNTOpenTypeFontTableGlyf.$super.initWithData.call(this, font, data);
    }

});

Object.defineProperties(DataView.prototype, {

    getOTFFixed: function(offset){
        var whole = this.getUint16(offset);
        var frac = this.getUint16(offset + 2);
        return whole + frac / 0x10000;
    }

});

})();