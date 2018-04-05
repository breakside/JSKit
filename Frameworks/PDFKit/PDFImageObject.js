// #import "PDFKit/PDFStreamObject.js"
/* global JSGlobalObject, PDFStreamObject, PDFObjectProperty, PDFNameObject, PDFImageObject */
'use strict';

JSGlobalObject.PDFImageObject = function(){
    if (this === undefined){
        return new PDFImageObject();
    }
};

JSGlobalObject.PDFImageObject.prototype = Object.create(PDFStreamObject.prototype, {
    Type:               { enumerable: true, value: PDFNameObject("Font") },
    Subtype:            { enumerable: true, value: PDFNameObject("Image") },
    Width:              PDFObjectProperty,
    Height:             PDFObjectProperty,
    ColorSpace:         PDFObjectProperty,
    BitsPerComponent:   PDFObjectProperty,
    Intent:             PDFObjectProperty,
    ImageMask:          PDFObjectProperty,
    Mask:               PDFObjectProperty,
    Decode:             PDFObjectProperty,
    Interpolate:        PDFObjectProperty,
    Alternates:         PDFObjectProperty,
    SMask:              PDFObjectProperty,
    SMaskInData:        PDFObjectProperty,
    Name:               PDFObjectProperty,
    StructParent:       PDFObjectProperty,
    ID:                 PDFObjectProperty,
    OPI:                PDFObjectProperty,
    Metadata:           PDFObjectProperty,
    OC:                 PDFObjectProperty
});