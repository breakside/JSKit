// #import Foundation
// #import TestKit
'use strict';

JSClass("JSIndexPathRangeTests", TKTestSuite, {

    testConstructor: function(){
        // must have start and end
        TKAssertThrows(function(){
            var a = JSIndexPathRange();
        });
        TKAssertThrows(function(){
            var a = JSIndexPathRange(JSIndexPath(0,0));
        });

        // start must be <= end
        TKAssertThrows(function(){
            var a = JSIndexPathRange(JSIndexPath(0,1), JSIndexPath(0,0));
        });

        // start can == end
        var a = JSIndexPathRange(JSIndexPath(1,2), JSIndexPath(1,2));
        TKAssertEquals(a.start.section, 1);
        TKAssertEquals(a.start.row, 2);
        TKAssertEquals(a.end.section, 1);
        TKAssertEquals(a.end.row, 2);

        // typical case
        a = JSIndexPathRange(JSIndexPath(1,2), JSIndexPath(3,4));
        TKAssertEquals(a.start.section, 1);
        TKAssertEquals(a.start.row, 2);
        TKAssertEquals(a.end.section, 3);
        TKAssertEquals(a.end.row, 4);

        // Make sure start and end are copied
        var start = JSIndexPath(1, 2);
        var end = JSIndexPath(3, 4);
        a = JSIndexPathRange(start, end);
        start.section = 5;
        start.row = 6;
        end.section = 7;
        end.row = 8;
        TKAssertEquals(a.start.section, 1);
        TKAssertEquals(a.start.row, 2);
        TKAssertEquals(a.end.section, 3);
        TKAssertEquals(a.end.row, 4);

    },

    testCopyConstructor: function(){
        var start = JSIndexPath(1, 2);
        var end = JSIndexPath(3, 4);
        var a = JSIndexPathRange(start, end);
        var b = JSIndexPathRange(a);
        a.start.section = 5;
        a.start.row = 6;
        a.end.section = 7;
        a.end.row = 8;
        TKAssertEquals(b.start.section, 1);
        TKAssertEquals(b.start.row, 2);
        TKAssertEquals(b.end.section, 3);
        TKAssertEquals(b.end.row, 4);
    },

    testIsEqual: function(){
        var start1 = JSIndexPath(1, 2);
        var start2 = JSIndexPath(1, 3);
        var end1 = JSIndexPath(3, 4);
        var end2 = JSIndexPath(4, 5);
        var a = JSIndexPathRange(start1, end1);
        var b = JSIndexPathRange(start1, end1);
        TKAssertObjectEquals(a, b);

        a = JSIndexPathRange(start1, end1);
        b = JSIndexPathRange(start1, end2);
        TKAssertObjectNotEquals(a, b);

        a = JSIndexPathRange(start1, end1);
        b = JSIndexPathRange(start2, end2);
        TKAssertObjectNotEquals(a, b);

        a = JSIndexPathRange(start1, end1);
        b = JSIndexPathRange(start2, end1);
        TKAssertObjectNotEquals(a, b);
    },

    testContains: function(){
        var start = JSIndexPath(1, 2);
        var end = JSIndexPath(9, 8);
        var a = JSIndexPathRange(start, end);
        TKAssert(a.contains(start));
        TKAssert(a.contains(end));
        TKAssert(!a.contains(JSIndexPath(1, 1)));
        TKAssert(!a.contains(JSIndexPath(0, 3)));
        TKAssert(a.contains(JSIndexPath(1, 3)));
        TKAssert(a.contains(JSIndexPath(1, 100)));
        TKAssert(a.contains(JSIndexPath(2, 0)));
        TKAssert(a.contains(JSIndexPath(3, 10)));
        TKAssert(a.contains(JSIndexPath(8, 10)));
        TKAssert(a.contains(JSIndexPath(9, 0)));
        TKAssert(a.contains(JSIndexPath(9, 1)));
        TKAssert(a.contains(JSIndexPath(9, 7)));
        TKAssert(!a.contains(JSIndexPath(9, 9)));
        TKAssert(!a.contains(JSIndexPath(9, 10)));
        TKAssert(!a.contains(JSIndexPath(10, 5)));
        TKAssert(!a.contains(JSIndexPath(10, 1)));
    }

});