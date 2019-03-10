// #import "Foundation/Foundation.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, JSData, Zlib, ZlibStream, TKExpectation */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
'use strict';

JSClass("ZlibTests", TKTestSuite, {

    testCompress: function(){
        var uncompressed = "this is a test".utf8();
        var output = Zlib.compress(uncompressed, 0);
        TKAssertObjectEquals(output, [0x78,0x01,0x01,0x0e,0x00,0xf1,0xff,0x74,0x68,0x69,0x73,0x20,0x69,0x73,0x20,0x61,0x20,0x74,0x65,0x73,0x74,0x26,0x33,0x05,0x16]);

        TKAssertThrows(function(){ Zlib.compress(uncompressed, 1); });
        TKAssertThrows(function(){ Zlib.compress(uncompressed, 2); });
        TKAssertThrows(function(){ Zlib.compress(uncompressed, 3); });
    },

    testCompressInChunks: function(){
        // All input, limited output
        var stream = new ZlibStream(0);
        stream.input = "this is a test".utf8();
        stream.output = JSData.initWithLength(4);
        var output = stream.compress(true);
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertObjectEquals(output, [0x78,0x01,0x01,0x0e]);
        stream.outputOffset = 0;
        output = stream.compress(true);
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertObjectEquals(output, [0x00,0xf1,0xff,0x74]);
        stream.outputOffset = 0;
        output = stream.compress(true);
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertObjectEquals(output, [0x68,0x69,0x73,0x20]);
        stream.outputOffset = 0;
        output = stream.compress(true);
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertObjectEquals(output, [0x69,0x73,0x20,0x61]);
        stream.outputOffset = 0;
        output = stream.compress(true);
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertObjectEquals(output, [0x20,0x74,0x65,0x73]);
        stream.outputOffset = 0;
        output = stream.compress(true);
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertObjectEquals(output, [0x74,0x26,0x33,0x05]);
        stream.outputOffset = 0;
        output = stream.compress(true);
        TKAssertEquals(stream.state, ZlibStream.State.done);
        TKAssertObjectEquals(output, [0x16]);

        // Limited input, plenty of output
        stream = new ZlibStream(0);
        var fullInput = "this is a test".utf8();
        stream.input = new Uint8Array(fullInput.buffer, 0, 2);
        stream.output = JSData.initWithLength(32);
        output = stream.compress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertObjectEquals(output, [0x78,0x01]);
        stream.input = new Uint8Array(fullInput.buffer, 2, 3);
        output = stream.compress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.length, 0);
        stream.input = new Uint8Array(fullInput.buffer, 5, 4);
        output = stream.compress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.length, 0);
        stream.input = new Uint8Array(fullInput.buffer, 9, 5);
        output = stream.compress(true);
        TKAssertEquals(stream.state, ZlibStream.State.done);
        TKAssertObjectEquals(output, [0x01,0x0e,0x00,0xf1,0xff,0x74,0x68,0x69,0x73,0x20,0x69,0x73,0x20,0x61,0x20,0x74,0x65,0x73,0x74,0x26,0x33,0x05,0x16]);
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
        var output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), 'this');
        stream.outputOffset = 0;
        output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), ' is ');
        stream.outputOffset = 0;
        output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), 'a te');
        stream.outputOffset = 0;
        output = stream.uncompress();
        TKAssertEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), 'st');

        // All input up front, limited output space, single block
        stream = ZlibStream();
        stream.input = new Uint8Array([0x78,0x01,0x01,0x0e,0x00,0xf1,0xff,0x74,0x68,0x69,0x73,0x20,0x69,0x73,0x20,0x61,0x20,0x74,0x65,0x73,0x74,0x26,0x33,0x05,0x16]);
        stream.output = JSData.initWithLength(4);
        output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), 'this');
        stream.outputOffset = 0;
        output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), ' is ');
        stream.outputOffset = 0;
        output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), 'a te');
        stream.outputOffset = 0;
        output = stream.uncompress();
        TKAssertEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), 'st');

        // Chunked input, unlimited outputspace, single block
        stream = ZlibStream();
        stream.output = JSData.initWithLength(32);
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
        stream.output = JSData.initWithLength(4);
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
        stream.outputOffset = 0;
        output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), "his ");
        stream.outputOffset = 0;
        output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), "is ");
        stream.input = new Uint8Array([0x61,0x20,0x74]);
        stream.outputOffset = 0;
        output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), "a t");
        stream.input = new Uint8Array([0x65]);
        stream.outputOffset = 0;
        output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), "e");
        stream.input = new Uint8Array([0x73,0x74,0x26,0x33]);
        stream.outputOffset = 0;
        output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), "st");
        stream.input = new Uint8Array([0x05,0x16]);
        stream.outputOffset = 0;
        output = stream.uncompress();
        TKAssertEquals(output.length, 0);
        TKAssertEquals(stream.state, ZlibStream.State.done);
    },

    testChunkedUncompressLevel2: function(){
        // All input up front, limited output space
        var stream = ZlibStream();
        stream.input = new Uint8Array([0x78,0x01,0x05,0xc1,0xb1,0x0d,0x00,0x00,0x08,0xc3,0xb0,0x57,0xfa,0x1a,0x03,0x12,0x9d,0x93,0xff,0x85,0xed,0x95,0x94,0x4c,0x5c,0xf4,0x4a,0x4a,0x26,0x2e,0x7a,0x25,0x25,0x13,0x17,0x1f,0x48,0x1a,0x0f,0x40]);
        stream.output = JSData.initWithLength(20);
        var output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), 'this is a testthis i');
        stream.outputOffset = 0;
        output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), 's a testthis is a te');
        stream.outputOffset = 0;
        output = stream.uncompress();
        TKAssertEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.stringByDecodingUTF8(), 'st');

        // Input in chunks
        stream = ZlibStream();
        var str = "";
        stream.input = new Uint8Array([0x78]);
        stream.output = JSData.initWithLength(50);
        output = stream.uncompress();
        str += output.stringByDecodingUTF8();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        stream.input = new Uint8Array([0x01]);
        stream.output = JSData.initWithLength(50);
        output = stream.uncompress();
        str += output.stringByDecodingUTF8();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        stream.input = new Uint8Array([0x05]);
        stream.output = JSData.initWithLength(50);
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
    },

    testPNGSample: function(){
        var stream = new ZlibStream();
        stream.input = new Uint8Array([0x08,0x1D,0x63,0xF8,0xCF,0xC0,0xC0,0xF0,0x9F,0x81,0x11,0x48,0xFC,0xFF,0xCF,0x00,0x00,0x1E,0xF6,0x04,0xFD]);
        stream.output = JSData.initWithLength(7);
        var output = stream.uncompress();
        TKAssertNotEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.length, 7);
        TKAssertEquals(output[0], 0);
        TKAssertEquals(output[1], 255);
        TKAssertEquals(output[2], 0);
        TKAssertEquals(output[3], 0);
        TKAssertEquals(output[4], 0);
        TKAssertEquals(output[5], 255);
        TKAssertEquals(output[6], 0);
        stream.outputOffset = 0;
        output = stream.uncompress();
        TKAssertEquals(stream.state, ZlibStream.State.done);
        TKAssertEquals(output.length, 7);
        TKAssertEquals(output[0], 1);
        TKAssertEquals(output[1], 0);
        TKAssertEquals(output[2], 0);
        TKAssertEquals(output[3], 255);
        TKAssertEquals(output[4], 255);
        TKAssertEquals(output[5], 255);
        TKAssertEquals(output[6], 0);
    },

    testFontCmapSample: function(){
        // var base64Compressed = "eJydlHlQlVUYh98NyppSZFyqmdvhNqBluWYumWZuoOIGbik7yCKKlZPhAriA+wZtlimMZTNhAYIo7oqKYu4p7vdelVLcN3LhcnuZyNHsr87M882Z7zvnnXnOd94fVEAKuEMcABC8AEmQCavgZ9gCu+AA/A7XoRrrogd6YxNsiQEYgtGYhMm4ENMxC3PxBrroFWpHw2kjldAeOkO3GZm5Dtfl13gOz+N0zuJcLuI9vJ8P8zHxlhbSQ/pLuCRIoqTJfikTh9x1Q7d6bp4WtHSxpFpuWm5b7r/qb543HqaBsRiraWJamjamo+lkupvxJtl8b34yq0yeWW82ebl5eXo19LJ6+Xg19wq2ktXdWtda3/qy1WJtZvW1hlqjvEuvUWXxQ6l2uZwuF0Ctq1HXLHX9BbZCCRyEP+AGuLAe1kcfbIqtMBBDMabWNRNz1PUBNa513aWux9UVHrnOUNcFnMErOI/XcykfUlcQH2kpPWWARMg4mSiz5IAcl3NS6UZuHhawdLakWDIttyx31BVMPeNpGhljvNW1tenwyHWFWWmy1bXIbHzCdUStq8djrpHqiuqK6lqlrgjgqnRdwB9c23GJaxsAzlNmKtOVqUqyMkFJdDVwubuk+s/qCtxQc0TVkdXd4IazzHnMuduZ7/zRudKZ5VzqnK0V97pKa1Y46+g8u8pZ9QCgqkjJU1Yqmbr7rnJL534A5TnlCeWmvP+FgnL/8iDHCMdQAEegI8Ax0OF3/lNH1/NjHe0ddez6Z+wnlaP2/fZ99jR7on2CPd6WYQ+zt7Wln822pdlSbUm2SbYEW4Ctk63DqaOey5+zua+gbMyp8fzX0EpwQb1eVJo+RtyTyzAOxz+1959v4bUr0vS5rPZdoVKtF8hH8VWGKecUdWX3p2vQvf+qTBf/5v8M6kv+1I/60wAaCFPJl0ZSEAVTCIVSGEyD6RROERRJUTQKZkAqRVMMxVIcjaZ4SIOZNIE+o0SaSJNoMsyC2TSFkiiZUmgqzKFe0gvmkh/Mo1zKo9WUTwW0BuZTIa2ldVRE62mD3v1NsAAW0mbaQltpG22nYtoBi2Ax7dSuKKHd2hmlkA4ZdIJOah6cJRvZqTf1oUE0hu7RfXpAD6lMu+cUna7pPg6AHA7kwTwEciGPgziYQ2A1h3IY5HM4R0ABR8IajoJCHsXRsJZjYB0UcSzH8WiO5zE8lhN4HBTzx/wJ7OCPYKdmVwnshj1QCnt5PPwK+7QnJ8IhngSHeTJP4SROhiPwGxzlqbyap8Exng5l2sGpcJzT4ITenVM8k1PgNM/i2Zpic7W35/MCOANneSEvgktQAZfhCi+Gq3ANrnO6JsdNuAW3OQPu8Of8BdzlL6GSv+J8/hqRlyDxN/wtL+XvkFHQjZdxAS9Hd3wGn5UgXsOF2BAbYWN8idfyOs2PIs3bppqRETISX8c3sBm+iW9JsIRgc2whQ2UYb+CN4ie9NZVbSaiEYWtsI32kL76NbfEdbIftsQNv4s3iL/14C2+VOBmtqTsAO+K7MlAGYSd8DzvLCOyC78tw+ZC38XYuxq74gcRILHbD7hIpURIggTJKorGHpvc+PsAHNdcO8xHsib1ksAzhi3wJfdGPK/iyxMsY7M1XZCxf5WsYi3GaeQmYLL6Y+hexzr2F";
        // var compressed = base64Compressed.dataByDecodingBase64();
        // var output = Zlib.uncompress(compressed);
        // var base64Output = output.base64StringRepresentation();
        // TKAssertEquals(base64Output, "AOoAgAAGAGoAAAACAA0AfgCgAKwArQC/AMYAzwDmAO8A/gEPAREBJQEnATABUwFfAWcBfgF/AY8BkgGhAbAB8AH/AhsCNwJZArwCxwLJAt0C8wMBAwMDCQMPAyMDigOMA5IDoQOwA7kDyQPOA9ID1gQlBC8ERQRPBGIEbwR5BIYEzgTXBOEE9QUBBRAFEx4BHj8ehR7xHvMe+R9NIAsgESAVIB4gIiAnIDAgMyA6IDwgRCB0IH8gpCCqIKwgsSC6IL0hBSETIRYhIiEmIS4hXiICIgYiDyISIhoiHiIrIkgiYCJlJcruAvbD+wT+///9//8AAAAAAAIADQAgAKAAoQCtAK4AwADHANAA5wDwAP8BEAESASYBKAExAVQBYAFoAX8BjwGSAaABrwHwAfoCGAI3AlkCvALGAskC2ALzAwADAwMJAw8DIwOEA4wDjgOTA6MDsQO6A8oD0QPWBAAEJgQwBEYEUARjBHAEegSIBM8E2ATiBPYFAgURHgAePh6AHqAe8h70H00gACAQIBMgFyAgICUgMCAyIDkgPCBEIHQgfyCjIKYgqyCxILkgvCEFIRMhFiEiISYhLiFbIgIiBiIPIhEiGiIeIisiSCJgImQlyu4B9sP7Af7///z//wABAAD/9v/kAaX/wgGZ/8EAAAGMAAABhwAAAYMAAAGBAAABfwAAAXcAAAF5/xX/Bv8E/vf+6gG7AAAAAP5k/kMA8P3X/db9yP2z/af9pv2h/Zz9iQAA/8v/ygAAAAD9CQAA/6v8/fz6AAD8uQAA/LEAAPymAAD8oAAA/vUAAP7yAAD8SQAA5a/lb+Ug5U/ktOVN5V3hW+FXAADhVOFT4VHhSeN24UHjbuE44Qng/wAA4NoAAODV4M7gzeCG4Hngd+Bs35PgYeA135Leq9+G34Xfft9732/fU9883znb1ROfCt8GowKrAa8AAQAAAAAAAAAAAAAAAAAAAAAA2gAAAOQAAAEOAAABKAAAASgAAAEoAAABagAAAAAAAAAAAAAAAAAAAWoBdAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFiAAAAAAFqAYYAAAGeAAAAAAAAAbYAAAH+AAACJgAAAkgAAAJYAAAC4gAAAvIAAAMGAAAAAAAAAAAAAAAAAAAAAAAAAvgAAAAAAAAAAAAAAAAAAAAAAAAAAALoAAAC6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJMAk0CTgJPAlACUQCBAkgCXAJdAl4CXwJgAmEAggCDAmICYwJkAmUCZgCEAIUCZwJoAmkCagJrAmwAhgCHAncCeAJ5AnoCewJ8AIgAiQJ9An4CfwKAAoEAigJHBEcAiwJJAIwCsAKxArICswK0ArUAjQK2ArcCuAK5AroCuwK8Ar0AjgCPAr4CvwLAAsECwgLDAsQAkACRAsUCxgLHAsgCyQLKAJIAkwLZAtoC3QLeAt8C4AJKAksCUgJtAvgC+QL6AvsC1wLYAtsC3ACtAK4DUwCvA1QDVQNWALAAsQNdA14DXwCyA2ADYQCzA2IDYwC0A2QAtQNlALYDZgNnALcDaAC4ALkDaQNqA2sDbANtA24DbwNwAMMDcgNzAMQDcQDFAMYAxwDIAMkAygDLA3QAzADNA7EDegDRA3sA0gN8A30DfgN/ANMA1ADVA4EDsgOCANYDgwDXA4QDhQDYA4YA2QDaANsDhwOAANwDiAOJA4oDiwOMA40DjgDdAN4DjwOQAOkA6gDrAOwDkQDtAO4A7wOSAPAA8QDyAPMDkwD0A5QDlQD1A5YA9gOXA7MDmAEBA5kBAgOaA5sDnAOdAQMBBAEFA54DtAOfAQYBBwEIBF0DtQO2ARYBFwEYARkDtwO4A7oDuQEnASgEYgRjBFwBKQEqASsBLAEtBF4EXwEuAS8EVwRYA7sDvARJBEoBMAExBGAEYQEyATMESwRMATQBNQE2ATcBOAE5A70DvgRNBE4DvwPABGoEawRPBFABOgE7BFEEUgE8AT0BPgRbAT8BQARZBFoDwQPCA8MBQQFCBGgEaQFDAUQEZARlBFMEVARmBGcBRQPOA80DzwPQA9ED0gPTAUYBRwRVBFYD6APpAUgBSQPqA+sEbARtAUoD7ARuA+0D7gFpAWoEcARvAX8ESAGF");
        var expectation = TKExpectation.init();
        expectation.call(this.getResourceData, this, "cmap", "z", function(compressed){
            expectation.call(this.getResourceData, this, "cmap", "dat", function(expected){
                var uncompressed = Zlib.uncompress(compressed);
                TKAssertObjectEquals(uncompressed, expected);
            }, this);
        }, this);
        this.wait(expectation, 2);
    },

    testPDFSample: function(){
        var expectation = TKExpectation.init();
        expectation.call(this.getResourceData, this, "stream", "z", function(compressed){
            expectation.call(this.getResourceData, this, "stream", "dat", function(expected){
                var uncompressed = Zlib.uncompress(compressed);
                TKAssertObjectEquals(uncompressed, expected);
            }, this);
        }, this);
        this.wait(expectation, 2);
    },

    testPDFSample2: function(){
        var expectation = TKExpectation.init();
        expectation.call(this.getResourceData, this, "stream2", "z", function(compressed){
            expectation.call(this.getResourceData, this, "stream2", "dat", function(expected){
                var uncompressed = Zlib.uncompress(compressed);
                TKAssertObjectEquals(uncompressed, expected);
            }, this);
        }, this);
        this.wait(expectation, 2);
    }

});