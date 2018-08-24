// #import "Foundation/Foundation.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, JSValueTransformer */
/* global JSIsNullValueTransformer, JSIsNotNullValueTransformer, JSIsEmptyValueTransformer, JSIsNotEmptyValueTransformer, JSNegateBooleanValueTransformer */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
'use strict';

JSClass("JSValueTransformerTests", TKTestSuite, {

    testIsNullTransformer: function(){
        var transformer = JSIsNullValueTransformer;
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
        var transformer = JSIsNotNullValueTransformer;
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
    },

    testIsEmptyTransformer: function(){
        var transformer = JSIsEmptyValueTransformer;
        var value = transformer.transformValue(null);
        TKAssertExactEquals(value, true);
        value = transformer.transformValue(undefined);
        TKAssertExactEquals(value, true);
        value = transformer.transformValue("asdf");
        TKAssertExactEquals(value, false);
        value = transformer.transformValue("");
        TKAssertExactEquals(value, true);
        value = transformer.transformValue(1);
        TKAssertExactEquals(value, false);
        value = transformer.transformValue(0);
        TKAssertExactEquals(value, true);
        value = transformer.transformValue(true);
        TKAssertExactEquals(value, false);
        value = transformer.transformValue(false);
        TKAssertExactEquals(value, true);
        value = transformer.transformValue([1]);
        TKAssertExactEquals(value, false);
        value = transformer.transformValue([]);
        TKAssertExactEquals(value, true);
        value = transformer.transformValue({a: 1});
        TKAssertExactEquals(value, false);
        value = transformer.transformValue({});
        TKAssertExactEquals(value, false);
        value = transformer.transformValue(NaN);
        TKAssertExactEquals(value, true);
        value = transformer.transformValue(Infinity);
        TKAssertExactEquals(value, false);

        TKAssertThrows(function(){
            transformer.reverseTransformValue(true);
        });

        TKAssertThrows(function(){
            transformer.reverseTransformValue(false);
        });
    },

    testIsNotEmptyTransformer: function(){
        var transformer = JSIsNotEmptyValueTransformer;
        var value = transformer.transformValue(null);
        TKAssertExactEquals(value, false);
        value = transformer.transformValue(undefined);
        TKAssertExactEquals(value, false);
        value = transformer.transformValue("asdf");
        TKAssertExactEquals(value, true);
        value = transformer.transformValue("");
        TKAssertExactEquals(value, false);
        value = transformer.transformValue(1);
        TKAssertExactEquals(value, true);
        value = transformer.transformValue(0);
        TKAssertExactEquals(value, false);
        value = transformer.transformValue(true);
        TKAssertExactEquals(value, true);
        value = transformer.transformValue(false);
        TKAssertExactEquals(value, false);
        value = transformer.transformValue([1]);
        TKAssertExactEquals(value, true);
        value = transformer.transformValue([]);
        TKAssertExactEquals(value, false);
        value = transformer.transformValue({a: 1});
        TKAssertExactEquals(value, true);
        value = transformer.transformValue({});
        TKAssertExactEquals(value, true);
        value = transformer.transformValue(NaN);
        TKAssertExactEquals(value, false);
        value = transformer.transformValue(Infinity);
        TKAssertExactEquals(value, true);

        TKAssertThrows(function(){
            transformer.reverseTransformValue(true);
        });

        TKAssertThrows(function(){
            transformer.reverseTransformValue(false);
        });
    },

    testNegateBooleanTransformer: function(){
        var transformer = JSNegateBooleanValueTransformer;
        var value = transformer.transformValue(null);
        TKAssertExactEquals(value, true);
        value = transformer.transformValue(undefined);
        TKAssertExactEquals(value, true);
        value = transformer.transformValue("asdf");
        TKAssertExactEquals(value, false);
        value = transformer.transformValue("");
        TKAssertExactEquals(value, true);
        value = transformer.transformValue(1);
        TKAssertExactEquals(value, false);
        value = transformer.transformValue(0);
        TKAssertExactEquals(value, true);
        value = transformer.transformValue(true);
        TKAssertExactEquals(value, false);
        value = transformer.transformValue(false);
        TKAssertExactEquals(value, true);
        value = transformer.transformValue([1]);
        TKAssertExactEquals(value, false);
        value = transformer.transformValue([]);
        TKAssertExactEquals(value, false);
        value = transformer.transformValue({a: 1});
        TKAssertExactEquals(value, false);
        value = transformer.transformValue({});
        TKAssertExactEquals(value, false);
        value = transformer.transformValue(NaN);
        TKAssertExactEquals(value, true);
        value = transformer.transformValue(Infinity);
        TKAssertExactEquals(value, false);

        value = transformer.reverseTransformValue(null);
        TKAssertExactEquals(value, true);
        value = transformer.reverseTransformValue(undefined);
        TKAssertExactEquals(value, true);
        value = transformer.reverseTransformValue("asdf");
        TKAssertExactEquals(value, false);
        value = transformer.reverseTransformValue("");
        TKAssertExactEquals(value, true);
        value = transformer.reverseTransformValue(1);
        TKAssertExactEquals(value, false);
        value = transformer.reverseTransformValue(0);
        TKAssertExactEquals(value, true);
        value = transformer.reverseTransformValue(true);
        TKAssertExactEquals(value, false);
        value = transformer.reverseTransformValue(false);
        TKAssertExactEquals(value, true);
        value = transformer.reverseTransformValue([1]);
        TKAssertExactEquals(value, false);
        value = transformer.reverseTransformValue([]);
        TKAssertExactEquals(value, false);
        value = transformer.reverseTransformValue({a: 1});
        TKAssertExactEquals(value, false);
        value = transformer.reverseTransformValue({});
        TKAssertExactEquals(value, false);
        value = transformer.reverseTransformValue(NaN);
        TKAssertExactEquals(value, true);
        value = transformer.reverseTransformValue(Infinity);
        TKAssertExactEquals(value, false);
    },

});