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
// #import "UIBrowserView.js"
'use strict';

JSClass("UIBrowserViewController", UIViewController, {

    // --------------------------------------------------------------------
    // MARK: - Creating a Browser View Controller

    init: function(){
        UIBrowserViewController.$super.init.call(this);
        this._commonBrowserViewControllerInit();
    },

    initWithSpec: function(spec){
        UIBrowserViewController.$super.initWithSpec.call(this, spec);
        this._commonBrowserViewControllerInit();
    },

    _commonBrowserViewControllerInit: function(){
        this._viewControllers = [];
    },

    _defaultViewClass: UIBrowserView,

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
        if (this.isViewVisible){
            viewController.scheduleAppearance();
        }
    },

    popViewController: function(){
        this.popViewControllers(1);
    },

    popViewControllers: function(count){
        var vc;
        while (this._viewControllers.length > 0 && count > 0){
            vc = this._viewControllers.pop();
            --count;
            if (this.isViewVisible){
                vc.scheduleDisappearance();
            }
            this.view.popView();
            this.removeFromParentViewController(vc);
        }
    }

});