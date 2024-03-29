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

// #import Foundation
'use strict';

JSClass("SKValidatingObjectPropertyProvider", JSObject, {

    prefix: null,

    initWithObject: function(obj, prefix){
        this.obj = obj || {};
        this.prefix = prefix || "";
    },

    stringForKey: function(key){
        var s = this.obj[key];
        if (s !== undefined && s !== null){
            if (typeof(s) !== "string"){
                throw new SKValidatingObject.Error({field: this.prefix + key, problem: "type", expected: "string"});
            }
        }
        return s;
    },

    numberForKey: function(key){
        var n = this.obj[key];
        if (n !== undefined && n !== null){
            if (typeof(n) != "number" || isNaN(n) || !isFinite(n)){
                throw new SKValidatingObject.Error({field: this.prefix + key, problem: "type", expected: "number"});
            }
        }
        return n;
    },

    booleanForKey: function(key){
        var b = this.obj[key];
        if (b !== undefined && b !== null){
            if (b !== true && b !== false){
                throw new SKValidatingObject.Error({field: this.prefix + key, problem: "type", expected: "boolean"});
            }
        }
        return b;
    },

    arrayValueProviderForKey: function(key){
        var a = this.obj[key];
        if (a !== undefined && a !== null){
            if (typeof(a) !== "object" || !(a instanceof Array)){
                throw new SKValidatingObject.Error({field: this.prefix + key, problem: "type", expected: "array"});
            }
            return SKValidatingObjectPropertyProvider.initWithObject(a, this.prefix + key + '.');
        }
        return null;
    },

    objectValueProviderForKey: function(key){
        var o = this.obj[key];
        if (o !== undefined && o !== null){
            if (typeof(o) !== "object" || (o instanceof Array)){
                throw new SKValidatingObject.Error({field: this.prefix + key, problem: "type", expected: "object"});
            }
            return SKValidatingObjectPropertyProvider.initWithObject(o, this.prefix + key + '.');
        }
        return null;
    },

    getLength: function(){
        if (this.obj instanceof Array){
            return this.obj.length;
        }
        return null;
    },

    getKeys: function(){
        return Object.keys(this.obj);
    }

});

JSClass("SKValidatingObjectFormFieldProvider", JSObject, {

    prefix: null,

    initWithForm: function(form, prefix){
        this.form = form || JSFormFieldMap();
        this.prefix = prefix || "";
    },

    _stringForKey: function(key, expectedType){
        var values = this.form.getAll(key);
        if (values.length === 0){
            return undefined;
        }
        if (values.length === 1 && values[0] !== null){
            return values[0];
        }
        throw new SKValidatingObject.Error({field: this.prefix + key, problem: "type", expected: expectedType});
    },

    stringForKey: function(key){
        return this._stringForKey(key, "string");
    },

    numberForKey: function(key){
        var stringValue = this._stringForKey(key, "number");
        if (stringValue !== undefined){
            var n = NaN;
            if (stringValue.match(/^\d+$/)){
                n = parseInt(stringValue);
            }else if (stringValue != "." && stringValue.match(/^\d*\.\d*$/)){
                n = parseFloat(stringValue);
            }
            if (isNaN(n)){
                throw new SKValidatingObject.Error({field: this.prefix + key, problem: "type", expected: "number"});
            }
            return n;
        }
        return undefined;
    },

    booleanForKey: function(key){
        var stringValue = this._stringForKey(key, "boolean");
        if (stringValue !== undefined){
            if (stringValue === 'true' || stringValue === '1' || stringValue === 'yes' || stringValue === 'on'){
                return true;
            }
            if (stringValue === 'false' || stringValue === '0' || stringValue === 'no' || stringValue === 'off'){
                return false;
            }
            throw new SKValidatingObject.Error({field: this.prefix + key, problem: "type", expected: "boolean"});
        }
        return undefined;
    },

    arrayValueProviderForKey: function(key){
        var a = this.form.getAll(key);
        if (a.length > 0){
            return SKValidatingObjectFormFieldArrayProvider.initWithArray(a, this.prefix + key + '.');
        }
        return null;
    },

    objectValueProviderForKey: function(key){
        var o = this._stringForKey(key, "object");
        if (o !== undefined){
            throw new SKValidatingObject.Error({field: this.prefix + key, problem: "type", expected: "object"});
        }
        return null;
    },

    getLength: function(){
        return null;
    },

    getKeys: function(){
        var keys = [];
        for (var i = 0, l = this.form.fields.length; i < l; ++i){
            keys.push(this.form.fields[i].name);
        }
        return keys;
    }

});

JSClass("SKValidatingObjectFormFieldArrayProvider", SKValidatingObjectFormFieldProvider, {

    initWithArray: function(array, prefix){
        this.array = array || [];
        this.prefix = prefix || "";
    },

    _stringForKey: function(key, expectedType){
        var s = this.array[key];
        if (s !== undefined){
            if (s === null){
                throw new SKValidatingObject.Error({field: this.prefix + key, problem: "type", expected: expectedType});
            }
        }
        return s;
    },

    arrayValueProviderForKey: function(key){
        var a = this.array[key];
        if (a !== undefined){
            throw new SKValidatingObject.Error({field: this.prefix + key, problem: "type", expected: "array"});
        }
        return null;
    },

    getLength: function(){
        return this.array.length;
    },

    getKeys: function(){
        return Object.keys(this.array);
    }

});

JSClass("SKValidatingObject", JSObject, {

    length: JSReadOnlyProperty(),
    keys: JSReadOnlyProperty(),

    initWithObject: function(obj){
        this.initWithValueProvider(SKValidatingObjectPropertyProvider.initWithObject(obj));
    },

    initWithForm: function(form){
        this.initWithValueProvider(SKValidatingObjectFormFieldProvider.initWithForm(form));
    },

    initWithValueProvider: function(valueProvider){
        this.valueProvider = valueProvider;
    },

    valueProvider: null,

    getLength: function(){
        return this.valueProvider.getLength();
    },

    getKeys: function(){
        return this.valueProvider.getKeys();
    },

    numberForKey: function(key, defaultValue, validator){
        var n = this.valueProvider.numberForKey(key);
        if (typeof(defaultValue) == 'function'){
            validator = defaultValue;
            defaultValue = undefined;
        }
        if (n === undefined || n === null){
            if (defaultValue === undefined){
                throw new SKValidatingObject.Error({field: this.valueProvider.prefix + key, problem: "required"});
            }
            return defaultValue;
        }
        if (validator){
            validator(n);
        }
        return n;
    },

    numberForKeyInRange: function(key, min, max, defaultValue){
        var prefix = this.valueProvider.prefix;
        return this.numberForKey(key, defaultValue, function(n){
            if (min !== undefined && n < min){
                throw new SKValidatingObject.Error({field: prefix + key, problem: "range", min: min, max: max, provided: n});
            }
            if (max !== undefined && n > max){
                throw new SKValidatingObject.Error({field: prefix + key, problem: "range", min: min, max: max, provided: n});
            }
        });
    },

    integerForKey: function(key, defaultValue, validator){
        var prefix = this.valueProvider.prefix;
        return this.numberForKey(key, defaultValue, function(n){
            if (n !== Math.floor(n)){
                throw new SKValidatingObject.Error({field: prefix + key, problem: "type", expected: "integer"});
            }
            if (validator){
                validator(n);
            }
        });
    },

    integerForKeyInRange: function(key, min, max, defaultValue){
        var prefix = this.valueProvider.prefix;
        return this.integerForKey(key, defaultValue, function(n){
            if (min !== undefined && n < min){
                throw new SKValidatingObject.Error({field: prefix + key, problem: "range", min: min, max: max, provided: n});
            }
            if (max !== undefined && n > max){
                throw new SKValidatingObject.Error({field: prefix + key, problem: "range", min: min, max: max, provided: n});
            }
        });
    },

    stringForKey: function(key, defaultValue, validator){
        var value = this.valueProvider.stringForKey(key);
        if (typeof(defaultValue) == 'function'){
            validator = defaultValue;
            defaultValue = undefined;
        }
        if (value === undefined || value === null){
            if (defaultValue === undefined){
                throw new SKValidatingObject.Error({field: this.valueProvider.prefix + key, problem: "required"});
            }
            return defaultValue;
        }
        if (validator){
            validator(value);
        }
        return value;
    },

    stringForKeyInLengthRange: function(key, minLength, maxLength, defaultValue){
        var prefix = this.valueProvider.prefix;
        return this.stringForKey(key, defaultValue, function(s){
            if (minLength !== undefined && s.length < minLength){
                throw new SKValidatingObject.Error({field: prefix + key, problem: "length", min: minLength, max: maxLength, provided: s.length});
            }
            if (maxLength !== undefined && s.length > maxLength){
                throw new SKValidatingObject.Error({field: prefix + key, problem: "length", min: minLength, max: maxLength, provided: s.length});
            }
        });
    },

    emailForKey: function(key, defaultValue){
        var prefix = this.valueProvider.prefix;
        return this.stringForKey(key, defaultValue, function(str){
            if (!str.match(/^[^\s]+@[^\s]*[^\s\.]$/)){
                throw new SKValidatingObject.Error({field: prefix + key, problem: "format", format: "email"});
            }
        });
    },

    phoneForKey: function(key, defaultValue){
        var prefix = this.valueProvider.prefix;
        return this.stringForKey(key, defaultValue, function(str){
            if (!str.match(/^\+?[\d\.\(\)\-\s]+$/)){
                throw new SKValidatingObject.Error({field: prefix + key, problem: "format", format: "phone"});
            }
            var digits = str.replace(/[^\d]/g, '');
            if (digits.length > 15){
                throw new SKValidatingObject.Error({field: prefix + key, problem: "format", format: "phone"});
            }
            if (digits.length < 7){
                throw new SKValidatingObject.Error({field: prefix + key, problem: "format", format: "phone"});
            }
        });
    },

    booleanForKey: function(key, defaultValue){
        var b = this.valueProvider.booleanForKey(key);
        if (b === undefined || b === null){
            if (defaultValue === undefined){
                throw new SKValidatingObject.Error({field: this.valueProvider.prefix + key, problem: "required"});
            }
            return defaultValue;
        }
        return b;
    },

    objectForKey: function(key, defaultValue){
        var provider = this.valueProvider.objectValueProviderForKey(key);
        if (provider === null){
            if (defaultValue === undefined){
                throw new SKValidatingObject.Error({field: this.valueProvider.prefix + key, problem: "required"});
            }
            return defaultValue;
        }
        return SKValidatingObject.initWithValueProvider(provider);
    },

    validObjectForKey: function(key, validatingClass, defaultValue){
        var provider = this.valueProvider.objectValueProviderForKey(key);
        if (provider === null){
            if (defaultValue === undefined){
                throw new SKValidatingObject.Error({field: this.valueProvider.prefix + key, problem: "required"});
            }
            return defaultValue;
        }
        var validator = SKValidatingObject.initWithValueProvider(provider);
        return validatingClass.initWithValidatingObject(validator);
    },

    arrayForKey: function(key, defaultValue){
        var provider = this.valueProvider.arrayValueProviderForKey(key);
        if (provider === null){
            if (defaultValue === undefined){
                throw new SKValidatingObject.Error({field: this.valueProvider.prefix + key, problem: "required"});
            }
            return defaultValue;
        }
        return SKValidatingObject.initWithValueProvider(provider);
    },

    optionForKey: function(key, optionSet, defaultValue){
        var optionList;
        if (optionSet instanceof Set){
            optionList = Array.from(optionSet);
        }else{
            optionList = optionSet;
            optionSet = new Set(optionList);
        }
        var value;
        if (typeof(optionList[0]) == "number"){
            value = this.valueProvider.numberForKey(key);
        }else{
            value = this.valueProvider.stringForKey(key);
        }
        if (value === undefined || value === null){
            if (defaultValue === undefined){
                throw new SKValidatingObject.Error({field: this.valueProvider.prefix + key, problem: "required"});
            }
            return defaultValue;
        }
        if (!optionSet.has(value)){
            throw new SKValidatingObject.Error({field: this.valueProvider.prefix + key, problem: "options", options: Array.from(optionSet)});
        }
        return value;
    },

    urlForKey: function(key, defaultValue){
        var stringValue = this.valueProvider.stringForKey(key);
        if (stringValue === undefined || stringValue === null){
            if (defaultValue === undefined){
                throw new SKValidatingObject.Error({field: this.valueProvider.prefix + key, problem: "required"});
            }
            return defaultValue;
        }
        var url = JSURL.initWithString(stringValue);
        if (url === null || !url.isAbsolute){
            throw new SKValidatingObject.Error({field: this.valueProvider.prefix + key, problem: "format", format: "url"});
        }
        return url;
    },

    stringsBySplittingKey: function(key, delimiter, optionSet, defaultValue){
        var stringValue = this.valueProvider.stringForKey(key);
        if (stringValue === undefined || stringValue === null){
            if (defaultValue === undefined){
                throw new SKValidatingObject.Error({field: this.valueProvider.prefix + key, problem: "required"});
            }
            return defaultValue;
        }
        var items = stringValue.split(delimiter);
        if (optionSet !== null && optionSet !== undefined){
            var item;
            for (var i = 0, l = items.length; i < l; ++i){
                item = items[i];
                if (!optionSet.has(item)){
                    throw new SKValidatingObject.Error({field: this.valueProvider.prefix + key, problem: "options", options: Array.from(optionSet)});
                }
            }
        }
        return items;
    },

    base64DataForKey: function(key, defaultValue){
        var stringValue = this.valueProvider.stringForKey(key);
        if (stringValue === undefined || stringValue === null){
            if (defaultValue === undefined){
                throw new SKValidatingObject.Error({field: this.valueProvider.prefix + key, problem: "required"});
            }
            return defaultValue;
        }
        try{
            return stringValue.dataByDecodingBase64();
        }catch (e){
            throw new SKValidatingObject.Error({field: this.valueProvider.prefix + key, problem: "format", format: "base64"});
        }
    },

    base64URLDataForKey: function(key, defaultValue){
        var stringValue = this.valueProvider.stringForKey(key);
        if (stringValue === undefined || stringValue === null){
            if (defaultValue === undefined){
                throw new SKValidatingObject.Error({field: this.valueProvider.prefix + key, problem: "required"});
            }
            return defaultValue;
        }
        try{
            return stringValue.dataByDecodingBase64URL();
        }catch (e){
            throw new SKValidatingObject.Error({field: this.valueProvider.prefix + key, problem: "format", format: "base64URL"});
        }
    }

});

SKValidatingObject.Error = function(info, message){
    if (this === undefined || this === SKValidatingObject){
        return new SKValidatingObject.Error(info, message);
    }
    this.name = "SKValidatingObject.Error";
    if (info instanceof SKValidatingObject.Error){
        this.info = info.info;
        this.message = info.message;
        this.stack = info.stack;
    }else{
        this.info = info;
        switch (info.problem){
            case "required":
                this.message = "`%s` is required".sprintf(info.field);
                break;
            case "type":
                this.message = "`%s` must be a `%s`".sprintf(info.field, info.expected);
                break;
            case "format":
                this.message = "`%s` must be a valid %s".sprintf(info.field, info.format);
                break;
            case "options":
                this.message = "`%s` must be one of (%s)".sprintf(info.field, Array.from(info.options).join(', '));
                break;
            case "range":
                if (info.provided > info.max){
                    this.message = "`%s` must be <= %s".sprintf(info.field, info.max);
                }else{
                    this.message = "`%s` must be >= %s".sprintf(info.field, info.min);
                }
                break;
            case "length":
                if (info.provided > info.max){
                    this.message = "`%s.length` must be <= %s".sprintf(info.field, info.max);
                }else{
                    this.message = "`%s.length` must be >= %s".sprintf(info.field, info.min);
                }
                break;
            default:
                this.message = message;
                break;
        }
        Error.captureStackTrace(this, SKValidatingObject.Error);
    }
};

SKValidatingObject.Error.prototype = Object.create(Error.prototype);