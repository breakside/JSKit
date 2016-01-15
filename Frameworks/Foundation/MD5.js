// #feature Uint8Array, Uint32Array
// #import "Foundation/Uint8Array+JS.js"
// #import "Foundation/String+JS.js"

'use strict';
var MD5 = function(data){
  if (this === undefined){
    return (new MD5(data)).string;
  }
  var padded_bit_length = data.length * 8 + 1;
  var mod = padded_bit_length % 512;
  if (mod > 448){
    padded_bit_length += 512 - (mod - 448);
  }else if (mod < 448){
    padded_bit_length += 448 - mod;
  }
  this.message = new Uint8Array(padded_bit_length / 8 + 8);
  this.message.set(data);
  this.message[data.length] = 0x80;
  var length = data.length * 8;
  var i, l;
  for (i = this.message.length - 8, l = this.message.length; i < l; ++i){
    this.message[i] = length & 0xFF;
    length = length >>> 8;
  }
  this.words = new Uint32Array(4);
  this.words[0] = 0x67452301;
  this.words[1] = 0xefcdab89;
  this.words[2] = 0x98badcfe;
  this.words[3] = 0x10325476;
  var AA, BB, CC, DD;
  var X = new Uint32Array(16);
  var j;
  for (i = 0, l = this.message.length / 64; i < l; ++i){
    for (j = 0; j < 16; ++j){
      X[j] = this.message[i * 64 + j * 4 + 0] | (this.message[i * 64 + j * 4 + 1] << 8) | (this.message[i * 64 + j * 4 + 2] << 16) | (this.message[i * 64 + j * 4 + 3] << 24);
    }
    AA = this.words[0];
    BB = this.words[1];
    CC = this.words[2];
    DD = this.words[3];
    MD5.Q(MD5.F, this.words, 0, 1, 2, 3, X[0],  7,  MD5.T[1]);
    MD5.Q(MD5.F, this.words, 3, 0, 1, 2, X[1],  12, MD5.T[2]);
    MD5.Q(MD5.F, this.words, 2, 3, 0, 1, X[2],  17, MD5.T[3]);
    MD5.Q(MD5.F, this.words, 1, 2, 3, 0, X[3],  22, MD5.T[4]);
    MD5.Q(MD5.F, this.words, 0, 1, 2, 3, X[4],  7,  MD5.T[5]);
    MD5.Q(MD5.F, this.words, 3, 0, 1, 2, X[5],  12, MD5.T[6]);
    MD5.Q(MD5.F, this.words, 2, 3, 0, 1, X[6],  17, MD5.T[7]);
    MD5.Q(MD5.F, this.words, 1, 2, 3, 0, X[7],  22, MD5.T[8]);
    MD5.Q(MD5.F, this.words, 0, 1, 2, 3, X[8],  7,  MD5.T[9]);
    MD5.Q(MD5.F, this.words, 3, 0, 1, 2, X[9],  12, MD5.T[10]);
    MD5.Q(MD5.F, this.words, 2, 3, 0, 1, X[10], 17, MD5.T[11]);
    MD5.Q(MD5.F, this.words, 1, 2, 3, 0, X[11], 22, MD5.T[12]);
    MD5.Q(MD5.F, this.words, 0, 1, 2, 3, X[12], 7,  MD5.T[13]);
    MD5.Q(MD5.F, this.words, 3, 0, 1, 2, X[13], 12, MD5.T[14]);
    MD5.Q(MD5.F, this.words, 2, 3, 0, 1, X[14], 17, MD5.T[15]);
    MD5.Q(MD5.F, this.words, 1, 2, 3, 0, X[15], 22, MD5.T[16]);
    MD5.Q(MD5.G, this.words, 0, 1, 2, 3, X[1],  5,  MD5.T[17]);
    MD5.Q(MD5.G, this.words, 3, 0, 1, 2, X[6],  9,  MD5.T[18]);
    MD5.Q(MD5.G, this.words, 2, 3, 0, 1, X[11], 14, MD5.T[19]);
    MD5.Q(MD5.G, this.words, 1, 2, 3, 0, X[0],  20, MD5.T[20]);
    MD5.Q(MD5.G, this.words, 0, 1, 2, 3, X[5],  5,  MD5.T[21]);
    MD5.Q(MD5.G, this.words, 3, 0, 1, 2, X[10], 9,  MD5.T[22]);
    MD5.Q(MD5.G, this.words, 2, 3, 0, 1, X[15], 14, MD5.T[23]);
    MD5.Q(MD5.G, this.words, 1, 2, 3, 0, X[4],  20, MD5.T[24]);
    MD5.Q(MD5.G, this.words, 0, 1, 2, 3, X[9],  5,  MD5.T[25]);
    MD5.Q(MD5.G, this.words, 3, 0, 1, 2, X[14], 9,  MD5.T[26]);
    MD5.Q(MD5.G, this.words, 2, 3, 0, 1, X[3],  14, MD5.T[27]);
    MD5.Q(MD5.G, this.words, 1, 2, 3, 0, X[8],  20, MD5.T[28]);
    MD5.Q(MD5.G, this.words, 0, 1, 2, 3, X[13], 5,  MD5.T[29]);
    MD5.Q(MD5.G, this.words, 3, 0, 1, 2, X[2],  9,  MD5.T[30]);
    MD5.Q(MD5.G, this.words, 2, 3, 0, 1, X[7],  14, MD5.T[31]);
    MD5.Q(MD5.G, this.words, 1, 2, 3, 0, X[12], 20, MD5.T[32]);
    MD5.Q(MD5.H, this.words, 0, 1, 2, 3, X[5],  4,  MD5.T[33]);
    MD5.Q(MD5.H, this.words, 3, 0, 1, 2, X[8],  11, MD5.T[34]);
    MD5.Q(MD5.H, this.words, 2, 3, 0, 1, X[11], 16, MD5.T[35]);
    MD5.Q(MD5.H, this.words, 1, 2, 3, 0, X[14], 23, MD5.T[36]);
    MD5.Q(MD5.H, this.words, 0, 1, 2, 3, X[1],  4,  MD5.T[37]);
    MD5.Q(MD5.H, this.words, 3, 0, 1, 2, X[4],  11, MD5.T[38]);
    MD5.Q(MD5.H, this.words, 2, 3, 0, 1, X[7],  16, MD5.T[39]);
    MD5.Q(MD5.H, this.words, 1, 2, 3, 0, X[10], 23, MD5.T[40]);
    MD5.Q(MD5.H, this.words, 0, 1, 2, 3, X[13], 4,  MD5.T[41]);
    MD5.Q(MD5.H, this.words, 3, 0, 1, 2, X[0],  11, MD5.T[42]);
    MD5.Q(MD5.H, this.words, 2, 3, 0, 1, X[3],  16, MD5.T[43]);
    MD5.Q(MD5.H, this.words, 1, 2, 3, 0, X[6],  23, MD5.T[44]);
    MD5.Q(MD5.H, this.words, 0, 1, 2, 3, X[9],  4,  MD5.T[45]);
    MD5.Q(MD5.H, this.words, 3, 0, 1, 2, X[12], 11, MD5.T[46]);
    MD5.Q(MD5.H, this.words, 2, 3, 0, 1, X[15], 16, MD5.T[47]);
    MD5.Q(MD5.H, this.words, 1, 2, 3, 0, X[2],  23, MD5.T[48]);
    MD5.Q(MD5.I, this.words, 0, 1, 2, 3, X[0],  6,  MD5.T[49]);
    MD5.Q(MD5.I, this.words, 3, 0, 1, 2, X[7],  10, MD5.T[50]);
    MD5.Q(MD5.I, this.words, 2, 3, 0, 1, X[14], 15, MD5.T[51]);
    MD5.Q(MD5.I, this.words, 1, 2, 3, 0, X[5],  21, MD5.T[52]);
    MD5.Q(MD5.I, this.words, 0, 1, 2, 3, X[12], 6,  MD5.T[53]);
    MD5.Q(MD5.I, this.words, 3, 0, 1, 2, X[3],  10, MD5.T[54]);
    MD5.Q(MD5.I, this.words, 2, 3, 0, 1, X[10], 15, MD5.T[55]);
    MD5.Q(MD5.I, this.words, 1, 2, 3, 0, X[1],  21, MD5.T[56]);
    MD5.Q(MD5.I, this.words, 0, 1, 2, 3, X[8],  6,  MD5.T[57]);
    MD5.Q(MD5.I, this.words, 3, 0, 1, 2, X[15], 10, MD5.T[58]);
    MD5.Q(MD5.I, this.words, 2, 3, 0, 1, X[6],  15, MD5.T[59]);
    MD5.Q(MD5.I, this.words, 1, 2, 3, 0, X[13], 21, MD5.T[60]);
    MD5.Q(MD5.I, this.words, 0, 1, 2, 3, X[4],  6,  MD5.T[61]);
    MD5.Q(MD5.I, this.words, 3, 0, 1, 2, X[11], 10, MD5.T[62]);
    MD5.Q(MD5.I, this.words, 2, 3, 0, 1, X[2],  15, MD5.T[63]);
    MD5.Q(MD5.I, this.words, 1, 2, 3, 0, X[9],  21, MD5.T[64]);
    this.words[0] = (this.words[0] + AA) & 0xFFFFFFFF;
    this.words[1] = (this.words[1] + BB) & 0xFFFFFFFF;
    this.words[2] = (this.words[2] + CC) & 0xFFFFFFFF;
    this.words[3] = (this.words[3] + DD) & 0xFFFFFFFF;
  }
  var temp;
  this.bytes = new Uint8Array(16);
  for (i = 0, l = this.words.length; i < l; ++i){
    temp = this.words[i];
    for (j = 0; j < 4; ++j){
      this.bytes[4 * i + j] = temp & 0xFF;
      temp = temp >>> 8;
    }
  }
};
MD5.F = function(x, y, z){ return (x & y) | ((~x) & z); };
MD5.G = function(x, y, z){ return (x & z) | (y & (~z)); };
MD5.H = function(x, y, z){ return x ^ y ^ z; };
MD5.I = function(x, y, z){ return y ^ (x | (~z)); };
MD5.RL = function(x, n){ return (x << n) | (x >>> (32 - n)); };
MD5.Q = function(f, words, a, b, c, d, x, s, t){
  var n = new Uint32Array(1);
  n[0] = f(words[b], words[c], words[d]);
  n[0] += words[a];
  n[0] += x;
  n[0] += t;
  n[0] = MD5.RL(n[0],  s);
  n[0] += words[b];
  words[a] = n[0];
};
Object.defineProperty(MD5, 'T', {
  configurable: true,
  get: function(){
    var T = new Uint32Array(65);
    for (var i = 0, l = T.length; i < l; ++i){
      T[i] = Math.floor(4294967296 * Math.abs(Math.sin(i)));
    }
    Object.defineProperty(MD5, 'T', {
      value: T
    });
    return MD5.T;
  }
});
MD5.prototype = Object.create({}, {
  string: {
    configurable: true,
    get: function(){
      var str = this.bytes.hexStringRepresentation();
      Object.defineProperty(this, 'string', {
        value: str
      });
      return this.string;
    }
  }
});