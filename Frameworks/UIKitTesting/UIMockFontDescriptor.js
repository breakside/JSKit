// #import UIKit
"use strict";

JSClass("UIMockFontDescriptor", JSFontDescriptor, {

    init: function(){
        this._family = "Dummy";
        this._weight = JSFont.Weight.regular;
        this._style = JSFont.Style.normal;
        this._face = "NA";
        this._postScriptName = "Dummy";
        this._ascender = 1700;
        this._descender = -300;
        this._unitsPerEM = 2048;
    },

    descriptorWithWeight: function(weight){
        var descriptor = UIMockFontDescriptor.init();
        descriptor._weight = weight;
        return descriptor;
    },

    descriptorWithStyle: function(style){
        var descriptor = UIMockFontDescriptor.init();
        descriptor._style = style;
        return descriptor;
    },

    widthOfGlyph: function(){
        return 1;
    }
});

UIMockFontDescriptor.Resources = {
    normal: {
        font: {
            ascender: 1700,
            cmap: {
                format: 13,
                data: "eJwBEADv/wEAAAAAAAAA/////wAAAAAaBgP+",
            },
            descender: -300,
            face: "Regular",
            family: "Dummy",
            name: "Dummy Regular",
            postscript_name: "Dummy-Regular",
            style: "normal",
            unique_identifier: "UIKitTesting;dummy-regular",
            unitsPerEM: 2048,
            weight: 400,
            widths: "eJwBAgD9/wAIAAoACQ=="
        }
    },
    bold: {
        font: {
            ascender: 1700,
            cmap: {
                format: 13,
                data: "eJwBEADv/wEAAAAAAAAA/////wAAAAAaBgP+",
            },
            descender: -300,
            face: "Bold",
            family: "Dummy",
            name: "Dummy Bold",
            postscript_name: "Dummy-Bold",
            style: "normal",
            unique_identifier: "UIKitTesting;dummy-bold",
            unitsPerEM: 2048,
            weight: 700,
            widths: "eJwBAgD9/wAIAAoACQ=="
        }
    }
};