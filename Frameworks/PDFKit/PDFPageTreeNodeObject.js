// #import "PDFKit/PDFObject.js"
// #import "PDFKit/PDFNameObject.js"
/* global JSGlobalObject, PDFObject, PDFObjectProperty, PDFPageTreeNodeObject, PDFNameObject */
'use strict';

JSGlobalObject.PDFPageTreeNodeObject = function(){
    if (this === undefined){
        return new PDFPageTreeNodeObject();
    }
    this.Kids = [];
    this.Count = 0;
};

JSGlobalObject.PDFPageTreeNodeObject.prototype = Object.create(PDFObject.prototype, {
    Type:       { enumerable: true, value: PDFNameObject("Pages") },
    Parent:     PDFObjectProperty,
    Kids:       PDFObjectProperty,
    Count:      PDFObjectProperty,
    Resources:  PDFObjectProperty,
    MediaBox:   PDFObjectProperty,
    CropBox:    PDFObjectProperty,
    Rotate:     PDFObjectProperty,
});