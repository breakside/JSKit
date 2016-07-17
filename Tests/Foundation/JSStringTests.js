// #import "Foundation/Foundation.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, JSString, TKAssertNotNull, TKAssertEquals, TKAssertObjectEquals */
'use strict';

JSClass('JSStringTests', TKTestSuite, {

    testInit: function(){
        var string = JSString.initWithNativeString("Hello, world!");
        TKAssertNotNull(string);
        TKAssertEquals(string.length, 13);
        TKAssertObjectEquals(string, "Hello, world!");
    },

    testUnicodeIterator: function(){
        var string = JSString.initWithNativeString("Tésting 😀");
        TKAssertEquals(string.length, 10);
        var iterator = JSString._UniocdeIterator(string, 0);
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
        TKAssertEquals(iterator.index, 8);
        TKAssertEquals(iterator.nextIndex, 10);
        iterator.increment();
        TKAssertEquals(iterator.index, 10);
        TKAssertEquals(iterator.nextIndex, 10);
        iterator.increment();
        TKAssertEquals(iterator.index, 10);
        TKAssertEquals(iterator.nextIndex, 10);

        iterator = JSString._UniocdeIterator(string, 10);
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

    testCharacterBoundaries: function(){
        var string = JSString.initWithNativeString("Hello, world!");
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
        var string = JSString.initWithNativeString("Te\u0301st 😀!");
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
        TKAssertEquals(range.length, 0);
    },

    testWordBoundaries: function(){

    },

    testUnicodeWordBoundaries: function(){

    },

    testUTF8: function(){

    }

});