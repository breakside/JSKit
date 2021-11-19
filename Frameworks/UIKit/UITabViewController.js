// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #import "UIViewController.js"
// #import "UITabView.js"
'use strict';

JSClass("UITabViewController", UIViewController, {

    tabView: JSReadOnlyProperty(),
    viewControllers: JSReadOnlyProperty('_viewControllers', null),
    selectedIndex: JSDynamicProperty(),
    selectedViewController: JSDynamicProperty(),
    _previouslySelectedViewController: null,
    _defaultViewClass: UITabView,
    _tabViewStyler: null,

    initWithViewControllers: function(viewControllers, styler){
        UITabViewController.$super.init.call(this);
        this._viewControllers = JSCopy(viewControllers);
        this._tabViewStyler = styler || null;
    },

    initWithSpec: function(spec){
        this._viewControllers = [];
        this._tabViewStyler = null;
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

    loadView: function(){
        this._view = UITabView.initWithStyler(this._tabViewStyler);
    },

    viewDidLoad: function(){
        UITabViewController.$super.viewDidLoad.call(this);
        this.view.delegate = this;
        for (var i = 0, l = this._viewControllers.length; i < l; ++i){
            this.view.addItem(this._viewControllers[i].tabViewItem);
        }
    },

    viewWillAppear: function(animated){
        UITabViewController.$super.viewWillAppear.call(this, animated);
        var selectedViewController = this.selectedViewController;
        if (selectedViewController !== null){
            selectedViewController.viewWillAppear(animated);
        }
    },

    viewDidAppear: function(animated){
        UITabViewController.$super.viewDidAppear.call(this, animated);
        var selectedViewController = this.selectedViewController;
        if (selectedViewController !== null){
            selectedViewController.viewDidAppear(animated);
        }
    },

    viewWillDisappear: function(animated){
        UITabViewController.$super.viewWillDisappear.call(this, animated);
        var selectedViewController = this.selectedViewController;
        if (selectedViewController !== null){
            selectedViewController.viewWillDisappear(animated);
        }
    },
    
    viewDidDisappear: function(animated){
        UITabViewController.$super.viewDidDisappear.call(this, animated);
        var selectedViewController = this.selectedViewController;
        if (selectedViewController !== null){
            selectedViewController.viewDidDisappear(animated);
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
        if (this.selectedIndex >= 0 && this.selectedIndex < this._viewControllers.length){
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
        if (this.isViewVisible && this._previouslySelectedViewController !== null){
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
            if (this.isViewVisible){
                viewController.viewWillAppear();
            }
        }
    },

    tabViewDidSelectItemAtIndex: function(tabView, index){
        var viewController = null;
        if (index < this._viewControllers.length){
            viewController = this._viewControllers[index];
        }
        if (this.isViewVisible && this._previouslySelectedViewController !== null){
            this._previouslySelectedViewController.viewDidDisappear();
        }
        this._previouslySelectedViewController = viewController;
        if (this.isViewVisible && viewController !== null){
            viewController.viewDidAppear();
        }
    }

});