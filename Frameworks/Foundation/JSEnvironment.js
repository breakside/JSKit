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
// #import "JSURL.js"
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
    },

    stringForName: function(name){
        return this.get(name, null);
    },

    integerForName: function(name){
        var s = this.stringForName(name);
        if (s !== null){
            var n = parseInt(s);
            if (!isNaN(n)){
                return n;
            }
        }
        return null;
    },

    urlForName: function(name){
        return JSURL.initWithString(this.stringForName(name));
    },

    base64DataForName: function(name){
        var base64 = this.stringForName(name);
        if (base64 !== null){
            try{
                return base64.dataByDecodingBase64();
            }catch (e){
            }
        }
        return null;
    },

    base64URLDataForName: function(name){
        var base64 = this.stringForName(name);
        if (base64 !== null){
            try{
                return base64.dataByDecodingBase64URL();
            }catch(e){
            }
        }
        return null;
    },

    hexDataForName: function(name){
        var hex = this.stringForName(name);
        if (hex !== null){
            try{
                return hex.dataByDecodingHex();
            }catch (e){
            }
        }
        return null;
    },

    booleanForName: function(name){
        var stringValue = this.stringForName(name);
        return (stringValue === 'true' || stringValue === '1' || stringValue === 'yes' || stringValue === 'on');
    }

});

JSEnvironment.current = JSEnvironment.initWithDictionary({});