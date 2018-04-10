// #import "Foundation/Foundation.js"
/* global JSClass, JSObject, JSReadOnlyProperty */
'use strict';

 JSClass("JSColorSpace", JSObject, {

    profileData: JSReadOnlyProperty('_profileData', null),

    initWithProfileData: function(profileData){
        this._profileData = profileData;
    }

 });