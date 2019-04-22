// #import "PDFFilter.js"
/* global JSClass, JSObject, PDFFilter */
'use strict';

// The stream data is a JPEG2000 image, so we probably don't need to decode

JSClass("PDFJPXFilter", PDFFilter, {
    decode: function(input){
        throw new Error("PDFJPXFilter decode not implemented");
    },

    encode: function(input){
        throw new Error("PDFJPXFilter encode not implemented");
    }
});