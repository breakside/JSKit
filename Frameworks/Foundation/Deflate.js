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
// #import "Error+JS.js"
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
            if (this._output.offset >= this._output.capacity){
                throw Error("inflate() called with no room in the output buffer");
            }
            var startingOffset = this._output.offset;
            this._outputRemainingFromWindow();
            var isDone = false;
            while (!isDone && this._input.offset < this._input.capacity && this._output.offset < this._output.capacity){
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
            }else if (this._input.offset == this._input.capacity){
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
            if (this._input.offset == this._input.capacity){
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
            if (this._output.offset >= this._output.capacity){
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
            var startingOffset = this._output.offset;
            var a, b, c;
            var key;
            var hits;
            var hit;
            var hitLength;
            var longestHitLength;
            var hitIndex;
            var windowIndex;
            var minimumHit;
            // PERFORMANCE update: always consider a hit of length 3 to be 
            // long enough, so we never inspect the next input byte, but leave
            // the code so we can adjust later if other optimizations are found
            var longEnoughHitLength = 3;
            if (this._deflateInputBuffer === null){
                this._deflateInputBuffer = DeflateRingBuffer(JSData.initWithLength(258));
            }
            if (this._deflateTable === null){
                this._deflateTable = {};
                this._deflateLocation = 0;
                // We'll never make another block, so declare this one as final
                // We're using the predefined standard huffman trees, type 0b01
                this._writeBits(0x3, 3);
            }
            this._flushLeftoverWriteBits();

            // Loop while we're processing input and can output some bits
            while (this._state === DeflateStream.State.processing && !this._deflateBlockEndWritten && this._output.offset < this._output.capacity){
                // Fill the input buffer as much as we can
                while (this._deflateInputBuffer.length < this._deflateInputBuffer.capacity && this._input.offset < this._input.capacity){
                    this._deflateInputBuffer.writeByte(this._input.bytes[this._input.offset++]);
                }
                // Proceed only if we have a full input buffer (or are handling the final input)
                if (isFinal || this._deflateInputBuffer.length === this._deflateInputBuffer.capacity){
                    if (this._deflateInputBuffer.length > 0){
                        hit = null;
                        minimumHit = this._deflateLocation - this._window.capacity;
                        a = this._deflateInputBuffer.peekByte(0);
                        if (this._deflateInputBuffer.length > 2){
                            // if we have at least three bytes of input, see if
                            // there's a hit in our hash table
                            b = this._deflateInputBuffer.peekByte(1);
                            c = this._deflateInputBuffer.peekByte(2);
                            key = (a << 16) | (b << 8) | (c);
                            hits = this._deflateTable[key];
                            if (hits !== undefined){
                                // If there's a list of hits, find the longest one
                                // starting with the most recent and stopping when
                                // we're out of the window's range
                                longestHitLength = 0;
                                for (hitIndex = hits.length - 1; hitIndex >= 0 && hits[hitIndex] > minimumHit; --hitIndex){
                                    hitLength = 3;
                                    windowIndex = this._window.length - (this._deflateLocation - hits[hitIndex]) + hitLength;
                                    while (hitLength < this._deflateInputBuffer.length){
                                        if (windowIndex < this._window.length){
                                            if (this._window.peekByte(windowIndex) === this._deflateInputBuffer.peekByte(hitLength)){
                                                ++windowIndex;
                                                ++hitLength;
                                            }else{
                                                break;
                                            }
                                        }else if (windowIndex - this._window.length < this._deflateInputBuffer.length){
                                            // If we've reached the end of the window, we can continue into the very input we're processing
                                            if (this._deflateInputBuffer.peekByte(windowIndex - this._window.length) === this._deflateInputBuffer.peekByte(hitLength)){
                                                ++windowIndex;
                                                ++hitLength;
                                            }else{
                                                break;
                                            }
                                        }else{
                                            break;
                                        }
                                    }
                                    if (hitLength > longestHitLength){
                                        longestHitLength = hitLength;
                                        hit = hits[hitIndex];
                                    }
                                    break;
                                }
                            }else{
                                this._deflateTable[key] = hits = [0];
                            }
                            // PERFORMANCE update: only keep the most recent hit
                            // so we just consider the most recent hit, but
                            // keep the loop coded as-is in case we can optimize
                            // for further lookback down the line.
                            hits[0] = this._deflateLocation;
                            // hits.push(this._deflateLocation);
                        }
                        // check to see if the next input byte will have a longer hit
                        if (hit !== null && longestHitLength < longEnoughHitLength && this._deflateInputBuffer.length > 3){
                            minimumHit = this._deflateLocation + 1 - this._window.capacity;
                            a = b;
                            b = c;
                            c = this._deflateInputBuffer.peekByte(3);
                            key = (a << 16) | (b << 8) | (c);
                            hits = this._deflateTable[key];
                            if (hits !== undefined){
                                for (hitIndex = hits.length - 1; hitIndex >= 0 && hits[hitIndex] > minimumHit; ++hitIndex){
                                    hitLength = 3;
                                    windowIndex = this._window.length - (this._deflateLocation + 1 - hits[hitIndex]) + hitLength;
                                    while (hitLength < this._deflateInputBuffer.length - 1){
                                        if (windowIndex < this._window.length){
                                            if (this._window.peekByte(windowIndex) === this._deflateInputBuffer.peekByte(hitLength + 1)){
                                                ++windowIndex;
                                                ++hitLength;
                                            }else{
                                                break;
                                            }
                                        }else if (windowIndex - this._window.length < this._deflateInputBuffer.length){
                                            // If we've hit the end of the window, we can continue into the very input we're processing
                                            if (this._deflateInputBuffer.peekByte(windowIndex - this._window.length) === this._deflateInputBuffer.peekByte(hitLength + 1)){
                                                ++windowIndex;
                                                ++hitLength;
                                            }else{
                                                break;
                                            }
                                        }else{
                                            break;
                                        }
                                    }
                                    if (hitLength > longestHitLength){
                                        // If the next input byte has a longer
                                        // hit, clear the hit for the current
                                        // input byte in order to force a literal
                                        // byte output.  We'll output the next
                                        // byte on the next interation through
                                        // the loop.
                                        hit = null;
                                        break;
                                    }
                                }
                            }
                        }
                        if (hit !== null){
                            this._writeStandardLengthCode(longestHitLength);
                            this._writeStandardDistanceCode(this._deflateLocation - hit);
                            for (c = 0; c < longestHitLength; ++c){
                                a = this._deflateInputBuffer.readByte();
                                this._window.writeByte(a);
                                ++this._deflateLocation;
                            }
                        }else{
                            a = this._deflateInputBuffer.readByte();
                            this._writeStandardLiteralCode(a);
                            this._window.writeByte(a);
                            ++this._deflateLocation;
                        }
                    }
                    if (isFinal && this._deflateInputBuffer.length === 0 && this._input.offset === this._input.capacity){
                        if (this._output.offset < this._output.capacity){
                            this._writeHuffmanCode(0, 7); // end of block
                            this._deflateBlockEndWritten = true;
                        }
                    }
                }else{
                    this._state = DeflateStream.State.needInput;
                }
            }

            if (this._deflateBlockEndWritten && this._leftoverWriteBitCount === 0){
                // Round up to the final full byte if we're all done writing
                if (this._output.offset < this._output.capacity && this._output.bitOffset > 0){
                    ++this._output.offset;
                    this._output.bitOffset = 0;
                }
                // finish only after we've written all the output
                if (this._output.offset < this._output.capacity){
                    this._state = DeflateStream.State.done;
                }
            }

            // === Uncompressed blocks ===
        //     var startingOffset = this._output.offset;
        //     if (this._deflateOutputBuffer === null){
        //         this._deflateOutputBuffer = new DeflateRingBuffer(JSData.initWithLength(0xFFFF + 5));
        //         this._deflateOutputBuffer.length = 5;
        //     }
        //     do {
        //         // Copy everything we can to the level 0 buffer.
        //         // We want to make the output block as long as possible, so we buffer input, which may come in
        //         // small pieces at a time.
        //         // If we can't buffer the entire input, that's no problem because we'll output everything, clear the
        //         // level 0 buffer, and continue looping
        //         while (this._input.offset < this._input.capacity && this._deflateOutputBuffer.length < this._deflateOutputBuffer.capacity){
        //             this._deflateOutputBuffer.bytes[this._deflateOutputBuffer.length++] = this._input.bytes[this._input.offset++];
        //         }
        //         if (isFinal || (this._deflateOutputBuffer.length == this._deflateOutputBuffer.capacity)){
        //             var length = this._deflateOutputBuffer.length - 5;
        //             this._deflateOutputBuffer.bytes[0] = (isFinal && this._input.offset == this._input.capacity) ? 1 : 0;
        //             this._deflateOutputBuffer.bytes[1] = length & 0xFF;
        //             this._deflateOutputBuffer.bytes[2] = (length >> 8) & 0xFF;
        //             this._deflateOutputBuffer.bytes[3] = ~length & 0xFF;
        //             this._deflateOutputBuffer.bytes[4] = (~length >> 8) & 0xFF;
        //             while (this._deflateOutputBuffer.offset < this._deflateOutputBuffer.length && this._output.offset < this._output.capacity){
        //                 // this._writeBits(this._deflateOutputBuffer.bytes[this._deflateOutputBuffer.offset++], 8);
        //                 this._output.bytes[this._output.offset++] = this._deflateOutputBuffer.bytes[this._deflateOutputBuffer.offset++];
        //             }
        //             if (this._deflateOutputBuffer.offset == this._deflateOutputBuffer.length){
        //                 if (this._deflateOutputBuffer.bytes[0] & 0x01){
        //                     this._deflateOutputBuffer = null;
        //                     this._state = DeflateStream.State.done;
        //                 }else{
        //                     this._deflateOutputBuffer.offset = 0;
        //                     this._deflateOutputBuffer.length = 5;
        //                 }
        //             }else{
        //                 if (isFinal){
        //                     break;
        //                 }
        //                 if (this._input.offset == this._input.capacity){
        //                     this._state = DeflateStream.State.needInput;
        //                 }else{
        //                     break;
        //                 }
        //             }
        //         }else{
        //             this._state = DeflateStream.State.needInput;
        //         }
        //     }while (this._state == DeflateStream.State.processing);


            return this._output.offset - startingOffset;
        }
    },

    _deflateLocation: {writable: true, value: 0},
    _deflateTable: {writable: true, value: null},
    _deflateOutputBuffer: {writable: true, value: null},
    _deflateInputBuffer: {writable: true, value: null},
    _deflateBlockEndWritten: {writable: true, value: false},

    _writeBits: {
        value: function DeflateStream_writeBits(bits, n){
            if (this._output.offset == this._output.capacity){
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
                this._writeHuffmanCode(48 + literal, 8);
            }else if (literal <= 255){
                this._writeHuffmanCode(400 + literal - 144, 9);
            }else{
                throw new Error("Cannot write literal > 255");
            }
        }
    },

    _writeStandardLengthCode: {
        value: function DeflateStream_writeStandardLengthCode(length){
            if (length < 3){
                throw new Error("Cannot write length < 3");
            }
            var code;
            var extra;
            var extraCount;
            if (length <= 114){
                if (length <= 10){
                    code = 254 + length;
                    extraCount = 0;
                }else if (length <= 12){
                    code = 265;
                    extraCount = 1;
                    extra = length - 11;
                }else if (length <= 14){
                    code = 266;
                    extraCount = 1;
                    extra = length - 13;
                }else if (length <= 16){
                    code = 267;
                    extraCount = 1;
                    extra = length - 15;
                }else if (length <= 18){
                    code = 268;
                    extraCount = 1;
                    extra = length - 17;
                }else if (length <= 22){
                    code = 269;
                    extraCount = 2;
                    extra = length - 19;
                }else if (length <= 26){
                    code = 270;
                    extraCount = 2;
                    extra = length - 23;
                }else if (length <= 30){
                    code = 271;
                    extraCount = 2;
                    extra = length - 27;
                }else if (length <= 34){
                    code = 272;
                    extraCount = 2;
                    extra = length - 31;
                }else if (length <= 42){
                    code = 273;
                    extraCount = 3;
                    extra = length - 35;
                }else if (length <= 50){
                    code = 274;
                    extraCount = 3;
                    extra = length - 43;
                }else if (length <= 58){
                    code = 275;
                    extraCount = 3;
                    extra = length - 51;
                }else if (length <= 66){
                    code = 276;
                    extraCount = 3;
                    extra = length - 59;
                }else if (length <= 82){
                    code = 277;
                    extraCount = 4;
                    extra = length - 67;
                }else if (length <= 98){
                    code = 278;
                    extraCount = 4;
                    extra = length - 83;
                }else{
                    code = 279;
                    extraCount = 4;
                    extra = length - 99;
                }
                this._writeHuffmanCode(0 + code - 256, 7);
                if (extraCount > 0){
                    this._writeBits(extra, extraCount);
                }
            }else if (length <= 258){
                if (length <= 130){
                    code = 280;
                    extraCount = 4;
                    extra = length - 115;
                }else if (length <= 162){
                    code = 281;
                    extraCount = 5;
                    extra = length - 131;
                }else if (length <= 194){
                    code = 282;
                    extraCount = 5;
                    extra = length - 163;
                }else if (length <= 226){
                    code = 283;
                    extraCount = 5;
                    extra = length - 195;
                }else if (length <= 257){
                    code = 284;
                    extraCount = 5;
                    extra = length - 227;
                }else{
                    code = 285;
                    extraCount = 0;
                }
                this._writeHuffmanCode(192 + code - 280, 8);
                if (extraCount > 0){
                    this._writeBits(extra, extraCount);
                }
            }else{
                throw new DeflateError("Cannot write length > 258");
            }
        }
    },

    _writeStandardDistanceCode: {
        value: function DeflateStream_writeStandardDistanceCode(distance){
            var code;
            var extra;
            var extraCount;
            if (distance <= 4){
                code = distance - 1;
                extraCount = 0;
            }else if (distance <= 6){
                code = 4;
                extraCount = 1;
                extra = distance - 5;
            }else if (distance <= 8){
                code = 5;
                extraCount = 1;
                extra = distance - 7;
            }else if (distance <= 12){
                code = 6;
                extraCount = 2;
                extra = distance - 9;
            }else if (distance <= 16){
                code = 7;
                extraCount = 2;
                extra = distance - 13;
            }else if (distance <= 24){
                code = 8;
                extraCount = 3;
                extra = distance - 17;
            }else if (distance <= 32){
                code = 9;
                extraCount = 3;
                extra = distance - 25;
            }else if (distance <= 48){
                code = 10;
                extraCount = 4;
                extra = distance - 33;
            }else if (distance <= 64){
                code = 11;
                extraCount = 4;
                extra = distance - 49;
            }else if (distance <= 96){
                code = 12;
                extraCount = 5;
                extra = distance - 65;
            }else if (distance <= 128){
                code = 13;
                extraCount = 5;
                extra = distance - 97;
            }else if (distance <= 192){
                code = 14;
                extraCount = 6;
                extra = distance - 129;
            }else if (distance <= 256){
                code = 15;
                extraCount = 6;
                extra = distance - 193;
            }else if (distance <= 384){
                code = 16;
                extraCount = 7;
                extra = distance - 257;
            }else if (distance <= 512){
                code = 17;
                extraCount = 7;
                extra = distance - 385;
            }else if (distance <= 768){
                code = 18;
                extraCount = 8;
                extra = distance - 513;
            }else if (distance <= 1024){
                code = 19;
                extraCount = 8;
                extra = distance - 769;
            }else if (distance <= 1536){
                code = 20;
                extraCount = 9;
                extra = distance - 1025;
            }else if (distance <= 2048){
                code = 21;
                extraCount = 9;
                extra = distance - 1537;
            }else if (distance <= 3072){
                code = 22;
                extraCount = 10;
                extra = distance - 2049;
            }else if (distance <= 4096){
                code = 23;
                extraCount = 10;
                extra = distance - 3073;
            }else if (distance <= 6144){
                code = 24;
                extraCount = 11;
                extra = distance - 4097;
            }else if (distance <= 8192){
                code = 25;
                extraCount = 11;
                extra = distance - 6145;
            }else if (distance <= 12288){
                code = 26;
                extraCount = 12;
                extra = distance - 8193;
            }else if (distance <= 16384){
                code = 27;
                extraCount = 12;
                extra = distance - 12289;
            }else if (distance <= 24576){
                code = 28;
                extraCount = 13;
                extra = distance - 16385;
            }else if (distance <= 32768){
                code = 29;
                extraCount = 13;
                extra = distance - 24577;
            }else{
                throw new DeflateError("Cannot write distance > 32K");
            }
            this._writeHuffmanCode(0 + code - 256, 5);
            if (extraCount > 8){
                this._writeBits(extra & 0xFF, 8);
                extra >>= 8;
                extraCount -= 8;
            }
            if (extraCount > 0){
                this._writeBits(extra, extraCount);
            }
        }
    },

    _writeHuffmanCode: {
        value: function DeflateStream_writeHuffmanCode(bits, n){
            n -= 1;
            while (n >= 0){
                this._writeBits((bits >> n) & 0x01, 1);
                --n;
            }
        }
    },

    // -----------------------------------------------------------------------
    // MARK: - Data window management

    _window: {writable: true, value: null},
    _windowCopyOffset: {writable: true, value: 0},
    _windowCopyLength: {writable: true, value: 0},

    _outputFromWindow: {
        value: function DeflateStream_outputFromWindow(distance, length){
            this._windowCopyOffset = (this._window.offset + this._window.length - distance) % this._window.capacity;
            this._windowCopyLength = length;
            this._outputRemainingFromWindow();
        }
    },

    _outputRemainingFromWindow: {
        value: function DeflateStream_outputRemainingFromWindow(){
            var b;
            while (this._windowCopyLength > 0 && this._output.offset < this._output.capacity){
                b = this._window.bytes[this._windowCopyOffset++];
                this._output.bytes[this._output.offset++] = b;
                this._window.writeByte(b);
                --this._windowCopyLength;
                if (this._windowCopyOffset == this._window.capacity){
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
    this.capacity = bytes.length;
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
            }else if (this.offset < this.capacity - 1){
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
            if (this.bitOffset === 0){
                this.bytes[this.offset] = 0;
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
            if (this.offset < this.capacity - 1){
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
    this.capacity = bytes.length;
};

DeflateRingBuffer.prototype = Object.create({}, {

    peekByte: {
        value: function DeflateRingBuffer_peekByte(i){
            if (this.offset + i < this.capacity){
                return this.bytes[this.offset + i];
            }
            return this.bytes[this.offset + i - this.capacity];
        }
    },

    readByte: {
        value: function DeflateRingBuffer_readByte(){
            if (this.length === 0){
                throw new DeflateError("Cannot read from empty buffer");
            }
            var b = this.bytes[this.offset];
            --this.length;
            ++this.offset;
            if (this.offset === this.capacity){
                this.offset = 0;
            }
            return b;
        }
    },

    writeByte: {
        value: function DeflateRingStream_writeByte(byte){
            if (this.offset + this.length < this.capacity){
                this.bytes[this.offset + this.length] = byte;   
            }else{
                this.bytes[this.offset + this.length - this.capacity] = byte;
            }
            ++this.length;
            if (this.length > this.capacity){
                this.length = this.capacity;
                this.offset++;
                if (this.offset === this.capacity){
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
            }while (this.headerRemaining > 0 && stream._input.offset < stream._input.capacity);
            if (this.headerRemaining === 0){
                this.remaining = (uncompressedHeader[1] << 8) | uncompressedHeader[0];
            }else{
                return;
            }
        }
        while (this.remaining > 0 && stream._input.offset < stream._input.capacity && stream._output.offset < stream._output.capacity){
            stream._output.bytes[stream._output.offset++] = stream._input.bytes[stream._input.offset++];
            stream._window.writeByte(stream._output.bytes[stream._output.offset]);
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
                if (stream._output.offset == stream._output.capacity){
                    break;
                }
                stream._output.bytes[stream._output.offset++] = this.code;
                stream._window.writeByte(this.code);
            }else if (this.code > 256 && this.code <= 287){
                if (stream._output.offset == stream._output.capacity){
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
    Error.captureStackTrace(this, DeflateError);
}

DeflateError.prototype = Object.create(Error.prototype);

})();