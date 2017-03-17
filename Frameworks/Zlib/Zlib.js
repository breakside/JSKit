// https://tools.ietf.org/html/rfc1950
// #feature Uint8Array
// #feature Uint32Array
// #import "Zlib/Deflate.js"
// #import "Zlib/Adler32.js"
/* global JSGlobalObject, Deflate, DeflateStream, jslog_create, Adler32, Zlib, ZlibStream */
'use strict';

(function(){

var logger = jslog_create("zlib");

JSGlobalObject.Zlib = {

    Method: {
        Deflate: 8
    },

    uncompress: function(input){
        var stream = new ZlibStream(input);
        stream.uncompress();
        return stream.output;
    },

    compress: function(input){
        var stream = new ZlibStream(input);
        stream.compress();
        return stream.output;
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

JSGlobalObject.ZlibStream = function(input){
    if (this === undefined){
        return new ZlibStream(input);
    }
    this.input = input;
    this.method = Zlib.Method.Deflate;
};

ZlibStream.prototype = {
    input: null,
    output: null,
    method: null,
    info: 7,
    check: null,
    level: 2,
    dictId: null,
    offset: 0,

    uncompress: function(){
        if (this.input.length < 6){
            throw new ZlibError("Zlib format is invalid, not enough bytes for header and checksum");
        }
        this.readHeader();
        var compressed_length = this.input.length - this.offset - 4;
        // logger.info("Zlib compressed data at offset %d with length %d".sprintf(this.offset, compressed_length));
        this.compressed = new Uint8Array(this.input.buffer, this.input.byteOffset + this.offset, compressed_length);
        this.offset += compressed_length;
        if (this.method == Zlib.Method.Deflate){
            this.output = Deflate.inflate(this.compressed, this.info, this.level);
        }else{
            throw new ZlibError("Zlib method unknown: %d".sprintf(this.method));
        }
        this.checkOutput();
    },

    compress: function(){
        var compressed;
        if (this.method == Zlib.Method.Deflate){
            this.output = new Uint8Array(this.input.length + 6 + Math.max(1, Math.ceil(this.input.length / 0xFFFF)) * 5);
            var stream = new DeflateStream(this.input, this.info, this.level);
            stream.output = new Uint8Array(this.output.buffer, this.output.byteOffset + 2, this.output.length - 6);
            stream.deflate();
            this.offset = 2 + stream.outputLength;
        }else{
            throw new ZlibError("Zlib method unknown: %d".sprintf(this.method));
        }
        var method_and_info = (this.info << 4) | this.method;
        this.check = 31 - ((method_and_info << 8) | (this.level << 6)) % 31;
        var flags = this.level << 6 | this.check;
        this.output[0] = method_and_info;
        this.output[1] = flags;
        var sum = Adler32(this.input);
        this.output[this.offset++] = (sum >> 24) & 0xFF;
        this.output[this.offset++] = (sum >> 16) & 0xFF;
        this.output[this.offset++] = (sum >> 8) & 0xFF;
        this.output[this.offset++] = sum & 0xFF;
        return new Uint8Array(this.output.buffer, this.output.byteOffset, this.offset);
    },

    readHeader: function(){
        var method_and_info = this.input[this.offset++];
        var flags = this.input[this.offset++];
        this.method = method_and_info & 0xF;
        this.info = method_and_info >> 4;
        this.check = flags & 0x1F;
        this.level = flags >> 6;
        if (flags & 0x20){
            if (this.length - 4 < this.offset + 4){
                throw new ZlibError("Zlib format is invalid, not enough bytes for header with dictionary");
            }
            this.dictId = (this.input[this.offset] << 24) | (this.input[this.offset + 1] << 16) | (this.input[this.offset + 2] << 8) | this.input[this.offset + 3];
            this.offset += 4;
        }
        var sum = (method_and_info << 8) | flags;
        if (sum % 31){
            throw new ZlibError("Zlib header check failed: %#02x %#02x".sprintf(method_and_info, flags));
        }
    },

    checkOutput: function(){
        var given = new Uint32Array(1);
        given[0] = (this.input[this.offset] << 24) | (this.input[this.offset + 1] << 16) | (this.input[this.offset + 2] << 8) | this.input[this.offset + 3];
        var calculated = Adler32(this.output);
        if (given[0] != calculated){
            throw new ZlibError("Zlib checksum failed: %d != %d".sprintf(given[0], calculated));
        }
    }
};

})();