// #import Foundation
// #import Testkit
/* global JSClass, TKTestSuite, JSBinarySearcher */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
'use strict';

JSClass("JSBinarySearcherTests", TKTestSuite, {

    testInsertionIndexForValue: function(){
        var items = [-5, -2, 0, 2, 3, 4, 6, 7, 8, 10, 50];
        var comparisons = 0;
        var searcher = JSBinarySearcher(items, function(a, b){
            ++comparisons;
            return a - b;
        });
        var index = searcher.insertionIndexForValue(1);
        TKAssertEquals(index, 3);
        TKAssertLessThanOrEquals(comparisons, 4);
        comparisons = 0;

        index = searcher.insertionIndexForValue(0);
        TKAssertEquals(index, 2);
        TKAssertLessThanOrEquals(comparisons, 4);
        comparisons = 0;

        index = searcher.insertionIndexForValue(-5);
        TKAssertEquals(index, 0);
        TKAssertLessThanOrEquals(comparisons, 4);
        comparisons = 0;

        index = searcher.insertionIndexForValue(-6);
        TKAssertEquals(index, 0);
        TKAssertLessThanOrEquals(comparisons, 4);
        comparisons = 0;

        index = searcher.insertionIndexForValue(5);
        TKAssertEquals(index, 6);
        TKAssertLessThanOrEquals(comparisons, 4);
        comparisons = 0;

        index = searcher.insertionIndexForValue(40);
        TKAssertEquals(index, 10);
        TKAssertLessThanOrEquals(comparisons, 4);
        comparisons = 0;

        index = searcher.insertionIndexForValue(50);
        TKAssertEquals(index, 10);
        TKAssertLessThanOrEquals(comparisons, 4);
        comparisons = 0;

        index = searcher.insertionIndexForValue(51);
        TKAssertEquals(index, 11);
        TKAssertLessThanOrEquals(comparisons, 4);
        comparisons = 0;

        index = searcher.insertionIndexForValue(100);
        TKAssertEquals(index, 11);
        TKAssertLessThanOrEquals(comparisons, 4);
        comparisons = 0;
    },

    testItemMatchingValue: function(){
        var items = [{x:-5}, {x:-2}, {x:0}, {x:2}, {x:3}, {x:4}, {x:6}, {x:7}, {x:8}, {x:10}, {x:50}];
        var comparisons = 0;
        var searcher = JSBinarySearcher(items, function(a, b){
            ++comparisons;
            return a - b.x;
        });
        var item = searcher.itemMatchingValue(1);
        TKAssertNull(item);
        TKAssertLessThanOrEquals(comparisons, 4);
        comparisons = 0;

        item = searcher.itemMatchingValue(0);
        TKAssertExactEquals(item, items[2]);
        TKAssertLessThanOrEquals(comparisons, 4);
        comparisons = 0;

        item = searcher.itemMatchingValue(-5);
        TKAssertExactEquals(item, items[0]);
        TKAssertLessThanOrEquals(comparisons, 4);
        comparisons = 0;

        item = searcher.itemMatchingValue(-6);
        TKAssertNull(item);
        TKAssertLessThanOrEquals(comparisons, 4);
        comparisons = 0;

        item = searcher.itemMatchingValue(5);
        TKAssertNull(item);
        TKAssertLessThanOrEquals(comparisons, 4);
        comparisons = 0;

        item = searcher.itemMatchingValue(40);
        TKAssertNull(item);
        TKAssertLessThanOrEquals(comparisons, 4);
        comparisons = 0;

        item = searcher.itemMatchingValue(50);
        TKAssertExactEquals(item, items[10]);
        TKAssertLessThanOrEquals(comparisons, 4);
        comparisons = 0;

        item = searcher.itemMatchingValue(51);
        TKAssertNull(item);
        TKAssertLessThanOrEquals(comparisons, 4);
        comparisons = 0;

        item = searcher.itemMatchingValue(100);
        TKAssertNull(item);
        TKAssertLessThanOrEquals(comparisons, 4);
        comparisons = 0;
    }

});