// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #import "JSObject.js"
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
