// #feature Uint8Array
'use strict';

Object.defineProperty(Uint8Array.prototype, 'hexStringRepresentation', {
  value: function Uint8Array_hexStringRepresentation(){
    var str = '';
    var bytehex;
    for (var i = 0, l = this.length; i < l; ++i){
      bytehex = this[i].toString(16);
      if (bytehex.length < 2){
        bytehex = '0' + bytehex;
      }
      str += bytehex;
    }
    return str;
  }
});

Object.defineProperty(Uint8Array.prototype, 'zero', {
  value: function Uint8Array_zero() {
    for (var i = 0, l = this.length; i < l; ++i){
      this[i] = 0;
    }
  }
});

Object.defineProperty(Uint8Array.prototype, 'stringUsingASCIIDecoding', {
  value: function Uint8Array_stringUsingASCIIDecoding(){
    var str = '';
    var code;
    for (var i = 0, l = this.length; i < l; ++i){
      code = this[i];
      if (code < 128){
        str += String.fromCharCode(code);
      }else{
        str += String.fromCharCode(0xFFFD);
      }
    }
    return str;
  }
});

Object.defineProperty(Uint8Array.prototype, 'stringUsingUTF8Decoding', {
  value: function Uint8Array_stringUsingUTF8Decoding(){
    // TODO: use TextDecoder if available
    var str = '';
    var a, b, c, d;
    var code;
    for (var i = 0, l = this.length; i < l; ++i){
      a = this[i];
      if (a <= 0x7F){
        code = a;
      }else if (a >> 5 == 0xC0){
        if (a == 0xC0 || a == 0xC1){
          throw new Error("Invalid UTF8 byte at index: %d: %02x".sprintf(i, a));
        }
        i += 1;
        if (i > l){
          throw new Error("Invalid UTF8 byte sequence at index %d: %02x EOD".sprintf(i - 1, a));
        }
        b = this[i];
        if (b >> 6 != 0x80){
          throw new Error("Invalid UTF8 byte sequence at index %d: %02x %02x".sprintf(i - 1, a, b));
        }
        code = ((a & 0x1F) << 6) | (b & 0x3F);
      }else if (a >> 4 == 0xE0){
        i += 1;
        if (i > l){
          throw new Error("Invalid UTF8 byte sequence at index %d: %02x EOD".sprintf(i - 1, a));
        }
        b = this[i];
        if (b >> 6 != 0x80){
          throw new Error("Invalid UTF8 byte sequence at index %d: %02x %02x".sprintf(i - 1, a, b));
        }
        i += 1;
        if (i > l){
          throw new Error("Invalid UTF8 byte sequence at index %d: %02x %02x EOD".sprintf(i - 2, a, b));
        }
        c = this[i];
        if (c >> 6 != 0x80){
          throw new Error("Invalid UTF8 byte sequence at index %d: %02x %02x %02x".sprintf(i - 2, a, b, c));
        }
        // TODO: there are some invalid sequences we should watch out for
        code = ((a & 0xF) << 12) | ((b & 0x3F) << 6) | (c & 0x3F);
      }else if (a >> 3 == 0xF0){
        i += 1;
        if (i > l){
          throw new Error("Invalid UTF8 byte sequence at index %d: %02x EOD".sprintf(i - 1, a));
        }
        b = this[i];
        if (b >> 6 != 0x80){
          throw new Error("Invalid UTF8 byte sequence at index %d: %02x %02x".sprintf(i - 1, a, b));
        }
        i += 1;
        if (i > l){
          throw new Error("Invalid UTF8 byte sequence at index %d: %02x %02x EOD".sprintf(i - 2, a, b));
        }
        c = this[i];
        if (c >> 6 != 0x80){
          throw new Error("Invalid UTF8 byte sequence at index %d: %02x %02x %02x".sprintf(i - 2, a, b, c));
        }
        i += 1;
        if (i > l){
          throw new Error("Invalid UTF8 byte sequence at index %d: %02x %02x %02x EOD".sprintf(i - 3, a, b, c));
        }
        d = this[i];
        if (d >> 6 != 0x80){
          throw new Error("Invalid UTF8 byte sequence at index %d: %02x %02x %02x %02x".sprintf(i - 3, a, b, c, d));
        }
        code = ((a & 0x07) << 18) | ((b & 0x3F) << 12) | ((c & 0x3F) << 6) | (d & 0x3F);
      }else{
          throw new Error("Invalid UTF8 byte at index: %d: %02x".sprintf(i, a));
      }
      str += String.fromCharCode(code);
    }
    return str;
  }
});