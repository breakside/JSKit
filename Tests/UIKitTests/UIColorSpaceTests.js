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
//
// #import UIKit
// #import TestKit
"use strict";

JSClass("UIColorSpaceTests", TKTestSuite, {

    teardown: function(){
        var traits = UITraitCollection.init();
        traits.userInterfaceStyle = UIUserInterface.Style.light;
        traits.accessibilityContrast = UIUserInterface.Contrast.normal;
        UIColorSpace.setTraitCollection(traits);
    },

    testInitWithStyles: function(){
        var light = JSColor.initWithWhite(0.1);
        var dark = JSColor.initWithWhite(0.9);
        var lightContrast = JSColor.initWithWhite(0);
        var darkContrast = JSColor.initWithWhite(1);
        var space = UIColorSpace.initWithStyles(light, dark, lightContrast, darkContrast);
        TKAssertEquals(space.numberOfComponents, 1);
        TKAssertEquals(space.name, "ui");
        TKAssertEquals(space.colors.length, 4);
        TKAssertExactEquals(space.colors[0], light);
        TKAssertExactEquals(space.colors[1], dark);
        TKAssertExactEquals(space.colors[2], lightContrast);
        TKAssertExactEquals(space.colors[3], darkContrast);
    },

    testColorFromComponents: function(){
        var light = JSColor.initWithWhite(0.1);
        var dark = JSColor.initWithWhite(0.9);
        var lightContrast = JSColor.initWithWhite(0);
        var darkContrast = JSColor.initWithWhite(1);
        var space = UIColorSpace.initWithStyles(light, dark, lightContrast, darkContrast);
        var color = space.colorFromComponents([1]);
        TKAssertEquals(color.space, JSColorSpace.gray);
        TKAssertFloatEquals(color.white, 0.1);

        color = space.colorFromComponents([0.9]);
        TKAssertEquals(color.space, JSColorSpace.gray);
        TKAssertFloatEquals(color.white, 0.09);

        color = space.colorFromComponents([1.1]);
        TKAssertEquals(color.space, JSColorSpace.gray);
        TKAssertFloatEquals(color.white, 0.19);

        var traits = UITraitCollection.init();
        traits.userInterfaceStyle = UIUserInterface.Style.dark;
        UIColorSpace.setTraitCollection(traits);
        color = space.colorFromComponents([1]);
        TKAssertEquals(color.space, JSColorSpace.gray);
        TKAssertFloatEquals(color.white, 0.9);

        traits.accessibilityContrast = UIUserInterface.Contrast.high;
        UIColorSpace.setTraitCollection(traits);
        color = space.colorFromComponents([1]);
        TKAssertEquals(color.space, JSColorSpace.gray);
        TKAssertFloatEquals(color.white, 1);

        traits.userInterfaceStyle = UIUserInterface.Style.light;
        UIColorSpace.setTraitCollection(traits);
        color = space.colorFromComponents([1]);
        TKAssertEquals(color.space, JSColorSpace.gray);
        TKAssertFloatEquals(color.white, 0);
    },

    testComponentsDarkenedByPercentage: function(){
        var light = JSColor.initWithWhite(0.1);
        var dark = JSColor.initWithWhite(0.9);
        var lightContrast = JSColor.initWithWhite(0);
        var darkContrast = JSColor.initWithWhite(1);
        var space = UIColorSpace.initWithStyles(light, dark, lightContrast, darkContrast);
        var components = space.componentsDarkenedByPercentage([1], 0.1);
        TKAssertEquals(components.length, 1);
        TKAssertFloatEquals(components[0], 0.9);

        components = space.componentsDarkenedByPercentage([0.9], 0.2);
        TKAssertEquals(components.length, 1);
        TKAssertFloatEquals(components[0], 0.72);
    },

    testComponentsLightenedByPercentage: function(){
        var light = JSColor.initWithWhite(0.1);
        var dark = JSColor.initWithWhite(0.9);
        var lightContrast = JSColor.initWithWhite(0);
        var darkContrast = JSColor.initWithWhite(1);
        var space = UIColorSpace.initWithStyles(light, dark, lightContrast, darkContrast);
        var components = space.componentsLightenedByPercentage([1], 0.1);
        TKAssertEquals(components.length, 1);
        TKAssertFloatEquals(components[0], 1.1);

        components = space.componentsLightenedByPercentage([1.1], 0.2);
        TKAssertEquals(components.length, 1);
        TKAssertFloatEquals(components[0], 1.32);
    }

});