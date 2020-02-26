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

// #import "String+JS.js"
'use strict';

JSGlobalObject.JSMIMEHeaderMap = function(other){
    if (this === undefined){
        if (other === null){
            return other;
        }
        return new JSMIMEHeaderMap(other);
    }else{
        this.headers = [];
        if (other instanceof JSMIMEHeaderMap){
            for (var i = 0, l = other.headers.length; i < l; ++i){
                this.headers.push(JSMIMEHeader(other.headers[i]));
            }
        }
    }
};

JSMIMEHeaderMap.prototype = {
    headers: null,

    parse: function(headers){
        var lines = headers.split("\r\n");
        var line;
        var name;
        for (var i = 0, l = lines.length; i < l; ++i){
            line = lines[i];
            name = line.split(':', 1)[0];
            this.add(name.trim(), line.substr(name.length + 2).trim());
        }
    },

    add: function(name, value){
        this.headers.push(JSMIMEHeader(name, value));
    },

    unset: function(name){
        var header;
        var lowerName = name.lowercaseString();
        for (var i = this.headers.length - 1; i >= 0; --i){
            header = this.headers[i];
            if (header.lowerName == lowerName){
                this.headers.splice(i, 1);
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
        var header;
        var lowerName = name.lowercaseString();
        for (var i = 0, l = this.headers.length; i < l; ++i){
            header = this.headers[i];
            if (header.lowerName == lowerName){
                values.push(header.value);
            }
        }
        return values;
    }
};

JSGlobalObject.JSMIMEHeader = function(name, value){
    if (this === undefined){
        if (name === null){
            return null;
        }
        return new JSMIMEHeader(name, value);
    }else{
        if (name instanceof JSMIMEHeader){
            this.name = name.name;
            this.lowerName = name.lowerName;
            this.value = name.value;
        }else{
            this.name = name;
            this.lowerName = name.lowercaseString();
            this.value = value;
        }
    }
};

JSMIMEHeader.prototype = {
    toString: function(){
        var str = this.name + ": ";
        if (this.value !== undefined && this.value !== null){
            str += this.value;
        }
        return str;
    }
};