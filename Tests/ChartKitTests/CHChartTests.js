// #import ChartKit
// #import TestKit
"use strict";

JSClass("CHChartTests", TKTestSuite, {

    testIsValidNumericValue: {
        inputs: {
            integer: [1, true],
            zero: [0, true],
            negativeInteger: [-1, true],
            largeInteger: [Number.MAX_SAFE_INTEGER, true],
            decimal: [1.5, true],
            negativeDecimal: [-1.5, true],
            largeDecimal: [Number.MAX_VALUE, true],
            infinity: [Infinity, false],
            negativeInfinity: [-Infinity, false],
            null: [null, false],
            undefined: [undefined, false],
            string: ["test", false],
            numericString: ["1", false],
            emptyString: ["", false],
            boolean: [true, false],
            object: [{a: 1}, false],
            array: [[1], false]
        },
        test: function(value, expected){
            var valid = CHChart.isValidNumericValue(value);
            TKAssertExactEquals(valid, expected);
        }
    }

});