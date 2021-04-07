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

// #import "CoreTypes.js"
// #import "String+JS.js"
// #import "JSData.js"
'use strict';

(function(){

JSGlobalObject.JSFormFieldMap = function(other){
    if (this === undefined){
        if (other === null){
            return other;
        }
        return new JSFormFieldMap(other);
    }else{
        this.fields = [];
        if (other instanceof JSFormFieldMap){
            for (var i = 0, l = other.fields.length; i < l; ++i){
                this.fields.push(JSFormField(other.fields[i]));
            }
        }
    }
};

JSFormFieldMap.prototype = {
    fields: null,

    decode: function(urlEncodedData, decodePlusAsSpace){
        var l = urlEncodedData.length;
        var start = 0;
        var i = 0;
        var name = null;
        var value;
        while (i < l){
            if (name === null){
                if (urlEncodedData[i] == 0x3D){
                    name = String.initWithData(urlEncodedData.subdataInRange(JSRange(start, i - start)).dataByDecodingPercentEscapes(decodePlusAsSpace), String.Encoding.utf8);
                    start = i + 1;
                }else if (urlEncodedData[i] == 0x26){
                    name = String.initWithData(urlEncodedData.subdataInRange(JSRange(start, i - start)).dataByDecodingPercentEscapes(decodePlusAsSpace), String.Encoding.utf8);
                    this.add(name, null);
                    name = null;
                    start = i + 1;
                }
            }else{
                if (urlEncodedData[i] == 0x26){
                    value = String.initWithData(urlEncodedData.subdataInRange(JSRange(start, i - start)).dataByDecodingPercentEscapes(decodePlusAsSpace), String.Encoding.utf8);
                    this.add(name, value);
                    name = null;
                    start = i + 1;
                }
            }
            ++i;
        }
        if (name === null){
            if (i > start){
                name = String.initWithData(urlEncodedData.subdataInRange(JSRange(start, i - start)).dataByDecodingPercentEscapes(decodePlusAsSpace), String.Encoding.utf8);
                this.add(name, null);
            }
        }else{
            value = String.initWithData(urlEncodedData.subdataInRange(JSRange(start, i - start)).dataByDecodingPercentEscapes(decodePlusAsSpace), String.Encoding.utf8);
            this.add(name, value);
        }
    },

    encode: function(reserved, encodeSpaceAsPlus){
        if (encodeSpaceAsPlus){
            reserved = JSCopy(reserved);
            reserved[0x2b] = true;
        }
        var totalLength = 0;
        var dataList = [];
        var field;
        var data;
        var i, l;
        var ampersand = JSData.initWithArray([0x26]);
        var equals = JSData.initWithArray([0x3D]);
        for (i = 0, l = this.fields.length; i < l; ++i){
            field = this.fields[i];
            if (i > 0){
                dataList.push(ampersand);
                totalLength += 1;
            }
            data = field.name.utf8().dataByEncodingPercentEscapes(reserved, encodeSpaceAsPlus);
            dataList.push(data);
            totalLength += data.length;
            if (field.value !== null && field.value !== ""){
                dataList.push(equals);
                totalLength += 1;
                data = field.value.utf8().dataByEncodingPercentEscapes(reserved, encodeSpaceAsPlus);
                dataList.push(data);
                totalLength += data.length;
            }
        }
        var encoded = JSData.initWithLength(totalLength);
        var j = 0;
        for (i = 0, l = dataList.length; i < l; ++i){
            data = dataList[i];
            for (var ii = 0, ll = data.length; ii < ll; ++ii){
                encoded[j++] = data[ii];
            }
        }
        return encoded;
    },

    urlEncoded: function(){
        return this.encode(JSFormFieldMap.queryStringReserved, true);
    },

    add: function(name, value){
        this.fields.push(JSFormField(name, value));
    },

    unset: function(name){
        var field;
        for (var i = this.fields.length - 1; i >= 0; --i){
            field = this.fields[i];
            if (field.name == name){
                this.fields.splice(i, 1);
            }
        }
    },

    set: function(name, value){
        this.unset(name);
        this.add(name, value);
    },

    get: function(name, defaultValue){
        var values = this.getAll(name);
        if (values.length === 0){
            return defaultValue;
        }
        return values[0];
    },

    getAll: function(name){
        var values = [];
        var field;
        for (var i = 0, l = this.fields.length; i < l; ++i){
            field = this.fields[i];
            if (field.name == name){
                values.push(field.value);
            }
        }
        return values;
    },

    debugDescription: function(prefix){
        var description = "";
        var l = this.fields.length;
        if (l > 0){
            description += prefix;
            description += this.fields[0].name + '=xxxx';
            for (var i = 1; i < l; ++i){
                description += '&' + this.fields[i].name + '=xxxx';
            }
        }
        return description;
    }
};

JSGlobalObject.JSFormField = function(name, value){
    if (this === undefined){
        if (name === null){
            return null;
        }
        return new JSFormField(name, value);
    }else{
        if (name instanceof JSFormField){
            this.name = name.name;
            this.value = name.value;
        }else{
            if (value === undefined){
                value = null;
            }
            if (value !== null && typeof(value) != "string"){
                value = String(value);
            }
            this.name = name;
            this.value = value;
        }
    }
};

JSFormFieldMap.queryStringReserved = {
    0x22: true,
    0x23: true,
    0x3c: true,
    0x3e: true,
    0x5b: true,
    0x5c: true,
    0x5d: true,
    0x5e: true,
    0x60: true,
    0x7b: true,
    0x7c: true,
    0x7d: true
};

})();