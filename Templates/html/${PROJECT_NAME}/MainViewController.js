// #import UIKit
'use strict';

JSClass("MainViewController", UIViewController, {

    label: JSOutlet(),
    testButton: JSOutlet(),

    viewDidLoad: function(){
        MainViewController.$super.viewDidLoad.call(this);
    },

    viewDidAppear: function(){
        MainViewController.$super.viewDidAppear.call(this);
    },

    test: function(){
        this.label.text = JSBundle.mainBundle.localizedString("testing");
    },

    viewDidLayoutSubviews: function(){
        this.label.sizeToFit();
        this.testButton.sizeToFit();
        var center = this.view.bounds.center;
        this.label.position = center.subtracting(JSPoint(0, this.label.bounds.size.height));
        this.testButton.position = center.adding(JSPoint(0, this.testButton.bounds.size.height));
    }

});