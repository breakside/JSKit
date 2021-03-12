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
// #import "IKDecoder.js"
// #import "IKEncoder.js"
'use strict';

(function(){

JSClass('IKBitmap', JSObject, {

    size: JSReadOnlyProperty('_size', null),
    data: JSReadOnlyProperty('_data', null),
    colorSpace: JSReadOnlyProperty('_colorSpace', null),

    initWithData: function(data, size, colorSpace){
        if (data === null){
            return null;
        }
        this._data = data;
        this._size = JSSize(size);
        this._colorSpace = colorSpace || null;
    },

    initWithEncodedData: function(data){
        var format = IKBitmap.formatOfData(data);
        var decoder = IKDecoder.initWithFormat(format, data);
        if (decoder === null){
            return null;
        }
        return decoder.getBitmap();
    },

    encodedData: function(format){
        var encoder = IKEncoder.initWithFormat(format, this);
        if (encoder === null){
            return null;
        }
        var encoded = encoder.getData();
        return encoded;
    },

    close: function(){
        this._data = null;
    }

});

IKBitmap.formatOfData = function(data){
    if (data === null){
        return IKBitmap.Format.unknown;
    }
    if (data.length >= 16){
        // PNG magic bytes
        if (data[0] == 0x89 &&
            data[1] == 0x50 &&
            data[2] == 0x4E &&
            data[3] == 0x47 &&
            data[4] == 0x0D &&
            data[5] == 0x0A &&
            data[6] == 0x1A &&
            data[7] == 0x0A)
        {
            return IKBitmap.Format.png;
            // Verifying "IHDR" signature
            // if (data[12] == 0x49 && data[13] == 0x48 && data[14] == 0x44 && data[15] == 0x52){
            // }
        }
    }
    if (data.length >= 2){
        // JPEG magic bytes
        if (data[0] == 0xFF && data[1] == 0xD8){
            return IKBitmap.Format.jpeg;
        }
    }
    return IKBitmap.Format.unknown;
};

IKBitmap.Format = {
    unknown: 0,
    png: 1,
    jpeg: 2
};

})();