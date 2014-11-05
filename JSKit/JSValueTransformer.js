// #import "JSKit/JSObject.js"
/* global JSClass, JSObject, JSValueTransformer */
'use strict';

// -----------------------------------------------------------------------------
// MARK: - Base Class

JSClass('JSValueTransformer', JSObject, {

    transformValue: function(value){
    },

    reverseTransformValue: function(value){
    }

});

// -----------------------------------------------------------------------------
// MARK: - Dealing with null

JSClass('JSIsNullValueTransformer', JSValueTransformer, {

    transformValue: function(value){
        return value === null;
    },

    reverseTransformValue: function(value){
        throw new Error("JSIsNullValueTranformer cannot reverseTranform value");
    }

});

JSClass('JSIsNotNullValueTransformer', JSValueTransformer, {

    transformValue: function(value){
        return value !== null;
    },

    reverseTransformValue: function(value){
        throw new Error("JSIsNullValueTranformer cannot reverseTranform value");
    }

});


// -----------------------------------------------------------------------------
// MARK: - Dealing with empty

JSClass('JSIsEmptyValueTransformer', JSValueTransformer, {

    transformValue: function(value){
        return !value || !value.length;
    },

    reverseTransformValue: function(value){
        throw new Error("JSIsEmptyValueTranformer cannot reverseTranform value");
    }

});

JSClass('JSIsNotEmptyValueTransformer', JSValueTransformer, {

    transformValue: function(value){
        return value && value.length;
    },

    reverseTransformValue: function(value){
        throw new Error("JSIsEmptyValueTranformer cannot reverseTranform value");
    }

});
