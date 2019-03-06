// #import "PDFKit/PDFObject.js"
// #import "PDFKit/PDFColorSpace.js"
/* global JSGlobalObject, JSLog, PDFObject, PDFObjectProperty, PDFResources, PDFName, PDFColorSpace */
'use strict';

(function(){

var logger = JSLog("PDFKit", "Resources");

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

    fonts: {
        value: function PDFResources_getFonts(){
            var fonts = this.Font;
            var list = [];
            for (var name in fonts){
                list.push(fonts[name]);
            }
            return list;
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
                    fonts.push(this.Font[name]);
                }
            }
            var fontIndex = 0;
            var handleFontLoad = function PDFResources_load_handleFont(){
                var font = fonts[fontIndex];
                ++fontIndex;
                if (fontIndex < fonts.length){
                    fonts[fontIndex].load(handleFontLoad, this);
                }else{
                    completion.call(target);
                }
            };
            if (fonts.length > 0){
                fonts[fontIndex].load(handleFontLoad, this);
            }else{
                completion.call(target);
            }
        }
    },

    unload: {
        value: function PDFResources_unload(){
        }
    }

});

})();