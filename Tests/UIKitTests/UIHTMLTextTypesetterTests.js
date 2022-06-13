// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #import Foundation
// #import TestKit
'use strict';

JSClass("UIHTMLTextTypesetterTests", TKTestSuite, {

    requiredEnvironment: "html",

    testCreateLineSingleRun: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.font] = JSFont.initWithDescriptor(JSTestFontDescriptor.initWithName("Test"), 14.0);
        var attributedString = JSAttributedString.initWithString('Testing 123', attributes);
        var typesetter = UIHTMLTextTypesetter.initWithDocument(document, null);
        typesetter.canvasContext = UIHTMLTextTypesetterMockCanvasContext.init();
        typesetter.attributedString = attributedString;
        var line = typesetter.createLine(JSRange(0, attributedString.string.length));
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 11);
        TKAssertEquals(line.size.width, 270);
        TKAssertEquals(line.size.height, 16);
        TKAssertEquals(line.trailingWhitespaceWidth, 0);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 11);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 270);
        TKAssertFloatEquals(line.runs[0].size.height, 16);
        TKAssertEquals(line.element.nodeName.toLowerCase(), "div");
        TKAssertExactEquals(line.runs[0].element.parentNode, line.element);
        TKAssertEquals(line.runs[0].element.nodeName.toLowerCase(), "span");
        TKAssert(line.runs[0].element.style.fontFamily === "Test" || line.runs[0].element.style.fontFamily  === '"Test"');
        TKAssertEquals(line.runs[0].element.style.fontSize, "14px");
        TKAssertEquals(line.runs[0].element.style.lineHeight, "16px");
        TKAssertEquals(line.runs[0].textNode.nodeValue, "Testing 123");
        TKAssertExactEquals(line.runs[0].textNode.parentNode, line.runs[0].element);

        // partial range
        line = typesetter.createLine(JSRange(3, 6));
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 3);
        TKAssertEquals(line.range.length, 6);
        TKAssertEquals(line.size.width, 140);
        TKAssertEquals(line.size.height, 16);
        TKAssertEquals(line.trailingWhitespaceWidth, 0);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 3);
        TKAssertEquals(line.runs[0].range.length, 6);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 140);
        TKAssertFloatEquals(line.runs[0].size.height, 16);
    },

    testCreateLineMultipleRun: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.font] = JSFont.initWithDescriptor(JSTestFontDescriptor.initWithName("Test"), 14.0);
        var attributedString = JSAttributedString.initWithString('Testing 123', attributes);
        attributedString.addAttributeInRange('underline', true, JSRange(3, 6));
        var typesetter = UIHTMLTextTypesetter.initWithDocument(document, null);
        typesetter.canvasContext = UIHTMLTextTypesetterMockCanvasContext.init();
        typesetter.attributedString = attributedString;
        var line = typesetter.createLine(JSRange(0, attributedString.string.length));
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 11);
        TKAssertEquals(line.size.width, 270);
        TKAssertEquals(line.size.height, 16);
        TKAssertEquals(line.trailingWhitespaceWidth, 0);
        TKAssertEquals(line.runs.length, 3);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 3);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 70);
        TKAssertFloatEquals(line.runs[0].size.height, 16);
        TKAssertEquals(line.runs[1].range.location, 3);
        TKAssertEquals(line.runs[1].range.length, 6);
        TKAssertFloatEquals(line.runs[1].origin.x, 70);
        TKAssertFloatEquals(line.runs[1].origin.y, 0);
        TKAssertFloatEquals(line.runs[1].size.width, 140);
        TKAssertFloatEquals(line.runs[1].size.height, 16);
        TKAssertEquals(line.runs[2].range.location, 9);
        TKAssertEquals(line.runs[2].range.length, 2);
        TKAssertFloatEquals(line.runs[2].origin.x, 210);
        TKAssertFloatEquals(line.runs[2].origin.y, 0);
        TKAssertFloatEquals(line.runs[2].size.width, 60);
        TKAssertFloatEquals(line.runs[2].size.height, 16);

        // partial range
        line = typesetter.createLine(JSRange(4, 6));
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 4);
        TKAssertEquals(line.range.length, 6);
        TKAssertEquals(line.size.width, 150);
        TKAssertEquals(line.size.height, 16);
        TKAssertEquals(line.runs.length, 2);
        TKAssertEquals(line.runs[0].range.location, 4);
        TKAssertEquals(line.runs[0].range.length, 5);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 120);
        TKAssertFloatEquals(line.runs[0].size.height, 16);
        TKAssertEquals(line.runs[1].range.location, 9);
        TKAssertEquals(line.runs[1].range.length, 1);
        TKAssertFloatEquals(line.runs[1].origin.x, 120);
        TKAssertFloatEquals(line.runs[1].origin.y, 0);
        TKAssertFloatEquals(line.runs[1].size.width, 30);
        TKAssertFloatEquals(line.runs[1].size.height, 16);
    },

    testCreateLineEmpty: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.font] = JSFont.initWithDescriptor(JSTestFontDescriptor.initWithName("Test"), 14.0);
        var attributedString = JSAttributedString.initWithString('', attributes);
        var typesetter = UIHTMLTextTypesetter.initWithDocument(document, null);
        typesetter.canvasContext = UIHTMLTextTypesetterMockCanvasContext.init();
        typesetter.attributedString = attributedString;
        var line = typesetter.createLine(JSRange(0, attributedString.string.length));
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 0);
        TKAssertEquals(line.size.width, 0);
        TKAssertEquals(line.size.height, 16);
        TKAssertEquals(line.trailingWhitespaceWidth, 0);
        TKAssertEquals(line.runs.length, 0);
    },

    testCreateLineNewline: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.font] = JSFont.initWithDescriptor(JSTestFontDescriptor.initWithName("Test"), 14.0);
        var attributedString = JSAttributedString.initWithString('\n', attributes);
        var typesetter = UIHTMLTextTypesetter.initWithDocument(document, null);
        typesetter.canvasContext = UIHTMLTextTypesetterMockCanvasContext.init();
        typesetter.attributedString = attributedString;
        var line = typesetter.createLine(JSRange(0, attributedString.string.length));
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 1);
        TKAssertEquals(line.size.width, 0);
        TKAssertEquals(line.size.height, 16);
        TKAssertEquals(line.trailingWhitespaceWidth, 0);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 1);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 0);
        TKAssertFloatEquals(line.runs[0].size.height, 16);
    },

    testCreateLineTrailingWhitespace: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.font] = JSFont.initWithDescriptor(JSTestFontDescriptor.initWithName("Test"), 14.0);
        var attributedString = JSAttributedString.initWithString('Testing 123   ', attributes);
        var typesetter = UIHTMLTextTypesetter.initWithDocument(document, null);
        typesetter.canvasContext = UIHTMLTextTypesetterMockCanvasContext.init();
        typesetter.attributedString = attributedString;
        var line = typesetter.createLine(JSRange(0, attributedString.string.length));
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 14);
        TKAssertEquals(line.size.width, 360);
        TKAssertEquals(line.size.height, 16);
        TKAssertEquals(line.trailingWhitespaceWidth, 90);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 14);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 360);
        TKAssertFloatEquals(line.runs[0].size.height, 16);

        // with newline
        attributedString = JSAttributedString.initWithString('Testing 123  \n', attributes);
        typesetter.attributedString = attributedString;
        line = typesetter.createLine(JSRange(0, attributedString.string.length));
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 14);
        TKAssertEquals(line.size.width, 330);
        TKAssertEquals(line.size.height, 16);
        TKAssertEquals(line.trailingWhitespaceWidth, 60);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 14);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 330);
        TKAssertFloatEquals(line.runs[0].size.height, 16);

        // TODO: non-0x20 whitespace
    },

    testCreateLineWhitespace: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.font] = JSFont.initWithDescriptor(JSTestFontDescriptor.initWithName("Test"), 14.0);
        var attributedString = JSAttributedString.initWithString('   ', attributes);
        var typesetter = UIHTMLTextTypesetter.initWithDocument(document, null);
        typesetter.canvasContext = UIHTMLTextTypesetterMockCanvasContext.init();
        typesetter.attributedString = attributedString;
        var line = typesetter.createLine(JSRange(0, attributedString.string.length));
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 3);
        TKAssertEquals(line.size.width, 90);
        TKAssertEquals(line.size.height, 16);
        TKAssertEquals(line.trailingWhitespaceWidth, 90);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 3);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 90);
        TKAssertFloatEquals(line.runs[0].size.height, 16);

        // with newline
        attributedString = JSAttributedString.initWithString('  \n', attributes);
        typesetter.attributedString = attributedString;
        line = typesetter.createLine(JSRange(0, attributedString.string.length));
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 3);
        TKAssertEquals(line.size.width, 60);
        TKAssertEquals(line.size.height, 16);
        TKAssertEquals(line.trailingWhitespaceWidth, 60);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 3);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 60);
        TKAssertFloatEquals(line.runs[0].size.height, 16);

        // TODO: non-0x20 whitespace
    },

    testSuggestLineBreakInRange: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.font] = JSFont.initWithDescriptor(JSTestFontDescriptor.initWithName("Test"), 14.0);
        var typesetter = UIHTMLTextTypesetter.initWithDocument(document, null);
        typesetter.canvasContext = UIHTMLTextTypesetterMockCanvasContext.init();

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
        attributes[JSAttributedString.Attribute.font] = JSFont.initWithDescriptor(JSTestFontDescriptor.initWithName("Test"), 14.0);
        var typesetter = UIHTMLTextTypesetter.initWithDocument(document, null);
        typesetter.canvasContext = UIHTMLTextTypesetterMockCanvasContext.init();

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
        attributes[JSAttributedString.Attribute.font] = JSFont.initWithDescriptor(JSTestFontDescriptor.initWithName("Test"), 14.0);
        var typesetter = UIHTMLTextTypesetter.initWithDocument(document, null);
        typesetter.canvasContext = UIHTMLTextTypesetterMockCanvasContext.init();
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
        attributes[JSAttributedString.Attribute.font] = JSFont.initWithDescriptor(JSTestFontDescriptor.initWithName("Test"), 14.0);
        var typesetter = UIHTMLTextTypesetter.initWithDocument(document, null);
        typesetter.canvasContext = UIHTMLTextTypesetterMockCanvasContext.init();
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

    testMaskCharacter: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.font] = JSFont.initWithDescriptor(JSTestFontDescriptor.initWithName("Test"), 14.0);
        attributes[JSAttributedString.Attribute.maskCharacter] = "*";
        var attributedString = JSAttributedString.initWithString('Testing 123', attributes);
        var typesetter = UIHTMLTextTypesetter.initWithDocument(document, null);
        typesetter.canvasContext = UIHTMLTextTypesetterMockCanvasContext.init();
        typesetter.attributedString = attributedString;
        var line = typesetter.createLine(JSRange(0, attributedString.string.length));
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 11);
        TKAssertEquals(line.size.width, 330);
        TKAssertEquals(line.size.height, 16);
        TKAssertEquals(line.trailingWhitespaceWidth, 0);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 11);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 330);
        TKAssertFloatEquals(line.runs[0].size.height, 16);
        TKAssertEquals(line.element.nodeName.toLowerCase(), "div");
        TKAssertExactEquals(line.runs[0].element.parentNode, line.element);
        TKAssertEquals(line.runs[0].element.nodeName.toLowerCase(), "span");
        TKAssert(line.runs[0].element.style.fontFamily === "Test" || line.runs[0].element.style.fontFamily  === '"Test"');
        TKAssertEquals(line.runs[0].element.style.fontSize, "14px");
        TKAssertEquals(line.runs[0].element.style.lineHeight, "16px");
        TKAssertEquals(line.runs[0].textNode.nodeValue, "***********");
        TKAssertExactEquals(line.runs[0].textNode.parentNode, line.runs[0].element);

        attributes = {};
        attributes[JSAttributedString.Attribute.font] = JSFont.initWithDescriptor(JSTestFontDescriptor.initWithName("Test"), 14.0);
        attributes[JSAttributedString.Attribute.maskCharacter] = "😀";
        attributedString = JSAttributedString.initWithString('Testing 123', attributes);
        typesetter = UIHTMLTextTypesetter.initWithDocument(document, null);
        typesetter.canvasContext = UIHTMLTextTypesetterMockCanvasContext.init();
        typesetter.attributedString = attributedString;
        line = typesetter.createLine(JSRange(0, attributedString.string.length));
        TKAssertNotNull(line);
        TKAssertEquals(line.range.location, 0);
        TKAssertEquals(line.range.length, 11);
        TKAssertEquals(line.size.width, 220);
        TKAssertEquals(line.size.height, 16);
        TKAssertEquals(line.trailingWhitespaceWidth, 0);
        TKAssertEquals(line.runs.length, 1);
        TKAssertEquals(line.runs[0].range.location, 0);
        TKAssertEquals(line.runs[0].range.length, 11);
        TKAssertFloatEquals(line.runs[0].origin.x, 0);
        TKAssertFloatEquals(line.runs[0].origin.y, 0);
        TKAssertFloatEquals(line.runs[0].size.width, 220);
        TKAssertFloatEquals(line.runs[0].size.height, 16);
        TKAssertEquals(line.element.nodeName.toLowerCase(), "div");
        TKAssertExactEquals(line.runs[0].element.parentNode, line.element);
        TKAssertEquals(line.runs[0].element.nodeName.toLowerCase(), "span");
        TKAssert(line.runs[0].element.style.fontFamily === "Test" || line.runs[0].element.style.fontFamily  === '"Test"');
        TKAssertEquals(line.runs[0].element.style.fontSize, "14px");
        TKAssertEquals(line.runs[0].element.style.lineHeight, "16px");
        TKAssertEquals(line.runs[0].textNode.nodeValue, "😀😀😀😀😀😀😀😀😀😀😀");
        TKAssertExactEquals(line.runs[0].textNode.parentNode, line.runs[0].element);
    },

    testAttachment: function(){
        var attributes = {};
        attributes[JSAttributedString.Attribute.font] = JSFont.initWithDescriptor(JSTestFontDescriptor.initWithName("Test"), 14.0);
        var typesetter = UIHTMLTextTypesetter.initWithDocument(document, null);
        typesetter.canvasContext = UIHTMLTextTypesetterMockCanvasContext.init();
        var attributedString = JSAttributedString.initWithString('Testing  attachment runs', attributes);
        var image = JSImage.initWithResourceName("attachment", JSBundle.testBundle);
        var attachment = JSTextAttachment.initWithImage(image);
        var attachmentString = JSAttributedString.initWithAttachment(attachment);
        attachmentString.addAttributeInRange(JSAttributedString.Attribute.font, attributes.font, JSRange(0, attachmentString.string.length));
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
        TKAssertEquals(line.runs[1].origin.y, 3);
        TKAssertEquals(line.runs[1].size.width, 15);
        TKAssertEquals(line.runs[1].size.height, 10);
        TKAssertEquals(line.runs[2].origin.x, 195);
        TKAssertEquals(line.runs[2].origin.y, 0);
        TKAssertEquals(line.runs[2].range.location, 9);
        TKAssertEquals(line.runs[2].range.length, 16);
        TKAssertExactEquals(line.attachmentRuns.length, 1);
        TKAssertExactEquals(line.attachmentRuns[0], line.runs[1]);
        TKAssertExactEquals(line.attachmentRuns[0].attachment, attachment);
    },

    // TODO: more multi-run tests
    // TODO: non whitespace word breaks (unicode)
    // TODO: non 0x20 whitespace (unicode)
    // TODO: combining marks (unicode)

});

JSClass("UIHTMLTextTypesetterMockCanvasContext", JSObject, {

    init: function(){
        this.measureText.calls = [];
    },

    font: JSDynamicProperty(),

    getFont: function(){
        return this._font;
    },

    setFont: function(font){
        this._font = font;
        var parts = this.font.split(" ");
        var weight = parseInt(parts.shift());
        var style = parts.shift();
        var size = parts.shift();
        var pointSize = parseFloat(size.split("/")[0]);
        var family = parts.shift();
        var descriptor = JSTestFontDescriptor.initWithName(family);
        this._jsFont = JSFont.initWithDescriptor(descriptor, pointSize);
    },

    _font: null,
    _jsFont: null,

    measureText: function(text){
        this.measureText.calls.push({text: text, font: this.font});
        var width = 0;

        for (var iterator = text.unicodeIterator(); iterator.character !== null; iterator.increment()){
            var glyph = this._jsFont.glyphForCharacter(iterator.character);
            width += this._jsFont.widthOfGlyph(glyph);
        }
        return {
            width: width
        };
    },

});

