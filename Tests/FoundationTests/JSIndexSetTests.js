// #import Foundation
// #import TestKit
'use strict';

JSClass("JSIndexSetTests", TKTestSuite, {

    testConstructor: function(){
        var range = JSIndexRange(1, 2);
        var a = JSIndexSet(range);
        range.start = 3;
        range.end = 4;
        TKAssertEquals(a.ranges.length, 1);
        TKAssertEquals(a.ranges[0].start, 1);
        TKAssertEquals(a.ranges[0].end, 2);

        a = JSIndexSet(null);
        TKAssert(a.isEmpty);
    },

    testCopyConstructor: function(){
        var a = JSIndexSet(1);
        var b = JSIndexSet(a);

        TKAssertEquals(a.ranges.length, b.ranges.length);
        TKAssertNotExactEquals(a.ranges, b.ranges);
        for (var i = 0, l = a.ranges.length; i < l; ++i){
            TKAssertObjectEquals(a.ranges[i], b.ranges[i]);
            TKAssertNotExactEquals(a.ranges[i], b.ranges[i]);
        }
    },

    testAddRange: function(){
        var set = JSIndexSet();

        // adding first range
        var range = JSIndexRange(18, 19);
        set.addRange(range);
        TKAssertEquals(set.ranges.length, 1);
        TKAssertEquals(set.ranges[0].start, 18);
        TKAssertEquals(set.ranges[0].end, 19);

        // adding non-overlapping range
        range = JSIndexRange(27, 30);
        set.addRange(range);
        TKAssertEquals(set.ranges.length, 2);
        TKAssertEquals(set.ranges[1].start, 27);
        TKAssertEquals(set.ranges[1].end, 30);

        // adding non-overlapping before other ranges (ranges should be sorted)
        range = JSIndexRange(8, 10);
        set.addRange(range);
        TKAssertEquals(set.ranges.length, 3);
        TKAssertEquals(set.ranges[0].start, 8);
        TKAssertEquals(set.ranges[0].end, 10);

        // new range overlaps existing range start (should combine)
        range = JSIndexRange(6, 9);
        set.addRange(range);
        TKAssertEquals(set.ranges.length, 3);
        TKAssertEquals(set.ranges[0].start, 6);
        TKAssertEquals(set.ranges[0].end, 10);

        // new range adjacent to existing range start (should combine)
        range = JSIndexRange(4, 5);
        set.addRange(range);
        TKAssertEquals(set.ranges.length, 3);
        TKAssertEquals(set.ranges[0].start, 4);
        TKAssertEquals(set.ranges[0].end, 10);

        // new range overlapping with start only (should combine)
        range = JSIndexRange(3, 4);
        set.addRange(range);
        TKAssertEquals(set.ranges.length, 3);
        TKAssertEquals(set.ranges[0].start, 3);
        TKAssertEquals(set.ranges[0].end, 10);

        // new range overlapping with existing range end (should combine)
        range = JSIndexRange(9, 12);
        set.addRange(range);
        TKAssertEquals(set.ranges.length, 3);
        TKAssertEquals(set.ranges[0].start, 3);
        TKAssertEquals(set.ranges[0].end, 12);

        // new range entirely contained in existing ranges (no op)
        range = JSIndexRange(5, 10);
        set.addRange(range);
        TKAssertEquals(set.ranges.length, 3);
        TKAssertEquals(set.ranges[0].start, 3);
        TKAssertEquals(set.ranges[0].end, 12);

        // new range overlapping with just end of other range (should combine)
        range = JSIndexRange(12, 13);
        set.addRange(range);
        TKAssertEquals(set.ranges.length, 3);
        TKAssertEquals(set.ranges[0].start, 3);
        TKAssertEquals(set.ranges[0].end, 13);

        // new range adjacent to end of other range (should combine)
        range = JSIndexRange(14, 15);
        set.addRange(range);
        TKAssertEquals(set.ranges.length, 3);
        TKAssertEquals(set.ranges[0].start, 3);
        TKAssertEquals(set.ranges[0].end, 15);

        // new range at end, non overlapping
        range = JSIndexRange(40, 44);
        set.addRange(range);
        TKAssertEquals(set.ranges.length, 4);
        TKAssertEquals(set.ranges[3].start, 40);
        TKAssertEquals(set.ranges[3].end, 44);

        // new range overlapping muliple ranges, (should combine all)
        range = JSIndexRange(25, 45);
        set.addRange(range);
        TKAssertEquals(set.ranges.length, 3);
        TKAssertEquals(set.ranges[2].start, 25);
        TKAssertEquals(set.ranges[2].end, 45);

        // new range overlapping end of one range and start of another (should combine)
        range = JSIndexRange(13, 26);
        set.addRange(range);
        TKAssertEquals(set.ranges.length, 1);
        TKAssertEquals(set.ranges[0].start, 3);
        TKAssertEquals(set.ranges[0].end, 45);
    },

    testRemoveRange: function(){
        var set = JSIndexSet();
        var range = JSIndexRange(5, 55);
        set.addRange(range);
        TKAssertEquals(set.ranges.length, 1);
        TKAssertEquals(set.ranges[0].start, 5);
        TKAssertEquals(set.ranges[0].end, 55);

        // remove range that starts before a selected range
        range = JSIndexRange(4, 7);
        set.removeRange(range);
        TKAssertEquals(set.ranges.length, 1);
        TKAssertEquals(set.ranges[0].start, 8);
        TKAssertEquals(set.ranges[0].end, 55);

        // remove range that ends after a selected range
        range = JSIndexRange(53, 57);
        set.removeRange(range);
        TKAssertEquals(set.ranges.length, 1);
        TKAssertEquals(set.ranges[0].start, 8);
        TKAssertEquals(set.ranges[0].end, 52);

        // remove range from middle
        range = JSIndexRange(20, 25);
        set.removeRange(range);
        TKAssertEquals(set.ranges.length, 2);
        TKAssertEquals(set.ranges[0].start, 8);
        TKAssertEquals(set.ranges[0].end, 19);
        TKAssertEquals(set.ranges[1].start, 26);
        TKAssertEquals(set.ranges[1].end, 52);

        // remove range that spans a gap
        range = JSIndexRange(18, 28);
        set.removeRange(range);
        TKAssertEquals(set.ranges.length, 2);
        TKAssertEquals(set.ranges[0].start, 8);
        TKAssertEquals(set.ranges[0].end, 17);
        TKAssertEquals(set.ranges[1].start, 29);
        TKAssertEquals(set.ranges[1].end, 52);

        // remove range that matches span
        range = JSIndexRange(60, 65);
        set.addRange(range);
        TKAssertEquals(set.ranges.length, 3);
        TKAssertEquals(set.ranges[2].start, 60);
        TKAssertEquals(set.ranges[2].end, 65);
        set.removeRange(range);
        TKAssertEquals(set.ranges.length, 2);
        TKAssertEquals(set.ranges[0].start, 8);
        TKAssertEquals(set.ranges[0].end, 17);
        TKAssertEquals(set.ranges[1].start, 29);
        TKAssertEquals(set.ranges[1].end, 52);

        // remove range that splits at the start and end, and cuts out another range entirely
        set.addRange(JSIndexRange(20, 24));
        TKAssertEquals(set.ranges.length, 3);
        TKAssertEquals(set.ranges[1].start, 20);
        TKAssertEquals(set.ranges[1].end, 24);
        range = JSIndexRange(15, 30);
        set.removeRange(range);
        TKAssertEquals(set.ranges.length, 2);
        TKAssertEquals(set.ranges[0].start, 8);
        TKAssertEquals(set.ranges[0].end, 14);
        TKAssertEquals(set.ranges[1].start, 31);
        TKAssertEquals(set.ranges[1].end, 52);

        // remove range at very start
        range = JSIndexRange(8,8);
        set.removeRange(range);
        TKAssertEquals(set.ranges.length, 2);
        TKAssertEquals(set.ranges[0].start, 9);
        TKAssertEquals(set.ranges[0].end, 14);
        TKAssertEquals(set.ranges[1].start, 31);
        TKAssertEquals(set.ranges[1].end, 52);

        // remove range at very end
        range = JSIndexRange(52,52);
        set.removeRange(range);
        TKAssertEquals(set.ranges.length, 2);
        TKAssertEquals(set.ranges[0].start, 9);
        TKAssertEquals(set.ranges[0].end, 14);
        TKAssertEquals(set.ranges[1].start, 31);
        TKAssertEquals(set.ranges[1].end, 51);

        // remove unselected range at start
        range = JSIndexRange(3,4);
        set.removeRange(range);
        TKAssertEquals(set.ranges.length, 2);
        TKAssertEquals(set.ranges[0].start, 9);
        TKAssertEquals(set.ranges[0].end, 14);
        TKAssertEquals(set.ranges[1].start, 31);
        TKAssertEquals(set.ranges[1].end, 51);

        // remove unselected range in middle
        range = JSIndexRange(15, 18);
        set.removeRange(range);
        TKAssertEquals(set.ranges.length, 2);
        TKAssertEquals(set.ranges[0].start, 9);
        TKAssertEquals(set.ranges[0].end, 14);
        TKAssertEquals(set.ranges[1].start, 31);
        TKAssertEquals(set.ranges[1].end, 51);

        // remove unselected range after end
        range = JSIndexRange(55, 56);
        set.removeRange(range);
        TKAssertEquals(set.ranges.length, 2);
        TKAssertEquals(set.ranges[0].start, 9);
        TKAssertEquals(set.ranges[0].end, 14);
        TKAssertEquals(set.ranges[1].start, 31);
        TKAssertEquals(set.ranges[1].end, 51);

        // remove multiple ranges
        set.addRange(JSIndexRange(60, 65));
        range = JSIndexRange(20, 70);
        set.removeRange(range);
        TKAssertEquals(set.ranges.length, 1);
        TKAssertEquals(set.ranges[0].start, 9);
        TKAssertEquals(set.ranges[0].end, 14);

        // remove final range
        range = JSIndexRange(9, 14);
        set.removeRange(range);
        TKAssertEquals(set.ranges.length, 0);
    },

    testContains: function(){
        var set = JSIndexSet();
        var range = JSIndexRange(5, 15);
        set.addRange(range);
        TKAssert(!set.contains(1));
        TKAssert(!set.contains(4));
        TKAssert(set.contains(5));
        TKAssert(set.contains(6));
        TKAssert(set.contains(14));
        TKAssert(set.contains(15));
        TKAssert(!set.contains(16));
        TKAssert(!set.contains(20));

        range = JSIndexRange(20, 25);
        set.addRange(range);
        TKAssert(!set.contains(1));
        TKAssert(!set.contains(4));
        TKAssert(set.contains(5));
        TKAssert(set.contains(6));
        TKAssert(set.contains(14));
        TKAssert(set.contains(15));
        TKAssert(!set.contains(16));
        TKAssert(!set.contains(19));
        TKAssert(set.contains(20));
        TKAssert(set.contains(21));
        TKAssert(set.contains(24));
        TKAssert(set.contains(25));
        TKAssert(!set.contains(26));
        TKAssert(!set.contains(40));
    },

});