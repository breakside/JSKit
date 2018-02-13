// https://tools.ietf.org/html/rfc1951
// #feature Uint8Array
// #import "Zlib/Huffman.js"
/* global jslog_create, HuffmanTree, JSGlobalObject, Deflate, DeflateStream */
'use strict';

(function(){

var logger = jslog_create("zlib");

JSGlobalObject.Deflate = {

    inflate: function(input, info, level){
        var stream = new DeflateStream(input, info, level);
        stream.inflate();
        return stream.output;
    },

    deflate: function(input, info, level){
        var stream = new DeflateStream(input, info, level);
        stream.deflate();
        return stream.output;
    },

    LengthCodeMap: {
        257: 3,
        258: 4,
        259: 5,
        260: 6,
        261: 7,
        262: 8,
        263: 9,
        264: 10,
        265: 11,
        266: 13,
        267: 15,
        268: 17,
        269: 19,
        270: 23,
        271: 27,
        272: 31,
        273: 35,
        274: 43,
        275: 51,
        276: 59,
        277: 67,
        278: 83,
        279: 99,
        280: 115,
        281: 131,
        282: 163,
        283: 195,
        284: 227,
        285: 258
    },

    DistanceCodeMap: {
        0: 1,
        1: 2,
        2: 3,
        3: 4,
        4: 5,
        5: 7,
        6: 9,
        7: 13,
        8: 17,
        9: 25,
        10: 33,
        11: 49,
        12: 65,
        13: 97,
        14: 129,
        15: 193,
        16: 257,
        17: 385,
        18: 513,
        19: 769,
        20: 1025,
        21: 1537,
        22: 2049,
        23: 3073,
        24: 4097,
        25: 6145,
        26: 8193,
        27: 12289,
        28: 16385,
        29: 24577
    },

    HuffmanDynamicLengthOrder: [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]
};

Object.defineProperty(Deflate, 'HuffmanFixedLiterals', {
    configurable: true,
    get: function(){
        var code_lengths = [];
        var i;
        for (i = 0; i <= 143; ++i){
            code_lengths[i] = 8;
        }
        for (i = 144; i <= 255; ++i){
            code_lengths[i] = 9;
        }
        for (i = 256; i <= 279; ++i){
            code_lengths[i] = 7;
        }
        for (i = 280; i <= 287; ++i){
            code_lengths[i] = 8;
        }
        var tree = HuffmanTree(code_lengths);
        Object.defineProperty(Deflate, 'HuffmanFixedLiterals', {
            value: tree
        });
        return tree;
    }
});

Object.defineProperty(Deflate, 'HuffmanFixedDistances', {
    configurable: true,
    get: function(){
        var code_lengths = [];
        var i;
        for (i = 0; i <= 31; ++i){
            code_lengths[i] = 5;
        }
        var tree = HuffmanTree(code_lengths);
        Object.defineProperty(Deflate, 'HuffmanFixedDistances', {
            value: tree
        });
        return tree;
    }
});

function DeflateError(msg){
    if (this === undefined){
        return new DeflateError(msg);
    }
    this.name = "DeflateError";
    this.message = msg;
}

DeflateError.prototype = Object.create(Error.prototype);

JSGlobalObject.DeflateStream = function(input, info, level){
    if (this === undefined){
        return new DeflateStream(input, info, level);
    }
    this.input = input;
    this.info = info;
    this.level = level;
};

DeflateStream.prototype = {
    input: null,
    output: null,
    outputBuffer: null,
    outputLengt: null,
    info: null,
    level: null,
    offset: 0,
    bitOffset: 0,
    _isOutputProvided: true,

    inflate: function(){
        var header;
        var is_final_block;
        var type;
        this.block_index = 0;
        if (!this.output){
            this._isOutputProvided = false;
            this.output = new Uint8Array(this.input.length * 5);
        }
        this.outputLength = 0;
        do {
            header = this._readBits(3);
            is_final_block = header & 0x01;
            type = (header & 0x06) >> 1;
            // logger.info("Deflate block #%d, type %d".sprintf(this.block_index, type));
            if (type === 0){
                this._decodeUncompressedBlock();
            }else if (type === 1){
                this._decodeFixedHuffmanBlock();
            }else if (type === 2){
                this._decodeDynamicHuffmanBlock();
            }else{
                throw new DeflateError("Deflate block #%d type unknown: %d".sprintf(this.block_index, type));
            }
            ++this.block_index;
        } while (!is_final_block);
        if (!this._isOutputProvided){
            this.output = new Uint8Array(this.output.buffer, 0, this.outputLength);
        }
    },

    deflate: function(){
        if (!this.output){
            this._isOutputProvided = false;
            this.output = new Uint8Array(this.input.length + Math.max(1, Math.ceil(this.input.length / 0xFFFF)) * 5);
        }
        this.outputLength = 0;
        if (this.level === 0){
            this.offset = 0;
            var L = this.input.length;
            while (this.offset < L){
                var block_length = Math.min(0xFFFF, L - this.offset);
                var header = 0;
                if (this.offset + block_length == L){
                    header |= 0x01;
                }
                this._writeBytes([header]);
                this._writeBytes([block_length & 0xFF, (block_length >> 8) & 0xFF]);
                this._writeBytes([~block_length & 0xFF, (~block_length >> 8) & 0xFF]);
                this._writeBytes(new Uint8Array(this.input.buffer, this.input.byteOffset + this.offset, block_length));
                this.offset += block_length;
            }
        }else{
            throw new DeflateError("Deflate compression level %d is not implemented".sprintf(this.level));
        }
    },

    _readBits: function(n){
        if (this.offset >= this.input.length){
            throw new DeflateError("Reading past the end");
        }
        var x;
        if (this.bitOffset === 0 && n === 8){
            x = this.input[this.offset];
            ++this.offset;
        }else if (this.bitOffset === 0){
            x = this.input[this.offset] & (0xFF >> (8 - n));
            this.bitOffset = n;
        }else{
            var remaining = this.input[this.offset] >> this.bitOffset;
            if (this.bitOffset + n <= 8){
                x = remaining & (0xFF >> (8 - n));
                this.bitOffset += n;
                if (this.bitOffset === 8){
                    this.offset += 1;
                    this.bitOffset = 0;
                }
            }else{
                this.offset += 1;
                if (this.offset >= this.input.length){
                    throw new DeflateError("Reading past the end");
                }
                n = (this.bitOffset + n) % 8;
                x = ((this.input[this.offset] & (0xFF >> (8 - n))) << (8 - this.bitOffset)) | remaining;
                this.bitOffset = n;
            }
        }
        return x;
    },

    _writeBytes: function(bytes){
        var i, l;
        if (this.outputLength + bytes.length > this.output.length){
            if (this._isOutputProvided){
                throw new DeflateError("Deflate: provided output buffer too small");
            }
            var new_output = new Uint8Array((this.outputLength + bytes.length) * 2);
            logger.info("Deflate increasing output buffer size from %d to %d".sprintf(this.output.length, new_output.length));
            for (i = 0, l = this.outputLength; i < l; ++i){
                new_output[i] = this.output[i];
            }
            this.output = new_output;
        }
        for (i = 0, l = bytes.length; i < l; ++i, ++this.outputLength){
            this.output[this.outputLength] = bytes[i];
        }
    },

    _decodeUncompressedBlock: function(){
        if (this.bitOffset > 0){
            this.offset += 1;
            this.bitOffset = 0;
        }
        var len = (this.input[this.offset + 1] << 8) | this.input[this.offset];
        // logger.info("Deflate block #%d has length %d".sprintf(this.block_index, len));
        this.offset += 4;  // +2 for length and another +2 for nlength, which we don't use
        this._writeBytes(new Uint8Array(this.input.buffer, this.input.byteOffset + this.offset, len));
        this.offset += len;
    },

    _decodeFixedHuffmanBlock: function(){
        this.huffmanLiterals = Deflate.HuffmanFixedLiterals;
        this.huffmanDistances = Deflate.HuffmanFixedDistances;
        this._decodeHuffmanBlock();
    },

    _decodeDynamicHuffmanBlock: function(){
        var literal_code_count = this._readBits(5) + 257;
        var distance_code_count = this._readBits(5) + 1;
        var code_length_count = this._readBits(4) + 4;
        var code_lengths = [];
        for (var i = 0; i < code_length_count; ++i){
            code_lengths[Deflate.HuffmanDynamicLengthOrder[i]] = this._readBits(3);
        }
        this.huffmanTree = HuffmanTree(code_lengths);
        code_lengths = this._readHuffmanCodeLengths(literal_code_count);
        this.huffmanLiterals = HuffmanTree(code_lengths);
        code_lengths = this._readHuffmanCodeLengths(distance_code_count);
        this.huffmanDistances = HuffmanTree(code_lengths);
        this._decodeHuffmanBlock();
    },

    _decodeHuffmanBlock: function(){
        var code;
        var length;
        var distance;
        var extra;
        do {
            this.huffmanTree = this.huffmanLiterals;
            code = this._readHuffmanCode();
            // logger.info("found code %d".sprintf(code));
            if (code < 256){
                // logger.info("Writing at %d %s (%#02x)".sprintf(this.outputLength, String.fromCharCode(code), code));
                this._writeBytes([code]);
            }else if (code > 256 && code <= 287){
                // logger.info("Found code %d".sprintf(code));
                extra = 0;
                if (code < 285){
                    if (code >= 281){
                        extra = this._readBits(5);
                    }else if (code >= 277){
                        extra = this._readBits(4);
                    }else if (code >= 273){
                        extra = this._readBits(3);
                    }else if (code >= 269){
                        extra = this._readBits(2);
                    }else if (code >= 265){
                        extra = this._readBits(1);
                    }
                }
                length = Deflate.LengthCodeMap[code] + extra;
                this.huffmanTree = this.huffmanDistances;
                code = this._readHuffmanCode();
                // logger.info("Found distance code: %d".sprintf(code));
                extra = 0;
                if (code >= 28){
                    extra = this._readBits(8) | (this._readBits(5) << 8);
                }else if (code >= 26){
                    extra = this._readBits(8) | (this._readBits(4) << 8);
                }else if (code >= 24){
                    extra = this._readBits(8) | (this._readBits(3) << 8);
                }else if (code >= 22){
                    extra = this._readBits(8) | (this._readBits(2) << 8);
                }else if (code >= 20){
                    extra = this._readBits(8) | (this._readBits(1) << 8);
                }else if (code >= 18){
                    extra = this._readBits(8);
                }else if (code >= 16){
                    extra = this._readBits(7);
                }else if (code >= 14){
                    extra = this._readBits(6);
                }else if (code >= 12){
                    extra = this._readBits(5);
                }else if (code >= 10){
                    extra = this._readBits(4);
                }else if (code >= 8){
                    extra = this._readBits(3);
                }else if (code >= 6){
                    extra = this._readBits(2);
                }else if (code >= 4){
                    extra = this._readBits(1);
                }
                distance = Deflate.DistanceCodeMap[code] + extra;
                // logger.info("At %d, copying %d bytes starting from %d (%d bytes back)".sprintf(this.outputLength, length, this.outputLength - distance, distance));
                while (length > 0){
                    this._writeBytes(new Uint8Array(this.output.buffer, this.outputLength - distance, Math.min(length, distance)));
                    length -= distance;
                }
            }else if (code != 256){
                throw new DeflateError("Invalid code: %d".sprintf(code));
            }
        }while (code != 256);
    },

    _readHuffmanCode: function(){
        var node = this.huffmanTree;
        var b;
        while (node.value === null){
            b = this._readBits(1);
            node = node[b];
        }
        return node.value;
    },

    _readHuffmanCodeLengths: function(count){
        var code_lengths = [];
        var code;
        var repeat;
        var i, j;
        for (i = 0; i < count; ++i){
            code = this._readHuffmanCode();
            if (code < 16){
                code_lengths[i] = code;
            }else if (code == 16){
                repeat = this._readBits(2) + 3;
                code = code_lengths[i - 1];
                for (j = 0; j < repeat; ++j, ++i){
                    code_lengths[i] = code;
                }
                i -= 1;  // Or else the outer for loop incrementer will skip an index
            }else if (code == 17){
                repeat = this._readBits(3) + 3;
                for (j = 0; j < repeat; ++j, ++i){
                    code_lengths[i] = 0;
                }
                i -= 1;  // Or else the outer for loop incrementer will skip an index
            }else if (code == 18){
                repeat = this._readBits(7) + 11;
                for (j = 0; j < repeat; ++j, ++i){
                    code_lengths[i] = 0;
                }
                i -= 1;  // Or else the outer for loop incrementer will skip an index
            }else{
                throw new DeflateError("Invalid code length code: %d", code);
            }
        }
        if (code_lengths.length != count){
            throw new DeflateError("Code length code count mismatch: found %d, expecting %d".sprintf(code_lengths.length, count));
        }
        return code_lengths;
    }
};

})();