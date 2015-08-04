// #feature Uint8Array
// #import "JSKit/JSObject.js"
/* global JSClass, JSObject */
'use strict';

JSClass("JSData", JSObject, {

    bytes: null,
    length: null,

    initWithLength: function(length){
        this.bytes = new Uint8Array(length);
        this.length = length;
    },

    initWithBytes: function(bytes){
        this.bytes = bytes;
        this.length = this.bytes.length;
    },

    truncateToLength: function(length){
        this.bytes = new Uint8Array(this.bytes.buffer, this.bytes.byteOffset, length);
        this.length = length;
    },

    increaseLengthBy: function(length){
        var bytes = new Uint8Array(this.length + length);
        for (var i = 0, l = this.length; i < l; ++i){
            bytes[i] = this.bytes[i];
        }
        this.bytes = bytes;
        this.length = this.bytes.length;
    }

});