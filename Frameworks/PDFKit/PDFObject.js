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

'use strict';

JSGlobalObject.PDFObject = function(){
    if (this === undefined){
        return new PDFObject();
    }
};

JSGlobalObject.PDFObject.prototype = Object.create({}, {

    _indirect: {
        enumerable: false,
        configurable: true,
        writable: false,
        value: null
    },

    indirect: {
        enumerable: false,
        configurable: false,
        set: function(indirect){
            Object.defineProperty(this, '_indirect', {
                enumerable: false,
                configurable: true,
                value: indirect
            });
        },
        get: function(){
            return this._indirect;
        }
    },

    toString: {
        value: function PDFObject_toString(){
            if (this._indirect){
                return "%d %d R".sprintf(this._indirect.objectID, this._indirect.generation);
            }
            var str = "<< ";
            for (var k in this){
                str += "/%s %s ".sprintf(k, this[k]);
            }
            str += ">>";
            return str;
        }
    }

});

JSGlobalObject.PDFObjectProperty = {
    enumerable: false,
    configurable: true,
    writable: true,
    value: null
};