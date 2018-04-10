// #import "Foundation/Foundation.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, JSTextTypesetter, JSTextTypesetterTestsFont, JSTextTypesetterTestsFont2, JSTextTypesetterTestsFont3, JSAttributedString, JSPoint, JSRange, JSLineBreakMode, JSTextAlignment, JSTextLine, JSTextRun, JSFont, JSFontDescriptor, JSImage, JSTextAttachment */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertThrows */
'use strict';

JSClass("JSTextTypesetterTests", TKTestSuite, {

    testCreateLineSingleRun: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.font] = JSTextTypesetterTestsFont.init();
        var attributedString = JSAttributedString.initWithString('Testing 123', attributes);
        var typesetter = JSTextTypesetter.init();
        typesetter.attributedString = attributedString;
        var line = typesetter.createLine(JSRange(0, attributedString.string.length));
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 11);
        TKAssertEquals(line.size.width, 270);
        TKAssertEquals(line.size.height, 16.40625);
        TKAssertEquals(line.trailingWhitespaceWidth, 0);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 11);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 270);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);

        // partial range
        line = typesetter.createLine(JSRange(3, 6));
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 3);
        TKAssertEquals(line.range.length, 6);
        TKAssertEquals(line.size.width, 140);
        TKAssertEquals(line.size.height, 16.40625);
        TKAssertEquals(line.trailingWhitespaceWidth, 0);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 3);
        TKAssertEquals(line.runs[0].range.length, 6);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 140);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
    },

    testCreateLineMultipleRun: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.font] = JSTextTypesetterTestsFont.init();
        var attributedString = JSAttributedString.initWithString('Testing 123', attributes);
        attributedString.addAttributeInRange('underline', true, JSRange(3, 6));
        var typesetter = JSTextTypesetter.init();
        typesetter.attributedString = attributedString;
        var line = typesetter.createLine(JSRange(0, attributedString.string.length));
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 11);
        TKAssertEquals(line.size.width, 270);
        TKAssertEquals(line.size.height, 16.40625);
        TKAssertEquals(line.trailingWhitespaceWidth, 0);
        TKAssertEquals(line.runs.length, 3);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 3);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 70);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
        TKAssertEquals(line.runs[1].range.location, 3);
        TKAssertEquals(line.runs[1].range.length, 6);
        TKAssertFloatEquals(line.runs[1].origin.x, 70);
        TKAssertFloatEquals(line.runs[1].origin.y, 0);
        TKAssertFloatEquals(line.runs[1].size.width, 140);
        TKAssertFloatEquals(line.runs[1].size.height, 16.40625);
        TKAssertEquals(line.runs[2].range.location, 9);
        TKAssertEquals(line.runs[2].range.length, 2);
        TKAssertFloatEquals(line.runs[2].origin.x, 210);
        TKAssertFloatEquals(line.runs[2].origin.y, 0);
        TKAssertFloatEquals(line.runs[2].size.width, 60);
        TKAssertFloatEquals(line.runs[2].size.height, 16.40625);

        // partial range
        line = typesetter.createLine(JSRange(4, 6));
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 4);
        TKAssertEquals(line.range.length, 6);
        TKAssertEquals(line.size.width, 150);
        TKAssertEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 2);
        TKAssertEquals(line.runs[0].range.location, 4);
        TKAssertEquals(line.runs[0].range.length, 5);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 120);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
        TKAssertEquals(line.runs[1].range.location, 9);
        TKAssertEquals(line.runs[1].range.length, 1);
        TKAssertFloatEquals(line.runs[1].origin.x, 120);
        TKAssertFloatEquals(line.runs[1].origin.y, 0);
        TKAssertFloatEquals(line.runs[1].size.width, 30);
        TKAssertFloatEquals(line.runs[1].size.height, 16.40625);
    },

    testCreateLineEmpty: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.font] = JSTextTypesetterTestsFont.init();
        var attributedString = JSAttributedString.initWithString('', attributes);
        var typesetter = JSTextTypesetter.init();
        typesetter.attributedString = attributedString;
        var line = typesetter.createLine(JSRange(0, attributedString.string.length));
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 0);
        TKAssertEquals(line.size.width, 0);
        TKAssertEquals(line.size.height, 16.40625);
        TKAssertEquals(line.trailingWhitespaceWidth, 0);
        TKAssertEquals(line.runs.length, 0);
    },

    testCreateLineNewline: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.font] = JSTextTypesetterTestsFont.init();
        var attributedString = JSAttributedString.initWithString('\n', attributes);
        var typesetter = JSTextTypesetter.init();
        typesetter.attributedString = attributedString;
        var line = typesetter.createLine(JSRange(0, attributedString.string.length));
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 1);
        TKAssertEquals(line.size.width, 0);
        TKAssertEquals(line.size.height, 16.40625);
        TKAssertEquals(line.trailingWhitespaceWidth, 0);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 1);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 0);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
    },

    testCreateLineTrailingWhitespace: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.font] = JSTextTypesetterTestsFont.init();
        var attributedString = JSAttributedString.initWithString('Testing 123   ', attributes);
        var typesetter = JSTextTypesetter.init();
        typesetter.attributedString = attributedString;
        var line = typesetter.createLine(JSRange(0, attributedString.string.length));
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 14);
        TKAssertEquals(line.size.width, 360);
        TKAssertEquals(line.size.height, 16.40625);
        TKAssertEquals(line.trailingWhitespaceWidth, 90);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 14);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 360);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);

        // with newline
        attributedString = JSAttributedString.initWithString('Testing 123  \n', attributes);
        typesetter.attributedString = attributedString;
        line = typesetter.createLine(JSRange(0, attributedString.string.length));
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 14);
        TKAssertEquals(line.size.width, 330);
        TKAssertEquals(line.size.height, 16.40625);
        TKAssertEquals(line.trailingWhitespaceWidth, 60);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 14);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 330);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);

        // TODO: non-0x20 whitespace
    },

    testCreateLineWhitespace: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.font] = JSTextTypesetterTestsFont.init();
        var attributedString = JSAttributedString.initWithString('   ', attributes);
        var typesetter = JSTextTypesetter.init();
        typesetter.attributedString = attributedString;
        var line = typesetter.createLine(JSRange(0, attributedString.string.length));
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 3);
        TKAssertEquals(line.size.width, 90);
        TKAssertEquals(line.size.height, 16.40625);
        TKAssertEquals(line.trailingWhitespaceWidth, 90);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 3);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 90);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);

        // with newline
        attributedString = JSAttributedString.initWithString('  \n', attributes);
        typesetter.attributedString = attributedString;
        line = typesetter.createLine(JSRange(0, attributedString.string.length));
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 3);
        TKAssertEquals(line.size.width, 60);
        TKAssertEquals(line.size.height, 16.40625);
        TKAssertEquals(line.trailingWhitespaceWidth, 60);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 3);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 60);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);

        // TODO: non-0x20 whitespace
    },

    testSuggestLineBreakInRange: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.font] = JSTextTypesetterTestsFont.init();
        var typesetter = JSTextTypesetter.init();

        // no range
        var attributedString = JSAttributedString.initWithString('This is a test\n', attributes);
        typesetter.attributedString = attributedString;
        var range = typesetter.suggestLineBreak(0, JSRange(0, 0), JSLineBreakMode.characterWrap);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 0);

        // not at start
        range = typesetter.suggestLineBreak(0, JSRange(1, 0), JSLineBreakMode.characterWrap);
        TKAssertEquals(range.location, 1);
        TKAssertEquals(range.length, 0);

        // limited range
        range = typesetter.suggestLineBreak(0, JSRange(1, 1), JSLineBreakMode.characterWrap);
        TKAssertEquals(range.location, 1);
        TKAssertEquals(range.length, 1);

        // before line break
        range = typesetter.suggestLineBreak(0, JSRange(0, 14), JSLineBreakMode.characterWrap);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 14);

        // after line break
        range = typesetter.suggestLineBreak(0, JSRange(0, 15), JSLineBreakMode.characterWrap);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 15);

        // end of string
        range = typesetter.suggestLineBreak(0, JSRange(15, 0), JSLineBreakMode.characterWrap);
        TKAssertEquals(range.location, 15);
        TKAssertEquals(range.length, 0);

    },

    testSuggestLineBreakMandatory: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.font] = JSTextTypesetterTestsFont.init();
        var typesetter = JSTextTypesetter.init();

        // break at end
        var attributedString = JSAttributedString.initWithString('This is a test\n', attributes);
        typesetter.attributedString = attributedString;
        var range = typesetter.suggestLineBreak(0, JSRange(0, 15));
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 15);

        // break in middle
        attributedString = JSAttributedString.initWithString('This is a test\nof line breaking', attributes);
        typesetter.attributedString = attributedString;
        range = typesetter.suggestLineBreak(0, JSRange(0, 31));
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 15);

        // not at start
        range = typesetter.suggestLineBreak(0, JSRange(4, 20));
        TKAssertEquals(range.location, 4);
        TKAssertEquals(range.length, 11);

        // after break
        range = typesetter.suggestLineBreak(0, JSRange(15, 16));
        TKAssertEquals(range.location, 15);
        TKAssertEquals(range.length, 16);

        // only break
        range = typesetter.suggestLineBreak(0, JSRange(14, 1));
        TKAssertEquals(range.location, 14);
        TKAssertEquals(range.length, 1);

        // carriage return
        attributedString = JSAttributedString.initWithString('This is a test\rof line breaking', attributes);
        typesetter.attributedString = attributedString;
        range = typesetter.suggestLineBreak(0, JSRange(0, 31));
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 15);

        // crlf
        attributedString = JSAttributedString.initWithString('This is a test\r\nof line breaking', attributes);
        typesetter.attributedString = attributedString;
        range = typesetter.suggestLineBreak(0, JSRange(0, 31));
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 16);

        // form feed
        attributedString = JSAttributedString.initWithString('This is a test\u000cof line breaking', attributes);
        typesetter.attributedString = attributedString;
        range = typesetter.suggestLineBreak(0, JSRange(0, 31));
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 15);

        // next line
        attributedString = JSAttributedString.initWithString('This is a test\u0085of line breaking', attributes);
        typesetter.attributedString = attributedString;
        range = typesetter.suggestLineBreak(0, JSRange(0, 31));
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 15);

        // line separator
        attributedString = JSAttributedString.initWithString('This is a test\u2028of line breaking', attributes);
        typesetter.attributedString = attributedString;
        range = typesetter.suggestLineBreak(0, JSRange(0, 31));
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 15);

        // paragraph separator
        attributedString = JSAttributedString.initWithString('This is a test\u2029of line breaking', attributes);
        typesetter.attributedString = attributedString;
        range = typesetter.suggestLineBreak(0, JSRange(0, 31));
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 15);

        // multiple newlines
        attributedString = JSAttributedString.initWithString('This is a test\n\nof line breaking', attributes);
        typesetter.attributedString = attributedString;
        range = typesetter.suggestLineBreak(0, JSRange(0, 31));
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 15);
        range = typesetter.suggestLineBreak(0, JSRange(15, 16));
        TKAssertEquals(range.location, 15);
        TKAssertEquals(range.length, 1);

        // multiple carriage returns
        attributedString = JSAttributedString.initWithString('This is a test\r\rof line breaking', attributes);
        typesetter.attributedString = attributedString;
        range = typesetter.suggestLineBreak(0, JSRange(0, 31));
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 15);
        range = typesetter.suggestLineBreak(0, JSRange(15, 16));
        TKAssertEquals(range.location, 15);
        TKAssertEquals(range.length, 1);

        // lf cr
        attributedString = JSAttributedString.initWithString('This is a test\n\rof line breaking', attributes);
        typesetter.attributedString = attributedString;
        range = typesetter.suggestLineBreak(0, JSRange(0, 31));
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 15);
        range = typesetter.suggestLineBreak(0, JSRange(15, 16));
        TKAssertEquals(range.location, 15);
        TKAssertEquals(range.length, 1);

        // multiple form feeds
        attributedString = JSAttributedString.initWithString('This is a test\u000c\u000cof line breaking', attributes);
        typesetter.attributedString = attributedString;
        range = typesetter.suggestLineBreak(0, JSRange(0, 31));
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 15);
        range = typesetter.suggestLineBreak(0, JSRange(15, 16));
        TKAssertEquals(range.location, 15);
        TKAssertEquals(range.length, 1);

        // multiple next lines
        attributedString = JSAttributedString.initWithString('This is a test\u0085\u0085of line breaking', attributes);
        typesetter.attributedString = attributedString;
        range = typesetter.suggestLineBreak(0, JSRange(0, 31));
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 15);
        range = typesetter.suggestLineBreak(0, JSRange(15, 16));
        TKAssertEquals(range.location, 15);
        TKAssertEquals(range.length, 1);

        // multiple line separators
        attributedString = JSAttributedString.initWithString('This is a test\u2028\u2028of line breaking', attributes);
        typesetter.attributedString = attributedString;
        range = typesetter.suggestLineBreak(0, JSRange(0, 31));
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 15);
        range = typesetter.suggestLineBreak(0, JSRange(15, 16));
        TKAssertEquals(range.location, 15);
        TKAssertEquals(range.length, 1);

        // multiple paragraph seprators
        attributedString = JSAttributedString.initWithString('This is a test\u2029\u2029of line breaking', attributes);
        typesetter.attributedString = attributedString;
        range = typesetter.suggestLineBreak(0, JSRange(0, 31));
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 15);
        range = typesetter.suggestLineBreak(0, JSRange(15, 16));
        TKAssertEquals(range.location, 15);
        TKAssertEquals(range.length, 1);
    },

    testSuggestLineBreakCharacterWrap: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.font] = JSTextTypesetterTestsFont.init();
        var typesetter = JSTextTypesetter.init();
        var attributedString = JSAttributedString.initWithString('Testing character wrapping', attributes);
        typesetter.attributedString = attributedString;

        // at start
        var range = typesetter.suggestLineBreak(100, JSRange(0, 26), JSLineBreakMode.characterWrap);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 4);

        // not at start
        range = typesetter.suggestLineBreak(100, JSRange(1, 26), JSLineBreakMode.characterWrap);
        TKAssertEquals(range.location, 1);
        TKAssertEquals(range.length, 5);

        // trailing whitespace
        range = typesetter.suggestLineBreak(160, JSRange(0, 26), JSLineBreakMode.characterWrap);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 8);

        // trailing whitespace
        range = typesetter.suggestLineBreak(150, JSRange(0, 26), JSLineBreakMode.characterWrap);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 8);

        // no room for even a single char
        range = typesetter.suggestLineBreak(10, JSRange(0, 26), JSLineBreakMode.characterWrap);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 0);

        // at newline
        attributedString = JSAttributedString.initWithString('Testing\ncharacter wrapping', attributes);
        typesetter.attributedString = attributedString;
        range = typesetter.suggestLineBreak(150, JSRange(0, 26), JSLineBreakMode.characterWrap);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 8);

        // after newline
        typesetter.attributedString = attributedString;
        range = typesetter.suggestLineBreak(160, JSRange(0, 26), JSLineBreakMode.characterWrap);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 8);
    },

    testSuggestLineBreakWordWrap: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.font] = JSTextTypesetterTestsFont.init();
        var typesetter = JSTextTypesetter.init();
        var attributedString = JSAttributedString.initWithString('Testing word wrapping in a line of text', attributes);
        typesetter.attributedString = attributedString;

        // at start
        var range = typesetter.suggestLineBreak(370, JSRange(0, 39), JSLineBreakMode.wordWrap);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 13);

        // not at start
        range = typesetter.suggestLineBreak(370, JSRange(1, 38), JSLineBreakMode.wordWrap);
        TKAssertEquals(range.location, 1);
        TKAssertEquals(range.length, 12);

        // trailing whitespace
        range = typesetter.suggestLineBreak(260, JSRange(0, 39), JSLineBreakMode.wordWrap);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 13);

        // trailing whitespace
        range = typesetter.suggestLineBreak(270, JSRange(0, 26), JSLineBreakMode.wordWrap);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 13);

        // too small for word, fall back to char wrapping
        range = typesetter.suggestLineBreak(75, JSRange(0, 26), JSLineBreakMode.wordWrap);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 3);

        // too small for char
        range = typesetter.suggestLineBreak(5, JSRange(0, 26), JSLineBreakMode.wordWrap);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 0);

        // at newline
        attributedString = JSAttributedString.initWithString('Testing word\nwrapping in a line of text', attributes);
        typesetter.attributedString = attributedString;
        range = typesetter.suggestLineBreak(260, JSRange(0, 39), JSLineBreakMode.wordWrap);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 13);

        // after newline
        typesetter.attributedString = attributedString;
        range = typesetter.suggestLineBreak(270, JSRange(0, 26), JSLineBreakMode.wordWrap);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 13);
    },

    testAttachment: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.font] = JSTextTypesetterTestsFont.init();
        var typesetter = JSTextTypesetter.init();
        var attributedString = JSAttributedString.initWithString('Testing  attachment runs', attributes);
        var image = JSImage.initWithResourceName("attachment");
        var attachment = JSTextAttachment.initWithImage(image);
        var attachmentString = JSAttributedString.initWithAttachment(attachment);
        attributedString.replaceCharactersInRangeWithAttributedString(JSRange(8, 0), attachmentString);

        typesetter.attributedString = attributedString;
        var line = typesetter.createLine(JSRange(0, attributedString.string.length));
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 25);
        TKAssertEquals(line.runs.length, 3);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 8);
        TKAssertEquals(line.runs[1].range.location, 8);
        TKAssertEquals(line.runs[1].range.length, 1);
        TKAssertEquals(line.runs[1].origin.x, 180);
        TKAssertEquals(line.runs[1].origin.y, 2.98828125);
        TKAssertEquals(line.runs[1].size.width, 15);
        TKAssertEquals(line.runs[1].size.height, 10);
        TKAssertEquals(line.runs[2].origin.x, 195);
        TKAssertEquals(line.runs[2].origin.y, 0);
        TKAssertEquals(line.runs[2].range.location, 9);
        TKAssertEquals(line.runs[2].range.length, 16);
    },

    testFallbackFont: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.font] = JSTextTypesetterTestsFont3.init();
        var typesetter = JSTextTypesetterTestsFallback.initWithFallbackFonts([JSTextTypesetterTestsFont2.init(), JSTextTypesetterTestsFont.init()]);
        var attributedString = JSAttributedString.initWithString('TESTing fallBACK FONTS', attributes);
        typesetter.attributedString = attributedString;
        var line = typesetter.createLine(JSRange(0, attributedString.string.length));
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 22);
        TKAssertEquals(line.runs.length, 7);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 4);
        TKAssertEquals(line.runs[0].font.familyName, "JSTextTypesetterTestsFont3");
        TKAssertEquals(line.runs[1].range.location, 4);
        TKAssertEquals(line.runs[1].range.length, 3);
        TKAssertEquals(line.runs[1].font.familyName, "JSTextTypesetterTestsFont2");
        TKAssertEquals(line.runs[2].range.location, 7);
        TKAssertEquals(line.runs[2].range.length, 1);
        TKAssertEquals(line.runs[2].font.familyName, "JSTextTypesetterTestsFont");
        TKAssertEquals(line.runs[3].range.location, 8);
        TKAssertEquals(line.runs[3].range.length, 4);
        TKAssertEquals(line.runs[3].font.familyName, "JSTextTypesetterTestsFont2");
        TKAssertEquals(line.runs[4].range.location, 12);
        TKAssertEquals(line.runs[4].range.length, 4);
        TKAssertEquals(line.runs[4].font.familyName, "JSTextTypesetterTestsFont3");
        TKAssertEquals(line.runs[5].range.location, 16);
        TKAssertEquals(line.runs[5].range.length, 1);
        TKAssertEquals(line.runs[5].font.familyName, "JSTextTypesetterTestsFont");
        TKAssertEquals(line.runs[6].range.location, 17);
        TKAssertEquals(line.runs[6].range.length, 5);
        TKAssertEquals(line.runs[6].font.familyName, "JSTextTypesetterTestsFont3");

        // If a glyph isn't found in any of the fallbacks, a run change should not occur
        attributes = {};
        attributes[JSAttributedString.Attribute.font] = JSTextTypesetterTestsFont3.init();
        typesetter = JSTextTypesetterTestsFallback.initWithFallbackFonts([JSTextTypesetterTestsFont2.init()]);
        attributedString = JSAttributedString.initWithString('TESTing fallBACK FONTS', attributes);
        typesetter.attributedString = attributedString;
        line = typesetter.createLine(JSRange(0, attributedString.string.length));
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 22);
        TKAssertEquals(line.runs.length, 3);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 4);
        TKAssertEquals(line.runs[0].font.familyName, "JSTextTypesetterTestsFont3");
        TKAssertEquals(line.runs[1].range.location, 4);
        TKAssertEquals(line.runs[1].range.length, 8);
        TKAssertEquals(line.runs[1].font.familyName, "JSTextTypesetterTestsFont2");
        TKAssertEquals(line.runs[2].range.location, 12);
        TKAssertEquals(line.runs[2].range.length, 10);
        TKAssertEquals(line.runs[2].font.familyName, "JSTextTypesetterTestsFont3");
    },

    // TODO: more multi-run tests
    // TODO: non whitespace word breaks (unicode)
    // TODO: non 0x20 whitespace (unicode)
    // TODO: combining marks (unicode)

});

JSClass("JSTextTypesetterTestsFallback", JSTextTypesetter, {

    initWithFallbackFonts: function(fonts){
        JSTextTypesetterTestsFallback.$super.init.call(this);
        this.fallbackFonts = fonts;
    },

    fallbackFontsForFont: function(font){
        return this.fallbackFonts;
    }

});

JSClass("JSTextTypesetterTestsFont", JSFont, {

    init: function(){
        this._descriptor = JSFontDescriptor.initWithProperties("JSTextTypesetterTestsFont", JSFont.Weight.regular, JSFont.Style.normal);
        this._fullName = "JSTextTypesetterTestsFont";
        this._postScriptName = "JSTextTypesetterTestsFont";
        this._faceName = "JSTextTypesetterTestsFont";
        this._unitsPerEM = 2048;
        this._ascenderInUnits = 1900;
        this._descenderInUnits = -500;
        this._pointSize = 14.0;
        this._calculateMetrics();
    },

    glyphForCharacter: function(character){
        if (character.code == 0x2026){ // ellipsis
            return 1;
        }
        if (character.code == 0x200B){ // zero-width space
            return 4;
        }
        if (character.code >= 0x61){  // lowercase, {, }, |, ~
            return 2;
        }
        return 3; // uppercase, digits, most punctuation

    },

    widthOfGlyph: function(glyph){
        if (glyph === 0){
            return 30;
        }
        if (glyph == 1){
            return 10;
        }
        if (glyph == 2){
            return 20;
        }
        if (glyph == 3){
            return 30;
        }
        if (glyph == 4){
            return 0;
        }
    }
});

JSClass("JSTextTypesetterTestsFont2", JSFont, {

    init: function(){
        this._descriptor = JSFontDescriptor.initWithProperties("JSTextTypesetterTestsFont2", JSFont.Weight.regular, JSFont.Style.normal);
        this._fullName = "JSTextTypesetterTestsFont2";
        this._postScriptName = "JSTextTypesetterTestsFont2";
        this._faceName = "JSTextTypesetterTestsFont2";
        this._unitsPerEM = 2048;
        this._ascenderInUnits = 1900;
        this._descenderInUnits = -500;
        this._pointSize = 14.0;
        this._calculateMetrics();
    },

    glyphForCharacter: function(character){
        // uppercase
        if (character.code >= 0x41 && character.code <= 0x5A){
            return 1;
        }
        // lowercase
        if (character.code >= 0x61 && character.code <= 0x7A){
            return 2;
        }
        return 0;
    },

    widthOfGlyph: function(glyph){
        if (glyph === 0){
            return 10;
        }
        if (glyph == 1){
            return 30;
        }
        if (glyph == 2){
            return 20;
        }
    }
});

JSClass("JSTextTypesetterTestsFont3", JSFont, {

    init: function(){
        this._descriptor = JSFontDescriptor.initWithProperties("JSTextTypesetterTestsFont3", JSFont.Weight.regular, JSFont.Style.normal);
        this._fullName = "JSTextTypesetterTestsFont3";
        this._postScriptName = "JSTextTypesetterTestsFont3";
        this._faceName = "JSTextTypesetterTestsFont3";
        this._unitsPerEM = 2048;
        this._ascenderInUnits = 1900;
        this._descenderInUnits = -500;
        this._pointSize = 14.0;
        this._calculateMetrics();
    },

    glyphForCharacter: function(character){
        // uppercase only
        if (character.code >= 0x41 && character.code <= 0x5A){
            return 1;
        }
        return 0;
    },

    widthOfGlyph: function(glyph){
        if (glyph === 0){
            return 10;
        }
        if (glyph == 1){
            return 30;
        }
    }
});