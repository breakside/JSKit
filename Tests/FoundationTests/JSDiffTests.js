// #import Foundation
// #import TestKit
"use strict";

JSClass("JSDiffTests", TKTestSuite, {

    testOperationsAndCommonIndexes: function(){
        // Equal
        var diff = JSDiff.initWithStrings("ABCDEF", "ABCDEF");
        var operations = diff.operations;
        TKAssertEquals(operations.length, 0);
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

        // Empty
        diff = JSDiff.initWithStrings("", "");
        operations = diff.operations;
        TKAssertEquals(operations.length, 0);
        indexes = diff.commonIndexes;
        TKAssertEquals(indexes.length, 0);

        // Insert at end
        diff = JSDiff.initWithStrings("ABCDEF", "ABCDEFG");
        operations = diff.operations;
        TKAssertEquals(operations.length, 1);
        TKAssertEquals(operations[0].operator, JSDiff.Operator.insert);
        TKAssertEquals(operations[0].originalIndex, 6);
        TKAssertEquals(operations[0].modifiedIndex, 6);
        indexes = diff.commonIndexes;
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
        operations = diff.operations;
        TKAssertEquals(operations.length, 1);
        TKAssertEquals(operations[0].operator, JSDiff.Operator.insert);
        TKAssertEquals(operations[0].originalIndex, 0);
        TKAssertEquals(operations[0].modifiedIndex, 0);
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
        operations = diff.operations;
        TKAssertEquals(operations.length, 1);
        TKAssertEquals(operations[0].operator, JSDiff.Operator.insert);
        TKAssertEquals(operations[0].originalIndex, 3);
        TKAssertEquals(operations[0].modifiedIndex, 3);
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
        operations = diff.operations;
        TKAssertEquals(operations.length, 1);
        TKAssertEquals(operations[0].operator, JSDiff.Operator.delete);
        TKAssertEquals(operations[0].originalIndex, 0);
        TKAssertEquals(operations[0].modifiedIndex, 0);
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
        operations = diff.operations;
        TKAssertEquals(operations.length, 1);
        TKAssertEquals(operations[0].operator, JSDiff.Operator.delete);
        TKAssertEquals(operations[0].originalIndex, 5);
        TKAssertEquals(operations[0].modifiedIndex, 5);
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
        operations = diff.operations;
        TKAssertEquals(operations.length, 1);
        TKAssertEquals(operations[0].operator, JSDiff.Operator.delete);
        TKAssertEquals(operations[0].originalIndex, 2);
        TKAssertEquals(operations[0].modifiedIndex, 2);
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
        operations = diff.operations;
        TKAssertEquals(operations.length, 2);
        TKAssertEquals(operations[0].operator, JSDiff.Operator.delete);
        TKAssertEquals(operations[0].originalIndex, 0);
        TKAssertEquals(operations[0].modifiedIndex, 0);
        TKAssertEquals(operations[1].operator, JSDiff.Operator.insert);
        TKAssertEquals(operations[1].originalIndex, 6);
        TKAssertEquals(operations[1].modifiedIndex, 5);
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
        operations = diff.operations;
        TKAssertEquals(operations.length, 2);
        TKAssertEquals(operations[0].operator, JSDiff.Operator.delete);
        TKAssertEquals(operations[0].originalIndex, 1);
        TKAssertEquals(operations[0].modifiedIndex, 1);
        TKAssertEquals(operations[1].operator, JSDiff.Operator.insert);
        TKAssertEquals(operations[1].originalIndex, 6);
        TKAssertEquals(operations[1].modifiedIndex, 5);
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

        // paper
        diff = JSDiff.initWithStrings("axxbxx", "bxxaxxbxx");
        operations = diff.operations;
        TKAssertEquals(operations.length, 3);
        TKAssertEquals(operations[0].operator, JSDiff.Operator.insert);
        TKAssertEquals(operations[0].originalIndex, 0);
        TKAssertEquals(operations[0].modifiedIndex, 0);
        TKAssertEquals(operations[1].operator, JSDiff.Operator.insert);
        TKAssertEquals(operations[1].originalIndex, 0);
        TKAssertEquals(operations[1].modifiedIndex, 1);
        TKAssertEquals(operations[2].operator, JSDiff.Operator.insert);
        TKAssertEquals(operations[2].originalIndex, 0);
        TKAssertEquals(operations[2].modifiedIndex, 2);
        indexes = diff.commonIndexes;
        TKAssertEquals(indexes.length, 6);
        TKAssertEquals(indexes[0][0], 0);
        TKAssertEquals(indexes[0][1], 3);
        TKAssertEquals(indexes[1][0], 1);
        TKAssertEquals(indexes[1][1], 4);
        TKAssertEquals(indexes[2][0], 2);
        TKAssertEquals(indexes[2][1], 5);
        TKAssertEquals(indexes[3][0], 3);
        TKAssertEquals(indexes[3][1], 6);
        TKAssertEquals(indexes[4][0], 4);
        TKAssertEquals(indexes[4][1], 7);
        TKAssertEquals(indexes[5][0], 5);
        TKAssertEquals(indexes[5][1], 8);

        // paper
        diff = JSDiff.initWithStrings("abcab", "cbab");
        operations = diff.operations;
        TKAssertEquals(operations.length, 3);
        TKAssertEquals(operations[0].operator, JSDiff.Operator.delete);
        TKAssertEquals(operations[0].originalIndex, 0);
        TKAssertEquals(operations[0].modifiedIndex, 0);
        TKAssertEquals(operations[1].operator, JSDiff.Operator.delete);
        TKAssertEquals(operations[1].originalIndex, 1);
        TKAssertEquals(operations[1].modifiedIndex, 0);
        TKAssertEquals(operations[2].operator, JSDiff.Operator.insert);
        TKAssertEquals(operations[2].originalIndex, 3);
        TKAssertEquals(operations[2].modifiedIndex, 1);
        indexes = diff.commonIndexes;
        TKAssertEquals(indexes.length, 3);
        TKAssertEquals(indexes[0][0], 2);
        TKAssertEquals(indexes[0][1], 0);
        TKAssertEquals(indexes[1][0], 3);
        TKAssertEquals(indexes[1][1], 2);
        TKAssertEquals(indexes[2][0], 4);
        TKAssertEquals(indexes[2][1], 3);

        // wiki
        diff = JSDiff.initWithStrings("abcdfghjqz", "abcdefgijkrxyz");
        operations = diff.operations;
        TKAssertEquals(operations.length, 8);
        TKAssertEquals(operations[0].operator, JSDiff.Operator.insert);
        TKAssertEquals(operations[0].originalIndex, 4);
        TKAssertEquals(operations[0].modifiedIndex, 4);
        TKAssertEquals(operations[1].operator, JSDiff.Operator.delete);
        TKAssertEquals(operations[1].originalIndex, 6);
        TKAssertEquals(operations[1].modifiedIndex, 7);
        TKAssertEquals(operations[2].operator, JSDiff.Operator.insert);
        TKAssertEquals(operations[2].originalIndex, 7);
        TKAssertEquals(operations[2].modifiedIndex, 7);
        TKAssertEquals(operations[3].operator, JSDiff.Operator.delete);
        TKAssertEquals(operations[3].originalIndex, 8);
        TKAssertEquals(operations[3].modifiedIndex, 9);
        TKAssertEquals(operations[4].operator, JSDiff.Operator.insert);
        TKAssertEquals(operations[4].originalIndex, 9);
        TKAssertEquals(operations[4].modifiedIndex, 9);
        TKAssertEquals(operations[5].operator, JSDiff.Operator.insert);
        TKAssertEquals(operations[5].originalIndex, 9);
        TKAssertEquals(operations[5].modifiedIndex, 10);
        TKAssertEquals(operations[6].operator, JSDiff.Operator.insert);
        TKAssertEquals(operations[6].originalIndex, 9);
        TKAssertEquals(operations[6].modifiedIndex, 11);
        TKAssertEquals(operations[7].operator, JSDiff.Operator.insert);
        TKAssertEquals(operations[7].originalIndex, 9);
        TKAssertEquals(operations[7].modifiedIndex, 12);
        indexes = diff.commonIndexes;
        TKAssertEquals(indexes.length, 8);
        TKAssertEquals(indexes[0][0], 0);
        TKAssertEquals(indexes[0][1], 0);
        TKAssertEquals(indexes[1][0], 1);
        TKAssertEquals(indexes[1][1], 1);
        TKAssertEquals(indexes[2][0], 2);
        TKAssertEquals(indexes[2][1], 2);
        TKAssertEquals(indexes[3][0], 3);
        TKAssertEquals(indexes[3][1], 3);
        TKAssertEquals(indexes[4][0], 4);
        TKAssertEquals(indexes[4][1], 5);
        TKAssertEquals(indexes[5][0], 5);
        TKAssertEquals(indexes[5][1], 6);
        TKAssertEquals(indexes[6][0], 7);
        TKAssertEquals(indexes[6][1], 8);
        TKAssertEquals(indexes[7][0], 9);
        TKAssertEquals(indexes[7][1], 13);
    },

    testPerformance: function(){
        var N = [];
        var a, b;
        var i;
        var n = 1000;
        for (i = 0; i < n; ++i){
            N.push(i);
        }

        var diff, operations, indexes;

        // Equal
        a = JSCopy(N);
        b = JSCopy(N);
        diff = JSDiff.initWithArrays(a, b);
        operations = diff.operations;
        TKAssertEquals(operations.length, 0);
        indexes = diff.commonIndexes;
        TKAssertEquals(indexes.length, a.length);
        TKAssertLessThanOrEquals(diff.comparisonCount, a.length);

        // Empty empty
        a = [];
        b = [];
        diff = JSDiff.initWithArrays(a, b);
        operations = diff.operations;
        TKAssertEquals(operations.length, 0);
        indexes = diff.commonIndexes;
        TKAssertEquals(indexes.length, 0);
        TKAssertLessThanOrEquals(diff.comparisonCount, 0);

        // Add to empty
        a = [];
        b = JSCopy(N);
        diff = JSDiff.initWithArrays(a, b);
        operations = diff.operations;
        TKAssertEquals(operations.length, b.length);
        indexes = diff.commonIndexes;
        TKAssertEquals(indexes.length, 0);
        TKAssertLessThanOrEquals(diff.comparisonCount, 0);

        // Remove all
        a = JSCopy(N);
        b = [];
        diff = JSDiff.initWithArrays(a, b);
        operations = diff.operations;
        TKAssertEquals(operations.length, a.length);
        indexes = diff.commonIndexes;
        TKAssertEquals(indexes.length, 0);
        TKAssertLessThanOrEquals(diff.comparisonCount, 0);

        // insert at end
        a = JSCopy(N);
        b = JSCopy(N);
        b.push(n);
        diff = JSDiff.initWithArrays(a, b);
        operations = diff.operations;
        TKAssertEquals(operations.length, 1);
        indexes = diff.commonIndexes;
        TKAssertEquals(indexes.length, a.length);
        TKAssertLessThanOrEquals(diff.comparisonCount, a.length);

        // delete from end
        a = JSCopy(N);
        b = JSCopy(N);
        b.pop();
        diff = JSDiff.initWithArrays(a, b);
        operations = diff.operations;
        TKAssertEquals(operations.length, 1);
        indexes = diff.commonIndexes;
        TKAssertEquals(indexes.length, b.length);
        TKAssertLessThanOrEquals(diff.comparisonCount, b.length);

        // insert at start
        a = JSCopy(N);
        b = JSCopy(N);
        b.unshift(-1);
        diff = JSDiff.initWithArrays(a, b);
        operations = diff.operations;
        TKAssertEquals(operations.length, 1);
        indexes = diff.commonIndexes;
        TKAssertEquals(indexes.length, a.length);
        TKAssertLessThanOrEquals(diff.comparisonCount, a.length + 1);

        // delete from start
        a = JSCopy(N);
        b = JSCopy(N);
        b.shift();
        diff = JSDiff.initWithArrays(a, b);
        operations = diff.operations;
        TKAssertEquals(operations.length, 1);
        indexes = diff.commonIndexes;
        TKAssertEquals(indexes.length, b.length);
        TKAssertLessThanOrEquals(diff.comparisonCount, b.length + 1);

        // move from start to end
        a = JSCopy(N);
        b = JSCopy(N);
        b.push(b.shift());
        diff = JSDiff.initWithArrays(a, b);
        operations = diff.operations;
        TKAssertEquals(operations.length, 2);
        indexes = diff.commonIndexes;
        TKAssertEquals(indexes.length, a.length - 1);
        TKAssertLessThanOrEquals(diff.comparisonCount, a.length + 5);

        // move from end to start
        a = JSCopy(N);
        b = JSCopy(N);
        b.unshift(b.pop());
        diff = JSDiff.initWithArrays(a, b);
        operations = diff.operations;
        TKAssertEquals(operations.length, 2);
        indexes = diff.commonIndexes;
        TKAssertEquals(indexes.length, a.length - 1);
        TKAssertLessThanOrEquals(diff.comparisonCount, a.length + 7);

        // move from start to middle
        a = JSCopy(N);
        b = JSCopy(N);
        b.splice(Math.floor(n / 2), 0, b.shift());
        diff = JSDiff.initWithArrays(a, b);
        operations = diff.operations;
        TKAssertEquals(operations.length, 2);
        indexes = diff.commonIndexes;
        TKAssertEquals(indexes.length, a.length - 1);
        TKAssertLessThanOrEquals(diff.comparisonCount, a.length + 5);

        // move from end to middle
        a = JSCopy(N);
        b = JSCopy(N);
        b.splice(Math.floor(n / 2), 0, b.pop());
        diff = JSDiff.initWithArrays(a, b);
        operations = diff.operations;
        TKAssertEquals(operations.length, 2);
        indexes = diff.commonIndexes;
        TKAssertEquals(indexes.length, a.length - 1);
        TKAssertLessThanOrEquals(diff.comparisonCount, a.length + 7);

        // totally different
        a = JSCopy(N);
        b = [];
        for (i = 0; i < n; ++i){
            b.push(n + i);
        }
        diff = JSDiff.initWithArrays(a, b);
        operations = diff.operations;
        TKAssertEquals(operations.length, a.length + b.length);
        indexes = diff.commonIndexes;
        TKAssertEquals(indexes.length, 0);
        TKAssertLessThanOrEquals(diff.comparisonCount, 2 * (a.length * b.length + operations.length));

    }

});