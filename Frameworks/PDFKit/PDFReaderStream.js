// #import "Foundation/Foundation.js"
// #import "PDFKit/PDFTypes.js"
/* global JSClass, JSObject, JSReadOnlyProperty, PDFTokenizer, PDFReaderStream, PDFReaderDataStream, JSData */
/* global PDFIndirectObject, PDFName, PDFObject, PDFDocument, PDFPages, PDFPage, PDFResources, PDFGraphicsStateParameters, PDFStream, PDFTrailer, PDFFont, PDFType1FontObject, PDFTrueTypeFontObject, PDFImage */
'use strict';

(function(){

JSClass("PDFReaderStream", JSObject, {

    length: JSReadOnlyProperty(),
    offset: JSReadOnlyProperty(),

    byte: function(){
    },

    seek: function(offset){
    },

    byteBackwards: function(){
        this.back();
        var byte = this.byte();
        this.back();
        return byte;
    },

    seekRelative: function(offset){
        this.seek(this.offset + offset);
    },

    seekToStartOfLine: function(offset){
        var length = 0;
        var byte = this.byteBackwards();
        if (byte == PDFTokenizer.Whitespace.lineFeed){
            byte = this.byteBackwards();
        }
        if (byte == PDFTokenizer.Whitespace.carriageReturn){
            byte = this.byteBackwards();
        }
        while (byte !== null && byte != PDFTokenizer.Whitespace.carriageReturn && byte != PDFTokenizer.Whitespace.lineFeed && length < 256){
            byte = this.byteBackwards();
        }
        if (byte == PDFTokenizer.Whitespace.carriageReturn || byte == PDFTokenizer.Whitespace.lineFeed){
            byte = this.byte();
        }
    },

    readLine: function(){
        var bytes = new Uint8Array(256);
        var length = 0;
        var byte = this.byte();
        while (byte !== null && byte != PDFTokenizer.Whitespace.carriageReturn && byte != PDFTokenizer.Whitespace.lineFeed && length < 256){
            bytes[length++] = byte;
            byte = this.byte();
        }
        if (byte == PDFTokenizer.Whitespace.carriageReturn){
            byte = this.byte();
            if (byte != PDFTokenizer.Whitespace.lineFeed && byte !== null){
                this.seekRelative(-1);
            }
        }
        bytes = new Uint8Array(bytes.buffer, bytes.byteOffset, length);
        return JSData.initWithBytes(bytes);
    },

    read: function(count){
        var bytes = new Uint8Array(count);
        var length = 0;
        var byte;
        while (length < count){
            byte = this.byte();
            if (byte === null){
                break;
            }
            bytes[length++] = byte;
        }
        bytes = new Uint8Array(bytes.buffer, bytes.byteOffset, length);
        return JSData.initWithBytes(bytes);
    },

});

JSClass("PDFReaderDataStream", PDFReaderStream, {

    _data: null,
    _offset: null,

    initWithData: function(data){
        this._data = data;
        this._offset = 0;
    },

    byte: function(){
        if (this._offset >= this._data.length){
            return null;
        }
        return this._data.bytes[this._offset++];
    },

    byteBackwards: function(){
        if (this._offset === 0){
            return null;
        }
        return this._data.bytes[--this._offset];
    },

    seek: function(offset){
        this._offset = offset;
    },

    getOffset: function(){
        return this._offset;
    },

    getLength: function(){
        return this._data.length;
    }

});


})();