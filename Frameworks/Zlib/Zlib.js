// https://tools.ietf.org/html/rfc1950
// #feature Uint8Array
// #feature Uint32Array
// #import "Zlib/Deflate.js"
// #import "Zlib/Adler32.js"
/* global JSGlobalObject, Deflate, DeflateStream, jslog_create, Adler32, Zlib, ZlibStream, ArrayBuffer */
'use strict';

(function(){

var logger = jslog_create("zlib");

JSGlobalObject.Zlib = {

    Method: {
        Deflate: 8
    },

    uncompress: function(input){
        var stream = ZlibStream();
        stream.input = input;
        var accumulatedOutput = new ZlibBuffer(new Uint8Array(input.length * 5));
        var output;
        var done;
        do {
            if (accumulatedOutput.length > 0){
                accumulatedOutput.doubleCapacity();
            }
            stream.outputBuffer = accumulatedOutput.bytes.buffer;
            stream.outputOffset = accumulatedOutput.length;
            output = stream.uncompress();
            accumulatedOutput.length += output.length;
        } while (accumulatedOutput.length == accumulatedOutput.bytes.length);
        return new Uint8Array(accumulatedOutput.bytes.buffer, 0, accumulatedOutput.length);
    },

    compress: function(input){
        // TODO:
    }

};

function ZlibError(msg){
    if (this === undefined){
        return new ZlibError(msg);
    }
    this.name = "ZlibError";
    this.message = msg;
}

ZlibError.prototype = Object.create(Error.prototype);

JSGlobalObject.ZlibStream = function(){
    if (this === undefined){
        return new ZlibStream();
    }
    this.method = Zlib.Method.Deflate;
    this._deflateStream = new DeflateStream();
    this._header = new ZlibBuffer(new Uint8Array(6));
    this._checksum = new ZlibBuffer(new Uint8Array(4));
    this._headerRemaining = 2;
};

ZlibStream.prototype = Object.create({}, {

    method: {writable: true, value: null},
    info: {writable: true, value: 7},
    check: {writable: true, value: null},
    state: {
        get: function ZlibStream_getState(){
            return this._state;
        }
    },
    level: {writable: true, value: null},
    _header: {writable: true, value: null},
    _headerRemaining: {writable: true, value: 0},
    _deflateStream: { writable: true, value: null },
    _input: { writable: true, value: null },
    _adler: {writable: true, value: null},
    _state: {writable: true, value: 0},

    input: {
        get: function ZlibStream_getInput(){
            return this._input.bytes;
        },

        set: function ZlibStream_setInput(input){
            this._input = new ZlibBuffer(input, input.length);
            if (this._headerRemaining === 0 && this._deflateStream.state != DeflateStream.State.done){
                this._deflateStream.input = this._input.bytes;
            }
        }
    },

    outputBuffer: {
        get: function ZlibStream_getOutputBuffer(){
            return this._deflateStream.outputBuffer;
        },

        set: function ZlibStream_setOutputBuffer(outputBuffer){
            this._deflateStream.outputBuffer = outputBuffer;
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
                while (this._headerRemaining > 0 && this._input.offset < this._input.length){
                    this._header.bytes[this._header.length++] = this._input.bytes[this._input.offset++];
                    --this._headerRemaining;
                    if (this._header.length == 2){
                        this.method = this._header.bytes[0] & 0xF;
                        this.info = this._header.bytes[0] >> 4;
                        var flags = this._header.bytes[1];
                        this.check = flags & 0x1F;
                        this.level = flags >> 6;
                        if (flags & 0x20){
                            this._headerRemaining = 4;
                        }
                    }
                }
                if (this._headerRemaining > 0){
                    return new Uint8Array(this.outputBuffer, this.outputOffset, 0);
                }
                if (((this._header.bytes[0] << 8) | this._header.bytes[1]) % 31){
                    throw new ZlibError("Zlib header check failed: %#02x %#02x".sprintf(this._header.bytes[0], this._header.bytes[1]));
                }
                if (this.method != Zlib.Method.Deflate){
                    throw new ZlibError("Zlib method unknown: %d".sprintf(this.method));
                }
                this._adler = new Adler32();
                this._deflateStream.input = new Uint8Array(this._input.bytes.buffer, this._input.bytes.byteOffset + this._input.offset, this._input.length - this._input.offset);
            }
            var output;
            if (this._deflateStream.state != DeflateStream.State.done){
                output = this._deflateStream.inflate();
                this._adler.includeBytes(output);
                this._input.offset = this._deflateStream.input.byteOffset + this._deflateStream.inputOffset;
            }else{
                output = new Uint8Array(this.outputBuffer, this.outputOffset, 0);
            }
            if (this._deflateStream.state == DeflateStream.State.done){
                while (this._checksum.length < this._checksum.bytes.length && this._input.offset < this._input.length){
                    this._checksum.bytes[this._checksum.length++] = this._input.bytes[this._input.offset++];
                }
                if (this._checksum.length == this._checksum.bytes.length){
                    this._checkOutput();
                    this._state = ZlibStream.State.done;
                }
            }
            return output;
        }
    },

    compress: {
        value: function ZlibStream_compress(){
            if (this._headerLength === 0){
                if (this.method != Zlib.Method.Deflate){
                    throw new ZlibError("Zlib method unknown: %d".sprintf(this.method));
                }
                this._header[0] = (this.info << 4) | this.method;
                this._header[1] = this.level << 6;
                this.check = 31 - ((this._header[0] << 8) | this._header[1]) % 31;
                this._header[1] |= this.check;
                this._headerLength = 2;
                this._headerRemaining = 2;
                this._adler = new Adler32();
            }
            if (this._headerRemaining > 0){
                var output = new Uint8Array(this.outputBuffer, this.outputOffset, this.outputBuffer.byteLength - this.outputOffset);
                while (this._headerRemaining > 0 && this.outputOffset < this.outputBuffer.byteLength){
                    output[this.outputOffset++] = this._header[this._headerLength - this._headerRemaining];
                }
            }
            this._adler.includeBytes(this._input);
            // TODO: write adler sum
            // this.output[this.offset++] = (sum >> 24) & 0xFF;
            // this.output[this.offset++] = (sum >> 16) & 0xFF;
            // this.output[this.offset++] = (sum >> 8) & 0xFF;
            // this.output[this.offset++] = sum & 0xFF;
            return this._deflateStream.deflate();
        }
    },

    _checkOutput: {
        value: function(){
            var given = new Uint32Array(1);
            given[0] = (this._checksum.bytes[0] << 24) | (this._checksum.bytes[1] << 16) | (this._checksum.bytes[2] << 8) | this._checksum.bytes[3];
            var calculated = this._adler.sum;
            if (given[0] != calculated){
                throw new ZlibError("Zlib checksum failed: %d != %d".sprintf(given[0], calculated));
            }
        }
    }
});

ZlibStream.State = {
    processing: 0,
    done: 1
};

var ZlibBuffer = function(bytes, length){
    if (this === undefined){
        return new ZlibBuffer(bytes);
    }
    this.bytes = bytes;
    this.length = length || 0;
    this.offset = 0;
    this.bitOffset = 0;
};

ZlibBuffer.prototype = {
    doubleCapacity: {
        value: function ZlibBuffer_doubleCapacity(){
            var copy = new Uint8Array(this.bytes.length * 2);
            for (var i = 0, l = this.length; i < l; ++i){
                copy[i] = this.bytes[i];
            }
            this.bytes = new Uint8Array(copy.buffer, 0, copy.length);
        }
    }
};

})();