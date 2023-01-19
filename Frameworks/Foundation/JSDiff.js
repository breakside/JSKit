// #import "JSObject.js"
"use strict";

JSClass("JSDiff", JSObject, {

    a: null,
    b: null,

    mapFunction: null,

    initWithArrays: function(a, b, mapFunction){
        this.a = a;
        this.b = b;
        if (mapFunction !== undefined){
            this.mapFunction = mapFunction;
        }
    },

    initWithStrings: function(a, b){
        this.initWithArrays(a, b);
    },

    commonIndexes: JSLazyInitProperty(function(){
        var a = this.a;
        var b = this.b;
        if (this.mapFunction !== null){
            a = a.map(this.mapFunction);
            b = b.map(this.mapFunction);
        }
        return this.indexesOfLongestCommonSubsequence(a, 0, a.length - 1, b, 0, b.length - 1);
    }),

    recursionCount: 0,
    comparisonCount: 0,

    indexesOfLongestCommonSubsequence: function(a, i0, i1, b, j0, j1){
        ++this.recursionCount;
        if (i1 >= i0 && j1 >= j0){
            ++this.comparisonCount;
            if (a[i0] === b[j0]){
                var head = [];
                ++this.comparisonCount;
                while (i1 >= i0 && j1 >= j0 && a[i0] === b[i0]){
                    head.push([i0, j0]);
                    ++i0;
                    ++j0;
                    ++this.comparisonCount;
                }
                return head.concat(this.indexesOfLongestCommonSubsequence(a, i0, i1, b, j0, j1));
            }
            ++this.comparisonCount;
            if (a[i1] === b[j1]){
                var tail = [];
                ++this.comparisonCount;
                while (i1 >= i0 && j1 >= j0 && a[i1] === b[j1]){
                    tail.unshift([i1, j1]);
                    --i1;
                    --j1;
                    ++this.comparisonCount;
                }
                return this.indexesOfLongestCommonSubsequence(a, i0, i1, b, j0, j1).concat(tail);
            }
            var sequence1 = this.indexesOfLongestCommonSubsequence(a, i0, i1, b, j0, j1 - 1);
            var sequence2 = this.indexesOfLongestCommonSubsequence(a, i0, i1 - 1, b, j0, j1);
            if (sequence1.length >= sequence2.length){
                return sequence1;
            }
            return sequence2;
        }
        return [];
    },

    operations: function(){
        var a = [];
        var b = [];
        var i, l;
        var j, k;
        var commonIndexes = this.commonIndexes;
        for (i = 0, l = a.length; i < l; ++i){
        }
        return [a, b];
    },

    longestCommonSubsequence: function(){
        var commonIndexes = this.commonIndexes;
        var sequence = [];
        var i, l;
        for (i = 0, l = commonIndexes.length; i < l; ++i){
            sequence.push(this.a[commonIndexes[i][0]]);
        }
        return sequence;
    }

});

JSDiff.Operation = {
    insert: 1,
    delete: 2
};