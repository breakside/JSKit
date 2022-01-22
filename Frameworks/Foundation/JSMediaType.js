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
'use strict';

JSGlobalObject.JSMediaType = function(str, parameters){
    if (str === null || str === undefined || str === ""){
        return null;
    }
    if (this === undefined){
        return new JSMediaType(str, parameters);
    }
    if (str instanceof JSMediaType){
        this.mime = str.mime;
        this.type = str.type;
        this.subtype = str.subtype;
        this.parameters = JSCopy(str.parameters);
        return;
    }
    if (parameters !== undefined){
        this.parameters = JSCopy(parameters);
    }else{
        this.parameters = {};
    }
    str = str.toLowerCase();
    var index = str.indexOf(';');
    var l = str.length;
    if (index < 0){
        this.mime = str.trim();
    }else{
        this.mime = str.substr(0, index).trim();
        ++index;
        var c;
        var i = index;
        var name;
        while (i < l){
            c = str.charAt(i);
            if (c == '='){
                name = str.substr(index, i - index).trim();
                ++i;
                index = i;
                if (i < l){
                    c = str.charAt(i);
                    if (c == '"'){
                        ++i;
                        ++index;
                        while (i < l && str.charAt(i) != '"'){
                            ++i;
                        }
                        if (name.length){
                            this.parameters[name] = str.substr(index, i - index);
                        }
                        while (i < l && str.charAt(i) != ';'){
                            ++i;
                        }
                    }else{
                        while (i < l && str.charAt(i) != ';'){
                            ++i;
                        }
                        if (name.length){
                            this.parameters[name] = str.substr(index, i - index).trim();
                        }
                    }
                    ++i;
                    index = i;
                }else{
                    if (name.length){
                        this.parameters[name] = '';
                    }
                }
            }else{
                ++i;
                if (c == ";"){
                    index = i;
                }
            }
        }
    }
    index = this.mime.indexOf('/');
    if (index >= 0){
        this.type = this.mime.substr(0, index);
        this.subtype = this.mime.substr(index + 1);
    }else{
        this.type = this.mime;
        this.subtype = '';
    }
};

JSMediaType.prototype = {
    mime: null,
    type: null,
    subtype: null,
    parameters: null,

    toString: function(){
        var str = this.mime;
        var value;
        for (var name in this.parameters){
            str += "; " + name + '=';
            value = this.parameters[name];
            str += '"' + value + '"';
        }
        return str;
    }
};