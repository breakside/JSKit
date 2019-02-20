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

    page: {
        value: function PDFPageTreeNodeObject_getPage(index){
            var kid;
            var number = 0;
            for (var i = 0, l = this.Kids.length; i < l; ++i){
                kid = this.Kids[i];
                if (kid.type == "Pages"){
                    if (index - number < kid.Count){
                        return kid.page(index - number);
                    }
                    number += kid.Count;
                }else{
                    if (number == index){
                        return kid;
                    }
                    number += 1;
                }
            }
            return null;
        }
    }
});