// #import "Foundation/Foundation.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, JSRange */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
'use strict';

JSClass('StringTests', TKTestSuite, {

    testInitFormat: function(){
        var string = String.initWithFormat("This %s a test %d!", "is", 123);
        TKAssertNotNull(string);
        TKAssertEquals(string, "This is a test 123!");

        string = String.initWithFormat("This %2$s a test %1$d!", 123, "is");
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

        // starting in middle of pair
        iterator = string.unicodeIterator(9);
        TKAssertEquals(iterator.index, 8);
        TKAssertEquals(iterator.nextIndex, 10);
        TKAssertEquals(iterator.character.code, 0x1f600);
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

        // starting in middle of character span
        iterator = string.userPerceivedCharacterIterator(2);
        TKAssertEquals(iterator.index, 1);
        TKAssertEquals(iterator.nextIndex, 3);
        TKAssertEquals(iterator.utf16, "e\u0301");

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

    testMandatoryLineBreak: function(){
        var string = "newline\nbreak";
        var iterator = string.userPerceivedCharacterIterator(6);
        TKAssertExactEquals(iterator.isMandatoryLineBreak, false);
        iterator.increment();
        TKAssertExactEquals(iterator.isMandatoryLineBreak, true);
        iterator.increment();
        TKAssertExactEquals(iterator.isMandatoryLineBreak, false);

        string = "double\n\nbreak";
        iterator = string.userPerceivedCharacterIterator(5);
        TKAssertExactEquals(iterator.isMandatoryLineBreak, false);
        iterator.increment();
        TKAssertExactEquals(iterator.isMandatoryLineBreak, true);
        iterator.increment();
        TKAssertExactEquals(iterator.isMandatoryLineBreak, true);
        iterator.increment();
        TKAssertExactEquals(iterator.isMandatoryLineBreak, false);

        string = "carriage\rbreak";
        iterator = string.userPerceivedCharacterIterator(7);
        TKAssertExactEquals(iterator.isMandatoryLineBreak, false);
        iterator.increment();
        TKAssertExactEquals(iterator.isMandatoryLineBreak, true);
        iterator.increment();
        TKAssertExactEquals(iterator.isMandatoryLineBreak, false);

        string = "double\r\rbreak";
        iterator = string.userPerceivedCharacterIterator(5);
        TKAssertExactEquals(iterator.isMandatoryLineBreak, false);
        iterator.increment();
        TKAssertExactEquals(iterator.isMandatoryLineBreak, true);
        iterator.increment();
        TKAssertExactEquals(iterator.isMandatoryLineBreak, true);
        iterator.increment();
        TKAssertExactEquals(iterator.isMandatoryLineBreak, false);

        string = "crlf\r\nbreak";
        iterator = string.userPerceivedCharacterIterator(3);
        TKAssertExactEquals(iterator.isMandatoryLineBreak, false);
        iterator.increment();
        TKAssertExactEquals(iterator.isMandatoryLineBreak, true);
        iterator.increment();
        TKAssertExactEquals(iterator.isMandatoryLineBreak, false);

        string = "lfcr\n\rbreak";
        iterator = string.userPerceivedCharacterIterator(3);
        TKAssertExactEquals(iterator.isMandatoryLineBreak, false);
        iterator.increment();
        TKAssertExactEquals(iterator.isMandatoryLineBreak, true);
        iterator.increment();
        TKAssertExactEquals(iterator.isMandatoryLineBreak, true);
        iterator.increment();
        TKAssertExactEquals(iterator.isMandatoryLineBreak, false);

        string = "feed\u000Cbreak";
        iterator = string.userPerceivedCharacterIterator(3);
        TKAssertExactEquals(iterator.isMandatoryLineBreak, false);
        iterator.increment();
        TKAssertExactEquals(iterator.isMandatoryLineBreak, true);
        iterator.increment();
        TKAssertExactEquals(iterator.isMandatoryLineBreak, false);

        string = "double\u000C\u000Cbreak";
        iterator = string.userPerceivedCharacterIterator(5);
        TKAssertExactEquals(iterator.isMandatoryLineBreak, false);
        iterator.increment();
        TKAssertExactEquals(iterator.isMandatoryLineBreak, true);
        iterator.increment();
        TKAssertExactEquals(iterator.isMandatoryLineBreak, true);
        iterator.increment();
        TKAssertExactEquals(iterator.isMandatoryLineBreak, false);

        string = "next\u0085break";
        iterator = string.userPerceivedCharacterIterator(3);
        TKAssertExactEquals(iterator.isMandatoryLineBreak, false);
        iterator.increment();
        TKAssertExactEquals(iterator.isMandatoryLineBreak, true);
        iterator.increment();
        TKAssertExactEquals(iterator.isMandatoryLineBreak, false);

        string = "double\u0085\u0085break";
        iterator = string.userPerceivedCharacterIterator(5);
        TKAssertExactEquals(iterator.isMandatoryLineBreak, false);
        iterator.increment();
        TKAssertExactEquals(iterator.isMandatoryLineBreak, true);
        iterator.increment();
        TKAssertExactEquals(iterator.isMandatoryLineBreak, true);
        iterator.increment();
        TKAssertExactEquals(iterator.isMandatoryLineBreak, false);

        string = "separator\u2028break";
        iterator = string.userPerceivedCharacterIterator(8);
        TKAssertExactEquals(iterator.isMandatoryLineBreak, false);
        iterator.increment();
        TKAssertExactEquals(iterator.isMandatoryLineBreak, true);
        iterator.increment();
        TKAssertExactEquals(iterator.isMandatoryLineBreak, false);

        string = "double\u2028\u2028break";
        iterator = string.userPerceivedCharacterIterator(5);
        TKAssertExactEquals(iterator.isMandatoryLineBreak, false);
        iterator.increment();
        TKAssertExactEquals(iterator.isMandatoryLineBreak, true);
        iterator.increment();
        TKAssertExactEquals(iterator.isMandatoryLineBreak, true);
        iterator.increment();
        TKAssertExactEquals(iterator.isMandatoryLineBreak, false);

        string = "p separator\u2029break";
        iterator = string.userPerceivedCharacterIterator(10);
        TKAssertExactEquals(iterator.isMandatoryLineBreak, false);
        iterator.increment();
        TKAssertExactEquals(iterator.isMandatoryLineBreak, true);
        iterator.increment();
        TKAssertExactEquals(iterator.isMandatoryLineBreak, false);

        string = "double\u2029\u2029break";
        iterator = string.userPerceivedCharacterIterator(5);
        TKAssertExactEquals(iterator.isMandatoryLineBreak, false);
        iterator.increment();
        TKAssertExactEquals(iterator.isMandatoryLineBreak, true);
        iterator.increment();
        TKAssertExactEquals(iterator.isMandatoryLineBreak, true);
        iterator.increment();
        TKAssertExactEquals(iterator.isMandatoryLineBreak, false);
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
        var string = "Hello, world. \"this\" is a     test!";

        // start of text/word
        var range = string.rangeForWordAtIndex(0);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 5);

        // middle of word ending with comma
        range = string.rangeForWordAtIndex(1);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 5);

        // last letter of word ending in comma
        range = string.rangeForWordAtIndex(4);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 5);

        // comma
        range = string.rangeForWordAtIndex(5);
        TKAssertEquals(range.location, 5);
        TKAssertEquals(range.length, 1);

        // single space
        range = string.rangeForWordAtIndex(6);
        TKAssertEquals(range.location, 6);
        TKAssertEquals(range.length, 1);

        // word ending in period
        range = string.rangeForWordAtIndex(7);
        TKAssertEquals(range.location, 7);
        TKAssertEquals(range.length, 5);

        // middle of word ending in period
        range = string.rangeForWordAtIndex(8);
        TKAssertEquals(range.location, 7);
        TKAssertEquals(range.length, 5);

        // end of word endinbg in period
        range = string.rangeForWordAtIndex(11);
        TKAssertEquals(range.location, 7);
        TKAssertEquals(range.length, 5);

        // TODO: quotes

        // multiple spaces
        range = string.rangeForWordAtIndex(26);
        TKAssertEquals(range.location, 25);
        TKAssertEquals(range.length, 5);

        // TODO: end of string
        string = "this is a test";
        range = string.rangeForWordAtIndex(14);
        TKAssertEquals(range.location, 10);
        TKAssertEquals(range.length, 4);
    },

    testWordBeforeIndex: function(){
        var str = "Hello, World!  This is a test     of\nword naiviation\r\nhello.";

        // start
        var index = str.indexOfWordStartBeforeIndex(0);
        TKAssertEquals(index, 0);

        // first word
        index = str.indexOfWordStartBeforeIndex(4);
        TKAssertEquals(index, 0);

        // after comma
        index = str.indexOfWordStartBeforeIndex(6);
        TKAssertEquals(index, 0);

        // start of word 2
        index = str.indexOfWordStartBeforeIndex(7);
        TKAssertEquals(index, 0);

        // in word 2
        index = str.indexOfWordStartBeforeIndex(9);
        TKAssertEquals(index, 7);

        // in middle of double space
        index = str.indexOfWordStartBeforeIndex(14);
        TKAssertEquals(index, 7);

        // after double space
        index = str.indexOfWordStartBeforeIndex(15);
        TKAssertEquals(index, 7);

        // next word
        index = str.indexOfWordStartBeforeIndex(16);
        TKAssertEquals(index, 15);

        // middle of several spaces
        index = str.indexOfWordStartBeforeIndex(33);
        TKAssertEquals(index, 25);

        // before newline
        index = str.indexOfWordStartBeforeIndex(36);
        TKAssertEquals(index, 34);

        // after newline
        index = str.indexOfWordStartBeforeIndex(37);
        TKAssertEquals(index, 34);

        // word after newline
        index = str.indexOfWordStartBeforeIndex(39);
        TKAssertEquals(index, 37);

        // middle of CRLF
        index = str.indexOfWordStartBeforeIndex(53);
        TKAssertEquals(index, 42);

        // after CRLF
        index = str.indexOfWordStartBeforeIndex(54);
        TKAssertEquals(index, 42);

        // end of string
        index = str.indexOfWordStartBeforeIndex(60);
        TKAssertEquals(index, 54);
    },

    testWordAfterIndex: function(){
        var str = "Hello, World!  This is a test     of\nword naiviation\r\nhello.";

        // start
        var index = str.indexOfWordEndAfterIndex(0);
        TKAssertEquals(index, 5);

        // first word
        index = str.indexOfWordEndAfterIndex(4);
        TKAssertEquals(index, 5);

        // before comma
        index = str.indexOfWordEndAfterIndex(5);
        TKAssertEquals(index, 12);

        // after comma
        index = str.indexOfWordEndAfterIndex(6);
        TKAssertEquals(index, 12);

        // start of word 2
        index = str.indexOfWordEndAfterIndex(7);
        TKAssertEquals(index, 12);

        // in word 2
        index = str.indexOfWordEndAfterIndex(9);
        TKAssertEquals(index, 12);

        // in middle of double space
        index = str.indexOfWordEndAfterIndex(14);
        TKAssertEquals(index, 19);

        // after double space
        index = str.indexOfWordEndAfterIndex(15);
        TKAssertEquals(index, 19);

        // next word
        index = str.indexOfWordEndAfterIndex(16);
        TKAssertEquals(index, 19);

        // middle of several spaces
        index = str.indexOfWordEndAfterIndex(33);
        TKAssertEquals(index, 36);

        // before newline
        index = str.indexOfWordEndAfterIndex(36);
        TKAssertEquals(index, 41);

        // after newline
        index = str.indexOfWordEndAfterIndex(37);
        TKAssertEquals(index, 41);

        // word after newline
        index = str.indexOfWordEndAfterIndex(39);
        TKAssertEquals(index, 41);

        // before CRLF
        index = str.indexOfWordEndAfterIndex(52);
        TKAssertEquals(index, 59);

        // middle of CRLF
        index = str.indexOfWordEndAfterIndex(53);
        TKAssertEquals(index, 59);

        // after CRLF
        index = str.indexOfWordEndAfterIndex(54);
        TKAssertEquals(index, 59);

        // before period
        index = str.indexOfWordEndAfterIndex(59);
        TKAssertEquals(index, 60);

        // end of string
        index = str.indexOfWordEndAfterIndex(60);
        TKAssertEquals(index, 60);
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

    testLineBoundaries: function(){
        var str = "This is a test \n of line boundaries\rwith hard\r\nline breaks\n\rof various kinds";

        // start of text
        var range = str.rangeForLineAtIndex(0);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 16);

        // middle of line
        range = str.rangeForLineAtIndex(7);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 16);

        // end of line, before break
        range = str.rangeForLineAtIndex(15);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 16);

        // after break
        range = str.rangeForLineAtIndex(16);
        TKAssertEquals(range.location, 16);
        TKAssertEquals(range.length, 20);

        // CRLF
        range = str.rangeForLineAtIndex(39);
        TKAssertEquals(range.location, 36);
        TKAssertEquals(range.length, 11);

        // LFCR
        range = str.rangeForLineAtIndex(50);
        TKAssertEquals(range.location, 47);
        TKAssertEquals(range.length, 12);

        // only newline
        range = str.rangeForLineAtIndex(59);
        TKAssertEquals(range.location, 59);
        TKAssertEquals(range.length, 1);

        // final line
        range = str.rangeForLineAtIndex(65);
        TKAssertEquals(range.location, 60);
        TKAssertEquals(range.length, 16);

        // end of text
        range = str.rangeForLineAtIndex(76);
        TKAssertEquals(range.location, 60);
        TKAssertEquals(range.length, 16);
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
    },

    testISO8859_1: function(){
        var str = "Hello";
        var data = str.dataUsingEncoding(String.Encoding.iso8859_1);
        TKAssertEquals(data.length, 5);
        TKAssertEquals(data.bytes[0], 0x48);
        TKAssertEquals(data.bytes[1], 0x65);
        TKAssertEquals(data.bytes[2], 0x6c);
        TKAssertEquals(data.bytes[3], 0x6c);
        TKAssertEquals(data.bytes[4], 0x6f);

        str = "Hèllo";
        data = str.dataUsingEncoding(String.Encoding.iso8859_1);
        TKAssertEquals(data.length, 5);
        TKAssertEquals(data.bytes[0], 0x48);
        TKAssertEquals(data.bytes[1], 0xe8);
        TKAssertEquals(data.bytes[2], 0x6c);
        TKAssertEquals(data.bytes[3], 0x6c);
        TKAssertEquals(data.bytes[4], 0x6f);

        TKAssertThrows(function(){
            var str = "😀";
            var data = str.dataUsingEncoding(String.Encoding.iso8859_1);
        });
    },

    testUCFirst: function(){
        var str = "test";
        var upper = str.ucFirst();
        TKAssertEquals(upper, "Test");

        str = "TEST";
        upper = str.ucFirst();
        TKAssertEquals(upper, "TEST");

        str = " test";
        upper = str.ucFirst();
        TKAssertEquals(upper, " test");

        str = " test";
        upper = str.ucFirst();
        TKAssertEquals(upper, " test");

        str = "😀";
        upper = str.ucFirst();
        TKAssertEquals(upper, "😀");

        str = "ümlat";
        upper = str.ucFirst();
        TKAssertEquals(upper, "Ümlat");

        str = "u\u0308mlat";
        upper = str.ucFirst();
        TKAssertEquals(upper, "U\u0308mlat");
    },

    testBase64Decode: function(){
        TKAssertEquals("".dataByDecodingBase64().bytes.stringByDecodingUTF8(), "");
        TKAssertEquals("Zg==".dataByDecodingBase64().bytes.stringByDecodingUTF8(), "f");
        TKAssertEquals("Zm8=".dataByDecodingBase64().bytes.stringByDecodingUTF8(), "fo");
        TKAssertEquals("Zm9v".dataByDecodingBase64().bytes.stringByDecodingUTF8(), "foo");
        TKAssertEquals("Zm9vYg==".dataByDecodingBase64().bytes.stringByDecodingUTF8(), "foob");
        TKAssertEquals("Zm9vYmE=".dataByDecodingBase64().bytes.stringByDecodingUTF8(), "fooba");
        TKAssertEquals("Zm9vYmFy".dataByDecodingBase64().bytes.stringByDecodingUTF8(), "foobar");
        TKAssertObjectEquals("s3pPLMBiTxaQ9kYGzzhZRbK+xOo=".dataByDecodingBase64().bytes, new Uint8Array([0xb3, 0x7a, 0x4f, 0x2c, 0xc0, 0x62, 0x4f, 0x16, 0x90, 0xf6, 0x46, 0x06, 0xcf, 0x38, 0x59, 0x45, 0xb2, 0xbe, 0xc4, 0xea]));
    },

    testMasking: function(){
        var str = "testing";
        var masked = str.stringByMaskingWithCharacter("*");
        TKAssertEquals(masked, "*******");

        str = "u\u0308mlat";
        masked = str.stringByMaskingWithCharacter("*");
        TKAssertEquals(masked, "******");

        str = "u\u0308mlat";
        masked = str.stringByMaskingWithCharacter("*", true);
        TKAssertEquals(masked, "*****");

        str = "u\u0308mlat";
        masked = str.stringByMaskingWithCharacter("😀", true);
        TKAssertEquals(masked, "😀😀😀😀😀");
    },

    testSplitAtIndex: function(){
        var str = "testing";
        var parts = str.splitAtIndex(3);
        TKAssertEquals(parts.length, 2);
        TKAssertEquals(parts[0], "tes");
        TKAssertEquals(parts[1], "ting");

        parts = str.splitAtIndex(0);
        TKAssertEquals(parts.length, 2);
        TKAssertEquals(parts[0], "");
        TKAssertEquals(parts[1], "testing");

        parts = str.splitAtIndex(7);
        TKAssertEquals(parts.length, 2);
        TKAssertEquals(parts[0], "testing");
        TKAssertEquals(parts[1], "");

        parts = str.splitAtIndex(8);
        TKAssertEquals(parts.length, 2);
        TKAssertEquals(parts[0], "testing");
        TKAssertEquals(parts[1], "");
    },

    testFormat: function(){
        var formatter = {
            a: function(arg, options){
                return "A:" + arg;
            },

            b: function(arg, options){
                return "B:" + arg;
            },

            test: function(arg, options){
                return "HELLO:" + arg;
            }
        };
        var str = "Testing %a".format(formatter, [1]);
        TKAssertEquals(str, "Testing A:1");

        var str = "Testing %b".format(formatter, ["hi"]);
        TKAssertEquals(str, "Testing B:hi");

        var str = "Testing %{test}".format(formatter, [2]);
        TKAssertEquals(str, "Testing HELLO:2");

    },

});