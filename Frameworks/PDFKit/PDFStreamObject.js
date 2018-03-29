// #import "PDFKit/PDFObject.js"
/* global JSGlobalObject, PDFObject, PDFObjectProperty, PDFStreamObject, PDFNameObject */
'use strict';


JSGlobalObject.PDFStreamObject = function(){
    if (this === undefined){
        return new PDFStreamObject();
    }
};

JSGlobalObject.PDFStreamObject.prototype = Object.create(PDFObject.prototype, {
    Length:         PDFObjectProperty,
    Filter:         PDFObjectProperty,
    DecodeParams:   PDFObjectProperty,
    F:              PDFObjectProperty,
    FFilter:        PDFObjectProperty,
    FDecodeParams:  PDFObjectProperty,
    DL:             PDFObjectProperty
});