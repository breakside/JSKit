// #import "Foundation/Foundation.js"
/* global JSClass, JSObject, UIView */
'use strict';

JSClass("UIViewController", JSObject, {
    view: null,
    isViewLoaded: false,

    init: function(){
    },

    loadView: function(){
        this.view = UIView.initWithFrame();
        this.isViewLoaded = true;
        this.viewDidLoad();
    },

    viewDidLoad: function(){
    }

});