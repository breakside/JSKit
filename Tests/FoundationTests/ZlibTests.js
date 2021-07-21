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
// #import TestKit
'use strict';

JSClass("ZlibTests", TKTestSuite, {

    _testCompressUncompressed: function(){
        var uncompressed = "this is a test".utf8();
        var output = Zlib.compress(uncompressed);
        TKAssertObjectEquals(output, [0x78,0x9C,0x01,0x0e,0x00,0xf1,0xff,0x74,0x68,0x69,0x73,0x20,0x69,0x73,0x20,0x61,0x20,0x74,0x65,0x73,0x74,0x26,0x33,0x05,0x16]);

        TKAssertThrows(function(){ Zlib.compress(uncompressed, 0); });
        TKAssertThrows(function(){ Zlib.compress(uncompressed, 1); });
        Zlib.compress(uncompressed, 2);
        TKAssertThrows(function(){ Zlib.compress(uncompressed, 3); });
    },

    _testCompressUncompressedInChunks: function(){
        // All input, limited output
        var stream = new ZlibStream();
        stream.input = "this is a test".utf8();
        stream.output = JSData.initWithLength(4);
        var length = stream.compress(true);
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(length, 4);
        TKAssertObjectEquals(stream.output, [0x78,0x9C,0x01,0x0e]);
        stream.outputOffset = 0;
        length = stream.compress(true);
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(length, 4);
        TKAssertObjectEquals(stream.output, [0x00,0xf1,0xff,0x74]);
        stream.outputOffset = 0;
        length = stream.compress(true);
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(length, 4);
        TKAssertObjectEquals(stream.output, [0x68,0x69,0x73,0x20]);
        stream.outputOffset = 0;
        length = stream.compress(true);
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(length, 4);
        TKAssertObjectEquals(stream.output, [0x69,0x73,0x20,0x61]);
        stream.outputOffset = 0;
        length = stream.compress(true);
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(length, 4);
        TKAssertObjectEquals(stream.output, [0x20,0x74,0x65,0x73]);
        stream.outputOffset = 0;
        length = stream.compress(true);
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(length, 4);
        TKAssertObjectEquals(stream.output, [0x74,0x26,0x33,0x05]);
        stream.outputOffset = 0;
        length = stream.compress(true);
        TKAssertEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(length, 1);
        TKAssertObjectEquals(stream.output.subdataInRange(JSRange(0, 1)), [0x16]);

        // Limited input, plenty of output
        stream = new ZlibStream();
        var fullInput = "this is a test".utf8();
        stream.input = new Uint8Array(fullInput.buffer, 0, 2);
        stream.output = JSData.initWithLength(32);
        length = stream.compress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(length, 2);
        TKAssertObjectEquals(stream.output.subdataInRange(JSRange(0, 2)), [0x78,0x9C]);
        stream.input = new Uint8Array(fullInput.buffer, 2, 3);
        length = stream.compress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(length, 0);
        stream.input = new Uint8Array(fullInput.buffer, 5, 4);
        length = stream.compress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(length, 0);
        stream.input = new Uint8Array(fullInput.buffer, 9, 5);
        length = stream.compress(true);
        TKAssertEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(length, 23);
        TKAssertObjectEquals(stream.output.subdataInRange(JSRange(2, 23)), [0x01,0x0e,0x00,0xf1,0xff,0x74,0x68,0x69,0x73,0x20,0x69,0x73,0x20,0x61,0x20,0x74,0x65,0x73,0x74,0x26,0x33,0x05,0x16]);
    },

    testUncompressLevel0: function(){
        var compressed = new Uint8Array([0x78,0x01,0x00,0x0e,0x00,0xf1,0xff,0x74,0x68,0x69,0x73,0x20,0x69,0x73,0x20,0x61,0x20,0x74,0x65,0x73,0x74,0x00,0x00,0x00,0xff,0xff,0x01,0x00,0x00,0xff,0xff,0x26,0x33,0x05,0x16]);
        var uncompressed = Zlib.uncompress(compressed);
        TKAssertEquals(uncompressed.stringByDecodingUTF8(), 'this is a test');

        compressed = new Uint8Array([0x78,0x01,0x01,0x0e,0x00,0xf1,0xff,0x74,0x68,0x69,0x73,0x20,0x69,0x73,0x20,0x61,0x20,0x74,0x65,0x73,0x74,0x26,0x33,0x05,0x16]);
        uncompressed = Zlib.uncompress(compressed);
        TKAssertEquals(uncompressed.stringByDecodingUTF8(), 'this is a test');
    },

    testUncompressLevel1: function(){
        var compressed = new Uint8Array([0x78,0x9c,0x2b,0xc9,0xc8,0x2c,0x56,0xc8,0x2c,0x56,0x48,0x54,0x28,0x49,0x2d,0x2e,0x01,0x00,0x26,0x33,0x05,0x16]);
        var uncompressed = Zlib.uncompress(compressed);
        TKAssertEquals(uncompressed.stringByDecodingUTF8(), 'this is a test');
    },

    testUncompressLevel2: function(){
        var compressed = new Uint8Array([0x78,0x01,0x05,0xc1,0xb1,0x0d,0x00,0x00,0x08,0xc3,0xb0,0x57,0xfa,0x1a,0x03,0x12,0x9d,0x93,0xff,0x85,0xed,0x95,0x94,0x4c,0x5c,0xf4,0x4a,0x4a,0x26,0x2e,0x7a,0x25,0x25,0x13,0x17,0x1f,0x48,0x1a,0x0f,0x40]);
        var uncompressed = Zlib.uncompress(compressed);
        TKAssertEquals(uncompressed.stringByDecodingUTF8(), 'this is a testthis is a testthis is a test');

        compressed = new Uint8Array([0x78,0x01,0x63,0x60,0x64,0x62,0x66,0x61,0x65,0x63,0xe7,0xe0,0xe4,0xe2,0xe6,0xe1,0xe5,0xe3,0x17,0x10,0x14,0x12,0x16,0x11,0x15,0x13,0x97,0x90,0x04,0x00,0x0b,0x87,0x01,0x46]);
        uncompressed = Zlib.uncompress(compressed);
        TKAssertObjectEquals(uncompressed, [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25]);

        compressed = new Uint8Array([0x78,0x01,0x05,0xc1,0x85,0x01,0x00,0x20,0x08,0x00,0x30,0x31,0xc0,0x0e,0x2c,0xfc,0xff,0x51,0x37,0x05,0xda,0x58,0x87,0xe4,0x43,0x4c,0xb9,0xd4,0xd6,0x07,0xcf,0xb5,0xcf,0x95,0xa7,0x40,0x1b,0xeb,0x90,0x7c,0x88,0x29,0x97,0xda,0xfa,0xe0,0xb9,0xf6,0xb9,0xf2,0x14,0x68,0x63,0x1d,0x92,0x0f,0x31,0xe5,0x52,0x5b,0x1f,0x3c,0xd7,0x3e,0x57,0x9e,0x02,0x6d,0xac,0x43,0xf2,0x21,0xa6,0x5c,0x6a,0xeb,0x83,0xe7,0xda,0xe7,0xca,0xfb,0xf4,0x28,0x05,0x15]);
        uncompressed = Zlib.uncompress(compressed);
        TKAssertObjectEquals(uncompressed, [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25]);
    },

    testChunkedUncompressLevel0: function(){
        // All input up front, limited output space, empty blocks
        var stream = ZlibStream();
        stream.input = new Uint8Array([0x78,0x01,0x00,0x0e,0x00,0xf1,0xff,0x74,0x68,0x69,0x73,0x20,0x69,0x73,0x20,0x61,0x20,0x74,0x65,0x73,0x74,0x00,0x00,0x00,0xff,0xff,0x01,0x00,0x00,0xff,0xff,0x26,0x33,0x05,0x16]);
        stream.output = JSData.initWithLength(4);
        var length = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(length, 4);
        TKAssertEquals(stream.output.subdataInRange(JSRange(0, 4)).stringByDecodingUTF8(), 'this');
        stream.outputOffset = 0;
        length = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(length, 4);
        TKAssertEquals(stream.output.subdataInRange(JSRange(0, 4)).stringByDecodingUTF8(), ' is ');
        stream.outputOffset = 0;
        length = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(length, 4);
        TKAssertEquals(stream.output.subdataInRange(JSRange(0, 4)).stringByDecodingUTF8(), 'a te');
        stream.outputOffset = 0;
        length = stream.uncompress();
        TKAssertEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(length, 2);
        TKAssertEquals(stream.output.subdataInRange(JSRange(0, 2)).stringByDecodingUTF8(), 'st');

        // All input up front, limited output space, single block
        stream = ZlibStream();
        stream.input = new Uint8Array([0x78,0x01,0x01,0x0e,0x00,0xf1,0xff,0x74,0x68,0x69,0x73,0x20,0x69,0x73,0x20,0x61,0x20,0x74,0x65,0x73,0x74,0x26,0x33,0x05,0x16]);
        stream.output = JSData.initWithLength(4);
        length = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(length, 4);
        TKAssertEquals(stream.output.subdataInRange(JSRange(0, 4)).stringByDecodingUTF8(), 'this');
        stream.outputOffset = 0;
        length = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(length, 4);
        TKAssertEquals(stream.output.subdataInRange(JSRange(0, 4)).stringByDecodingUTF8(), ' is ');
        stream.outputOffset = 0;
        length = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(length, 4);
        TKAssertEquals(stream.output.subdataInRange(JSRange(0, 4)).stringByDecodingUTF8(), 'a te');
        stream.outputOffset = 0;
        length = stream.uncompress();
        TKAssertEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(length, 2);
        TKAssertEquals(stream.output.subdataInRange(JSRange(0, 2)).stringByDecodingUTF8(), 'st');

        // Chunked input, unlimited outputspace, single block
        stream = ZlibStream();
        stream.output = JSData.initWithLength(32);
        stream.input = new Uint8Array([0x78]);
        length = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(length, 0);
        stream.input = new Uint8Array([0x01]);
        length = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(length, 0);
        stream.input = new Uint8Array([0x01]);
        length = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(length, 0);
        stream.input = new Uint8Array([0x0e,0x00]);
        length = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(length, 0);
        stream.input = new Uint8Array([0xf1,0xff,0x74]);
        length = stream.uncompress();
        TKAssertEquals(length, 1);
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(stream.output.subdataInRange(JSRange(0, 1)).stringByDecodingUTF8(), "t");
        stream.input = new Uint8Array([0x68,0x69,0x73,0x20,0x69,0x73,0x20]);
        length = stream.uncompress();
        TKAssertEquals(length, 7);
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(stream.output.subdataInRange(JSRange(1, 7)).stringByDecodingUTF8(), "his is ");
        stream.input = new Uint8Array([0x61,0x20,0x74]);
        length = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(length, 3);
        TKAssertEquals(stream.output.subdataInRange(JSRange(8, 3)).stringByDecodingUTF8(), "a t");
        stream.input = new Uint8Array([0x65]);
        length = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(length, 1);
        TKAssertEquals(stream.output.subdataInRange(JSRange(11, 1)).stringByDecodingUTF8(), "e");
        stream.input = new Uint8Array([0x73,0x74]);
        length = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(length, 2);
        TKAssertEquals(stream.output.subdataInRange(JSRange(12, 2)).stringByDecodingUTF8(), "st");
        stream.input = new Uint8Array([0x26,0x33]);
        length = stream.uncompress();
        TKAssertEquals(length, 0);
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        stream.input = new Uint8Array([0x05]);
        length = stream.uncompress();
        TKAssertEquals(length, 0);
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        stream.input = new Uint8Array([0x16]);
        length = stream.uncompress();
        TKAssertEquals(length, 0);
        TKAssertEquals(stream.state, ZlibStream.State.done);

        // Chunked input, limited outputspace, single block
        stream = ZlibStream();
        stream.output = JSData.initWithLength(4);
        stream.input = new Uint8Array([0x78, 0x01]);
        length = stream.uncompress();
        TKAssertEquals(length, 0);
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        stream.input = new Uint8Array([0x01]);
        length = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(length, 0);
        stream.input = new Uint8Array([0x0e,0x00]);
        length = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(length, 0);
        stream.input = new Uint8Array([0xf1,0xff,0x74]);
        length = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(length, 1);
        TKAssertEquals(stream.output.subdataInRange(JSRange(0, 1)).stringByDecodingUTF8(), "t");
        stream.input = new Uint8Array([0x68,0x69,0x73,0x20,0x69,0x73,0x20]);
        stream.outputOffset = 0;
        length = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(length, 4);
        TKAssertEquals(stream.output.subdataInRange(JSRange(0, 4)).stringByDecodingUTF8(), "his ");
        stream.outputOffset = 0;
        length = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(length, 3);
        TKAssertEquals(stream.output.subdataInRange(JSRange(0, 3)).stringByDecodingUTF8(), "is ");
        stream.input = new Uint8Array([0x61,0x20,0x74]);
        stream.outputOffset = 0;
        length = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(length, 3);
        TKAssertEquals(stream.output.subdataInRange(JSRange(0, 3)).stringByDecodingUTF8(), "a t");
        stream.input = new Uint8Array([0x65]);
        stream.outputOffset = 0;
        length = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(length, 1);
        TKAssertEquals(stream.output.subdataInRange(JSRange(0, 1)).stringByDecodingUTF8(), "e");
        stream.input = new Uint8Array([0x73,0x74,0x26,0x33]);
        stream.outputOffset = 0;
        length = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(length, 2);
        TKAssertEquals(stream.output.subdataInRange(JSRange(0, 2)).stringByDecodingUTF8(), "st");
        stream.input = new Uint8Array([0x05,0x16]);
        stream.outputOffset = 0;
        length = stream.uncompress();
        TKAssertEquals(length, 0);
        TKAssertEquals(stream.state, ZlibStream.State.done);
    },

    testChunkedUncompressLevel2: function(){
        // All input up front, limited output space
        var stream = ZlibStream();
        stream.input = new Uint8Array([0x78,0x01,0x05,0xc1,0xb1,0x0d,0x00,0x00,0x08,0xc3,0xb0,0x57,0xfa,0x1a,0x03,0x12,0x9d,0x93,0xff,0x85,0xed,0x95,0x94,0x4c,0x5c,0xf4,0x4a,0x4a,0x26,0x2e,0x7a,0x25,0x25,0x13,0x17,0x1f,0x48,0x1a,0x0f,0x40]);
        stream.output = JSData.initWithLength(20);
        var length = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(length, 20);
        TKAssertEquals(stream.output.subdataInRange(JSRange(0, 20)).stringByDecodingUTF8(), 'this is a testthis i');
        stream.outputOffset = 0;
        length = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(length, 20);
        TKAssertEquals(stream.output.subdataInRange(JSRange(0, 20)).stringByDecodingUTF8(), 's a testthis is a te');
        stream.outputOffset = 0;
        length = stream.uncompress();
        TKAssertEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(length, 2);
        TKAssertEquals(stream.output.subdataInRange(JSRange(0, 2)).stringByDecodingUTF8(), 'st');

        // Input in chunks
        stream = ZlibStream();
        stream.input = new Uint8Array([0x78]);
        stream.output = JSData.initWithLength(50);
        length = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        stream.input = new Uint8Array([0x01]);
        stream.output = JSData.initWithLength(50);
        length = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        stream.input = new Uint8Array([0x05]);
        stream.output = JSData.initWithLength(50);
        length = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        stream.input = new Uint8Array([0xc1]);
        length = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        stream.input = new Uint8Array([0xb1]);
        length = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        stream.input = new Uint8Array([0x0d,0x00]);
        length = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        stream.input = new Uint8Array([0x00,0x08,0xc3,0xb0,0x57]);
        length = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        stream.input = new Uint8Array([0xfa,0x1a,0x03,0x12,0x9d,0x93,0xff,0x85]);
        length = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        stream.input = new Uint8Array([0xed,0x95,0x94,0x4c,0x5c,0xf4,0x4a,0x4a,0x26,0x2e,0x7a,0x25,0x25]);
        length = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        stream.input = new Uint8Array([0x13,0x17]);
        length = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        stream.input = new Uint8Array([0x1f, 0x48]);
        length = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        stream.input = new Uint8Array([0x1a, 0x0f]);
        length = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        stream.input = new Uint8Array([0x40]);
        length = stream.uncompress();
        TKAssertEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(stream.output.subdataInRange(JSRange(0, 42)).stringByDecodingUTF8(), 'this is a testthis is a testthis is a test');
    },

    testUncompressPNGSample: function(){
        var stream = new ZlibStream();
        stream.input = new Uint8Array([0x08,0x1D,0x63,0xF8,0xCF,0xC0,0xC0,0xF0,0x9F,0x81,0x11,0x48,0xFC,0xFF,0xCF,0x00,0x00,0x1E,0xF6,0x04,0xFD]);
        stream.output = JSData.initWithLength(7);
        var length = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(length, 7);
        TKAssertEquals(stream.output[0], 0);
        TKAssertEquals(stream.output[1], 255);
        TKAssertEquals(stream.output[2], 0);
        TKAssertEquals(stream.output[3], 0);
        TKAssertEquals(stream.output[4], 0);
        TKAssertEquals(stream.output[5], 255);
        TKAssertEquals(stream.output[6], 0);
        stream.outputOffset = 0;
        length = stream.uncompress();
        TKAssertEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(length, 7);
        TKAssertEquals(stream.output[0], 1);
        TKAssertEquals(stream.output[1], 0);
        TKAssertEquals(stream.output[2], 0);
        TKAssertEquals(stream.output[3], 255);
        TKAssertEquals(stream.output[4], 255);
        TKAssertEquals(stream.output[5], 255);
        TKAssertEquals(stream.output[6], 0);
    },

    testUncompressFontCmapSample: function(){
        var expectation = TKExpectation.init();
        expectation.call(this.getResourceData, this, "cmap", "z", function(compressed){
            expectation.call(this.getResourceData, this, "cmap", "dat", function(expected){
                var uncompressed = Zlib.uncompress(compressed);
                TKAssertObjectEquals(uncompressed, expected);
            }, this);
        }, this);
        this.wait(expectation, 2);
    },

    testCompressFontCmapSample: function(){
        var expectation = TKExpectation.init();
        expectation.call(this.getResourceData, this, "cmap", "dat", function(expected){
            var compressed = Zlib.compress(expected);
            var uncompressed = Zlib.uncompress(compressed);
            TKAssertLessThan(compressed.length, 1450);
            TKAssertObjectEquals(uncompressed, expected);
        }, this);
        this.wait(expectation, 2);
    },

    testUncompressPDFSample: function(){
        var expectation = TKExpectation.init();
        expectation.call(this.getResourceData, this, "stream", "z", function(compressed){
            expectation.call(this.getResourceData, this, "stream", "dat", function(expected){
                var uncompressed = Zlib.uncompress(compressed);
                TKAssertObjectEquals(uncompressed, expected);
            }, this);
        }, this);
        this.wait(expectation, 2);
    },

    testCompressPDFSample: function(){
        var expectation = TKExpectation.init();
        expectation.call(this.getResourceData, this, "stream", "dat", function(expected){
            var compressed = Zlib.compress(expected);
            var uncompressed = Zlib.uncompress(compressed);
            TKAssertLessThan(compressed.length, 35000);
            TKAssertObjectEquals(uncompressed, expected);
        }, this);
        this.wait(expectation, 2);
    },

    testUncompressPDFSample2: function(){
        var expectation = TKExpectation.init();
        expectation.call(this.getResourceData, this, "stream2", "z", function(compressed){
            expectation.call(this.getResourceData, this, "stream2", "dat", function(expected){
                var uncompressed = Zlib.uncompress(compressed);
                TKAssertObjectEquals(uncompressed, expected);
            }, this);
        }, this);
        this.wait(expectation, 2);
    },

    testCompressPDFSample2: function(){
        var expectation = TKExpectation.init();
        expectation.call(this.getResourceData, this, "stream2", "dat", function(expected){
            var compressed = Zlib.compress(expected);
            var uncompressed = Zlib.uncompress(compressed);
            TKAssertLessThan(compressed.length, 15000);
            TKAssertObjectEquals(uncompressed, expected);
        }, this);
        this.wait(expectation, 2);
    },

});