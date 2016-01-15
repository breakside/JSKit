// #import "PDFKit/PDFFilter.js"
/* global JSClass, JSObject, PDFFilter */
'use strict';

JSClass("PDFJPXFilter", PDFFilter, {
    decode: function(input){
        throw new Error("PDFJPXFilter decode not implemented");
    },

    encode: function(input){
        throw new Error("PDFJPXFilter encode not implemented");
    }
});