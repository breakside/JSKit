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

// https://tools.ietf.org/html/rfc1951
// #import "Huffman.js"
// #import "JSLog.js"
// #import "JSData.js"
// #import "CoreTypes.js"
'use strict';

(function(){

var logger = JSLog("foundation", "zlib");

JSGlobalObject.DeflateStream = function(level, info){
    if (this === undefined){
        return new DeflateStream(info, level);
    }
    if (info === undefined || info < 0 || info > 7){
        info = DeflateStream.WindowSize.window32K;
    }
    if (level === undefined){
        level = Deflate.Level.default;
    }
    this.info = info;
    this.level = level;
    this._window = new DeflateRingBuffer(JSData.initWithLength(1 << (this.info + 8)));
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
            if (this._input === null){
                return null;
            }
            return this._input.bytes;
        },

        set: function DeflateStream_setInput(input){
            if (this._state != DeflateStream.State.needInput){
                throw new Error("Cannot set stream input, not finished processing previous input");
            }
            this._input = new DeflateBitStream(input);
            if (input.length > 0){
                this._state = DeflateStream.State.processing;
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

    _output: {writable: true, value: null},

    output: {
        get: function DeflateStream_getOutputBuffer(){
            if (this._output === null){
                return null;
            }
            return this._output.bytes;
        },

        set: function DeflateStream_setOutputBuffer(output){
            this._output = new DeflateBitStream(output);
        }
    },

    outputOffset: {
        get: function DeflateStream_getOutputOffset(){
            if (this._output === null){
                return 0;
            }
            return this._output.offset;
        },

        set: function DeflateStream_setOutputOffset(outputOffset){
            if (this._output === null){
                throw new DeflateError("cannot set outputOffset before setting output");
            }
            this._output.offset = outputOffset;
            this._output.bitOffset = 0;
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
            if (this._output === null){
                throw Error("inflate() called without an output buffer");
            }
            if (this._output.offset >= this._output.bytes.length){
                throw Error("inflate() called with no room in the output buffer");
            }
            var startingOffset = this._output.offset;
            this._outputRemainingFromWindow();
            var isDone = false;
            while (!isDone && this._input.offset < this._input.bytes.length && this._output.offset < this._output.bytes.length){
                if (this._currentInflateBlock === null || this._currentInflateBlock.isDone){
                    isDone = false;
                    this._currentInflateBlock = DeflateStreamBlock(this._readBits(3));
                    if (this._currentInflateBlock instanceof UncompressedBlock && this._input.bitOffset > 0){
                        this._input.offset += 1;
                        this._input.bitOffset = 0;
                    }
                }else{
                    this._currentInflateBlock.inflate(this);
                    isDone = this._currentInflateBlock.isFinal && this._currentInflateBlock.isDone;
                }
            }
            if (isDone){
                if (this._input.bitOffset > 0){
                    this._input.offset += 1;
                    this._input.bitOffset = 0;
                }
                this._state = DeflateStream.State.done;
            }else if (this._input.offset == this._input.bytes.length){
                this._state = DeflateStream.State.needInput;
            }
            return this._output.offset - startingOffset;
        }
    },

    _currentInflateBlock: {writable: true, value: null},
    _leftoverReadBitCount: {writable: true, value: 0},
    _leftoverReadBits: {writable: true, value: 0},

    _readBits: {
        value: function DeflateStream__readBits(n){
            if (this._input.offset == this._input.bytes.length){
                return null;
            }
            if (this._leftoverReadBitCount > 0){
                n -= this._leftoverReadBitCount;
                var shift = this._leftoverReadBitCount;
                this._leftoverReadBitCount = 0;
                return (this._input._readBits(n) << shift) | this._leftoverReadBits;
            }
            var bits = this._input._readBits(n);
            if (bits === null){
                this._leftoverReadBitCount = 8 - this._input.bitOffset;
                this._leftoverReadBits = this._input._readBits(this._leftoverReadBitCount);
                return null;
            }
            return bits;
        },
    },

    // -----------------------------------------------------------------------
    // MARK: - Deflate

    deflate: {
        value: function DelfateStream_deflate(isFinal){
            if (this.level !== Deflate.Level.default){
                throw new DeflateError("Level %d compression is not supported.  Use level %d (default)", this.level, DeflateStream.Level.default);
            }
            if (this._input === null){
                throw Error("deflate() called without adding input");
            }
            if (this._state == DeflateStream.State.done){
                throw Error("deflate() called on completed stream");
            }
            if (this._output === null){
                throw Error("deflate() called without an output buffer");
            }
            if (this._output.offset >= this._output.bytes.length){
                throw Error("deflate() called with no room in the output buffer");
            }

            // Deflate algorithm suggested by https://tools.ietf.org/html/rfc1951
            // - for every three bytes of input, lookup in a hash table for previous instances
            // - find the longest matching instance within the allowable window size
            // - if no match, output the byte literal
            // - if match, repeat for the next input byte
            // - if the next input byte has a longer match, output the current input byte
            //   and then the <length,distance> for the next input byte to its match
            // - if the current input byte has a longer match, output the <length,distance> to its match
            if (this._deflateTable === null){
                this._deflateTable = {};
                this._deflateLocation = 0;
                // We'll never make another block, so declare this one as final
                // We're using the predefined standard huffman trees, type 0b01
                this._writeBits(0x3, 3);
            }
            var startingOffset = this._output.offset;
            var key1, key2;
            var hits;
            var hit, hit2;
            var hitLength;
            var i, l;
            var j, k;
            this._flushLeftoverWriteBits();
            while (this._output.offset < this._output.bytes.length && this._input.offset < this._input.bytes.length - 3){
                key1 = (this._input.bytes[this._input.offset] << 16) | (this._input.bytes[this._input.offset + 1] << 8) | (this._input.bytes[this._input.offset + 2]);
                hits = this._deflateTable[key1];
                hit = null;
                if (hits !== undefined){
                    for (i = 0, l = hits.length; i < l; ++i){
                        if (hits[i] > this._deflateLocation - this._window.bytes.length){
                            j = 0;
                            // FIXME:
                            // - if !isFinal and we reach the end of input, wait for more input
                            while (j < 258 && this._input.offset + j < this._input.bytes.length && this._window.peek(j) == this._input.bytes[this._input.offset + j]){

                            }
                            if (hit === null || j > hitLength){
                                hit = hits[i];
                                hitLength = j;
                            }
                        }
                    }
                }else{
                    this._deflateTable[key1] = hits = [];
                }
                hits.push(this._deflateLocation);
                if (hit !== null){
                    key2 = (this._input.bytes[this._input.offset + 1] << 16) | (this._input.bytes[this._input.offset + 2] << 8) | (this._input.bytes[this._input.offset + 3]);
                    hits = this._deflateTable[key2];
                    if (hits !== undefined){
                        for (i = 0, l = hits.length; i < l; ++i){
                            if (hits[i] > this._deflateLocation + 1 - this._window.bytes.length){
                                j = 0;
                                // FIXME:
                                // - if !isFinal and we reach the end of input, wait for more input
                                while (j < 258 && this._input.offset + j < this._input.bytes.length && this._window.peek(j) == this._input.bytes[this._input.offset + j]){

                                }
                                if (hit2 === null || j > hitLength){
                                    if (hit2 === null){
                                        // the hit from the second position is longer than the first,
                                        // so write the first byte as a literal and then write out the second
                                        this._writeStandardLiteralCode(this._input.bytes[this._input.offset]);
                                        this._window.overwrite(this._input.bytes[this._input.offset++]);
                                        ++this._deflateLocation;
                                        hits.push(this._deflateLocation);
                                    }
                                    hit2 = hits[i];
                                    hit = hit2;
                                    hitLength = j;
                                }
                            }
                        }
                    }
                    this._writeStandardLengthCode(hitLength);
                    this._writeStandardDistanceCode(this._deflateLocation - hit); // FIXME: could be hit or hit2
                    for (j = 0; j < hitLength; ++j){
                        this._window.overwrite(this._input.bytes[this._input.offset++]);
                    }
                }else{
                    this._writeStandardLiteralCode(this._input.bytes[this._input.offset]);
                    this._window.overwrite(this._input.bytes[this._input.offset++]);
                }
                ++this._deflateLocation;
            }

            if (isFinal){
                while (this._input.offset < this._input.bytes.length){

                }
                if (this._input.offset === this._input.bytes.length){
                    this._writeBits(0, 7); // end of block   
                }
            }else{
                // TODO: buffer remaining input?
                if (this._input.offset === this._input.bytes.length){
                    this._state = this._state = DeflateStream.State.needInput;
                }
            }

            // === Uncompressed blocks ===
            // if (this._deflateBlockBuffer === null){
            //     this._deflateBlockBuffer = new DeflateRingBuffer(JSData.initWithLength(0xFFFF + 5));
            //     this._deflateBlockBuffer.length = 5;
            // }
            // do {
            //     // Copy everything we can to the level 0 buffer.
            //     // We want to make the output block as long as possible, so we buffer input, which may come in
            //     // small pieces at a time.
            //     // If we can't buffer the entire input, that's no problem because we'll output everything, clear the
            //     // level 0 buffer, and continue looping
            //     while (this._input.offset < this._input.bytes.length && this._deflateBlockBuffer.length < this._deflateBlockBuffer.bytes.length){
            //         this._deflateBlockBuffer.bytes[this._deflateBlockBuffer.length++] = this._input.bytes[this._input.offset++];
            //     }
            //     if (isFinal || (this._deflateBlockBuffer.length == this._deflateBlockBuffer.bytes.length)){
            //         var length = this._deflateBlockBuffer.length - 5;
            //         this._deflateBlockBuffer.bytes[0] = (isFinal && this._input.offset == this._input.bytes.length) ? 1 : 0;
            //         this._deflateBlockBuffer.bytes[1] = length & 0xFF;
            //         this._deflateBlockBuffer.bytes[2] = (length >> 8) & 0xFF;
            //         this._deflateBlockBuffer.bytes[3] = ~length & 0xFF;
            //         this._deflateBlockBuffer.bytes[4] = (~length >> 8) & 0xFF;
            //         while (this._deflateBlockBuffer.offset < this._deflateBlockBuffer.length && this._output.offset < this._output.bytes.length){
            //             // this._writeBits(this._deflateBlockBuffer.bytes[this._deflateBlockBuffer.offset++], 8);
            //             this._output.bytes[this._output.offset++] = this._deflateBlockBuffer.bytes[this._deflateBlockBuffer.offset++];
            //         }
            //         if (this._deflateBlockBuffer.offset == this._deflateBlockBuffer.length){
            //             if (this._deflateBlockBuffer.bytes[0] & 0x01){
            //                 this._deflateBlockBuffer = null;
            //                 this._state = DeflateStream.State.done;
            //             }else{
            //                 this._deflateBlockBuffer.offset = 0;
            //                 this._deflateBlockBuffer.length = 5;
            //             }
            //         }else{
            //             if (isFinal){
            //                 break;
            //             }
            //             if (this._input.offset == this._input.bytes.length){
            //                 this._state = DeflateStream.State.needInput;
            //             }else{
            //                 break;
            //             }
            //         }
            //     }else{
            //         this._state = DeflateStream.State.needInput;
            //     }
            // }while (this._state == DeflateStream.State.processing);


            return this._output.offset - startingOffset;
        }
    },

    _deflateLocation: {writable: true, value: 0},
    _deflateTable: {writable: true, value: null},
    _deflateBlockBuffer: {writable: true, value: null},

    _writeBits: {
        value: function DeflateStream_writeBits(bits, n){
            if (this._output.offset == this._output.bytes.length){
                this._leftoverWriteBits |= (bits << this._leftoverWriteBitCount);
                this._leftoverWriteBitCount += n;
                if (this._leftoverWriteBitCount > 31){
                    throw new DeflateError("Write overflow (too many leftover bits");
                }
            }else{
                var success = this._output._writeBits(bits, n);
                if (!success){
                    var m = 8 - this._output.bitOffset;
                    this._output._writeBits(bits, m);
                    this._leftoverWriteBits |= ((bits >> m) << this._leftoverWriteBitCount);
                    this._leftoverWriteBitCount += n - m;
                }else{
                    this._leftoverWriteBitCount = 0;
                    this._leftoverWriteBits = 0;
                }
            }
        }
    },

    _leftoverWriteBits: {writable: true, value: 0},
    _leftoverWriteBitCount: {writable: true, value: 0},

    _flushLeftoverWriteBits: {
        value: function DeflateStream_flushLeftoverWriteBits(){
            if (this._leftoverWriteBitCount > 0){
                var bits = this._leftoverWriteBits;
                var count = this._leftoverWriteBitCount;
                this._leftoverWriteBitCount = 0;
                this._leftoverWriteBits = 0;
                while (count > 0){
                    this._writeBits(bits & 0xFF, Math.min(count, 8));
                    bits >>= 8;
                    count -= 8;
                }
            }
        }
    },

    _writeStandardLiteralCode: {
        value: function DeflateStream_writeStandardLiteralCode(literal){
            if (literal <= 143){
                this._writeBits(48 + 143 - literal, 8);
            }else if (literal <= 255){
                var bits = 400 + 255 - literal;
                this._writeBits(bits , 8);
                this._writeBits(bits & 0x1, 1);
            }
        }
    },

    _writeStandardLengthCode: {
        value: function DeflateStream_writeStandardLengthCode(length){
            // max 13 bits, what if we have leftover?
            if (length <= 10){

            }

        }
    },

    _writeStandardDistanceCode: {
        value: function DeflateStream_writeStandardDistanceCode(distance){
            // max 18 bits, what if we have leftover?
        }
    },

    // -----------------------------------------------------------------------
    // MARK: - Data window management

    _window: {writable: true, value: null},
    _windowCopyOffset: {writable: true, value: 0},
    _windowCopyLength: {writable: true, value: 0},

    _outputFromWindow: {
        value: function DeflateStream_outputFromWindow(distance, length){
            this._windowCopyOffset = (this._window.offset + this._window.length - distance) % this._window.bytes.length;
            this._windowCopyLength = length;
            this._outputRemainingFromWindow();
        }
    },

    _outputRemainingFromWindow: {
        value: function DeflateStream_outputRemainingFromWindow(){
            var b;
            while (this._windowCopyLength > 0 && this._output.offset < this._output.bytes.length){
                b = this._window.bytes[this._windowCopyOffset++];
                this._output.bytes[this._output.offset++] = b;
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
    processing: 1,
    done: 2
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

var DeflateBitStream = function(bytes){
    if (this === undefined){
        return new DeflateBitStream(bytes);
    }
    this.bytes = bytes;
    this.offset = 0;
    this.bitOffset = 0;
};

DeflateBitStream.prototype = Object.create({}, {

    _readBits: {
        value: function DeflateBitStream_readBits(n){
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
            }else if (this.offset < this.bytes.length - 1){
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

    _writeBits: {
        value: function DeflateBitStream_writeBits(bits, n){
            if (n > 8){
                throw new DeflateError("Can only write up to 8 bits at a time");
            }
            if (this.bitOffset + n <= 8){
                this.bytes[this.offset] |= (bits) << this.bitOffset;
                this.bitOffset += n;
                if (this.bitOffset === 8){
                    this.offset += 1;
                    this.bitOffset = 0;
                }
                return true;
            }
            if (this.offset < this.bytes.length - 1){
                this.bytes[this.offset] |= (bits) << this.bitOffset;
                this.offset += 1;
                this.bitOffset = (this.bitOffset + n) % 8;
                this.bytes[this.offset] = (bits >> (n - this.bitOffset));
                return true;
            }
            return false;
        }
    }

});

var DeflateRingBuffer = function(bytes, length){
    if (this === undefined){
        return new DeflateRingBuffer(bytes);
    }
    this.bytes = bytes;
    this.length = length || 0;
    this.offset = 0;
};

DeflateRingBuffer.prototype = Object.create({}, {

    peek: {
        value: function DeflateRingBuffer_peek(i){
            return this.bytes[(this.offset + i) % this.bytes.length];
        }
    },

    overwrite: {
        value: function DeflateRingStream_write(byte){
            this.bytes[(this.offset + this.length) % this.bytes.length] = byte;
            ++this.length;
            if (this.length > this.bytes.length){
                this.length = this.bytes.length;
                this.offset++;
                if (this.offset === this.bytes.length){
                    this.offset = 0;
                }
            }
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

var uncompressedHeader = JSData.initWithLength(4);

var UncompressedBlock = function(isFinal){
    this.isFinal = isFinal;
    this.headerRemaining = 4;
    this.remaining = 0;
    this.isDone = false;
};

UncompressedBlock.prototype = {
    inflate: function(stream){
        if (this.headerRemaining > 0){
            do{
                uncompressedHeader[4 - this.headerRemaining] = stream._input.bytes[stream._input.offset++];
                --this.headerRemaining;
            }while (this.headerRemaining > 0 && stream._input.offset < stream._input.bytes.length);
            if (this.headerRemaining === 0){
                this.remaining = (uncompressedHeader[1] << 8) | uncompressedHeader[0];
            }else{
                return;
            }
        }
        while (this.remaining > 0 && stream._input.offset < stream._input.bytes.length && stream._output.offset < stream._output.bytes.length){
            stream._output.bytes[stream._output.offset++] = stream._input.bytes[stream._input.offset++];
            stream._window.overwrite(stream._output.bytes[stream._output.offset]);
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
    this.code2 = null;
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

    inflate: function(stream){
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
                if (stream._output.offset == stream._output.bytes.length){
                    break;
                }
                stream._output.bytes[stream._output.offset++] = this.code;
                stream._window.overwrite(this.code);
            }else if (this.code > 256 && this.code <= 287){
                if (stream._output.offset == stream._output.bytes.length){
                    break;
                }
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
                stream._outputFromWindow(distance, length);
            }else{
                this.isDone = this.code == 256;
                if (!this.isDone){
                    throw new DeflateError("Invalid code: %d".sprintf(this.code));
                }
            }
            this.code = null;
            this.code2 = null;
            this.extra = null;
            this.extra2 = null;
            this.extra3 = null;
        }while (!this.isDone);
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
        value: function(stream){
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
                HuffmanBlock.prototype.inflate.call(this, stream);
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

    inflate: function(input){
        var stream = DeflateStream();
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
            length += stream.inflate();
        } while (length == output.length);
        return output.truncatedToLength(length);
    },

    deflate: function(input, level, info){
        var stream = DeflateStream(level, info);
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
            length += stream.deflate(true);
        } while (length == output.length);
        return output.truncatedToLength(length);
    }
};

Deflate.Level = {
    fastest: 0,
    fast: 1,
    default: 2,
    maximum: 3
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
    if (Error.captureStackTrace){
        Error.captureStackTrace(this, DeflateError);
    }
}

DeflateError.prototype = Object.create(Error.prototype);

})();