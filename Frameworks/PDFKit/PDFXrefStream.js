// #import "PDFKit/PDFStream.js"
/* global JSGlobalObject, PDFStream, PDFObjectProperty, PDFXrefStream, PDFName */
'use strict';


JSGlobalObject.PDFXrefStream = function(){
    if (this === undefined){
        return new PDFXrefStream();
    }
};

JSGlobalObject.PDFXrefStream.prototype = Object.create(PDFStream.prototype, {
    Type:           { enumerable: true, value: PDFName("XRef") },
    Size:           PDFObjectProperty,
    Index:          PDFObjectProperty,
    Prev:           PDFObjectProperty,
    W:              PDFObjectProperty,
    Root:           PDFObjectProperty,
    Encrypt:        PDFObjectProperty,
    Info:           PDFObjectProperty,
    ID:             PDFObjectProperty
});