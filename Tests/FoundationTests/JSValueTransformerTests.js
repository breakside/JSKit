// #import Foundation
// #import Testkit
/* global JSClass, TKTestSuite, JSValueTransformer */
/* global JSIsNullValueTransformer, JSIsNotNullValueTransformer, JSIsEmptyValueTransformer, JSIsNotEmptyValueTransformer, JSNegateBooleanValueTransformer, JSCommaSeparatedListValueTransformer */
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

    testCommaSeparatedListValueTransformer: function(){
        var transformer = JSCommaSeparatedListValueTransformer;
        var value = transformer.transformValue(null);
        TKAssertExactEquals(value, '');
        value = transformer.transformValue(undefined);
        TKAssertExactEquals(value, '');
        value = transformer.transformValue(['one', 'two']);
        TKAssertExactEquals(value, 'one, two');
        TKAssertThrows(function(){
            value = transformer.transformValue("");
        });
        TKAssertThrows(function(){
            value = transformer.transformValue('abc');
        });
        TKAssertThrows(function(){
            TKAssertExactEquals(value, 1);
        });
        TKAssertThrows(function(){
            value = transformer.transformValue(0);
        });
        TKAssertThrows(function(){
            value = transformer.transformValue(true);
        });
        TKAssertThrows(function(){
            value = transformer.transformValue(false);
        });
        value = transformer.transformValue([1]);
        TKAssertExactEquals(value, '1');
        value = transformer.transformValue([]);
        TKAssertExactEquals(value, '');
        TKAssertThrows(function(){
            value = transformer.transformValue({a: 1});
        });
        TKAssertThrows(function(){
            value = transformer.transformValue({});
        });
        TKAssertThrows(function(){
            value = transformer.transformValue(NaN);
        });
        TKAssertThrows(function(){
            value = transformer.transformValue(Infinity);
        });

        value = transformer.reverseTransformValue(null);
        TKAssertExactEquals(value.length, 0);
        value = transformer.reverseTransformValue(undefined);
        TKAssertExactEquals(value.length, 0);
        value = transformer.reverseTransformValue("asdf");
        TKAssertExactEquals(value.length, 1);
        TKAssertExactEquals(value[0], 'asdf');
        value = transformer.reverseTransformValue("one,two");
        TKAssertExactEquals(value.length, 2);
        TKAssertExactEquals(value[0], 'one');
        TKAssertExactEquals(value[1], 'two');
        value = transformer.reverseTransformValue("one,two,three");
        TKAssertExactEquals(value.length, 3);
        TKAssertExactEquals(value[0], 'one');
        TKAssertExactEquals(value[1], 'two');
        TKAssertExactEquals(value[2], 'three');
        value = transformer.reverseTransformValue("one, two, three");
        TKAssertExactEquals(value.length, 3);
        TKAssertExactEquals(value[0], 'one');
        TKAssertExactEquals(value[1], 'two');
        TKAssertExactEquals(value[2], 'three');
        value = transformer.reverseTransformValue(" one  , two ,  three ");
        TKAssertExactEquals(value.length, 3);
        TKAssertExactEquals(value[0], ' one');
        TKAssertExactEquals(value[1], 'two');
        TKAssertExactEquals(value[2], 'three ');
        value = transformer.reverseTransformValue("");
        TKAssertExactEquals(value.length, 1);
        TKAssertThrows(function(){
            value = transformer.reverseTransformValue(1);
        });
        TKAssertThrows(function(){
            value = transformer.reverseTransformValue(0);
        });
        TKAssertThrows(function(){
            value = transformer.reverseTransformValue(true);
        });
        TKAssertThrows(function(){
            value = transformer.reverseTransformValue(false);
        });
        TKAssertThrows(function(){
            value = transformer.reverseTransformValue([1]);
        });
        TKAssertThrows(function(){
            value = transformer.reverseTransformValue([]);
        });
        TKAssertThrows(function(){
            value = transformer.reverseTransformValue({a: 1});
        });
        TKAssertThrows(function(){
            value = transformer.reverseTransformValue({});
        });
        TKAssertThrows(function(){
            value = transformer.reverseTransformValue(NaN);
        });
        TKAssertThrows(function(){
            value = transformer.reverseTransformValue(Infinity);
        });
    },

});