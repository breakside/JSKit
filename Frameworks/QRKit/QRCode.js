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
'use strict';

(function(){

JSClass("QRCode", JSObject, {

    mode: null,
    content: null,
    characterLength: null,
    version: null,
    errorCorrection: 0,

    initWithURL: function(url){
        this.initWithString(url.encodedString);
    },

    initWithString: function(string){
        if (string.match(/^[0-9]+$/)){
            this.content = string;
            this.mode = QRCode.Mode.numeric;
            this.characterLength = this.content.length;
        }else if (string.match(/^[0-9A-Z \$%\*\+\-\.\/\:]+$/)){
            this.content = string;
            this.mode = QRCode.Mode.alphanumeric;
            this.characterLength = this.content.length;
        }else{
            return this.initWithData(string.utf8());
        }
        this._determineVersion();
    },

    initWithData: function(data){
        this.content = data;
        this.mode = QRCode.Mode.byte;
        this.characterLength = this.content.length;
        this._determineVersion();
    },

    _determineVersion: function(){
        var searcher = JSBinarySearcher(characterCapacities[this.mode][this.errorCorrection]);
        this.version = searcher.insertionIndexForValue(this.characterLength);
    },

    prepareDrawing: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }

        // Figure out which version we need an how much capacity it has
        var dataCapacity = dataCapacities[this.version][this.errorCorrection];

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
            // number strings are mapped every 3 digits to 10 bits, with a 9, 12, or 14 bit length prefix
            dataBitstream.writeBits(this.characterLength, this.version <= 9 ? 9 : (this.version <= 26 ? 12 : 14));
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

        var dataCodewords = dataBitstream.codewords();
        var dataBlocks = [];
        var errorBlocks = [];

        // TODO: error correction

        var drawing = QRCodeDrawing.initWithVersion(this.version);

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

        var mask = drawing.mask();

        var format = (this.errorCorrection << 3) | mask;

        // TODO: error correct format

        format = format ^ 0x5412;

        drawing.drawFormat(format);

        completion.call(target, drawing);

        return drawing;
    }

});


QRCode.Mode = {
    extendedChannelInterpretation: 0x7,
    numeric: 0x1,
    alphanumeric: 0x2,
    byte: 0x4
};

QRCode.ErrorCorrection = {
    M: 0x0,
    L: 0x1,
    H: 0x2,
    Q: 0x3,
};

var dataCapacities = [
    [0,0,0,0],
    [16,19,9,13],
    [28,34,16,22],
    [44,55,26,34],
    [64,80,36,48],
    [86,108,46,62],
    [108,136,60,76],
    [124,156,66,88],
    [154,194,86,110],
    [182,232,100,132],
    [216,274,122,154],
    [254,324,140,180],
    [290,370,158,206],
    [334,428,180,244],
    [365,461,197,261],
    [415,523,223,295],
    [453,589,253,325],
    [507,647,283,367],
    [563,721,313,397],
    [627,795,341,445],
    [669,861,385,485],
    [714,932,406,512],
    [782,1006,442,568],
    [860,1094,464,614],
    [914,1174,514,664],
    [1000,1276,538,718],
    [1062,1370,596,754],
    [1128,1468,628,808],
    [1193,1531,661,871],
    [1267,1631,701,911],
    [1373,1735,745,985],
    [1455,1843,793,1033],
    [1541,1955,845,1115],
    [1631,2071,901,1171],
    [1725,2191,961,1231],
    [1812,2306,986,1286],
    [1914,2434,1054,1354],
    [1992,2566,1096,1426],
    [2102,2702,1142,1502],
    [2216,2812,1222,1582],
    [2334,2956,1276,1666],
];

var characterCapacities = {};
characterCapacities[QRCode.Mode.byte] = [[0,0,0,0],
    [14,17,7,11],
    [26,32,14,20],
    [42,53,24,32],
    [62,78,34,46],
    [84,106,44,60],
    [106,134,58,74],
    [122,154,64,86],
    [152,192,84,108],
    [180,230,98,130],
    [213,271,119,151],
    [251,321,137,177],
    [287,367,155,203],
    [331,425,177,241],
    [362,458,194,258],
    [412,520,220,292],
    [450,586,250,322],
    [504,644,280,364],
    [560,718,310,394],
    [624,792,338,442],
    [666,858,382,483],
    [711,929,403,509],
    [779,1003,439,565],
    [857,1091,461,611],
    [911,1171,511,661],
    [997,1273,535,715],
    [1059,1367,593,751],
    [1125,1465,625,805],
    [1190,1528,658,868],
    [1264,1628,698,908],
    [1370,1732,742,982],
    [1452,1840,790,1030],
    [1538,1952,842,1112],
    [1628,2068,898,1168],
    [1722,2188,958,1228],
    [1809,2303,983,1283],
    [1911,2431,1051,1351],
    [1989,2563,1093,1423],
    [2099,2699,1139,1499],
    [2213,2809,1219,1579],
    [2331,2953,1273,1663],
];
characterCapacities[QRCode.Mode.numeric] = [
    [0,0,0,0],
    [34,41,17,27],
    [63,77,34,48],
    [101,127,58,77],
    [149,187,82,111],
    [202,255,106,144],
    [255,322,139,178],
    [293,370,154,207],
    [365,461,202,259],
    [432,552,235,312],
    [513,652,288,364],
    [604,772,331,427],
    [691,883,374,489],
    [796,1022,427,580],
    [871,1101,468,621],
    [991,1250,530,703],
    [1082,1408,602,775],
    [1212,1548,674,876],
    [1346,1725,746,948],
    [1500,1903,813,1063],
    [1600,2061,919,1159],
    [1708,2232,969,1224],
    [1872,2409,1056,1358],
    [2059,2620,1108,1468],
    [2188,2812,1228,1588],
    [2395,3057,1286,1718],
    [2544,3283,1425,1804],
    [2701,3517,1501,1933],
    [2857,3669,1581,2085],
    [3035,3909,1677,2181],
    [3289,4158,1782,2358],
    [3486,4417,1897,2473],
    [3693,4686,2022,2670],
    [3909,4965,2157,2805],
    [4134,5252,2301,2949],
    [4343,5529,2361,3081],
    [4588,5836,2524,3244],
    [4775,6153,2625,3417],
    [5039,6479,2735,3599],
    [5313,6743,2927,3791],
    [5596,7089,3057,3993],
];
characterCapacities[QRCode.Mode.alphanumeric] = [
    [0,0,0,0],
    [20,25,10,16],
    [38,47,20,29],
    [61,77,35,47],
    [90,114,50,67],
    [122,154,64,87],
    [154,195,84,108],
    [178,224,93,125],
    [221,279,122,157],
    [262,335,143,189],
    [311,395,174,221],
    [366,468,200,259],
    [419,535,227,296],
    [483,619,259,352],
    [528,667,283,376],
    [600,758,321,426],
    [656,854,365,470],
    [734,938,408,531],
    [816,1046,452,574],
    [909,1153,493,644],
    [970,1249,557,702],
    [1035,1352,587,742],
    [1134,1460,640,823],
    [1248,1588,672,890],
    [1326,1704,744,963],
    [1451,1853,779,1041],
    [1542,1990,864,1094],
    [1637,2132,910,1172],
    [1732,2223,958,1263],
    [1839,2369,1016,1322],
    [1994,2520,1080,1429],
    [2113,2677,1150,1499],
    [2238,2840,1226,1618],
    [2369,3009,1307,1700],
    [2506,3183,1394,1787],
    [2632,3351,1431,1867],
    [2780,3537,1530,1966],
    [2894,3729,1591,2071],
    [3054,3927,1591,2181],
    [3220,4087,1774,2298],
    [3391,4296,1852,2420],
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