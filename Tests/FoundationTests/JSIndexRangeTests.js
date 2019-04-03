// #import Foundation
// #import Testkit
/* global JSClass, TKTestSuite, JSIndexRange */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
'use strict';

JSClass("JSIndexRangeTests", TKTestSuite, {

    testConstructor: function(){
        // must have start and end
        TKAssertThrows(function(){
            var a = JSIndexRange();
        });
        TKAssertThrows(function(){
            var a = JSIndexRange(0);
        });

        // start must be <= end
        TKAssertThrows(function(){
            var a = JSIndexRange(1,0);
        });

        // start can == end
        var a = JSIndexRange(1,1);
        TKAssertEquals(a.start, 1);
        TKAssertEquals(a.end, 1);

        // typical case
        a = JSIndexRange(1,4);
        TKAssertEquals(a.start, 1);
        TKAssertEquals(a.end, 4);
    },

    testCopyConstructor: function(){
        var a = JSIndexRange(2, 5);
        var b = JSIndexRange(a);
        a.start = 4;
        a.end = 7;
        TKAssertEquals(b.start, 2);
        TKAssertEquals(b.end, 5);
    },

    testIsEqual: function(){
        var a = JSIndexRange(1, 4);
        var b = JSIndexRange(1, 4);
        TKAssertObjectEquals(a, b);

        a = JSIndexRange(1, 4);
        b = JSIndexRange(1, 5);
        TKAssertObjectNotEquals(a, b);

        a = JSIndexRange(1, 4);
        b = JSIndexRange(2, 4);
        TKAssertObjectNotEquals(a, b);

        a = JSIndexRange(1, 4);
        b = JSIndexRange(2, 5);
        TKAssertObjectNotEquals(a, b);
    },

    testContains: function(){
        var a = JSIndexRange(10, 33);
        TKAssert(a.contains(10));
        TKAssert(a.contains(33));
        TKAssert(!a.contains(9));
        TKAssert(!a.contains(0));
        TKAssert(a.contains(11));
        TKAssert(a.contains(15));
        TKAssert(a.contains(30));
        TKAssert(!a.contains(34));
        TKAssert(!a.contains(35));
        TKAssert(!a.contains(50));
    },

    testCompare: function(){
        var a = JSIndexRange(1, 5);
        var b = JSIndexRange(1, 5);
        TKAssertExactEquals(a.compare(b), 0);
        TKAssertExactEquals(b.compare(a), 0);

        a = JSIndexRange(1, 5);
        b = JSIndexRange(1, 6);
        TKAssertExactEquals(a.compare(b), -1);
        TKAssertExactEquals(b.compare(a), 1);

        a = JSIndexRange(1, 5);
        b = JSIndexRange(2, 2);
        TKAssertExactEquals(a.compare(b), -1);
        TKAssertExactEquals(b.compare(a), 1);
    },

});