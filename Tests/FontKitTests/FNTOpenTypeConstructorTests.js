// #import "FontKit/FontKit.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, FNTOpenTypeFont, FNTOpenTypeConstructor, TKExpectation, UnicodeChar */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
'use strict';

JSClass("FNTOpenTypeConstructorTests", TKTestSuite, {

    testInitWithGlyphType: function(){
        var constructor = FNTOpenTypeConstructor.initWithGlyphType(FNTOpenTypeConstructor.GlyphType.trueType);
        TKAssertEquals(constructor.version, 0x00010000);
        TKAssertEquals(constructor.maxp.majorVersion, 1);
        TKAssertEquals(constructor.maxp.minorVersion, 0);

        constructor = FNTOpenTypeConstructor.initWithGlyphType(FNTOpenTypeConstructor.GlyphType.compactFontFormat);
        TKAssertEquals(constructor.version, 0x4F54544F);
        TKAssertEquals(constructor.maxp.majorVersion, 0);
        TKAssertEquals(constructor.maxp.minorVersion, 0x5000);
    },

    testGetData: function(){
        var constructor = FNTOpenTypeConstructor.initWithGlyphType(FNTOpenTypeConstructor.GlyphType.trueType);
        var expectation = TKExpectation.init();
        expectation.call(constructor.getData, constructor, function(data){
            TKAssertNotNull(data);
            var font = FNTOpenTypeFont.initWithData(data);
            var tags = Object.keys(font.tableIndex);
            TKAssertEquals(font.version, 0x00010000);
            TKAssertEquals(font.searchRange, 128);
            TKAssertEquals(font.entrySelector, 3);
            TKAssertEquals(font.rangeShift, 0);
            TKAssertEquals(tags.length, 8);
            TKAssertEquals(tags[0], 'head');
            TKAssertEquals(tags[1], 'OS/2');
            TKAssertEquals(tags[2], 'hhea');
            TKAssertEquals(tags[3], 'maxp');
            TKAssertEquals(tags[4], 'post');
            TKAssertEquals(tags[5], 'name');
            TKAssertEquals(tags[6], 'hmtx');
            TKAssertEquals(tags[7], 'cmap');
            for (var tag in font.tableIndex){
                TKAssertEquals(font.tableIndex[tag].offset % 4, 0, tag);
            }
            font.validateChecksums();
        });
        this.wait(expectation, 2.0);
    }

});