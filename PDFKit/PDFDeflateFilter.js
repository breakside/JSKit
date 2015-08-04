// #import "PDFKit/PDFPredictorFilter.js"
// #import "Zlib/Zlib.js"
/* global JSClass, PDFPredictorFilter, Zlib, JSData */
'use strict';

JSClass("PDFDeflateFilter", PDFPredictorFilter, {
    decodePrimaryData: function(data){
        return JSData.initWithBytes(Zlib.uncompress(data.bytes));
    },

    encodePrimaryData: function(data){
        return JSData.initWithBytes(Zlib.compress(data.bytes));
    }
});