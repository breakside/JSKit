// #import "Foundation/Foundation.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, JSValueTransformer */
/* global JSIsNullValueTransformer, JSIsNotNullValueTransformer */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
'use strict';

JSClass("JSValueTransformerTests", TKTestSuite, {

    testIsNullTransformer: function(){
        var transformer = JSIsNullValueTransformer.init();
        var value = transformer.transformValue(null);
        TKAssertExactEquals(value, true);
        value = transformer.transformValue(undefined);
        TKAssertExactEquals(value, false);
        value = transformer.transformValue("asdf");
        TKAssertExactEquals(value, false);
        value = transformer.transformValue("");
        TKAssertExactEquals(value, false);
        value = transformer.transformValue(1);
        TKAssertExactEquals(value, false);
        value = transformer.transformValue(0);
        TKAssertExactEquals(value, false);
        value = transformer.transformValue(true);
        TKAssertExactEquals(value, false);
        value = transformer.transformValue(false);
        TKAssertExactEquals(value, false);
        value = transformer.transformValue([1]);
        TKAssertExactEquals(value, false);
        value = transformer.transformValue([]);
        TKAssertExactEquals(value, false);
        value = transformer.transformValue({a: 1});
        TKAssertExactEquals(value, false);
        value = transformer.transformValue({});
        TKAssertExactEquals(value, false);
        value = transformer.transformValue(NaN);
        TKAssertExactEquals(value, false);
        value = transformer.transformValue(Infinity);
        TKAssertExactEquals(value, false);

        TKAssertThrows(function(){
            transformer.reverseTransformValue(true);
        });

        TKAssertThrows(function(){
            transformer.reverseTransformValue(false);
        });
    },

    testIsNotNullTransformer: function(){
        var transformer = JSIsNotNullValueTransformer.init();
        var value = transformer.transformValue(null);
        TKAssertExactEquals(value, false);
        value = transformer.transformValue(undefined);
        TKAssertExactEquals(value, true);
        value = transformer.transformValue("asdf");
        TKAssertExactEquals(value, true);
        value = transformer.transformValue("");
        TKAssertExactEquals(value, true);
        value = transformer.transformValue(1);
        TKAssertExactEquals(value, true);
        value = transformer.transformValue(0);
        TKAssertExactEquals(value, true);
        value = transformer.transformValue(true);
        TKAssertExactEquals(value, true);
        value = transformer.transformValue(false);
        TKAssertExactEquals(value, true);
        value = transformer.transformValue([1]);
        TKAssertExactEquals(value, true);
        value = transformer.transformValue([]);
        TKAssertExactEquals(value, true);
        value = transformer.transformValue({a: 1});
        TKAssertExactEquals(value, true);
        value = transformer.transformValue({});
        TKAssertExactEquals(value, true);
        value = transformer.transformValue(NaN);
        TKAssertExactEquals(value, true);
        value = transformer.transformValue(Infinity);
        TKAssertExactEquals(value, true);

        TKAssertThrows(function(){
            transformer.reverseTransformValue(true);
        });

        TKAssertThrows(function(){
            transformer.reverseTransformValue(false);
        });
    }

});