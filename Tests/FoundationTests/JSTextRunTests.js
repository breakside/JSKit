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

JSClass("JSTextRunTests", TKTestSuite, {

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

    testInitWithGlyphs: function(){
        var font = JSFont.initWithDescriptor(JSTestFontDescriptor.initWithName("Test"), 14.0);
        var glyphs = this._glyphsFromString("This is a test", font);
        var run = JSTextRun.initWithGlyphs(glyphs.glyphs, glyphs.lengths, font, {}, JSRange(12, 14));

        TKAssertEquals(run.origin.x, 0);
        TKAssertEquals(run.origin.y, 0);
        TKAssertEquals(run.range.location, 12);
        TKAssertEquals(run.range.length, 14);
        TKAssertEquals(run.size.width, 320);
        TKAssertEquals(run.size.height, 16.40625);
        TKAssertEquals(run.glyphs.length, 14);
    },

    testCopy: function(){
        var font = JSFont.initWithDescriptor(JSTestFontDescriptor.initWithName("Test"), 14.0);
        var glyphs = this._glyphsFromString("This is a test", font);
        var run = JSTextRun.initWithGlyphs(glyphs.glyphs, glyphs.lengths, font, {}, JSRange(12, 14));

        var run2 = run.copy();
        TKAssertEquals(run2.origin.x, 0);
        TKAssertEquals(run2.origin.y, 0);
        TKAssertEquals(run2.range.location, 12);
        TKAssertEquals(run2.range.length, 14);
        TKAssertEquals(run2.size.width, 320);
        TKAssertEquals(run2.size.height, 16.40625);
        TKAssertEquals(run2.glyphs.length, 14);
    },

    testCharacterIndexAtPoint: function(){
        var font = JSFont.initWithDescriptor(JSTestFontDescriptor.initWithName("Test"), 14.0);
        var glyphs = this._glyphsFromString("This is a test", font);
        var run = JSTextRun.initWithGlyphs(glyphs.glyphs, glyphs.lengths, font, {}, JSRange(12, 14));

        // start
        var index = run.characterIndexAtPoint(JSPoint(0, 0));
        TKAssertEquals(index, 12);

        // not halfway through char
        index = run.characterIndexAtPoint(JSPoint(5, 5));
        TKAssertEquals(index, 12);

        // exactly halfway through char
        index = run.characterIndexAtPoint(JSPoint(15, 5));
        TKAssertEquals(index, 13);

        // more than halfway through char
        index = run.characterIndexAtPoint(JSPoint(16, 5));
        TKAssertEquals(index, 13);

        // middle
        index = run.characterIndexAtPoint(JSPoint(140, 0));
        TKAssertEquals(index, 18);

        // not halfway through char
        index = run.characterIndexAtPoint(JSPoint(145, 5));
        TKAssertEquals(index, 18);

        // exactly halfway through char
        index = run.characterIndexAtPoint(JSPoint(150, 5));
        TKAssertEquals(index, 19);

        // more than halfway through char
        index = run.characterIndexAtPoint(JSPoint(151, 5));
        TKAssertEquals(index, 19);

        // end
        index = run.characterIndexAtPoint(JSPoint(300, 0));
        TKAssertEquals(index, 25);

        // not halfway through char
        index = run.characterIndexAtPoint(JSPoint(305, 5));
        TKAssertEquals(index, 25);

        // exactly halfway through char
        index = run.characterIndexAtPoint(JSPoint(310, 5));
        TKAssertEquals(index, 26);

        // more than halfway through char
        index = run.characterIndexAtPoint(JSPoint(311, 5));
        TKAssertEquals(index, 26);

        // very end
        index = run.characterIndexAtPoint(JSPoint(320, 5));
        TKAssertEquals(index, 26);

        // past end
        index = run.characterIndexAtPoint(JSPoint(400, 5));
        TKAssertEquals(index, 26);
    },

    testRectForCharacterAtIndex: function(){
        var font = JSFont.initWithDescriptor(JSTestFontDescriptor.initWithName("Test"), 14.0);
        var glyphs = this._glyphsFromString("This is a test", font);
        var run = JSTextRun.initWithGlyphs(glyphs.glyphs, glyphs.lengths, font, {}, JSRange(12, 14));

        // 0
        var rect = run.rectForCharacterAtIndex(0);
        TKAssertFloatEquals(rect.origin.x, 0);
        TKAssertFloatEquals(rect.origin.y, 0);
        TKAssertFloatEquals(rect.size.width, 30);
        TKAssertFloatEquals(rect.size.height, 16.40625);

        // mid
        rect = run.rectForCharacterAtIndex(5);
        TKAssertFloatEquals(rect.origin.x, 120);
        TKAssertFloatEquals(rect.origin.y, 0);
        TKAssertFloatEquals(rect.size.width, 20);
        TKAssertFloatEquals(rect.size.height, 16.40625);

        // end
        rect = run.rectForCharacterAtIndex(13);
        TKAssertFloatEquals(rect.origin.x, 300);
        TKAssertFloatEquals(rect.origin.y, 0);
        TKAssertFloatEquals(rect.size.width, 20);
        TKAssertFloatEquals(rect.size.height, 16.40625);

        // past end
        rect = run.rectForCharacterAtIndex(14);
        TKAssertFloatEquals(rect.origin.x, 320);
        TKAssertFloatEquals(rect.origin.y, 0);
        TKAssertFloatEquals(rect.size.width, 0);
        TKAssertFloatEquals(rect.size.height, 16.40625);
        rect = run.rectForCharacterAtIndex(20);
        TKAssertFloatEquals(rect.origin.x, 320);
        TKAssertFloatEquals(rect.origin.y, 0);
        TKAssertFloatEquals(rect.size.width, 0);
        TKAssertFloatEquals(rect.size.height, 16.40625);
    }

});