// #import "PDFKit/PDFObject.js"
/* global JSGlobalObject, JSClass, PDFCMap, PDFObject, PDFName, PDFObjectProperty */
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