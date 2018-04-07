// #import "Zlib/Zlib.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, Deflate, DeflateStream, ArrayBuffer */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
'use strict';

JSClass("DeflateTests", TKTestSuite, {

    testDeflateLevel0: function(){
        var inflated = "this is a test".utf8().bytes;
        var output = Deflate.deflate(inflated, 0);
        TKAssertObjectEquals(output, [0x01,0x0e,0x00,0xf1,0xff,0x74,0x68,0x69,0x73,0x20,0x69,0x73,0x20,0x61,0x20,0x74,0x65,0x73,0x74]);
    },

    testDeflateLevel0Long: function(){
        var inflated = new Uint8Array(0xFFFF + 0xFF);
        for (var i = 0; i < inflated.length; ++i){
            inflated[i] = i & 0xFF;
        }
        var output = Deflate.deflate(inflated, 0);
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

    testDeflateLevel0InChuncks: function(){
        // All input, limited output
        var stream = new DeflateStream(0);
        stream.input = "this is a test".utf8().bytes;
        stream.outputBuffer = new ArrayBuffer(4);
        var output = stream.deflate(true);
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertObjectEquals(output, new Uint8Array([0x01,0x0e,0x00,0xf1]));
        output = stream.deflate(true);
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertObjectEquals(output, new Uint8Array([0xff,0x74,0x68,0x69]));
        output = stream.deflate(true);
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertObjectEquals(output, new Uint8Array([0x73,0x20,0x69,0x73]));
        output = stream.deflate(true);
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertObjectEquals(output, new Uint8Array([0x20,0x61,0x20,0x74]));
        output = stream.deflate(true);
        TKAssertEquals(stream.state, DeflateStream.State.done);
        TKAssertObjectEquals(output, new Uint8Array([0x65,0x73,0x74]));

        // Limited input, plenty of output
        stream = new DeflateStream(0);
        var fullInput = "this is a test".utf8().bytes;
        stream.input = new Uint8Array(fullInput.buffer, 0, 2);
        stream.outputBuffer = new ArrayBuffer(32);
        output = stream.deflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(output.length, 0);
        stream.input = new Uint8Array(fullInput.buffer, 2, 3);
        output = stream.deflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(output.length, 0);
        stream.input = new Uint8Array(fullInput.buffer, 5, 4);
        output = stream.deflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(output.length, 0);
        stream.input = new Uint8Array(fullInput.buffer, 9, 5);
        output = stream.deflate(true);
        TKAssertEquals(stream.state, DeflateStream.State.done);
        TKAssertObjectEquals(output, [0x01,0x0e,0x00,0xf1,0xff,0x74,0x68,0x69,0x73,0x20,0x69,0x73,0x20,0x61,0x20,0x74,0x65,0x73,0x74]);

        // All input, plenty of output, final block empty
        stream = new DeflateStream(0);
        stream.input = "this is a test".utf8().bytes;
        stream.outputBuffer = new ArrayBuffer(32);
        output = stream.deflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(output.length, 0);
        stream.input = new Uint8Array();
        output = stream.deflate(true);
        TKAssertEquals(stream.state, DeflateStream.State.done);
        TKAssertObjectEquals(output, [0x01,0x0e,0x00,0xf1,0xff,0x74,0x68,0x69,0x73,0x20,0x69,0x73,0x20,0x61,0x20,0x74,0x65,0x73,0x74]);

        // All input, plenty of output, final block empty with original input
        stream = new DeflateStream(0);
        stream.input = "this is a test".utf8().bytes;
        stream.outputBuffer = new ArrayBuffer(32);
        output = stream.deflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(output.length, 0);
        output = stream.deflate(true);
        TKAssertEquals(stream.state, DeflateStream.State.done);
        TKAssertObjectEquals(output, [0x01,0x0e,0x00,0xf1,0xff,0x74,0x68,0x69,0x73,0x20,0x69,0x73,0x20,0x61,0x20,0x74,0x65,0x73,0x74]);
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
        stream.outputBuffer = new ArrayBuffer(4);
        var output = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), 'this');
        output = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), ' is ');
        output = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), 'a te');
        output = stream.inflate();
        TKAssertEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), 'st');

        // All input up front, limited output space, single block
        stream = DeflateStream();
        stream.input = new Uint8Array([0x01,0x0e,0x00,0xf1,0xff,0x74,0x68,0x69,0x73,0x20,0x69,0x73,0x20,0x61,0x20,0x74,0x65,0x73,0x74]);
        stream.outputBuffer = new ArrayBuffer(4);
        output = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), 'this');
        output = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), ' is ');
        output = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), 'a te');
        output = stream.inflate();
        TKAssertEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), 'st');

        // Chunked input, unlimited outputspace, single block
        stream = DeflateStream();
        stream.outputBuffer = new ArrayBuffer(32);
        stream.input = new Uint8Array([0x01]);
        output = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(output.length, 0);
        stream.input = new Uint8Array([0x0e,0x00]);
        output = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(output.length, 0);
        stream.input = new Uint8Array([0xf1,0xff,0x74]);
        output = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), "t");
        stream.input = new Uint8Array([0x68,0x69,0x73,0x20,0x69,0x73,0x20]);
        output = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), "his is ");
        stream.input = new Uint8Array([0x61,0x20,0x74]);
        output = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), "a t");
        stream.input = new Uint8Array([0x65]);
        output = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), "e");
        stream.input = new Uint8Array([0x73,0x74]);
        output = stream.inflate();
        TKAssertEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), "st");

        // Chunked input, limited outputspace, single block
        stream = DeflateStream();
        stream.outputBuffer = new ArrayBuffer(4);
        stream.input = new Uint8Array([0x01]);
        output = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(output.length, 0);
        stream.input = new Uint8Array([0x0e,0x00]);
        output = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(output.length, 0);
        stream.input = new Uint8Array([0xf1,0xff,0x74]);
        output = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), "t");
        stream.input = new Uint8Array([0x68,0x69,0x73,0x20,0x69,0x73,0x20]);
        output = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), "his ");
        output = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), "is ");
        stream.input = new Uint8Array([0x61,0x20,0x74]);
        output = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), "a t");
        stream.input = new Uint8Array([0x65]);
        output = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), "e");
        stream.input = new Uint8Array([0x73,0x74]);
        output = stream.inflate();
        TKAssertEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), "st");
    },

    testChunkedInflateLevel2: function(){
        // All input up front, limited output space
        var stream = DeflateStream();
        stream.input = new Uint8Array([0x05,0xc1,0xb1,0x0d,0x00,0x00,0x08,0xc3,0xb0,0x57,0xfa,0x1a,0x03,0x12,0x9d,0x93,0xff,0x85,0xed,0x95,0x94,0x4c,0x5c,0xf4,0x4a,0x4a,0x26,0x2e,0x7a,0x25,0x25,0x13,0x17,0x1f]);
        stream.outputBuffer = new ArrayBuffer(20);
        var output = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), 'this is a testthis i');
        output = stream.inflate();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), 's a testthis is a te');
        output = stream.inflate();
        TKAssertEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), 'st');

        // Input in chunks
        stream = DeflateStream();
        var str = "";
        stream.input = new Uint8Array([0x05]);
        stream.outputBuffer = new ArrayBuffer(50);
        output = stream.inflate();
        str += output.stringByDecodingUTF8();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        stream.input = new Uint8Array([0xc1]);
        output = stream.inflate();
        str += output.stringByDecodingUTF8();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        stream.input = new Uint8Array([0xb1]);
        output = stream.inflate();
        str += output.stringByDecodingUTF8();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        stream.input = new Uint8Array([0x0d,0x00]);
        output = stream.inflate();
        str += output.stringByDecodingUTF8();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        stream.input = new Uint8Array([0x00,0x08,0xc3,0xb0,0x57]);
        output = stream.inflate();
        str += output.stringByDecodingUTF8();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        stream.input = new Uint8Array([0xfa,0x1a,0x03,0x12,0x9d,0x93,0xff,0x85]);
        output = stream.inflate();
        str += output.stringByDecodingUTF8();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        stream.input = new Uint8Array([0xed,0x95,0x94,0x4c,0x5c,0xf4,0x4a,0x4a,0x26,0x2e,0x7a,0x25,0x25]);
        output = stream.inflate();
        str += output.stringByDecodingUTF8();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        stream.input = new Uint8Array([0x13,0x17]);
        output = stream.inflate();
        str += output.stringByDecodingUTF8();
        TKAssertNotEquals(stream.state, DeflateStream.State.done);
        stream.input = new Uint8Array([0x1f]);
        output = stream.inflate();
        str += output.stringByDecodingUTF8();
        TKAssertEquals(stream.state, DeflateStream.State.done);
        TKAssertEquals(str, 'this is a testthis is a testthis is a test');
    }

});