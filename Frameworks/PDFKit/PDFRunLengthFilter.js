// #import "PDFFilter.js"
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
            code = data[i];
            ++i;
            if (code < 128){
                length = code + 1; 
                l = i + length;
                if (l > L){
                    throw new Error("PDFRunLengthFilter reading past end of input");
                }
                if (o + length > output.length){
                    output = output.increasedByLength(length + output.length);
                }
                for (; i < l; ++i){
                    output[o++] = data[i];
                }
            }else if (code > 128){
                ++i;
                if (i >= L){
                    throw new Error("PDFRunLengthFilter reading past end of input");
                }
                x = data[i];
                length = 257 - code;
                if (o + length > output.length){
                    output = output.increasedByLength(length + output.length);
                }
                for (j = 0; j < length; ++j){
                    output[o++] = x;
                }
            }
        } while (code != 128);
        return output.truncatedToLength(0);
    },

    encode: function(data){
        throw new Error("PDFRunLengthFilter RunLength encoding not supported");
    }
});