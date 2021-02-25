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

JSClass("JSEnvironment", JSObject, {

    _valuesByName: null,

    init: function(){
        this._valuesByName = {};
    },

    initWithData: function(data){
        this._valuesByName = {};
        var text = data.stringByDecodingUTF8();
        var lines = text.split("\n");
        for (var i = 0, l = lines.length; i < l; ++i){
            this._parseLine(lines[i]);
        }
    },

    initWithDictionary: function(dictionary){
        this._valuesByName = JSCopy(dictionary);
    },

    _parseLine: function(line){
        if (line.startsWith("#")){
            return;
        }
        var equalsIndex = line.indexOf('=');
        if (equalsIndex < 0){
            return;
        }
        var name = line.substr(0, equalsIndex).trim();
        var value = line.substr(equalsIndex + 1).trim();
        this._valuesByName[name] = value;
    },

    get: function(name, defaultValue){
        if (name in this._valuesByName){
            return this._valuesByName[name];
        }
        return defaultValue;
    },

    getAll: function(){
        return JSCopy(this._valuesByName);
    }

});

JSEnvironment.current = JSEnvironment.initWithDictionary({});