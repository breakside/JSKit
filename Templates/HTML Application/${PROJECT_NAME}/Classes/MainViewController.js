// #import "UIKit/UIKit.js"
/* global JSClass, UIViewController, MainViewController */
'use strict';

JSClass("MainViewController", UIViewController, {

    viewDidLoad: function(){
        MainViewController.$super.viewDidLoad();
    },

    viewDidAppear: function(){
        MainViewController.$super.viewDidAppear();
    },

});