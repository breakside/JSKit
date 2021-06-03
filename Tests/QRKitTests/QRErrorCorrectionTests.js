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

// #import QRKit
// #import TestKit
'use strict';

JSClass("QRGaloisTests", TKTestSuite, {

    testDivide: function(){
        var remainder = QRGalois.divide(0x7000, 0x1F25);
        TKAssertEquals(remainder, 0xC94);
        remainder = QRGalois.divide(0x1400, 0x537);
        TKAssertEquals(remainder, 0xDC);
        remainder = QRGalois.divide(0xF59, 0x537);
        TKAssertExactEquals(remainder, 0x0);
        remainder = QRGalois.divide(0x147A, 0x11D);
        TKAssertExactEquals(remainder, 0xC3);
    },

    testMultiply: function(){
        var product = QRGalois.multiply(2, 2);
        TKAssertEquals(product, 4);
        product = QRGalois.multiply(128, 2);
        TKAssertEquals(product, 29);
    },

    testBitlength: function(){
        var length = QRGalois.bitlength(0);
        TKAssertEquals(length, 0);
        length = QRGalois.bitlength(1);
        TKAssertEquals(length, 1);
        length = QRGalois.bitlength(2);
        TKAssertEquals(length, 2);
        length = QRGalois.bitlength(3);
        TKAssertEquals(length, 2);
        length = QRGalois.bitlength(4);
        TKAssertEquals(length, 3);
        length = QRGalois.bitlength(5);
        TKAssertEquals(length, 3);
        length = QRGalois.bitlength(6);
        TKAssertEquals(length, 3);
        length = QRGalois.bitlength(7);
        TKAssertEquals(length, 3);
        length = QRGalois.bitlength(8);
        TKAssertEquals(length, 4);
    }

});

JSClass("QRPolynomialTests", TKTestSuite, {

    testAdd: function(){
        var a = JSData.initWithArray([0x1, 0x2, 0x3]);
        var b = JSData.initWithArray([0x4, 0x5]);
        var result = QRPolynomial.add(a, b);
        TKAssertEquals(result.length, 3);
        TKAssertEquals(result[0], 0x1);
        TKAssertEquals(result[1], 0x6);
        TKAssertEquals(result[2], 0x6);
        a = JSData.initWithArray([250, 250, 250]);
        b = JSData.initWithArray([0x4, 0x5]);
        result = QRPolynomial.add(a, b);
        TKAssertEquals(result.length, 3);
        TKAssertEquals(result[0], 250);
        TKAssertEquals(result[1], 254);
        TKAssertEquals(result[2], 255);
        a = JSData.initWithArray([255, 255, 255]);
        b = JSData.initWithArray([0x4, 0x5]);
        result = QRPolynomial.add(a, b);
        TKAssertEquals(result.length, 3);
        TKAssertEquals(result[0], 255);
        TKAssertEquals(result[1], 251);
        TKAssertEquals(result[2], 250);
    },

    testScale: function(){
        var a = JSData.initWithArray([0x1, 0x2, 0xFF, 0x7F]);
        var result = QRPolynomial.scale(a, 1);
        TKAssertEquals(result.length, 4);
        TKAssertEquals(result[0], 1);
        TKAssertEquals(result[1], 2);
        TKAssertEquals(result[2], 255);
        TKAssertEquals(result[3], 127);
        result = QRPolynomial.scale(a, 2);
        TKAssertEquals(result.length, 4);
        TKAssertEquals(result[0], 2);
        TKAssertEquals(result[1], 4);
        TKAssertEquals(result[2], 227);
        TKAssertEquals(result[3], 254);
        result = QRPolynomial.scale(a, 3);
        TKAssertEquals(result.length, 4);
        TKAssertEquals(result[0], 3);
        TKAssertEquals(result[1], 6);
        TKAssertEquals(result[2], 28);
        TKAssertEquals(result[3], 129);
        result = QRPolynomial.scale(a, 255);
        TKAssertEquals(result.length, 4);
        TKAssertEquals(result[0], 255);
        TKAssertEquals(result[1], 227);
        TKAssertEquals(result[2], 226);
        TKAssertEquals(result[3], 128);
    },

    testMultiply: function(){
        var a = JSData.initWithArray([0x1, 0x2, 0x3]);
        var b = JSData.initWithArray([0x4, 0x5]);
        var result = QRPolynomial.multiply(a, b);
        TKAssertEquals(result.length, 4);
        TKAssertEquals(result[0], 4);
        TKAssertEquals(result[1], 13);
        TKAssertEquals(result[2], 6);
        TKAssertEquals(result[3], 15);
        a = JSData.initWithArray([0x1, 0x2, 0x3]);
        b = JSData.initWithArray([0xFF, 0x7F, 0xFF, 0x7F]);
        result = QRPolynomial.multiply(a, b);
        TKAssertEquals(result.length, 6);
        TKAssertEquals(result[0], 255);
        TKAssertEquals(result[1], 156);
        TKAssertEquals(result[2], 29);
        TKAssertEquals(result[3], 29);
        TKAssertEquals(result[4], 226);
        TKAssertEquals(result[5], 129);
    },

    testDivide: function(){
        var a = JSData.initWithArray([0x12, 0x34, 0x56, 0x00, 0x00, 0x00, 0x00]);
        var b = JSData.initWithArray([0x01, 0x0f, 0x36, 0x78, 0x40]);
        var remainder = QRPolynomial.divide(a, b);
        TKAssertEquals(remainder.length, 4);
        TKAssertEquals(remainder[0], 0x37);
        TKAssertEquals(remainder[1], 0xe6);
        TKAssertEquals(remainder[2], 0x78);
        TKAssertEquals(remainder[3], 0xd9);

        a = JSData.initWithArray([0x10,0x20,0x0C,0x56,0x61,0x80,0xEC,0x11,0xEC,0x11,0xEC,0x11,0xEC,0x11,0xEC,0x11]);
        b = JSData.initWithArray([1,216,194,159,111,199,94,95,113,157,193]);
        remainder = QRPolynomial.divide(a, b);
        TKAssertEquals(remainder.length, 10);
        TKAssertEquals(remainder[0], 0x75);
        TKAssertEquals(remainder[1], 0x89);
        TKAssertEquals(remainder[2], 0x26);
        TKAssertEquals(remainder[3], 0x8D);
        TKAssertEquals(remainder[4], 0x76);
        TKAssertEquals(remainder[5], 0x2C);
        TKAssertEquals(remainder[6], 0x05);
        TKAssertEquals(remainder[7], 0x9B);
        TKAssertEquals(remainder[8], 0x38);
        TKAssertEquals(remainder[9], 0xDD);
    }

});

JSClass("QRErrorCorrectionTests", TKTestSuite, {

    testCodewordBlocks: function(){
        var code = QRCode.initWithData(JSData.initWithLength(100));
        TKAssertEquals(code.version, 6);
        var codewords = code.dataCodewords();
        var errorCorrection = QRErrorCorrection.initWithVersion(code.version, code.errorCorrectionLevel);
        var blocks = errorCorrection.blocksOfCodewords(codewords);
        TKAssertEquals(blocks.length, 4);
        TKAssertEquals(blocks[0].length, 27);
        TKAssertEquals(blocks[1].length, 27);
        TKAssertEquals(blocks[2].length, 27);
        TKAssertEquals(blocks[3].length, 27);
    },

    testErrorBlocks: function(){
        var code = QRCode.initWithData(JSData.initWithLength(100));
        TKAssertEquals(code.version, 6);
        var codewords = code.dataCodewords();
        var errorCorrection = QRErrorCorrection.initWithVersion(code.version, code.errorCorrectionLevel);
        var dataBlocks = errorCorrection.blocksOfCodewords(codewords);
        TKAssertEquals(dataBlocks.length, 4);
        var errorBlocks = errorCorrection.errorBlocksForDataBlocks(dataBlocks);
        TKAssertEquals(errorBlocks.length, 4);
        TKAssertEquals(errorBlocks[0].length, 16);
        TKAssertEquals(errorBlocks[1].length, 16);
        TKAssertEquals(errorBlocks[2].length, 16);
        TKAssertEquals(errorBlocks[3].length, 16);
    },

    testNumericExample: function(){
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
    },

    testExample: function(){
        var dataCodewords = JSData.initWithArray([0x40, 0xd2, 0x75, 0x47, 0x76, 0x17, 0x32, 0x06, 0x27, 0x26, 0x96, 0xc6, 0xc6, 0x96, 0x70, 0xec]);
        var errorCorrection = QRErrorCorrection.initWithVersion(1, QRErrorCorrection.Level.M);
        var dataBlocks = errorCorrection.blocksOfCodewords(dataCodewords);
        TKAssertEquals(dataBlocks.length, 1);
        TKAssertObjectEquals(dataBlocks[0], dataCodewords);
        var errorBlocks = errorCorrection.errorBlocksForDataBlocks(dataBlocks);
        TKAssertEquals(errorBlocks.length, 1);
        var errorCodewords = errorBlocks[0];
        TKAssertEquals(errorCodewords.length, 10);
        TKAssertEquals(errorCodewords[0], 0xbc);
        TKAssertEquals(errorCodewords[1], 0x2a);
        TKAssertEquals(errorCodewords[2], 0x90);
        TKAssertEquals(errorCodewords[3], 0x13);
        TKAssertEquals(errorCodewords[4], 0x6b);
        TKAssertEquals(errorCodewords[5], 0xaf);
        TKAssertEquals(errorCodewords[6], 0xef);
        TKAssertEquals(errorCodewords[7], 0xfd);
        TKAssertEquals(errorCodewords[8], 0x4b);
        TKAssertEquals(errorCodewords[9], 0xe0);
    }

});