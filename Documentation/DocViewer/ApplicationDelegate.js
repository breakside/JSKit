// Copyright © 2020 Breakside Inc.  MIT License.
// #import UIKit
/* global JSClass, JSObject, JSUserDefaults */
'use strict';

JSClass("ApplicationDelegate", JSObject, {

    window: null,
    mainViewController: null,

    applicationDidFinishLaunching: function(application, launchOptions){
        this.setupDefaults();
        this.mainViewController.baseURL = application.baseURL;
        this.mainViewController.setup(launchOptions.uistate);
        this.window.makeKeyAndOrderFront();
    },

    setupDefaults: function(){
        JSUserDefaults.shared.registerDefaults({
            lastComponentPath: null, 
        });
    },

    applicationUpdateAvailable: function(application){
        this.mainViewController.indicateUpdateAvailable();
    }

});