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
// #import "QRCodeBitstream.js"
// #import "QRCodeDrawing.js"
// #import "QRErrorCorrection.js"
'use strict';

(function(){

JSClass("QRCode", JSObject, {

    mode: null,
    content: null,
    characterLength: null,
    version: null,
    errorCorrection: QRErrorCorrection.Level.M,

    initWithURL: function(url){
        this.initWithString(url.encodedString);
    },

    initWithString: function(string, encoding){
        if (encoding === undefined){
            encoding = String.Encoding.utf8;
        }
        if (string.match(/^[0-9]+$/)){
            this.content = string;
            this.mode = QRCode.Mode.numeric;
            this.characterLength = this.content.length;
        }else if (string.match(/^[0-9A-Z \$%\*\+\-\.\/\:]+$/)){
            this.content = string;
            this.mode = QRCode.Mode.alphanumeric;
            this.characterLength = this.content.length;
        }else{
            return this.initWithData(string.dataUsingEncoding(encoding));
        }
        this._determineVersion();
        if (this.version === 0){
            return null;
        }
        if (this.version > 40){
            return null;
        }
    },

    initWithData: function(data){
        this.content = data;
        this.mode = QRCode.Mode.byte;
        this.characterLength = this.content.length;
        this._determineVersion();
        if (this.version === 0){
            return null;
        }
        if (this.version > 40){
            return null;
        }
    },

    _determineVersion: function(){
        var searcher = JSBinarySearcher(characterCapacities[this.mode][this.errorCorrection], function(a, b){
            return a - b;
        });
        this.version = searcher.insertionIndexForValue(this.characterLength);
    },

    dataCodewords: function(){
        // Figure out which version we need an how much capacity it has
        var dataCapacity = dataCapacities[this.errorCorrection][this.version];

        // Create a bitstream for the data codewords
        var dataBitstream = QRCodeBitstream.initWithCodewordLength(dataCapacity);
        dataBitstream.writeBits(this.mode, 4);

        // Encode content depending on mode
        var i, l;
        var s, n;
        if (this.mode === QRCode.Mode.byte){
            // Bytes are written as-is with an 8 or 16 bit length prefix
            dataBitstream.writeBits(this.characterLength, this.version <= 9 ? 8 : 16);
            for (i = 0, l = this.content.length; i < l; ++i){
                dataBitstream.writeBits(this.content[i], 8);
            }
        }else if (this.mode === QRCode.Mode.numeric){
            // number strings are mapped every 3 digits to 10 bits, with a 10, 12, or 14 bit length prefix
            dataBitstream.writeBits(this.characterLength, this.version <= 9 ? 10 : (this.version <= 26 ? 12 : 14));
            for (i = 0, l = this.content.length; i < l; i += 3){
                s = this.content.substr(i, 3);
                n = parseInt(s);
                if (s.length === 3){
                    dataBitstream.writeBits(n, 10);
                }else if (s.length === 2){
                    // A final set of 2 digits are encoded as 7 bits
                    dataBitstream.writeBits(n, 7);
                }else{
                    // A final lone digit is encoded as 4 bits
                    dataBitstream.writeBits(n, 4);
                }
            }
        }else if (this.mode === QRCode.Mode.alphanumeric){
            // alphanumeric strings are mapped every 2 chars to 11 bits, with a 9, 11, or 13 bit length prefix
            dataBitstream.writeBits(this.characterLength, this.version <= 9 ? 9 : (this.version <= 26 ? 11 : 13));
            for (i = 0, l = this.content.length; i < l; i += 2){
                if (i < l - 1){
                    n = alphanumericLookup[this.content[i]] * 45 + alphanumericLookup[this.content[i + 1]];
                    dataBitstream.writeBits(n, 11);
                }else{
                    // A final lone char is encoded as 6 bits
                    n = alphanumericLookup[this.content[i]];
                    dataBitstream.writeBits(n, 6);
                }
            }
        }

        // Terminator
        dataBitstream.writeBits(0x00, 4);

        // Padding
        dataBitstream.pad();

        return dataBitstream.codewords();
    },

    prepareDrawing: function(){
        // Get the data codwords
        var dataCodewords = this.dataCodewords();

        // Add error correction codewords, dividing into blocks as required for version
        var errorCorrection = QRErrorCorrection.initWithVersion(this.version, this.errorCorrection);
        var dataBlocks = errorCorrection.blocksOfCodewords(dataCodewords);
        var errorBlocks = errorCorrection.errorBlocksForDataBlocks(dataBlocks);

        // Create a drawing for our version
        var drawing = QRCodeDrawing.initWithVersion(this.version);

        // Write the data and error blocks according to the spec
        // - Data block 1, codeword 1
        // - Data block 2, codeword 1
        // - Data block N, codeword 1,
        // - Data block 1, codeword 2
        // - Data block 2, codeword 2
        // - Data block N, codeword 2
        // - Data block 1, codeword M
        // - Data block 2, codeword M
        // - Data block N, codeword M
        // - ... same interleaving of blocks for errors
        //
        // Note: blocks may not be the same size, but the smaller ones will
        // always come before the larger ones
        var block;
        var codewordIndex, codewordLength;
        var blockIndex, blockLength;
        for (codewordIndex = 0, codewordLength = dataBlocks[dataBlocks.length - 1].length; codewordIndex < codewordLength; ++codewordIndex){
            for (blockIndex = 0, blockLength = dataBlocks.length; blockIndex < blockLength; ++blockIndex){
                block = dataBlocks[blockIndex];
                if (codewordIndex < block.length){
                    drawing.drawByte(block[codewordIndex]);
                }
            }
        }

        for (codewordIndex = 0, codewordLength = errorBlocks[errorBlocks.length - 1].length; codewordIndex < codewordLength; ++codewordIndex){
            for (blockIndex = 0, blockLength = errorBlocks.length; blockIndex < blockLength; ++blockIndex){
                block = errorBlocks[blockIndex];
                if (codewordIndex < block.length){
                    drawing.drawByte(block[codewordIndex]);
                }
            }
        }

        // Mask the drawing
        var mask = drawing.applyOptimalMask();

        // Set the format bits
        var format = ((this.errorCorrection << 3) | mask) << 10;
        format = format | QRErrorCorrection.BCH15_5(format, 0x537);
        format = format ^ 0x5412;
        drawing.drawFormat(format);

        // Set the version bits (no-op on version < 7)
        var version = this.version << 12;
        version = version | QRErrorCorrection.Golay18_6(version, 0x1F25);
        drawing.drawVersion(version);

        return drawing;
    }

});


QRCode.Mode = {
    extendedChannelInterpretation: 0x7,
    numeric: 0x1,
    alphanumeric: 0x2,
    byte: 0x4
};


var dataCapacities = [
    [0,16,28,44,64,86,108,124,154,182,216,254,290,334,365,415,453,507,563,627,669,714,782,860,914,1000,1062,1128,1193,1267,1373,1455,1541,1631,1725,1812,1914,1992,2102,2216,2334],
    [0,19,34,55,80,108,136,156,194,232,274,324,370,428,461,523,589,647,721,795,861,932,1006,1094,1174,1276,1370,1468,1531,1631,1735,1843,1955,2071,2191,2306,2434,2566,2702,2812,2956],
    [0,9,16,26,36,46,60,66,86,100,122,140,158,180,197,223,253,283,313,341,385,406,442,464,514,538,596,628,661,701,745,793,845,901,961,986,1054,1096,1142,1222,1276],
    [0,13,22,34,48,62,76,88,110,132,154,180,206,244,261,295,325,367,397,445,485,512,568,614,664,718,754,808,871,911,985,1033,1115,1171,1231,1286,1354,1426,1502,1582,1666],
];

var characterCapacities = {};
characterCapacities[QRCode.Mode.byte] = [
    [0,14,26,42,62,84,106,122,152,180,213,251,287,331,362,412,450,504,560,624,666,711,779,857,911,997,1059,1125,1190,1264,1370,1452,1538,1628,1722,1809,1911,1989,2099,2213,2331],
    [0,17,32,53,78,106,134,154,192,230,271,321,367,425,458,520,586,644,718,792,858,929,1003,1091,1171,1273,1367,1465,1528,1628,1732,1840,1952,2068,2188,2303,2431,2563,2699,2809,2953],
    [0,7,14,24,34,44,58,64,84,98,119,137,155,177,194,220,250,280,310,338,382,403,439,461,511,535,593,625,658,698,742,790,842,898,958,983,1051,1093,1139,1219,1273],
    [0,11,20,32,46,60,74,86,108,130,151,177,203,241,258,292,322,364,394,442,483,509,565,611,661,715,751,805,868,908,982,1030,1112,1168,1228,1283,1351,1423,1499,1579,1663],
];
characterCapacities[QRCode.Mode.numeric] = [
    [0,34,63,101,149,202,255,293,365,432,513,604,691,796,871,991,1082,1212,1346,1500,1600,1708,1872,2059,2188,2395,2544,2701,2857,3035,3289,3486,3693,3909,4134,4343,4588,4775,5039,5313,5596],
    [0,41,77,127,187,255,322,370,461,552,652,772,883,1022,1101,1250,1408,1548,1725,1903,2061,2232,2409,2620,2812,3057,3283,3517,3669,3909,4158,4417,4686,4965,5252,5529,5836,6153,6479,6743,7089],
    [0,17,34,58,82,106,139,154,202,235,288,331,374,427,468,530,602,674,746,813,919,969,1056,1108,1228,1286,1425,1501,1581,1677,1782,1897,2022,2157,2301,2361,2524,2625,2735,2927,3057],
    [0,27,48,77,111,144,178,207,259,312,364,427,489,580,621,703,775,876,948,1063,1159,1224,1358,1468,1588,1718,1804,1933,2085,2181,2358,2473,2670,2805,2949,3081,3244,3417,3599,3791,3993],
];
characterCapacities[QRCode.Mode.alphanumeric] = [
    [0,20,38,61,90,122,154,178,221,262,311,366,419,483,528,600,656,734,816,909,970,1035,1134,1248,1326,1451,1542,1637,1732,1839,1994,2113,2238,2369,2506,2632,2780,2894,3054,3220,3391],
    [0,25,47,77,114,154,195,224,279,335,395,468,535,619,667,758,854,938,1046,1153,1249,1352,1460,1588,1704,1853,1990,2132,2223,2369,2520,2677,2840,3009,3183,3351,3537,3729,3927,4087,4296],
    [0,10,20,35,50,64,84,93,122,143,174,200,227,259,283,321,365,408,452,493,557,587,640,672,744,779,864,910,958,1016,1080,1150,1226,1307,1394,1431,1530,1591,1591,1774,1852],
    [0,16,29,47,67,87,108,125,157,189,221,259,296,352,376,426,470,531,574,644,702,742,823,890,963,1041,1094,1172,1263,1322,1429,1499,1618,1700,1787,1867,1966,2071,2181,2298,2420],
];

var alphanumericLookup = {
    "0": 0,
    "1": 1,
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "A": 10,
    "B": 11,
    "C": 12,
    "D": 13,
    "E": 14,
    "F": 15,
    "G": 16,
    "H": 17,
    "I": 18,
    "J": 19,
    "K": 20,
    "L": 21,
    "M": 22,
    "N": 23,
    "O": 24,
    "P": 25,
    "Q": 26,
    "R": 27,
    "S": 28,
    "T": 29,
    "U": 30,
    "V": 31,
    "W": 32,
    "X": 33,
    "Y": 34,
    "Z": 35,
    " ": 36,
    "$": 37,
    "%": 38,
    "*": 39,
    "+": 40,
    "-": 41,
    ".": 42,
    "/": 43,
    ":": 44
};

})();