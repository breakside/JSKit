// https://tools.ietf.org/html/rfc1951
// #feature Uint8Array
// #import "Zlib/Huffman.js"
/* global jslog_create, HuffmanTree, JSGlobalObject, Deflate, DeflateStream */
'use strict';

(function(){

var logger = jslog_create("zlib");

JSGlobalObject.DeflateStream = function(info, level){
    if (this === undefined){
        return new DeflateStream(info, level);
    }
    if (info === undefined || info < 0 || info > 7){
        info = DeflateStream.WindowSize.window32K;
    }
    if (level === undefined){
        level = 0;
    }
    this.info = info;
    this.level = level;
    this._window = new DeflateBuffer(new Uint8Array(1 << (this.info + 8)));
};

DeflateStream.prototype = Object.create({}, {

    // -----------------------------------------------------------------------
    // MARK: - Options

    info: {writable: true, value: null},
    level: {writable: true, value: null},

    // -----------------------------------------------------------------------
    // MARK: - Stream State

    _state: {writable: true, value: 0},

    state: {
        get: function DeflateStream_getState(){
            return this._state;
        }
    },

    // -----------------------------------------------------------------------
    // MARK: - Managing the Input Buffer

    _input: {writable: true, value: null},

    input: {
        get: function DeflateStream_getInput(){
            return this._input.bytes;
        },

        set: function DeflateStream_setInput(input){
            if (this._state != DeflateStream.State.needInput){
                throw new Error("Cannot set stream input, not finished processing previous input");
            }
            this._input = new DeflateBuffer(input, input.length);
            if (input.length > 0){
                this._state = DeflateStream.State.process;
            }
        }
    },

    inputOffset: {
        get: function DeflateStream_getInputOffset(){
            if (this._input === null){
                return 0;
            }
            return this._input.offset;
        }
    },

    // -----------------------------------------------------------------------
    // MARK: - Managing the Output Buffer

    _outputBuffer: {writable: true, value: null},
    _outputBufferOffset: {writable: true, value: 0},

    outputBuffer: {
        get: function DeflateStream_getOutputBuffer(){
            return this._outputBuffer;
        },

        set: function DeflateStream_setOutputBuffer(outputBuffer){
            this._outputBuffer = outputBuffer;
        }
    },

    outputOffset: {
        get: function DeflateStream_getOutputOffset(){
            return this._outputBufferOffset;
        },

        set: function DeflateStream_setOutputOffset(outputOffset){
            this._outputBufferOffset = outputOffset;
        }
    },

    // -----------------------------------------------------------------------
    // MARK: - Inflate

    inflate: {
        value: function DeflateStream_inflate(){
            if (this._input === null){
                throw Error("inflate() called without adding input");
            }
            if (this._state == DeflateStream.State.done){
                throw Error("inflate() called on completed stream");
            }
            if (this._outputBuffer === null){
                throw Error("inflate() called without an output buffer");
            }
            if (this._outputOffset >= this._outputBuffer.byteLength){
                throw Error("inflate() called with no room in the output buffer");
            }
            var output = new DeflateBuffer(new Uint8Array(this._outputBuffer, this._outputBufferOffset, this._outputBuffer.byteLength - this._outputBufferOffset));
            this._copyRemainingFromWindow(output);
            var isDone = false;
            while (!isDone && this._input.offset < this._input.length && output.length < output.bytes.length){
                if (this._block === null || this._block.isDone){
                    isDone = false;
                    this._block = DeflateStreamBlock(this._readBits(3));
                    if (this._block instanceof UncompressedBlock && this._input.bitOffset > 0){
                        this._input.offset += 1;
                        this._input.bitOffset = 0;
                    }
                }else{
                    this._block.inflate(this, output);
                    isDone = this._block.isFinal && this._block.isDone;
                }
            }
            if (isDone){
                if (this._input.bitOffset > 0){
                    this._input.offset += 1;
                    this._input.bitOffset = 0;
                }
                this._state = DeflateStream.State.done;
            }else if (this._input.offset == this._input.length){
                this._state = DeflateStream.State.needInput;
            }
            return new Uint8Array(output.bytes.buffer, output.bytes.byteOffset + output.offset, output.length - output.offset);
        }
    },

    _block: {writable: true, value: null},
    _leftoverBitCount: {writable: true, value: 0},
    _leftoverBits: {writable: true, value: 0},

    _readBits: {
        value: function DeflateStream__readBits(n){
            if (this._input.offset == this._input.bytes.length){
                return null;
            }
            if (this._leftoverBitCount > 0){
                n -= this._leftoverBitCount;
                var shift = this._leftoverBitCount;
                this._leftoverBitCount = 0;
                return (this._input._readBits(n) << shift) | this._leftoverBits;
            }
            var bits = this._input._readBits(n);
            if (bits === null){
                this._leftoverBitCount = 8 - this._input.bitOffset;
                this._leftoverBits = this._input._readBits(this._leftoverBitCount);
                return null;
            }
            return bits;
        },
    },

    // -----------------------------------------------------------------------
    // MARK: - Deflate

    deflate: {
        value: function DelfateStream_deflate(){
            // TODO:
            // if (!this.output){
            //     this._isOutputProvided = false;
            //     this.output = new Uint8Array(this.input.length + Math.max(1, Math.ceil(this.input.length / 0xFFFF)) * 5);
            // }
            // this.outputLength = 0;
            // if (this.level === 0){
            //     this._inputByteOffset = 0;
            //     var L = this.input.length;
            //     while (this.offset < L){
            //         var block_length = Math.min(0xFFFF, L - this.offset);
            //         var header = 0;
            //         if (this.offset + block_length == L){
            //             header |= 0x01;
            //         }
            //         this._writeBytes([header]);
            //         this._writeBytes([block_length & 0xFF, (block_length >> 8) & 0xFF]);
            //         this._writeBytes([~block_length & 0xFF, (~block_length >> 8) & 0xFF]);
            //         this._writeBytes(new Uint8Array(this.input.buffer, this.input.byteOffset + this.offset, block_length));
            //         this.offset += block_length;
            //     }
            // }else{
            //     throw new DeflateError("Deflate compression level %d is not implemented".sprintf(this.level));
            // }
        }
    },

    // -----------------------------------------------------------------------
    // MARK: - Data window management

    _window: {writable: true, value: null},
    _windowCopyOffset: {writable: true, value: 0},
    _windowCopyLength: {writable: true, value: 0},

    _copyFromWindow: {
        value: function DeflateStream_copyFromWindow(distance, length, output){
            this._windowCopyOffset = (this._window.offset + this._window.length - distance) % this._window.bytes.length;
            this._windowCopyLength = length;
            this._copyRemainingFromWindow(output);
        }
    },

    _copyRemainingFromWindow: {
        value: function DeflateStream_copyRemainingFromWindow(output){
            var b;
            while (this._windowCopyLength > 0 && output.length < output.bytes.length){
                b = this._window.bytes[this._windowCopyOffset++];
                output.bytes[output.length++] = b;
                this._window.overwrite(b);
                --this._windowCopyLength;
                if (this._windowCopyOffset == this._window.bytes.length){
                    this._windowCopyOffset = 0;
                }
            }
        }
    }

});

DeflateStream.State = {
    needInput: 0,
    process: 1,
    done: 2
};

DeflateStream.BlockState = {
    header: 0,
    uncompressedHeader: 1,
    uncompresseData: 2,
    huffmanHeader: 3,
    huffmanData: 4
};

DeflateStream.WindowSize = {
    window512: 1,
    window1K: 2,
    window2K: 3,
    window4K: 4,
    window8K: 5,
    window16K: 6,
    window32K: 7
};

// -----------------------------------------------------------------------
// MARK: - Private Buffer class for reading/writing

var DeflateBuffer = function(bytes, length){
    if (this === undefined){
        return new DeflateBuffer(bytes);
    }
    this.bytes = bytes;
    this.length = length || 0;
    this.offset = 0;
    this.bitOffset = 0;
};

DeflateBuffer.prototype = Object.create({}, {

    _readBits: {
        value: function DeflateBuffer_readBits(n){
            if (n > 8){
                throw new DeflateError("Can only read up to 8 bits at a time");
            }
            var x;
            if (this.bitOffset + n <= 8){
                x = (this.bytes[this.offset] >> this.bitOffset) & (0xFF >> (8 - n));
                this.bitOffset += n;
                if (this.bitOffset === 8){
                    this.offset += 1;
                    this.bitOffset = 0;
                }
            }else if (this.offset < this.length - 1){
                n = (this.bitOffset + n) % 8;
                x = ((this.bytes[this.offset + 1] & (0xFF >> (8 - n))) << (8 - this.bitOffset)) | (this.bytes[this.offset] >> this.bitOffset);
                this.offset += 1;
                this.bitOffset = n;
            }else{
                x = null;
            }
            return x;
        }
    },

    overwrite: {
        value: function DeflateBuffer_write(byte){
            if (this.length === this.bytes.length){
                this.offset++;
                if (this.offset === this.bytes.length){
                    this.offset = 0;
                }
            }
            this.bytes[(this.offset + this.length) % this.bytes.length] = byte;
        }
    },

    doubleCapacity: {
        value: function DeflateBuffer_doubleCapacity(){
            var copy = new Uint8Array(this.bytes.length * 2);
            for (var i = 0, l = this.length; i < l; ++i){
                copy[i] = this.bytes[i];
            }
            this.bytes = new Uint8Array(copy.buffer, 0, copy.length);
        }
    }

});

// -----------------------------------------------------------------------
// MARK: - Block Types

var DeflateStreamBlock = function(headerBits){
    if (this !== undefined){
        throw new Error("DeflateStreamBlock is not a constructor, call only as a function");
    }
    if (headerBits === null){
        return null;
    }
    var type = (headerBits & 0x06) >> 1;
    var isFinal = headerBits & 0x01;
    resusableBlockBuffer.length = 0;
    switch (type){
        case 0:
            return new UncompressedBlock(isFinal);
        case 1:
            return new FixedHuffmanBlock(isFinal);
        case 2:
            return new DynamicHuffmanBlock(isFinal);
    }
    return null;
};

var resusableBlockBuffer = new DeflateBuffer(new Uint8Array(4));

var UncompressedBlock = function(isFinal){
    this.isFinal = isFinal;
    this.headerRemaining = 4;
    this.remaining = 0;
    this.isDone = false;
};

UncompressedBlock.prototype = {
    inflate: function(stream, output){
        if (this.headerRemaining > 0){
            do{
                resusableBlockBuffer.bytes[resusableBlockBuffer.length++] = stream._input.bytes[stream._input.offset++];
                --this.headerRemaining;
            }while (this.headerRemaining > 0 && stream._input.offset < stream._input.length);
            if (this.headerRemaining === 0){
                this.remaining = (resusableBlockBuffer.bytes[1] << 8) | resusableBlockBuffer.bytes[0];
            }else{
                return;
            }
        }
        while (this.remaining > 0 && stream._input.offset < stream._input.length && output.length < output.bytes.length){
            output.bytes[output.length++] = stream._input.bytes[stream._input.offset++];
            stream._window.overwrite(output.bytes[output.length]);
            --this.remaining;
        }
        this.isDone = this.remaining === 0;
    }
};

var HuffmanBlock = function(isFinal){
    this.isFinal = isFinal;
    this.isDone = false;
    this.huffmanLiterals = null;
    this.huffmanDistances = null;
    this.code = null;
    this.extra = null;
    this.extra2 = null;
    this.extra3 = null;
    this.node = null;
};

HuffmanBlock.prototype = {

    getCode: function(stream){
        var b;
        while (this.node.value === null){
            b = stream._readBits(1);
            if (b === null){
                return null;
            }
            this.node = this.node[b];
        }
        return this.node.value;
    },

    inflate: function(stream, output){
        var length;
        var distance;
        do {
            if (this.code === null){
                if (this.node === null){
                    this.node = this.huffmanLiterals;
                }
                this.code = this.getCode(stream);
                if (this.code === null){
                    break;
                }
                this.node = null;
            }
            if (this.code < 256){
                output.bytes[output.length++] = this.code;
                stream._window.overwrite(this.code);
            }else if (this.code > 256 && this.code <= 287){
                if (this.extra === null){
                    this.extra = 0;
                    if (this.code < 285){
                        if (this.code >= 281){
                            this.extra = stream._readBits(5);
                        }else if (this.code >= 277){
                            this.extra = stream._readBits(4);
                        }else if (this.code >= 273){
                            this.extra = stream._readBits(3);
                        }else if (this.code >= 269){
                            this.extra = stream._readBits(2);
                        }else if (this.code >= 265){
                            this.extra = stream._readBits(1);
                        }
                    }
                    if (this.extra === null){
                        break;
                    }
                }
                length = Deflate.LengthCodeMap[this.code] + this.extra;
                if (this.code2 === null){
                    if (this.node === null){
                        this.node = this.huffmanDistances;
                    }
                    this.code2 = this.getCode(stream);
                    if (this.code2 === null){
                        break;
                    }
                    this.node = null;
                }
                if (this.extra2 === null){
                    this.extra2 = 0;
                    if (this.code2 >= 28){
                        this.extra2 = stream._readBits(8);
                    }else if (this.code2 >= 26){
                        this.extra2 = stream._readBits(8);
                    }else if (this.code2 >= 24){
                        this.extra2 = stream._readBits(8);
                    }else if (this.code2 >= 22){
                        this.extra2 = stream._readBits(8);
                    }else if (this.code2 >= 20){
                        this.extra2 = stream._readBits(8);
                    }else if (this.code2 >= 18){
                        this.extra2 = stream._readBits(8);
                    }else if (this.code2 >= 16){
                        this.extra2 = stream._readBits(7);
                    }else if (this.code2 >= 14){
                        this.extra2 = stream._readBits(6);
                    }else if (this.code2 >= 12){
                        this.extra2 = stream._readBits(5);
                    }else if (this.code2 >= 10){
                        this.extra2 = stream._readBits(4);
                    }else if (this.code2 >= 8){
                        this.extra2 = stream._readBits(3);
                    }else if (this.code2 >= 6){
                        this.extra2 = stream._readBits(2);
                    }else if (this.code2 >= 4){
                        this.extra2 = stream._readBits(1);
                    }
                    if (this.extra2 === null){
                        break;
                    }
                }
                if (this.extra3 === null){
                    this.extra3 = 0;
                    if (this.code2 >= 28){
                        this.extra3 = (stream._readBits(5) << 8);
                    }else if (this.code2 >= 26){
                        this.extra3 = (stream._readBits(4) << 8);
                    }else if (this.code2 >= 24){
                        this.extra3 = (stream._readBits(3) << 8);
                    }else if (this.code2 >= 22){
                        this.extra3 = (stream._readBits(2) << 8);
                    }else if (this.code2 >= 20){
                        this.extra3 = (stream._readBits(1) << 8);
                    }
                    if (this.extra3 === null){
                        break;
                    }
                }
                distance = Deflate.DistanceCodeMap[this.code2] + (this.extra2 | this.extra3);
                stream._copyFromWindow(distance, length, output);
            }else{
                this.isDone = this.code == 256;
                if (!this.isDone){
                    throw new DeflateError("Invalid code: %d".sprintf(this.code));
                }
            }
            this.code = null;
            this.extra = null;
            this.extra2 = null;
            this.extra3 = null;
        }while (!this.isDone && output.length < output.bytes.length);
    }
};

var FixedHuffmanBlock = function(isFinal){
    HuffmanBlock.call(this, isFinal);
    this.huffmanLiterals = Deflate.HuffmanFixedLiterals;
    this.huffmanDistances = Deflate.HuffmanFixedDistances;
};

FixedHuffmanBlock.prototype = Object.create(HuffmanBlock.prototype);

var DynamicHuffmanBlock = function(isFinal){
    HuffmanBlock.call(this, isFinal);
    this.literalCodeCount = null;
    this.distanceCodeCount = null;
    this.codeLengthCount = null;
    this.codeLengths = [];
    this.literalAndDistanceCodeLengths = [];
    this.headerDone = false;
    this.headerTree = null;
};

DynamicHuffmanBlock.prototype = Object.create(HuffmanBlock.prototype, {

    inflate: {
        value: function(stream, output){
            var i, l;
            if (!this.headerDone){
                if (this.literalCodeCount === null){
                    this.literalCodeCount = stream._readBits(5);
                    if (this.literalCodeCount === null){
                        return;
                    }
                    this.literalCodeCount += 257;
                }
                if (this.distanceCodeCount === null){
                    this.distanceCodeCount = stream._readBits(5);
                    if (this.distanceCodeCount === null){
                        return;
                    }
                    this.distanceCodeCount += 1;
                }
                if (this.codeLengthCount === null){
                    this.codeLengthCount = stream._readBits(4);
                    if (this.codeLengthCount === null){
                        return;
                    }
                    this.codeLengthCount += 4;
                }
                var codeLength;
                while (this.codeLengths.length < this.codeLengthCount){
                    codeLength = stream._readBits(3);
                    if (codeLength === null){
                        return;
                    }
                    this.codeLengths.push(codeLength);
                }
                if (this.headerTree === null){
                    var sortedCodeLengths = [];
                    for (i = 0, l = this.codeLengths.length; i < l; ++i){
                        sortedCodeLengths[Deflate.HuffmanDynamicLengthOrder[i]] = this.codeLengths[i];
                    }
                    this.headerTree = HuffmanTree(sortedCodeLengths);
                }
                while (this.literalAndDistanceCodeLengths.length < this.literalCodeCount + this.distanceCodeCount){
                    codeLength = this.readEncodedCodeLengthInfo(stream);
                    if (codeLength === null){
                        return;
                    }
                    if (codeLength.literal){
                        this.literalAndDistanceCodeLengths.push(codeLength.value);
                    }else if (codeLength.repeat == 1){
                        for (i = 0; i < codeLength.value && this.literalAndDistanceCodeLengths.length < this.literalCodeCount + this.distanceCodeCount; ++i){
                            this.literalAndDistanceCodeLengths.push(this.literalAndDistanceCodeLengths[this.literalAndDistanceCodeLengths.length - 1]);
                        }
                    }else if (codeLength.repeat == 2){
                        for (i = 0; i < codeLength.value && this.literalAndDistanceCodeLengths.length < this.literalCodeCount + this.distanceCodeCount; ++i){
                            this.literalAndDistanceCodeLengths.push(0);
                        }
                    }
                }
                this.huffmanLiterals = HuffmanTree(this.literalAndDistanceCodeLengths.slice(0, this.literalCodeCount));
                this.huffmanDistances = HuffmanTree(this.literalAndDistanceCodeLengths.slice(this.literalCodeCount));
                this.headerDone = true;
            }
            if (this.headerDone){
                HuffmanBlock.prototype.inflate.call(this, stream, output);
            }
        }
    },

    readEncodedCodeLengthInfo: {
        value: function(stream){
            var codeLength = {literal: false, value: 0, repeat: 0};
            var repeat;
            if (this.node === null){
                this.node = this.headerTree;
            }
            if (this.code === null){
                this.code = this.getCode(stream);
                if (this.code === null){
                    return null;
                }
                this.node = null;
            }
            if (this.code < 16){
                codeLength.literal = true;
                codeLength.value = this.code;
            }else if (this.code == 16){
                repeat = stream._readBits(2);
                if (repeat === null){
                    return null;
                }
                codeLength.repeat = 1;
                codeLength.value = repeat + 3;
            }else if (this.code == 17){
                repeat = stream._readBits(3);
                if (repeat === null){
                    return null;
                }
                codeLength.repeat = 2;
                codeLength.value = repeat + 3;
            }else if (this.code == 18){
                repeat = stream._readBits(7);
                if (repeat === null){
                    return null;
                }
                codeLength.repeat = 2;
                codeLength.value = repeat + 11;
            }else{
                throw new DeflateError("Invalid code length code: %d", this.code);
            }
            this.code = null;
            return codeLength;
        }
    }

});

// -----------------------------------------------------------------------
// MARK: - All at Once functions

JSGlobalObject.Deflate = {

    inflate: function(input, info, level){
        var stream = DeflateStream();
        stream.input = input;
        var accumulatedOutput = new DeflateBuffer(new Uint8Array(input.length * 5));
        var output;
        var done;
        do {
            if (accumulatedOutput.length > 0){
                accumulatedOutput.doubleCapacity();
            }
            stream.outputBuffer = accumulatedOutput.bytes.buffer;
            stream.outputOffset = accumulatedOutput.length;
            output = stream.inflate();
            accumulatedOutput.length += output.length;
        } while (accumulatedOutput.length == accumulatedOutput.bytes.length);
        return new Uint8Array(accumulatedOutput.bytes.buffer, 0, accumulatedOutput.length);
    },

    deflate: function(input, info, level){
        var stream = new DeflateStream(input, info, level);
        stream.deflate();
        return stream.output;
    }
};

// -----------------------------------------------------------------------
// MARK: - Private Data



Deflate.LengthCodeMap = {
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
};

Deflate.DistanceCodeMap = {
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
};

Deflate.HuffmanDynamicLengthOrder = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];

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

})();