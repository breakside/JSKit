// #import "PDFFilter.js"
/* global JSClass, JSObject, PDFFilter */
'use strict';

// The stream content should just be a JPEG file, so we probably don't need to do any actual decoding

JSClass("PDFDCTFilter", PDFFilter, {
    decode: function(input){
        throw new Error("PDFDCTFilter decode not implemented");
    },

    encode: function(input){
        throw new Error("PDFDCTFilter encode not implemented");
    }
});