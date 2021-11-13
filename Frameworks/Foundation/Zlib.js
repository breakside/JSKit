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

// https://tools.ietf.org/html/rfc1950
// #import "Deflate.js"
// #import "Adler32.js"
// #import "JSLog.js"
// #import "JSData.js"
// #import "CoreTypes.js"
// #import "Error+JS.js"
'use strict';

(function(){

var logger = JSLog("foundation", "zlib");

JSGlobalObject.Zlib = {

    Method: {
        Deflate: 8
    },

    uncompress: function(input){
        var stream = ZlibStream();
        stream.input = input;
        var output = JSData.initWithLength(input.length * 5);
        var length = 0;
        var done;
        do {
            if (length > 0){
                output = output.increasedByLength(output.length);
            }
            stream.output = output;
            stream.outputOffset = length;
            length += stream.uncompress();
        } while (length == output.length);
        return output.truncatedToLength(length);
    },

    compress: function(input, level, info){
        var stream = ZlibStream(level, info);
        stream.input = input;
        var output = JSData.initWithLength(input.length + 32);
        var length = 0;
        var done;
        do {
            if (length > 0){
                output = output.increasedByLength(output.length);
            }
            stream.output = output;
            stream.outputOffset = length;
            length += stream.compress(true);
        } while (length == output.length);
        return output.truncatedToLength(length);
    }

};

function ZlibError(msg){
    if (this === undefined){
        return new ZlibError(msg);
    }
    this.name = "ZlibError";
    this.message = msg;
    Error.captureStackTrace(this, ZlibError);
}

ZlibError.prototype = Object.create(Error.prototype);

JSGlobalObject.ZlibStream = function(level, info){
    if (this === undefined){
        return new ZlibStream(level, info);
    }
    this.method = Zlib.Method.Deflate;
    this._deflateStream = new DeflateStream(level, info);
    this._header = JSData.initWithLength(6);
    this._checksum = JSData.initWithLength(4);
    this._headerRemaining = 2;
};

ZlibStream.prototype = Object.create({}, {

    method: {writable: true, value: null},
    check: {writable: true, value: null},
    state: {
        get: function ZlibStream_getState(){
            return this._state;
        }
    },
    _header: {writable: true, value: null},
    _headerOffset: {writable: true, value: 0},
    _headerRemaining: {writable: true, value: 0},
    _checksum: {writable: true, value: null},
    _checksumOffset: {writable: true, value: 0},
    _deflateStream: { writable: true, value: null },
    _input: { writable: true, value: null },
    _adler: {writable: true, value: null},
    _state: {writable: true, value: 0},
    _sumRemaining: {writable: true, value: 4},
    _inputNeedsSum: {writable: true, value: false},
    _inputOffset: {writable: true, value: 0},

    input: {
        get: function ZlibStream_getInput(){
            return this._input;
        },

        set: function ZlibStream_setInput(input){
            this._input = input;
            this._inputOffset = 0;
            this._inputNeedsSum = true;
            if (this._headerRemaining === 0 && this._deflateStream.state != DeflateStream.State.done){
                this._deflateStream.input = this._input;
            }
        }
    },

    output: {
        get: function ZlibStream_getOutputBuffer(){
            return this._deflateStream.output;
        },

        set: function ZlibStream_setOutputBuffer(output){
            this._deflateStream.output = output;
        }
    },

    outputOffset: {
        get: function ZlibStream_getOutputOffset(){
            return this._deflateStream.outputOffset;
        },

        set: function ZlibStream_setOutputOffset(outputOffset){
            this._deflateStream.outputOffset = outputOffset;
        }
    },

    uncompress: {
        value: function ZlibStream_uncompress(){
            if (this._headerRemaining > 0){
                while (this._headerRemaining > 0 && this._inputOffset < this._input.length){
                    this._header[this._headerOffset++] = this._input[this._inputOffset++];
                    --this._headerRemaining;
                    if (this._headerOffset == 2){
                        this.method = this._header[0] & 0xF;
                        var flags = this._header[1];
                        this.check = flags & 0x1F;
                        if (flags & 0x20){
                            this._headerRemaining = 4;
                        }
                    }
                }
                if (this._headerRemaining > 0){
                    return this._deflateStream.output.subdataInRange(JSRange(this._deflateStream.outputOffset, 0));
                }
                if (((this._header[0] << 8) | this._header[1]) % 31){
                    throw new ZlibError("Zlib header check failed: %#02x %#02x".sprintf(this._header[0], this._header[1]));
                }
                if (this.method != Zlib.Method.Deflate){
                    throw new ZlibError("Zlib method unknown: %d".sprintf(this.method));
                }
                this._adler = new Adler32();
                this._deflateStream.input = this._input.subdataInRange(JSRange(this._inputOffset, this._input.length - this._inputOffset));
            }
            var length;
            if (this._deflateStream.state != DeflateStream.State.done){
                var startingInputOffset = this._deflateStream.inputOffset;
                var startingOutputOffset = this._deflateStream.outputOffset;
                length = this._deflateStream.inflate();
                this._adler.includeBytes(this._deflateStream.output.subdataInRange(JSRange(startingOutputOffset, length)));
                this._inputOffset += this._deflateStream.inputOffset - startingInputOffset;
            }else{
                length = 0;
            }
            if (this._deflateStream.state == DeflateStream.State.done){
                while (this._checksumOffset < this._checksum.length && this._inputOffset < this._input.length){
                    this._checksum[this._checksumOffset++] = this._input[this._inputOffset++];
                }
                if (this._checksumOffset == this._checksum.length){
                    this._checkOutput();
                    this._state = ZlibStream.State.done;
                }
            }
            return length;
        }
    },

    compress: {
        value: function ZlibStream_compress(isFinal){
            if (this._headerOffset === 0){
                if (this.method != Zlib.Method.Deflate){
                    throw new ZlibError("Zlib method unknown: %d".sprintf(this.method));
                }
                this._header[0] = (this._deflateStream.info << 4) | this.method;
                this._header[1] = this._deflateStream.level << 6;
                this.check = 31 - ((this._header[0] << 8) | this._header[1]) % 31;
                this._header[1] |= this.check;
                this._headerOffset = 2;
                this._headerRemaining = 2;
                this._adler = new Adler32();
                this._deflateStream.input = this._input;
            }

            var startingOffset = this._deflateStream.outputOffset;

            if (this._headerRemaining > 0){
                while (this._headerRemaining > 0 && this._deflateStream.outputOffset < this._deflateStream.output.length){
                    this._deflateStream.output[this._deflateStream.outputOffset++] = this._header[this._headerOffset - this._headerRemaining];
                    --this._headerRemaining;
                }
                if (this._deflateStream.outputOffset == this._deflateStream.output.length){
                    return this._deflateStream.output.subdataInRange(JSRange(startingOffset, this._deflateStream.outputOffset - startingOffset));
                }
            }
            if (this._inputNeedsSum){
                this._adler.includeBytes(this._input);
                this._inputNeedsSum = false;
            }
            if (this._deflateStream.state != DeflateStream.State.done){
                this._deflateStream.deflate(isFinal);
            }
            if (this._deflateStream.state == DeflateStream.State.done){
                var sum = this._adler.sum;
                var sumBytes = JSData.initWithArray([(sum >> 24) & 0xFF, (sum >> 16) & 0xFF, (sum >> 8) & 0xFF, sum & 0xFF]);
                while (this._sumRemaining > 0 && this._deflateStream.outputOffset < this._deflateStream.output.length){
                    this._deflateStream.output[this._deflateStream.outputOffset++] = sumBytes[4 - this._sumRemaining];
                    --this._sumRemaining;
                }
                if (this._sumRemaining === 0){
                    this._state = ZlibStream.State.done;
                }
            }
            return this._deflateStream.outputOffset - startingOffset;
        }
    },

    _checkOutput: {
        value: function(){
            var given = this._checksum.dataView().getUint32(0);
            var calculated = this._adler.sum;
            if (given != calculated){
                throw new ZlibError("Zlib checksum failed: %d != %d".sprintf(given, calculated));
            }
        }
    }
});

ZlibStream.State = {
    processing: 0,
    done: 1
};

})();