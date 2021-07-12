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

// #import Foundation
// #import TestKit
'use strict';

JSClass('JSColorTests', TKTestSuite, {

    testRGBA: function(){
        var color = JSColor.initWithRGBA();
        TKAssertEquals(color.colorSpace, JSColor.SpaceIdentifier.rgb);
        TKAssertEquals(color.components.length, 4);
        TKAssertEquals(color.components[0], 0);
        TKAssertEquals(color.components[1], 0);
        TKAssertEquals(color.components[2], 0);
        TKAssertEquals(color.components[3], 1.0);

        color = JSColor.initWithRGBA(0.25, 0.5, 0.75);
        TKAssertEquals(color.components.length, 4);
        TKAssertEquals(color.components[0], 0.25);
        TKAssertEquals(color.components[1], 0.5);
        TKAssertEquals(color.components[2], 0.75);
        TKAssertEquals(color.components[3], 1.0);

        color = JSColor.initWithRGBA(0.25, 0.5, 0.75, 0.3);
        TKAssertEquals(color.components.length, 4);
        TKAssertEquals(color.components[0], 0.25);
        TKAssertEquals(color.components[1], 0.5);
        TKAssertEquals(color.components[2], 0.75);
        TKAssertEquals(color.components[3], 0.3);

        TKAssertEquals(color.components[0], color.red);
        TKAssertEquals(color.components[1], color.green);
        TKAssertEquals(color.components[2], color.blue);
        TKAssertEquals(color.components[3], color.alpha);
    },

    testSpec: function(){
        var spec = JSSpec.initWithDictionary({rgba: "204,102,51"});
        var color = JSColor.initWithSpec(spec);
        TKAssertEquals(color.colorSpace, JSColor.SpaceIdentifier.rgb);
        TKAssertEquals(color.components.length, 4);
        TKAssertEquals(color.components[0], 0.8);
        TKAssertEquals(color.components[1], 0.4);
        TKAssertEquals(color.components[2], 0.2);
        TKAssertEquals(color.components[3], 1.0);

        spec = JSSpec.initWithDictionary({rgba: "204,102,51,.5"});
        color = JSColor.initWithSpec(spec);
        TKAssertEquals(color.components.length, 4);
        TKAssertEquals(color.components[0], 0.8);
        TKAssertEquals(color.components[1], 0.4);
        TKAssertEquals(color.components[2], 0.2);
        TKAssertEquals(color.components[3], 0.5);

        spec = JSSpec.initWithDictionary({rgba: "#12aB34"});
        color = JSColor.initWithSpec(spec);
        TKAssertEquals(color.components.length, 4);
        TKAssertFloatEquals(color.components[0], 0x12/255.0);
        TKAssertFloatEquals(color.components[1], 0xab/255.0);
        TKAssertFloatEquals(color.components[2], 0x34/255.0);
        TKAssertFloatEquals(color.components[3], 1);

        spec = JSSpec.initWithDictionary({rgba: "#12aB34Ce"});
        color = JSColor.initWithSpec(spec);
        TKAssertEquals(color.components.length, 4);
        TKAssertFloatEquals(color.components[0], 0x12/255.0);
        TKAssertFloatEquals(color.components[1], 0xab/255.0);
        TKAssertFloatEquals(color.components[2], 0x34/255.0);
        TKAssertFloatEquals(color.components[3], 0xce/255.0);

        spec = JSSpec.initWithDictionary({rgba: "12aB34"});
        color = JSColor.initWithSpec(spec);
        TKAssertEquals(color.components.length, 4);
        TKAssertFloatEquals(color.components[0], 0x12/255.0);
        TKAssertFloatEquals(color.components[1], 0xab/255.0);
        TKAssertFloatEquals(color.components[2], 0x34/255.0);
        TKAssertFloatEquals(color.components[3], 1);

        spec = JSSpec.initWithDictionary({rgba: "12aB34Ce"});
        color = JSColor.initWithSpec(spec);
        TKAssertEquals(color.components.length, 4);
        TKAssertFloatEquals(color.components[0], 0x12/255.0);
        TKAssertFloatEquals(color.components[1], 0xab/255.0);
        TKAssertFloatEquals(color.components[2], 0x34/255.0);
        TKAssertFloatEquals(color.components[3], 0xce/255.0);
    },

    testColorWithAlpha: function(){
        var color1 = JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgb, [0.3, 0.4, 0.5]);
        var color2 = color1.colorWithAlpha(0.6);
        TKAssertEquals(color2.colorSpace, JSColor.SpaceIdentifier.rgb);
        TKAssertFloatEquals(color2.components[0], 0.3);
        TKAssertFloatEquals(color2.components[1], 0.4);
        TKAssertFloatEquals(color2.components[2], 0.5);
        TKAssertFloatEquals(color2.components[3], 0.6);

        color1 = JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgb, [0.3, 0.4, 0.5, 0.8]);
        color2 = color1.colorWithAlpha(0.6);
        TKAssertEquals(color2.colorSpace, JSColor.SpaceIdentifier.rgb);
        TKAssertFloatEquals(color2.components[0], 0.3);
        TKAssertFloatEquals(color2.components[1], 0.4);
        TKAssertFloatEquals(color2.components[2], 0.5);
        TKAssertFloatEquals(color2.components[3], 0.6);

        color1 = JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.hsl, [0.3, 0.4, 0.5]);
        color2 = color1.colorWithAlpha(0.6);
        TKAssertEquals(color2.colorSpace, JSColor.SpaceIdentifier.rgb);
        TKAssertFloatEquals(color2.components[0], 0.38);
        TKAssertFloatEquals(color2.components[1], 0.7);
        TKAssertFloatEquals(color2.components[2], 0.3);
        TKAssertFloatEquals(color2.components[3], 0.6);

        color1 = JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.hsla, [0.3, 0.4, 0.5, 0.8]);
        color2 = color1.colorWithAlpha(0.6);
        TKAssertEquals(color2.colorSpace, JSColor.SpaceIdentifier.rgb);
        TKAssertFloatEquals(color2.components[0], 0.38);
        TKAssertFloatEquals(color2.components[1], 0.7);
        TKAssertFloatEquals(color2.components[2], 0.3);
        TKAssertFloatEquals(color2.components[3], 0.6);

        color1 = JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.gray, [0.3]);
        color2 = color1.colorWithAlpha(0.6);
        TKAssertEquals(color2.colorSpace, JSColor.SpaceIdentifier.gray);
        TKAssertFloatEquals(color2.components[0], 0.3);
        TKAssertFloatEquals(color2.components[1], 0.6);

        color1 = JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.gray, [0.3, 0.8]);
        color2 = color1.colorWithAlpha(0.6);
        TKAssertEquals(color2.colorSpace, JSColor.SpaceIdentifier.gray);
        TKAssertFloatEquals(color2.components[0], 0.3);
        TKAssertFloatEquals(color2.components[1], 0.6);
    },

    testCssString: function(){
        if (!JSColor.prototype.cssString){
            return;
        }
        var color = JSColor.initWithRGBA();
        TKAssertEquals(color.cssString(), "rgba(0, 0, 0, 1)");

        color = JSColor.initWithRGBA(0.25, 0.5, 0.75, 0.3);
        TKAssertEquals(color.cssString(), "rgba(64, 128, 191, 0.3)");
    },

    testIsEqual: function(){
        var color1 = JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgb, [0.2, 0.4, 0.6, 0.8]);
        var color2 = JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgb, [0.2, 0.4, 0.6, 0.8]);
        TKAssertObjectEquals(color1, color2);
        color1 = JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgb, [0.2, 0.4, 0.6, 1.0]);
        color2 = JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgb, [0.2, 0.4, 0.6]);
        TKAssertObjectEquals(color1, color2);
        color1 = JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgb, [0.2, 0.4, 0.6, 1.0]);
        color2 = JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgb, [0.2, 0.4, 0.61]);
        TKAssertObjectNotEquals(color1, color2);
        color1 = JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgb, [0.202, 0.4, 0.6, 1.0]);
        color2 = JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgb, [0.203, 0.4, 0.6, 0.999]);
        TKAssertObjectEquals(color1, color2);
    },

    testColorByBlendingColor: function(){
        var color1 = JSColor.initWithRGBA(0.1, 0.2, 0.3, 1);
        var color2 = JSColor.initWithRGBA(0.8, 0.7, 0.1, 0.5);
        var color = color1.colorByBlendingColor(color2, 0.2);
        TKAssertFloatEquals(color.components[0], 0.24);
        TKAssertFloatEquals(color.components[1], 0.3);
        TKAssertFloatEquals(color.components[2], 0.26);
        TKAssertFloatEquals(color.components[3], 1);

        color = color1.colorByBlendingColor(color2, 0.8);
        TKAssertFloatEquals(color.components[0], 0.66);
        TKAssertFloatEquals(color.components[1], 0.6);
        TKAssertFloatEquals(color.components[2], 0.14);
        TKAssertFloatEquals(color.components[3], 1);

        color = color2.colorByBlendingColor(color1, 0.2);
        TKAssertFloatEquals(color.components[0], 0.66);
        TKAssertFloatEquals(color.components[1], 0.6);
        TKAssertFloatEquals(color.components[2], 0.14);
        TKAssertFloatEquals(color.components[3], 0.5);
    }
});