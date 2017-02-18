// #import "UIKit/UIKit+HTML.js"
/* global JSClass, JSObject, UIWindow, JSColor, UIView, JSRect, UIBasicAnimation */
'use strict';

JSClass("ApplicationDelegate", JSObject, {

    window: null,
    mainViewController: null,

    applicationDidFinishLaunching: function(){
        this.window.makeKeyAndVisible();
    }

});