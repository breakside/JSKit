// #import "Foundation/Foundation.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, JSIndexPath, JSIndexPathRange, JSIndexPathSet */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
'use strict';

JSClass("JSIndexPathSetTests", TKTestSuite, {

    testConstructor: function(){
        var start = JSIndexPath(1, 2);
        var a = JSIndexPathSet(start);
        start.section = 3;
        start.row = 4;
        TKAssertEquals(a.ranges.length, 1);
        TKAssertEquals(a.ranges[0].start.section, 1);
        TKAssertEquals(a.ranges[0].start.row, 2);
        TKAssertEquals(a.ranges[0].end.section, 1);
        TKAssertEquals(a.ranges[0].end.row, 2);

        var end = JSIndexPath(5, 6);
        var range = JSIndexPathRange(start, end);
        a = JSIndexPathSet(range);
        range.start = JSIndexPath(7, 8);
        range.end = JSIndexPath(9, 10);
        TKAssertEquals(a.ranges.length, 1);
        TKAssertEquals(a.ranges[0].start.section, 3);
        TKAssertEquals(a.ranges[0].start.row, 4);
        TKAssertEquals(a.ranges[0].end.section, 5);
        TKAssertEquals(a.ranges[0].end.row, 6);
    },

    testCopyConstructor: function(){
        var a = JSIndexPathSet();
        var b = JSIndexPathSet(a);

        TKAssertEquals(a.ranges.length, b.ranges.length);
        TKAssertNotExactEquals(a.ranges, b.ranges);
        for (var i = 0, l = a.ranges.length; i < l; ++i){
            TKAssertObjectEquals(a.ranges[i], b.ranges[i]);
            TKAssertNotExactEquals(a.ranges[i], b.ranges[i]);
        }
    },

    testAddRange: function(){
        var set = JSIndexPathSet();

        // adding first range
        var range = JSIndexPathRange(JSIndexPath(1, 2), JSIndexPath(3, 4));
        set.addRange(range);
        TKAssertEquals(set.ranges.length, 1);
        TKAssertEquals(set.ranges[0].start.section, 1);
        TKAssertEquals(set.ranges[0].start.row, 2);
        TKAssertEquals(set.ranges[0].end.section, 3);
        TKAssertEquals(set.ranges[0].end.row, 4);

        // adding non-overlapping range
        range = JSIndexPathRange(JSIndexPath(3,7), JSIndexPath(3,10));
        set.addRange(range);
        TKAssertEquals(set.ranges.length, 2);
        TKAssertEquals(set.ranges[1].start.section, 3);
        TKAssertEquals(set.ranges[1].start.row, 7);
        TKAssertEquals(set.ranges[1].end.section, 3);
        TKAssertEquals(set.ranges[1].end.row, 10);

        // adding non-overlapping before other ranges (ranges should be sorted)
        range = JSIndexPathRange(JSIndexPath(0,5), JSIndexPath(0,11));
        set.addRange(range);
        TKAssertEquals(set.ranges.length, 3);
        TKAssertEquals(set.ranges[0].start.section, 0);
        TKAssertEquals(set.ranges[0].start.row, 5);
        TKAssertEquals(set.ranges[0].end.section, 0);
        TKAssertEquals(set.ranges[0].end.row, 11);

        // new range overlaps existing range start (should combine)
        range = JSIndexPathRange(JSIndexPath(0, 3), JSIndexPath(0, 7));
        set.addRange(range);
        TKAssertEquals(set.ranges.length, 3);
        TKAssertEquals(set.ranges[0].start.section, 0);
        TKAssertEquals(set.ranges[0].start.row, 3);
        TKAssertEquals(set.ranges[0].end.section, 0);
        TKAssertEquals(set.ranges[0].end.row, 11);

        // new range adjacent to existing range start (should combine)
        range = JSIndexPathRange(JSIndexPath(0, 1), JSIndexPath(0, 2));
        set.addRange(range);
        TKAssertEquals(set.ranges.length, 3);
        TKAssertEquals(set.ranges[0].start.section, 0);
        TKAssertEquals(set.ranges[0].start.row, 1);
        TKAssertEquals(set.ranges[0].end.section, 0);
        TKAssertEquals(set.ranges[0].end.row, 11);

        // new range overlapping with start only (should combine)
        range = JSIndexPathRange(JSIndexPath(0, 0), JSIndexPath(0, 1));
        set.addRange(range);
        TKAssertEquals(set.ranges.length, 3);
        TKAssertEquals(set.ranges[0].start.section, 0);
        TKAssertEquals(set.ranges[0].start.row, 0);
        TKAssertEquals(set.ranges[0].end.section, 0);
        TKAssertEquals(set.ranges[0].end.row, 11);

        // new range overlapping with existing range end (should combine)
        range = JSIndexPathRange(JSIndexPath(0, 8), JSIndexPath(0, 15));
        set.addRange(range);
        TKAssertEquals(set.ranges.length, 3);
        TKAssertEquals(set.ranges[0].start.section, 0);
        TKAssertEquals(set.ranges[0].start.row, 0);
        TKAssertEquals(set.ranges[0].end.section, 0);
        TKAssertEquals(set.ranges[0].end.row, 15);

        // new range overlapping with esting range start, across section boundaries (should combine)
        range = JSIndexPathRange(JSIndexPath(0, 20), JSIndexPath(1, 5));
        set.addRange(range);
        TKAssertEquals(set.ranges.length, 3);
        TKAssertEquals(set.ranges[1].start.section, 0);
        TKAssertEquals(set.ranges[1].start.row, 20);
        TKAssertEquals(set.ranges[1].end.section, 3);
        TKAssertEquals(set.ranges[1].end.row, 4);

        // new range entirely contained in existing ranges (no op)
        range = JSIndexPathRange(JSIndexPath(2, 0), JSIndexPath(2, 4));
        set.addRange(range);
        TKAssertEquals(set.ranges.length, 3);
        TKAssertEquals(set.ranges[1].start.section, 0);
        TKAssertEquals(set.ranges[1].start.row, 20);
        TKAssertEquals(set.ranges[1].end.section, 3);
        TKAssertEquals(set.ranges[1].end.row, 4);

        // new range overlapping with just end of other range (should combine)
        range = JSIndexPathRange(JSIndexPath(3, 10), JSIndexPath(3, 14));
        set.addRange(range);
        TKAssertEquals(set.ranges.length, 3);
        TKAssertEquals(set.ranges[2].start.section, 3);
        TKAssertEquals(set.ranges[2].start.row, 7);
        TKAssertEquals(set.ranges[2].end.section, 3);
        TKAssertEquals(set.ranges[2].end.row, 14);

        // new range adjacent to end of other range (should combine)
        range = JSIndexPathRange(JSIndexPath(3, 15), JSIndexPath(4, 1));
        set.addRange(range);
        TKAssertEquals(set.ranges.length, 3);
        TKAssertEquals(set.ranges[2].start.section, 3);
        TKAssertEquals(set.ranges[2].start.row, 7);
        TKAssertEquals(set.ranges[2].end.section, 4);
        TKAssertEquals(set.ranges[2].end.row, 1);

        // new range at end, non overlapping
        range = JSIndexPathRange(JSIndexPath(4, 4), JSIndexPath(4, 5));
        set.addRange(range);
        TKAssertEquals(set.ranges.length, 4);
        TKAssertEquals(set.ranges[3].start.section, 4);
        TKAssertEquals(set.ranges[3].start.row, 4);
        TKAssertEquals(set.ranges[3].end.section, 4);
        TKAssertEquals(set.ranges[3].end.row, 5);

        // new range overlapping muliple ranges, (should combine all)
        range = JSIndexPathRange(JSIndexPath(0, 18), JSIndexPath(4, 15));
        set.addRange(range);
        TKAssertEquals(set.ranges.length, 2);
        TKAssertEquals(set.ranges[1].start.section, 0);
        TKAssertEquals(set.ranges[1].start.row, 18);
        TKAssertEquals(set.ranges[1].end.section, 4);
        TKAssertEquals(set.ranges[1].end.row, 15);

        // new range overlapping end of one range and start of another (should combine)
        range = JSIndexPathRange(JSIndexPath(0, 11), JSIndexPath(4, 1));
        set.addRange(range);
        TKAssertEquals(set.ranges.length, 1);
        TKAssertEquals(set.ranges[0].start.section, 0);
        TKAssertEquals(set.ranges[0].start.row, 0);
        TKAssertEquals(set.ranges[0].end.section, 4);
        TKAssertEquals(set.ranges[0].end.row, 15);
    },

    testRemoveRange: function(){
        var numberOfRowsBySection = [5,10,20,30,40,0,60,0,80,90];
        var set = JSIndexPathSet();
        var range = JSIndexPathRange(JSIndexPath(0, 0), JSIndexPath(9, 10));
        set.addRange(range);
        TKAssertEquals(set.ranges.length, 1);
        TKAssertEquals(set.ranges[0].start.section, 0);
        TKAssertEquals(set.ranges[0].start.row, 0);
        TKAssertEquals(set.ranges[0].end.section, 9);
        TKAssertEquals(set.ranges[0].end.row, 10);

        // remove range not on section boundaries
        range = JSIndexPathRange(JSIndexPath(4, 12), JSIndexPath(4, 15));
        set.removeRange(range, numberOfRowsBySection);
        TKAssertEquals(set.ranges.length, 2);
        TKAssertEquals(set.ranges[0].start.section, 0);
        TKAssertEquals(set.ranges[0].start.row, 0);
        TKAssertEquals(set.ranges[0].end.section, 4);
        TKAssertEquals(set.ranges[0].end.row, 11);
        TKAssertEquals(set.ranges[1].start.section, 4);
        TKAssertEquals(set.ranges[1].start.row, 16);
        TKAssertEquals(set.ranges[1].end.section, 9);
        TKAssertEquals(set.ranges[1].end.row, 10);

        // remove range on section boundaries
        range = JSIndexPathRange(JSIndexPath(3, 0), JSIndexPath(3, 29));
        set.removeRange(range, numberOfRowsBySection);
        TKAssertEquals(set.ranges.length, 3);
        TKAssertEquals(set.ranges[0].start.section, 0);
        TKAssertEquals(set.ranges[0].start.row, 0);
        TKAssertEquals(set.ranges[0].end.section, 2);
        TKAssertEquals(set.ranges[0].end.row, 19);
        TKAssertEquals(set.ranges[1].start.section, 4);
        TKAssertEquals(set.ranges[1].start.row, 0);
        TKAssertEquals(set.ranges[1].end.section, 4);
        TKAssertEquals(set.ranges[1].end.row, 11);
        TKAssertEquals(set.ranges[2].start.section, 4);
        TKAssertEquals(set.ranges[2].start.row, 16);
        TKAssertEquals(set.ranges[2].end.section, 9);
        TKAssertEquals(set.ranges[2].end.row, 10);

        // remove index path on low side of zero-length section
        range = JSIndexPathRange(JSIndexPath(4,39), JSIndexPath(4,39));
        set.removeRange(range, numberOfRowsBySection);
        TKAssertEquals(set.ranges.length, 4);
        TKAssertEquals(set.ranges[0].start.section, 0);
        TKAssertEquals(set.ranges[0].start.row, 0);
        TKAssertEquals(set.ranges[0].end.section, 2);
        TKAssertEquals(set.ranges[0].end.row, 19);
        TKAssertEquals(set.ranges[1].start.section, 4);
        TKAssertEquals(set.ranges[1].start.row, 0);
        TKAssertEquals(set.ranges[1].end.section, 4);
        TKAssertEquals(set.ranges[1].end.row, 11);
        TKAssertEquals(set.ranges[2].start.section, 4);
        TKAssertEquals(set.ranges[2].start.row, 16);
        TKAssertEquals(set.ranges[2].end.section, 4);
        TKAssertEquals(set.ranges[2].end.row, 38);
        TKAssertEquals(set.ranges[3].start.section, 6);
        TKAssertEquals(set.ranges[3].start.row, 0);
        TKAssertEquals(set.ranges[3].end.section, 9);
        TKAssertEquals(set.ranges[3].end.row, 10);

        // remove index path on high side of zero-length section
        range = JSIndexPathRange(JSIndexPath(8,0), JSIndexPath(8,0));
        set.removeRange(range, numberOfRowsBySection);
        TKAssertEquals(set.ranges.length, 5);
        TKAssertEquals(set.ranges[0].start.section, 0);
        TKAssertEquals(set.ranges[0].start.row, 0);
        TKAssertEquals(set.ranges[0].end.section, 2);
        TKAssertEquals(set.ranges[0].end.row, 19);
        TKAssertEquals(set.ranges[1].start.section, 4);
        TKAssertEquals(set.ranges[1].start.row, 0);
        TKAssertEquals(set.ranges[1].end.section, 4);
        TKAssertEquals(set.ranges[1].end.row, 11);
        TKAssertEquals(set.ranges[2].start.section, 4);
        TKAssertEquals(set.ranges[2].start.row, 16);
        TKAssertEquals(set.ranges[2].end.section, 4);
        TKAssertEquals(set.ranges[2].end.row, 38);
        TKAssertEquals(set.ranges[3].start.section, 6);
        TKAssertEquals(set.ranges[3].start.row, 0);
        TKAssertEquals(set.ranges[3].end.section, 6);
        TKAssertEquals(set.ranges[3].end.row, 59);
        TKAssertEquals(set.ranges[4].start.section, 8);
        TKAssertEquals(set.ranges[4].start.row, 1);
        TKAssertEquals(set.ranges[4].end.section, 9);
        TKAssertEquals(set.ranges[4].end.row, 10);

        // remove range that starts before a selected range
        range = JSIndexPathRange(JSIndexPath(3,15), JSIndexPath(4,2));
        set.removeRange(range, numberOfRowsBySection);
        TKAssertEquals(set.ranges.length, 5);
        TKAssertEquals(set.ranges[0].start.section, 0);
        TKAssertEquals(set.ranges[0].start.row, 0);
        TKAssertEquals(set.ranges[0].end.section, 2);
        TKAssertEquals(set.ranges[0].end.row, 19);
        TKAssertEquals(set.ranges[1].start.section, 4);
        TKAssertEquals(set.ranges[1].start.row, 3);
        TKAssertEquals(set.ranges[1].end.section, 4);
        TKAssertEquals(set.ranges[1].end.row, 11);
        TKAssertEquals(set.ranges[2].start.section, 4);
        TKAssertEquals(set.ranges[2].start.row, 16);
        TKAssertEquals(set.ranges[2].end.section, 4);
        TKAssertEquals(set.ranges[2].end.row, 38);
        TKAssertEquals(set.ranges[3].start.section, 6);
        TKAssertEquals(set.ranges[3].start.row, 0);
        TKAssertEquals(set.ranges[3].end.section, 6);
        TKAssertEquals(set.ranges[3].end.row, 59);
        TKAssertEquals(set.ranges[4].start.section, 8);
        TKAssertEquals(set.ranges[4].start.row, 1);
        TKAssertEquals(set.ranges[4].end.section, 9);
        TKAssertEquals(set.ranges[4].end.row, 10);

        // remove range that ends after a selected range
        range = JSIndexPathRange(JSIndexPath(2,12), JSIndexPath(3,5));
        set.removeRange(range, numberOfRowsBySection);
        TKAssertEquals(set.ranges.length, 5);
        TKAssertEquals(set.ranges[0].start.section, 0);
        TKAssertEquals(set.ranges[0].start.row, 0);
        TKAssertEquals(set.ranges[0].end.section, 2);
        TKAssertEquals(set.ranges[0].end.row, 11);
        TKAssertEquals(set.ranges[1].start.section, 4);
        TKAssertEquals(set.ranges[1].start.row, 3);
        TKAssertEquals(set.ranges[1].end.section, 4);
        TKAssertEquals(set.ranges[1].end.row, 11);
        TKAssertEquals(set.ranges[2].start.section, 4);
        TKAssertEquals(set.ranges[2].start.row, 16);
        TKAssertEquals(set.ranges[2].end.section, 4);
        TKAssertEquals(set.ranges[2].end.row, 38);
        TKAssertEquals(set.ranges[3].start.section, 6);
        TKAssertEquals(set.ranges[3].start.row, 0);
        TKAssertEquals(set.ranges[3].end.section, 6);
        TKAssertEquals(set.ranges[3].end.row, 59);
        TKAssertEquals(set.ranges[4].start.section, 8);
        TKAssertEquals(set.ranges[4].start.row, 1);
        TKAssertEquals(set.ranges[4].end.section, 9);
        TKAssertEquals(set.ranges[4].end.row, 10);

        // remove range that spans a gap
        range = JSIndexPathRange(JSIndexPath(2,5), JSIndexPath(4,6));
        set.removeRange(range, numberOfRowsBySection);
        TKAssertEquals(set.ranges.length, 5);
        TKAssertEquals(set.ranges[0].start.section, 0);
        TKAssertEquals(set.ranges[0].start.row, 0);
        TKAssertEquals(set.ranges[0].end.section, 2);
        TKAssertEquals(set.ranges[0].end.row, 4);
        TKAssertEquals(set.ranges[1].start.section, 4);
        TKAssertEquals(set.ranges[1].start.row, 7);
        TKAssertEquals(set.ranges[1].end.section, 4);
        TKAssertEquals(set.ranges[1].end.row, 11);
        TKAssertEquals(set.ranges[2].start.section, 4);
        TKAssertEquals(set.ranges[2].start.row, 16);
        TKAssertEquals(set.ranges[2].end.section, 4);
        TKAssertEquals(set.ranges[2].end.row, 38);
        TKAssertEquals(set.ranges[3].start.section, 6);
        TKAssertEquals(set.ranges[3].start.row, 0);
        TKAssertEquals(set.ranges[3].end.section, 6);
        TKAssertEquals(set.ranges[3].end.row, 59);
        TKAssertEquals(set.ranges[4].start.section, 8);
        TKAssertEquals(set.ranges[4].start.row, 1);
        TKAssertEquals(set.ranges[4].end.section, 9);
        TKAssertEquals(set.ranges[4].end.row, 10);

        // remove range that matches span
        range = JSIndexPathRange(JSIndexPath(4,16), JSIndexPath(4,38));
        set.removeRange(range, numberOfRowsBySection);
        TKAssertEquals(set.ranges.length, 4);
        TKAssertEquals(set.ranges[0].start.section, 0);
        TKAssertEquals(set.ranges[0].start.row, 0);
        TKAssertEquals(set.ranges[0].end.section, 2);
        TKAssertEquals(set.ranges[0].end.row, 4);
        TKAssertEquals(set.ranges[1].start.section, 4);
        TKAssertEquals(set.ranges[1].start.row, 7);
        TKAssertEquals(set.ranges[1].end.section, 4);
        TKAssertEquals(set.ranges[1].end.row, 11);
        TKAssertEquals(set.ranges[2].start.section, 6);
        TKAssertEquals(set.ranges[2].start.row, 0);
        TKAssertEquals(set.ranges[2].end.section, 6);
        TKAssertEquals(set.ranges[2].end.row, 59);
        TKAssertEquals(set.ranges[3].start.section, 8);
        TKAssertEquals(set.ranges[3].start.row, 1);
        TKAssertEquals(set.ranges[3].end.section, 9);
        TKAssertEquals(set.ranges[3].end.row, 10);

        // remove range that splits at the start and end, and cuts out another range entirely
        range = JSIndexPathRange(JSIndexPath(4,9), JSIndexPath(8,5));
        set.removeRange(range, numberOfRowsBySection);
        TKAssertEquals(set.ranges.length, 3);
        TKAssertEquals(set.ranges[0].start.section, 0);
        TKAssertEquals(set.ranges[0].start.row, 0);
        TKAssertEquals(set.ranges[0].end.section, 2);
        TKAssertEquals(set.ranges[0].end.row, 4);
        TKAssertEquals(set.ranges[1].start.section, 4);
        TKAssertEquals(set.ranges[1].start.row, 7);
        TKAssertEquals(set.ranges[1].end.section, 4);
        TKAssertEquals(set.ranges[1].end.row, 8);
        TKAssertEquals(set.ranges[2].start.section, 8);
        TKAssertEquals(set.ranges[2].start.row, 6);
        TKAssertEquals(set.ranges[2].end.section, 9);
        TKAssertEquals(set.ranges[2].end.row, 10);

        // remove range at very start
        range = JSIndexPathRange(JSIndexPath(0,0), JSIndexPath(0,3));
        set.removeRange(range, numberOfRowsBySection);
        TKAssertEquals(set.ranges.length, 3);
        TKAssertEquals(set.ranges[0].start.section, 0);
        TKAssertEquals(set.ranges[0].start.row, 4);
        TKAssertEquals(set.ranges[0].end.section, 2);
        TKAssertEquals(set.ranges[0].end.row, 4);
        TKAssertEquals(set.ranges[1].start.section, 4);
        TKAssertEquals(set.ranges[1].start.row, 7);
        TKAssertEquals(set.ranges[1].end.section, 4);
        TKAssertEquals(set.ranges[1].end.row, 8);
        TKAssertEquals(set.ranges[2].start.section, 8);
        TKAssertEquals(set.ranges[2].start.row, 6);
        TKAssertEquals(set.ranges[2].end.section, 9);
        TKAssertEquals(set.ranges[2].end.row, 10);

        // remove range at end
        range = JSIndexPathRange(JSIndexPath(9,0), JSIndexPath(9,10));
        set.removeRange(range, numberOfRowsBySection);
        TKAssertEquals(set.ranges.length, 3);
        TKAssertEquals(set.ranges[0].start.section, 0);
        TKAssertEquals(set.ranges[0].start.row, 4);
        TKAssertEquals(set.ranges[0].end.section, 2);
        TKAssertEquals(set.ranges[0].end.row, 4);
        TKAssertEquals(set.ranges[1].start.section, 4);
        TKAssertEquals(set.ranges[1].start.row, 7);
        TKAssertEquals(set.ranges[1].end.section, 4);
        TKAssertEquals(set.ranges[1].end.row, 8);
        TKAssertEquals(set.ranges[2].start.section, 8);
        TKAssertEquals(set.ranges[2].start.row, 6);
        TKAssertEquals(set.ranges[2].end.section, 8);
        TKAssertEquals(set.ranges[2].end.row, 79);

        // remove range at very end
        range = JSIndexPathRange(JSIndexPath(8,10), JSIndexPath(8,79));
        set.removeRange(range, numberOfRowsBySection);
        TKAssertEquals(set.ranges.length, 3);
        TKAssertEquals(set.ranges[0].start.section, 0);
        TKAssertEquals(set.ranges[0].start.row, 4);
        TKAssertEquals(set.ranges[0].end.section, 2);
        TKAssertEquals(set.ranges[0].end.row, 4);
        TKAssertEquals(set.ranges[1].start.section, 4);
        TKAssertEquals(set.ranges[1].start.row, 7);
        TKAssertEquals(set.ranges[1].end.section, 4);
        TKAssertEquals(set.ranges[1].end.row, 8);
        TKAssertEquals(set.ranges[2].start.section, 8);
        TKAssertEquals(set.ranges[2].start.row, 6);
        TKAssertEquals(set.ranges[2].end.section, 8);
        TKAssertEquals(set.ranges[2].end.row, 9);

        // remove unselected range at start
        range = JSIndexPathRange(JSIndexPath(0,1), JSIndexPath(0,2));
        set.removeRange(range, numberOfRowsBySection);
        TKAssertEquals(set.ranges.length, 3);
        TKAssertEquals(set.ranges[0].start.section, 0);
        TKAssertEquals(set.ranges[0].start.row, 4);
        TKAssertEquals(set.ranges[0].end.section, 2);
        TKAssertEquals(set.ranges[0].end.row, 4);
        TKAssertEquals(set.ranges[1].start.section, 4);
        TKAssertEquals(set.ranges[1].start.row, 7);
        TKAssertEquals(set.ranges[1].end.section, 4);
        TKAssertEquals(set.ranges[1].end.row, 8);
        TKAssertEquals(set.ranges[2].start.section, 8);
        TKAssertEquals(set.ranges[2].start.row, 6);
        TKAssertEquals(set.ranges[2].end.section, 8);
        TKAssertEquals(set.ranges[2].end.row, 9);

        // remove unselected range in middle
        range = JSIndexPathRange(JSIndexPath(2,10), JSIndexPath(2,12));
        set.removeRange(range, numberOfRowsBySection);
        TKAssertEquals(set.ranges.length, 3);
        TKAssertEquals(set.ranges[0].start.section, 0);
        TKAssertEquals(set.ranges[0].start.row, 4);
        TKAssertEquals(set.ranges[0].end.section, 2);
        TKAssertEquals(set.ranges[0].end.row, 4);
        TKAssertEquals(set.ranges[1].start.section, 4);
        TKAssertEquals(set.ranges[1].start.row, 7);
        TKAssertEquals(set.ranges[1].end.section, 4);
        TKAssertEquals(set.ranges[1].end.row, 8);
        TKAssertEquals(set.ranges[2].start.section, 8);
        TKAssertEquals(set.ranges[2].start.row, 6);
        TKAssertEquals(set.ranges[2].end.section, 8);
        TKAssertEquals(set.ranges[2].end.row, 9);

        // remove unselected range after end
        range = JSIndexPathRange(JSIndexPath(8,20), JSIndexPath(8,30));
        set.removeRange(range, numberOfRowsBySection);
        TKAssertEquals(set.ranges.length, 3);
        TKAssertEquals(set.ranges[0].start.section, 0);
        TKAssertEquals(set.ranges[0].start.row, 4);
        TKAssertEquals(set.ranges[0].end.section, 2);
        TKAssertEquals(set.ranges[0].end.row, 4);
        TKAssertEquals(set.ranges[1].start.section, 4);
        TKAssertEquals(set.ranges[1].start.row, 7);
        TKAssertEquals(set.ranges[1].end.section, 4);
        TKAssertEquals(set.ranges[1].end.row, 8);
        TKAssertEquals(set.ranges[2].start.section, 8);
        TKAssertEquals(set.ranges[2].start.row, 6);
        TKAssertEquals(set.ranges[2].end.section, 8);
        TKAssertEquals(set.ranges[2].end.row, 9);

        // remove multiple ranges
        range = JSIndexPathRange(JSIndexPath(0,1), JSIndexPath(4,20));
        set.removeRange(range, numberOfRowsBySection);
        TKAssertEquals(set.ranges.length, 1);
        TKAssertEquals(set.ranges[0].start.section, 8);
        TKAssertEquals(set.ranges[0].start.row, 6);
        TKAssertEquals(set.ranges[0].end.section, 8);
        TKAssertEquals(set.ranges[0].end.row, 9);

        // remove final range
        range = JSIndexPathRange(JSIndexPath(8,0), JSIndexPath(8,79));
        set.removeRange(range, numberOfRowsBySection);
        TKAssertEquals(set.ranges.length, 0);

        // reset
        numberOfRowsBySection = [20,20,20,20];
        range = JSIndexPathRange(JSIndexPath(0, 4), JSIndexPath(0, 10));
        set.addRange(range);
        range = JSIndexPathRange(JSIndexPath(1, 2), JSIndexPath(1, 7));
        set.addRange(range);
        range = JSIndexPathRange(JSIndexPath(2, 3), JSIndexPath(2, 11));
        set.addRange(range);
        range = JSIndexPathRange(JSIndexPath(3, 0), JSIndexPath(3, 5));
        set.addRange(range);

        // removal range at start
        range = JSIndexPathRange(JSIndexPath(0, 4), JSIndexPath(0, 6));
        set.removeRange(range, numberOfRowsBySection);
        TKAssertEquals(set.ranges.length, 4);
        TKAssertEquals(set.ranges[0].start.section, 0);
        TKAssertEquals(set.ranges[0].start.row, 7);
        TKAssertEquals(set.ranges[0].end.section, 0);
        TKAssertEquals(set.ranges[0].end.row, 10);
        TKAssertEquals(set.ranges[1].start.section, 1);
        TKAssertEquals(set.ranges[1].start.row, 2);
        TKAssertEquals(set.ranges[1].end.section, 1);
        TKAssertEquals(set.ranges[1].end.row, 7);
        TKAssertEquals(set.ranges[2].start.section, 2);
        TKAssertEquals(set.ranges[2].start.row, 3);
        TKAssertEquals(set.ranges[2].end.section, 2);
        TKAssertEquals(set.ranges[2].end.row, 11);
        TKAssertEquals(set.ranges[3].start.section, 3);
        TKAssertEquals(set.ranges[3].start.row, 0);
        TKAssertEquals(set.ranges[3].end.section, 3);
        TKAssertEquals(set.ranges[3].end.row, 5);

        // removal range at start, splitting next range
        range = JSIndexPathRange(JSIndexPath(0, 6), JSIndexPath(1, 4));
        set.removeRange(range, numberOfRowsBySection);
        TKAssertEquals(set.ranges.length, 3);
        TKAssertEquals(set.ranges[0].start.section, 1);
        TKAssertEquals(set.ranges[0].start.row, 5);
        TKAssertEquals(set.ranges[0].end.section, 1);
        TKAssertEquals(set.ranges[0].end.row, 7);
        TKAssertEquals(set.ranges[1].start.section, 2);
        TKAssertEquals(set.ranges[1].start.row, 3);
        TKAssertEquals(set.ranges[1].end.section, 2);
        TKAssertEquals(set.ranges[1].end.row, 11);
        TKAssertEquals(set.ranges[2].start.section, 3);
        TKAssertEquals(set.ranges[2].start.row, 0);
        TKAssertEquals(set.ranges[2].end.section, 3);
        TKAssertEquals(set.ranges[2].end.row, 5);

        // removal range at start, matching end of next range
        range = JSIndexPathRange(JSIndexPath(1, 5), JSIndexPath(2, 11));
        set.removeRange(range, numberOfRowsBySection);
        TKAssertEquals(set.ranges.length, 1);
        TKAssertEquals(set.ranges[0].start.section, 3);
        TKAssertEquals(set.ranges[0].start.row, 0);
        TKAssertEquals(set.ranges[0].end.section, 3);
        TKAssertEquals(set.ranges[0].end.row, 5);

        // removal of final range
        range = JSIndexPathRange(JSIndexPath(3, 0), JSIndexPath(3, 5));
        set.removeRange(range, numberOfRowsBySection);
        TKAssertEquals(set.ranges.length, 0);

        // reset
        range = JSIndexPathRange(JSIndexPath(0, 4), JSIndexPath(0, 10));
        set.addRange(range);
        range = JSIndexPathRange(JSIndexPath(1, 2), JSIndexPath(1, 7));
        set.addRange(range);
        range = JSIndexPathRange(JSIndexPath(2, 3), JSIndexPath(2, 11));
        set.addRange(range);
        range = JSIndexPathRange(JSIndexPath(3, 0), JSIndexPath(3, 5));
        set.addRange(range);

        // removal range at end
        range = JSIndexPathRange(JSIndexPath(3, 2), JSIndexPath(3, 5));
        set.removeRange(range, numberOfRowsBySection);
        TKAssertEquals(set.ranges.length, 4);
        TKAssertEquals(set.ranges[0].start.section, 0);
        TKAssertEquals(set.ranges[0].start.row, 4);
        TKAssertEquals(set.ranges[0].end.section, 0);
        TKAssertEquals(set.ranges[0].end.row, 10);
        TKAssertEquals(set.ranges[1].start.section, 1);
        TKAssertEquals(set.ranges[1].start.row, 2);
        TKAssertEquals(set.ranges[1].end.section, 1);
        TKAssertEquals(set.ranges[1].end.row, 7);
        TKAssertEquals(set.ranges[2].start.section, 2);
        TKAssertEquals(set.ranges[2].start.row, 3);
        TKAssertEquals(set.ranges[2].end.section, 2);
        TKAssertEquals(set.ranges[2].end.row, 11);
        TKAssertEquals(set.ranges[3].start.section, 3);
        TKAssertEquals(set.ranges[3].start.row, 0);
        TKAssertEquals(set.ranges[3].end.section, 3);
        TKAssertEquals(set.ranges[3].end.row, 1);

        // removal range at end, splitting previous range
        range = JSIndexPathRange(JSIndexPath(2, 8), JSIndexPath(3, 1));
        set.removeRange(range, numberOfRowsBySection);
        TKAssertEquals(set.ranges.length, 3);
        TKAssertEquals(set.ranges[0].start.section, 0);
        TKAssertEquals(set.ranges[0].start.row, 4);
        TKAssertEquals(set.ranges[0].end.section, 0);
        TKAssertEquals(set.ranges[0].end.row, 10);
        TKAssertEquals(set.ranges[1].start.section, 1);
        TKAssertEquals(set.ranges[1].start.row, 2);
        TKAssertEquals(set.ranges[1].end.section, 1);
        TKAssertEquals(set.ranges[1].end.row, 7);
        TKAssertEquals(set.ranges[2].start.section, 2);
        TKAssertEquals(set.ranges[2].start.row, 3);
        TKAssertEquals(set.ranges[2].end.section, 2);
        TKAssertEquals(set.ranges[2].end.row, 7);

        // removal range at end, matching start of prev range
        range = JSIndexPathRange(JSIndexPath(1, 2), JSIndexPath(2, 7));
        set.removeRange(range, numberOfRowsBySection);
        TKAssertEquals(set.ranges.length, 1);
        TKAssertEquals(set.ranges[0].start.section, 0);
        TKAssertEquals(set.ranges[0].start.row, 4);
        TKAssertEquals(set.ranges[0].end.section, 0);
        TKAssertEquals(set.ranges[0].end.row, 10);

        // removal of final range
        range = JSIndexPathRange(JSIndexPath(0, 4), JSIndexPath(0, 10));
        set.removeRange(range, numberOfRowsBySection);
        TKAssertEquals(set.ranges.length, 0);

        // single index path operations
        set.addIndexPath(JSIndexPath(0,1));
        set.addIndexPath(JSIndexPath(0,3));
        set.addIndexPath(JSIndexPath(0,5));
        TKAssertEquals(set.ranges.length, 3);
        TKAssertEquals(set.ranges[0].start.section, 0);
        TKAssertEquals(set.ranges[0].start.row, 1);
        TKAssertEquals(set.ranges[0].end.section, 0);
        TKAssertEquals(set.ranges[0].end.row, 1);
        TKAssertEquals(set.ranges[1].start.section, 0);
        TKAssertEquals(set.ranges[1].start.row, 3);
        TKAssertEquals(set.ranges[1].end.section, 0);
        TKAssertEquals(set.ranges[1].end.row, 3);
        TKAssertEquals(set.ranges[2].start.section, 0);
        TKAssertEquals(set.ranges[2].start.row, 5);
        TKAssertEquals(set.ranges[2].end.section, 0);
        TKAssertEquals(set.ranges[2].end.row, 5);
        set.removeIndexPath(JSIndexPath(0, 3), numberOfRowsBySection);
        TKAssertEquals(set.ranges.length, 2);
        TKAssertEquals(set.ranges[0].start.section, 0);
        TKAssertEquals(set.ranges[0].start.row, 1);
        TKAssertEquals(set.ranges[0].end.section, 0);
        TKAssertEquals(set.ranges[0].end.row, 1);
        TKAssertEquals(set.ranges[1].start.section, 0);
        TKAssertEquals(set.ranges[1].start.row, 5);
        TKAssertEquals(set.ranges[1].end.section, 0);
        TKAssertEquals(set.ranges[1].end.row, 5);
        set.removeIndexPath(JSIndexPath(0, 1), numberOfRowsBySection);
        TKAssertEquals(set.ranges.length, 1);
        TKAssertEquals(set.ranges[0].start.section, 0);
        TKAssertEquals(set.ranges[0].start.row, 5);
        TKAssertEquals(set.ranges[0].end.section, 0);
        TKAssertEquals(set.ranges[0].end.row, 5);
        set.removeIndexPath(JSIndexPath(0, 5), numberOfRowsBySection);
        TKAssertEquals(set.ranges.length, 0);
    },

    testContains: function(){
        var set = JSIndexPathSet();
        var range = JSIndexPathRange(JSIndexPath(1, 2), JSIndexPath(3, 4));
        set.addRange(range);
        TKAssert(set.contains(JSIndexPath(1, 2)));
        TKAssert(set.contains(JSIndexPath(3, 4)));
        TKAssert(set.contains(JSIndexPath(2, 100)));
        TKAssert(!set.contains(JSIndexPath(1, 1)));
        TKAssert(!set.contains(JSIndexPath(0, 3)));
        TKAssert(!set.contains(JSIndexPath(3, 5)));
        TKAssert(!set.contains(JSIndexPath(4, 1)));

        range = JSIndexPathRange(JSIndexPath(5, 6), JSIndexPath(7, 8));
        set.addRange(range);
        TKAssert(set.contains(JSIndexPath(1, 2)));
        TKAssert(set.contains(JSIndexPath(3, 4)));
        TKAssert(set.contains(JSIndexPath(2, 100)));
        TKAssert(!set.contains(JSIndexPath(1, 1)));
        TKAssert(!set.contains(JSIndexPath(0, 3)));
        TKAssert(!set.contains(JSIndexPath(3, 5)));
        TKAssert(!set.contains(JSIndexPath(4, 1)));
        TKAssert(set.contains(JSIndexPath(5, 6)));
        TKAssert(set.contains(JSIndexPath(7, 8)));
        TKAssert(set.contains(JSIndexPath(6, 100)));
        TKAssert(!set.contains(JSIndexPath(5, 5)));
        TKAssert(!set.contains(JSIndexPath(4, 7)));
        TKAssert(!set.contains(JSIndexPath(7, 9)));
        TKAssert(!set.contains(JSIndexPath(8, 1)));
    },

});