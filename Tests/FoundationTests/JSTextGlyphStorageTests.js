// #import "Foundation/Foundation.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, JSTextGlyphStorage, JSTextGlyphStorageTestsFont, JSFont */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertThrows */
'use strict';

JSClass("JSTextGlyphStorageTests", TKTestSuite, {

    testConstructor: function(){
        var font = JSTextGlyphStorageTestsFont.init();
        var glyphStorage = JSTextGlyphStorage.initWithFont(font, 5);
        TKAssertEquals(glyphStorage.range.location, 5);
        TKAssertFloatEquals(glyphStorage.width, 0);
    },

    testPush: function(){
        var font = JSTextGlyphStorageTestsFont.init();
        var glyphStorage = JSTextGlyphStorage.initWithFont(font, 5);
        glyphStorage.push("a");
        TKAssertEquals(glyphStorage.range.location, 5);
        TKAssertEquals(glyphStorage.range.length, 1);
        TKAssertFloatEquals(glyphStorage.width, 20);
        glyphStorage.push("B");
        TKAssertEquals(glyphStorage.range.location, 5);
        TKAssertEquals(glyphStorage.range.length, 2);
        TKAssertFloatEquals(glyphStorage.width, 50);
    },

    testPushMany: function(){
        var font = JSTextGlyphStorageTestsFont.init();
        var glyphStorage = JSTextGlyphStorage.initWithFont(font, 2);
        glyphStorage.push("aBcDefgHIjklm");
        TKAssertEquals(glyphStorage.range.location, 2);
        TKAssertEquals(glyphStorage.range.length, 13);
        TKAssertFloatEquals(glyphStorage.width, 300);
    },

    testPushExtra: function(){
        var font = JSTextGlyphStorageTestsFont.init();
        var glyphStorage = JSTextGlyphStorage.initWithFont(font, 2);
        glyphStorage.push("aBcDefgHIjklm");
        TKAssertEquals(glyphStorage.range.location, 2);
        TKAssertEquals(glyphStorage.range.length, 13);
        TKAssertFloatEquals(glyphStorage.width, 300);
        glyphStorage.pushExtra("\u2026");
        TKAssertEquals(glyphStorage.range.location, 2);
        TKAssertEquals(glyphStorage.range.length, 13);
        TKAssertFloatEquals(glyphStorage.width, 320);
    },

    testTrailingNewline: function(){
        var font = JSTextGlyphStorageTestsFont.init();
        var glyphStorage = JSTextGlyphStorage.initWithFont(font, 5);
        glyphStorage.push("a");
        TKAssertEquals(glyphStorage.range.location, 5);
        TKAssertEquals(glyphStorage.range.length, 1);
        TKAssertFloatEquals(glyphStorage.width, 20);
        glyphStorage.push("B");
        TKAssertEquals(glyphStorage.range.location, 5);
        TKAssertEquals(glyphStorage.range.length, 2);
        TKAssertFloatEquals(glyphStorage.width, 50);
        glyphStorage.push("\n");
        TKAssertEquals(glyphStorage.range.location, 5);
        TKAssertEquals(glyphStorage.range.length, 3);
        TKAssertFloatEquals(glyphStorage.width, 50);
    },

    testTruncate: function(){
        var font = JSTextGlyphStorageTestsFont.init();
        var glyphStorage = JSTextGlyphStorage.initWithFont(font, 5);
        glyphStorage.push("a");
        TKAssertEquals(glyphStorage.range.location, 5);
        TKAssertEquals(glyphStorage.range.length, 1);
        TKAssertFloatEquals(glyphStorage.width, 20);
        glyphStorage.push("B");
        TKAssertEquals(glyphStorage.range.location, 5);
        TKAssertEquals(glyphStorage.range.length, 2);
        TKAssertFloatEquals(glyphStorage.width, 50);
        glyphStorage.truncate(1);
        TKAssertEquals(glyphStorage.range.location, 5);
        TKAssertEquals(glyphStorage.range.length, 1);
        TKAssertFloatEquals(glyphStorage.width, 20);

        glyphStorage.push("HelloWorld!");
        glyphStorage.truncate(6);
        TKAssertEquals(glyphStorage.range.location, 5);
        TKAssertEquals(glyphStorage.range.length, 6);
        TKAssertFloatEquals(glyphStorage.width, 130);
    }

    // TODO: font fallback

});

JSClass("JSTextGlyphStorageTestsFont", JSFont, {

    containsGlyphForCharacter: function(character){
        return true;
    },

    widthOfCharacter: function(character){
        if (character.code >= 0x61){
            return 20.0;
        }
        return 30.0;
    }
});