// #import "PDFKit/PDFObject.js"
/* global JSGlobalObject, PDFObject, PDFObjectProperty, PDFTrailerObject, PDFNameObject */
'use strict';

JSGlobalObject.PDFTrailerObject = function(){
    if (this === undefined){
        return new PDFTrailerObject();
    }
};

JSGlobalObject.PDFTrailerObject.prototype = Object.create(PDFObject.prototype, {
    Size:       PDFObjectProperty,
    Prev:       PDFObjectProperty,
    XRefStm:    PDFObjectProperty,
    Root:       PDFObjectProperty,
    Encrypt:    PDFObjectProperty,
    Info:       PDFObjectProperty,
    ID:         PDFObjectProperty,
});