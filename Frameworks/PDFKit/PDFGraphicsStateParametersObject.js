// #import "PDFKit/PDFObject.js"
/* global JSGlobalObject, PDFObject, PDFObjectProperty, PDFGraphicsStateParametersObject, PDFNameObject */
'use strict';


JSGlobalObject.PDFGraphicsStateParametersObject = function(){
    if (this === undefined){
        return new PDFGraphicsStateParametersObject();
    }
};

JSGlobalObject.PDFGraphicsStateParametersObject.prototype = Object.create(PDFObject.prototype, {
    Type:   { eunmerable: true, value: PDFNameObject("ExtGState") },
    Font:   PDFObjectProperty,
    CA:     PDFObjectProperty,
    ca:     PDFObjectProperty
});