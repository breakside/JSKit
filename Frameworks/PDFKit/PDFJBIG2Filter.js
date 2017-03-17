// #import "PDFKit/PDFFilter.js"
/* global JSClass, JSObject, PDFFilter */
'use strict';

// The stream data is a JBIG image file, so we probably don't need to decode

JSClass("PDFJBIG2Filter", PDFFilter, {
    decode: function(input){
        throw new Error("PDFJBIG2Filter decode not implemented");
    },

    encode: function(input){
        throw new Error("PDFJBIG2Filter encode not implemented");
    }
});