// #import "JSKit/JSKit.js"
/* global JSClass, JSObject */
'use strict';

JSClass("PDFFilter", JSObject, {
    decode: function(input){
        throw new Error("PDFilter decode abstract method must be implemented by subclass");
    },

    encode: function(input){
        throw new Error("PDFilter encode abstract method must be implemented by subclass");
    }
});