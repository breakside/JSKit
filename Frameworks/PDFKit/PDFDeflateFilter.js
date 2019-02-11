// #import "PDFKit/PDFPredictorFilter.js"
/* global JSClass, PDFPredictorFilter, Zlib, JSData */
'use strict';

JSClass("PDFDeflateFilter", PDFPredictorFilter, {
    decode: function(data){
        return JSData.initWithBytes(Zlib.uncompress(data.bytes));
    },

    encode: function(data){
        return JSData.initWithBytes(Zlib.compress(data.bytes));
    }
});