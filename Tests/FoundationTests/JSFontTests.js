// #import Foundation
// #import TestKit
"use strict";

JSClass("JSFontTests", TKTestSuite, {

    bundle: null,

    setup: function(){
        this.bundle = JSBundle.initWithDictionary({
            Info: {},
            Resources: [
                JSFontMockDescriptor.Resources.normal,
                JSFontMockDescriptor.Resources.bold,
            ],
            Fonts: [
                 0,
                 1
            ]
        });
        JSFont.registerBundleFonts(this.bundle);
    },

    teardown: function(){
        JSFont.unregisterAllFonts();
    },

    testInitFromDictionary: function(){
        var dictionary = {
            family: "Dummy",
            weight: 400,
            style: "normal",
            size: 20
        };
        var font = JSFont.initFromDictionary(dictionary);
        TKAssertNotNull(font);
        TKAssertExactEquals(font.descriptor.family, "Dummy");
        TKAssertExactEquals(font.descriptor.weight, JSFont.Weight.regular);
        TKAssertExactEquals(font.descriptor.style, JSFont.Style.normal);
        TKAssertExactEquals(font.pointSize, 20);

    },

    testDictionaryRepresentation: function(){
        var font = JSFont.fontWithFamily("Dummy", 20, JSFont.Weight.bold, JSFont.Style.normal);
        var dictionary = font.dictionaryRepresentation();
        TKAssertExactEquals(dictionary.family, "Dummy");
        TKAssertExactEquals(dictionary.weight, 700);
        TKAssertExactEquals(dictionary.style, "normal");
        TKAssertExactEquals(dictionary.size, 20);
    }

});


JSClass("JSFontMockDescriptor", JSFontDescriptor, {

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
        var descriptor = JSFontMockDescriptor.init();
        descriptor._weight = weight;
        return descriptor;
    },

    descriptorWithStyle: function(style){
        var descriptor = JSFontMockDescriptor.init();
        descriptor._style = style;
        return descriptor;
    },

    widthOfGlyph: function(){
        return 1;
    }
});

JSFontMockDescriptor.Resources = {
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