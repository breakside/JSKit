// #import "PDFKit/PDFStreamObject.js"
/* global JSGlobalObject, PDFStreamObject, PDFObjectProperty, PDFXrefStreamObject, PDFNameObject */
'use strict';


JSGlobalObject.PDFXrefStreamObject = function(){
    if (this === undefined){
        return new PDFXrefStreamObject();
    }
};

JSGlobalObject.PDFXrefStreamObject.prototype = Object.create(PDFStreamObject.prototype, {
    Type:           { enumerable: true, value: PDFNameObject("XRef") },
    Size:           PDFObjectProperty,
    Index:          PDFObjectProperty,
    Prev:           PDFObjectProperty,
    W:              PDFObjectProperty,
    Root:           PDFObjectProperty,
    Encrypt:        PDFObjectProperty,
    Info:           PDFObjectProperty,
    ID:             PDFObjectProperty
});