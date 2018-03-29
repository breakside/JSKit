// #import "PDFKit/PDFObject.js"
/* global JSGlobalObject, PDFObject, PDFObjectProperty, PDFResourcesObject, PDFNameObject */
'use strict';

JSGlobalObject.PDFResourcesObject = function(){
    if (this === undefined){
        return new PDFResourcesObject();
    }
};

JSGlobalObject.PDFResourcesObject.prototype = Object.create(PDFObject.prototype, {
    ExtGState:  PDFObjectProperty,
    ColorSpace: PDFObjectProperty,
    Pattern:    PDFObjectProperty,
    Shading:    PDFObjectProperty,
    XObject:    PDFObjectProperty,
    Font:       PDFObjectProperty,
    ProcSet:    PDFObjectProperty,
    Properties: PDFObjectProperty
});