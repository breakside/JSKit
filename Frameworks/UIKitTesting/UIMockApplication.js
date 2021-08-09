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

// #import UIKit
// #import "UIMockWindowServer.js"
// #import "UIMockFontDescriptor.js"
"use strict";

JSClass("UIMockApplication", UIApplication, {

    init: function(){
        this.initWithBundle(JSBundle.mainBundle);
    },

    initEmpty: function(){
        var bundle = JSBundle.initWithDictionary({Info: {}});
        this.initWithBundle(bundle);
        JSFont.registerSystemFontDescriptor(UIMockFontDescriptor.init());
    },

    initWithBundle: function(bundle){
        var windowServer = UIMockWindowServer.init();
        UIMockApplication.$super.initWithBundle.call(this, bundle, windowServer);
    },

    _launch: function(completion, target){
        this.setup(completion, target);
    },

    setupDelegate: function(){
    },

    stop: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNull);
        }
        UIMockApplication.$super.stop.call(this, function(){
            this.deinit();
            JSFileManager.shared.destroy(function(){
                completion.call(target, null); 
            });
        }, this);
        return completion.promise;
    },

    deinit: function(){
        UIMockApplication.$super.deinit.call(this);
    },

    displayTime: 0,

    updateDisplay: function(dt){
        if (dt === undefined){
            dt = 1;
        }
        this.displayTime += dt;
        this.windowServer.displayServer.updateDisplay(this.displayTime);
    },

    openedURL: null,

    openURL: function(url){
        this.openedURL = url;
    }

});