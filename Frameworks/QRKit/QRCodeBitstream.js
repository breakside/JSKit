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

// #import Foundation
'use strict';

JSClass("QRCodeBitstream", JSObject, {

    data: null,
    byteOffset: 0,
    bitOffset: 0,

    initWithCodewordLength: function(length){
        this.data = JSData.initWithLength(length);
    },

    pad: function(){
        // Pad any remaining bits in this byte with zeros
        if (this.bitOffset > 0){
            ++this.byteOffset;
            this.bitOffset = 0;
        }

        // Pad remaining bytes with alternating values
        var alt = false;
        for (var l = this.data.length; this.byteOffset < l; ++this.byteOffset, alt = !alt){
            this.data[this.byteOffset] = alt ? 0x11 : 0xEC;
        }
    },

    writeBits: function(value, length){
        var shift = (length - 1);
        var mask = 0x1 << shift;
        while (mask > 0){
            this.data[this.byteOffset] |= ((value & mask) >> shift) << (7 - this.bitOffset);
            ++this.bitOffset;
            if (this.bitOffset == 8){
                this.bitOffset = 0;
                this.byteOffset += 1;
            }
            mask >>= 1;
            --shift;
        }
    },

    codewords: function(){
        return this.data.subdataInRange(JSRange(0, this.byteOffset + (this.bitOffset > 0 ? 1 : 0)));
    }

});