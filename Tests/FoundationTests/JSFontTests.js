// #import Foundation
// #import TestKit
"use strict";

JSClass("JSFontTests", TKTestSuite, {

    bundle: null,
    descriptors: null,

    setup: function(){
        this.bundle = JSBundle.initWithDictionary({
            Info: {},
            Resources: [
                JSFontMockDescriptor.Resources.normal,
                JSFontMockDescriptor.Resources.bold,
                JSFontMockDescriptor.Resources.boldItalic,
                JSFontMockDescriptor.Resources.light,
                JSFontMockDescriptor.Resources.semibold
            ],
            ResourceLookup:{
                global: {
                    "Dummy-Regular": [0],
                    "Dummy-Regular.otf": [0],
                    "Dummy-Bold": [1],
                    "Dummy-Bold.otf": [1],
                    "Dummy-BoldItalic": [2],
                    "Dummy-BoldItalic.otf": [2],
                    "Dummy-Light": [3],
                    "Dummy-Light.otf": [3],
                    "Dummy-SemiBold": [4],
                    "Dummy-SemiBold.otf": [4],
                }
            },
            Fonts: [
                 0,
                 1,
                 2,
                 3,
                 4
            ]
        });
        this.descriptors = JSFont.registerBundleFonts(this.bundle);
    },

    teardown: function(){
        JSFont.unregisterAllFonts();
    },

    testSystemFont: function(){
        JSFont.registerSystemFontDescriptor(this.descriptors[0]);
        var font = JSFont.systemFontOfSize(30);
        TKAssertNotNull(font);
        TKAssertExactEquals(font.descriptor.family, "Dummy");
        TKAssertExactEquals(font.descriptor.weight, JSFont.Weight.regular);
        TKAssertExactEquals(font.descriptor.style, JSFont.Style.normal);
        TKAssertExactEquals(font.pointSize, 30);
        TKAssertExactEquals(font.descriptor, this.descriptors[0]);
    },

    testFontWithWeight: function(){
        var font = JSFont.initWithDescriptor(this.descriptors[0], 30).fontWithWeight(JSFont.Weight.bold);
        TKAssertNotNull(font);
        TKAssertExactEquals(font.descriptor.family, "Dummy");
        TKAssertExactEquals(font.descriptor.weight, JSFont.Weight.bold);
        TKAssertExactEquals(font.descriptor.style, JSFont.Style.normal);
        TKAssertExactEquals(font.pointSize, 30);
        TKAssertExactEquals(font.descriptor, this.descriptors[1]);
    },

    testBolderFont: function(){
        var font = JSFont.initWithDescriptor(this.descriptors[0], 30).bolderFont();
        TKAssertNotNull(font);
        TKAssertExactEquals(font.descriptor.family, "Dummy");
        TKAssertExactEquals(font.descriptor.weight, JSFont.Weight.bold);
        TKAssertExactEquals(font.descriptor.style, JSFont.Style.normal);
        TKAssertExactEquals(font.pointSize, 30);
        TKAssertExactEquals(font.descriptor, this.descriptors[1]);

        font = JSFont.initWithDescriptor(this.descriptors[3], 30).bolderFont();
        TKAssertNotNull(font);
        TKAssertExactEquals(font.descriptor.family, "Dummy");
        TKAssertExactEquals(font.descriptor.weight, JSFont.Weight.semibold);
        TKAssertExactEquals(font.descriptor.style, JSFont.Style.normal);
        TKAssertExactEquals(font.pointSize, 30);
        TKAssertExactEquals(font.descriptor, this.descriptors[4]);

        font = JSFont.initWithDescriptor(this.descriptors[1], 30).bolderFont();
        TKAssertNotNull(font);
        TKAssertExactEquals(font.descriptor.family, "Dummy");
        TKAssertExactEquals(font.descriptor.weight, JSFont.Weight.bold);
        TKAssertExactEquals(font.descriptor.style, JSFont.Style.normal);
        TKAssertExactEquals(font.pointSize, 30);
        TKAssertExactEquals(font.descriptor, this.descriptors[1]);
    },

    testFontWithStyle: function(){
        var font = JSFont.initWithDescriptor(this.descriptors[1], 30).fontWithStyle(JSFont.Style.italic);
        TKAssertNotNull(font);
        TKAssertExactEquals(font.descriptor.family, "Dummy");
        TKAssertExactEquals(font.descriptor.weight, JSFont.Weight.bold);
        TKAssertExactEquals(font.descriptor.style, JSFont.Style.italic);
        TKAssertExactEquals(font.pointSize, 30);
        TKAssertExactEquals(font.descriptor, this.descriptors[2]);
    },

    testFontWithFamily: function(){
        var font = JSFont.fontWithFamily("Dummy", 20);
        TKAssertNotNull(font);
        TKAssertExactEquals(font.descriptor.family, "Dummy");
        TKAssertExactEquals(font.descriptor.weight, JSFont.Weight.regular);
        TKAssertExactEquals(font.descriptor.style, JSFont.Style.normal);
        TKAssertExactEquals(font.pointSize, 20);
        TKAssertExactEquals(font.descriptor, this.descriptors[0]);

        font = JSFont.fontWithFamily("Dummy", 30, JSFont.Weight.bold);
        TKAssertNotNull(font);
        TKAssertExactEquals(font.descriptor.family, "Dummy");
        TKAssertExactEquals(font.descriptor.weight, JSFont.Weight.bold);
        TKAssertExactEquals(font.descriptor.style, JSFont.Style.normal);
        TKAssertExactEquals(font.pointSize, 30);
        TKAssertExactEquals(font.descriptor, this.descriptors[1]);

        font = JSFont.fontWithFamily("Dummy", 30, JSFont.Weight.bold, JSFont.Style.italic);
        TKAssertNotNull(font);
        TKAssertExactEquals(font.descriptor.family, "Dummy");
        TKAssertExactEquals(font.descriptor.weight, JSFont.Weight.bold);
        TKAssertExactEquals(font.descriptor.style, JSFont.Style.italic);
        TKAssertExactEquals(font.pointSize, 30);
        TKAssertExactEquals(font.descriptor, this.descriptors[2]);
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
        TKAssertExactEquals(font.descriptor, this.descriptors[0]);
        TKAssertExactEquals(font.pointSize, 20);

        dictionary = {
            family: "Dummy",
            weight: 700,
            style: "normal",
            size: 20
        };
        font = JSFont.initFromDictionary(dictionary);
        TKAssertNotNull(font);
        TKAssertExactEquals(font.descriptor.family, "Dummy");
        TKAssertExactEquals(font.descriptor.weight, JSFont.Weight.bold);
        TKAssertExactEquals(font.descriptor.style, JSFont.Style.normal);
        TKAssertExactEquals(font.descriptor, this.descriptors[1]);
        TKAssertExactEquals(font.pointSize, 20);

        dictionary = {
            family: "Dummy",
            weight: 700,
            style: "italic",
            size: 30
        };
        font = JSFont.initFromDictionary(dictionary);
        TKAssertNotNull(font);
        TKAssertExactEquals(font.descriptor.family, "Dummy");
        TKAssertExactEquals(font.descriptor.weight, JSFont.Weight.bold);
        TKAssertExactEquals(font.descriptor.style, JSFont.Style.italic);
        TKAssertExactEquals(font.descriptor, this.descriptors[2]);
        TKAssertExactEquals(font.pointSize, 30);

    },

    testDictionaryRepresentation: function(){
        var font = JSFont.initWithDescriptor(this.descriptors[0], 20);
        var dictionary = font.dictionaryRepresentation();
        TKAssertExactEquals(dictionary.family, "Dummy");
        TKAssertExactEquals(dictionary.weight, 400);
        TKAssertExactEquals(dictionary.style, "normal");
        TKAssertExactEquals(dictionary.size, 20);

        font = JSFont.initWithDescriptor(this.descriptors[2], 30);
        dictionary = font.dictionaryRepresentation();
        TKAssertExactEquals(dictionary.family, "Dummy");
        TKAssertExactEquals(dictionary.weight, 700);
        TKAssertExactEquals(dictionary.style, "italic");
        TKAssertExactEquals(dictionary.size, 30);
    },

    testRegisterSystemFontResource: function(){
        JSFont.registerSystemFontResource("Dummy-Regular", this.bundle);
        var font = JSFont.systemFontOfSize(10);
        TKAssertExactEquals(font.descriptor.family, "Dummy");
        TKAssertExactEquals(font.descriptor.weight, JSFont.Weight.regular);
        TKAssertExactEquals(font.descriptor.style, JSFont.Style.normal);
        TKAssertExactEquals(font.descriptor, this.descriptors[0]);
        TKAssertExactEquals(font.pointSize, 10);

        JSFont.registerSystemFontResource("Dummy-BoldItalic", this.bundle);
        font = JSFont.systemFontOfSize(30);
        TKAssertExactEquals(font.descriptor.family, "Dummy");
        TKAssertExactEquals(font.descriptor.weight, JSFont.Weight.bold);
        TKAssertExactEquals(font.descriptor.style, JSFont.Style.italic);
        TKAssertExactEquals(font.descriptor, this.descriptors[2]);
        TKAssertExactEquals(font.pointSize, 30);
    },

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
    light: {
        font: {
            ascender: 1700,
            cmap: {
                format: 13,
                data: "eJwBEADv/wEAAAAAAAAA/////wAAAAAaBgP+",
            },
            descender: -300,
            face: "Light",
            family: "Dummy",
            name: "Dummy Light",
            postscript_name: "Dummy-Light",
            style: "normal",
            unique_identifier: "UIKitTesting;dummy-light",
            unitsPerEM: 2048,
            weight: 300,
            widths: "eJwBAgD9/wAIAAoACQ=="
        }
    },
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
    semibold: {
        font: {
            ascender: 1700,
            cmap: {
                format: 13,
                data: "eJwBEADv/wEAAAAAAAAA/////wAAAAAaBgP+",
            },
            descender: -300,
            face: "SemiBold",
            family: "Dummy",
            name: "Dummy SemiBold",
            postscript_name: "Dummy-SemiBold",
            style: "normal",
            unique_identifier: "UIKitTesting;dummy-semibold",
            unitsPerEM: 2048,
            weight: 600,
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
    },
    boldItalic: {
        font: {
            ascender: 1700,
            cmap: {
                format: 13,
                data: "eJwBEADv/wEAAAAAAAAA/////wAAAAAaBgP+",
            },
            descender: -300,
            face: "Bold Italic",
            family: "Dummy",
            name: "Dummy Bold Italic",
            postscript_name: "Dummy-BoldItalic",
            style: "italic",
            unique_identifier: "UIKitTesting;dummy-bold-italic",
            unitsPerEM: 2048,
            weight: 700,
            widths: "eJwBAgD9/wAIAAoACQ=="
        }
    }
};