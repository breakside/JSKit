// #import "UIKit/UIKit.js"
/* global JSClass, UIViewController, MainViewController */
'use strict';

JSClass("MainViewController", UIViewController, {

    viewDidLoad: function(){
        MainViewController.$super.viewDidLoad.call(this);
    },

    viewDidAppear: function(){
        MainViewController.$super.viewDidAppear.call(this);
    },

});