// #import "UIViewController.js"
// #import "UITabView.js"
/* global JSClass, JSReadOnlyProperty, JSCopy, JSDeepCopy, JSDynamicProperty, UIViewController, UITabViewController, UITabView, UITabViewItem */
'use strict';

JSClass("UITabViewController", UIViewController, {

    tabView: JSReadOnlyProperty(),
    viewControllers: JSReadOnlyProperty('_viewControllers', null),
    selectedIndex: JSDynamicProperty(),
    selectedViewController: JSDynamicProperty(),
    _previouslySelectedViewController: null,
    _defaultViewClass: UITabView,

    initWithViewControllers: function(viewControllers){
        UITabViewController.$super.init.call(this);
        this._viewControllers = JSCopy(viewControllers);
    },

    initWithSpec: function(spec){
        this._viewControllers = [];
        var viewController;
        var i, l;
        if (spec.containsKey('viewControllers')){
            var viewControllers = spec.valueForKey("viewControllers");
            for (i = 0, l = viewControllers.length; i < l; ++i){
                viewController = viewControllers.valueForKey(i);
                this.viewControllers.push(viewController);
            }
        }
        UITabViewController.$super.initWithSpec.call(this, spec);
        for (i = 0, l = this.viewControllers.length; i < l; ++i){
            this.addChildViewController(this.viewControllers[i]);
        }
    },

    viewDidLoad: function(){
        UITabViewController.$super.viewDidLoad.call(this);
        this.view.delegate = this;
        for (var i = 0, l = this._viewControllers.length; i < l; ++i){
            this.view.addItem(this._viewControllers[i].tabViewItem);
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