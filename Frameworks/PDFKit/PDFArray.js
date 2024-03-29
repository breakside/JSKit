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

// #import "PDFObject.js"
'use strict';

JSGlobalObject.PDFArray = function(items){
    if (this === undefined){
        return new PDFArray(items);
    }
    if (items !== undefined){
        for (var i = 0, l = items.length; i < l; ++i){
            this[i] = items[i];
        }
        this.length = items.length;
    }
};

JSGlobalObject.PDFArray.prototype = Object.create(PDFObject.prototype, {

    length: {
        enumerable: false,
        writable: true,
        value: 0
    },

    toString: {
        value: function PDFArray_toString(){
            var str = "[ ";
            for (var i = 0, l = this.length; i < l; ++i){
                str += "%s ".sprintf(this[i]);
            }
            str += "]";
            return str;
        }
    }

});