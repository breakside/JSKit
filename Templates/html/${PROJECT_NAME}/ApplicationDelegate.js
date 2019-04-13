// #import UIKit
/* global JSClass, JSObject */
'use strict';

JSClass("ApplicationDelegate", JSObject, {

    window: null,
    mainViewController: null,

    applicationDidFinishLaunching: function(application, launchOptions){
        this.window.makeKeyAndOrderFront();
    }

});