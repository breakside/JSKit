// #import Foundation
// #import TestKit
/* global JSClass, TKTestSuite, JSIndexPath */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
'use strict';

JSClass("JSIndexPathTests", TKTestSuite, {

    testConstructor: function(){
        TKAssertThrows(function(){
            var a = JSIndexPath();
        });
        TKAssertThrows(function(){
            var a = JSIndexPath(1);
        });
        var a = JSIndexPath(1, 2);
        TKAssertEquals(a.section, 1);
        TKAssertEquals(a.row, 2);
    },

    testCopyConstructor: function(){
        var a = JSIndexPath(1, 2);
        var b = JSIndexPath(a);
        TKAssertEquals(b.section, 1);
        TKAssertEquals(b.row, 2);
        a.section = 3;
        a.row = 4;
        TKAssertEquals(b.section, 1);
        TKAssertEquals(b.row, 2);
    },

    testNullConstructor: function(){
        var a = JSIndexPath(null);
        TKAssertNull(a);
    },

    testIsEqual: function(){
        var a = JSIndexPath(0, 0);
        var b = JSIndexPath(0, 0);
        TKAssertObjectEquals(a, b);

        a = JSIndexPath(1, 2);
        b = JSIndexPath(1, 1);
        TKAssertObjectNotEquals(a, b);

        a = JSIndexPath(1, 2);
        b = JSIndexPath(2, 1);
        TKAssertObjectNotEquals(a, b);
    },

    testLessThan: function(){
        var a = JSIndexPath(1, 2);
        var b = JSIndexPath(1, 2);
        TKAssert(!a.isLessThan(b));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(1, 1);
        TKAssert(!a.isLessThan(b));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(1, 3);
        TKAssert(a.isLessThan(b));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(2, 0);
        TKAssert(a.isLessThan(b));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(2, 1);
        TKAssert(a.isLessThan(b));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(2, 3);
        TKAssert(a.isLessThan(b));
    },

    testLessThanOrEqual: function(){
        var a = JSIndexPath(1, 2);
        var b = JSIndexPath(1, 2);
        TKAssert(a.isLessThanOrEqual(b));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(1, 1);
        TKAssert(!a.isLessThanOrEqual(b));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(1, 3);
        TKAssert(a.isLessThanOrEqual(b));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(2, 0);
        TKAssert(a.isLessThanOrEqual(b));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(2, 1);
        TKAssert(a.isLessThanOrEqual(b));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(2, 3);
        TKAssert(a.isLessThanOrEqual(b));
    },

    testGreaterThan: function(){
        var a = JSIndexPath(1, 2);
        var b = JSIndexPath(1, 2);
        TKAssert(!b.isGreaterThan(a));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(1, 1);
        TKAssert(!b.isGreaterThan(a));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(1, 3);
        TKAssert(b.isGreaterThan(a));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(2, 0);
        TKAssert(b.isGreaterThan(a));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(2, 1);
        TKAssert(b.isGreaterThan(a));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(2, 3);
        TKAssert(b.isGreaterThan(a));
    },

    testGreaterThanOrEqual: function(){
        var a = JSIndexPath(1, 2);
        var b = JSIndexPath(1, 2);
        TKAssert(b.isGreaterThanOrEqual(a));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(1, 1);
        TKAssert(!b.isGreaterThanOrEqual(a));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(1, 3);
        TKAssert(b.isGreaterThanOrEqual(a));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(2, 0);
        TKAssert(b.isGreaterThanOrEqual(a));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(2, 1);
        TKAssert(b.isGreaterThanOrEqual(a));

        a = JSIndexPath(1, 2);
        b = JSIndexPath(2, 3);
        TKAssert(b.isGreaterThanOrEqual(a));
    },

    testCompare: function(){
        var a = JSIndexPath(1, 2);
        var b = JSIndexPath(1, 2);
        TKAssertEquals(a.compare(b), 0);
        TKAssertEquals(b.compare(a), 0);

        a = JSIndexPath(1, 2);
        b = JSIndexPath(1, 1);
        TKAssertEquals(a.compare(b), 1);
        TKAssertEquals(b.compare(a), -1);

        a = JSIndexPath(1, 2);
        b = JSIndexPath(1, 3);
        TKAssertEquals(a.compare(b), -1);
        TKAssertEquals(b.compare(a), 1);

        a = JSIndexPath(1, 2);
        b = JSIndexPath(2, 0);
        TKAssertEquals(a.compare(b), -1);
        TKAssertEquals(b.compare(a), 1);

        a = JSIndexPath(1, 2);
        b = JSIndexPath(2, 1);
        TKAssertEquals(a.compare(b), -1);
        TKAssertEquals(b.compare(a), 1);

        a = JSIndexPath(1, 2);
        b = JSIndexPath(2, 3);
        TKAssertEquals(a.compare(b), -1);
        TKAssertEquals(b.compare(a), 1);
    },

    testIncremented: function(){
        var a = JSIndexPath(1, 2);
        var b = a.incremented();
        TKAssertEquals(b.section, 1);
        TKAssertEquals(b.row, 3);

        a = JSIndexPath([1, 2, 3]);
        b = a.incremented();
        TKAssertEquals(b[0], 1);
        TKAssertEquals(b[1], 2);
        TKAssertEquals(b[2], 4);
    },

    testDecremented: function(){
        var a = JSIndexPath(1, 1);
        var b = a.decremented();
        TKAssertEquals(b.section, 1);
        TKAssertEquals(b.row, 0);
        var c = b.decremented();
        TKAssertEquals(c.section, 1);
        TKAssertEquals(c.row, -1);
    }


});