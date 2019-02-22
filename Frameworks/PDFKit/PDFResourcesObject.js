// #import "PDFKit/PDFObject.js"
/* global JSGlobalObject, PDFObject, PDFObjectProperty, PDFResourcesObject, PDFNameObject */
'use strict';

JSGlobalObject.PDFResourcesObject = function(){
    if (this === undefined){
        return new PDFResourcesObject();
    }
};

JSGlobalObject.PDFResourcesObject.prototype = Object.create(PDFObject.prototype, {
    ExtGState:  PDFObjectProperty,
    ColorSpace: PDFObjectProperty,
    Pattern:    PDFObjectProperty,
    Shading:    PDFObjectProperty,
    XObject:    PDFObjectProperty,
    Font:       PDFObjectProperty,
    ProcSet:    PDFObjectProperty,
    Properties: PDFObjectProperty,

    colorSpace: {
        value: function PDFResourcesObject_getColorSpace(name){
            var spaces = this.ColorSpace;
            if (name in spaces){
                return spaces[name];
            }
            return null;
        }
    },

    xObject: {
        value: function PDFResourcesObject_getXObject(name){
            var objects = this.XObject;
            if (name in objects){
                return objects[name];
            }
            return null;
        }
    },

    graphicsState: {
        value: function PDFResourcesObject_getGraphicsState(name){
            var states = this.ExtGState;
            if (name in states){
                return states[name];
            }
            return null;
        }
    },

    font: {
        value: function PDFResourcesObject_getFont(name){
            var fonts = this.Font;
            if (name in fonts){
                return fonts[name];
            }
            return null;
        }
    }
});