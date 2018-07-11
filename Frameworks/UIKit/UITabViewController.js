// #import "UIKit/UIViewController.js"
// #import "UIKit/UITabView.js"
/* global JSClass, JSReadOnlyProperty, JSCopy, JSDeepCopy, JSDynamicProperty, UIViewController, UITabViewController, UITabView, UITabViewItem */
'use strict';

JSClass("UITabViewController", UIViewController, {

    tabView: JSReadOnlyProperty(),
    viewControllers: JSReadOnlyProperty('_viewControllers', null),
    selectedIndex: JSDynamicProperty(),
    selectedViewController: JSDynamicProperty(),
    _previouslySelectedViewController: null,
    _defaultViewClass: "UITabView",

    initWithViewControllers: function(viewControllers){
        UITabViewController.$super.init.call(this);
        this._viewControllers = JSCopy(viewControllers);
    },

    initWithSpec: function(spec, values){
        this._viewControllers = [];
        var viewController;
        var i, l;
        if ('viewControllers' in values){
            for (i = 0, l = values.viewControllers.length; i < l; ++i){
                viewController = spec.resolvedValue(values.viewControllers[i]);
                this.viewControllers.push(viewController);
            }
        }
        if ('view' in values){
            // Set properties that can't really be defined in the spec because
            // we always want them to be the same thing.  This ensures they're
            // populated and set correctly when the view is loaded from the spec
            values = JSDeepCopy(values);
            values.view.delegate = this;
            values.view.items = [];
            for (i = 0, l = this._viewControllers.length; i < l; ++i){
                values.view.items.push(this._viewControllers[i].tabViewItem);
            }
        }
        UITabViewController.$super.initWithSpec.call(this, spec, values);
        for (i = 0, l = this.viewControllers.length; i < l; ++i){
            this.addChildViewController(this.viewControllers[i]);
        }
    },

    addViewController: function(viewController){
        this.insertViewControllerAtIndex(viewController, this._viewControllers.length);
    },

    insertViewControllerAtIndex: function(viewController, index){
        this._viewControllers.splice(index, 0, viewController);
        this.tabView.insertItemAtIndex(index, viewController.tabViewItem);
        this.addChildViewController(viewController);
    },

    removeViewControllerAtIndex: function(index){
        this._viewControllers[index].removeFromParentViewController();
        this._viewControllers.splice(index, 1);
        this.tabView.removeItemAtIndex(index);
    },

    loadView: function(){
        var tabView = UITabView.init();
        tabView.delegate = this;
        var items = [];
        for (var i = 0, l = this._viewControllers.length; i < l; ++i){
            items.push(this._viewControllers[i].tabViewItem);
        }
        tabView.items = items;
        this._view = tabView;
    },

    getTabView: function(){
        return this._view;
    },

    setSelectedIndex: function(index){
        this.tabView.selectedIndex = index;
    },

    getSelectedIndex: function(){
        return this.tabView.selectedIndex;
    },

    getSelectedViewController: function(){
        if (this.selectedIndex < this._viewControllers.length){
            return this._viewControllers[this.selectedIndex];
        }
        return null;
    },

    setSelectedViewController: function(viewController){
        var index = this._viewControllers.indexOf(viewController);
        if (index >= 0){
            this.selectedIndex = index;
        }
    },

    tabViewWillSelectItemAtIndex: function(tabView, index){
        if (this._previouslySelectedViewController !== null){
            this._previouslySelectedViewController.viewWillDisappear();
        }
        var viewController = null;
        if (index < this._viewControllers.length){
            viewController = this._viewControllers[index];
        }
        if (viewController !== null){
            // Ensure that the view controller's view is loaded before its item
            // is selected
            viewController.tabViewItem.view = viewController.view;
            viewController.viewWillAppear();
        }
    },

    tabViewDidSelectItemAtIndex: function(tabView, index){
        var viewController = null;
        if (index < this._viewControllers.length){
            viewController = this._viewControllers[index];
        }
        if (this._previouslySelectedViewController !== null){
            this._previouslySelectedViewController.viewDidDisappear();
            this._previouslySelectedViewController = viewController;
        }
        if (viewController !== null){
            viewController.viewDidAppear();
        }
    }

});