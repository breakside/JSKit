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

// #import "JSLog.js"
'use strict';

(function(){

var logger = JSLog("foundation", "zlib");

JSGlobalObject.HuffmanTree = function(code_lengths){
    if (this !== undefined){
        throw new Error("HuffmanTree is not a constructor");
    }
    var root = new HuffmanNode();
    var code = 0;
    var bit_length_counts = [];
    var next_code = [];
    var i, l;
    var bit_length;
    var count;
    for (i = 0, l = code_lengths.length; i < l; ++i){
        bit_length = code_lengths[i] || 0;
        if (bit_length_counts[bit_length] === undefined){
            bit_length_counts[bit_length] = 0;
        }
        bit_length_counts[bit_length] += 1;
    }
    bit_length_counts[0] = 0;
    for (i = 1, l = bit_length_counts.length; i < l; ++i){
        count = bit_length_counts[i - 1] || 0;
        code = (code + count) << 1;
        next_code[i] = code;
        // logger.info("next_code[%d] = %d (%{public})", i, code, code.toString(2));
    }
    for (i = 0, l = code_lengths.length; i < l; ++i){
        bit_length = code_lengths[i] || 0;
        if (bit_length !== 0){
            // logger.info("Including %d (%{public}), bit length %d", next_code[bit_length], next_code[bit_length].toString(2), bit_length);
            root.includeValue(next_code[bit_length], bit_length, i);
            ++next_code[bit_length];
        }
    }
    return root;
};

function HuffmanNode(){
    if (this === undefined){
        return new HuffmanNode();
    }
    this[0] = null;
    this[1] = null;
    this.value = null;
}

HuffmanNode.prototype = {
    includeValue: function(code, bit_length, value){
        var m = 0x1 << (bit_length - 1);
        var b = (code & m) >> (bit_length - 1);
        if (!this[b]){
            this[b] = new HuffmanNode();
        }
        if (bit_length == 1){
            this[b].value = value;
        }else{
            this[b].includeValue(code, bit_length - 1, value);
        }
    }
};

})();