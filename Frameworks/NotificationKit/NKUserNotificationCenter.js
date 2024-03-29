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
"use strict";

JSProtocol("NKUserNotificationCenterDelegate", JSProtocol, {

    notificationCenterWillShowNotification: function(center, notification, completion){}

});

JSClass("NKUserNotificationCenter", JSObject, {

    init: function(){
    },

    requestAuthorization: function(completion, target){
    },

    getAuthorizationStatus: function(completion, target){
    },

    registerForRemoteNotifications: function(completion, target){
    },

    unregisterForRemoteNotifications: function(completion, target){
    },

    getRemoteNotificationRegistration: function(completion, target){
    },

    getRemoteNotificationAuthorizationStatus: function(completion, target){
    },

    addNotification: function(notification, date){
    },

    removeNotification: function(notification){
    },

    defaultIcon: null,

    webPushApplicationServerJWK: null,

});

NKUserNotificationCenter.AuthorizationStatus = {
    unknown: 0,
    authorized: 1,
    denied: 2,
    unavailable: 3,
};

NKUserNotificationCenter.RegistrationType = {
    web: "web"
};