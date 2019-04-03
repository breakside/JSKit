// #import ImageKit
// #import "PDFKit/PDFStream.js"
/* global JSGlobalObject, PDFStream, PDFObjectProperty, PDFName, PDFXObject, JSSize, IKBitmap */
'use strict';

JSGlobalObject.PDFXObject = function(){
    if (this === undefined){
        return new PDFXObject();
    }
};

JSGlobalObject.PDFXObject.prototype = Object.create(PDFStream.prototype, {
    Type: { enumerable: true, value: PDFName("XObject") },

    load: {
        value: function PDFXObject_load(completion, target){
            completion.call(target);
        }
    }
});