// #feature Uint8Array
// #feature DataView
'use strict';

(function(){

var base64EncodingMap = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    '+', '/'
];

Object.defineProperties(Uint8Array.prototype, {

    zero: {
        enumerable: false,
        value: function Uint8Array_zero() {
            for (var i = 0, l = this.length; i < l; ++i){
                this[i] = 0;
            }
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - String Represenations

    hexStringRepresentation: {
        enumerable: false,
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
    },

    base64StringRepresentation: {
        enumerable: false,
        value: function Uint8Array_base64StringRepresentation(){
            var str = '';
            var i, l;
            for (i = 0, l = this.length - 2; i < l; i += 3){
                str += base64EncodingMap[this[i] >> 2];
                str += base64EncodingMap[((this[i] & 0x3) << 4) | (this[i + 1] >> 4)];
                str += base64EncodingMap[((this[i + 1] & 0xF) << 2) | (this[i + 2] >> 6)];
                str += base64EncodingMap[this[i + 2] & 0x3F];
            }
            if (i == this.length - 2){
                str += base64EncodingMap[this[i] >> 2];
                str += base64EncodingMap[((this[i] & 0x3) << 4) | (this[i + 1] >> 4)];
                str += base64EncodingMap[((this[i + 1] & 0xF) << 2)];
                str += '=';
            }else if (i == this.length - 1){
                str += base64EncodingMap[this[i] >> 2];
                str += base64EncodingMap[(this[i] & 0x3) << 4];
                str += '==';
            }
            return str;
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Decoding

    stringByDecodingUTF8: {
        enumerable: false,
        value: function Uint8Array_stringByDecodingUTF8(){
            // TODO: use TextDecoder if available
            var str = '';
            var n = 0;
            var A, B, C, D;
            var expecting = 0;
            var code;
            for (var i = 0, l = this.length; i < l; ++i){
                if (n === 0){
                    A = this[i];
                    if (A < 0x80){
                        str += String.fromUnicode(A);
                    }else if (A >= 0xC2 && A < 0xE0){
                        n = 1;
                        expecting = 1;
                    }else if (A >= 0xE0 && A < 0xF0){
                        n = 1;
                        expecting = 2;
                    }else if (A >= 0xF0 && A < 0xF5){
                        n = 1;
                        expecting = 3;
                    }else{
                        // invalid byte, just add it as-is so we don't lose data
                        str += String.fromUnicode(A);
                    }
                }else if (n == 1){
                    B = this[i];
                    if (B < 0x80 || B > 0xBF){
                        // invalid continuation byte, just add A and B as-is
                        str += String.fromUnicode(A);
                        str += String.fromUnicode(B);
                    }else{
                        if (expecting == 1){
                            code = ((A & 0x1F) << 6) | (B & 0x3F);
                            str += String.fromUnicode(code);
                            n = 0;
                        }else if (expecting == 2){
                            if (A == 0xE0 && B < 0xA0){
                                // invalid second byte for E0 first byte
                                str += String.fromUnicode(A);
                                str += String.fromUnicode(B);
                                n = 0;
                            }else if (A == 0xED && B > 0x9F){
                                // invalid second byte for ED first byte
                                str += String.fromUnicode(A);
                                str += String.fromUnicode(B);
                                n = 0;
                            }else{
                                n = 2;
                            }
                        }else{ // must be expecting == 3
                            if (A == 0xF0 && B < 0x90){
                                // invalid second byte for F0 first byte
                                str += String.fromUnicode(A);
                                str += String.fromUnicode(B);
                                n = 0;
                            }else if (A == 0xF4 && B > 0x8F){
                                // invalid second byte for F4 first byte
                                str += String.fromUnicode(A);
                                str += String.fromUnicode(B);
                                n = 0;
                            }else{
                                n = 2;
                            }
                        }
                    }
                }else if (n == 2){
                    C = this[i];
                    if (C < 0x80 || C > 0xBF){
                        // invalid continuation byte
                        str += String.fromUnicode(A);
                        str += String.fromUnicode(B);
                        str += String.fromUnicode(C);
                        n = 0;
                    }else{
                        if (expecting == 2){
                            code = ((A & 0xF) << 12) | ((B & 0x3F) << 6) | (C & 0x3F);
                            str += String.fromUnicode(code);
                            n = 0;
                        }else{ // must be expecting == 3
                            n = 3;
                        }
                    }
                }else if (n == 3){
                    D = this[i];
                    if (D < 0x80 || D > 0xBF) {
                        // invalid continuation byte
                        str += String.fromUnicode(A);
                        str += String.fromUnicode(B);
                        str += String.fromUnicode(C);
                        str += String.fromUnicode(D);
                        n = 0;
                    }else{
                        code = ((A & 0x7) << 18) | ((B & 0x3F) << 12) | ((C & 0x3F) << 6) | (D & 0x3F);
                        str += String.fromUnicode(code);
                        n = 0;
                    }
                }
            }
            return str;
        }
    },

    stringByDecodingUTF16BE: {
        enumerable: false,
        value: function Uint8Array_stringByDecodingUTF16BE(){
            var dataView = new DataView(this.buffer, this.byteOffset, this.length);
            var a;
            var b;
            var codes = [];
            for (var i = 0, l = dataView.byteLength; i < l; i += 2){
                codes.push(dataView.getUint16(i));
            }
            return String.fromCharCode.apply(undefined, codes);
        }
    },

    stringByDecodingUTF16LE: {
        enumerable: false,
        value: function Uint8Array_stringByDecodingUTF16BE(){
            var dataView = new DataView(this.buffer, this.byteOffset, this.length);
            var a;
            var b;
            var codes = [];
            for (var i = 0, l = dataView.byteLength; i < l; i += 2){
                codes.push(dataView.getUint16(i, true));
            }
            return String.fromCharCode.apply(undefined, codes);
        }
    },

    stringByDecodingLatin1: {
        enumerable: false,
        value: function Uint8Array_stringByDecodingLatin1(){
            return String.fromCodePoint.apply(undefined, this);
        }
    },

    arrayByDecodingPercentEscapes: {
        enumerable: false,
        value: function Uint8Array_arrayByDecodingPercentEscapes(decodePlusAsSpace){
            var decoded = new Uint8Array(this.length);
            var i = 0;
            var j = 0;
            var l = this.length;
            var a, b, c;
            while (i < l){
                c = this[i];
                if (decodePlusAsSpace && c == 0x2B){
                    c = 0x20;
                }else if (c == 0x25 && i < l - 2){
                    a = this[i + 1];
                    b = this[i + 2];
                    if (isHexByte(a) && isHexByte(b)){
                        c = parseInt(String.fromCharCode(a) + String.fromCharCode(b), 16);
                        i += 2;
                    }
                }
                decoded[j] = c;
                ++j;
                ++i;
            }
            return new Uint8Array(decoded.buffer, decoded.byteOffset, j);
        }
    },

    arrayByEncodingPercentEscapes: {
        enumerable: false,
        value: function Uint8Array_arrayByEncodingPercentEscapes(reserved, encodeSpaceAsPlus){
            var encoded = new Uint8Array(this.length * 3);
            var j = 0;
            var c;
            var hex;
            for (var i = 0, l = this.length; i < l; ++i){
                c = this[i];
                if (encodeSpaceAsPlus && c == 0x20){
                    encoded[j++] = 0x2B;
                }else if (c <= 0x20 || c >= 0x7F || c == 0x25 || reserved[c]){
                    encoded[j++] = 0x25;
                    hex = "%02X".sprintf(c);
                    encoded[j++] = hex.charCodeAt(0);
                    encoded[j++] = hex.charCodeAt(1);
                }else{
                    encoded[j++] = c;
                }
            }
            return new Uint8Array(encoded.buffer, encoded.byteOffset, j);
        }
    },

    isEqual: {
        value: function(other){
            if (this.length != other.length){
                return false;
            }
            for (var i = 0, l = this.length; i < l; ++i){
                if (this[i] != other[i]){
                    return false;
                }
            }
            return true;
        }
    },

    copyTo: {
        value: function(other, index){
            for (var i = 0, l = this.length, l2 = other.length; i < l && i + index < l2; ++i){
                other[index + i] = this[i];
            }
        }
    }

});

function isHexByte(b){
    return ((b >= 0x30 && b < 0x40) || (b >= 0x41 && b < 0x47) || (b >= 0x61 && b < 0x67));
}

})();