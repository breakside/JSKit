// #import "PDFKit/PDFObject.js"
// #import "PDFKit/PDFColorSpace.js"
/* global JSGlobalObject, PDFObject, PDFObjectProperty, PDFResources, PDFName, PDFColorSpace */
'use strict';

(function(){

JSGlobalObject.PDFResources = function(){
    if (this === undefined){
        return new PDFResources();
    }
};

JSGlobalObject.PDFResources.prototype = Object.create(PDFObject.prototype, {
    ExtGState:  PDFObjectProperty,
    ColorSpace: PDFObjectProperty,
    Pattern:    PDFObjectProperty,
    Shading:    PDFObjectProperty,
    XObject:    PDFObjectProperty,
    Font:       PDFObjectProperty,
    ProcSet:    PDFObjectProperty,
    Properties: PDFObjectProperty,

    graphicsState: {
        value: function PDFResources_getGraphicsState(name){
            var states = this.ExtGState;
            if (name in states){
                return states[name];
            }
            return null;
        }
    },

    colorSpace: {
        value: function PDFResources_getColorSpace(name){
            var spaces = this.ColorSpace;
            if (spaces && (name in spaces)){
                return spaces[name];
            }
            return null;
        }
    },

    xObject: {
        value: function PDFResources_getXObject(name){
            var objects = this.XObject;
            if (name in objects){
                return objects[name];
            }
            return null;
        }
    },

    font: {
        value: function PDFResources_getFont(name){
            var fonts = this.Font;
            if (name in fonts){
                return fonts[name];
            }
            return null;
        }
    },

    _loaded: {
        value: {
            ExtGState: {},
            ColorSpace: {},
            XObject: {},
            Font: {}
        }
    },

    load: {
        value: function PDFResources_load(completion, target){
            var name;
            var fonts = [];
            var colorSpaces = [];
            var xObjects = [];
            if (this.Font){
                for (name in this.Font){
                    fonts.push({name: name, font: this.Font[name]});
                }
            }
            completion.call(target);
        }
    },

    unload: {
        value: function PDFResources_unload(){
            this._loaded.ExtGState = {};
            this._loaded.ColorSpace = {};
            this._loaded.XObject = {};
            this._loaded.Font = {};
        }
    }

});

})();