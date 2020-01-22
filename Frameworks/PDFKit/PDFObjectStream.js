// #import "PDFStream.js"
// #import "PDFName.js"
/* global PDFTokenizer */
'use strict';

JSGlobalObject.PDFObjectStream = function(){
    if (this === undefined){
        return new PDFObjectStream();
    }
};

JSGlobalObject.PDFObjectStream.prototype = Object.create(PDFStream.prototype, {
    Type:           { enumerable: true, value: PDFName("ObjStm") },
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
        value: function PDFObjectStream_getObject(index){
            var offset = this.First + this.objectOffsets[index].offset;
            this.tokenizer.stream.seek(offset);
            var object = this.tokenizer.readObject();
            return object;
        }
    }
});