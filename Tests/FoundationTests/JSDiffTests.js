// #import Foundation
// #import TestKit
"use strict";

JSClass("JSDiffTests", TKTestSuite, {

    testCommonIndexes: function(){
        // Insert at end
        var diff = JSDiff.initWithStrings("ABCDEF", "ABCDEFG");
        var indexes = diff.commonIndexes;
        TKAssertEquals(indexes.length, 6);
        TKAssertEquals(indexes[0][0], 0);
        TKAssertEquals(indexes[0][1], 0);
        TKAssertEquals(indexes[1][0], 1);
        TKAssertEquals(indexes[1][1], 1);
        TKAssertEquals(indexes[2][0], 2);
        TKAssertEquals(indexes[2][1], 2);
        TKAssertEquals(indexes[3][0], 3);
        TKAssertEquals(indexes[3][1], 3);
        TKAssertEquals(indexes[4][0], 4);
        TKAssertEquals(indexes[4][1], 4);
        TKAssertEquals(indexes[5][0], 5);
        TKAssertEquals(indexes[5][1], 5);

        // Insert at start
        diff = JSDiff.initWithStrings("ABCDEF", "0ABCDEF");
        indexes = diff.commonIndexes;
        TKAssertEquals(indexes.length, 6);
        TKAssertEquals(indexes[0][0], 0);
        TKAssertEquals(indexes[0][1], 1);
        TKAssertEquals(indexes[1][0], 1);
        TKAssertEquals(indexes[1][1], 2);
        TKAssertEquals(indexes[2][0], 2);
        TKAssertEquals(indexes[2][1], 3);
        TKAssertEquals(indexes[3][0], 3);
        TKAssertEquals(indexes[3][1], 4);
        TKAssertEquals(indexes[4][0], 4);
        TKAssertEquals(indexes[4][1], 5);
        TKAssertEquals(indexes[5][0], 5);
        TKAssertEquals(indexes[5][1], 6);

        // Insert in middle
        diff = JSDiff.initWithStrings("ABCDEF", "ABC-DEF");
        indexes = diff.commonIndexes;
        TKAssertEquals(indexes.length, 6);
        TKAssertEquals(indexes[0][0], 0);
        TKAssertEquals(indexes[0][1], 0);
        TKAssertEquals(indexes[1][0], 1);
        TKAssertEquals(indexes[1][1], 1);
        TKAssertEquals(indexes[2][0], 2);
        TKAssertEquals(indexes[2][1], 2);
        TKAssertEquals(indexes[3][0], 3);
        TKAssertEquals(indexes[3][1], 4);
        TKAssertEquals(indexes[4][0], 4);
        TKAssertEquals(indexes[4][1], 5);
        TKAssertEquals(indexes[5][0], 5);
        TKAssertEquals(indexes[5][1], 6);

        // Delete from start
        diff = JSDiff.initWithStrings("ABCDEF", "BCDEF");
        indexes = diff.commonIndexes;
        TKAssertEquals(indexes.length, 5);
        TKAssertEquals(indexes[0][0], 1);
        TKAssertEquals(indexes[0][1], 0);
        TKAssertEquals(indexes[1][0], 2);
        TKAssertEquals(indexes[1][1], 1);
        TKAssertEquals(indexes[2][0], 3);
        TKAssertEquals(indexes[2][1], 2);
        TKAssertEquals(indexes[3][0], 4);
        TKAssertEquals(indexes[3][1], 3);
        TKAssertEquals(indexes[4][0], 5);
        TKAssertEquals(indexes[4][1], 4);

        // Delete from end
        diff = JSDiff.initWithStrings("ABCDEF", "ABCDE");
        indexes = diff.commonIndexes;
        TKAssertEquals(indexes.length, 5);
        TKAssertEquals(indexes[0][0], 0);
        TKAssertEquals(indexes[0][1], 0);
        TKAssertEquals(indexes[1][0], 1);
        TKAssertEquals(indexes[1][1], 1);
        TKAssertEquals(indexes[2][0], 2);
        TKAssertEquals(indexes[2][1], 2);
        TKAssertEquals(indexes[3][0], 3);
        TKAssertEquals(indexes[3][1], 3);
        TKAssertEquals(indexes[4][0], 4);
        TKAssertEquals(indexes[4][1], 4);

        // Delete from middle
        diff = JSDiff.initWithStrings("ABCDEF", "ABDEF");
        indexes = diff.commonIndexes;
        TKAssertEquals(indexes.length, 5);
        TKAssertEquals(indexes[0][0], 0);
        TKAssertEquals(indexes[0][1], 0);
        TKAssertEquals(indexes[1][0], 1);
        TKAssertEquals(indexes[1][1], 1);
        TKAssertEquals(indexes[2][0], 3);
        TKAssertEquals(indexes[2][1], 2);
        TKAssertEquals(indexes[3][0], 4);
        TKAssertEquals(indexes[3][1], 3);
        TKAssertEquals(indexes[4][0], 5);
        TKAssertEquals(indexes[4][1], 4);

        // move from start to end
        diff = JSDiff.initWithStrings("ABCDEF", "BCDEFA");
        indexes = diff.commonIndexes;
        TKAssertEquals(indexes.length, 5);
        TKAssertEquals(indexes[0][0], 1);
        TKAssertEquals(indexes[0][1], 0);
        TKAssertEquals(indexes[1][0], 2);
        TKAssertEquals(indexes[1][1], 1);
        TKAssertEquals(indexes[2][0], 3);
        TKAssertEquals(indexes[2][1], 2);
        TKAssertEquals(indexes[3][0], 4);
        TKAssertEquals(indexes[3][1], 3);
        TKAssertEquals(indexes[4][0], 5);
        TKAssertEquals(indexes[4][1], 4);

        // delete and insert
        diff = JSDiff.initWithStrings("ABCDEF", "ACDEFG");
        indexes = diff.commonIndexes;
        TKAssertEquals(indexes.length, 5);
        TKAssertEquals(indexes[0][0], 0);
        TKAssertEquals(indexes[0][1], 0);
        TKAssertEquals(indexes[1][0], 2);
        TKAssertEquals(indexes[1][1], 1);
        TKAssertEquals(indexes[2][0], 3);
        TKAssertEquals(indexes[2][1], 2);
        TKAssertEquals(indexes[3][0], 4);
        TKAssertEquals(indexes[3][1], 3);
        TKAssertEquals(indexes[4][0], 5);
        TKAssertEquals(indexes[4][1], 4);
    },

    testPerformance: function(){
        var a = [];
        var b = [];
        var i;
        var n = 1000;
        for (i = 0; i < n; ++i){
            a.push(i);
            b.push(i);
        }

        // insert at end
        b.push(n);
        var diff = JSDiff.initWithArrays(a, b);
        var indexes = diff.commonIndexes;
        TKAssertEquals(indexes.length, n);
        TKAssertLessThanOrEquals(diff.comparisonCount, n + 2);
        TKAssertLessThanOrEquals(diff.recursionCount, 2);
        b.pop();

        // delete from end
        a.push(n);
        diff = JSDiff.initWithArrays(a, b);
        indexes = diff.commonIndexes;
        TKAssertEquals(indexes.length, n);
        TKAssertLessThanOrEquals(diff.comparisonCount, n + 2);
        TKAssertLessThanOrEquals(diff.recursionCount, 2);
        a.pop();

        // insert at start
        b.unshift(-1);
        diff = JSDiff.initWithArrays(a, b);
        indexes = diff.commonIndexes;
        TKAssertEquals(indexes.length, n);
        TKAssertLessThanOrEquals(diff.comparisonCount, n + 3);
        TKAssertLessThanOrEquals(diff.recursionCount, 2);
        b.shift();

        // delete from start
        a.unshift(-1);
        diff = JSDiff.initWithArrays(a, b);
        indexes = diff.commonIndexes;
        TKAssertEquals(indexes.length, n);
        TKAssertLessThanOrEquals(diff.comparisonCount, n + 3);
        TKAssertLessThanOrEquals(diff.recursionCount, 2);
        a.shift();
    }

});