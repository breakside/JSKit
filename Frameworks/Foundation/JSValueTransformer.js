// #import "Foundation/JSObject.js"
/* global JSGlobalObject */
'use strict';

// -----------------------------------------------------------------------------
// MARK: - Dealing with null

JSGlobalObject.JSIsNullValueTransformer = {

    canReverseTransform: false,

    transformValue: function(value){
        return value === null;
    },

    reverseTransformValue: function(value){
        throw new Error("JSIsNullValueTranformer cannot reverseTranform value");
    }

};

JSGlobalObject.JSIsNotNullValueTransformer = {

    canReverseTransform: false,

    transformValue: function(value){
        return value !== null;
    },

    reverseTransformValue: function(value){
        throw new Error("JSIsNullValueTranformer cannot reverseTranform value");
    }

};

// -----------------------------------------------------------------------------
// MARK: - Dealing with empty

JSGlobalObject.JSIsEmptyValueTransformer = {

    canReverseTransform: false,

    transformValue: function(value){
        if (value === null || value === undefined){
            return true;
        }
        if (typeof(value) === 'object'){
            if (value instanceof Array){
                return value.length === 0;
            }
        }
        return !value;
    },

    reverseTransformValue: function(value){
        throw new Error("JSIsEmptyValueTranformer cannot reverseTranform value");
    }

};

JSGlobalObject.JSIsNotEmptyValueTransformer = {

    canReverseTransform: false,

    transformValue: function(value){
        if (value === null || value === undefined){
            return false;
        }
        if (typeof(value) === 'object'){
            if (value instanceof Array){
                return value.length > 0;
            }
        }
        return !!value;
    },

    reverseTransformValue: function(value){
        throw new Error("JSIsEmptyValueTranformer cannot reverseTranform value");
    }

};

// -----------------------------------------------------------------------------
// MARK: - Booleans

JSGlobalObject.JSNegateBooleanValueTransformer = {

    canReverseTransform: true,

    transformValue: function(value){
        return !value;
    },

    reverseTransformValue: function(value){
        return !value;
    }

};

// -----------------------------------------------------------------------------
// MARK: - Lists

JSGlobalObject.JSCommaSeparatedListValueTransformer = {

    canReverseTransform: true,

    transformValue: function(value){
        if (value === null || value === undefined){
            return '';
        }
        if (!(value instanceof Array)){
            throw new Error("JSCommaSeparatedListValueTransformer expects an array, got a: " + typeof(value));
        }
        return value.join(', ');
    },

    reverseTransformValue: function(value){
        if (value === null || value === undefined){
            return [];
        }
        if (typeof(value) !== 'string'){
            throw new Error("JSCommaSeparatedListValueTransformer expects an string, got a: " + typeof(value));
        }
        return value.split(/\s*,\s*/g);
    }

};
