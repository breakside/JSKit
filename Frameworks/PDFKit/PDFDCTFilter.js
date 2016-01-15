// #import "PDFKit/PDFFilter.js"
/* global JSClass, JSObject, PDFFilter */
'use strict';

JSClass("PDFDCTFilter", PDFFilter, {
    decode: function(input){
        throw new Error("PDFDCTFilter decode not implemented");
    },

    encode: function(input){
        throw new Error("PDFDCTFilter encode not implemented");
    }
});