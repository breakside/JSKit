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

JSClass("IKColorProfileTests", TKTestSuite, {

    testInitWithData: function(){
        var profile = IKColorProfile.initWithData(null);
        TKAssertNull(profile);
        profile = IKColorProfile.initWithData(undefined);
        TKAssertNull(profile);
        profile = IKColorProfile.initWithData(JSData.initWithLength(12));
        TKAssertNull(profile);
        profile = IKColorProfile.initWithData(JSData.initWithLength(128));
        TKAssertNull(profile);
    },

    testSRGB: function(){
        var expectation = TKExpectation.init();
        expectation.call(this.getResourceData, this, "sRGB", "icc", function(data){
            var profile = IKColorProfile.initWithData(data);
            TKAssertNotNull(profile);
            TKAssertExactEquals(profile.version, 0x02100000);
            TKAssertExactEquals(profile.profileClass, IKColorProfile.ProfileClass.display);
            TKAssertExactEquals(profile.colorSpace, IKColorProfile.ColorSpace.rgb);
            TKAssertExactEquals(profile.numberOfComponents, 3);
            TKAssertExactEquals(profile.connectionSpace, IKColorProfile.ColorSpace.xyz);
            TKAssertExactEquals(profile.platform, IKColorProfile.Platform.microsoft);
            TKAssertExactEquals(profile.renderingIntent, IKColorProfile.RenderingIntent.perceptual);
            TKAssertNotNull(profile.mediaWhitepoint);
            TKAssertNotUndefined(profile.mediaWhitepoint);
            TKAssertFloatEquals(profile.mediaWhitepoint.value[0], 0.9505, 0.001);
            TKAssertFloatEquals(profile.mediaWhitepoint.value[1], 1.0, 0.001);
            TKAssertFloatEquals(profile.mediaWhitepoint.value[2], 1.08883, 0.001);
            TKAssertNotNull(profile.redMatrixColumn);
            TKAssertNotUndefined(profile.redMatrixColumn);
            TKAssertFloatEquals(profile.redMatrixColumn.value[0], 0.436, 0.001);
            TKAssertFloatEquals(profile.redMatrixColumn.value[1], 0.222, 0.001);
            TKAssertFloatEquals(profile.redMatrixColumn.value[2], 0.014, 0.001);
            TKAssertNotNull(profile.greenMatrixColumn);
            TKAssertNotUndefined(profile.greenMatrixColumn);
            TKAssertFloatEquals(profile.greenMatrixColumn.value[0], 0.385, 0.001);
            TKAssertFloatEquals(profile.greenMatrixColumn.value[1], 0.717, 0.001);
            TKAssertFloatEquals(profile.greenMatrixColumn.value[2], 0.097, 0.001);
            TKAssertNotNull(profile.blueMatrixColumn);
            TKAssertNotUndefined(profile.blueMatrixColumn);
            TKAssertFloatEquals(profile.blueMatrixColumn.value[0], 0.143, 0.001);
            TKAssertFloatEquals(profile.blueMatrixColumn.value[1], 0.061, 0.001);
            TKAssertFloatEquals(profile.blueMatrixColumn.value[2], 0.714, 0.001);
            TKAssertNotNull(profile.redToneReproductionCurve);
            TKAssertNotUndefined(profile.redToneReproductionCurve);
            TKAssertFloatEquals(profile.redToneReproductionCurve.fn(0), 0, 0.001);
            TKAssertFloatEquals(profile.redToneReproductionCurve.fn(0.25), 0.05, 0.001);
            TKAssertFloatEquals(profile.redToneReproductionCurve.fn(0.5), 0.214, 0.001);
            TKAssertFloatEquals(profile.redToneReproductionCurve.fn(0.75), 0.522, 0.001);
            TKAssertFloatEquals(profile.redToneReproductionCurve.fn(1), 1, 0.001);
            TKAssertFloatEquals(profile.redToneReproductionCurve.fn.inverse(0), 0, 0.001);
            TKAssertFloatEquals(profile.redToneReproductionCurve.fn.inverse(0.05), 0.25, 0.005);
            TKAssertFloatEquals(profile.redToneReproductionCurve.fn.inverse(0.214), 0.5, 0.001);
            TKAssertFloatEquals(profile.redToneReproductionCurve.fn.inverse(0.522), 0.75, 0.001);
            TKAssertFloatEquals(profile.redToneReproductionCurve.fn.inverse(1), 1, 0.001);
            TKAssertNotNull(profile.greenToneReproductionCurve);
            TKAssertNotUndefined(profile.greenToneReproductionCurve);
            TKAssertFloatEquals(profile.greenToneReproductionCurve.fn(0), 0, 0.001);
            TKAssertFloatEquals(profile.greenToneReproductionCurve.fn(0.25), 0.05, 0.001);
            TKAssertFloatEquals(profile.greenToneReproductionCurve.fn(0.5), 0.214, 0.001);
            TKAssertFloatEquals(profile.greenToneReproductionCurve.fn(0.75), 0.522, 0.001);
            TKAssertFloatEquals(profile.greenToneReproductionCurve.fn(1), 1, 0.001);
            TKAssertFloatEquals(profile.greenToneReproductionCurve.fn.inverse(0), 0, 0.001);
            TKAssertFloatEquals(profile.greenToneReproductionCurve.fn.inverse(0.05), 0.25, 0.005);
            TKAssertFloatEquals(profile.greenToneReproductionCurve.fn.inverse(0.214), 0.5, 0.001);
            TKAssertFloatEquals(profile.greenToneReproductionCurve.fn.inverse(0.522), 0.75, 0.001);
            TKAssertFloatEquals(profile.greenToneReproductionCurve.fn.inverse(1), 1, 0.001);
            TKAssertNotNull(profile.blueToneReproductionCurve);
            TKAssertNotUndefined(profile.blueToneReproductionCurve);
            TKAssertFloatEquals(profile.blueToneReproductionCurve.fn(0), 0, 0.001);
            TKAssertFloatEquals(profile.blueToneReproductionCurve.fn(0.25), 0.05, 0.001);
            TKAssertFloatEquals(profile.blueToneReproductionCurve.fn(0.5), 0.214, 0.001);
            TKAssertFloatEquals(profile.blueToneReproductionCurve.fn(0.75), 0.522, 0.001);
            TKAssertFloatEquals(profile.blueToneReproductionCurve.fn(1), 1, 0.001);
            TKAssertFloatEquals(profile.blueToneReproductionCurve.fn.inverse(0), 0, 0.001);
            TKAssertFloatEquals(profile.blueToneReproductionCurve.fn.inverse(0.05), 0.25, 0.005);
            TKAssertFloatEquals(profile.blueToneReproductionCurve.fn.inverse(0.214), 0.5, 0.001);
            TKAssertFloatEquals(profile.blueToneReproductionCurve.fn.inverse(0.522), 0.75, 0.001);
            TKAssertFloatEquals(profile.blueToneReproductionCurve.fn.inverse(1), 1, 0.001);
            // TKAssertNotNull(profile.copyright);
            // TKAssertNotUndefined(profile.copyright);
            // TKAssertNotNull(profile.deviceModelDescription);
            // TKAssertNotUndefined(profile.deviceModelDescription);
            // TKAssertNotNull(profile.deviceManufacturer);
            // TKAssertNotUndefined(profile.deviceManufacturer);
            TKAssertNotNull(profile.luminance);
            TKAssertNotUndefined(profile.luminance);
            TKAssertFloatEquals(profile.luminance.value[0], 76.036, 0.001);
            TKAssertFloatEquals(profile.luminance.value[1], 80.0, 0.001);
            TKAssertFloatEquals(profile.luminance.value[2], 87.125, 0.001);
            TKAssertNotNull(profile.measurement);
            TKAssertNotUndefined(profile.measurement);
            TKAssertNotNull(profile.signature);
            TKAssertNotUndefined(profile.signature);
            TKAssertNotNull(profile.viewingConditions);
            TKAssertNotUndefined(profile.viewingConditions);
            // TKAssertNotNull(profile.viewingConditionsDescription);
            // TKAssertNotUndefined(profile.viewingConditionsDescription);
            TKAssertNull(profile.aToB0);
            TKAssertNull(profile.bToA0);
        }, this);
        this.wait(expectation, 1.0);
    }

});