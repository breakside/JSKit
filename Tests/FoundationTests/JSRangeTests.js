// #import "Foundation/Foundation.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, TKAssert, TKAssertNull, TKAssertNotNull, TKAssertEquals, TKAssertObjectEquals, JSRange */
'use strict';

JSClass('JSRangeTests', TKTestSuite, {

    testContructor: function(){
        var range = new JSRange(1, 2);
        TKAssertEquals(range.location, 1);
        TKAssertEquals(range.length, 2);
    },

    testCopyConstructor: function(){
        var range = new JSRange(3, 4);
        var range2 = new JSRange(range);
        TKAssertEquals(range2.location, 3);
        TKAssertEquals(range2.length, 4);
        range2.location = 5;
        range2.length = 6;
        TKAssertEquals(range.location, 3);
        TKAssertEquals(range.length, 4);
    },

    testFunction: function(){
        var range = JSRange(1, 2);
        TKAssertNotNull(range);
        TKAssert(range instanceof JSRange);
        TKAssertEquals(range.location, 1);
        TKAssertEquals(range.length, 2);
    },

    testNullFunction: function(){
        var range = JSRange(null);
        TKAssertNull(range);
    },

    testNegatives: function(){
        var range = JSRange(-1, -2);
        TKAssertEquals(range.location, -1);
        TKAssertEquals(range.length, -2);
    }

});