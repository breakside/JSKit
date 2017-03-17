// #feature Uint8Array
// #import "Foundation/JSObject.js"
// #import "Foundation/Uint8Array+JS.js"
/* global JSClass, JSObject, JSData */
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
    },

    subdataInRange: function(range){
        var bytes = new Uint8Array(this.bytes.buffer, this.bytes.byteOffset + range.location, range.length);
        return JSData.initWithBytes(bytes);
    },

    dataByDecodingPercentEscapes: function(decodePlusAsSpace){
        return JSData.initWithBytes(this.bytes.arrayByDecodingPercentEscapes(decodePlusAsSpace));
    },

    dataByEncodingPercentEscapes: function(reserved, encodeSpaceAsPlus){
        return JSData.initWithBytes(this.bytes.arrayByEncodingPercentEscapes(reserved, encodeSpaceAsPlus));
    },

});