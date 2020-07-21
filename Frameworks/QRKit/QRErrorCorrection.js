// #import Foundation
'use strict';

(function(){

JSClass("QRErrorCorrection", JSObject, {

    version: null,
    level: null,

    initWithVersion: function(version, level){
        this.version = version;
        this.level = level;
    },

    blocksOfCodewords: function(dataCodewords){
        // As the array of data codewords (bytes) gets longer, it needs to be broken up
        // into a number of blocks, depending on the QR version and error
        // correction level as defined in the QR spec.
        //
        // If the number of codewords is evenly divisible by the number of
        // blocks, all the blocks have the same size.  If not evenly divisible,
        // there will be two sizes of blocks, which we call "small" and "big".
        // The two block sizes differ by just one codeword/byte.
        //
        // Using the given number of blocks, total codeword length, and the above
        // relationships, we can solve for the number of small block, number of
        // big blocks, and the number of codewords in each block
        var numberOfBlocks = numberOfErrorBlocksByLevelAndVersion[this.level][this.version];
        var numberOfCodewordsInSmallBlock = Math.floor(dataCodewords.length / numberOfBlocks);
        var numberOfCodewordsInBigBlock = numberOfCodewordsInSmallBlock + 1;
        var numberOfSmallBlocks = numberOfBlocks * numberOfCodewordsInBigBlock - dataCodewords.length;
        var numberOfBigBlocks = numberOfBlocks - numberOfSmallBlocks;
        var dataBlocks = [];
        var i;
        var offset = 0;
        for (i = 0; i < numberOfSmallBlocks; ++i, offset += numberOfCodewordsInSmallBlock){
            dataBlocks.push(dataCodewords.subdataInRange(JSRange(offset, numberOfCodewordsInSmallBlock)));
        }
        for (i = 0; i < numberOfBigBlocks; ++i, offset += numberOfCodewordsInBigBlock){
            dataBlocks.push(dataCodewords.subdataInRange(JSRange(offset, numberOfCodewordsInBigBlock)));
        }
        return dataBlocks;
    },

    errorBlocksForDataBlocks: function(dataBlocks){
        // We should end up with an error block for each data block
        // The size of (number of codewords in) each error block is given by
        // the QR spec depending on the QR version and error level.
        var errorBlocks = [];
        var length = numberOfErrorCodewordsByLevelAndVersion[this.level][this.version];
        var errorCodewords = JSData.initWithLength(length);
        var numberOfCodewordsInErrorBlock = length / dataBlocks.length;
        var i, l;
        var j, k;
        var dataBlock;
        var errorBlock;
        var errorCodewordOffset = 0;
        var generatorPolynomial = generatorPolynomials[numberOfCodewordsInErrorBlock];
        var remainder;
        for (i = 0, l = dataBlocks.length; i < l; ++i, errorCodewordOffset += numberOfCodewordsInErrorBlock){
            dataBlock = dataBlocks[i];
            remainder = QRPolynomial.divide(dataBlock.increasedByLength(generatorPolynomial.length - 1), generatorPolynomial);
            errorBlock = errorCodewords.subdataInRange(JSRange(errorCodewordOffset, numberOfCodewordsInErrorBlock));
            for (j = remainder.length - 1, k = errorBlock.length - 1; j >=0; --j, --k){
                errorBlock[k] = remainder[j];
            }
            errorBlocks.push(errorBlock);
        }
        return errorBlocks;
    }

});

JSGlobalObject.QRGalois = {

    modulo: 0x11D,

    divide: function(numerator, denominator){
        var remainder = numerator;
        var dividend = denominator;
        var lr = QRGalois.bitlength(remainder);
        var ld = QRGalois.bitlength(dividend);
        dividend <<= (lr - ld);
        ld = lr;
        while (dividend >= denominator){
            remainder = remainder ^ dividend;
            lr = QRGalois.bitlength(remainder);
            dividend >>= (ld - lr);
            ld = lr;
        }
        return remainder;
    },

    multiply: function(a, b){
        var product = 0;
        while (a > 0 && b > 0){
            if (b & 0x01){
                product ^= a;
            }
            if (a & 0x80){
                a = (a << 1) ^ QRGalois.modulo;
            }else{
                a <<= 1;
            }
            b >>= 1;
        }
        return product;
    },

    bitlength: function(n){
        var length = 0;
        while (n > 0){
            n >>= 1;
            ++length;
        }
        return length;
    }

};

JSGlobalObject.QRPolynomial = {

    scale: function(polynomial, factor){
        var result = JSData.initWithCopyOfData(polynomial);
        for (var i = 0, l = result.length; i < l; ++i){
            result[i] = QRGalois.multiply(result[i], factor);
        }
        return result;
    },

    add: function(a, b){
        var result;
        var addition;
        if (a.length >= b.length){
            result = JSData.initWithCopyOfData(a);
            addition = b;
        }else{
            result = JSData.initWithCopyOfData(b);
            addition = a;
        }
        for (var i = addition.length - 1, j = result.length - 1; i >= 0; --i, --j){
            result[j] = result[j] ^ addition[i];
        }
        return result;
    },

    multiply: function(a, b){
        var result = JSData.initWithLength(a.length + b.length - 1);
        var a0 = a.length - 1;
        var b0 = b.length - 1;
        var r0 = result.length - 1;
        var k;
        var c;
        for (var i = 0; i <= a0; ++i){
            for (var j = 0; j <= b0; ++j){
                k = i + j;
                c = QRGalois.multiply(a[a0 - i], b[b0 - j]);
                result[r0 - k] = result[r0 - k] ^ c;
            }
        }
        return result;
    },

    divide: function(numerator, denominator){
        var out = JSData.initWithCopyOfData(numerator);
        var nl = numerator.length;
        var dl = denominator.length;
        var c;
        for (var i = 0; i < nl - (dl - 1); ++i){
            c = out[i];
            if (c !== 0){
                for (var j = 1; j < dl; ++j){
                    if (denominator[j] !== 0){
                        out[i + j] = out[i + j] ^ QRGalois.multiply(denominator[j], c);
                    }
                }
            }
        }
        var rl = dl - 1;
        var ol = out.length;
        return out.subdataInRange(JSRange(ol - rl, rl));
    }

};

QRErrorCorrection.Level = {
    M: 0x0,
    L: 0x1,
    H: 0x2,
    Q: 0x3
};

var numberOfErrorBlocksByLevelAndVersion = [
    [0,1,1,1,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16,17,17,18,20,21,23,25,26,28,29,31,33,35,37,38,40,43,45,47,49],
    [0,1,1,1,1,1,2,2,2,2,4,4,4,4,4,6,6,6,6,7,8,8,9,9,10,12,12,12,13,14,15,16,17,18,19,19,20,21,22,24,25],
    [0,1,1,2,4,4,4,5,6,8,8,11,11,16,16,18,16,19,21,25,25,25,34,30,32,35,37,40,42,45,48,51,54,57,60,63,66,70,74,77,81],
    [0,1,1,2,2,4,4,6,6,8,8,8,10,12,16,12,17,16,18,21,20,23,23,25,27,29,34,34,35,38,40,43,45,48,51,53,56,59,62,65,68],
];

var numberOfErrorCodewordsByLevelAndVersion = [
    [0,10,16,26,36,48,64,72,88,110,130,150,176,198,216,240,280,308,338,364,416,442,476,504,560,588,644,700,728,784,812,868,924,980,1036,1064,1120,1204,1260,1316,1372],
    [0,7,10,15,20,26,36,40,48,60,72,80,96,104,120,132,144,168,180,196,224,224,252,270,300,312,336,360,390,420,450,480,510,540,570,570,600,630,660,720,750],
    [0,17,28,44,64,88,112,130,156,192,224,264,308,352,384,432,480,532,588,650,700,750,816,900,960,1050,1110,1200,1260,1350,1440,1530,1620,1710,1800,1890,1980,2100,2220,2310,2430],
    [0,13,22,36,52,72,96,108,132,160,192,224,260,288,320,360,408,448,504,546,600,644,690,750,810,870,952,1020,1050,1140,1200,1290,1350,1440,1530,1590,1680,1770,1860,1950,2040],
];

var generatorPolynomials = [
    null,
    JSData.initWithArray([1,1]),
    JSData.initWithArray([1,3,2]),
    JSData.initWithArray([1,7,14,8]),
    JSData.initWithArray([1,15,54,120,64]),
    JSData.initWithArray([1,31,198,63,147,116]),
    JSData.initWithArray([1,63,1,218,32,227,38]),
    JSData.initWithArray([1,127,122,154,164,11,68,117]),
    JSData.initWithArray([1,255,11,81,54,239,173,200,24]),
    JSData.initWithArray([1,226,207,158,245,235,164,232,197,37]),
    JSData.initWithArray([1,216,194,159,111,199,94,95,113,157,193]),
    JSData.initWithArray([1,172,130,163,50,123,219,162,248,144,116,160]),
    JSData.initWithArray([1,68,119,67,118,220,31,7,84,92,127,213,97]),
    JSData.initWithArray([1,137,73,227,17,177,17,52,13,46,43,83,132,120]),
    JSData.initWithArray([1,14,54,114,70,174,151,43,158,195,127,166,210,234,163]),
    JSData.initWithArray([1,29,196,111,163,112,74,10,105,105,139,132,151,32,134,26]),
    JSData.initWithArray([1,59,13,104,189,68,209,30,8,163,65,41,229,98,50,36,59]),
    JSData.initWithArray([1,119,66,83,120,119,22,197,83,249,41,143,134,85,53,125,99,79]),
    JSData.initWithArray([1,239,251,183,113,149,175,199,215,240,220,73,82,173,75,32,67,217,146]),
    JSData.initWithArray([1,194,8,26,146,20,223,187,152,85,115,238,133,146,109,173,138,33,172,179]),
    JSData.initWithArray([1,152,185,240,5,111,99,6,220,112,150,69,36,187,22,228,198,121,121,165,174]),
    JSData.initWithArray([1,44,243,13,131,49,132,194,67,214,28,89,124,82,158,244,37,236,142,82,255,89]),
    JSData.initWithArray([1,89,179,131,176,182,244,19,189,69,40,28,137,29,123,67,253,86,218,230,26,145,245]),
    JSData.initWithArray([1,179,68,154,163,140,136,190,152,25,85,19,3,196,27,113,198,18,130,2,120,93,41,71]),
    JSData.initWithArray([1,122,118,169,70,178,237,216,102,115,150,229,73,130,72,61,43,206,1,237,247,127,217,144,117]),
    JSData.initWithArray([1,245,49,228,53,215,6,205,210,38,82,56,80,97,139,81,134,126,168,98,226,125,23,171,173,193]),
    JSData.initWithArray([1,246,51,183,4,136,98,199,152,77,56,206,24,145,40,209,117,233,42,135,68,70,144,146,77,43,94]),
    JSData.initWithArray([1,240,61,29,145,144,117,150,48,58,139,94,134,193,105,33,169,202,102,123,113,195,25,213,6,152,164,217]),
    JSData.initWithArray([1,252,9,28,13,18,251,208,150,103,174,100,41,167,12,247,56,117,119,233,127,181,100,121,147,176,74,58,197]),
    JSData.initWithArray([1,228,193,196,48,170,86,80,217,54,143,79,32,88,255,87,24,15,251,85,82,201,58,112,191,153,108,132,143,170]),
    JSData.initWithArray([1,212,246,77,73,195,192,75,98,5,70,103,177,22,217,138,51,181,246,72,25,18,46,228,74,216,195,11,106,130,150]),
]; // We only go up to generator 30...do we need any more?  Doesn't seem like it based on calculations, but spec goes up to 68

})();