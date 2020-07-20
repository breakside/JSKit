// #import QRKit
// #import TestKit
'use strict';

JSClass("QRErrorCorrectionTests", TKTestSuite, {

    testPolynomialDivision: function(){
        var remainder = QRErrorCorrection.polynomialDivision(0x7000, 0x1F25);
        TKAssertEquals(remainder, 0xC94);
        remainder = QRErrorCorrection.polynomialDivision(0x1400, 0x537);
        TKAssertEquals(remainder, 0xDC);
        remainder = QRErrorCorrection.polynomialDivision(0xF59, 0x537);
        TKAssertExactEquals(remainder, 0x0);
    },

    _testNumericExample: function(){
        var dataCodewords = JSData.initWithArray([0x10,0x20,0x0C,0x56,0x61,0x80,0xEC,0x11,0xEC,0x11,0xEC,0x11,0xEC,0x11,0xEC,0x11]);
        var errorCorrection = QRErrorCorrection.initWithVersion(1, QRErrorCorrection.Level.M);
        var dataBlocks = errorCorrection.blocksOfCodewords(dataCodewords);
        TKAssertEquals(dataBlocks.length, 1);
        TKAssertObjectEquals(dataBlocks[0], dataCodewords);
        var errorBlocks = errorCorrection.errorBlocksForDataBlocks(dataBlocks);
        TKAssertEquals(errorBlocks.length, 1);
        var errorCodewords = errorBlocks[0];
        TKAssertEquals(errorCodewords.length, 10);
        TKAssertEquals(errorCodewords[0], 0xA5);
        TKAssertEquals(errorCodewords[1], 0x24);
        TKAssertEquals(errorCodewords[2], 0xD4);
        TKAssertEquals(errorCodewords[3], 0xC1);
        TKAssertEquals(errorCodewords[4], 0xED);
        TKAssertEquals(errorCodewords[5], 0x36);
        TKAssertEquals(errorCodewords[6], 0xC7);
        TKAssertEquals(errorCodewords[7], 0x87);
        TKAssertEquals(errorCodewords[8], 0x2C);
        TKAssertEquals(errorCodewords[9], 0x55);
    }

});