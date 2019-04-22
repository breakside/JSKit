// #import "PDFObject.js"
/* global JSGlobalObject, JSClass, JSData, PDFCMap, PDFObject, PDFName, PDFOperationIterator, PDFObjectProperty, PDFOperationItertor */
'use strict';

(function(){

JSGlobalObject.PDFCMap = function(){
    if (this === undefined){
        return new PDFCMap();
    }
};

JSGlobalObject.PDFCMap.prototype = Object.create(PDFObject.prototype, {
    Type:           { enumerable: true, value: PDFName("CMap") },
    CMapName:       PDFObjectProperty,
    CIDSystemInfo:  PDFObjectProperty,
    WMode:          PDFObjectProperty,
    UseCMap:        PDFObjectProperty
});

})();