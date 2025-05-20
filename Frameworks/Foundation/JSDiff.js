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

    operations: JSLazyInitProperty(function(){
        return this.shortestOperationList();
    }),

    commonIndexes: JSLazyInitProperty(function(){
        var operations = this.operations;
        var operationIndex = 0;
        var operationCount = operations.length;
        var m = this.a.length;
        var n = this.b.length;
        var commonIndexes = [];
        var i = 0;
        var j = 0;
        while (i < m && j < n){
            if (operationIndex < operationCount && operations[operationIndex].originalIndex === i){
                if (operations[operationIndex].operator === JSDiff.Operator.delete){
                    ++i;
                }else{
                    ++j;
                }
                ++operationIndex;
            }else{
                commonIndexes.push([i, j]);
                ++i;
                ++j;
            }
        }
        return commonIndexes;
    }),

    shortestOperationList: function(){
        var operations = [];
        var a = this.a;
        var b = this.b;
        if (this.mapFunction !== null){
            a = a.map(this.mapFunction);
            b = b.map(this.mapFunction);
        }
        var m = a.length;
        var n = b.length;
        var i = 0;
        var j = 0;

        // common prefix
        for (; i < m && j < n; ++i, ++j){
            ++this.comparisonCount;
            if (a[i] !== b[j]){
                break;
            }
        }

        // common suffix
        for (; m > i && n > j; --m, --n){
            ++this.comparisonCount;
            if (a[m - 1] !== b[n - 1]){
                break;
            }
        }

        // special case, a and b are equal
        if (i === m && j === n){
            return operations;
        }

        // special case, b contains all of a plus extra at the end
        if (i === m){
            for (; j < n; ++j){
                operations.push(JSDiffOperation(JSDiff.Operator.insert, i, j));
            }
            return operations;
        }

        // special case, b contains only the start of a
        if (j === n){
            for (; i < m; ++i){
                operations.push(JSDiffOperation(JSDiff.Operator.delete, i, j));
            }
            return operations;
        }

        var operationCount = 1;
        var maximumOperationCount = Math.min(m + n, this.maximumOperationCount);
        var diagonalNumber;
        var minimumDiagonalNumber = -1;
        var maximumDiagonalNumber = 1;
        var diagonals = {};
        var diagonal;
        var referenceDiagonal;
        var operation;
        var operator;
        diagonals[0] = {
            i: i,
            operation: null
        };
        for (; operationCount <= maximumOperationCount; ++operationCount){
            for (diagonalNumber = minimumDiagonalNumber; diagonalNumber <= maximumDiagonalNumber; diagonalNumber += 2){
                ++this.comparisonCount;
                if (diagonalNumber === -operationCount || (diagonalNumber !== operationCount && diagonals[diagonalNumber + 1].i >= diagonals[diagonalNumber - 1].i)){
                    referenceDiagonal = diagonals[diagonalNumber + 1];
                    i = referenceDiagonal.i + 1;
                    j = i + diagonalNumber;
                    operation = JSDiffOperation(JSDiff.Operator.delete, i - 1, j);
                }else{
                    referenceDiagonal = diagonals[diagonalNumber - 1];
                    i = referenceDiagonal.i;
                    j = i + diagonalNumber;
                    operation = JSDiffOperation(JSDiff.Operator.insert, i, j - 1);
                }
                operation.previous = referenceDiagonal.operation;
                for (; i < m && j < n; ++i, ++j){
                    ++this.comparisonCount;
                    if (a[i] !== b[j]){
                        break;
                    }
                }
                diagonal = diagonals[diagonalNumber];
                if (diagonal === undefined){
                    diagonal = {
                        i: i,
                        operation: operation,
                    };
                    diagonals[diagonalNumber] = diagonal;
                }else{
                    diagonal.i = i;
                    diagonal.operation = operation;
                }
                if (i === m && j === n){
                    while (operation !== null){
                        operations.unshift(operation);
                        operation = operation.previous;
                    }
                    return operations;
                }
                if (i === m){
                    minimumDiagonalNumber = diagonalNumber + 2;
                }
                if (j === n){
                    maximumDiagonalNumber = diagonalNumber - 2;
                }
            }
            --minimumDiagonalNumber;
            ++maximumDiagonalNumber;
        }

        return null;
    },

    maximumOperationCount: Infinity,
    comparisonCount: 0,

});

JSGlobalObject.JSDiffOperation = function(operator, originalIndex, modifiedIndex){
    if (this === undefined){
        return new JSDiffOperation(operator, originalIndex, modifiedIndex);
    }
    if (operator instanceof JSDiffOperation){
        this.operator = operator.operator;
        this.originalIndex = operator.originalIndex;
        this.modifiedIndex = operator.modifiedIndex;
    }else{
        this.operator = operator;
        this.originalIndex = originalIndex;
        this.modifiedIndex = modifiedIndex;
    }
    this.previous = null;
};

JSDiff.Operator = {
    insert: 1,
    delete: 2
};
