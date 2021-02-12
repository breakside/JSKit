// #import SearchKit
// #import TestKit
"use strict";

JSClass("SEStandardRankerTests", TKTestSuite, {

    testHitCompare: function(){
        var a = [
            [[0, 0, 0], [0, 0, 5], [0, 1, 0]]
        ];
        var b = [
            [[1, 0, 0], [1, 1, 0], [1, 1, 1]]
        ];
        var result = SEStandardRanker.hitCompare(a, b);
        TKAssertLessThan(result, 0);

        a = [
            [[0, 0, 0], [0, 1, 0]]
        ];
        b = [
            [[1, 0, 0], [1, 1, 0], [1, 1, 1]]
        ];
        result = SEStandardRanker.hitCompare(a, b);
        TKAssertGreaterThan(result, 0);

        a = [
            [[0, 0, 0], [0, 1, 0]],
            [[0, 0, 1]]
        ];
        b = [
            [[1, 0, 0], [1, 1, 0], [1, 1, 1]],
            [[1, 1, 2]]
        ];
        result = SEStandardRanker.hitCompare(a, b);
        TKAssertExactEquals(result, 0);
    },

    testRankedDocumentNumbers: function(){
        var words = ["one"];
        var hitsByWord = [
            [[0, 0, 0], [0, 0, 5], [0, 1, 0], [1, 0, 0], [1, 1, 0], [1, 1, 1]]
        ];
        var ranker = SEStandardRanker.initWithWords(words, hitsByWord);
        var documentNumbers = ranker.rankedDocumentNumbers();
        TKAssertEquals(documentNumbers.length, 2);
        TKAssertEquals(documentNumbers[0], 0);
        TKAssertEquals(documentNumbers[1], 1);

        words = ["one"];
        hitsByWord = [
            [[0, 0, 0], [0, 1, 0], [1, 0, 0], [1, 1, 0], [1, 1, 1]]
        ];
        ranker = SEStandardRanker.initWithWords(words, hitsByWord);
        documentNumbers = ranker.rankedDocumentNumbers();
        TKAssertEquals(documentNumbers.length, 2);
        TKAssertEquals(documentNumbers[0], 1);
        TKAssertEquals(documentNumbers[1], 0);

        words = ["one", "two"];
        hitsByWord = [
            [[0, 0, 0], [0, 1, 0], [1, 0, 0], [1, 1, 0], [1, 1, 1]],
            [[0, 0, 1], [1, 1, 2]]
        ];
        ranker = SEStandardRanker.initWithWords(words, hitsByWord);
        documentNumbers = ranker.rankedDocumentNumbers();
        TKAssertEquals(documentNumbers.length, 2);
        TKAssertEquals(documentNumbers[0], 0);
        TKAssertEquals(documentNumbers[1], 1);

        words = ["one", "two"];
        hitsByWord = [
            [[0, 0, 0], [0, 1, 0], [1, 0, 0], [1, 1, 0], [1, 1, 1]],
            [[0, 0, 1], [1, 1, 2], [1, 2, 0]]
        ];
        ranker = SEStandardRanker.initWithWords(words, hitsByWord);
        documentNumbers = ranker.rankedDocumentNumbers();
        TKAssertEquals(documentNumbers.length, 2);
        TKAssertEquals(documentNumbers[0], 1);
        TKAssertEquals(documentNumbers[1], 0);
    }

});