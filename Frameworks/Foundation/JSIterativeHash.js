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

// #feature ArrayBuffer
// #feature Uint8Array
'use strict';

JSGlobalObject.JSIterativeHash = function JSIterativeHash(blockByteLength){
    this._blockByteLength = blockByteLength;
    this._leftoverBuffer = new ArrayBuffer(this._blockByteLength);
    this._leftoverBytes = new Uint8Array(this._leftoverBuffer, 0, 0);
};

JSIterativeHash.prototype = {
    _blockByteLength: 0,
    _inputByteLength: 0,
    _leftoverBuffer: null,
    _leftoverBytes: null,

    _hashBlock: function(block){
    },

    _padBlock: function(block, length){
        block[length++] = 0x80;
        if (length > this._blockByteLength - 8){
            while (length < this._blockByteLength){
                block[length++] = 0x00;
            }
            this._hashBlock(block);
            length = 0;
        }
        while (length < this._blockByteLength - 8){
            block[length++] = 0x00;
        }
        var bitLength = this._inputByteLength * 8;
        for (var i = block.length - 8, l = block.length; i < l; ++i){
            block[i] = bitLength & 0xFF;
            bitLength = bitLength >>> 8;
        }
        // block[length++] = bitLength & 0xFF;
        // block[length++] = (bitLength >> 8) & 0xFF;
        // block[length++] = (bitLength >> 16) & 0xFF;
        // block[length++] = (bitLength >> 24) & 0xFF;
        // block[length++] = (bitLength >> 32) & 0xFF;
        // block[length++] = (bitLength >> 40) & 0xFF;
        // block[length++] = (bitLength >> 48) & 0xFF;
        // block[length++] = (bitLength >> 56) & 0xFF;
    },

    start: function(){
        this._inputByteLength = 0;
        this._leftoverBytes.zero();
        this._leftoverBytes = new Uint8Array(this._leftoverBuffer, 0, 0);
    },

    add: function(data){
        this._inputByteLength += data.length;
        var offset = 0;
        var i, j, l;
        if (this._leftoverBytes.length > 0){
            offset = this._blockByteLength - this._leftoverBytes.length;
            if (data.length < offset){
                j = this._leftoverBytes.length;
                this._leftoverBytes = new Uint8Array(this._leftoverBuffer, 0, this._leftoverBytes.length + data.length);
                for (i = 0, l = data.length; i < l; ++i, ++j){
                    this._leftoverBytes[j] = data[i];
                }
                return;
            }else{
                j = this._leftoverBytes.length;
                this._leftoverBytes = new Uint8Array(this._leftoverBuffer);
                for (i = 0, l = offset; i < l; ++i, ++j){
                    this._leftoverBytes[j] = data[i];
                }
            }
            this._hashBlock(this._leftoverBytes);
            this._leftoverBytes.zero();
            this._leftoverBytes = new Uint8Array(this._leftoverBuffer, 0, 0);
        }
        var length = data.length - offset;
        var over = length % this._blockByteLength;
        var consumed = length - over;
        for (i = 0; i < consumed; i += this._blockByteLength){
            this._hashBlock(new Uint8Array(data.buffer, i, this._blockByteLength));
        }
        if (over > 0){
            this._leftoverBytes = new Uint8Array(this._leftoverBuffer, 0, over);
            for (i = 0, l = over; i < l; ++i){
                this._leftoverBytes[i] = data[offset + consumed + i];
            }
        }
    },

    finish: function(){
        this._padBlock(new Uint8Array(this._leftoverBuffer), this._leftoverBytes.length);
        this._hashBlock(new Uint8Array(this._leftoverBuffer));
        this._leftoverBytes.zero();
        this._leftoverBytes = new Uint8Array(this._leftoverBuffer, 0, 0);
    },

    digest: function(){
    }


};