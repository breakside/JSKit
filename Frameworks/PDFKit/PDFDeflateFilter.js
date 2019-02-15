// #import "PDFKit/PDFPredictorFilter.js"
/* global JSClass, PDFPredictorFilter, Zlib, JSData */
'use strict';

JSClass("PDFDeflateFilter", PDFPredictorFilter, {
    decodePrimaryData: function(data){
        var uncompressed = Zlib.uncompress(data.bytes);
        return JSData.initWithBytes(uncompressed);
    },

    encodePrimaryData: function(data){
        var compressed = Zlib.compress(data.bytes);
        return JSData.initWithBytes(compressed);
    }
});