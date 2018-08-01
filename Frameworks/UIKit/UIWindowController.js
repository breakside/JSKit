// #import "UIKit/UIViewController.js"
/* global JSClass, UIViewController, JSSize, JSReadOnlyProperty, JSCopy, UIWindowController, JSProtocol, JSSpec */
'use strict';

JSClass("UIWindowController", UIViewController, {

    _defaultViewClass: "UIWindow",
    windowDelegate: null,
    autoPositionWindow: true,

    initWithSpec: function(spec, values){
        values = JSCopy(values);
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
        this.unloadView();
    },

    contentSizeThatFitsSize: function(size){
        var contentSize;
        if (this.window.contentViewController){
            contentSize = this.window.contentViewController.contentSizeThatFitsSize(size);
        }else{
            this.window.contentView.sizeToFitSize(size);
            contentSize = JSSize(this.window.contentView.frame.size);
        }
        return contentSize;
    },

    getWindow: function(){
        return this.view;
    },

    getNextResponder: function(){
        return this._view._application;
    },

    orderFront: function(){
        this._prepareWindow();
        this.window.orderFront();
    },

    open: function(){
        this.orderFront();
    },

    makeKeyAndOrderFront: function(){
        this._prepareWindow();
        this.window.makeKeyAndOrderFront();
    },

    _needsPrepare: true,

    _prepareWindowIfNeeded: function(){
        if (this._needsPrepare){
            this._prepareWindow();
            this._needsPrepare = false;
        }
    },

    _prepareWindow: function(){
        if (this.autoPositionWindow){
            this.window.sizeToFit();
            if (!this.window.isUsingAutosavedFrame){
                this.window.position = this.window.windowServer.screen.availableFrame.center;
            }
        }
    },

    close: function(){
        this.window.close();
    },

    unloadView: function(){
        UIWindowController.$super.unloadView.call(this);
        this._needsPrepare = true;
    }

});