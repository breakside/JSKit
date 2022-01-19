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
// #import "IKColorProfile.js"
'use strict';

(function(){

var logger = JSLog("imagekit", "colorspace");

JSClass("IKColorSpace", JSColorSpace, {

    initWithProfileData: function(data){
        var profile = IKColorProfile.initWithData(data);
        return this.initWithProfile(profile);
    },

    initWithProfile: function(profile){
        if (profile === undefined || profile === null){
            return null;
        }
        if (profile.profileClass === IKColorProfile.ProfileClass.deviceLink){
            logger.warn("color profile must not be a device link class");
            return null;
        }
        if (profile.connectionWhitepoint !== JSColorSpace.Whitepoint.D50){
            logger.warn("color profile must use the D50 pcs illuminant");
            return null;
        }
        if (profile.connectionSpace === IKColorProfile.ColorSpace.lab){
            this._connectionSpace = JSColorSpace.lab;
        }else if (profile.connectionSpace !== IKColorProfile.ColorSpace.xyz){
            this._connectionSpace = JSColorSpace.xyz;
        }else{
            logger.warn("color profile must have a Lab or XYZ connection space");
            return null;
        }
        if (profile.A2B0 !== null && profile.B2A0 !== null){
            this._componentConverter = IKColorProfileLookupComponentConverter.initWithLookupTables(profile.A2B0, profile.B2A0);
        }else if (profile.redTRC !== null && profile.greenTRC !== null && profile.blueTRC !== null && profile.redXYZ !== null && profile.greenXYZ !== null && profile.blueXYZ !== null){
            var matrix = [
                [profile.redXYZ.xyz[0], profile.greenXYZ.xyz[0]. profile.blueXYZ.xyz[0]],
                [profile.redXYZ.xyz[1], profile.greenXYZ.xyz[1]. profile.blueXYZ.xyz[1]],
                [profile.redXYZ.xyz[2], profile.greenXYZ.xyz[2]. profile.blueXYZ.xyz[2]]
            ];
            var curves = [
                profile.redTRC.fn,
                profile.greenTRC.fn,
                profile.blueTRC.fn
            ];
            this._componentConverter = IKColorProfileMatrixComponentConverter.initWithMatrix(matrix, curves);
        }else{
            logger.warn("color profile does not contain supported conversion tags");
            return null;
        }
        // TODO: anything with media white point?
        this._profile = profile;
        this.numberOfComponents = profile.numberOfComponents;
        this.name = "icc-%s".sprintf(profile.colorSpace.trim());
    },

    profile: JSReadOnlyProperty("_profile", null),
    connectionSpace:JSReadOnlyProperty("_connectionSpace", null),
    _componentConverter: null,

    xyzFromComponents: function(components){
        var connectionComponents = this._componentConverter.connectionComponentsFromComponents(components);
        return this._connectionSpace.xyzFromComponents(connectionComponents);
    },

    componentsFromXYZ: function(xyz){
        var connectionComponents = this._connectionSpace.componentsFromXYZ(xyz);
        return this._componentConverter.componentsFromConnectionComponents(connectionComponents);
    },

});

})();