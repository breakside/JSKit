// Copyright 2021 Breakside Inc.
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

// #import Foundation
// #import TestKit
"use strict";

// JSClass("JSColorSpaceTests", TKTestSuite, {
// });

JSClass("JSRGBColorSpaceTests", TKTestSuite, {

    testModels: function(){
        var rgb, hsl, hsv;
        rgb = JSColorSpace.rgb.componentsFromHSL([0.5, 1, 7/8]);
        TKAssertFloatEquals(rgb[0], 0.75, 0.01);
        TKAssertFloatEquals(rgb[1], 1, 0.01);
        TKAssertFloatEquals(rgb[2], 1, 0.01);
        hsl = JSColorSpace.rgb.hslFromComponents([0.75, 1, 1]);
        TKAssertFloatEquals(hsl[0], 0.5, 0.01);
        TKAssertFloatEquals(hsl[1], 1, 0.01);
        TKAssertFloatEquals(hsl[2], 7/8, 0.01);
        rgb = JSColorSpace.rgb.componentsFromHSL([0, 3/4, 3/8]);
        TKAssertFloatEquals(rgb[0], 0.656, 0.01);
        TKAssertFloatEquals(rgb[1], 0.094, 0.01);
        TKAssertFloatEquals(rgb[2], 0.094, 0.01);
        hsl = JSColorSpace.rgb.hslFromComponents([0.656, 0.094, 0.094]);
        TKAssertFloatEquals(hsl[0], 0, 0.01);
        TKAssertFloatEquals(hsl[1], 3/4, 0.01);
        TKAssertFloatEquals(hsl[2], 3/8, 0.01);
        rgb = JSColorSpace.rgb.componentsFromHSL([7/12, 1/2, 1]);
        TKAssertFloatEquals(rgb[0], 1, 0.01);
        TKAssertFloatEquals(rgb[1], 1, 0.01);
        TKAssertFloatEquals(rgb[2], 1, 0.01);
        hsl = JSColorSpace.rgb.hslFromComponents([1, 1, 1]);
        TKAssertFloatEquals(hsl[0], 0, 0.01);
        TKAssertFloatEquals(hsl[1], 0, 0.01);
        TKAssertFloatEquals(hsl[2], 1, 0.01);
        rgb = JSColorSpace.rgb.componentsFromHSL([7/12, 1/2, 0]);
        TKAssertFloatEquals(rgb[0], 0, 0.01);
        TKAssertFloatEquals(rgb[1], 0, 0.01);
        TKAssertFloatEquals(rgb[2], 0, 0.01);
        hsl = JSColorSpace.rgb.hslFromComponents([0, 0, 0]);
        TKAssertFloatEquals(hsl[0], 0, 0.01);
        TKAssertFloatEquals(hsl[1], 0, 0.01);
        TKAssertFloatEquals(hsl[2], 0, 0.01);

        rgb = JSColorSpace.rgb.componentsFromHSV([1/2, 1/2, 1]);
        TKAssertFloatEquals(rgb[0], 0.5, 0.01);
        TKAssertFloatEquals(rgb[1], 1, 0.01);
        TKAssertFloatEquals(rgb[2], 1, 0.01);
        hsv = JSColorSpace.rgb.hsvFromComponents([0.5, 1, 1]);
        TKAssertFloatEquals(hsv[0], 1/2, 0.01);
        TKAssertFloatEquals(hsv[1], 1/2, 0.01);
        TKAssertFloatEquals(hsv[2], 1, 0.01);
        rgb = JSColorSpace.rgb.componentsFromHSV([7/12, 1/4, 3/8]);
        TKAssertFloatEquals(rgb[0], 0.281, 0.01);
        TKAssertFloatEquals(rgb[1], 0.328, 0.01);
        TKAssertFloatEquals(rgb[2], 0.375, 0.01);
        hsv = JSColorSpace.rgb.hsvFromComponents([0.281, 0.328, 0.375]);
        TKAssertFloatEquals(hsv[0], 7/12, 0.01);
        TKAssertFloatEquals(hsv[1], 1/4, 0.01);
        TKAssertFloatEquals(hsv[2], 3/8, 0.01);
        rgb = JSColorSpace.rgb.componentsFromHSV([7/12, 0, 1]);
        TKAssertFloatEquals(rgb[0], 1, 0.01);
        TKAssertFloatEquals(rgb[1], 1, 0.01);
        TKAssertFloatEquals(rgb[2], 1, 0.01);
        hsv = JSColorSpace.rgb.hsvFromComponents([1, 1, 1]);
        TKAssertFloatEquals(hsv[0], 0, 0.01);
        TKAssertFloatEquals(hsv[1], 0, 0.01);
        TKAssertFloatEquals(hsv[2], 1, 0.01);
        rgb = JSColorSpace.rgb.componentsFromHSV([7/12, 0, 0]);
        TKAssertFloatEquals(rgb[0], 0, 0.01);
        TKAssertFloatEquals(rgb[1], 0, 0.01);
        TKAssertFloatEquals(rgb[2], 0, 0.01);
        hsv = JSColorSpace.rgb.hsvFromComponents([0, 0, 0]);
        TKAssertFloatEquals(hsv[0], 0, 0.01);
        TKAssertFloatEquals(hsv[1], 0, 0.01);
        TKAssertFloatEquals(hsv[2], 0, 0.01);
    },

    testMixedComponents: function(){
        var components = JSColorSpace.rgb.mixedComponents([0, 0.2, 1], [0.3, 0.6, 0.8], 0.5);
        TKAssertFloatEquals(components[0], 0.15);
        TKAssertFloatEquals(components[1], 0.4);
        TKAssertFloatEquals(components[2], 0.9);

        components = JSColorSpace.rgb.mixedComponents([0, 0.2, 1], [0.3, 0.6, 0.8], 0);
        TKAssertFloatEquals(components[0], 0.0);
        TKAssertFloatEquals(components[1], 0.2);
        TKAssertFloatEquals(components[2], 1.0);

        components = JSColorSpace.rgb.mixedComponents([0, 0.2, 1], [0.3, 0.6, 0.8], 1);
        TKAssertFloatEquals(components[0], 0.3);
        TKAssertFloatEquals(components[1], 0.6);
        TKAssertFloatEquals(components[2], 0.8);

        components = JSColorSpace.rgb.mixedComponents([0, 0.2, 1], [0.3, 0.6, 0.8], 0.25);
        TKAssertFloatEquals(components[0], 0.075);
        TKAssertFloatEquals(components[1], 0.3);
        TKAssertFloatEquals(components[2], 0.95);
    },

    testComponentsDarkenedByPercentage: function(){
        var components = JSColorSpace.rgb.componentsDarkenedByPercentage([0, 0.5, 1, 1], 0.1);
        TKAssertEquals(components.length, 3);
        TKAssertFloatEquals(components[0], 0);
        TKAssertFloatEquals(components[1], 0.45);
        TKAssertFloatEquals(components[2], 0.9);
    },

    testComponentsLightenedByPercentage: function(){
        var components = JSColorSpace.rgb.componentsLightenedByPercentage([0, 0.5, 1, 1], 0.1);
        TKAssertEquals(components.length, 3);
        TKAssertFloatEquals(components[0], 0.1);
        TKAssertFloatEquals(components[1], 0.55);
        TKAssertFloatEquals(components[2], 1);
    },

    testXYZ: function(){
        var space = JSColorSpace.rgb;
        var rgb = [0, 0, 0];
        var xyz = space.xyzFromComponents(rgb);
        TKAssertFloatEquals(xyz[0], 0, 0.001);
        TKAssertFloatEquals(xyz[1], 0, 0.001);
        TKAssertFloatEquals(xyz[2], 0, 0.001);
        rgb = [1, 1, 1];
        xyz = space.xyzFromComponents(rgb);
        TKAssertFloatEquals(xyz[0], 0.9642, 0.001);
        TKAssertFloatEquals(xyz[1], 1.0000, 0.001);
        TKAssertFloatEquals(xyz[2], 0.8249, 0.001);
        rgb = [1, 0, 0];
        xyz = space.xyzFromComponents(rgb);
        TKAssertFloatEquals(xyz[0], 0.4360, 0.001);
        TKAssertFloatEquals(xyz[1], 0.2225, 0.001);
        TKAssertFloatEquals(xyz[2], 0.0139, 0.001);
        rgb = [0, 1, 0];
        xyz = space.xyzFromComponents(rgb);
        TKAssertFloatEquals(xyz[0], 0.3851, 0.001);
        TKAssertFloatEquals(xyz[1], 0.7169, 0.001);
        TKAssertFloatEquals(xyz[2], 0.0971, 0.001);
        rgb = [0, 0, 1];
        xyz = space.xyzFromComponents(rgb);
        TKAssertFloatEquals(xyz[0], 0.1431, 0.001);
        TKAssertFloatEquals(xyz[1], 0.0606, 0.001);
        TKAssertFloatEquals(xyz[2], 0.7139, 0.001);
        rgb = [1, 1, 0];
        xyz = space.xyzFromComponents(rgb);
        TKAssertFloatEquals(xyz[0], 0.8211, 0.001);
        TKAssertFloatEquals(xyz[1], 0.9394, 0.001);
        TKAssertFloatEquals(xyz[2], 0.1110, 0.001);
        rgb = [1, 0, 1];
        xyz = space.xyzFromComponents(rgb);
        TKAssertFloatEquals(xyz[0], 0.5791, 0.001);
        TKAssertFloatEquals(xyz[1], 0.2831, 0.001);
        TKAssertFloatEquals(xyz[2], 0.7278, 0.001);
        rgb = [0, 1, 1];
        xyz = space.xyzFromComponents(rgb);
        TKAssertFloatEquals(xyz[0], 0.5282, 0.001);
        TKAssertFloatEquals(xyz[1], 0.7775, 0.001);
        TKAssertFloatEquals(xyz[2], 0.8110, 0.001);
        rgb = [0.5, 0.5, 0.5];
        xyz = space.xyzFromComponents(rgb);
        TKAssertFloatEquals(xyz[0], 0.2064, 0.001);
        TKAssertFloatEquals(xyz[1], 0.2140, 0.001);
        TKAssertFloatEquals(xyz[2], 0.1766, 0.001);
        rgb = [0.5, 0, 0];
        xyz = space.xyzFromComponents(rgb);
        TKAssertFloatEquals(xyz[0], 0.0933, 0.001);
        TKAssertFloatEquals(xyz[1], 0.0476, 0.001);
        TKAssertFloatEquals(xyz[2], 0.0030, 0.001);
        rgb = [0, 0.5, 0];
        xyz = space.xyzFromComponents(rgb);
        TKAssertFloatEquals(xyz[0], 0.0824, 0.001);
        TKAssertFloatEquals(xyz[1], 0.1534, 0.001);
        TKAssertFloatEquals(xyz[2], 0.0208, 0.001);
        rgb = [0, 0, 0.5];
        xyz = space.xyzFromComponents(rgb);
        TKAssertFloatEquals(xyz[0], 0.0306, 0.001);
        TKAssertFloatEquals(xyz[1], 0.0130, 0.001);
        TKAssertFloatEquals(xyz[2], 0.1528, 0.001);
        rgb = [0.5, 0.5, 0];
        xyz = space.xyzFromComponents(rgb);
        TKAssertFloatEquals(xyz[0], 0.1758, 0.001);
        TKAssertFloatEquals(xyz[1], 0.2011, 0.001);
        TKAssertFloatEquals(xyz[2], 0.0238, 0.001);
        rgb = [0.5, 0, 0.5];
        xyz = space.xyzFromComponents(rgb);
        TKAssertFloatEquals(xyz[0], 0.1239, 0.001);
        TKAssertFloatEquals(xyz[1], 0.0606, 0.001);
        TKAssertFloatEquals(xyz[2], 0.1558, 0.001);
        rgb = [0, 0.5, 0.5];
        xyz = space.xyzFromComponents(rgb);
        TKAssertFloatEquals(xyz[0], 0.1131, 0.001);
        TKAssertFloatEquals(xyz[1], 0.1664, 0.001);
        TKAssertFloatEquals(xyz[2], 0.1736, 0.001);
        rgb = [0.1, 0.2, 0.3];
        xyz = space.xyzFromComponents(rgb);
        TKAssertFloatEquals(xyz[0], 0.0276, 0.001);
        TKAssertFloatEquals(xyz[1], 0.0304, 0.001);
        TKAssertFloatEquals(xyz[2], 0.0556, 0.001);
        rgb = [0.9, 0.8, 0.7];
        xyz = space.xyzFromComponents(rgb);
        TKAssertFloatEquals(xyz[0], 0.6400, 0.001);
        TKAssertFloatEquals(xyz[1], 0.6352, 0.001);
        TKAssertFloatEquals(xyz[2], 0.3894, 0.001);
        xyz = [0, 0, 0];
        rgb = space.componentsFromXYZ(xyz);
        TKAssertFloatEquals(rgb[0], 0.0000, 0.001);
        TKAssertFloatEquals(rgb[1], 0.0000, 0.001);
        TKAssertFloatEquals(rgb[2], 0.0000, 0.001);
        xyz = [1, 1, 1];
        rgb = space.componentsFromXYZ(xyz);
        TKAssertFloatEquals(rgb[0], 1.0000, 0.001);
        TKAssertFloatEquals(rgb[1], 0.9871, 0.001);
        TKAssertFloatEquals(rgb[2], 1.0000, 0.001);
        xyz = [0.6400, 0.6352, 0.3894];
        rgb = space.componentsFromXYZ(xyz);
        TKAssertFloatEquals(rgb[0], 0.9, 0.001);
        TKAssertFloatEquals(rgb[1], 0.8, 0.001);
        TKAssertFloatEquals(rgb[2], 0.7, 0.001);
        xyz = [0.1131, 0.1664, 0.1736];
        rgb = space.componentsFromXYZ(xyz);
        TKAssertFloatEquals(rgb[0], 0.0023, 0.001);
        TKAssertFloatEquals(rgb[1], 0.4999, 0.001);
        TKAssertFloatEquals(rgb[2], 0.5000, 0.001);
    }

});

JSClass("JSXYZColorSpaceTests", TKTestSuite, {

    testIdentity: function(){
        var space = JSColorSpace.xyz;
        var xyz = space.xyzFromComponents([0.1, 0.2, 0.3]);
        TKAssertFloatEquals(xyz[0], 0.1);
        TKAssertFloatEquals(xyz[1], 0.2);
        TKAssertFloatEquals(xyz[2], 0.3);
        var components = space.componentsFromXYZ([0.1, 0.2, 0.3]);
        TKAssertFloatEquals(components[0], 0.1);
        TKAssertFloatEquals(components[1], 0.2);
        TKAssertFloatEquals(components[2], 0.3);
    },

    testScaled: function(){
        var space = JSXYZColorSpace.initWithScale([0.5, 2, 0.1]);
        var xyz = space.xyzFromComponents([0.1, 0.2, 0.3]);
        TKAssertFloatEquals(xyz[0], 0.05);
        TKAssertFloatEquals(xyz[1], 0.4);
        TKAssertFloatEquals(xyz[2], 0.03);
        var components = space.componentsFromXYZ([0.05, 0.4, 0.03]);
        TKAssertFloatEquals(components[0], 0.1);
        TKAssertFloatEquals(components[1], 0.2);
        TKAssertFloatEquals(components[2], 0.3);
    },

    testInitWithWhitepoint: function(){
        var space = JSXYZColorSpace.initWithWhitepoint(JSColorSpace.Whitepoint.D50);
        TKAssertExactEquals(space, JSColorSpace.xyz);

        space = JSXYZColorSpace.initWithWhitepoint([0.9642 / 2, 1.0 / 2, 0.82491 / 2]);
        var xyz = space.xyzFromComponents([0.1, 0.2, 0.3]);
        TKAssertFloatEquals(xyz[0], 0.05);
        TKAssertFloatEquals(xyz[1], 0.1);
        TKAssertFloatEquals(xyz[2], 0.15);
        var components = space.componentsFromXYZ([0.1, 0.2, 0.3]);
        TKAssertFloatEquals(components[0], 0.2);
        TKAssertFloatEquals(components[1], 0.4);
        TKAssertFloatEquals(components[2], 0.6);
    },

});

JSClass("JSLabColorSpaceTests", TKTestSuite, {

    testD50: function(){
        var space = JSColorSpace.lab;
        var xyz = space.xyzFromComponents([100, 0, 0]);
        TKAssertFloatEquals(xyz[0], 0.9642, 0.0001);
        TKAssertFloatEquals(xyz[1], 1.0, 0.0001);
        TKAssertFloatEquals(xyz[2], 0.8249, 0.0001);
        var lab = space.componentsFromXYZ(xyz);
        TKAssertFloatEquals(lab[0], 100, 0.0001);
        TKAssertFloatEquals(lab[1], 0, 0.0001);
        TKAssertFloatEquals(lab[2], 0, 0.0001);

        xyz = space.xyzFromComponents([11.8, 0.28, -0.3]);
        TKAssertFloatEquals(xyz[0], 0.0134, 0.0001);
        TKAssertFloatEquals(xyz[1], 0.0138, 0.0001);
        TKAssertFloatEquals(xyz[2], 0.0116, 0.0001);
        lab = space.componentsFromXYZ(xyz);
        TKAssertFloatEquals(lab[0], 11.8, 0.0001);
        TKAssertFloatEquals(lab[1], 0.28, 0.0001);
        TKAssertFloatEquals(lab[2], -0.3, 0.0001);
    }

});