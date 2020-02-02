// #import "PDFObject.js"
// #import "PDFColorSpace.js"
'use strict';

(function(){

var logger = JSLog("pdfkit", "Resources");

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

    _cachedColorSpacesByName: {
        writable: true,
        value: null,
    },

    colorSpace: {
        value: function PDFResources_getColorSpace(name){
            var spaces = this._cachedColorSpacesByName;
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

    _cachedImagesByName: {
        writable: true,
        value: null,
    },

    image: {
        value: function PDFResources_getImage(name){
            return this._cachedImagesByName[name];
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
            var loadables = [];
            if (this.Font){
                for (name in this.Font){
                    loadables.push(this.Font[name]);
                }
            }
            if (this.XObject){
                for (name in this.XObject){
                    loadables.push(this.XObject[name]);
                }
            }
            if (this.ColorSpace){
                this._cachedColorSpacesByName = {};
                for (name in this.ColorSpace){
                    this._cachedColorSpacesByName[name] = PDFColorSpace(this.ColorSpace[name]);
                    loadables.push(this._cachedColorSpacesByName[name]);
                }
            }
            var i, l;
            for (i = loadables.length - 1; i >= 0; --i){
                if (!loadables[i].load){
                    loadables.splice(i, 1);
                }
            }
            var remaining = loadables.length;
            if (remaining === 0){
                completion.call(target);
                return;
            }
            var handleLoad = function PDFResources_load_handleLoad(){
                --remaining;
                if (remaining === 0){
                    if (this.XObject){
                        // Some Form XObjects in early version of pdf don't have their own resources,
                        // and instead use the page's resources.  We'll fill in the gaps after everything
                        // is loaded.
                        var xobj;
                        for (var name in this.XObject){
                            xobj = this.XObject[name];
                            if (xobj.Subtype == "Form" && xobj.drawing && !xobj.drawing.resources){
                                xobj.drawing.resources = this;
                            }
                        }
                    }
                    completion.call(target);
                }
            };
            for (i = 0, l = loadables.length; i < l; ++i){
                loadables[i].load(handleLoad, this);
            }
        }
    },

    unload: {
        value: function PDFResources_unload(){
        }
    }

});

})();