// #import "PDFKit/PDFFilter.js"
/* global JSClass, JSObject, PDFFilter */
'use strict';

JSClass("PDFJBIG2Filter", PDFFilter, {
    decode: function(input){
        throw new Error("PDFJBIG2Filter decode not implemented");
    },

    encode: function(input){
        throw new Error("PDFJBIG2Filter encode not implemented");
    }
});