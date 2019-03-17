// #import "FontKit/FontKit.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, JSRange, FNTOpenTypeFont, TKExpectation, UnicodeChar */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
'use strict';

(function(){

JSClass("FNTOpenTypeFontTests", TKTestSuite, {

    testRoboto: function(){
        var expectation = TKExpectation.init();
        expectation.call(this.getResourceData, this, "Roboto-Regular", "ttf", function(data){
            TKAssertNotNull(data);
            var font = FNTOpenTypeFont.initWithData(data);
            var head = font.tables.head;
            TKAssertNotUndefined(head);
            TKAssertEquals(head.unitsPerEM, 2048);
            var hhea = font.tables.hhea;
            TKAssertNotUndefined(hhea);
            TKAssertEquals(hhea.ascender, 1900);
            TKAssertEquals(hhea.descender, -500);
            var os2 = font.tables['OS/2'];
            TKAssertNotUndefined(os2);
            TKAssertEquals(os2.usWeightClass, 400);
            TKAssertEquals(os2.fsSelection & 0x1, 0x0);
            var name = String.initWithData(font.tables.name.getName([3, 1, 1033, 1]), String.Encoding.utf16be);
            TKAssertEquals(name, "Roboto");
            name =  String.initWithData(font.tables.name.getName([3, 1, 1033, 4]), String.Encoding.utf16be);
            TKAssertEquals(name, "Roboto");
            name =  String.initWithData(font.tables.name.getName([3, 1, 1033, 6]), String.Encoding.utf16be);
            TKAssertEquals(name, "Roboto-Regular");
        });
        this.wait(expectation, 2);
    },

    testCmap: function(){
        var expectation = TKExpectation.init();
        expectation.call(this.getResourceData, this, "Roboto-Regular", "ttf", function(data){
            TKAssertNotNull(data);
            var font = FNTOpenTypeFont.initWithData(data);
            // ASCII
            var glyph = font.glyphForCharacter(UnicodeChar(0x20));
            TKAssertEquals(glyph, 4);
            glyph = font.glyphForCharacter(UnicodeChar(0x41));
            TKAssertEquals(glyph, 37);
            // Others
            glyph = font.glyphForCharacter(UnicodeChar(0x400));
            TKAssertEquals(glyph, 945);
            // Missing
            glyph = font.glyphForCharacter(UnicodeChar(0xabcd));
            TKAssertEquals(glyph, 0);
        });
        this.wait(expectation, 2);
    },

    testWidths: function(){
        var expectation = TKExpectation.init();
        expectation.call(this.getResourceData, this, "Roboto-Regular", "ttf", function(data){
            TKAssertNotNull(data);
            var font = FNTOpenTypeFont.initWithData(data);
            // ASCII
            var width = font.widthOfGlyph(4);
            TKAssertFloatEquals(width, 507/2048);
            width = font.widthOfGlyph(37);
            TKAssertFloatEquals(width, 1336/2048);
            // Others
            width = font.widthOfGlyph(945);
            TKAssertFloatEquals(width, 1164/2048);
        });
        this.wait(expectation, 2);
    },

    testGetCorrectedFont: function(){
        var expectation = TKExpectation.init();
        expectation.call(this.getResourceData, this, "TT1", "ttf", function(data){
            TKAssertNotNull(data);
            var font1 = FNTOpenTypeFont.initWithData(data);
            TKAssert(!('OS/2' in font1.tableIndex));
            TKAssert(!('post' in font1.tableIndex));
            var cmap = font1.tables.cmap.getMap([0, 3], [3, 10], [3, 1]);
            TKAssertNull(cmap);
            TKAssertEquals(font1.searchRange, 128);
            TKAssertEquals(font1.entrySelector, 4);
            TKAssertEquals(font1.rangeShift, 64);
            expectation.call(font1.getCorrectedFont, font1, function(font2){
                TKAssertNotNull(font2);
                font2.validateChecksums();
                TKAssertEquals(font2.version, 0x00010000);
                TKAssertEquals(font2.searchRange, 128);
                TKAssertEquals(font2.entrySelector, 3);
                TKAssertEquals(font2.rangeShift, 80);
                TKAssertLessThan(font2.tableIndex.maxp.offset, font2.tableIndex.head.offset);
                TKAssertLessThan(font2.tableIndex.head.offset, font2.tableIndex.hhea.offset);
                TKAssertLessThan(font2.tableIndex.hhea.offset, font2.tableIndex.prep.offset);
                TKAssertLessThan(font2.tableIndex.prep.offset, font2.tableIndex['cvt '].offset);
                TKAssertLessThan(font2.tableIndex['cvt '].offset, font2.tableIndex.fpgm.offset);
                TKAssertLessThan(font2.tableIndex.fpgm.offset, font2.tableIndex.hmtx.offset);
                TKAssertLessThan(font2.tableIndex.hmtx.offset, font2.tableIndex.cmap.offset);
                TKAssertLessThan(font2.tableIndex.cmap.offset, font2.tableIndex.loca.offset);
                TKAssertLessThan(font2.tableIndex.loca.offset, font2.tableIndex.glyf.offset);
                TKAssertLessThan(font2.tableIndex.glyf.offset, font2.tableIndex.post.offset);
                TKAssert('OS/2' in font2.tableIndex);
                TKAssert('post' in font2.tableIndex);
                TKAssertLessThan(font2.tableIndex.name.offset, font2.tableIndex['OS/2'].offset);
                TKAssertObjectEquals(font1.tables.cvt.data, font2.tables.cvt.data);
                TKAssertObjectEquals(font1.tables.fpgm.data, font2.tables.fpgm.data);
                TKAssertObjectEquals(font1.tables.glyf.data, font2.tables.glyf.data);
                TKAssertObjectEquals(font1.tables.head.data.subdataInRange(JSRange(0, 8)), font2.tables.head.data.subdataInRange(JSRange(0, 8)));
                TKAssertObjectEquals(font1.tables.head.data.subdataInRange(JSRange(12, 42)), font2.tables.head.data.subdataInRange(JSRange(12, 42)));
                TKAssertObjectEquals(font1.tables.hhea.data, font2.tables.hhea.data);
                TKAssertObjectEquals(font1.tables.hmtx.data, font2.tables.hmtx.data);
                TKAssertObjectEquals(font1.tables.loca.data, font2.tables.loca.data);
                TKAssertObjectEquals(font1.tables.maxp.data, font2.tables.maxp.data);
                TKAssertObjectEquals(font1.tables.prep.data, font2.tables.prep.data);
                TKAssertObjectEquals(font1.tables.name.data, font2.tables.name.data);
                for (var tag in font2.tableIndex){
                    TKAssertEquals(font2.tableIndex[tag].offset % 4, 0, tag);
                }
                var cmap1 = font1.tables.cmap.getMap([1, 0]);
                var cmap2 = font2.tables.cmap.getMap([1, 0]);
                TKAssertNotNull(cmap1);
                TKAssertNotNull(cmap2);
                TKAssertObjectEquals(cmap1.data, cmap2.data);
                var cmap = font2.tables.cmap.getMap([0, 3], [3, 10], [3, 1]);
                TKAssertNotNull(cmap);
                var glyph1;
                var glyph2;
                for (var i = 0; i < 128; ++i){
                    glyph1 = font1.glyphForCharacter(UnicodeChar(i));
                    glyph2 = font2.glyphForCharacter(UnicodeChar(i));
                    TKAssertEquals(glyph1, glyph2, "ASCII %d".sprintf(i));
                }
                for (var code in UnicodeToMacRoman){
                    code = parseInt(code);
                    glyph1 = font1.glyphForCharacter(UnicodeChar(code));
                    glyph2 = font2.glyphForCharacter(UnicodeChar(code));
                    TKAssertEquals(glyph1, glyph2, "Unicode %d".sprintf(code));
                }
            });
        });
        this.wait(expectation, 2);
    },

    testGetCorrectedIdentity: function(){
        var expectation = TKExpectation.init();
        expectation.call(this.getResourceData, this, "Roboto-Regular", "ttf", function(data){
            TKAssertNotNull(data);
            var font1 = FNTOpenTypeFont.initWithData(data);
            expectation.call(font1.getCorrectedFont, font1, function(font2){
                TKAssertNotNull(font2);
                TKAssertExactEquals(font1, font2);
            });
        });
        this.wait(expectation, 2);
    }

});

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

})();