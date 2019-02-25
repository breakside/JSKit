// #import "PDFKit/PDFStream.js"
/* global JSGlobalObject, PDFStream, PDFObjectProperty, PDFName, PDFImage */
'use strict';

JSGlobalObject.PDFImage = function(){
    if (this === undefined){
        return new PDFImage();
    }
};

JSGlobalObject.PDFImage.prototype = Object.create(PDFStream.prototype, {
    Type:               { enumerable: true, value: PDFName("XObject") },
    Subtype:            { enumerable: true, value: PDFName("Image") },
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