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

// #feature Uint32Array
'use strict';

JSGlobalObject.Adler32 = function(bytes){
    if (this === undefined){
        if (bytes){
            var checker = new Adler32();
            checker.includeBytes(bytes);
            return checker.sum;
        }else{
            return new Adler32();
        }
    }
    this.sum1 = 1;
    this.sum2 = 0;
};

Adler32.prototype = {
    includeBytes: function(bytes){
        for (var i = 0, l = bytes.length; i < l; ++i){
            this.sum1 = (this.sum1 + bytes[i]) % 65521;
            this.sum2 = (this.sum2 + this.sum1) % 65521;
        }
    }
};

Object.defineProperty(Adler32.prototype, 'sum', {
    get: function Adler32_sum(){
        var n = new Uint32Array(1);
        n[0] = (this.sum2 << 16) | this.sum1;
        return n[0];
    }
});