// #import "PDFKit/PDFFilter.js"
/* global JSClass, JSObject, PDFFilter */
'use strict';

JSClass("PDFCCITTFaxFilter", PDFFilter, {
    decode: function(input){
        throw new Error("PDFCCITTFaxFilter decode not implemented");
    },

    encode: function(input){
        throw new Error("PDFCCITTFaxFilter encode not implemented");
    }
});