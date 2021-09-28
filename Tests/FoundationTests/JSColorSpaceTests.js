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
        var space = JSXYZColorSpace.initWithWhitepoint(JSColorSpace.D50, JSColorSpace.D50);
        TKAssertExactEquals(space, JSColorSpace.xyz);

        space = JSXYZColorSpace.initWithWhitepoint([0.9, 1, 0.8], [0.9, 1, 0.8]);
        TKAssertExactEquals(space, JSColorSpace.xyz);

        space = JSXYZColorSpace.initWithWhitepoint([0.45, 0.5, 0.4], [0.9, 1, 0.8]);
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
    },

    testInitWithWhitepoint: function(){
        var space = JSLabColorSpace.initWithWhitepoint([0.7067, 0.7346, 0.5703]);
        var xyz = space.xyzFromComponents([100, 0, 0]);
        TKAssertFloatEquals(xyz[0], 0.7067, 0.0001);
        TKAssertFloatEquals(xyz[1], 0.7346, 0.0001);
        TKAssertFloatEquals(xyz[2], 0.5703, 0.0001);
        var lab = space.componentsFromXYZ(xyz);
        TKAssertFloatEquals(lab[0], 100, 0.0001);
        TKAssertFloatEquals(lab[1], 0, 0.0001);
        TKAssertFloatEquals(lab[2], 0, 0.001);

        xyz = space.xyzFromComponents([11.8, 0.28, -0.3]);
        TKAssertFloatEquals(xyz[0], 0.0097, 0.0001);
        TKAssertFloatEquals(xyz[1], 0.0101, 0.0001);
        TKAssertFloatEquals(xyz[2], 0.0080, 0.0001);
        lab = space.componentsFromXYZ(xyz);
        TKAssertFloatEquals(lab[0], 11.8, 0.0001);
        TKAssertFloatEquals(lab[1], 0.28, 0.0001);
        TKAssertFloatEquals(lab[2], -0.3, 0.0001);
    }

});