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

JSClass("JSTextLineTests", TKTestSuite, {

    _glyphsFromString: function(str, font){
        var iterator = str.unicodeIterator();
        var glyphs = [];
        var lengths = [];
        while (iterator.character !== null){
            glyphs.push(font.glyphForCharacter(iterator.character));
            lengths.push(iterator.nextIndex - iterator.index);
            iterator.increment();
        }
        return {glyphs: glyphs, lengths: lengths};
    },

    testInitWithRuns: function(){
        var font = JSFont.initWithDescriptor(JSTestFontDescriptor.initWithName("Test"), 14.0);
        var glyphs = this._glyphsFromString("This is a test", font);
        var run1 = JSTextRun.initWithGlyphs(glyphs.glyphs, glyphs.lengths, font, {}, JSRange(12, 14));
        glyphs = this._glyphsFromString(" of a text line", font);
        var run2 = JSTextRun.initWithGlyphs(glyphs.glyphs, glyphs.lengths, font, {}, JSRange(26, 15));
        var line = JSTextLine.initWithRuns([run1, run2], 0);

        TKAssertEquals(line.runs.length, 2);
        TKAssertEquals(line.origin.x, 0);
        TKAssertEquals(line.origin.y, 0);
        TKAssertEquals(line.range.location, 12);
        TKAssertEquals(line.range.length, 29);
        TKAssertEquals(line.size.height, 16.40625);
        TKAssertEquals(line.size.width, 660);
        TKAssertEquals(line.trailingWhitespaceWidth, 0);

        TKAssertEquals(line.runs[0].origin.x, 0);
        TKAssertEquals(line.runs[0].origin.y, 0);
        TKAssertEquals(line.runs[1].origin.x, 320);
        TKAssertEquals(line.runs[1].origin.y, 0);
    },

    testInitWithHeight: function(){
        var font = JSFont.initWithDescriptor(JSTestFontDescriptor.initWithName("Test"), 14.0);
        var line = JSTextLine.initWithHeight(font.lineHeight, -font.descender, 12);

        TKAssertEquals(line.runs.length, 0);
        TKAssertEquals(line.origin.x, 0);
        TKAssertEquals(line.origin.y, 0);
        TKAssertEquals(line.range.location, 12);
        TKAssertEquals(line.range.length, 0);
        TKAssertEquals(line.size.height, 16.40625);
        TKAssertEquals(line.size.width, 0);
        TKAssertEquals(line.trailingWhitespaceWidth, 0);
    },

    testCopy: function(){
        var font = JSFont.initWithDescriptor(JSTestFontDescriptor.initWithName("Test"), 14.0);
        var glyphs = this._glyphsFromString("This is a test", font);
        var run1 = JSTextRun.initWithGlyphs(glyphs.glyphs, glyphs.lengths, font, {}, JSRange(12, 14));
        glyphs = this._glyphsFromString(" of a text line", font);
        var run2 = JSTextRun.initWithGlyphs(glyphs.glyphs, glyphs.lengths, font, {}, JSRange(26, 15));
        var line = JSTextLine.initWithRuns([run1, run2], 0);

        var line2 = line.copy();
        TKAssertEquals(line2.runs.length, 2);
        TKAssertEquals(line2.origin.x, 0);
        TKAssertEquals(line2.origin.y, 0);
        TKAssertEquals(line2.range.location, 12);
        TKAssertEquals(line2.range.length, 29);
        TKAssertEquals(line2.size.height, 16.40625);
        TKAssertEquals(line2.size.width, 660);

        TKAssertEquals(line2.runs[0].origin.x, 0);
        TKAssertEquals(line2.runs[0].origin.y, 0);
        TKAssertEquals(line2.runs[1].origin.x, 320);
        TKAssertEquals(line2.runs[1].origin.y, 0);

    },

    testCharacterIndexAtPoint: function(){
        var font = JSFont.initWithDescriptor(JSTestFontDescriptor.initWithName("Test"), 14.0);
        var glyphs = this._glyphsFromString("This is a test", font);
        var run1 = JSTextRun.initWithGlyphs(glyphs.glyphs, glyphs.lengths, font, {}, JSRange(12, 14));
        glyphs = this._glyphsFromString(" of a text line", font);
        var run2 = JSTextRun.initWithGlyphs(glyphs.glyphs, glyphs.lengths, font, {}, JSRange(26, 15));
        var line = JSTextLine.initWithRuns([run1, run2], 0);

        // start
        var index = line.characterIndexAtPoint(JSPoint(0, 0));
        TKAssertEquals(index, 12);

        // not halfway through char
        index = line.characterIndexAtPoint(JSPoint(5, 5));
        TKAssertEquals(index, 12);

        // exactly halfway through char
        index = line.characterIndexAtPoint(JSPoint(15, 5));
        TKAssertEquals(index, 13);

        // more than halfway through char
        index = line.characterIndexAtPoint(JSPoint(16, 5));
        TKAssertEquals(index, 13);

        // middle run 1
        index = line.characterIndexAtPoint(JSPoint(140, 0));
        TKAssertEquals(index, 18);

        // not halfway through char
        index = line.characterIndexAtPoint(JSPoint(145, 5));
        TKAssertEquals(index, 18);

        // exactly halfway through char
        index = line.characterIndexAtPoint(JSPoint(150, 5));
        TKAssertEquals(index, 19);

        // more than halfway through char
        index = line.characterIndexAtPoint(JSPoint(151, 5));
        TKAssertEquals(index, 19);

        // end run1
        index = line.characterIndexAtPoint(JSPoint(300, 0));
        TKAssertEquals(index, 25);

        // not halfway through char
        index = line.characterIndexAtPoint(JSPoint(305, 5));
        TKAssertEquals(index, 25);

        // exactly halfway through final char of run 1
        index = line.characterIndexAtPoint(JSPoint(310, 5));
        TKAssertEquals(index, 26);

        // more than halfway through final char of run 1
        index = line.characterIndexAtPoint(JSPoint(311, 5));
        TKAssertEquals(index, 26);

        // start of run 2
        index = line.characterIndexAtPoint(JSPoint(320, 5));
        TKAssertEquals(index, 26);

        // mid run 2
        index = line.characterIndexAtPoint(JSPoint(490, 5));
        TKAssertEquals(index, 33);

        index = line.characterIndexAtPoint(JSPoint(495, 5));
        TKAssertEquals(index, 33);

        index = line.characterIndexAtPoint(JSPoint(500, 5));
        TKAssertEquals(index, 34);

        index = line.characterIndexAtPoint(JSPoint(505, 5));
        TKAssertEquals(index, 34);

        // past end of line
        index = line.characterIndexAtPoint(JSPoint(1000, 5));
        TKAssertEquals(index, 41);
    },

    testRectForCharacterAtIndex: function(){
        var font = JSFont.initWithDescriptor(JSTestFontDescriptor.initWithName("Test"), 14.0);
        var glyphs = this._glyphsFromString("This is a test", font);
        var run1 = JSTextRun.initWithGlyphs(glyphs.glyphs, glyphs.lengths, font, {}, JSRange(12, 14));
        glyphs = this._glyphsFromString(" of a text line", font);
        var run2 = JSTextRun.initWithGlyphs(glyphs.glyphs, glyphs.lengths, font, {}, JSRange(26, 15));
        var line = JSTextLine.initWithRuns([run1, run2], 0);

        // 0
        var rect = line.rectForCharacterAtIndex(12);
        TKAssertFloatEquals(rect.origin.x, 0);
        TKAssertFloatEquals(rect.origin.y, 0);
        TKAssertFloatEquals(rect.size.width, 30);
        TKAssertFloatEquals(rect.size.height, 16.40625);

        // mid
        rect = line.rectForCharacterAtIndex(17);
        TKAssertFloatEquals(rect.origin.x, 120);
        TKAssertFloatEquals(rect.origin.y, 0);
        TKAssertFloatEquals(rect.size.width, 20);
        TKAssertFloatEquals(rect.size.height, 16.40625);

        // start of run 1
        rect = line.rectForCharacterAtIndex(25);
        TKAssertFloatEquals(rect.origin.x, 300);
        TKAssertFloatEquals(rect.origin.y, 0);
        TKAssertFloatEquals(rect.size.width, 20);
        TKAssertFloatEquals(rect.size.height, 16.40625);

        // start of run 2
        rect = line.rectForCharacterAtIndex(26);
        TKAssertFloatEquals(rect.origin.x, 320);
        TKAssertFloatEquals(rect.origin.y, 0);
        TKAssertFloatEquals(rect.size.width, 30);
        TKAssertFloatEquals(rect.size.height, 16.40625);

        // mid of run 2
        rect = line.rectForCharacterAtIndex(33);
        TKAssertFloatEquals(rect.origin.x, 490);
        TKAssertFloatEquals(rect.origin.y, 0);
        TKAssertFloatEquals(rect.size.width, 20);
        TKAssertFloatEquals(rect.size.height, 16.40625);

        // past end
        rect = line.rectForCharacterAtIndex(52);
        TKAssertFloatEquals(rect.origin.x, 660);
        TKAssertFloatEquals(rect.origin.y, 0);
        TKAssertFloatEquals(rect.size.width, 0);
        TKAssertFloatEquals(rect.size.height, 16.40625);
    },

    testRectForCharacterAtIndexEmptyLine: function(){
        var font = JSFont.initWithDescriptor(JSTestFontDescriptor.initWithName("Test"), 14.0);
        var line = JSTextLine.initWithHeight(font.lineHeight, - font.descender, 12);

        // mid of run 2
        var rect = line.rectForCharacterAtIndex(0);
        TKAssertFloatEquals(rect.origin.x, 0);
        TKAssertFloatEquals(rect.origin.y, 0);
        TKAssertFloatEquals(rect.size.width, 0);
        TKAssertFloatEquals(rect.size.height, 16.40625);

        // past end
        rect = line.rectForCharacterAtIndex(10);
        TKAssertFloatEquals(rect.origin.x, 0);
        TKAssertFloatEquals(rect.origin.y, 0);
        TKAssertFloatEquals(rect.size.width, 0);
        TKAssertFloatEquals(rect.size.height, 16.40625);

    },

    testTruncatedLine: function(){
        var font = JSFont.initWithDescriptor(JSTestFontDescriptor.initWithName("Test"), 14.0);
        var glyphs = this._glyphsFromString("This is a test", font);
        var run1 = JSTextRun.initWithGlyphs(glyphs.glyphs, glyphs.lengths, font, {}, JSRange(12, 14));
        glyphs = this._glyphsFromString(" of a text line", font);
        var run2 = JSTextRun.initWithGlyphs(glyphs.glyphs, glyphs.lengths, font, {}, JSRange(26, 15));
        var line = JSTextLine.initWithRuns([run1, run2], 0);

        // no need to truncate
        var truncated = line.truncatedLine(670);
        TKAssertEquals(truncated.size.width, 660);
        TKAssertEquals(truncated.range.location, 12);
        TKAssertEquals(truncated.range.length, 29);

        // need to pop a character
        truncated = line.truncatedLine(659);
        TKAssertEquals(truncated.size.width, 650);
        TKAssertEquals(truncated.range.location, 12);
        TKAssertEquals(truncated.range.length, 28);

        // need to pop entire second run
        truncated = line.truncatedLine(330);
        TKAssertEquals(truncated.size.width, 330);
        TKAssertEquals(truncated.range.location, 12);
        TKAssertEquals(truncated.range.length, 14);

        // need to pop into first run
        truncated = line.truncatedLine(320);
        TKAssertEquals(truncated.size.width, 310);
        TKAssertEquals(truncated.range.location, 12);
        TKAssertEquals(truncated.range.length, 13);

        // room for only ellipsis
        truncated = line.truncatedLine(15);
        TKAssertEquals(truncated.size.width, 10);
        TKAssertEquals(truncated.range.location, 12);
        TKAssertEquals(truncated.range.length, 0);

        // no room for even ellipsis
        truncated = line.truncatedLine(5);
        TKAssertEquals(truncated.size.width, 0);
        TKAssertEquals(truncated.range.location, 12);
        TKAssertEquals(truncated.range.length, 0);
    }

});