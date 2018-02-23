// #import "Foundation/Foundation.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, JSTextTypesetter, JSTextTypesetterTestsFont, JSAttributedString, JSPoint, JSRange, JSLineBreakMode, JSTextAlignment, JSTextLine, JSTextRun, JSFont, JSFontDescriptor */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertThrows */
'use strict';

JSClass("JSTextTypesetterTests", TKTestSuite, {

    testSingleRunUnconstrainedLine: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.Font] = JSTextTypesetterTestsFont.init();
        var attributedString = JSAttributedString.initWithString('Testing 123', attributes);
        var typesetter = JSTextTypesetter.init();
        typesetter.attributedString = attributedString;
        var line = typesetter.createLine(JSPoint(3, 4), 0, JSRange(0, attributedString.string.length), JSLineBreakMode.CharacterWrap, JSTextAlignment.Left);
        TKAssertNotNull(line);
        TKAssert(line.isKindOfClass(JSTextLine));
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 11);
        TKAssertFloatEquals(line.origin.x, 3);
        TKAssertFloatEquals(line.origin.y, 4);
        TKAssertFloatEquals(line.size.width, 270);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssert(line.runs[0].isKindOfClass(JSTextRun));
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 11);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 270);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);

        // check that the passed range is respected
        line = typesetter.createLine(JSPoint(3, 4), 0, JSRange(2, 3), JSLineBreakMode.CharacterWrap, JSTextAlignment.Left);
        TKAssertNotNull(line);
        TKAssert(line.isKindOfClass(JSTextLine));
        TKAssertEquals(line.range.location, 2);
        TKAssertEquals(line.range.length, 3);
        TKAssertFloatEquals(line.origin.x, 3);
        TKAssertFloatEquals(line.origin.y, 4);
        TKAssertFloatEquals(line.size.width, 60);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssert(line.runs[0].isKindOfClass(JSTextRun));
        TKAssertEquals(line.runs[0].range.location, 2);
        TKAssertEquals(line.runs[0].range.length, 3);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 60);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
    },

    testSingleRunUnconstrainedLineWithNewline: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.Font] = JSTextTypesetterTestsFont.init();
        var attributedString = JSAttributedString.initWithString('Testing 123\nAnd more', attributes);
        var typesetter = JSTextTypesetter.init();
        typesetter.attributedString = attributedString;
        var line = typesetter.createLine(JSPoint.Zero, 0, JSRange(0, attributedString.string.length), JSLineBreakMode.CharacterWrap, JSTextAlignment.Left);
        TKAssertNotNull(line);
        TKAssert(line.isKindOfClass(JSTextLine));
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 12);
        TKAssertFloatEquals(line.origin.x, 0);
        TKAssertFloatEquals(line.origin.y, 0);
        TKAssertFloatEquals(line.size.width, 270);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssert(line.runs[0].isKindOfClass(JSTextRun));
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 12);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 270);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
    },

    testSingleRunConstrainedLineWithNewline: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.Font] = JSTextTypesetterTestsFont.init();
        var attributedString = JSAttributedString.initWithString('Testing 123\nAnd more', attributes);
        var typesetter = JSTextTypesetter.init();
        typesetter.attributedString = attributedString;
        var line = typesetter.createLine(JSPoint.Zero, 350, JSRange(0, attributedString.string.length), JSLineBreakMode.CharacterWrap, JSTextAlignment.Left);
        TKAssertNotNull(line);
        TKAssert(line.isKindOfClass(JSTextLine));
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 12);
        TKAssertFloatEquals(line.origin.x, 0);
        TKAssertFloatEquals(line.origin.y, 0);
        TKAssertFloatEquals(line.size.width, 350);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssert(line.runs[0].isKindOfClass(JSTextRun));
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 12);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 270);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);

        // break and size happen at same time
        line = typesetter.createLine(JSPoint.Zero, 270, JSRange(0, attributedString.string.length), JSLineBreakMode.CharacterWrap, JSTextAlignment.Left);
        TKAssertNotNull(line);
        TKAssert(line.isKindOfClass(JSTextLine));
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 12);
        TKAssertFloatEquals(line.origin.x, 0);
        TKAssertFloatEquals(line.origin.y, 0);
        TKAssertFloatEquals(line.size.width, 270);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssert(line.runs[0].isKindOfClass(JSTextRun));
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 12);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 270);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);

        // break is after a run change
        attributedString.addAttributeInRange(JSAttributedString.Attribute.Underline, true, JSRange(0, 11));
        typesetter.attributedString = attributedString;
        line = typesetter.createLine(JSPoint.Zero, 300, JSRange(0, attributedString.string.length), JSLineBreakMode.CharacterWrap, JSTextAlignment.Left);
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 12);
        TKAssertFloatEquals(line.size.width, 300);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 2);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 11);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 270);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
        TKAssertEquals(line.runs[1].range.location, 11);
        TKAssertEquals(line.runs[1].range.length, 1);
        TKAssertFloatEquals(line.runs[1].origin.x, 270);
        TKAssertFloatEquals(line.runs[1].origin.y, 0);
        TKAssertFloatEquals(line.runs[1].size.width, 0);
        TKAssertFloatEquals(line.runs[1].size.height, 16.40625);
    },

    testEmptyUnconstrainedLine: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.Font] = JSTextTypesetterTestsFont.init();
        var attributedString = JSAttributedString.initWithString('', attributes);
        var typesetter = JSTextTypesetter.init();
        typesetter.attributedString = attributedString;
        var line = typesetter.createLine(JSPoint(3, 4), 0, JSRange(0, attributedString.string.length), JSLineBreakMode.CharacterWrap, JSTextAlignment.Left);
        TKAssertNotNull(line);
        TKAssert(line.isKindOfClass(JSTextLine));
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 0);
        TKAssertFloatEquals(line.origin.x, 3);
        TKAssertFloatEquals(line.origin.y, 4);
        TKAssertFloatEquals(line.size.width, 0);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssert(line.runs[0].isKindOfClass(JSTextRun));
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 0);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 0);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
    },

    testWhitespaceUnconstrainedLine: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.Font] = JSTextTypesetterTestsFont.init();
        var attributedString = JSAttributedString.initWithString('    ', attributes);
        var typesetter = JSTextTypesetter.init();
        typesetter.attributedString = attributedString;
        var line = typesetter.createLine(JSPoint(3, 4), 0, JSRange(0, attributedString.string.length), JSLineBreakMode.CharacterWrap, JSTextAlignment.Left);
        TKAssertNotNull(line);
        TKAssert(line.isKindOfClass(JSTextLine));
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 4);
        TKAssertFloatEquals(line.origin.x, 3);
        TKAssertFloatEquals(line.origin.y, 4);
        TKAssertFloatEquals(line.size.width, 120);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssert(line.runs[0].isKindOfClass(JSTextRun));
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 4);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 120);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
    },

    testNewlineUnconstrainedLine: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.Font] = JSTextTypesetterTestsFont.init();
        var attributedString = JSAttributedString.initWithString('\n', attributes);
        var typesetter = JSTextTypesetter.init();
        typesetter.attributedString = attributedString;
        var line = typesetter.createLine(JSPoint(3, 4), 0, JSRange(0, attributedString.string.length), JSLineBreakMode.CharacterWrap, JSTextAlignment.Left);
        TKAssertNotNull(line);
        TKAssert(line.isKindOfClass(JSTextLine));
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 1);
        TKAssertFloatEquals(line.origin.x, 3);
        TKAssertFloatEquals(line.origin.y, 4);
        TKAssertFloatEquals(line.size.width, 0);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssert(line.runs[0].isKindOfClass(JSTextRun));
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 1);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 0);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
    },

    testEmptyConstrainedLine: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.Font] = JSTextTypesetterTestsFont.init();
        var attributedString = JSAttributedString.initWithString('', attributes);
        var typesetter = JSTextTypesetter.init();
        typesetter.attributedString = attributedString;
        var line = typesetter.createLine(JSPoint(3, 4), 100, JSRange(0, attributedString.string.length), JSLineBreakMode.CharacterWrap, JSTextAlignment.Left);
        TKAssertNotNull(line);
        TKAssert(line.isKindOfClass(JSTextLine));
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 0);
        TKAssertFloatEquals(line.origin.x, 3);
        TKAssertFloatEquals(line.origin.y, 4);
        TKAssertFloatEquals(line.size.width, 100);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssert(line.runs[0].isKindOfClass(JSTextRun));
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 0);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 0);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
    },

    testWhitespaceConstrainedLine: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.Font] = JSTextTypesetterTestsFont.init();
        var attributedString = JSAttributedString.initWithString('    ', attributes);
        var typesetter = JSTextTypesetter.init();
        typesetter.attributedString = attributedString;
        var line = typesetter.createLine(JSPoint(3, 4), 100, JSRange(0, attributedString.string.length), JSLineBreakMode.CharacterWrap, JSTextAlignment.Left);
        TKAssertNotNull(line);
        TKAssert(line.isKindOfClass(JSTextLine));
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 4);
        TKAssertFloatEquals(line.origin.x, 3);
        TKAssertFloatEquals(line.origin.y, 4);
        TKAssertFloatEquals(line.size.width, 100);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssert(line.runs[0].isKindOfClass(JSTextRun));
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 4);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 90);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
    },

    testNewlineConstrainedLine: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.Font] = JSTextTypesetterTestsFont.init();
        var attributedString = JSAttributedString.initWithString('\n', attributes);
        var typesetter = JSTextTypesetter.init();
        typesetter.attributedString = attributedString;
        var line = typesetter.createLine(JSPoint(3, 4), 100, JSRange(0, attributedString.string.length), JSLineBreakMode.CharacterWrap, JSTextAlignment.Left);
        TKAssertNotNull(line);
        TKAssert(line.isKindOfClass(JSTextLine));
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 1);
        TKAssertFloatEquals(line.origin.x, 3);
        TKAssertFloatEquals(line.origin.y, 4);
        TKAssertFloatEquals(line.size.width, 100);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssert(line.runs[0].isKindOfClass(JSTextRun));
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 1);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 0);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
    },

    testCharacterWrapping: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.Font] = JSTextTypesetterTestsFont.init();
        var attributedString = JSAttributedString.initWithString('Testing 123', attributes);
        var typesetter = JSTextTypesetter.init();
        typesetter.attributedString = attributedString;
        var line = typesetter.createLine(JSPoint.Zero, 100, JSRange(0, attributedString.string.length), JSLineBreakMode.CharacterWrap, JSTextAlignment.Left);
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 4);
        TKAssertFloatEquals(line.size.width, 100);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 4);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 90);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);

        // Too narrow for even a single character
        line = typesetter.createLine(JSPoint.Zero, 10, JSRange(0, attributedString.string.length), JSLineBreakMode.CharacterWrap, JSTextAlignment.Left);
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 0);
        TKAssertFloatEquals(line.size.width, 10);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssert(line.runs[0].isKindOfClass(JSTextRun));
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 0);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 0);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
    },

    testRightAlign: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.Font] = JSTextTypesetterTestsFont.init();
        var attributedString = JSAttributedString.initWithString('Testing 123', attributes);
        var typesetter = JSTextTypesetter.init();
        typesetter.attributedString = attributedString;
        var line = typesetter.createLine(JSPoint.Zero, 100, JSRange(0, attributedString.string.length), JSLineBreakMode.CharacterWrap, JSTextAlignment.Right);
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 4);
        TKAssertFloatEquals(line.size.width, 100);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 4);
        TKAssertFloatEquals(line.runs[0].origin.x, 10);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 90);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
    },

    testCenterAlign: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.Font] = JSTextTypesetterTestsFont.init();
        var attributedString = JSAttributedString.initWithString('Testing 123', attributes);
        var typesetter = JSTextTypesetter.init();
        typesetter.attributedString = attributedString;
        var line = typesetter.createLine(JSPoint.Zero, 100, JSRange(0, attributedString.string.length), JSLineBreakMode.CharacterWrap, JSTextAlignment.Center);
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 4);
        TKAssertFloatEquals(line.size.width, 100);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 4);
        TKAssertFloatEquals(line.runs[0].origin.x, 5);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 90);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
    },

    testWordWrapping: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.Font] = JSTextTypesetterTestsFont.init();
        var attributedString = JSAttributedString.initWithString('Testing 123', attributes);
        var typesetter = JSTextTypesetter.init();
        typesetter.attributedString = attributedString;
        var line = typesetter.createLine(JSPoint.Zero, 230, JSRange(0, attributedString.string.length), JSLineBreakMode.WordWrap, JSTextAlignment.Left);
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 8);
        TKAssertFloatEquals(line.size.width, 230);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 8);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 180);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);

        // not wide enough for whitespace
        line = typesetter.createLine(JSPoint.Zero, 170, JSRange(0, attributedString.string.length), JSLineBreakMode.WordWrap, JSTextAlignment.Left);
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 8);
        TKAssertFloatEquals(line.size.width, 170);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 8);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 150);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);

        // Too narrow for even a single word, should fall back to character wrapping
        line = typesetter.createLine(JSPoint.Zero, 100, JSRange(0, attributedString.string.length), JSLineBreakMode.WordWrap, JSTextAlignment.Left);
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 4);
        TKAssertFloatEquals(line.size.width, 100);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 4);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 90);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);

        // Too narrow for even a single character
        line = typesetter.createLine(JSPoint.Zero, 10, JSRange(0, attributedString.string.length), JSLineBreakMode.WordWrap, JSTextAlignment.Left);
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 0);
        TKAssertFloatEquals(line.size.width, 10);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssert(line.runs[0].isKindOfClass(JSTextRun));
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 0);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 0);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
    },

    testWhitespaceAtEndOfLine: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.Font] = JSTextTypesetterTestsFont.init();
        var attributedString = JSAttributedString.initWithString('Testing          123', attributes);
        var typesetter = JSTextTypesetter.init();
        typesetter.attributedString = attributedString;
        var line = typesetter.createLine(JSPoint.Zero, 230, JSRange(0, attributedString.string.length), JSLineBreakMode.WordWrap, JSTextAlignment.Left);
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 17);
        TKAssertFloatEquals(line.size.width, 230);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 17);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 210);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);

        // end of line whitespace split by an attribute run change
        attributedString.addAttributeInRange(JSAttributedString.Attribute.Underline, true, JSRange(0, 12));
        typesetter.attributedString = attributedString;
        line = typesetter.createLine(JSPoint.Zero, 230, JSRange(0, attributedString.string.length), JSLineBreakMode.WordWrap, JSTextAlignment.Left);
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 17);
        TKAssertFloatEquals(line.size.width, 230);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 2);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 12);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 210);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
        TKAssertEquals(line.runs[1].range.location, 12);
        TKAssertEquals(line.runs[1].range.length, 5);
        TKAssertFloatEquals(line.runs[1].origin.x, 210);
        TKAssertFloatEquals(line.runs[1].origin.y, 0);
        TKAssertFloatEquals(line.runs[1].size.width, 0);
        TKAssertFloatEquals(line.runs[1].size.height, 16.40625);
    },

    testTruncation: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.Font] = JSTextTypesetterTestsFont.init();
        var attributedString = JSAttributedString.initWithString('Testing 123', attributes);
        var typesetter = JSTextTypesetter.init();
        typesetter.attributedString = attributedString;
        var line = typesetter.createLine(JSPoint.Zero, 230, JSRange(0, attributedString.string.length), JSLineBreakMode.TruncateTail, JSTextAlignment.Left);
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 9);
        TKAssertFloatEquals(line.size.width, 230);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 9);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 220);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);

        // character fits, but needs to be removed for ellipsis
        line = typesetter.createLine(JSPoint.Zero, 240, JSRange(0, attributedString.string.length), JSLineBreakMode.TruncateTail, JSTextAlignment.Left);
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 9);
        TKAssertFloatEquals(line.size.width, 240);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 9);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 220);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);

        // no room for a character, but room for ellipsis
        line = typesetter.createLine(JSPoint.Zero, 15, JSRange(0, attributedString.string.length), JSLineBreakMode.TruncateTail, JSTextAlignment.Left);
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 0);
        TKAssertFloatEquals(line.size.width, 15);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 0);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 10);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);

        // no room for ellipsis
        line = typesetter.createLine(JSPoint.Zero, 5, JSRange(0, attributedString.string.length), JSLineBreakMode.TruncateTail, JSTextAlignment.Left);
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 0);
        TKAssertFloatEquals(line.size.width, 5);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssert(line.runs[0].isKindOfClass(JSTextRun));
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 0);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 0);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);

        // preserve trailing whitespace
        line = typesetter.createLine(JSPoint.Zero, 200, JSRange(0, attributedString.string.length), JSLineBreakMode.TruncateTail, JSTextAlignment.Left);
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 8);
        TKAssertFloatEquals(line.size.width, 200);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 8);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 190);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);

        // truncation at run change
        attributedString.addAttributeInRange(JSAttributedString.Attribute.Underline, true, JSRange(0, 4));
        typesetter.attributedString = attributedString;
        line = typesetter.createLine(JSPoint.Zero, 90, JSRange(0, attributedString.string.length), JSLineBreakMode.TruncateTail, JSTextAlignment.Left);
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 3);
        TKAssertFloatEquals(line.size.width, 90);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 3);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 80);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);

        // truncation after run change (first char of new run doesn't fit)
        attributedString.addAttributeInRange(JSAttributedString.Attribute.Underline, true, JSRange(0, 4));
        typesetter.attributedString = attributedString;
        line = typesetter.createLine(JSPoint.Zero, 100, JSRange(0, attributedString.string.length), JSLineBreakMode.TruncateTail, JSTextAlignment.Left);
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 4);
        TKAssertFloatEquals(line.size.width, 100);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 4);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 100);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);

        // truncation after run change (first char of new run fits, but ellipsis should take on style of old run)
        attributedString.addAttributeInRange(JSAttributedString.Attribute.Underline, true, JSRange(0, 4));
        typesetter.attributedString = attributedString;
        line = typesetter.createLine(JSPoint.Zero, 110, JSRange(0, attributedString.string.length), JSLineBreakMode.TruncateTail, JSTextAlignment.Left);
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 4);
        TKAssertFloatEquals(line.size.width, 110);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 4);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 100);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
    }

    // TODO: more multi-run tests
    // TODO: attachments
    // TODO: fallback fonts
    // TODO: non whitespace word breaks (unicode)
    // TODO: non 0x20 whitespace (unicode)
    // TODO: non 0x0A new lines (unicode)
    // TODO: combining marks (unicode)

});

JSClass("JSTextTypesetterTestsFont", JSFont, {

    init: function(){
        this._descriptor = JSFontDescriptor.initWithProperties("JSTextTypesetterTestsFont", JSFont.Weight.Regular, JSFont.Style.Normal);
        this._fullName = "JSTextTypesetterTestsFont";
        this._postScriptName = "JSTextTypesetterTestsFont";
        this._faceName = "JSTextTypesetterTestsFont";
        this._unitsPerEM = 2048;
        this._ascenderInUnits = 1900;
        this._descenderInUnits = -500;
        this._pointSize = 14.0;
        this._calculateMetrics();
    },

    containsGlyphForCharacter: function(character){
        return true;
    },

    widthOfCharacter: function(character){
        if (character.code == 0x2026){ // ellipsis
            return 10;
        }
        if (character.code == 0x200B){ // zero-width space
            return 0;
        }
        if (character.code >= 0x61){
            return 20;
        }
        return 30;
    }
});