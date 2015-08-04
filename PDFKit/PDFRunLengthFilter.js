// #import "PDFKit/PDFFilter.js"
/* global JSClass, PDFFilter, Deflate, JSData */
'use strict';

JSClass("PDFRunLengthFilter", PDFFilter, {
    decode: function(data){
        // TODO: needs testing
        var output = JSData.initWithLength(data.length * 5);
        var o = 0;
        var code;
        var i = 0;
        var L = data.length;
        var length;
        var x;
        var l;
        var j;
        do {
            if (i >= L){
                throw new Error("PDFRunLengthFilter reading past end of input");
            }
            code = data.bytes[i];
            ++i;
            if (code < 128){
                length = code + 1; 
                l = i + length;
                if (l > L){
                    throw new Error("PDFRunLengthFilter reading past end of input");
                }
                if (o + length > output.length){
                    output.increaseLengthBy(length + output.length);
                }
                for (; i < l; ++i){
                    output.bytes[o++] = data.bytes[i];
                }
            }else if (code > 128){
                ++i;
                if (i >= L){
                    throw new Error("PDFRunLengthFilter reading past end of input");
                }
                x = data.bytes[i];
                length = 257 - code;
                if (o + length > output.length){
                    output.increaseLengthBy(length + output.length);
                }
                for (j = 0; j < length; ++j){
                    output.bytes[o++] = x;
                }
            }
        } while (code != 128);
        output.truncateToLength(o);
        return output;
    },

    encode: function(data){
        throw new Error("PDFRunLengthFilter RunLength encoding not supported");
    }
});