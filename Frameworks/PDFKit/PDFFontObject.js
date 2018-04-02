// #import "PDFKit/PDFObject.js"
/* global JSGlobalObject, PDFObject, PDFObjectProperty, PDFFontObject, PDFNameObject, PDFType1FontObject, PDFTrueTypeFontObject */
'use strict';

JSGlobalObject.PDFFontObject = function(){
    if (this === undefined){
        return new PDFFontObject();
    }
};

JSGlobalObject.PDFFontObject.prototype = Object.create(PDFObject.prototype, {
    Type:           { enumerable: true, value: PDFNameObject("Font") },
    Subtype:        PDFObjectProperty,
});

JSGlobalObject.PDFType1FontObject = function(){
    if (this === undefined){
        return new PDFType1FontObject();
    }
};

JSGlobalObject.PDFType1FontObject.prototype = Object.create(PDFFontObject.prototype, {
    Subtype:        { enumerable: true, value: PDFNameObject("Type1") },
    Name:           PDFObjectProperty,
    BaseFont:       PDFObjectProperty,
    FisrtChar:      PDFObjectProperty,
    LastChar:       PDFObjectProperty,
    Widths:         PDFObjectProperty,
    FontDescriptor: PDFObjectProperty,
    Encoding:       PDFObjectProperty,
    ToUnicode:      PDFObjectProperty
});

JSGlobalObject.PDFTrueTypeFontObject = function(){
    if (this === undefined){
        return new PDFTrueTypeFontObject();
    }
};

JSGlobalObject.PDFTrueTypeFontObject.prototype = Object.create(PDFType1FontObject.prototype, {
    Subtype:    { enumerable: true, value: PDFNameObject("TrueType") },
});