// #import "PDFKit/PDFObject.js"
/* global JSGlobalObject, PDFObject, PDFObjectProperty, PDFFontDescriptorObject, PDFNameObject, PDFType1FontObject, PDFTrueTypeFontObject */
'use strict';

JSGlobalObject.PDFFontDescriptorObject = function(){
    if (this === undefined){
        return new PDFFontDescriptorObject();
    }
};

JSGlobalObject.PDFFontDescriptorObject.prototype = Object.create(PDFObject.prototype, {
    Type:           { enumerable: true, value: PDFNameObject("FontDescriptor") }
});