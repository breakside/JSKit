// Copyright 2022 Breakside Inc.
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

// #import ImageKit
// #import TestKit
'use strict';

JSClass("IKColorSpaceTests", TKTestSuite, {

    testInitWithProfileData: function(){
        var space = IKColorSpace.initWithProfileData(null);
        TKAssertNull(space);
        space = IKColorSpace.initWithProfileData(undefined);
        TKAssertNull(space);
        space = IKColorSpace.initWithProfileData(JSData.initWithLength(12));
        TKAssertNull(space);
        space = IKColorSpace.initWithProfileData(JSData.initWithLength(128));
        TKAssertNull(space);
    },

    testInitWithProfile: function(){
        var space = IKColorSpace.initWithProfile(null);
        TKAssertNull(space);
        space = IKColorSpace.initWithProfile(undefined);
        TKAssertNull(space);
    },

    testSRGB: function(){
        var expectation = TKExpectation.init();
        expectation.call(this.getResourceData, this, "sRGB", "icc", function(data){
            var profile = IKColorProfile.initWithData(data);
            var space = IKColorSpace.initWithProfile(profile);
            TKAssertNotNull(space);
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
        }, this);
        this.wait(expectation, 1.0);
    },

    testCMYK: function(){
        var expectation = TKExpectation.init();
        expectation.call(this.getResourceData, this, "CMYK", "icc", function(data){
            var profile = IKColorProfile.initWithData(data);
            var space = IKColorSpace.initWithProfile(profile);
            TKAssertNotNull(space);
            var cmyk = [0, 0, 0, 0];
            var xyz = space.xyzFromComponents(cmyk);
            TKAssertFloatEquals(xyz[0], 0.9671, 0.001);
            TKAssertFloatEquals(xyz[1], 1.0000, 0.001);
            TKAssertFloatEquals(xyz[2], 0.8187, 0.001);
            cmyk = [1, 1, 1, 1];
            xyz = space.xyzFromComponents(cmyk);
            TKAssertFloatEquals(xyz[0], 0, 0.01);
            TKAssertFloatEquals(xyz[1], 0, 0.01);
            TKAssertFloatEquals(xyz[2], 0, 0.01);
            cmyk = [0, 0, 0, 1];
            xyz = space.xyzFromComponents(cmyk);
            TKAssertFloatEquals(xyz[0], 0.0098, 0.0001);
            TKAssertFloatEquals(xyz[1], 0.0100, 0.0001);
            TKAssertFloatEquals(xyz[2], 0.0080, 0.0001);
            cmyk = [0.5, 0.5, 0.5, 0.5];
            xyz = space.xyzFromComponents(cmyk);
            TKAssertFloatEquals(xyz[0], 0.0607, 0.0001);
            TKAssertFloatEquals(xyz[1], 0.0616, 0.0001);
            TKAssertFloatEquals(xyz[2], 0.0443, 0.0001);
        }, this);
        this.wait(expectation, 1.0);
    }

});