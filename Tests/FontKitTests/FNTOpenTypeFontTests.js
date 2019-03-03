// #import "FontKit/FontKit.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, FNTOpenTypeFont, TKExpectation, UnicodeChar */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
'use strict';

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
            TKAssertEquals(os2.weight, 400);
            TKAssertEquals(os2.selection & 0x1, 0x0);
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
    }

});