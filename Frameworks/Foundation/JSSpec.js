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

// #import "Javascript.js"
// #import "JSObject.js"
// #import "JSBundle.js"
'use strict';

JSClass("JSSpec", JSObject, {

    filesOwner: JSReadOnlyProperty(),
    bundle: JSReadOnlyProperty(),
    stringValue: JSReadOnlyProperty('_stringValue', null),
    numberValue: JSReadOnlyProperty('_numberValue', null),
    length: JSReadOnlyProperty(),
    _dictionaryValue: null,

    _root: null,
    _bundle: null,
    _baseName: null,
    _cache: null,
    _keysForNextObjectInit: null,

    initWithResource: function(resource, bundle){
        var ext = resource.fileExtension;
        var name = resource;
        if (ext){
            name = name.removingFileExtension();
        }else{
            ext = '.spec';
        }
        this._baseName = name;
        this._bundle = bundle || JSBundle.mainBundle;
        var metadata = this._bundle.metadataForResourceName(name, ext);
        if (metadata === null){
            return null;
        }
        this.initWithDictionary(metadata.value);
    },

    initWithDictionary: function(dictionary, bundle){
        this._bundle = bundle || JSBundle.mainBundle;
        this._root = this;
        this._dictionaryValue = dictionary;
        this._cache = {};
        this._keysForNextObjectInit = [];
    },

    initWithValue: function(value, root){
        if (typeof(value) == 'string'){
            this._stringValue = value;
        }else if (typeof(value) == 'number'){
            this._numberValue = value;
        }else if (typeof(value) == 'object'){
            this._dictionaryValue = value;
        }
        this._root = root || this;
        this._cache = {};
    },

    getFilesOwner: function(){
        var owner = this._root.valueForKey(JSSpec.Keys.FilesOwner);
        if (owner === null){
            throw new Error("Spec %s must include a \"File's Owner\" key".sprintf(this._baseName));
        }
        return owner;
    },

    getLength: function(){
        if (this._dictionaryValue !== null && (this._dictionaryValue instanceof Array)){
            return this._dictionaryValue.length;
        }
        return null;
    },

    getBundle: function(){
        return this._root._bundle;
    },

    containsKey: function(key){
        if (this._dictionaryValue === null){
            return false;
        }
        return key in this._dictionaryValue;
    },

    keys: function(){
        if (this._dictionaryValue === null){
            return [];
        }
        var keys = [];
        for (var key in this._dictionaryValue){
            keys.push(key);
        }
        return keys;
    },

    values: function(){
        var values = [];
        if (this.length !== null){
            for (var i = 0, l = this.length; i < l; ++i){
                values.push(this.valueForKey(i));
            }
        }
        return values;
    },

    valueForKey: function(key, type){
        if (this._dictionaryValue === null){
            return null;
        }
        if (key in this._cache){
            return this._cache[key];
        }
        if (this === this._root){
            this._keysForNextObjectInit.push(key);
        }
        var value = this._createValueForKey(key, type);
        this._keysForNextObjectInit = [];
        this._cache[key] = value;
        return value;
    },

    unmodifiedValueForKey: function(key){
        if (this._dictionaryValue === null){
            return null;
        }
        return JSDeepCopy(this._dictionaryValue[key]);
    },

    _createValueForKey: function(key, type){
        if (type === undefined){
            type = null;
        }
        var value = this._dictionaryValue[key];
        if (value === null || value === undefined){
            return null;
        }
        if (typeof(value) === 'string' && value.length > 0){
            var prefix = value.charAt(0);
            if (prefix === '$'){
                return JSResolveDottedName(JSGlobalObject, value.substr(1));
            }
            if (prefix == '.'){
                if (this._root._bundle !== null && this._root._baseName !== null){
                    return this._root._bundle.localizedString(value.substr(1), this._root._baseName + '.strings');
                }
                return value;
            }
            if (prefix == '\\'){
                return value.substr(1);
            }
            if (prefix == '/'){
                return this._root.valueForKey(value.substr(1), type);
            }
            if (prefix == '@'){
                return JSObject.initWithSpecName(value.substr(1), this._root._bundle);
            }
            if (type !== null){
                if (value in type){
                    return type[value];
                }
                return this._initializeObject(type, value);
            }
            return value;
        }
        if (typeof(value) === 'number'){
            if (type !== null){
                return this._initializeObject(type, value);
            }
            return value;
        }
        if (value instanceof Array){
            return JSSpec.initWithValue(value, this._root);
        }
        if (typeof(value) === 'object'){
            if (JSSpec.Keys.ObjectClass in value){
                var className = value[JSSpec.Keys.ObjectClass];
                type = JSClass.FromName(className);
                if (!type){
                    throw new Error("Class not found: %s".sprintf(className));
                }
            }
            if (type !== null){
                return this._initializeObject(type, value);
            }
            return JSSpec.initWithValue(value, this._root);
        }
        return value;
    },

    _initializeObject: function(type, value){
        var spec = JSSpec.initWithValue(value, this._root);
        if (type instanceof JSClass){
            var obj = type.allocate();
            // Since initWithSpec may resolve objects that reference back
            // to us, we need to set our entry in the object map before
            // calling init.
            // NOTE: If there's a double-refeference like /File's Owner: /SomeObject,
            // we'll add this newly allocated object under both names.
            if (this._keysForNextObjectInit !== null){
                for (var i = 0, l = this._keysForNextObjectInit.length; i < l; ++i){
                    this._cache[this._keysForNextObjectInit[i]] = obj;
                }
                this._keysForNextObjectInit = [];
            }
            var result = obj.initWithSpec(spec);
            if (result !== undefined){
                obj = result;
            }
            // Set the bindings after the object has been initialized
            if (spec.containsKey('bindings')){
                this._setObjectBindings(obj, spec.valueForKey('bindings'));
            }
            obj.awakeFromSpec();
            return obj;
        }
        if (type.initWithSpec){
            return type.initWithSpec(spec);
        }
        return value;
    },

    _setObjectBindings: function(obj, bindings){
        var descriptor;
        var keys = bindings.keys();
        var key;

        for (var keyIndex = 0, keysLength = keys.length; keyIndex < keysLength; ++keyIndex){
            key = keys[keyIndex];
            descriptor = bindings.valueForKey(key);
            if (descriptor.length === null){
                this._setObjectBinding(obj, key, descriptor);
            }else{
                for (var i = 0, l = descriptor.length; i < l; ++i){
                    this._setObjectBinding(obj, key, descriptor.valueForKey(i));
                }
            }
        }
    },

    _setObjectBinding: function(obj, binding, descriptor){
        var options = {};
        if (descriptor.containsKey('transformer')){
            options.valueTransformer = descriptor.valueForKey('transformer');
        }
        if (descriptor.containsKey("nullPlaceholder")){
            options.nullPlaceholder = descriptor.valueForKey("nullPlaceholder");
        }
        var to = descriptor.valueForKey('to');
        var keyPath = descriptor.valueForKey('value');
        obj.bind(binding, to, keyPath, options);
    },

});

JSSpec.Keys = {
    FilesOwner: "File's Owner",
    ObjectClass: "class"
};