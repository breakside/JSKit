// #import "PDFPredictorFilter.js"
/* global JSClass, PDFPredictorFilter, Zlib, JSData */
'use strict';

JSClass("PDFDeflateFilter", PDFPredictorFilter, {
    decodePrimaryData: function(data){
        var uncompressed = Zlib.uncompress(data);
        return uncompressed;
    },

    encodePrimaryData: function(data){
        var compressed = Zlib.compress(data);
        return compressed;
    }
});