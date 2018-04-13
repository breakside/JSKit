// #import "Foundation/Foundation.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, JSTextFrame, JSTextFramesetter, JSTextFramesetterFontTests, JSAttributedString, JSPoint, JSSize, JSRange, JSLineBreakMode, JSTextAlignment, JSTextLine, JSTextRun, JSFont, JSFontDescriptor */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertThrows */
'use strict';

JSClass("JSTextFramesetterTests", TKTestSuite, {

    testSingleRunUnconstrainedLine: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.font] = JSTextFramesetterFontTests.init();
        var attributedString = JSAttributedString.initWithString('Testing 123', attributes);
        var framesetter = JSTextFramesetter.init();
        framesetter.attributedString = attributedString;
        var paragraphAttributes = {
            lineBreakMode: JSLineBreakMode.characterWrap,
            textAlignment: JSTextAlignment.left
        };
        var frame = framesetter.createFrame(JSSize(0, 0), JSRange(0, attributedString.string.length), 0, paragraphAttributes);
        TKAssertNotNull(frame);
        TKAssertEquals(frame.lines.length, 1);
        TKAssertEquals(frame.range.location, 0);
        TKAssertEquals(frame.range.length, 11);
        TKAssertFloatEquals(frame.size.width, 270);
        TKAssertFloatEquals(frame.size.height, 16.40625);
        var line = frame.lines[0];
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 11);
        TKAssertFloatEquals(line.origin.x, 0);
        TKAssertFloatEquals(line.origin.y, 0);
        TKAssertFloatEquals(line.size.width, 270);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 11);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 270);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);

        // check that the passed range is respected
        frame = framesetter.createFrame(JSSize(0, 0), JSRange(2, 3), 0, paragraphAttributes);
        TKAssertEquals(frame.lines.length, 1);
        TKAssertEquals(frame.range.location, 2);
        TKAssertEquals(frame.range.length, 3);
        TKAssertFloatEquals(frame.size.width, 60);
        TKAssertFloatEquals(frame.size.height, 16.40625);
        line = frame.lines[0];
        TKAssertEquals(line.range.location, 2);
        TKAssertEquals(line.range.length, 3);
        TKAssertFloatEquals(line.origin.x, 0);
        TKAssertFloatEquals(line.origin.y, 0);
        TKAssertFloatEquals(line.size.width, 60);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 2);
        TKAssertEquals(line.runs[0].range.length, 3);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 60);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
    },

    testSingleRunUnconstrainedLineWithNewline: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.font] = JSTextFramesetterFontTests.init();
        var attributedString = JSAttributedString.initWithString('Testing 123\nAnd more', attributes);
        var framesetter = JSTextFramesetter.init();
        framesetter.attributedString = attributedString;
        var paragraphAttributes = {
            lineBreakMode: JSLineBreakMode.characterWrap,
            textAlignment: JSTextAlignment.left
        };
        var frame = framesetter.createFrame(JSSize(0, 0), JSRange(0, attributedString.string.length), 0, paragraphAttributes);
        TKAssertEquals(frame.lines.length, 2);
        TKAssertEquals(frame.range.location, 0);
        TKAssertEquals(frame.range.length, 20);
        TKAssertFloatEquals(frame.size.width, 270);
        TKAssertFloatEquals(frame.size.height, 32.81250);
        var line = frame.lines[0];
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 12);
        TKAssertFloatEquals(line.origin.x, 0);
        TKAssertFloatEquals(line.origin.y, 0);
        TKAssertFloatEquals(line.size.width, 270);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 12);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 270);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
        line = frame.lines[1];
        TKAssertEquals(line.range.location, 12);
        TKAssertEquals(line.range.length, 8);
        TKAssertFloatEquals(line.origin.x, 0);
        TKAssertFloatEquals(line.origin.y, 16.40625);
        TKAssertFloatEquals(line.size.width, 180);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 12);
        TKAssertEquals(line.runs[0].range.length, 8);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 180);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);

        // unconventional newline char
        attributedString = JSAttributedString.initWithString('Testing 123\u2028And more', attributes);
        framesetter = JSTextFramesetter.init();
        framesetter.attributedString = attributedString;
        frame = framesetter.createFrame(JSSize(0, 0), JSRange(0, attributedString.string.length), 0, paragraphAttributes);
        TKAssertEquals(frame.lines.length, 2);
        TKAssertEquals(frame.range.location, 0);
        TKAssertEquals(frame.range.length, 20);
        TKAssertFloatEquals(frame.size.width, 270);
        TKAssertFloatEquals(frame.size.height, 32.81250);
        line = frame.lines[0];
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 12);
        TKAssertFloatEquals(line.origin.x, 0);
        TKAssertFloatEquals(line.origin.y, 0);
        TKAssertFloatEquals(line.size.width, 270);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 12);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 270);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
        line = frame.lines[1];
        TKAssertEquals(line.range.location, 12);
        TKAssertEquals(line.range.length, 8);
        TKAssertFloatEquals(line.origin.x, 0);
        TKAssertFloatEquals(line.origin.y, 16.40625);
        TKAssertFloatEquals(line.size.width, 180);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 12);
        TKAssertEquals(line.runs[0].range.length, 8);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 180);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);

        // unconventional newline char
        attributedString = JSAttributedString.initWithString('Testing 123\rAnd more', attributes);
        framesetter = JSTextFramesetter.init();
        framesetter.attributedString = attributedString;
        frame = framesetter.createFrame(JSSize(0, 0), JSRange(0, attributedString.string.length), 0, paragraphAttributes);
        TKAssertEquals(frame.lines.length, 2);
        TKAssertEquals(frame.range.location, 0);
        TKAssertEquals(frame.range.length, 20);
        TKAssertFloatEquals(frame.size.width, 270);
        TKAssertFloatEquals(frame.size.height, 32.81250);
        line = frame.lines[0];
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 12);
        TKAssertFloatEquals(line.origin.x, 0);
        TKAssertFloatEquals(line.origin.y, 0);
        TKAssertFloatEquals(line.size.width, 270);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 12);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 270);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
        line = frame.lines[1];
        TKAssertEquals(line.range.location, 12);
        TKAssertEquals(line.range.length, 8);
        TKAssertFloatEquals(line.origin.x, 0);
        TKAssertFloatEquals(line.origin.y, 16.40625);
        TKAssertFloatEquals(line.size.width, 180);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 12);
        TKAssertEquals(line.runs[0].range.length, 8);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 180);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);

        // multitchar newline char
        attributedString = JSAttributedString.initWithString('Testing 123\r\nAnd more', attributes);
        framesetter = JSTextFramesetter.init();
        framesetter.attributedString = attributedString;
        frame = framesetter.createFrame(JSSize(0, 0), JSRange(0, attributedString.string.length), 0, paragraphAttributes);
        TKAssertEquals(frame.lines.length, 2);
        TKAssertEquals(frame.range.location, 0);
        TKAssertEquals(frame.range.length, 21);
        TKAssertFloatEquals(frame.size.width, 270);
        TKAssertFloatEquals(frame.size.height, 32.81250);
        line = frame.lines[0];
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 13);
        TKAssertFloatEquals(line.origin.x, 0);
        TKAssertFloatEquals(line.origin.y, 0);
        TKAssertFloatEquals(line.size.width, 270);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 13);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 270);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
        line = frame.lines[1];
        TKAssertEquals(line.range.location, 13);
        TKAssertEquals(line.range.length, 8);
        TKAssertFloatEquals(line.origin.x, 0);
        TKAssertFloatEquals(line.origin.y, 16.40625);
        TKAssertFloatEquals(line.size.width, 180);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 13);
        TKAssertEquals(line.runs[0].range.length, 8);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 180);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
    },

    testSingleRunConstrainedLineWithNewline: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.font] = JSTextFramesetterFontTests.init();
        var attributedString = JSAttributedString.initWithString('Testing 123\nAnd more', attributes);
        var framesetter = JSTextFramesetter.init();
        framesetter.attributedString = attributedString;
        var paragraphAttributes = {
            lineBreakMode: JSLineBreakMode.characterWrap,
            textAlignment: JSTextAlignment.left
        };
        var frame = framesetter.createFrame(JSSize(350, 0), JSRange(0, attributedString.string.length), 0, paragraphAttributes);
        TKAssertEquals(frame.lines.length, 2);
        TKAssertEquals(frame.range.location, 0);
        TKAssertEquals(frame.range.length, 20);
        TKAssertFloatEquals(frame.size.width, 350);
        TKAssertFloatEquals(frame.size.height, 32.81250);
        var line = frame.lines[0];
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 12);
        TKAssertFloatEquals(line.origin.x, 0);
        TKAssertFloatEquals(line.origin.y, 0);
        TKAssertFloatEquals(line.size.width, 270);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 12);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 270);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
        line = frame.lines[1];
        TKAssertEquals(line.range.location, 12);
        TKAssertEquals(line.range.length, 8);
        TKAssertFloatEquals(line.origin.x, 0);
        TKAssertFloatEquals(line.origin.y, 16.40625);
        TKAssertFloatEquals(line.size.width, 180);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 12);
        TKAssertEquals(line.runs[0].range.length, 8);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 180);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);

        // break and size happen at same time
        frame = framesetter.createFrame(JSSize(270, 0), JSRange(0, attributedString.string.length), 0, paragraphAttributes);
        TKAssertEquals(frame.lines.length, 2);
        TKAssertEquals(frame.range.location, 0);
        TKAssertEquals(frame.range.length, 20);
        TKAssertFloatEquals(frame.size.width, 270);
        TKAssertFloatEquals(frame.size.height, 32.81250);
        line = frame.lines[0];
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 12);
        TKAssertFloatEquals(line.origin.x, 0);
        TKAssertFloatEquals(line.origin.y, 0);
        TKAssertFloatEquals(line.size.width, 270);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 12);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 270);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
        line = frame.lines[1];
        TKAssertEquals(line.range.location, 12);
        TKAssertEquals(line.range.length, 8);
        TKAssertFloatEquals(line.origin.x, 0);
        TKAssertFloatEquals(line.origin.y, 16.40625);
        TKAssertFloatEquals(line.size.width, 180);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 12);
        TKAssertEquals(line.runs[0].range.length, 8);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 180);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);

        // break is after a run change
        attributedString.addAttributeInRange(JSAttributedString.Attribute.underline, true, JSRange(0, 11));
        framesetter.attributedString = attributedString;
        frame = framesetter.createFrame(JSSize(300, 0), JSRange(0, attributedString.string.length), 0, paragraphAttributes);
        TKAssertEquals(frame.lines.length, 2);
        TKAssertEquals(frame.range.location, 0);
        TKAssertEquals(frame.range.length, 20);
        TKAssertFloatEquals(frame.size.width, 300);
        TKAssertFloatEquals(frame.size.height, 32.81250);
        line = frame.lines[0];
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 12);
        TKAssertFloatEquals(line.size.width, 270);
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
        line = frame.lines[1];
        TKAssertEquals(line.range.location, 12);
        TKAssertEquals(line.range.length, 8);
        TKAssertFloatEquals(line.origin.x, 0);
        TKAssertFloatEquals(line.origin.y, 16.40625);
        TKAssertFloatEquals(line.size.width, 180);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 12);
        TKAssertEquals(line.runs[0].range.length, 8);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 180);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);

        // unconventional newline char
        attributedString = JSAttributedString.initWithString('Testing 123\u2028And more', attributes);
        framesetter = JSTextFramesetter.init();
        framesetter.attributedString = attributedString;
        frame = framesetter.createFrame(JSSize(350, 0), JSRange(0, attributedString.string.length), 0, paragraphAttributes);
        TKAssertEquals(frame.lines.length, 2);
        TKAssertEquals(frame.range.location, 0);
        TKAssertEquals(frame.range.length, 20);
        TKAssertFloatEquals(frame.size.width, 350);
        TKAssertFloatEquals(frame.size.height, 32.81250);
        line = frame.lines[0];
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 12);
        TKAssertFloatEquals(line.origin.x, 0);
        TKAssertFloatEquals(line.origin.y, 0);
        TKAssertFloatEquals(line.size.width, 270);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 12);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 270);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
        line = frame.lines[1];
        TKAssertEquals(line.range.location, 12);
        TKAssertEquals(line.range.length, 8);
        TKAssertFloatEquals(line.origin.x, 0);
        TKAssertFloatEquals(line.origin.y, 16.40625);
        TKAssertFloatEquals(line.size.width, 180);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 12);
        TKAssertEquals(line.runs[0].range.length, 8);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 180);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);

        // unconventional newline char
        attributedString = JSAttributedString.initWithString('Testing 123\rAnd more', attributes);
        framesetter = JSTextFramesetter.init();
        framesetter.attributedString = attributedString;
        frame = framesetter.createFrame(JSSize(350, 0), JSRange(0, attributedString.string.length), 0, paragraphAttributes);
        TKAssertEquals(frame.lines.length, 2);
        TKAssertEquals(frame.range.location, 0);
        TKAssertEquals(frame.range.length, 20);
        TKAssertFloatEquals(frame.size.width, 350);
        TKAssertFloatEquals(frame.size.height, 32.81250);
        line = frame.lines[0];
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 12);
        TKAssertFloatEquals(line.origin.x, 0);
        TKAssertFloatEquals(line.origin.y, 0);
        TKAssertFloatEquals(line.size.width, 270);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 12);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 270);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
        line = frame.lines[1];
        TKAssertEquals(line.range.location, 12);
        TKAssertEquals(line.range.length, 8);
        TKAssertFloatEquals(line.origin.x, 0);
        TKAssertFloatEquals(line.origin.y, 16.40625);
        TKAssertFloatEquals(line.size.width, 180);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 12);
        TKAssertEquals(line.runs[0].range.length, 8);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 180);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);

        // multichar newline char
        attributedString = JSAttributedString.initWithString('Testing 123\r\nAnd more', attributes);
        framesetter = JSTextFramesetter.init();
        framesetter.attributedString = attributedString;
        frame = framesetter.createFrame(JSSize(350, 0), JSRange(0, attributedString.string.length), 0, paragraphAttributes);
        TKAssertEquals(frame.lines.length, 2);
        TKAssertEquals(frame.range.location, 0);
        TKAssertEquals(frame.range.length, 21);
        TKAssertFloatEquals(frame.size.width, 350);
        TKAssertFloatEquals(frame.size.height, 32.81250);
        line = frame.lines[0];
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 13);
        TKAssertFloatEquals(line.origin.x, 0);
        TKAssertFloatEquals(line.origin.y, 0);
        TKAssertFloatEquals(line.size.width, 270);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 13);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 270);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
        line = frame.lines[1];
        TKAssertEquals(line.range.location, 13);
        TKAssertEquals(line.range.length, 8);
        TKAssertFloatEquals(line.origin.x, 0);
        TKAssertFloatEquals(line.origin.y, 16.40625);
        TKAssertFloatEquals(line.size.width, 180);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 13);
        TKAssertEquals(line.runs[0].range.length, 8);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 180);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
    },

    testEmptyUnconstrainedLine: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.font] = JSTextFramesetterFontTests.init();
        var attributedString = JSAttributedString.initWithString('', attributes);
        var framesetter = JSTextFramesetter.init();
        framesetter.attributedString = attributedString;
        var paragraphAttributes = {
            lineBreakMode: JSLineBreakMode.characterWrap,
            textAlignment: JSTextAlignment.left
        };
        var frame = framesetter.createFrame(JSSize(0, 0), JSRange(0, attributedString.string.length), 0, paragraphAttributes);
        TKAssertEquals(frame.lines.length, 1);
        TKAssertEquals(frame.range.location, 0);
        TKAssertEquals(frame.range.length, 0);
        TKAssertFloatEquals(frame.size.width, 0);
        TKAssertFloatEquals(frame.size.height, 16.40625);
        var line = frame.lines[0];
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 0);
        TKAssertFloatEquals(line.origin.x, 0);
        TKAssertFloatEquals(line.origin.y, 0);
        TKAssertFloatEquals(line.size.width, 0);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 0);
    },

    testWhitespaceUnconstrainedLine: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.font] = JSTextFramesetterFontTests.init();
        var attributedString = JSAttributedString.initWithString('    ', attributes);
        var framesetter = JSTextFramesetter.init();
        framesetter.attributedString = attributedString;
        var paragraphAttributes = {
            lineBreakMode: JSLineBreakMode.characterWrap,
            textAlignment: JSTextAlignment.left
        };
        var frame = framesetter.createFrame(JSSize(0, 0), JSRange(0, attributedString.string.length), 0, paragraphAttributes);
        TKAssertEquals(frame.lines.length, 1);
        TKAssertEquals(frame.range.location, 0);
        TKAssertEquals(frame.range.length, 4);
        TKAssertFloatEquals(frame.size.width, 120);
        TKAssertFloatEquals(frame.size.height, 16.40625);
        var line = frame.lines[0];
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 4);
        TKAssertFloatEquals(line.origin.x, 0);
        TKAssertFloatEquals(line.origin.y, 0);
        TKAssertFloatEquals(line.size.width, 120);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 4);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 120);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
    },

    testNewlineUnconstrainedLine: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.font] = JSTextFramesetterFontTests.init();
        var attributedString = JSAttributedString.initWithString('\n', attributes);
        var framesetter = JSTextFramesetter.init();
        framesetter.attributedString = attributedString;
        var paragraphAttributes = {
            lineBreakMode: JSLineBreakMode.characterWrap,
            textAlignment: JSTextAlignment.left
        };
        var frame = framesetter.createFrame(JSSize(0, 0), JSRange(0, attributedString.string.length), 0, paragraphAttributes);
        TKAssertEquals(frame.lines.length, 1);
        TKAssertEquals(frame.range.location, 0);
        TKAssertEquals(frame.range.length, 1);
        TKAssertFloatEquals(frame.size.width, 0);
        TKAssertFloatEquals(frame.size.height, 16.40625);
        var line = frame.lines[0];
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 1);
        TKAssertFloatEquals(line.origin.x, 0);
        TKAssertFloatEquals(line.origin.y, 0);
        TKAssertFloatEquals(line.size.width, 0);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 1);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 0);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
    },

    testEmptyConstrainedLine: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.font] = JSTextFramesetterFontTests.init();
        var attributedString = JSAttributedString.initWithString('', attributes);
        var framesetter = JSTextFramesetter.init();
        framesetter.attributedString = attributedString;
        var paragraphAttributes = {
            lineBreakMode: JSLineBreakMode.characterWrap,
            textAlignment: JSTextAlignment.left
        };
        var frame = framesetter.createFrame(JSSize(100, 0), JSRange(0, attributedString.string.length), 0, paragraphAttributes);
        TKAssertEquals(frame.lines.length, 1);
        TKAssertEquals(frame.range.location, 0);
        TKAssertEquals(frame.range.length, 0);
        TKAssertFloatEquals(frame.size.width, 100);
        TKAssertFloatEquals(frame.size.height, 16.40625);
        var line = frame.lines[0];
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 0);
        TKAssertFloatEquals(line.origin.x, 0);
        TKAssertFloatEquals(line.origin.y, 0);
        TKAssertFloatEquals(line.size.width, 0);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 0);
    },

    testWhitespaceConstrainedLine: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.font] = JSTextFramesetterFontTests.init();
        var attributedString = JSAttributedString.initWithString('    ', attributes);
        var framesetter = JSTextFramesetter.init();
        framesetter.attributedString = attributedString;
        var paragraphAttributes = {
            lineBreakMode: JSLineBreakMode.characterWrap,
            textAlignment: JSTextAlignment.left
        };
        var frame = framesetter.createFrame(JSSize(100, 0), JSRange(0, attributedString.string.length), 0, paragraphAttributes);
        TKAssertEquals(frame.lines.length, 1);
        TKAssertEquals(frame.range.location, 0);
        TKAssertEquals(frame.range.length, 4);
        TKAssertFloatEquals(frame.size.width, 100);
        TKAssertFloatEquals(frame.size.height, 16.40625);
        var line = frame.lines[0];
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 4);
        TKAssertFloatEquals(line.origin.x, 0);
        TKAssertFloatEquals(line.origin.y, 0);
        TKAssertFloatEquals(line.size.width, 120);
        TKAssertFloatEquals(line.trailingWhitespaceWidth, 120);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 4);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 120);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
    },

    testNewlineConstrainedLine: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.font] = JSTextFramesetterFontTests.init();
        var attributedString = JSAttributedString.initWithString('\n', attributes);
        var framesetter = JSTextFramesetter.init();
        framesetter.attributedString = attributedString;
        var paragraphAttributes = {
            lineBreakMode: JSLineBreakMode.characterWrap,
            textAlignment: JSTextAlignment.left
        };
        var frame = framesetter.createFrame(JSSize(100, 0), JSRange(0, attributedString.string.length), 0, paragraphAttributes);
        TKAssertEquals(frame.lines.length, 1);
        TKAssertEquals(frame.range.location, 0);
        TKAssertEquals(frame.range.length, 1);
        TKAssertFloatEquals(frame.size.width, 100);
        TKAssertFloatEquals(frame.size.height, 16.40625);
        var line = frame.lines[0];
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 1);
        TKAssertFloatEquals(line.origin.x, 0);
        TKAssertFloatEquals(line.origin.y, 0);
        TKAssertFloatEquals(line.size.width, 0);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 1);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 0);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
    },

    testCharacterWrapping: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.font] = JSTextFramesetterFontTests.init();
        var attributedString = JSAttributedString.initWithString('Testing 123', attributes);
        var framesetter = JSTextFramesetter.init();
        framesetter.attributedString = attributedString;
        var paragraphAttributes = {
            lineBreakMode: JSLineBreakMode.characterWrap,
            textAlignment: JSTextAlignment.left
        };
        var frame = framesetter.createFrame(JSSize(100, 0), JSRange(0, attributedString.string.length), 0, paragraphAttributes);
        TKAssertEquals(frame.lines.length, 3);
        TKAssertEquals(frame.range.location, 0);
        TKAssertEquals(frame.range.length, 11);
        TKAssertFloatEquals(frame.size.width, 100);
        TKAssertFloatEquals(frame.size.height, 49.21875);
        var line = frame.lines[0];
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 4);
        TKAssertFloatEquals(line.size.width, 90);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 4);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 90);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
        line = frame.lines[1];
        TKAssertEquals(line.range.location, 4);
        TKAssertEquals(line.range.length, 4);
        TKAssertFloatEquals(line.size.width, 90);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 4);
        TKAssertEquals(line.runs[0].range.length, 4);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 90);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
        line = frame.lines[2];
        TKAssertEquals(line.range.location, 8);
        TKAssertEquals(line.range.length, 3);
        TKAssertFloatEquals(line.size.width, 90);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 8);
        TKAssertEquals(line.runs[0].range.length, 3);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 90);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);

        // Too narrow for even a single character
        frame = framesetter.createFrame(JSSize(10, 0), JSRange(0, attributedString.string.length), 0, paragraphAttributes);
        TKAssertEquals(frame.lines.length, 1);
        TKAssertEquals(frame.range.location, 0);
        TKAssertEquals(frame.range.length, 0);
        TKAssertFloatEquals(frame.size.width, 10);
        TKAssertFloatEquals(frame.size.height, 16.40625);
        line = frame.lines[0];
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 0);
        TKAssertFloatEquals(line.size.width, 0);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 0);
    },

    testRightAlign: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.font] = JSTextFramesetterFontTests.init();
        var attributedString = JSAttributedString.initWithString('Testing 123', attributes);
        var framesetter = JSTextFramesetter.init();
        framesetter.attributedString = attributedString;
        var paragraphAttributes = {
            lineBreakMode: JSLineBreakMode.characterWrap,
            textAlignment: JSTextAlignment.right
        };
        var frame = framesetter.createFrame(JSSize(100, 0), JSRange(0, attributedString.string.length), 0, paragraphAttributes);
        TKAssertEquals(frame.lines.length, 3);
        TKAssertEquals(frame.range.location, 0);
        TKAssertEquals(frame.range.length, 11);
        TKAssertFloatEquals(frame.size.width, 100);
        TKAssertFloatEquals(frame.size.height, 49.21875);
        var line = frame.lines[0];
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 4);
        TKAssertFloatEquals(line.size.width, 90);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertFloatEquals(line.trailingWhitespaceWidth, 0);
        TKAssertFloatEquals(line.origin.x, 10);
        TKAssertFloatEquals(line.origin.y, 0);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 4);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 90);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
        line = frame.lines[1];
        TKAssertEquals(line.range.location, 4);
        TKAssertEquals(line.range.length, 4);
        TKAssertFloatEquals(line.size.width, 90);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertFloatEquals(line.trailingWhitespaceWidth, 30);
        TKAssertFloatEquals(line.origin.x, 40);
        TKAssertFloatEquals(line.origin.y, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 4);
        TKAssertEquals(line.runs[0].range.length, 4);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 90);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
        TKAssertFloatEquals(line.trailingWhitespaceWidth, 30);
        line = frame.lines[2];
        TKAssertEquals(line.range.location, 8);
        TKAssertEquals(line.range.length, 3);
        TKAssertFloatEquals(line.size.width, 90);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertFloatEquals(line.trailingWhitespaceWidth, 0);
        TKAssertFloatEquals(line.origin.x, 10);
        TKAssertFloatEquals(line.origin.y, 32.81250);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 8);
        TKAssertEquals(line.runs[0].range.length, 3);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 90);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
    },

    testCenterAlign: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.font] = JSTextFramesetterFontTests.init();
        var attributedString = JSAttributedString.initWithString('Testing 123', attributes);
        var framesetter = JSTextFramesetter.init();
        framesetter.attributedString = attributedString;
        var paragraphAttributes = {
            lineBreakMode: JSLineBreakMode.characterWrap,
            textAlignment: JSTextAlignment.center
        };
        var frame = framesetter.createFrame(JSSize(100, 0), JSRange(0, attributedString.string.length), 0, paragraphAttributes);
        TKAssertEquals(frame.lines.length, 3);
        TKAssertEquals(frame.range.location, 0);
        TKAssertEquals(frame.range.length, 11);
        TKAssertFloatEquals(frame.size.width, 100);
        TKAssertFloatEquals(frame.size.height, 49.21875);
        var line = frame.lines[0];
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 4);
        TKAssertFloatEquals(line.origin.x, 5);
        TKAssertFloatEquals(line.origin.y, 0);
        TKAssertFloatEquals(line.size.width, 90);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertFloatEquals(line.trailingWhitespaceWidth, 0);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 4);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 90);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
        line = frame.lines[1];
        TKAssertEquals(line.range.location, 4);
        TKAssertEquals(line.range.length, 4);
        TKAssertFloatEquals(line.origin.x, 20);
        TKAssertFloatEquals(line.origin.y, 16.40625);
        TKAssertFloatEquals(line.size.width, 90);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertFloatEquals(line.trailingWhitespaceWidth, 30);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 4);
        TKAssertEquals(line.runs[0].range.length, 4);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 90);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
        line = frame.lines[2];
        TKAssertEquals(line.range.location, 8);
        TKAssertEquals(line.range.length, 3);
        TKAssertFloatEquals(line.origin.x, 5);
        TKAssertFloatEquals(line.origin.y, 32.81250);
        TKAssertFloatEquals(line.size.width, 90);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertFloatEquals(line.trailingWhitespaceWidth, 0);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 8);
        TKAssertEquals(line.runs[0].range.length, 3);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 90);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
    },

    testWordWrapping: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.font] = JSTextFramesetterFontTests.init();
        var attributedString = JSAttributedString.initWithString('Testing 123', attributes);
        var framesetter = JSTextFramesetter.init();
        framesetter.attributedString = attributedString;
        var paragraphAttributes = {
            lineBreakMode: JSLineBreakMode.wordWrap,
            textAlignment: JSTextAlignment.left
        };
        var frame = framesetter.createFrame(JSSize(230, 0), JSRange(0, attributedString.string.length), 0, paragraphAttributes);
        TKAssertEquals(frame.lines.length, 2);
        TKAssertEquals(frame.range.location, 0);
        TKAssertEquals(frame.range.length, 11);
        TKAssertFloatEquals(frame.size.width, 230);
        TKAssertFloatEquals(frame.size.height, 32.81250);
        var line = frame.lines[0];
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 8);
        TKAssertFloatEquals(line.size.width, 180);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 8);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 180);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
        line = frame.lines[1];
        TKAssertEquals(line.range.location, 8);
        TKAssertEquals(line.range.length, 3);
        TKAssertFloatEquals(line.size.width, 90);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 8);
        TKAssertEquals(line.runs[0].range.length, 3);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 90);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);

        // not wide enough for whitespace
        frame = framesetter.createFrame(JSSize(170, 0), JSRange(0, attributedString.string.length), 0, paragraphAttributes);
        TKAssertEquals(frame.lines.length, 2);
        TKAssertEquals(frame.range.location, 0);
        TKAssertEquals(frame.range.length, 11);
        TKAssertFloatEquals(frame.size.width, 170);
        TKAssertFloatEquals(frame.size.height, 32.81250);
        line = frame.lines[0];
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 8);
        TKAssertFloatEquals(line.size.width, 180);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertFloatEquals(line.trailingWhitespaceWidth, 30);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 8);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 180);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
        line = frame.lines[1];
        TKAssertEquals(line.range.location, 8);
        TKAssertEquals(line.range.length, 3);
        TKAssertFloatEquals(line.size.width, 90);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 8);
        TKAssertEquals(line.runs[0].range.length, 3);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 90);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);

        // Too narrow for even a single word, should fall back to character wrapping
        frame = framesetter.createFrame(JSSize(100, 0), JSRange(0, attributedString.string.length), 0, paragraphAttributes);
        TKAssertEquals(frame.lines.length, 3);
        TKAssertEquals(frame.range.location, 0);
        TKAssertEquals(frame.range.length, 11);
        TKAssertFloatEquals(frame.size.width, 100);
        TKAssertFloatEquals(frame.size.height, 49.21875);
        line = frame.lines[0];
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 4);
        TKAssertFloatEquals(line.size.width, 90);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 4);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 90);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
        line = frame.lines[1];
        TKAssertEquals(line.range.location, 4);
        TKAssertEquals(line.range.length, 4);
        TKAssertFloatEquals(line.size.width, 90);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 4);
        TKAssertEquals(line.runs[0].range.length, 4);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 90);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
        line = frame.lines[2];
        TKAssertEquals(line.range.location, 8);
        TKAssertEquals(line.range.length, 3);
        TKAssertFloatEquals(line.size.width, 90);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 8);
        TKAssertEquals(line.runs[0].range.length, 3);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 90);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);

        // Too narrow for even a single word, not at start of string, should fall back to character wrapping
        frame = framesetter.createFrame(JSSize(90, 0), JSRange(1, attributedString.string.length - 1), 0, paragraphAttributes);
        TKAssertEquals(frame.lines.length, 3);
        TKAssertEquals(frame.range.location, 1);
        TKAssertEquals(frame.range.length, 10);
        TKAssertFloatEquals(frame.size.width, 90);
        TKAssertFloatEquals(frame.size.height, 49.21875);
        line = frame.lines[0];
        TKAssertEquals(line.range.location, 1);
        TKAssertEquals(line.range.length, 4);
        TKAssertFloatEquals(line.size.width, 80);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 1);
        TKAssertEquals(line.runs[0].range.length, 4);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 80);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
        line = frame.lines[1];
        TKAssertEquals(line.range.location, 5);
        TKAssertEquals(line.range.length, 3);
        TKAssertFloatEquals(line.size.width, 70);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 5);
        TKAssertEquals(line.runs[0].range.length, 3);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 70);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
        line = frame.lines[2];
        TKAssertEquals(line.range.location, 8);
        TKAssertEquals(line.range.length, 3);
        TKAssertFloatEquals(line.size.width, 90);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 8);
        TKAssertEquals(line.runs[0].range.length, 3);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 90);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);

        // Too narrow for even a single character
        frame = framesetter.createFrame(JSSize(10, 0), JSRange(0, attributedString.string.length), 0, paragraphAttributes);
        TKAssertEquals(frame.lines.length, 1);
        TKAssertEquals(frame.range.location, 0);
        TKAssertEquals(frame.range.length, 0);
        TKAssertFloatEquals(frame.size.width, 10);
        TKAssertFloatEquals(frame.size.height, 16.40625);
        line = frame.lines[0];
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 0);
        TKAssertFloatEquals(line.size.width, 0);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 0);
    },

    testWhitespaceAtEndOfLine: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.font] = JSTextFramesetterFontTests.init();
        var attributedString = JSAttributedString.initWithString('Testing          123', attributes);
        var framesetter = JSTextFramesetter.init();
        framesetter.attributedString = attributedString;
        var paragraphAttributes = {
            lineBreakMode: JSLineBreakMode.wordWrap,
            textAlignment: JSTextAlignment.left
        };
        var frame = framesetter.createFrame(JSSize(230, 0), JSRange(0, attributedString.string.length), 0, paragraphAttributes);
        TKAssertEquals(frame.lines.length, 2);
        TKAssertEquals(frame.range.location, 0);
        TKAssertEquals(frame.range.length, 20);
        TKAssertFloatEquals(frame.size.width, 230);
        TKAssertFloatEquals(frame.size.height, 32.81250);
        var line = frame.lines[0];
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 17);
        TKAssertFloatEquals(line.size.width, 450);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertFloatEquals(line.trailingWhitespaceWidth, 300);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 17);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 450);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
        line = frame.lines[1];
        TKAssertEquals(line.range.location, 17);
        TKAssertEquals(line.range.length, 3);
        TKAssertFloatEquals(line.size.width, 90);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 17);
        TKAssertEquals(line.runs[0].range.length, 3);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 90);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);

        // end of line whitespace split by an attribute run change
        attributedString.addAttributeInRange(JSAttributedString.Attribute.underline, true, JSRange(0, 12));
        framesetter.attributedString = attributedString;
        frame = framesetter.createFrame(JSSize(230, 0), JSRange(0, attributedString.string.length), 0, paragraphAttributes);
        TKAssertEquals(frame.lines.length, 2);
        TKAssertEquals(frame.range.location, 0);
        TKAssertEquals(frame.range.length, 20);
        TKAssertFloatEquals(frame.size.width, 230);
        TKAssertFloatEquals(frame.size.height, 32.81250);
        line = frame.lines[0];
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 17);
        TKAssertFloatEquals(line.size.width, 450);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertFloatEquals(line.trailingWhitespaceWidth, 300);
        TKAssertEquals(line.runs.length, 2);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 12);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 300);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
        TKAssertEquals(line.runs[1].range.location, 12);
        TKAssertEquals(line.runs[1].range.length, 5);
        TKAssertFloatEquals(line.runs[1].origin.x, 300);
        TKAssertFloatEquals(line.runs[1].origin.y, 0);
        TKAssertFloatEquals(line.runs[1].size.width, 150);
        TKAssertFloatEquals(line.runs[1].size.height, 16.40625);
        line = frame.lines[1];
        TKAssertEquals(line.range.location, 17);
        TKAssertEquals(line.range.length, 3);
        TKAssertFloatEquals(line.size.width, 90);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 17);
        TKAssertEquals(line.runs[0].range.length, 3);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 90);
        TKAssertFloatEquals(line.runs[0].size.height, 16.40625);
    },

    testTruncation: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.font] = JSTextFramesetterFontTests.init();
        var attributedString = JSAttributedString.initWithString('Testing 123', attributes);
        var framesetter = JSTextFramesetter.init();
        framesetter.attributedString = attributedString;
        var paragraphAttributes = {
            lineBreakMode: JSLineBreakMode.truncateTail,
            textAlignment: JSTextAlignment.left
        };
        var frame = framesetter.createFrame(JSSize(230, 0), JSRange(0, attributedString.string.length), 1, paragraphAttributes);
        TKAssertEquals(frame.lines.length, 1);
        TKAssertEquals(frame.range.location, 0);
        TKAssertEquals(frame.range.length, 9);
        TKAssertFloatEquals(frame.size.width, 230);
        TKAssertFloatEquals(frame.size.height, 16.40625);
        var line = frame.lines[0];
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 9);
        TKAssertFloatEquals(line.size.width, 220);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 9);

        // character fits, but needs to be removed for ellipsis
        frame = framesetter.createFrame(JSSize(240, 0), JSRange(0, attributedString.string.length), 1, paragraphAttributes);
        TKAssertEquals(frame.lines.length, 1);
        TKAssertEquals(frame.range.location, 0);
        TKAssertEquals(frame.range.length, 9);
        TKAssertFloatEquals(frame.size.width, 240);
        TKAssertFloatEquals(frame.size.height, 16.40625);
        line = frame.lines[0];
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 9);
        TKAssertFloatEquals(line.size.width, 220);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 9);

        // no room for a character, but room for ellipsis
        frame = framesetter.createFrame(JSSize(15, 0), JSRange(0, attributedString.string.length), 1, paragraphAttributes);
        TKAssertEquals(frame.lines.length, 1);
        TKAssertEquals(frame.range.location, 0);
        TKAssertEquals(frame.range.length, 0);
        TKAssertFloatEquals(frame.size.width, 15);
        TKAssertFloatEquals(frame.size.height, 16.40625);
        line = frame.lines[0];
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 0);
        TKAssertFloatEquals(line.size.width, 10);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 0);

        // no room for ellipsis
        frame = framesetter.createFrame(JSSize(5, 0), JSRange(0, attributedString.string.length), 1, paragraphAttributes);
        TKAssertEquals(frame.lines.length, 1);
        TKAssertEquals(frame.range.location, 0);
        TKAssertEquals(frame.range.length, 0);
        TKAssertFloatEquals(frame.size.width, 5);
        TKAssertFloatEquals(frame.size.height, 16.40625);
        line = frame.lines[0];
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 0);
        TKAssertFloatEquals(line.size.width, 0);
        TKAssertFloatEquals(line.size.height, 16.40625);

        // preserve trailing whitespace
        frame = framesetter.createFrame(JSSize(200, 0), JSRange(0, attributedString.string.length), 1, paragraphAttributes);
        TKAssertEquals(frame.lines.length, 1);
        TKAssertEquals(frame.range.location, 0);
        TKAssertEquals(frame.range.length, 8);
        TKAssertFloatEquals(frame.size.width, 200);
        TKAssertFloatEquals(frame.size.height, 16.40625);
        line = frame.lines[0];
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 8);
        TKAssertFloatEquals(line.size.width, 190);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 8);

        // truncation at run change
        attributedString.addAttributeInRange(JSAttributedString.Attribute.underline, true, JSRange(0, 4));
        framesetter.attributedString = attributedString;
        frame = framesetter.createFrame(JSSize(90, 0), JSRange(0, attributedString.string.length), 1, paragraphAttributes);
        TKAssertEquals(frame.lines.length, 1);
        TKAssertEquals(frame.range.location, 0);
        TKAssertEquals(frame.range.length, 3);
        TKAssertFloatEquals(frame.size.width, 90);
        TKAssertFloatEquals(frame.size.height, 16.40625);
        line = frame.lines[0];
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 3);
        TKAssertFloatEquals(line.size.width, 80);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 3);

        // truncation after run change (first char of new run doesn't fit)
        attributedString.addAttributeInRange(JSAttributedString.Attribute.underline, true, JSRange(0, 4));
        framesetter.attributedString = attributedString;
        frame = framesetter.createFrame(JSSize(100, 0), JSRange(0, attributedString.string.length), 1, paragraphAttributes);
        TKAssertEquals(frame.lines.length, 1);
        TKAssertEquals(frame.range.location, 0);
        TKAssertEquals(frame.range.length, 4);
        TKAssertFloatEquals(frame.size.width, 100);
        TKAssertFloatEquals(frame.size.height, 16.40625);
        line = frame.lines[0];
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 4);
        TKAssertFloatEquals(line.size.width, 100);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 4);

        // truncation after run change (first char of new run fits, but ellipsis should take on style of old run)
        attributedString.addAttributeInRange(JSAttributedString.Attribute.underline, true, JSRange(0, 4));
        framesetter.attributedString = attributedString;
        frame = framesetter.createFrame(JSSize(110, 0), JSRange(0, attributedString.string.length), 1, paragraphAttributes);
        TKAssertEquals(frame.lines.length, 1);
        TKAssertEquals(frame.range.location, 0);
        TKAssertEquals(frame.range.length, 4);
        TKAssertFloatEquals(frame.size.width, 110);
        TKAssertFloatEquals(frame.size.height, 16.40625);
        line = frame.lines[0];
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 4);
        TKAssertFloatEquals(line.size.width, 100);
        TKAssertFloatEquals(line.size.height, 16.40625);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 4);

        // second line truncation, max lines constrained
        attributedString = JSAttributedString.initWithString('Testing truncation at end of the second line', attributes);
        framesetter.attributedString = attributedString;
        frame = framesetter.createFrame(JSSize(430, 0), JSRange(0, attributedString.string.length), 2, paragraphAttributes);
        TKAssertEquals(frame.lines.length, 2);
        TKAssertEquals(frame.range.location, 0);
        TKAssertEquals(frame.range.length, 38);
        TKAssertFloatEquals(frame.size.width, 430);
        TKAssertFloatEquals(frame.size.height, 32.81250);
        line = frame.lines[0];
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 19);
        TKAssertFloatEquals(line.size.width, 410);
        TKAssertFloatEquals(line.size.height, 16.40625);
        line = frame.lines[1];
        TKAssertEquals(line.range.location, 19);
        TKAssertEquals(line.range.length, 19);
        TKAssertFloatEquals(line.size.width, 430);
        TKAssertFloatEquals(line.size.height, 16.40625);

        // second line truncation, height constrained
        attributedString = JSAttributedString.initWithString('Testing truncation at end of the second line', attributes);
        framesetter.attributedString = attributedString;
        frame = framesetter.createFrame(JSSize(430, 33), JSRange(0, attributedString.string.length), 0, paragraphAttributes);
        TKAssertEquals(frame.lines.length, 2);
        TKAssertEquals(frame.range.location, 0);
        TKAssertEquals(frame.range.length, 38);
        TKAssertFloatEquals(frame.size.width, 430);
        TKAssertFloatEquals(frame.size.height, 33);
        line = frame.lines[0];
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 19);
        TKAssertFloatEquals(line.size.width, 410);
        TKAssertFloatEquals(line.size.height, 16.40625);
        line = frame.lines[1];
        TKAssertEquals(line.range.location, 19);
        TKAssertEquals(line.range.length, 19);
        TKAssertFloatEquals(line.size.width, 430);
        TKAssertFloatEquals(line.size.height, 16.40625);
    }

    // TODO: maximum lines
    // TODO: height restriction

});

JSClass("JSTextFramesetterFontTests", JSFont, {

    init: function(){
        this._descriptor = JSFontDescriptor.initWithProperties("JSTextFramesetterFontTests", JSFont.Weight.regular, JSFont.Style.normal);
        this._fullName = "JSTextFramesetterFontTests";
        this._postScriptName = "JSTextFramesetterFontTests";
        this._faceName = "JSTextFramesetterFontTests";
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