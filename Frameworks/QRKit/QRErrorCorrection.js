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

    errorBlocksForDataBlocks: function(dataBlocks){
        var length = errorCodewordCounts[this.level][this.version];
        var errorCodewords = JSData.initWithLength(length);
        var errorBlocks = this.blocksOfCodewords(errorCodewords);
        var dataBlock;
        var errorBlock;
        for (var i = 0, l = dataBlocks.length; i < l; ++i){
            dataBlock = dataBlocks[i];
            errorBlock = errorBlocks[i];
            // TODO: error correction
        }
        return errorBlocks;
    },

    blocksOfCodewords: function(dataCodewords){
        var blockCount = errorBlockCounts[this.level][this.version];
        var smallCodewordCount = Math.floor(dataCodewords.length / blockCount);
        var bigCodewordCount = smallCodewordCount + 1;
        var smallBlockCount = blockCount * bigCodewordCount - dataCodewords.length;
        var bigBlockCount = blockCount - smallBlockCount;
        var dataBlocks = [];
        var i;
        var offset = 0;
        for (i = 0; i < smallBlockCount; ++i, offset += smallCodewordCount){
            dataBlocks.push(dataCodewords.subdataInRange(offset, smallCodewordCount));
        }
        for (i = 0; i < bigBlockCount; ++i, offset += bigCodewordCount){
            dataBlocks.push(dataCodewords.subdataInRange(offset, bigCodewordCount));
        }
        return dataBlocks;
    }

});

QRErrorCorrection.polynomialDivision = function(numerator, denominator){
    var remainder = numerator;
    var factor = denominator;

    var lr = bitlength(remainder);
    var ld = bitlength(factor);
    factor <<= (lr - ld);
    ld = lr;
    while (factor >= denominator){
        remainder = remainder ^ factor;
        lr = bitlength(remainder);
        factor >>= (ld - lr);
        ld = lr;
    }
    return remainder;
};

var bitlength = function(n){
    var length = 0;
    while (n > 0){
        n >>= 1;
        ++length;
    }
    return length;
};

QRErrorCorrection.Level = {
    M: 0x0,
    L: 0x1,
    H: 0x2,
    Q: 0x3
};

var errorBlockCounts = [
    [0,1,1,1,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16,17,17,18,20,21,23,25,26,28,29,31,33,35,37,38,40,43,45,47,49],
    [0,1,1,1,1,1,2,2,2,2,4,4,4,4,4,6,6,6,6,7,8,8,9,9,10,12,12,12,13,14,15,16,17,18,19,19,20,21,22,24,25],
    [0,1,1,2,4,4,4,5,6,8,8,11,11,16,16,18,16,19,21,25,25,25,34,30,32,35,37,40,42,45,48,51,54,57,60,63,66,70,74,77,81],
    [0,1,1,2,2,4,4,6,6,8,8,8,10,12,16,12,17,16,18,21,20,23,23,25,27,29,34,34,35,38,40,43,45,48,51,53,56,59,62,65,68],
];

var errorCodewordCounts = [
    [0,10,16,26,36,48,64,72,88,110,130,150,176,198,216,240,280,308,338,364,416,442,476,504,560,588,644,700,728,784,812,868,924,980,1036,1064,1120,1204,1260,1316,1372],
    [0,7,10,15,20,26,36,40,48,60,72,80,96,104,120,132,144,168,180,196,224,224,252,270,300,312,336,360,390,420,450,480,510,540,570,570,600,630,660,720,750],
    [0,17,28,44,64,88,112,130,156,192,224,264,308,352,384,432,480,532,588,650,700,750,816,900,960,1050,1110,1200,1260,1350,1440,1530,1620,1710,1800,1890,1980,2100,2220,2310,2430],
    [0,13,22,36,52,72,96,108,132,160,192,224,260,288,320,360,408,448,504,546,600,644,690,750,810,870,952,1020,1050,1140,1200,1290,1350,1440,1530,1590,1680,1770,1860,1950,2040],
];

})();