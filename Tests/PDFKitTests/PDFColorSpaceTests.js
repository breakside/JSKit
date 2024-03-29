// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #import PDFKit
// #import TestKit
'use strict';

JSClass("PDFColorSpaceTests", TKTestSuite, {

    testFactory: function(){
        var space = PDFColorSpace(PDFName("DeviceGray"));
        TKAssertEquals(space.numberOfComponents, 1);

        space = PDFColorSpace(PDFName("DeviceRGB"));
        TKAssertEquals(space.numberOfComponents, 3);

        space = PDFColorSpace(PDFName("DeviceCMYK"));
        TKAssertEquals(space.numberOfComponents, 4);

        space = PDFColorSpace(PDFName("Pattern"));
        TKAssertEquals(space.numberOfComponents, 1);

        TKAssertThrows(function(){
            var space = PDFColorSpace(PDFName("BadName"));
        });

        space = PDFColorSpace([PDFName("CalGray"), {WhitePoint: [1, 1, 1]}]);
        TKAssertEquals(space.numberOfComponents, 1);

        space = PDFColorSpace([PDFName("CalRGB"), {WhitePoint: [1, 1, 1]}]);
        TKAssertEquals(space.numberOfComponents, 3);

        space = PDFColorSpace([PDFName("CalCMYK"), {WhitePoint: [1, 1, 1]}]);
        TKAssertEquals(space.numberOfComponents, 4);

        space = PDFColorSpace([PDFName("Lab"), {WhitePoint: [1, 1, 1]}]);
        TKAssertEquals(space.numberOfComponents, 3);

        space = PDFColorSpace([PDFName("ICCBased"), {N: 1, Alternate: PDFName("DeviceGray")}]);
        TKAssertEquals(space.numberOfComponents, 1);

        space = PDFColorSpace([PDFName("ICCBased"), {N: 1}]);
        TKAssertEquals(space.numberOfComponents, 1);

        space = PDFColorSpace([PDFName("ICCBased"), {N: 3, Alternate: PDFName("DeviceRGB")}]);
        TKAssertEquals(space.numberOfComponents, 3);

        space = PDFColorSpace([PDFName("ICCBased"), {N: 3}]);
        TKAssertEquals(space.numberOfComponents, 3);

        space = PDFColorSpace([PDFName("ICCBased"), {N: 4, Alternate: PDFName("DeviceCMYK")}]);
        TKAssertEquals(space.numberOfComponents, 4);

        space = PDFColorSpace([PDFName("ICCBased"), {N: 4}]);
        TKAssertEquals(space.numberOfComponents, 4);

        TKAssertThrows(function(){
            var space = PDFColorSpace([PDFName("ICCBased"), {N: 2}]);
        });

        TKAssertThrows(function(){
            var space = PDFColorSpace([PDFName("ICCBased"), {N: 5}]);
        });

        TKAssertThrows(function(){
            var space = PDFColorSpace([PDFName("BadName")]);
        });

        space = PDFColorSpace([PDFName("DeviceN"), [PDFName("a"), PDFName("b"), PDFName("c"), PDFName("d"), PDFName("e")]]);
        TKAssertEquals(space.numberOfComponents, 5);
    },

    testDeviceGray: function(){
        var space = PDFColorSpace(PDFName("DeviceGray"));
        var components = space.defaultComponents();
        TKAssertEquals(components.length, 1);
        TKAssertEquals(components[0], 0);

        var color = space.colorFromComponents([0]);
        TKAssertNotNull(color);
        TKAssertExactEquals(color.space, JSColorSpace.rgb);
        TKAssertFloatEquals(color.red, 0);
        TKAssertFloatEquals(color.green, 0);
        TKAssertFloatEquals(color.blue, 0);
        TKAssertFloatEquals(color.alpha, 1);

        color = space.colorFromComponents([1]);
        TKAssertNotNull(color);
        TKAssertExactEquals(color.space, JSColorSpace.rgb);
        TKAssertFloatEquals(color.red, 1);
        TKAssertFloatEquals(color.green, 1);
        TKAssertFloatEquals(color.blue, 1);
        TKAssertFloatEquals(color.alpha, 1);

        color = space.colorFromComponents([0.4]);
        TKAssertNotNull(color);
        TKAssertExactEquals(color.space, JSColorSpace.rgb);
        TKAssertFloatEquals(color.red, 0.4);
        TKAssertFloatEquals(color.green, 0.4);
        TKAssertFloatEquals(color.blue, 0.4);
        TKAssertFloatEquals(color.alpha, 1);
    },

    testDeviceRGB: function(){
        var space = PDFColorSpace(PDFName("DeviceRGB"));
        var components = space.defaultComponents();
        TKAssertEquals(components.length, 3);
        TKAssertEquals(components[0], 0);
        TKAssertEquals(components[1], 0);
        TKAssertEquals(components[2], 0);

        var color = space.colorFromComponents([0, 0, 0]);
        TKAssertNotNull(color);
        TKAssertExactEquals(color.space, JSColorSpace.rgb);
        TKAssertFloatEquals(color.red, 0);
        TKAssertFloatEquals(color.green, 0);
        TKAssertFloatEquals(color.blue, 0);
        TKAssertFloatEquals(color.alpha, 1);

        color = space.colorFromComponents([1, 1, 1]);
        TKAssertNotNull(color);
        TKAssertExactEquals(color.space, JSColorSpace.rgb);
        TKAssertFloatEquals(color.red, 1);
        TKAssertFloatEquals(color.green, 1);
        TKAssertFloatEquals(color.blue, 1);
        TKAssertFloatEquals(color.alpha, 1);

        color = space.colorFromComponents([0.4, 0.1, 0.95]);
        TKAssertNotNull(color);
        TKAssertExactEquals(color.space, JSColorSpace.rgb);
        TKAssertFloatEquals(color.red, 0.4);
        TKAssertFloatEquals(color.green, 0.1);
        TKAssertFloatEquals(color.blue, 0.95);
        TKAssertFloatEquals(color.alpha, 1);
    },

    testDeviceCMYK: function(){
        var space = PDFColorSpace(PDFName("DeviceCMYK"));
        var components = space.defaultComponents();
        TKAssertEquals(components.length, 4);
        TKAssertEquals(components[0], 0);
        TKAssertEquals(components[1], 0);
        TKAssertEquals(components[2], 0);
        TKAssertEquals(components[3], 1);

        var tolerance = 2 / 255.0;

        var color = space.colorFromComponents([0, 0, 0, 1]);
        TKAssertNotNull(color);
        TKAssertExactEquals(color.space, JSColorSpace.rgb);
        TKAssertFloatEquals(color.red, 0.1036, tolerance);
        TKAssertFloatEquals(color.green, 0.0992, tolerance);
        TKAssertFloatEquals(color.blue, 0.0975, tolerance);
        TKAssertFloatEquals(color.alpha, 1, tolerance);

        color = space.colorFromComponents([0, 0, 0, 0]);
        TKAssertNotNull(color);
        TKAssertExactEquals(color.space, JSColorSpace.rgb);
        TKAssertFloatEquals(color.red, 1, tolerance);
        TKAssertFloatEquals(color.green, 0.9987, tolerance);
        TKAssertFloatEquals(color.blue, 0.9961, tolerance);
        TKAssertFloatEquals(color.alpha, 1, tolerance);

        color = space.colorFromComponents([0.4, 0.1, 0.95, 0.3]);
        TKAssertNotNull(color);
        TKAssertExactEquals(color.space, JSColorSpace.rgb);
        TKAssertFloatEquals(color.red, 0.4437, tolerance);
        TKAssertFloatEquals(color.green, 0.5247, tolerance);
        TKAssertFloatEquals(color.blue, 0.1999, tolerance);
        TKAssertFloatEquals(color.alpha, 1, tolerance);

        color = space.colorFromComponents([0.5, 0.5, 0.5, 0.5]);
    }

});