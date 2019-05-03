// #import "JSObject.js"
/* global JSGlobalObject */
'use strict';

// -----------------------------------------------------------------------------
// MARK: - Dealing with null

JSGlobalObject.JSIsNullValueTransformer = {

    transformValue: function(value){
        return value === null;
    }

};

JSGlobalObject.JSIsNotNullValueTransformer = {

    transformValue: function(value){
        return value !== null;
    }

};

// -----------------------------------------------------------------------------
// MARK: - Dealing with empty

JSGlobalObject.JSIsEmptyValueTransformer = {

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
    }

};

JSGlobalObject.JSIsNotEmptyValueTransformer = {

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
    }

};

// -----------------------------------------------------------------------------
// MARK: - Booleans

JSGlobalObject.JSNegateBooleanValueTransformer = {

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
