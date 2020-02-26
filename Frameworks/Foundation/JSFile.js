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

// #import "Promise+JS.js"
// #import "JSObject.js"
'use strict';

JSClass("JSFile", JSObject, {

    url: JSReadOnlyProperty(null, null, 'getURL'),
    name: JSReadOnlyProperty('_name', null),
    contentType: JSReadOnlyProperty('_contentType', null),
    size: JSReadOnlyProperty('_size', 0),
    extension: JSReadOnlyProperty(),
    nameWithoutExtension: JSReadOnlyProperty(),

    initWithData: function(data, name, contentType){
        return JSDataFile.initWithData(data, name, contentType);
    },

    initWithPlaceholder: function(name, contentType){
        this._name = name;
        this._contentType = contentType;
    },

    readData: function(completion, target){
    },

    readDataRange: function(range, completion, target){
    },

    getURL: function(){
        return null;
    },

    close: function(){
    },

    getExtension: function(){
        if (this._name === null){
            return '';
        }
        var i = this._name.lastIndexOf('.');
        if (i > 0){
            return this._name.substr(i + 1);
        }
        return '';
    },

    getNameWithoutExtension: function(){
        if (this._name === null){
            return '';
        }
        var i = this._name.lastIndexOf('.');
        if (i > 0){
            return this._name.substr(0, i);
        }
        return '';
    }

});

JSClass("JSDataFile", JSFile, {

    _data: null,

    initWithData: function(data, name, contentType){
        this._data = data;
        this._name = name;
        this._contentType = contentType;
        this._size = data.length;
    },

    readData: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        completion.call(target, this._data);
        return completion.promise;
    },

    readDataRange: function(range, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        completion.call(target, this._data.subdataInRange(range));
        return completion.promise;
    }

});