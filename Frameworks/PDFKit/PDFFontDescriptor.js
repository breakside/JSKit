// #import "PDFKit/PDFObject.js"
/* global JSGlobalObject, PDFObject, PDFObjectProperty, PDFFontDescriptor, PDFName, PDFType1FontObject, PDFTrueTypeFontObject */
'use strict';

JSGlobalObject.PDFFontDescriptor = function(){
    if (this === undefined){
        return new PDFFontDescriptor();
    }
};

JSGlobalObject.PDFFontDescriptor.prototype = Object.create(PDFObject.prototype, {
    Type:           { enumerable: true, value: PDFName("FontDescriptor") }
});