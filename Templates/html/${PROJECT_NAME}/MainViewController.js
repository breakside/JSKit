// #import UIKit
/* global JSClass, JSBundle, UIViewController, MainViewController */
'use strict';

JSClass("MainViewController", UIViewController, {

    label: null,
    testButton: null,

    viewDidLoad: function(){
        MainViewController.$super.viewDidLoad.call(this);
    },

    viewDidAppear: function(){
        MainViewController.$super.viewDidAppear.call(this);
    },

    test: function(){
        this.label.text = JSBundle.mainBundle.localizedString("testing");
    }

});