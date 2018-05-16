// #import "UIKit/UIViewController.js"
// #import "UIKit/UITabView.js"
/* global JSClass, JSReadOnlyProperty, JSCopy, JSDynamicProperty, UIViewController, UITabViewController, UITabView, UITabViewItem */
'use strict';

JSClass("UITabViewController", UIViewController, {

    tabView: JSReadOnlyProperty('_tabView', null),
    viewControllers: JSReadOnlyProperty('_viewControllers', null),
    selectedIndex: JSDynamicProperty(),
    selectedViewController: JSDynamicProperty(),

    initWithViewControllers: function(viewControllers){
        UITabViewController.$super.init.call(this);
        this._viewControllers = JSCopy(viewControllers);
    },

    initWithSpec: function(spec, values){
        UITabViewController.$super.initWithSpec.call(this, spec, values);
        this._viewControllers = [];
        if ('viewControllers' in values){
            for (var i = 0, l = values.viewControllers.length; i < l; ++i){
                this.viewControllers.push(spec.resolvedValue(values.viewControllers[i]));
            }
        }
    },

    addViewController: function(viewController){
        this.insertViewControllerAtIndex(viewController, this._viewControllers.length);
    },

    insertViewControllerAtIndex: function(viewController, index){
        this._viewControllers.splice(index, 0, viewController);
        this.tabView.insertItemAtIndex(index, viewController.tabViewItem);
    },

    removeViewControllerAtIndex: function(index){
        this._viewControllers.splice(index, 1);
        this.tabView.removeItemAtIndex(index);
    },

    loadView: function(){
        this._tabView = UITabView.init();
        var items = [];
        for (var i = 0, l = this._viewControllers.length; i < l; ++i){
            items.push(this._viewControllers[i].tabViewItem);
        }
        // load first view so it's ready when we set .items
        if (this._viewControllers.length > 0){
            items[0].view = this._viewControllers[0].view;
        }
        this._tabView.items = items;
        // set delegate after setting .items so we don't get any notifications until things are all set up
        this._tabView.delegate = this;
        this._view = this._tabView;
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

    _previouslySelectedViewController: null,

    tabViewWillSelectItemAtIndex: function(tabView, index){
        this._previouslySelectedViewController = this.selectedViewController;
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
        if (this._previouslySelectedViewController !== null){
            this._previouslySelectedViewController.viewDidDisappear();
            this._previouslySelectedViewController = null;
        }
        var viewController = this.selectedViewController;
        if (viewController !== null){
            viewController.viewDidAppear();
        }
    }

});