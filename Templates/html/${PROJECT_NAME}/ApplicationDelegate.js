// #import UIKit
/* global JSClass, JSObject, UIWindow, JSColor, UIView, JSRect, UIBasicAnimation */
'use strict';

JSClass("ApplicationDelegate", JSObject, {

    window: null,
    mainViewController: null,

    applicationDidFinishLaunching: function(application, launchOptions){
        this.window.makeKeyAndOrderFront();
    }

});