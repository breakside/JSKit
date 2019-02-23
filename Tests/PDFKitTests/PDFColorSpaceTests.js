// #import "PDFKit/PDFKit.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, PDFColorSpace, PDFNameObject, JSColor */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
'use strict';

JSClass("PDFColorSpaceTests", TKTestSuite, {

    testFactory: function(){
        var space = PDFColorSpace(PDFNameObject("DeviceGray"));
        TKAssertEquals(space.numberOfComponents, 1);

        space = PDFColorSpace(PDFNameObject("DeviceRGB"));
        TKAssertEquals(space.numberOfComponents, 3);

        space = PDFColorSpace(PDFNameObject("DeviceCMYK"));
        TKAssertEquals(space.numberOfComponents, 4);

        space = PDFColorSpace(PDFNameObject("Pattern"));
        TKAssertEquals(space.numberOfComponents, 1);

        TKAssertThrows(function(){
            var space = PDFColorSpace(PDFNameObject("BadName"));
        });

        space = PDFColorSpace([PDFNameObject("CalGray"), {WhitePoint: [1, 1, 1]}]);
        TKAssertEquals(space.numberOfComponents, 1);

        space = PDFColorSpace([PDFNameObject("CalRGB"), {WhitePoint: [1, 1, 1]}]);
        TKAssertEquals(space.numberOfComponents, 3);

        space = PDFColorSpace([PDFNameObject("CalCMYK"), {WhitePoint: [1, 1, 1]}]);
        TKAssertEquals(space.numberOfComponents, 4);

        space = PDFColorSpace([PDFNameObject("Lab"), {WhitePoint: [1, 1, 1]}]);
        TKAssertEquals(space.numberOfComponents, 3);

        space = PDFColorSpace([PDFNameObject("ICCBased"), {N: 1, Alternate: PDFNameObject("DeviceGray")}]);
        TKAssertEquals(space.numberOfComponents, 1);

        space = PDFColorSpace([PDFNameObject("ICCBased"), {N: 1}]);
        TKAssertEquals(space.numberOfComponents, 1);

        space = PDFColorSpace([PDFNameObject("ICCBased"), {N: 3, Alternate: PDFNameObject("DeviceRGB")}]);
        TKAssertEquals(space.numberOfComponents, 3);

        space = PDFColorSpace([PDFNameObject("ICCBased"), {N: 3}]);
        TKAssertEquals(space.numberOfComponents, 3);

        space = PDFColorSpace([PDFNameObject("ICCBased"), {N: 4, Alternate: PDFNameObject("DeviceCMYK")}]);
        TKAssertEquals(space.numberOfComponents, 4);

        space = PDFColorSpace([PDFNameObject("ICCBased"), {N: 4}]);
        TKAssertEquals(space.numberOfComponents, 4);

        TKAssertThrows(function(){
            var space = PDFColorSpace([PDFNameObject("ICCBased"), {N: 2}]);
        });

        TKAssertThrows(function(){
            var space = PDFColorSpace([PDFNameObject("ICCBased"), {N: 5}]);
        });

        TKAssertThrows(function(){
            var space = PDFColorSpace([PDFNameObject("BadName")]);
        });

        space = PDFColorSpace([PDFNameObject("DeviceN"), [PDFNameObject("a"), PDFNameObject("b"), PDFNameObject("c"), PDFNameObject("d"), PDFNameObject("e")]]);
        TKAssertEquals(space.numberOfComponents, 5);
    },

    testDeviceGray: function(){
        var space = PDFColorSpace(PDFNameObject("DeviceGray"));
        var components = space.defaultComponents();
        TKAssertEquals(components.length, 1);
        TKAssertEquals(components[0], 0);

        var color = space.colorFromComponents([0]);
        TKAssertNotNull(color);
        TKAssertEquals(color.colorSpace, JSColor.SpaceIdentifier.gray);
        TKAssertFloatEquals(color.white, 0);

        color = space.colorFromComponents([1]);
        TKAssertNotNull(color);
        TKAssertEquals(color.colorSpace, JSColor.SpaceIdentifier.gray);
        TKAssertFloatEquals(color.white, 1);

        color = space.colorFromComponents([0.4]);
        TKAssertNotNull(color);
        TKAssertEquals(color.colorSpace, JSColor.SpaceIdentifier.gray);
        TKAssertFloatEquals(color.white, 0.4);
    },

    testDeviceRGB: function(){
        var space = PDFColorSpace(PDFNameObject("DeviceRGB"));
        var components = space.defaultComponents();
        TKAssertEquals(components.length, 3);
        TKAssertEquals(components[0], 0);
        TKAssertEquals(components[1], 0);
        TKAssertEquals(components[2], 0);

        var color = space.colorFromComponents([0, 0, 0]);
        TKAssertNotNull(color);
        TKAssertEquals(color.colorSpace, JSColor.SpaceIdentifier.rgba);
        TKAssertFloatEquals(color.red, 0);
        TKAssertFloatEquals(color.green, 0);
        TKAssertFloatEquals(color.blue, 0);
        TKAssertFloatEquals(color.alpha, 1);

        color = space.colorFromComponents([1, 1, 1]);
        TKAssertNotNull(color);
        TKAssertEquals(color.colorSpace, JSColor.SpaceIdentifier.rgba);
        TKAssertFloatEquals(color.red, 1);
        TKAssertFloatEquals(color.green, 1);
        TKAssertFloatEquals(color.blue, 1);
        TKAssertFloatEquals(color.alpha, 1);

        color = space.colorFromComponents([0.4, 0.1, 0.95]);
        TKAssertNotNull(color);
        TKAssertEquals(color.colorSpace, JSColor.SpaceIdentifier.rgba);
        TKAssertFloatEquals(color.red, 0.4);
        TKAssertFloatEquals(color.green, 0.1);
        TKAssertFloatEquals(color.blue, 0.95);
        TKAssertFloatEquals(color.alpha, 1);
    },

    testDeviceCMYK: function(){
        var space = PDFColorSpace(PDFNameObject("DeviceCMYK"));
        var components = space.defaultComponents();
        TKAssertEquals(components.length, 4);
        TKAssertEquals(components[0], 0);
        TKAssertEquals(components[1], 0);
        TKAssertEquals(components[2], 0);
        TKAssertEquals(components[3], 1);

        var tolerance = 2 / 255.0;

        var color = space.colorFromComponents([0, 0, 0, 1]);
        TKAssertNotNull(color);
        TKAssertEquals(color.colorSpace, JSColor.SpaceIdentifier.rgba);
        TKAssertFloatEquals(color.red, 0.1036, tolerance);
        TKAssertFloatEquals(color.green, 0.0992, tolerance);
        TKAssertFloatEquals(color.blue, 0.0975, tolerance);
        TKAssertFloatEquals(color.alpha, 1, tolerance);

        color = space.colorFromComponents([0, 0, 0, 0]);
        TKAssertNotNull(color);
        TKAssertEquals(color.colorSpace, JSColor.SpaceIdentifier.rgba);
        TKAssertFloatEquals(color.red, 1, tolerance);
        TKAssertFloatEquals(color.green, 0.9987, tolerance);
        TKAssertFloatEquals(color.blue, 0.9961, tolerance);
        TKAssertFloatEquals(color.alpha, 1, tolerance);

        color = space.colorFromComponents([0.4, 0.1, 0.95, 0.3]);
        TKAssertNotNull(color);
        TKAssertEquals(color.colorSpace, JSColor.SpaceIdentifier.rgba);
        TKAssertFloatEquals(color.red, 0.4437, tolerance);
        TKAssertFloatEquals(color.green, 0.5247, tolerance);
        TKAssertFloatEquals(color.blue, 0.1999, tolerance);
        TKAssertFloatEquals(color.alpha, 1, tolerance);
    }

});