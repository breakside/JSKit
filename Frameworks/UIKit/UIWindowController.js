// #import "UIKit/UIViewController.js"
/* global JSClass, UIViewController, JSReadOnlyProperty, UIWindowController, JSProtocol */
'use strict';

JSClass("UIWindowController", UIViewController, {

    _defaultViewClass: "UIWindow",
    windowDelegate: null,

    initWithSpec: function(spec, values){
        if ('window' in values){
            values.view = values.window;
        }else if ('view' in values){
            values.view = {contentView: values.view};
        }
        UIWindowController.$super.initWithSpec.call(this, spec, values);
        if ('windowDelegate' in values){
            this.windowDelegate = spec.resolvedValue(values.windowDelegate);
        }
    },

    viewWillAppear: function(animated){
        UIWindowController.$super.viewWillAppear.call(this, animated);
        if (this.window.contentViewController){
            this.window.contentViewController.viewWillAppear(animated);
        }
    },

    viewDidAppear: function(animated){
        UIWindowController.$super.viewDidAppear.call(this, animated);
        if (this.window.contentViewController){
            this.window.contentViewController.viewDidAppear(animated);
        }
    },

    viewWillDisappear: function(animated){
        UIWindowController.$super.viewWillDisappear.call(this, animated);
        if (this.window.contentViewController){
            this.window.contentViewController.viewWillDisappear(animated);
        }
    },

    viewDidDisappear: function(animated){
        UIWindowController.$super.viewDidDisappear.call(this, animated);
        if (this.window.contentViewController){
            this.window.contentViewController.viewDidDisappear(animated);
        }
        if (this.windowDelegate){
            this.windowDelegate.windowControllerDidClose(this);
        }
    },

    getWindow: function(){
        return this.view;
    },

    makeVisible: function(){
        this.window.makeVisible();
    },

    makeKeyAndVisible: function(){
        this.window.makeKeyAndVisible();
    },

    close: function(){
        this.window.close();
    }

});