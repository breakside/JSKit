// #import UIKit
/* global JSClass, JSObject, JSUserDefaults */
'use strict';

JSClass("ApplicationDelegate", JSObject, {

    window: null,
    mainViewController: null,

    applicationDidFinishLaunching: function(application, launchOptions){
        this.setupDefaults();
        this.mainViewController.baseURL = application.baseURL;
        this.mainViewController.setup();
        this.window.makeKeyAndOrderFront();
    },

    setupDefaults: function(){
        JSUserDefaults.shared.registerDefaults({
            
        });
    }

});