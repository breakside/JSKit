// #import "PDFKit/PDFObject.js"
/* global JSGlobalObject, PDFObject, PDFObjectProperty, PDFGraphicsStateParameters, PDFName */
'use strict';


JSGlobalObject.PDFGraphicsStateParameters = function(){
    if (this === undefined){
        return new PDFGraphicsStateParameters();
    }
};

JSGlobalObject.PDFGraphicsStateParameters.prototype = Object.create(PDFObject.prototype, {
    Type:   { eunmerable: true, value: PDFName("ExtGState") },
    Font:   PDFObjectProperty,
    CA:     PDFObjectProperty,
    ca:     PDFObjectProperty
});