// #import "Zlib/Zlib.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, Zlib, ZlibStream, ArrayBuffer */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
'use strict';

JSClass("ZlibTests", TKTestSuite, {

    _testCompress: function(){
        var inflated = "this is a test".utf8().bytes;
        var stream = new ZlibStream(inflated);
        stream.level = 0;
        stream.compress();
        TKAssertObjectEquals(stream.output, [0x78,0x01,0x01,0x0e,0x00,0xf1,0xff,0x74,0x68,0x69,0x73,0x20,0x69,0x73,0x20,0x61,0x20,0x74,0x65,0x73,0x74,0x26,0x33,0x05,0x16]);

        inflated = "this is a test".utf8().bytes;
        stream = new ZlibStream(inflated);
        TKAssertThrows(function(){ stream.compress(); });
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
        stream.outputBuffer = new ArrayBuffer(4);
        var output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), 'this');
        output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), ' is ');
        output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), 'a te');
        output = stream.uncompress();
        TKAssertEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), 'st');

        // All input up front, limited output space, single block
        stream = ZlibStream();
        stream.input = new Uint8Array([0x78,0x01,0x01,0x0e,0x00,0xf1,0xff,0x74,0x68,0x69,0x73,0x20,0x69,0x73,0x20,0x61,0x20,0x74,0x65,0x73,0x74,0x26,0x33,0x05,0x16]);
        stream.outputBuffer = new ArrayBuffer(4);
        output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), 'this');
        output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), ' is ');
        output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), 'a te');
        output = stream.uncompress();
        TKAssertEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), 'st');

        // Chunked input, unlimited outputspace, single block
        stream = ZlibStream();
        stream.outputBuffer = new ArrayBuffer(32);
        stream.input = new Uint8Array([0x78]);
        output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        stream.input = new Uint8Array([0x01]);
        output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        stream.input = new Uint8Array([0x01]);
        output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.length, 0);
        stream.input = new Uint8Array([0x0e,0x00]);
        output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.length, 0);
        stream.input = new Uint8Array([0xf1,0xff,0x74]);
        output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), "t");
        stream.input = new Uint8Array([0x68,0x69,0x73,0x20,0x69,0x73,0x20]);
        output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), "his is ");
        stream.input = new Uint8Array([0x61,0x20,0x74]);
        output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), "a t");
        stream.input = new Uint8Array([0x65]);
        output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), "e");
        stream.input = new Uint8Array([0x73,0x74]);
        output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), "st");
        stream.input = new Uint8Array([0x26,0x33]);
        output = stream.uncompress();
        TKAssertEquals(output.length, 0);
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        stream.input = new Uint8Array([0x05]);
        output = stream.uncompress();
        TKAssertEquals(output.length, 0);
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        stream.input = new Uint8Array([0x16]);
        output = stream.uncompress();
        TKAssertEquals(output.length, 0);
        TKAssertEquals(stream.state, ZlibStream.State.done);

        // Chunked input, limited outputspace, single block
        stream = ZlibStream();
        stream.outputBuffer = new ArrayBuffer(4);
        stream.input = new Uint8Array([0x78, 0x01]);
        output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        stream.input = new Uint8Array([0x01]);
        output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.length, 0);
        stream.input = new Uint8Array([0x0e,0x00]);
        output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.length, 0);
        stream.input = new Uint8Array([0xf1,0xff,0x74]);
        output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), "t");
        stream.input = new Uint8Array([0x68,0x69,0x73,0x20,0x69,0x73,0x20]);
        output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), "his ");
        output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), "is ");
        stream.input = new Uint8Array([0x61,0x20,0x74]);
        output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), "a t");
        stream.input = new Uint8Array([0x65]);
        output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), "e");
        stream.input = new Uint8Array([0x73,0x74,0x26,0x33]);
        output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), "st");
        stream.input = new Uint8Array([0x05,0x16]);
        output = stream.uncompress();
        TKAssertEquals(output.length, 0);
        TKAssertEquals(stream.state, ZlibStream.State.done);
    },

    testChunkedUncompressLevel2: function(){
        // All input up front, limited output space
        var stream = ZlibStream();
        stream.input = new Uint8Array([0x78,0x01,0x05,0xc1,0xb1,0x0d,0x00,0x00,0x08,0xc3,0xb0,0x57,0xfa,0x1a,0x03,0x12,0x9d,0x93,0xff,0x85,0xed,0x95,0x94,0x4c,0x5c,0xf4,0x4a,0x4a,0x26,0x2e,0x7a,0x25,0x25,0x13,0x17,0x1f,0x48,0x1a,0x0f,0x40]);
        stream.outputBuffer = new ArrayBuffer(20);
        var output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), 'this is a testthis i');
        output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), 's a testthis is a te');
        output = stream.uncompress();
        TKAssertEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), 'st');

        // Input in chunks
        stream = ZlibStream();
        var str = "";
        stream.input = new Uint8Array([0x78]);
        stream.outputBuffer = new ArrayBuffer(50);
        output = stream.uncompress();
        str += output.stringByDecodingUTF8();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        stream.input = new Uint8Array([0x01]);
        stream.outputBuffer = new ArrayBuffer(50);
        output = stream.uncompress();
        str += output.stringByDecodingUTF8();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        stream.input = new Uint8Array([0x05]);
        stream.outputBuffer = new ArrayBuffer(50);
        output = stream.uncompress();
        str += output.stringByDecodingUTF8();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        stream.input = new Uint8Array([0xc1]);
        output = stream.uncompress();
        str += output.stringByDecodingUTF8();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        stream.input = new Uint8Array([0xb1]);
        output = stream.uncompress();
        str += output.stringByDecodingUTF8();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        stream.input = new Uint8Array([0x0d,0x00]);
        output = stream.uncompress();
        str += output.stringByDecodingUTF8();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        stream.input = new Uint8Array([0x00,0x08,0xc3,0xb0,0x57]);
        output = stream.uncompress();
        str += output.stringByDecodingUTF8();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        stream.input = new Uint8Array([0xfa,0x1a,0x03,0x12,0x9d,0x93,0xff,0x85]);
        output = stream.uncompress();
        str += output.stringByDecodingUTF8();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        stream.input = new Uint8Array([0xed,0x95,0x94,0x4c,0x5c,0xf4,0x4a,0x4a,0x26,0x2e,0x7a,0x25,0x25]);
        output = stream.uncompress();
        str += output.stringByDecodingUTF8();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        stream.input = new Uint8Array([0x13,0x17]);
        output = stream.uncompress();
        str += output.stringByDecodingUTF8();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        stream.input = new Uint8Array([0x1f, 0x48]);
        output = stream.uncompress();
        str += output.stringByDecodingUTF8();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        stream.input = new Uint8Array([0x1a, 0x0f]);
        output = stream.uncompress();
        str += output.stringByDecodingUTF8();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        stream.input = new Uint8Array([0x40]);
        output = stream.uncompress();
        str += output.stringByDecodingUTF8();
        TKAssertEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(str, 'this is a testthis is a testthis is a test');
    }

});