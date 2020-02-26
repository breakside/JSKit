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
// #import "PDFTypes.js"
'use strict';

(function(){

JSClass("PDFReaderStream", JSObject, {

    length: JSReadOnlyProperty(),
    offset: JSReadOnlyProperty(),

    byte: function(){
    },

    seek: function(offset){
    },

    byteBackwards: function(){
    },

    seekRelative: function(offset){
        this.seek(this.offset + offset);
    },

    seekToStartOfLine: function(offset){
        var length = 0;
        var byte = this.byteBackwards();
        if (byte == PDFTokenizer.Whitespace.lineFeed){
            byte = this.byteBackwards();
        }
        if (byte == PDFTokenizer.Whitespace.carriageReturn){
            byte = this.byteBackwards();
        }
        while (byte !== null && byte != PDFTokenizer.Whitespace.carriageReturn && byte != PDFTokenizer.Whitespace.lineFeed && length < 256){
            byte = this.byteBackwards();
        }
        if (byte == PDFTokenizer.Whitespace.carriageReturn || byte == PDFTokenizer.Whitespace.lineFeed){
            byte = this.byte();
        }
    },

    readLine: function(){
        var data = JSData.initWithLength(256);
        var length = 0;
        var byte = this.byte();
        while (byte !== null && byte != PDFTokenizer.Whitespace.carriageReturn && byte != PDFTokenizer.Whitespace.lineFeed && length < 256){
            data[length++] = byte;
            byte = this.byte();
        }
        if (byte == PDFTokenizer.Whitespace.carriageReturn){
            byte = this.byte();
            if (byte != PDFTokenizer.Whitespace.lineFeed && byte !== null){
                this.seekRelative(-1);
            }
        }
        return data.truncatedToLength(length);
    },

    read: function(count){
        var data = JSData.initWithLength(count);
        var length = 0;
        var byte;
        while (length < count){
            byte = this.byte();
            if (byte === null){
                break;
            }
            data[length++] = byte;
        }
        return data.truncatedToLength(length);
    },

});

JSClass("PDFReaderDataStream", PDFReaderStream, {

    _data: null,
    _offset: null,

    initWithData: function(data){
        this._data = data;
        this._offset = 0;
    },

    byte: function(){
        if (this._offset >= this._data.length){
            return null;
        }
        return this._data[this._offset++];
    },

    byteBackwards: function(){
        if (this._offset === 0){
            return null;
        }
        return this._data[--this._offset];
    },

    seek: function(offset){
        this._offset = offset;
    },

    getOffset: function(){
        return this._offset;
    },

    getLength: function(){
        return this._data.length;
    }

});


})();