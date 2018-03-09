// #import "Foundation/Foundation.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, JSTextRun, JSTextGlyphStorage, JSTextRunTestsFont, JSFont, JSFontDescriptor, JSPoint */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertThrows */
'use strict';

JSClass("JSTextRunTests", TKTestSuite, {

    testCharacterIndexAtPoint: function(){
        var font = JSTextRunTestsFont.init();
        var glyphStorage = JSTextGlyphStorage.initWithFont(font, 12);
        glyphStorage.push("This is a test");
        var run = JSTextRun.initWithGlyphStorage(glyphStorage);

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
        var font = JSTextRunTestsFont.init();
        var glyphStorage = JSTextGlyphStorage.initWithFont(font, 12);
        glyphStorage.push("This is a test");
        var run = JSTextRun.initWithGlyphStorage(glyphStorage);

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

JSClass("JSTextRunTestsFont", JSFont, {

    init: function(){
        this._descriptor = JSFontDescriptor.initWithProperties("JSTextRunTestsFont", JSFont.Weight.Regular, JSFont.Style.Normal);
        this._fullName = "JSTextRunTestsFont";
        this._postScriptName = "JSTextRunTestsFont";
        this._faceName = "JSTextRunTestsFont";
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
        if (character.code >= 0x61){  // lowercase, {, }, |, ~
            return 20;
        }
        return 30; // uppercase, digits, most punctuation
    }
});