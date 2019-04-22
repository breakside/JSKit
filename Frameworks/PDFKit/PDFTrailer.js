// #import "PDFObject.js"
/* global JSGlobalObject, PDFObject, PDFObjectProperty, PDFTrailer, PDFName */
'use strict';

JSGlobalObject.PDFTrailer = function(){
    if (this === undefined){
        return new PDFTrailer();
    }
};

JSGlobalObject.PDFTrailer.prototype = Object.create(PDFObject.prototype, {
    Size:       PDFObjectProperty,
    Prev:       PDFObjectProperty,
    XRefStm:    PDFObjectProperty,
    Root:       PDFObjectProperty,
    Encrypt:    PDFObjectProperty,
    Info:       PDFObjectProperty,
    ID:         PDFObjectProperty,
});