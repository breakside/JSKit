// #import "PDFKit/PDFFilter.js"
/* global JSClass, JSObject, PDFFilter */
'use strict';

JSClass("PDFCryptFilter", PDFFilter, {
    decode: function(input){
        throw new Error("PDFCryptFilter decode not implemented");
    },

    encode: function(input){
        throw new Error("PDFCryptFilter encode not implemented");
    }
});