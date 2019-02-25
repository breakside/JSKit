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

    effectiveMediaBox: {
        enumerable: false,
        get: function PDFPageObject_getEffectiveMediaBox(){
            if (this.MediaBox){
                return this.MediaBox;
            }
            if (this.Parent){
                return this.Parent.effectiveMediaBox;
            }
            return null;
        }
    },

    inheritedCropBox: {
        enumerable: false,
        get: function PDFPageObject_getEffectiveMediaBox(){
            if (this.CropBox){
                return this.CropBox;
            }
            if (this.Parent){
                return this.Parent.inheritedCropBox;
            }
            return null;
        }
    },

    effectiveRotation: {
        enumerable: false,
        get: function PDFPageObject_getEffectiveMediaBox(){
            if (this.Rotate){
                return this.Rotate;
            }
            if (this.Parent){
                return this.Parent.effectiveRotation;
            }
            return 0;
        }
    },

    page: {
        value: function PDFPageTreeNodeObject_getPage(index){
            var kid;
            var number = 0;
            for (var i = 0, l = this.Kids.length; i < l; ++i){
                kid = this.Kids[i];
                kid.Parent = this;
                if (kid.Type == "Pages"){
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