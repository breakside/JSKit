// #import "Hash/JSIterativeHash.js"
/* global JSIterativeHash, JSGlobalObject, JSSHA1Hash */
'use strict';

JSGlobalObject.JSSHA1Hash = function JSSHA1Hash(x){
    if (this === undefined){
        var hasher = new JSSHA1Hash();
        hasher.start();
        hasher.add(x);
        hasher.finish();
        return hasher.digest();
    }
    JSIterativeHash.call(this, 64);
};

JSSHA1Hash.prototype = Object.create(JSIterativeHash.prototype);

JSSHA1Hash.prototype.start = function(){
    JSIterativeHash.prototype.start.call(this);
    this.words = new Uint32Array(5);
    this.words[0] = 0x67452301;
    this.words[1] = 0xEFCDAB89;
    this.words[2] = 0x98BADCFE;
    this.words[3] = 0x10325476;
    this.words[4] = 0xC3D2E1F0;
};

JSSHA1Hash.prototype._hashBlock = function(block){
    var A, B, C, D, E;
    var W = new Uint32Array(80);
    A = this.words[0];
    B = this.words[1];
    C = this.words[2];
    D = this.words[3];
    E = this.words[4];
    var temp;
    var t = 0;

    for (; t < 16; ++t){
        W[t] = (block[t * 4] << 24) | (block[t * 4 + 1] << 16) | (block[t * 4 + 2] << 8) | (block[t * 4 + 3]);
    }
    for (; t < 80; ++t){
        W[t] = JSSHA1Hash.RL((W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16]), 1);
    }
    for (t = 0; t < 20; ++t){
        temp = JSSHA1Hash.RL(A, 5) + JSSHA1Hash.F0(B, C, D) + E + W[t] + JSSHA1Hash.C[0];
        E = D;
        D = C;
        C = JSSHA1Hash.RL(B, 30);
        B = A;
        A = temp;
    }
    for (; t < 40; ++t){
        temp = JSSHA1Hash.RL(A, 5) + JSSHA1Hash.F1(B, C, D) + E + W[t] + JSSHA1Hash.C[1];
        E = D;
        D = C;
        C = JSSHA1Hash.RL(B, 30);
        B = A;
        A = temp;
    }
    for (; t < 60; ++t){
        temp = JSSHA1Hash.RL(A, 5) + JSSHA1Hash.F2(B, C, D) + E + W[t] + JSSHA1Hash.C[2];
        E = D;
        D = C;
        C = JSSHA1Hash.RL(B, 30);
        B = A;
        A = temp;
    }
    for (; t < 80; ++t){
        temp = JSSHA1Hash.RL(A, 5) + JSSHA1Hash.F1(B, C, D) + E + W[t] + JSSHA1Hash.C[3];
        E = D;
        D = C;
        C = JSSHA1Hash.RL(B, 30);
        B = A;
        A = temp;
    }

    this.words[0] = (this.words[0] + A) & 0xFFFFFFFF;
    this.words[1] = (this.words[1] + B) & 0xFFFFFFFF;
    this.words[2] = (this.words[2] + C) & 0xFFFFFFFF;
    this.words[3] = (this.words[3] + D) & 0xFFFFFFFF;
    this.words[4] = (this.words[4] + E) & 0xFFFFFFFF;
};

JSSHA1Hash.prototype._padBlock = function(block, length){
    block[length++] = 0x80;
    if (length > this._blockByteLength - 8){
        while (length < this._blockByteLength){
            block[length++] = 0x00;
        }
        this._hashBlock(block);
        length = 0;
    }
    while (length < this._blockByteLength - 8){
        block[length++] = 0x00;
    }
    var bitLength = this._inputByteLength * 8;
    for (var i = block.length - 1, l = block.length - 8; i >= l; --i){
        block[i] = bitLength & 0xFF;
        bitLength = bitLength >>> 8;
    }
};

JSSHA1Hash.prototype.digest = function(){
    var temp;
    var digest = new Uint8Array(20);
    for (var i = 0, l = this.words.length; i < l; ++i){
        temp = this.words[i];
        for (var j = 3; j >= 0; --j){
            digest[4 * i + j] = temp & 0xFF;
            temp = temp >>> 8;
        }
    }
    return digest;
};

JSSHA1Hash.C = new Uint32Array(4);
JSSHA1Hash.C[0] = 0x5A827999;
JSSHA1Hash.C[1] = 0x6ED9EBA1;
JSSHA1Hash.C[2] = 0x8F1BBCDC;
JSSHA1Hash.C[3] = 0xCA62C1D6;

JSSHA1Hash.F0 = function(b, c, d){ return (b & c) | ((~b) & d); };
JSSHA1Hash.F1 = function(b, c, d){ return b ^ c ^ d; };
JSSHA1Hash.F2 = function(b, c, d){ return (b & c) | (b & d) | (c & d); };
JSSHA1Hash.RL = function(x, n){ return (x << n) | (x >>> (32 - n)); };