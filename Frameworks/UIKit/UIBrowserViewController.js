// #import "UIKit/UIViewController.js"
// #import "UIKit/UIBrowserView.js"
/* global JSClass, JSReadOnlyProperty, UIViewController, UIBrowserView, UIBrowserViewController */
'use strict';

JSClass("UIBrowserViewController", UIViewController, {

    // --------------------------------------------------------------------
    // MARK: - Creating a Browser View Controller

    init: function(){
        UIBrowserViewController.$super.init.call(this);
        this._commonBrowserViewControllerInit();
    },

    initWithSpec: function(spec, values){
        UIBrowserViewController.$super.initWithSpec.call(this, spec, values);
        this._commonBrowserViewControllerInit();
    },

    _commonBrowserViewControllerInit: function(){
        this._viewControllers = [];
    },

    _defaultViewClass: "UIBrowserView",

    // --------------------------------------------------------------------
    // MARK: - View Lifecycle

    viewWillAppear: function(animated){
        UIBrowserViewController.$super.viewWillAppear.call(this, animated);
        var viewController;
        for (var i = 0, l = this._viewControllers.length; i < l; ++i){
            viewController = this._viewControllers[i];
            viewController.viewWillAppear(animated);
        }
    },

    viewWillDisappear: function(animated){
        UIBrowserViewController.$super.viewWillDisappear.call(this, animated);
        var viewController;
        for (var i = 0, l = this._viewControllers.length; i < l; ++i){
            viewController = this._viewControllers[i];
            viewController.viewWillDisappear(animated);
        }
    },

    viewDidAppear: function(animated){
        UIBrowserViewController.$super.viewDidAppear.call(this, animated);
        var viewController;
        for (var i = 0, l = this._viewControllers.length; i < l; ++i){
            viewController = this._viewControllers[i];
            viewController.viewDidAppear(animated);
        }
    },

    viewDidDisappear: function(animated){
        UIBrowserViewController.$super.viewDidDisappear.call(this, animated);
        var viewController;
        for (var i = 0, l = this._viewControllers.length; i < l; ++i){
            viewController = this._viewControllers[i];
            viewController.viewDidDisappear(animated);
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Child View Controllers

    viewControllers: JSReadOnlyProperty('_viewControllers', null),

    pushViewController: function(viewController){
        this.addChildViewController(viewController);
        this._viewControllers.push(viewController);
        this.view.pushView(viewController.view);
        viewController.viewWillAppear(false);
        viewController.viewDidAppear(false);
    },

    popViewController: function(){
        this.popViewControllers(1);
    },

    popViewControllers: function(count){
        var vc;
        while (this._viewControllers.length > 0 && count > 0){
            vc = this._viewControllers.pop();
            --count;
            vc.viewWillDisappear(false);
            this.view.popView();
            this.removeFromParentViewController(vc);
            vc.viewDidDisappear(false);
        }
    }

});