// #import "PDFKit/PDFFilter.js"
/* global JSClass, PDFFilter, JSData */
'use strict';

JSClass("PDFASCIIHexFilter", PDFFilter, {
    decode: function(data){
        var output = JSData.initWithLength(Math.ceil(data.length / 2));
        var pair = [0, 0];
        var slot = 0;
        var h;
        var o = 0;
        var i = 0;
        var l = data.length;
        while (i < l){
            h = data.bytes[i];
            if (PDFLexical.isHexadecimalByte(h)){
                pair[slot++] = h;
                if (slot == 2){
                    output.bytes[o++] = parseInt(String.fromCharCode(pair[0], pair[1]), 16);
                    slot = 0;
                }
            }else if (h === 0x3E){
                if (slot == 1){
                    output.bytes[o++] = parseInt(String.fromCharCode(pair[0]) + '0', 16);
                }
                break;
            }else if (!PDFLexical.isWhitespaceByte(h)){
                throw new Error("PDFASCIIHexFilter found invalid byte %#02x at index %d".sprintf(h, i));
            }
            ++i;
        }
        output.truncateToLength(o);
        return output;
    },

    encode: function(data){
        var output = JSData.initWithLength(data.length * 2 + 1);
        var c;
        var h;
        var o = 0;
        for (var i = 0, l = data.length; i < l; ++i){
            c = data.bytes[i];
            h = (c < 16 ? '0': '') + c.toString(16).toUpperCase();
            output.bytes[o] = h.charCodeAt(0);
            output.bytes[o + 1] = h.charCodeAt(1);
            o += 2;
        }
        output.bytes[o] = 0x3E;
        return output;
    }
});