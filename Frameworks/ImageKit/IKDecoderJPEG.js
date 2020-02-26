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

// https://www.w3.org/TR/2003/REC-PNG-20031110/
// #import "IKDecoder.js"
// #import "IKBitmap.js"
// #import "IKColorSpace.js"
'use strict';

(function(){

JSClass("IKDecoderJPEG", IKDecoder, {
    format: IKBitmap.Format.jpeg,

    getBitmap: function(){
        var data = this.data;
        var dataView = data.dataView();
        var i = 0;
        var b;
        var l = data.length;
        var blockLength;
        var blockdata;
        var handler;
        var context = {
            started: false,
            ended: false,
            size: null,
            bitmapData: null,
            startFrame: function(frame){
                if (this.bitmapData !== null){
                    return;
                }
                var height = frame.getUint16(1);
                var width = frame.getUint16(3);
                this.size = JSSize(width, height);
                this.bitmapData = JSData.initWithLength(width * height * 4);
            }
        };
        while (i < l){
            b = data[i++];
            if (b != 0xFF){
                // TODO: Error, not at a maker
                return null;
            }
            if (i == l){
                // TODO: Error, not enough room for marker
                return null;
            }
            b = data[i++];
            if (b == 0x00){
                // TODO: Error, invalid marker
                return null;
            }
            handler = standalones[b];
            if (handler){
                handler.call(context);
            }else{
                if (i >= l - 2){
                    // TODO: Error, not enough room for block header
                    return null;
                }
                blockLength = dataView.getUint16(i);
                if (i + blockLength > l){
                    // TODO: Error, not enough room for block data
                    return null;
                }
                handler = blocks[b];
                if (handler){
                    blockdata = data.subdataInRange(JSRange(i + 2, blockLength - 2));
                    handler.call(context, blockdata.dataView());
                }
                i += blockLength;
            }
        }
        var bitmap = IKBitmap.initWithData(context.bitmapData);
        return bitmap;
    }
});

var standalones = {

    // Start of Image
    0xD8: function(){
        this.started = true;
    },

    // End of Image
    0xD9: function(){
        this.ended = true;
    },

    // Restarts
    0xD0: function(){
    },

    0xD1: function(){
    },

    0xD2: function(){
    },

    0xD3: function(){
    },

    0xD4: function(){
    },

    0xD5: function(){
    },

    0xD6: function(){
    },

    0xD7: function(){
    }

};

var blocks = {

    // Start of Frame, non-differential, Huffman
    0xC0: function(dataView){
        this.startFrame(dataView);
    },

    0xC1: function(dataView){
        this.startFrame(dataView);
    },

    0xC2: function(dataView){
        this.startFrame(dataView);
    },

    0xC3: function(dataView){
        this.startFrame(dataView);
    },

    // Start of Frame, differential, Huffman
    0xC5: function(dataView){
        this.startFrame(dataView);
    },

    0xC6: function(dataView){
        this.startFrame(dataView);
    },

    0xC7: function(dataView){
        this.startFrame(dataView);
    },

    // Start of Frame, non-differential, arithmetic
    0xC8: function(dataView){
        this.startFrame(dataView);
    },

    0xC9: function(dataView){
        this.startFrame(dataView);
    },

    0xCA: function(dataView){
        this.startFrame(dataView);
    },

    0xCB: function(dataView){
        this.startFrame(dataView);
    },

    // Start of Frame, differential, arithmetic
    0xCD: function(dataView){
        this.startFrame(dataView);
    },

    0xCE: function(dataView){
        this.startFrame(dataView);
    },

    0xCF: function(dataView){
        this.startFrame(dataView);
    }

};

})();