// #import QRKit
// #import TestKit
'use strict';

JSClass("QRCodeBitstreamTests", TKTestSuite, {

    testWrite: function(){
        var bitstream = QRCodeBitstream.initWithCodewordLength(10);
        bitstream.writeBits(3, 2);
        bitstream.writeBits(12, 4);
        bitstream.writeBits(10, 4);
        bitstream.writeBits(300, 10);
        bitstream.writeBits(1234, 16);
        bitstream.writeBits(1, 5);
        var codewords = bitstream.codewords();
        TKAssertEquals(codewords.length, 6);
        TKAssertEquals(codewords[0], 0xf2);
        TKAssertEquals(codewords[1], 0x92);
        TKAssertEquals(codewords[2], 0xc0);
        TKAssertEquals(codewords[3], 0x4d);
        TKAssertEquals(codewords[4], 0x20);
        TKAssertEquals(codewords[5], 0x80);
    }

});