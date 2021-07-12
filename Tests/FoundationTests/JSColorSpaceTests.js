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

JSClass("JSColorSpaceTests", TKTestSuite, {

    testRGBModels: function(){
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
    }

});