// #import "Foundation/Foundation.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, JSRange, TKAssertNotNull, TKAssertEquals, TKAssertEquals */
'use strict';

JSClass('StringTests', TKTestSuite, {

    testInitFormat: function(){
        var string = String.initWithFormat("This %s a test %d!", "is", 123);
        TKAssertNotNull(string);
        TKAssertEquals(string, "This is a test 123!");
    },

    testAppend: function(){
        var string = "Hello";
        string = string.stringByAppendingString(", world!");
        TKAssertEquals(string, "Hello, world!");
    },

    testReplace: function(){
        var string = "Hello, world!";
        var range = JSRange(7, 5);
        string = string.stringByReplacingCharactersInRangeWithString(range, "test");
        TKAssertEquals(string, "Hello, test!");
        range = JSRange(0, 5);
        string = string.stringByReplacingCharactersInRangeWithString(range, "Yo");
        TKAssertEquals(string, "Yo, test!");
    },

    testDelete: function(){
        var string = "Hello, world!";
        var range = JSRange(5, 8);
        string = string.stringByDeletingCharactersInRange(range);
        TKAssertEquals(string, "Hello");
    },

    testSubstring: function(){
        var string = "Hello, world!";
        var range = JSRange(7, 5);
        var substring = string.substringInRange(range);
        TKAssertEquals(substring, "world");
    },

    testUnicodeForwardIterator: function(){
        var string = "Tésting 😀";
        TKAssertEquals(string.length, 10);
        var iterator = string.unicodeIterator();
        TKAssertEquals(iterator.index, 0);
        TKAssertEquals(iterator.nextIndex, 1);
        iterator.increment();
        TKAssertEquals(iterator.index, 1);
        TKAssertEquals(iterator.nextIndex, 2);
        iterator.increment();
        TKAssertEquals(iterator.index, 2);
        TKAssertEquals(iterator.nextIndex, 3);
        iterator.increment();
        iterator.increment();
        iterator.increment();
        iterator.increment();
        iterator.increment();
        TKAssertEquals(iterator.index, 7);
        TKAssertEquals(iterator.nextIndex, 8);
        iterator.increment();
        TKAssertEquals(iterator.index, 8);
        TKAssertEquals(iterator.nextIndex, 10);
        TKAssertEquals(iterator.character.code, 0x1f600);
        iterator.increment();
        TKAssertEquals(iterator.index, 10);
        TKAssertEquals(iterator.nextIndex, 10);
        iterator.increment();
        TKAssertEquals(iterator.index, 10);
        TKAssertEquals(iterator.nextIndex, 10);
    },

    testUnicodeBackwardIterator: function(){
        var string = "Tésting 😀";
        var iterator = string.unicodeIterator(10);
        TKAssertEquals(iterator.index, 10);
        TKAssertEquals(iterator.nextIndex, 10);
        iterator.decrement();
        TKAssertEquals(iterator.index, 8);
        TKAssertEquals(iterator.nextIndex, 10);
        iterator.decrement();
        TKAssertEquals(iterator.index, 7);
        TKAssertEquals(iterator.nextIndex, 8);
        iterator.decrement();
        iterator.decrement();
        iterator.decrement();
        iterator.decrement();
        iterator.decrement();
        iterator.decrement();
        iterator.decrement();
        TKAssertEquals(iterator.index, 0);
        TKAssertEquals(iterator.nextIndex, 1);
        iterator.decrement();
        TKAssertEquals(iterator.index, -1);
        TKAssertEquals(iterator.nextIndex, 0);
        iterator.decrement();
        TKAssertEquals(iterator.index, -1);
        TKAssertEquals(iterator.nextIndex, 0);
    },

    testUserPerceivedForwardIterator: function(){
        var string = "Te\u0301sting 😀";
        TKAssertEquals(string.length, 11);
        var iterator = string.userPerceivedCharacterIterator();
        TKAssertEquals(iterator.index, 0);
        TKAssertEquals(iterator.nextIndex, 1);
        iterator.increment();
        TKAssertEquals(iterator.index, 1);
        TKAssertEquals(iterator.nextIndex, 3);
        TKAssertEquals(iterator.utf16, "e\u0301");
        iterator.increment();
        TKAssertEquals(iterator.index, 3);
        TKAssertEquals(iterator.nextIndex, 4);
        iterator.increment();
        iterator.increment();
        iterator.increment();
        iterator.increment();
        iterator.increment();
        TKAssertEquals(iterator.index, 8);
        TKAssertEquals(iterator.nextIndex, 9);
        iterator.increment();
        TKAssertEquals(iterator.index, 9);
        TKAssertEquals(iterator.nextIndex, 11);
        TKAssertEquals(iterator.utf16, "😀");
        iterator.increment();
        TKAssertEquals(iterator.index, 11);
        TKAssertEquals(iterator.nextIndex, 11);
        iterator.increment();
        TKAssertEquals(iterator.index, 11);
        TKAssertEquals(iterator.nextIndex, 11);

        string = "e\u0301llo\u0308";
        TKAssertEquals(string.length, 6);
        iterator = string.userPerceivedCharacterIterator();
        TKAssertEquals(iterator.index, 0);
        TKAssertEquals(iterator.nextIndex, 2);
        iterator.increment();
        TKAssertEquals(iterator.index, 2);
        TKAssertEquals(iterator.nextIndex, 3);
        iterator = string.userPerceivedCharacterIterator(1);
        TKAssertEquals(iterator.index, 0);
        TKAssertEquals(iterator.nextIndex, 2);
        iterator.increment();
        TKAssertEquals(iterator.index, 2);
        TKAssertEquals(iterator.nextIndex, 3);
        iterator = string.userPerceivedCharacterIterator(2);
        TKAssertEquals(iterator.index, 2);
        TKAssertEquals(iterator.nextIndex, 3);
        iterator.increment();
        TKAssertEquals(iterator.index, 3);
        TKAssertEquals(iterator.nextIndex, 4);
        iterator = string.userPerceivedCharacterIterator(3);
        TKAssertEquals(iterator.index, 3);
        TKAssertEquals(iterator.nextIndex, 4);
        iterator.increment();
        TKAssertEquals(iterator.index, 4);
        TKAssertEquals(iterator.nextIndex, 6);
        iterator = string.userPerceivedCharacterIterator(4);
        TKAssertEquals(iterator.index, 4);
        TKAssertEquals(iterator.nextIndex, 6);
        iterator.increment();
        TKAssertEquals(iterator.index, 6);
        TKAssertEquals(iterator.nextIndex, 6);
        iterator.increment();
        TKAssertEquals(iterator.index, 6);
        TKAssertEquals(iterator.nextIndex, 6);
        iterator = string.userPerceivedCharacterIterator(5);
        TKAssertEquals(iterator.index, 4);
        TKAssertEquals(iterator.nextIndex, 6);
        iterator.increment();
        TKAssertEquals(iterator.index, 6);
        TKAssertEquals(iterator.nextIndex, 6);
        iterator.increment();
        TKAssertEquals(iterator.index, 6);
        TKAssertEquals(iterator.nextIndex, 6);
        iterator = string.userPerceivedCharacterIterator(6);
        TKAssertEquals(iterator.index, 6);
        TKAssertEquals(iterator.nextIndex, 6);
        iterator.increment();
        TKAssertEquals(iterator.index, 6);
        TKAssertEquals(iterator.nextIndex, 6);
    },

    testUserPerceivedBackwardIterator: function(){
        var string = "Te\u0301sting 😀";
        var iterator = string.userPerceivedCharacterIterator(11);
        TKAssertEquals(iterator.index, 11);
        TKAssertEquals(iterator.nextIndex, 11);
        iterator.decrement();
        TKAssertEquals(iterator.index, 9);
        TKAssertEquals(iterator.nextIndex, 11);
        iterator.decrement();
        TKAssertEquals(iterator.index, 8);
        TKAssertEquals(iterator.nextIndex, 9);
        iterator.decrement();
        iterator.decrement();
        iterator.decrement();
        iterator.decrement();
        iterator.decrement();
        TKAssertEquals(iterator.index, 3);
        TKAssertEquals(iterator.nextIndex, 4);
        iterator.decrement();
        TKAssertEquals(iterator.index, 1);
        TKAssertEquals(iterator.nextIndex, 3);
        iterator.decrement();
        TKAssertEquals(iterator.index, 0);
        TKAssertEquals(iterator.nextIndex, 1);
        iterator.decrement();
        TKAssertEquals(iterator.index, -1);
        TKAssertEquals(iterator.nextIndex, 0);
        iterator.decrement();
        TKAssertEquals(iterator.index, -1);
        TKAssertEquals(iterator.nextIndex, 0);

        string = "e\u0301llo\u0308";
        TKAssertEquals(string.length, 6);
        iterator = string.userPerceivedCharacterIterator();
        TKAssertEquals(iterator.index, 0);
        TKAssertEquals(iterator.nextIndex, 2);
        iterator.decrement();
        TKAssertEquals(iterator.index, -1);
        TKAssertEquals(iterator.nextIndex, 0);
        iterator.decrement();
        TKAssertEquals(iterator.index, -1);
        TKAssertEquals(iterator.nextIndex, 0);
        iterator = string.userPerceivedCharacterIterator(1);
        TKAssertEquals(iterator.index, 0);
        TKAssertEquals(iterator.nextIndex, 2);
        iterator.decrement();
        TKAssertEquals(iterator.index, -1);
        TKAssertEquals(iterator.nextIndex, 0);
        iterator.decrement();
        TKAssertEquals(iterator.index, -1);
        TKAssertEquals(iterator.nextIndex, 0);
        iterator = string.userPerceivedCharacterIterator(2);
        TKAssertEquals(iterator.index, 2);
        TKAssertEquals(iterator.nextIndex, 3);
        iterator.decrement();
        TKAssertEquals(iterator.index, 0);
        TKAssertEquals(iterator.nextIndex, 2);
        iterator = string.userPerceivedCharacterIterator(3);
        TKAssertEquals(iterator.index, 3);
        TKAssertEquals(iterator.nextIndex, 4);
        iterator.decrement();
        TKAssertEquals(iterator.index, 2);
        TKAssertEquals(iterator.nextIndex, 3);
        iterator = string.userPerceivedCharacterIterator(4);
        TKAssertEquals(iterator.index, 4);
        TKAssertEquals(iterator.nextIndex, 6);
        iterator.decrement();
        TKAssertEquals(iterator.index, 3);
        TKAssertEquals(iterator.nextIndex, 4);
        iterator = string.userPerceivedCharacterIterator(5);
        TKAssertEquals(iterator.index, 4);
        TKAssertEquals(iterator.nextIndex, 6);
        iterator.decrement();
        TKAssertEquals(iterator.index, 3);
        TKAssertEquals(iterator.nextIndex, 4);
        iterator = string.userPerceivedCharacterIterator(6);
        TKAssertEquals(iterator.index, 6);
        TKAssertEquals(iterator.nextIndex, 6);
        iterator.decrement();
        TKAssertEquals(iterator.index, 4);
        TKAssertEquals(iterator.nextIndex, 6);
    },

    testCharacterBoundaries: function(){
        var string = "Hello, world!";
        var range = string.rangeForUserPerceivedCharacterAtIndex(0);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 1);
        range = string.rangeForUserPerceivedCharacterAtIndex(1);
        TKAssertEquals(range.location, 1);
        TKAssertEquals(range.length, 1);
        range = string.rangeForUserPerceivedCharacterAtIndex(3);
        TKAssertEquals(range.location, 3);
        TKAssertEquals(range.length, 1);
        range = string.rangeForUserPerceivedCharacterAtIndex(12);
        TKAssertEquals(range.location, 12);
        TKAssertEquals(range.length, 1);
        range = string.rangeForUserPerceivedCharacterAtIndex(13);
        TKAssertEquals(range.location, 13);
        TKAssertEquals(range.length, 0);
    },

    testUnicodeCharacterBoundaries: function(){
        var string = "Te\u0301st 😀!";
        var range = string.rangeForUserPerceivedCharacterAtIndex(0);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 1);
        range = string.rangeForUserPerceivedCharacterAtIndex(1);
        TKAssertEquals(range.location, 1);
        TKAssertEquals(range.length, 2);
        range = string.rangeForUserPerceivedCharacterAtIndex(2);
        TKAssertEquals(range.location, 1);
        TKAssertEquals(range.length, 2);
        range = string.rangeForUserPerceivedCharacterAtIndex(3);
        TKAssertEquals(range.location, 3);
        TKAssertEquals(range.length, 1);
        range = string.rangeForUserPerceivedCharacterAtIndex(6);
        TKAssertEquals(range.location, 6);
        TKAssertEquals(range.length, 2);
        range = string.rangeForUserPerceivedCharacterAtIndex(7);
        TKAssertEquals(range.location, 6);
        TKAssertEquals(range.length, 2);
        range = string.rangeForUserPerceivedCharacterAtIndex(8);
        TKAssertEquals(range.location, 8);
        TKAssertEquals(range.length, 1);
        range = string.rangeForUserPerceivedCharacterAtIndex(9);
        TKAssertEquals(range.location, 9);
        TKAssertEquals(range.length, 0);
    },

    testWordBoundaries: function(){
        var string = "Hello, world. \"this\" is a test!";
        var range = string.rangeForWordAtIndex(0);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 5);
        range = string.rangeForWordAtIndex(1);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 5);
        range = string.rangeForWordAtIndex(4);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 5);
        range = string.rangeForWordAtIndex(5);
        TKAssertEquals(range.location, 5);
        TKAssertEquals(range.length, 1);
        range = string.rangeForWordAtIndex(6);
        TKAssertEquals(range.location, 6);
        TKAssertEquals(range.length, 1);
        range = string.rangeForWordAtIndex(7);
        TKAssertEquals(range.location, 7);
        TKAssertEquals(range.length, 5);
        range = string.rangeForWordAtIndex(8);
        TKAssertEquals(range.location, 7);
        TKAssertEquals(range.length, 5);
        range = string.rangeForWordAtIndex(11);
        TKAssertEquals(range.location, 7);
        TKAssertEquals(range.length, 5);
    },

    testUnicodeWordBoundaries: function(){
        var string = "Hello, wörld. \"this\" is a te\u0301st 😀!";
        var range = string.rangeForWordAtIndex(0);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 5);
        range = string.rangeForWordAtIndex(1);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 5);
        range = string.rangeForWordAtIndex(7);
        TKAssertEquals(range.location, 7);
        TKAssertEquals(range.length, 5);
        range = string.rangeForWordAtIndex(8);
        TKAssertEquals(range.location, 7);
        TKAssertEquals(range.length, 5);
        range = string.rangeForWordAtIndex(9);
        TKAssertEquals(range.location, 7);
        TKAssertEquals(range.length, 5);
        range = string.rangeForWordAtIndex(26);
        TKAssertEquals(range.location, 26);
        TKAssertEquals(range.length, 5);
        range = string.rangeForWordAtIndex(27);
        TKAssertEquals(range.location, 26);
        TKAssertEquals(range.length, 5);
        range = string.rangeForWordAtIndex(28);
        TKAssertEquals(range.location, 26);
        TKAssertEquals(range.length, 5);
        range = string.rangeForWordAtIndex(29);
        TKAssertEquals(range.location, 26);
        TKAssertEquals(range.length, 5);
        range = string.rangeForWordAtIndex(32);
        TKAssertEquals(range.location, 32);
        TKAssertEquals(range.length, 2);
        range = string.rangeForWordAtIndex(33);
        TKAssertEquals(range.location, 32);
        TKAssertEquals(range.length, 2);
        range = string.rangeForWordAtIndex(34);
        TKAssertEquals(range.location, 34);
        TKAssertEquals(range.length, 1);
    },

    _testWordBoundarySpaces: function(){
        // disabled until I can decide exactly what I want here
        // Unicode word break standard doesn't treat runs of whitespace as a word; each space is its own word
        // But for practical use, I think treating consecutive whitespace as a word makes sense
        var str = "  Hello     there,\t   what\n\na test!  ";
        var range = str.rangeForWordAtIndex(0);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 2);
        range = str.rangeForWordAtIndex(1);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 2);
        range = str.rangeForWordAtIndex(2);
        TKAssertEquals(range.location, 2);
        TKAssertEquals(range.length, 5);
        range = str.rangeForWordAtIndex(7);
        TKAssertEquals(range.location, 7);
        TKAssertEquals(range.length, 5);
        range = str.rangeForWordAtIndex(11);
        TKAssertEquals(range.location, 7);
        TKAssertEquals(range.length, 5);
        range = str.rangeForWordAtIndex(17);
        TKAssertEquals(range.location, 17);
        TKAssertEquals(range.length, 1);
        range = str.rangeForWordAtIndex(18);
        TKAssertEquals(range.location, 18);
        TKAssertEquals(range.length, 4);
        range = str.rangeForWordAtIndex(19);
        TKAssertEquals(range.location, 18);
        TKAssertEquals(range.length, 4);
        range = str.rangeForWordAtIndex(20);
        TKAssertEquals(range.location, 18);
        TKAssertEquals(range.length, 4);
        range = str.rangeForWordAtIndex(26);
        TKAssertEquals(range.location, 26);
        TKAssertEquals(range.length, 2);
        range = str.rangeForWordAtIndex(27);
        TKAssertEquals(range.location, 26);
        TKAssertEquals(range.length, 2);
        range = str.rangeForWordAtIndex(35);
        TKAssertEquals(range.location, 35);
        TKAssertEquals(range.length, 2);
        range = str.rangeForWordAtIndex(36);
        TKAssertEquals(range.location, 35);
        TKAssertEquals(range.length, 2);
    },

    testUTF8: function(){
        var str = "Hèllo";
        var utf8 = str.utf8();
        TKAssertEquals(utf8.length, 6);
        TKAssertEquals(utf8.bytes[0], 0x48);
        TKAssertEquals(utf8.bytes[1], 0xc3);
        TKAssertEquals(utf8.bytes[2], 0xa8);
        TKAssertEquals(utf8.bytes[3], 0x6c);
        TKAssertEquals(utf8.bytes[4], 0x6c);
        TKAssertEquals(utf8.bytes[5], 0x6f);

        str = "😀";
        utf8 = str.utf8();
        TKAssertEquals(utf8.length, 4);
        TKAssertEquals(utf8.bytes[0], 0xf0);
        TKAssertEquals(utf8.bytes[1], 0x9f);
        TKAssertEquals(utf8.bytes[2], 0x98);
        TKAssertEquals(utf8.bytes[3], 0x80);
    }

});