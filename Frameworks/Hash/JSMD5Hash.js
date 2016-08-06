// #import "Hash/JSIterativeHash.js"
/* global JSIterativeHash, JSGlobalObject, JSMD5Hash */
'use strict';

JSGlobalObject.JSMD5Hash = function JSMD5Hash(x){
    if (this === undefined){
        var hasher = new JSMD5Hash();
        hasher.start();
        hasher.add(x);
        hasher.finish();
        return hasher.digest();
    }
    JSIterativeHash.call(this, 64);
};

JSMD5Hash.prototype = Object.create(JSIterativeHash.prototype);

JSMD5Hash.prototype.start = function(){
    JSIterativeHash.prototype.start.call(this);
    this.words = new Uint32Array(4);
    this.words[0] = 0x67452301;
    this.words[1] = 0xefcdab89;
    this.words[2] = 0x98badcfe;
    this.words[3] = 0x10325476;
};

JSMD5Hash.prototype._hashBlock = function(block){
    var AA, BB, CC, DD;
    var X = new Uint32Array(16);
    for (var i = 0; i < 16; ++i){
        X[i] = block[i * 4 + 0] | (block[i * 4 + 1] << 8) | (block[i * 4 + 2] << 16) | (block[i * 4 + 3] << 24);
    }
    AA = this.words[0];
    BB = this.words[1];
    CC = this.words[2];
    DD = this.words[3];
    JSMD5Hash.Q(JSMD5Hash.F, this.words, 0, 1, 2, 3, X[0],  7,  JSMD5Hash.T[1]);
    JSMD5Hash.Q(JSMD5Hash.F, this.words, 3, 0, 1, 2, X[1],  12, JSMD5Hash.T[2]);
    JSMD5Hash.Q(JSMD5Hash.F, this.words, 2, 3, 0, 1, X[2],  17, JSMD5Hash.T[3]);
    JSMD5Hash.Q(JSMD5Hash.F, this.words, 1, 2, 3, 0, X[3],  22, JSMD5Hash.T[4]);
    JSMD5Hash.Q(JSMD5Hash.F, this.words, 0, 1, 2, 3, X[4],  7,  JSMD5Hash.T[5]);
    JSMD5Hash.Q(JSMD5Hash.F, this.words, 3, 0, 1, 2, X[5],  12, JSMD5Hash.T[6]);
    JSMD5Hash.Q(JSMD5Hash.F, this.words, 2, 3, 0, 1, X[6],  17, JSMD5Hash.T[7]);
    JSMD5Hash.Q(JSMD5Hash.F, this.words, 1, 2, 3, 0, X[7],  22, JSMD5Hash.T[8]);
    JSMD5Hash.Q(JSMD5Hash.F, this.words, 0, 1, 2, 3, X[8],  7,  JSMD5Hash.T[9]);
    JSMD5Hash.Q(JSMD5Hash.F, this.words, 3, 0, 1, 2, X[9],  12, JSMD5Hash.T[10]);
    JSMD5Hash.Q(JSMD5Hash.F, this.words, 2, 3, 0, 1, X[10], 17, JSMD5Hash.T[11]);
    JSMD5Hash.Q(JSMD5Hash.F, this.words, 1, 2, 3, 0, X[11], 22, JSMD5Hash.T[12]);
    JSMD5Hash.Q(JSMD5Hash.F, this.words, 0, 1, 2, 3, X[12], 7,  JSMD5Hash.T[13]);
    JSMD5Hash.Q(JSMD5Hash.F, this.words, 3, 0, 1, 2, X[13], 12, JSMD5Hash.T[14]);
    JSMD5Hash.Q(JSMD5Hash.F, this.words, 2, 3, 0, 1, X[14], 17, JSMD5Hash.T[15]);
    JSMD5Hash.Q(JSMD5Hash.F, this.words, 1, 2, 3, 0, X[15], 22, JSMD5Hash.T[16]);
    JSMD5Hash.Q(JSMD5Hash.G, this.words, 0, 1, 2, 3, X[1],  5,  JSMD5Hash.T[17]);
    JSMD5Hash.Q(JSMD5Hash.G, this.words, 3, 0, 1, 2, X[6],  9,  JSMD5Hash.T[18]);
    JSMD5Hash.Q(JSMD5Hash.G, this.words, 2, 3, 0, 1, X[11], 14, JSMD5Hash.T[19]);
    JSMD5Hash.Q(JSMD5Hash.G, this.words, 1, 2, 3, 0, X[0],  20, JSMD5Hash.T[20]);
    JSMD5Hash.Q(JSMD5Hash.G, this.words, 0, 1, 2, 3, X[5],  5,  JSMD5Hash.T[21]);
    JSMD5Hash.Q(JSMD5Hash.G, this.words, 3, 0, 1, 2, X[10], 9,  JSMD5Hash.T[22]);
    JSMD5Hash.Q(JSMD5Hash.G, this.words, 2, 3, 0, 1, X[15], 14, JSMD5Hash.T[23]);
    JSMD5Hash.Q(JSMD5Hash.G, this.words, 1, 2, 3, 0, X[4],  20, JSMD5Hash.T[24]);
    JSMD5Hash.Q(JSMD5Hash.G, this.words, 0, 1, 2, 3, X[9],  5,  JSMD5Hash.T[25]);
    JSMD5Hash.Q(JSMD5Hash.G, this.words, 3, 0, 1, 2, X[14], 9,  JSMD5Hash.T[26]);
    JSMD5Hash.Q(JSMD5Hash.G, this.words, 2, 3, 0, 1, X[3],  14, JSMD5Hash.T[27]);
    JSMD5Hash.Q(JSMD5Hash.G, this.words, 1, 2, 3, 0, X[8],  20, JSMD5Hash.T[28]);
    JSMD5Hash.Q(JSMD5Hash.G, this.words, 0, 1, 2, 3, X[13], 5,  JSMD5Hash.T[29]);
    JSMD5Hash.Q(JSMD5Hash.G, this.words, 3, 0, 1, 2, X[2],  9,  JSMD5Hash.T[30]);
    JSMD5Hash.Q(JSMD5Hash.G, this.words, 2, 3, 0, 1, X[7],  14, JSMD5Hash.T[31]);
    JSMD5Hash.Q(JSMD5Hash.G, this.words, 1, 2, 3, 0, X[12], 20, JSMD5Hash.T[32]);
    JSMD5Hash.Q(JSMD5Hash.H, this.words, 0, 1, 2, 3, X[5],  4,  JSMD5Hash.T[33]);
    JSMD5Hash.Q(JSMD5Hash.H, this.words, 3, 0, 1, 2, X[8],  11, JSMD5Hash.T[34]);
    JSMD5Hash.Q(JSMD5Hash.H, this.words, 2, 3, 0, 1, X[11], 16, JSMD5Hash.T[35]);
    JSMD5Hash.Q(JSMD5Hash.H, this.words, 1, 2, 3, 0, X[14], 23, JSMD5Hash.T[36]);
    JSMD5Hash.Q(JSMD5Hash.H, this.words, 0, 1, 2, 3, X[1],  4,  JSMD5Hash.T[37]);
    JSMD5Hash.Q(JSMD5Hash.H, this.words, 3, 0, 1, 2, X[4],  11, JSMD5Hash.T[38]);
    JSMD5Hash.Q(JSMD5Hash.H, this.words, 2, 3, 0, 1, X[7],  16, JSMD5Hash.T[39]);
    JSMD5Hash.Q(JSMD5Hash.H, this.words, 1, 2, 3, 0, X[10], 23, JSMD5Hash.T[40]);
    JSMD5Hash.Q(JSMD5Hash.H, this.words, 0, 1, 2, 3, X[13], 4,  JSMD5Hash.T[41]);
    JSMD5Hash.Q(JSMD5Hash.H, this.words, 3, 0, 1, 2, X[0],  11, JSMD5Hash.T[42]);
    JSMD5Hash.Q(JSMD5Hash.H, this.words, 2, 3, 0, 1, X[3],  16, JSMD5Hash.T[43]);
    JSMD5Hash.Q(JSMD5Hash.H, this.words, 1, 2, 3, 0, X[6],  23, JSMD5Hash.T[44]);
    JSMD5Hash.Q(JSMD5Hash.H, this.words, 0, 1, 2, 3, X[9],  4,  JSMD5Hash.T[45]);
    JSMD5Hash.Q(JSMD5Hash.H, this.words, 3, 0, 1, 2, X[12], 11, JSMD5Hash.T[46]);
    JSMD5Hash.Q(JSMD5Hash.H, this.words, 2, 3, 0, 1, X[15], 16, JSMD5Hash.T[47]);
    JSMD5Hash.Q(JSMD5Hash.H, this.words, 1, 2, 3, 0, X[2],  23, JSMD5Hash.T[48]);
    JSMD5Hash.Q(JSMD5Hash.I, this.words, 0, 1, 2, 3, X[0],  6,  JSMD5Hash.T[49]);
    JSMD5Hash.Q(JSMD5Hash.I, this.words, 3, 0, 1, 2, X[7],  10, JSMD5Hash.T[50]);
    JSMD5Hash.Q(JSMD5Hash.I, this.words, 2, 3, 0, 1, X[14], 15, JSMD5Hash.T[51]);
    JSMD5Hash.Q(JSMD5Hash.I, this.words, 1, 2, 3, 0, X[5],  21, JSMD5Hash.T[52]);
    JSMD5Hash.Q(JSMD5Hash.I, this.words, 0, 1, 2, 3, X[12], 6,  JSMD5Hash.T[53]);
    JSMD5Hash.Q(JSMD5Hash.I, this.words, 3, 0, 1, 2, X[3],  10, JSMD5Hash.T[54]);
    JSMD5Hash.Q(JSMD5Hash.I, this.words, 2, 3, 0, 1, X[10], 15, JSMD5Hash.T[55]);
    JSMD5Hash.Q(JSMD5Hash.I, this.words, 1, 2, 3, 0, X[1],  21, JSMD5Hash.T[56]);
    JSMD5Hash.Q(JSMD5Hash.I, this.words, 0, 1, 2, 3, X[8],  6,  JSMD5Hash.T[57]);
    JSMD5Hash.Q(JSMD5Hash.I, this.words, 3, 0, 1, 2, X[15], 10, JSMD5Hash.T[58]);
    JSMD5Hash.Q(JSMD5Hash.I, this.words, 2, 3, 0, 1, X[6],  15, JSMD5Hash.T[59]);
    JSMD5Hash.Q(JSMD5Hash.I, this.words, 1, 2, 3, 0, X[13], 21, JSMD5Hash.T[60]);
    JSMD5Hash.Q(JSMD5Hash.I, this.words, 0, 1, 2, 3, X[4],  6,  JSMD5Hash.T[61]);
    JSMD5Hash.Q(JSMD5Hash.I, this.words, 3, 0, 1, 2, X[11], 10, JSMD5Hash.T[62]);
    JSMD5Hash.Q(JSMD5Hash.I, this.words, 2, 3, 0, 1, X[2],  15, JSMD5Hash.T[63]);
    JSMD5Hash.Q(JSMD5Hash.I, this.words, 1, 2, 3, 0, X[9],  21, JSMD5Hash.T[64]);
    this.words[0] = (this.words[0] + AA) & 0xFFFFFFFF;
    this.words[1] = (this.words[1] + BB) & 0xFFFFFFFF;
    this.words[2] = (this.words[2] + CC) & 0xFFFFFFFF;
    this.words[3] = (this.words[3] + DD) & 0xFFFFFFFF;
};

JSMD5Hash.prototype.digest = function(){
    var temp;
    var digest = new Uint8Array(16);
    for (var i = 0, l = this.words.length; i < l; ++i){
        temp = this.words[i];
        for (var j = 0; j < 4; ++j){
            digest[4 * i + j] = temp & 0xFF;
            temp = temp >>> 8;
        }
    }
    return digest;
};

JSMD5Hash.F = function(x, y, z){ return (x & y) | ((~x) & z); };
JSMD5Hash.G = function(x, y, z){ return (x & z) | (y & (~z)); };
JSMD5Hash.H = function(x, y, z){ return x ^ y ^ z; };
JSMD5Hash.I = function(x, y, z){ return y ^ (x | (~z)); };
JSMD5Hash.RL = function(x, n){ return (x << n) | (x >>> (32 - n)); };
JSMD5Hash.Q = function(f, words, a, b, c, d, x, s, t){
    var n = new Uint32Array(1);
    n[0] = f(words[b], words[c], words[d]);
    n[0] += words[a];
    n[0] += x;
    n[0] += t;
    n[0] = JSMD5Hash.RL(n[0],  s);
    n[0] += words[b];
    words[a] = n[0];
};
Object.defineProperty(JSMD5Hash, 'T', {
    configurable: true,
    get: function(){
        var T = new Uint32Array(65);
        for (var i = 0, l = T.length; i < l; ++i){
           T[i] = Math.floor(4294967296 * Math.abs(Math.sin(i)));
        }
        Object.defineProperty(JSMD5Hash, 'T', {
            value: T
        });
        return JSMD5Hash.T;
    }
});