// #import "FontKit/FontKit.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, FNTCompactFontFormat, FNTOpenTypeFont, TKExpectation, UnicodeChar */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
'use strict';

JSClass("FNTCompactFontFormatTests", TKTestSuite, {

    testInit: function(){
        var expectation = TKExpectation.init();
        expectation.call(this.getResourceData, this, "T1_0", "cff", function(data){
            TKAssertNotNull(data);
            var font = FNTCompactFontFormat.initWithData(data);
            TKAssertNotNull(font);
            TKAssertEquals(font.majorVersion, 1);
            TKAssertEquals(font.minorVersion, 0);
            TKAssertEquals(font.numberOfFonts, 1);
            TKAssertEquals(font.name, "UMEYOP+HelveticaNeueLTStd-Roman");
            TKAssertNotNull(font.info);
            TKAssertEquals(font.info.FontMatrix.length, 6);
            TKAssertFloatEquals(font.info.FontMatrix[0], 0.001);
            TKAssertFloatEquals(font.info.FontMatrix[1], 0);
            TKAssertFloatEquals(font.info.FontMatrix[2], 0);
            TKAssertFloatEquals(font.info.FontMatrix[3], 0.001);
            TKAssertFloatEquals(font.info.FontMatrix[4], 0);
            TKAssertFloatEquals(font.info.FontMatrix[5], 0);
            TKAssertEquals(font.info.PostScript, "/FSType 4 def");
            TKAssertEquals(font.info.Weight, "Regular");
            TKAssertEquals(font.info.notice, "Copyright 1988, 1990, 1993, 2002 , 2003Adobe Systems Incorporated. All Rights Reserved. Helvetica is a Trademark of Heidelberger Druckmaschinen AG exclusively licensed through Linotype Library GmbH, and may be registered in certain jurisdictions.");
            TKAssertNotNull(font.private);
            TKAssertFloatEquals(font.private.BlueFuzz, 1);
            TKAssertFloatEquals(font.private.BlueScale, 0.039625);
            TKAssertEquals(font.private.BlueShift, 7);
            TKAssertFloatEquals(font.private.ExpansionFactor, 0.06);
            TKAssertNotNull(font.charStrings);
            TKAssertEquals(font.charStrings.count, 75);
        });
        this.wait(expectation, 2.0);
    },

    testGetGetOpenTypeData: function(){
        var expectation = TKExpectation.init();
        expectation.call(this.getResourceData, this, "T1_0", "cff", function(data){
            TKAssertNotNull(data);
            var font = FNTCompactFontFormat.initWithData(data);
            expectation.call(font.getOpenTypeData, font, function(otf){
                TKAssertNotNull(otf);
                var font = FNTOpenTypeFont.initWithData(otf);
                var tags = Object.keys(font.tableIndex);
                TKAssertEquals(font.version, 0x4F54544F);
                TKAssertEquals(font.searchRange, 128);
                TKAssertEquals(font.entrySelector, 3);
                TKAssertEquals(font.rangeShift, 16);
                TKAssertEquals(tags.length, 9);
                TKAssertEquals(tags[0], 'CFF ');
                TKAssertEquals(tags[1], 'OS/2');
                TKAssertEquals(tags[2], 'cmap');
                TKAssertEquals(tags[3], 'head');
                TKAssertEquals(tags[4], 'hhea');
                TKAssertEquals(tags[5], 'hmtx');
                TKAssertEquals(tags[6], 'maxp');
                TKAssertEquals(tags[7], 'name');
                TKAssertEquals(tags[8], 'post');
                var name = String.initWithData(font.tables.name.getName([1, 0, 0, 6]), String.Encoding.latin1);
                TKAssertEquals(name, "UMEYOP+HelveticaNeueLTStd-Roman");
                TKAssertEquals(font.tables.maxp.numberOfGlyphs, 75);
                TKAssertEquals(font.tables.hhea.numberOfHMetrics, 75);
                TKAssertObjectEquals(font.tables.CFF.data, data);
                TKAssertEquals(font.tables.hhea.ascender, 0);
                TKAssertEquals(font.tables.hhea.descender, 0);
                TKAssertEquals(font.tables.head.unitsPerEM, 1000);
                var glyph = font.glyphForCharacter(UnicodeChar(0));
                TKAssertEquals(glyph, 0);
                glyph = font.glyphForCharacter(UnicodeChar(1));
                TKAssertEquals(glyph, 0);
                glyph = font.glyphForCharacter(UnicodeChar(32));
                TKAssertEquals(glyph, 1);
                glyph = font.glyphForCharacter(UnicodeChar(33));
                TKAssertEquals(glyph, 0);
                glyph = font.glyphForCharacter(UnicodeChar(36));
                TKAssertEquals(glyph, 2);
                glyph = font.glyphForCharacter(UnicodeChar(37));
                TKAssertEquals(glyph, 0);
                glyph = font.glyphForCharacter(UnicodeChar(8217));
                TKAssertEquals(glyph, 3);
                glyph = font.glyphForCharacter(UnicodeChar(8218));
                TKAssertEquals(glyph, 4);
                glyph = font.glyphForCharacter(UnicodeChar(8219));
                TKAssertEquals(glyph, 5);
                glyph = font.glyphForCharacter(UnicodeChar(44));
                TKAssertEquals(glyph, 6);
                TKAssert(false, "width checks not written");
            });
        });
        this.wait(expectation, 2.0);
    }

});