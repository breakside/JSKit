// #import "Foundation/Foundation.js"
// #import "TestKit/TestKit.js"
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
        var a = JSIndexPath(0,0);
        var b = a.incremented([10,11,12]);
        TKAssertEquals(b.section, 0);
        TKAssertEquals(b.row, 1);

        // across section boundary
        a = JSIndexPath(0,8);
        b = a.incremented([10,11,12]);
        TKAssertEquals(b.section, 0);
        TKAssertEquals(b.row, 9);
        b = b.incremented([10,11,12]);
        TKAssertEquals(b.section, 1);
        TKAssertEquals(b.row, 0);

        // end of list
        a = JSIndexPath(2,11);
        b = a.incremented([10,11,12]);
        TKAssertNull(b);

        // skip empty section
        a = JSIndexPath(1,4);
        b = a.incremented([5,5,0,2]);
        TKAssertEquals(b.section, 3);
        TKAssertEquals(b.row, 0);

        // skip multiple empty sections
        a = JSIndexPath(1,4);
        b = a.incremented([5,5,0,0,2]);
        TKAssertEquals(b.section, 4);
        TKAssertEquals(b.row, 0);
    },

    testDecremented: function(){
        // begining of list
        var a = JSIndexPath(0,0);
        var b = a.decremented([10,11,12]);
        TKAssertNull(b);

        // across section boundary
        a = JSIndexPath(1,1);
        b = a.decremented([10,11,12]);
        TKAssertEquals(b.section, 1);
        TKAssertEquals(b.row, 0);
        b = b.decremented([10,11,12]);
        TKAssertEquals(b.section, 0);
        TKAssertEquals(b.row, 9);

        // skip empty section
        a = JSIndexPath(3,0);
        b = a.decremented([5,5,0,2]);
        TKAssertEquals(b.section, 1);
        TKAssertEquals(b.row, 4);

        // skip multiple empty sections
        a = JSIndexPath(4,0);
        b = a.decremented([5,5,0,0,2]);
        TKAssertEquals(b.section, 1);
        TKAssertEquals(b.row, 4);
    }


});