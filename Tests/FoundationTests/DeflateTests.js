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

JSClass("DeflateTests", TKTestSuite, {

    testDeflate: function(){
        var inflated, output;

        inflated = "t".utf8();
        output = Deflate.deflate(inflated);
        TKAssertObjectEquals(output, [0x2B, 0x01, 0x00]);

        inflated = "this is a test".utf8();
        output = Deflate.deflate(inflated);
        TKAssertObjectEquals(output, [0x2B,0xC9,0xC8,0x2C,0x56,0x00,0xA2,0x44,0x85,0x92,0xD4,0xE2,0x12,0x00]);

        inflated = "Blah blah blah blah blah!".utf8();
        output = Deflate.deflate(inflated);
        TKAssertObjectEquals(output, [0x73,0xCA,0x49,0xCC,0x50,0x48,0xC2,0x24,0x14,0x01]);
    },

    testDeflateByteByByteInput: function(){
        var inflated = "this is a test".utf8();
        var stream = DeflateStream();
        stream.output = JSData.initWithLength(20);
        var length;
        for (var i = 0; i < inflated.length - 1; ++i){
            stream.input = inflated.subdataInRange(JSRange(i, 1));
            length = stream.deflate();
            TKAssertEquals(length, 0);
            TKAssertEquals(stream.inputOffset, 1);
        }
        stream.input = inflated.subdataInRange(JSRange(inflated.length - 1, 1));
        length = stream.deflate(true);
        TKAssertEquals(length, 14);
        TKAssertObjectEquals(stream.output.subdataInRange(JSRange(0, 14)), [0x2B,0xC9,0xC8,0x2C,0x56,0x00,0xA2,0x44,0x85,0x92,0xD4,0xE2,0x12,0x00]);
    },

    testDeflateByteByByteOutput: function(){        
        var inflated = "this is a test".utf8();
        var stream = DeflateStream();
        stream.input = inflated;
        stream.output = JSData.initWithLength(1);
        var length = stream.deflate(true);
        TKAssertEquals(length, 1);
        TKAssertEquals(stream.output[0], 0x2B);
        stream.outputOffset = 0;
        length = stream.deflate(true);
        TKAssertEquals(length, 1);
        TKAssertEquals(stream.output[0], 0xC9);
        stream.outputOffset = 0;
        length = stream.deflate(true);
        TKAssertEquals(length, 1);
        TKAssertEquals(stream.output[0], 0xC8);
        stream.outputOffset = 0;
        length = stream.deflate(true);
        TKAssertEquals(length, 1);
        TKAssertEquals(stream.output[0], 0x2C);
        stream.outputOffset = 0;
        length = stream.deflate(true);
        TKAssertEquals(length, 1);
        TKAssertEquals(stream.output[0], 0x56);
        stream.outputOffset = 0;
        length = stream.deflate(true);
        TKAssertEquals(length, 1);
        TKAssertEquals(stream.output[0], 0x00);
        stream.outputOffset = 0;
        length = stream.deflate(true);
        TKAssertEquals(length, 1);
        TKAssertEquals(stream.output[0], 0xA2);
        stream.outputOffset = 0;
        length = stream.deflate(true);
        TKAssertEquals(length, 1);
        TKAssertEquals(stream.output[0], 0x44);
        stream.outputOffset = 0;
        length = stream.deflate(true);
        TKAssertEquals(length, 1);
        TKAssertEquals(stream.output[0], 0x85);
        stream.outputOffset = 0;
        length = stream.deflate(true);
        TKAssertEquals(length, 1);
        TKAssertEquals(stream.output[0], 0x92);
        stream.outputOffset = 0;
        length = stream.deflate(true);
        TKAssertEquals(length, 1);
        TKAssertEquals(stream.output[0], 0xD4);
        stream.outputOffset = 0;
        length = stream.deflate(true);
        TKAssertEquals(length, 1);
        TKAssertEquals(stream.output[0], 0xE2);
        stream.outputOffset = 0;
        length = stream.deflate(true);
        TKAssertEquals(length, 1);
        TKAssertEquals(stream.output[0], 0x12);
        stream.outputOffset = 0;
        length = stream.deflate(true);
        TKAssertEquals(length, 1);
        TKAssertEquals(stream.output[0], 0x00);
        stream.outputOffset = 0;
        length = stream.deflate(true);
        TKAssertExactEquals(length, 0);
    },

    _testDeflateUncompressed: function(){
        var inflated = "this is a test".utf8();
        var output = Deflate.deflate(inflated);
        TKAssertObjectEquals(output, [0x01,0x0e,0x00,0xf1,0xff,0x74,0x68,0x69,0x73,0x20,0x69,0x73,0x20,0x61,0x20,0x74,0x65,0x73,0x74]);
    },

    _testDeflateUncompressedLong: function(){
        var inflated = new Uint8Array(0xFFFF + 0xFF);
        for (var i = 0; i < inflated.length; ++i){
            inflated[i] = i & 0xFF;
        }
        var output = Deflate.deflate(inflated);
        var expected = new Uint8Array(0xFFFF + 0xFF + 10);
        expected[0] = 0x00;
        expected[1] = 0xFF;
        expected[2] = 0xFF;
        expected[3] = 0x00;
        expected[4] = 0x00;
        for (i = 0; i < 0xFFFF; ++i){
            expected[i + 5] = i & 0xFF;
        }
        expected[i+5] = 0x01;
        expected[i+6] = 0xFF;
        expected[i+7] = 0x00;
        expected[i+8] = 0x00;
        expected[i+9] = 0xFF;
        for (; i < inflated.length; ++i){
            expected[i + 10] = i & 0xFF;
        }
        // Doing a regular assert so the two really large arrays don't get printed
        // if the assertion fails, as they would if we used TKAssertObjectEquals
        TKAssert(output.isEqual(expected));

    },

    _testDeflateUncompressedInChuncks: function(){
        // All input, limited output
        var stream = new DeflateStream();
        stream.input = "this is a test".utf8();
        stream.output = JSData.initWithLength(4);
        var length;
        length = stream.deflate(true);
        TKAssertEquals(length, 4);
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertObjectEquals(stream.output, new Uint8Array([0x01,0x0e,0x00,0xf1]));
        stream.outputOffset = 0;
        length = stream.deflate(true);
        TKAssertEquals(length, 4);
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertObjectEquals(stream.output, new Uint8Array([0xff,0x74,0x68,0x69]));
        stream.outputOffset = 0;
        length = stream.deflate(true);
        TKAssertEquals(length, 4);
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertObjectEquals(stream.output, new Uint8Array([0x73,0x20,0x69,0x73]));
        stream.outputOffset = 0;
        length = stream.deflate(true);
        TKAssertEquals(length, 4);
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertObjectEquals(stream.output, new Uint8Array([0x20,0x61,0x20,0x74]));
        stream.outputOffset = 0;
        length = stream.deflate(true);
        TKAssertEquals(length, 3);
        TKAssertEquals(stream.state, DeflateStream.State.done);
        TKAssertObjectEquals(stream.output.subdataInRange(JSRange(0, 3)), new Uint8Array([0x65,0x73,0x74]));

        // Limited input, plenty of output
        stream = new DeflateStream();
        var fullInput = "this is a test".utf8();
        stream.input = new Uint8Array(fullInput.buffer, 0, 2);
        stream.output = JSData.initWithLength(32);
        length = stream.deflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(length, 0);
        stream.input = new Uint8Array(fullInput.buffer, 2, 3);
        length = stream.deflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(length, 0);
        stream.input = new Uint8Array(fullInput.buffer, 5, 4);
        length = stream.deflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(length, 0);
        stream.input = new Uint8Array(fullInput.buffer, 9, 5);
        length = stream.deflate(true);
        TKAssertEquals(length, 19);
        TKAssertEquals(stream.state, DeflateStream.State.done);
        TKAssertObjectEquals(stream.output.subdataInRange(JSRange(0, 19)), [0x01,0x0e,0x00,0xf1,0xff,0x74,0x68,0x69,0x73,0x20,0x69,0x73,0x20,0x61,0x20,0x74,0x65,0x73,0x74]);

        // All input, plenty of output, final block empty
        stream = new DeflateStream();
        stream.input = "this is a test".utf8();
        stream.output = JSData.initWithLength(32);
        length = stream.deflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(length, 0);
        stream.input = new Uint8Array();
        length = stream.deflate(true);
        TKAssertEquals(length, 19);
        TKAssertEquals(stream.state, DeflateStream.State.done);
        TKAssertObjectEquals(stream.output.subdataInRange(JSRange(0, 19)), [0x01,0x0e,0x00,0xf1,0xff,0x74,0x68,0x69,0x73,0x20,0x69,0x73,0x20,0x61,0x20,0x74,0x65,0x73,0x74]);

        // All input, plenty of output, final block empty with original input
        stream = new DeflateStream();
        stream.input = "this is a test".utf8();
        stream.output = JSData.initWithLength(32);
        length = stream.deflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(length, 0);
        length = stream.deflate(true);
        TKAssertEquals(length, 19);
        TKAssertEquals(stream.state, DeflateStream.State.done);
        TKAssertObjectEquals(stream.output.subdataInRange(JSRange(0, 19)), [0x01,0x0e,0x00,0xf1,0xff,0x74,0x68,0x69,0x73,0x20,0x69,0x73,0x20,0x61,0x20,0x74,0x65,0x73,0x74]);
    },

    testInflateLevel0: function(){
        var deflated = new Uint8Array([0x00,0x0e,0x00,0xf1,0xff,0x74,0x68,0x69,0x73,0x20,0x69,0x73,0x20,0x61,0x20,0x74,0x65,0x73,0x74,0x00,0x00,0x00,0xff,0xff,0x01,0x00,0x00,0xff,0xff]);
        var inflated = Deflate.inflate(deflated);
        TKAssertEquals(inflated.stringByDecodingUTF8(), 'this is a test');

        deflated = new Uint8Array([0x01,0x0e,0x00,0xf1,0xff,0x74,0x68,0x69,0x73,0x20,0x69,0x73,0x20,0x61,0x20,0x74,0x65,0x73,0x74]);
        inflated = Deflate.inflate(deflated);
        TKAssertEquals(inflated.stringByDecodingUTF8(), 'this is a test');
    },

    testInflateLevel1: function(){
        var deflated = new Uint8Array([0x2b,0xc9,0xc8,0x2c,0x56,0xc8,0x2c,0x56,0x48,0x54,0x28,0x49,0x2d,0x2e,0x01,0x00]);
        var inflated = Deflate.inflate(deflated);
        TKAssertEquals(inflated.stringByDecodingUTF8(), 'this is a test');
    },

    testInflateLevel2: function(){
        var deflated = new Uint8Array([0x05,0xc1,0xb1,0x0d,0x00,0x00,0x08,0xc3,0xb0,0x57,0xfa,0x1a,0x03,0x12,0x9d,0x93,0xff,0x85,0xed,0x95,0x94,0x4c,0x5c,0xf4,0x4a,0x4a,0x26,0x2e,0x7a,0x25,0x25,0x13,0x17,0x1f]);
        var inflated = Deflate.inflate(deflated);
        TKAssertEquals(inflated.stringByDecodingUTF8(), 'this is a testthis is a testthis is a test');

        deflated = new Uint8Array([0x63,0x60,0x64,0x62,0x66,0x61,0x65,0x63,0xe7,0xe0,0xe4,0xe2,0xe6,0xe1,0xe5,0xe3,0x17,0x10,0x14,0x12,0x16,0x11,0x15,0x13,0x97,0x90,0x04,0x00]);
        inflated = Deflate.inflate(deflated);
        TKAssertObjectEquals(inflated, [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25]);

        deflated = new Uint8Array([0x05,0xc1,0x85,0x01,0x00,0x20,0x08,0x00,0x30,0x31,0xc0,0x0e,0x2c,0xfc,0xff,0x51,0x37,0x05,0xda,0x58,0x87,0xe4,0x43,0x4c,0xb9,0xd4,0xd6,0x07,0xcf,0xb5,0xcf,0x95,0xa7,0x40,0x1b,0xeb,0x90,0x7c,0x88,0x29,0x97,0xda,0xfa,0xe0,0xb9,0xf6,0xb9,0xf2,0x14,0x68,0x63,0x1d,0x92,0x0f,0x31,0xe5,0x52,0x5b,0x1f,0x3c,0xd7,0x3e,0x57,0x9e,0x02,0x6d,0xac,0x43,0xf2,0x21,0xa6,0x5c,0x6a,0xeb,0x83,0xe7,0xda,0xe7,0xca,0xfb]);
        inflated = Deflate.inflate(deflated);
        TKAssertObjectEquals(inflated, [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25]);
    },

    testChunkedInflateLevel0: function(){
        // All input up front, limited output space, empty blocks
        var stream = DeflateStream();
        stream.input = new Uint8Array([0x00,0x0e,0x00,0xf1,0xff,0x74,0x68,0x69,0x73,0x20,0x69,0x73,0x20,0x61,0x20,0x74,0x65,0x73,0x74,0x00,0x00,0x00,0xff,0xff,0x01,0x00,0x00,0xff,0xff]);
        stream.output = JSData.initWithLength(4);
        var length = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(length, 4);
        TKAssertEquals(stream.output.subdataInRange(JSRange(0, 4)).stringByDecodingUTF8(), 'this');
        stream.outputOffset = 0;
        length = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(length, 4);
        TKAssertEquals(stream.output.subdataInRange(JSRange(0, 4)).stringByDecodingUTF8(), ' is ');
        stream.outputOffset = 0;
        length = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(length, 4);
        TKAssertEquals(stream.output.subdataInRange(JSRange(0, 4)).stringByDecodingUTF8(), 'a te');
        stream.outputOffset = 0;
        length = stream.inflate();
        TKAssertEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(length, 2);
        TKAssertEquals(stream.output.subdataInRange(JSRange(0, 2)).stringByDecodingUTF8(), 'st');

        // All input up front, limited output space, single block
        stream = DeflateStream();
        stream.input = new Uint8Array([0x01,0x0e,0x00,0xf1,0xff,0x74,0x68,0x69,0x73,0x20,0x69,0x73,0x20,0x61,0x20,0x74,0x65,0x73,0x74]);
        stream.output = JSData.initWithLength(4);
        length = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(length, 4);
        TKAssertEquals(stream.output.subdataInRange(JSRange(0, 4)).stringByDecodingUTF8(), 'this');
        stream.outputOffset = 0;
        length = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(length, 4);
        TKAssertEquals(stream.output.subdataInRange(JSRange(0, 4)).stringByDecodingUTF8(), ' is ');
        stream.outputOffset = 0;
        length = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(length, 4);
        TKAssertEquals(stream.output.subdataInRange(JSRange(0, 4)).stringByDecodingUTF8(), 'a te');
        stream.outputOffset = 0;
        length = stream.inflate();
        TKAssertEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(length, 2);
        TKAssertEquals(stream.output.subdataInRange(JSRange(0, 2)).stringByDecodingUTF8(), 'st');

        // Chunked input, unlimited outputspace, single block
        stream = DeflateStream();
        stream.output = JSData.initWithLength(32);
        stream.input = new Uint8Array([0x01]);
        length = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(length, 0);
        stream.input = new Uint8Array([0x0e,0x00]);
        length = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(length, 0);
        stream.input = new Uint8Array([0xf1,0xff,0x74]);
        length = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(length, 1);
        TKAssertEquals(stream.output.subdataInRange(JSRange(0, 1)).stringByDecodingUTF8(), "t");
        stream.input = new Uint8Array([0x68,0x69,0x73,0x20,0x69,0x73,0x20]);
        length = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(length, 7);
        TKAssertEquals(stream.output.subdataInRange(JSRange(1, 7)).stringByDecodingUTF8(), "his is ");
        stream.input = new Uint8Array([0x61,0x20,0x74]);
        length = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(length, 3);
        TKAssertEquals(stream.output.subdataInRange(JSRange(8, 3)).stringByDecodingUTF8(), "a t");
        stream.input = new Uint8Array([0x65]);
        length = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(length, 1);
        TKAssertEquals(stream.output.subdataInRange(JSRange(11, 1)).stringByDecodingUTF8(), "e");
        stream.input = new Uint8Array([0x73,0x74]);
        length = stream.inflate();
        TKAssertEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(length, 2);
        TKAssertEquals(stream.output.subdataInRange(JSRange(12, 2)).stringByDecodingUTF8(), "st");

        // Chunked input, limited outputspace, single block
        stream = DeflateStream();
        stream.output = JSData.initWithLength(4);
        stream.input = new Uint8Array([0x01]);
        length = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(length, 0);
        stream.input = new Uint8Array([0x0e,0x00]);
        length = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(length, 0);
        stream.input = new Uint8Array([0xf1,0xff,0x74]);
        length = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(length, 1);
        TKAssertEquals(stream.output.subdataInRange(JSRange(0, 1)).stringByDecodingUTF8(), "t");
        stream.input = new Uint8Array([0x68,0x69,0x73,0x20,0x69,0x73,0x20]);
        stream.outputOffset = 0;
        length = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(length, 4);
        TKAssertEquals(stream.output.subdataInRange(JSRange(0, 4)).stringByDecodingUTF8(), "his ");
        stream.outputOffset = 0;
        length = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(length, 3);
        TKAssertEquals(stream.output.subdataInRange(JSRange(0, 3)).stringByDecodingUTF8(), "is ");
        stream.input = new Uint8Array([0x61,0x20,0x74]);
        stream.outputOffset = 0;
        length = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(length, 3);
        TKAssertEquals(stream.output.subdataInRange(JSRange(0, 3)).stringByDecodingUTF8(), "a t");
        stream.input = new Uint8Array([0x65]);
        stream.outputOffset = 0;
        length = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(length, 1);
        TKAssertEquals(stream.output.subdataInRange(JSRange(0, 1)).stringByDecodingUTF8(), "e");
        stream.input = new Uint8Array([0x73,0x74]);
        stream.outputOffset = 0;
        length = stream.inflate();
        TKAssertEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(length, 2);
        TKAssertEquals(stream.output.subdataInRange(JSRange(0, 2)).stringByDecodingUTF8(), "st");
    },

    testChunkedInflateLevel2: function(){
        // All input up front, limited output space
        var stream = DeflateStream();
        stream.input = new Uint8Array([0x05,0xc1,0xb1,0x0d,0x00,0x00,0x08,0xc3,0xb0,0x57,0xfa,0x1a,0x03,0x12,0x9d,0x93,0xff,0x85,0xed,0x95,0x94,0x4c,0x5c,0xf4,0x4a,0x4a,0x26,0x2e,0x7a,0x25,0x25,0x13,0x17,0x1f]);
        stream.output = JSData.initWithLength(20);
        var length = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(length, 20);
        TKAssertEquals(stream.output.subdataInRange(JSRange(0, 20)).stringByDecodingUTF8(), 'this is a testthis i');
        stream.outputOffset = 0;
        length = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(length, 20);
        TKAssertEquals(stream.output.subdataInRange(JSRange(0, 20)).stringByDecodingUTF8(), 's a testthis is a te');
        stream.outputOffset = 0;
        length = stream.inflate();
        TKAssertEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(length, 2);
        TKAssertEquals(stream.output.subdataInRange(JSRange(0, 2)).stringByDecodingUTF8(), 'st');

        // Input in chunks
        stream = DeflateStream();
        stream.input = new Uint8Array([0x05]);
        stream.output = JSData.initWithLength(50);
        length = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        stream.input = new Uint8Array([0xc1]);
        length = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        stream.input = new Uint8Array([0xb1]);
        length = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        stream.input = new Uint8Array([0x0d,0x00]);
        length = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        stream.input = new Uint8Array([0x00,0x08,0xc3,0xb0,0x57]);
        length = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        stream.input = new Uint8Array([0xfa,0x1a,0x03,0x12,0x9d,0x93,0xff,0x85]);
        length = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        stream.input = new Uint8Array([0xed,0x95,0x94,0x4c,0x5c,0xf4,0x4a,0x4a,0x26,0x2e,0x7a,0x25,0x25]);
        length = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        stream.input = new Uint8Array([0x13,0x17]);
        length = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        stream.input = new Uint8Array([0x1f]);
        length = stream.inflate();
        TKAssertEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(stream.output.subdataInRange(JSRange(0, 42)).stringByDecodingUTF8(), 'this is a testthis is a testthis is a test');
    }

});