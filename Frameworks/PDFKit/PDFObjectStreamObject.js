// #import "PDFKit/PDFStreamObject.js"
/* global JSGlobalObject, PDFStreamObject, PDFObjectProperty, PDFObjectStreamObject, PDFNameObject, PDFTokenizer */
'use strict';

JSGlobalObject.PDFObjectStreamObject = function(){
    if (this === undefined){
        return new PDFObjectStreamObject();
    }
};

JSGlobalObject.PDFObjectStreamObject.prototype = Object.create(PDFStreamObject.prototype, {
    Type:           { enumerable: true, value: PDFNameObject("ObjStm") },
    N:              PDFObjectProperty,
    First:          PDFObjectProperty,
    Extends:        PDFObjectProperty,

    tokenizer: {
        writable: true,
        value: null
    },

    objectOffsets: {
        configurable: true,
        get: function(){
            var offsets = [];
            var Token = PDFTokenizer.Token;
            this.tokenizer.stream.seek(0);
            var token;
            var entry;
            for (var i = 0, l = this.N; i < l; ++i){
                entry = {objectID: 0, offset: 0};
                token = this.tokenizer.readMeaningfulToken(Token.integer);
                entry.objectID = token.pdfObject;
                token = this.tokenizer.readMeaningfulToken(Token.integer);
                entry.offset = token.pdfObject;
                offsets.push(entry);
            }
            Object.defineProperty(this, 'objectOffsets', {value: offsets});
            return offsets;
        }
    },

    object: {
        value: function PDFObjectStreamObject_getObject(index){
            var offset = this.First + this.objectOffsets[index].offset;
            this.tokenizer.stream.seek(offset);
            var object = this.tokenizer.readObject();
            return object;
        }
    }
});