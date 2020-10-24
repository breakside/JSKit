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

// #import Foundation
// #import "UIResponder.js"
// #import "UITabView.js"
/* global UINavigationItem, UINavigationController */
'use strict';

JSClass("UIViewController", UIResponder, {

    // -------------------------------------------------------------------------
    // MARK: - Creating a View Controller

    init: function(){
    },

    initWithSpec: function(spec){
        if (spec.containsKey(this._viewKeyInSpec)){
            // If the spec has a view, always load from the spec
            Object.defineProperty(this, 'loadView', {
                configurable: true,
                value: function UIView_loadViewFromSpec(){
                    // FIXME: using a class default here isn't ideal because what if some other
                    // part of the spec has a reference to the view and resolves it before us
                    // without knowing the correct default class?
                    this._view = spec.valueForKey(this._viewKeyInSpec, this._defaultViewClass);
                }
            });
        }
        UIViewController.$super.initWithSpec.call(this, spec);
        if (spec.containsKey('tabViewItem')){
            this.tabViewItem = spec.valueForKey("tabViewItem", UITabViewItem);
        }
        if (spec.containsKey('navigationItem')){
            this.navigationItem = spec.valueForKey("navigationItem", UINavigationItem);
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Creating the View

    view: JSDynamicProperty('_view', null),
    window: JSReadOnlyProperty(),
    scene: JSReadOnlyProperty(),
    isViewLoaded: JSReadOnlyProperty(),
    _defaultViewClass: UIView,
    _viewKeyInSpec: "view",

    getIsViewLoaded: function(){
        return this._view !== null;
    },

    getView: function(){
        this._loadViewIfNeeded();
        return this._view;
    },

    loadView: function(){
        this._view = this._defaultViewClass.init();
    },

    unloadView: function(){
        if (this._view !== null){
            this._view.viewController = null;
            this._view = null;
            this.viewDidUnload();
        }
    },

    _loadViewIfNeeded: function(){
        if (!this.isViewLoaded){
            this.loadView();
            this._view.viewController = this;
            this.viewDidLoad();
        }
    },

    traitCollection: JSReadOnlyProperty(),

    getTraitCollection: function(){
        return this.view.traitCollection;
    },

    traitCollectionDidChange: function(previousTraits){
    },

    // -------------------------------------------------------------------------
    // MARK: - View Lifecycle

    _needsDidAppear: false,
    _needsDidDisappear: false,

    enqueueDidAppear: function(animated){
        if (!this._needsDidAppear){
            this._needsDidAppear = true;
            this.view.layer._displayServer.schedule(function(){
                if (this._needsDidAppear){
                    this._needsDidAppear = false;
                    this.viewDidAppear(false);
                }
            }, this);
        }
    },

    enqueueDidDisappear: function(animated){
        if (!this._needsDidDisappear){
            this._needsDidDisappear = true;
            this.view.layer._displayServer.schedule(function(){
                if (this._needsDidDisappear){
                    this._needsDidDisappear = false;
                    this.viewDidDisappear(false);
                }
            }, this);
        }
    },

    viewDidLoad: function(){
    },

    viewDidUnload: function(){
    },

    viewWillAppear: function(){
    },

    viewDidAppear: function(){
    },

    viewWillDisappear: function(){
        if (this.isViewLoaded){
            var window = this.view.window;
            if (window !== null){
                var responder = this.view.window.firstResponder;
                if (responder !== null && responder.isKindOfClass(UIView)){
                    var view = responder;
                    while (view !== null && view !== this.view){
                        view = view.superview;
                    }
                    if (view !== null && view === this.view){
                        window.firstResponder = null;
                    }
                }
            }
        }
    },

    viewDidDisappear: function(){
    },

    viewDidLayoutSubviews: function(){
    },

    sizeViewToFitSize: function(size){
        this.view.sizeToFitSize(size);
    },

    // -------------------------------------------------------------------------
    // MARK: - Child View Controllers

    parentViewController: null,

    addChildViewController: function(viewController){
        viewController.willMoveToParentViewController(this);
        viewController.parentViewController = this;
        viewController.didMoveToParentViewController(this);
    },

    removeFromParentViewController: function(){
        this.willMoveToParentViewController(null);
        this.parentViewController = null;
        this.didMoveToParentViewController(null);
    },

    willMoveToParentViewController: function(parentViewController){
    },

    didMoveToParentViewController: function(parentViewController){
    },

    // -------------------------------------------------------------------------
    // MARK: - Responder

    getNextResponder: function(){
        return this._view.superview;
    },

    // -------------------------------------------------------------------------
    // MARK: - Items for containing view controllers

    tabViewItem: null,
    navigationItem: JSDynamicProperty('_navigationItem', null),

    getNavigationItem: function(){
        if (this._navigationItem === null){
            this._navigationItem = UINavigationItem.init();
        }
        return this._navigationItem;
    },

    navigationController: JSReadOnlyProperty(),

    getNavigationController: function(){
        var ancestor = this.parentViewController;
        while (ancestor !== null && !ancestor.isKindOfClass(UINavigationController)){
            ancestor = ancestor.parentViewController;
        }
        return ancestor;
    },

    // -------------------------------------------------------------------------
    // MARK: - Scene

    getWindow: function(){
        if (this._view !== null){
            return this._view.window;
        }
        return null;
    },

    getScene: function(){
        var window = this.window;
        if (window !== null){
            return window.scene;
        }
        return null;
    },

    // -------------------------------------------------------------------------
    // MARK: - Presenting Other View Controllers

    presentingViewController: null,
    presentedViewController: null,

    show: function(viewController, sender){
        this.presentViewController(viewController, true);
    },

    presentViewController: function(viewController, animated){
        viewController.presentingViewController = this;
        this.presentedViewController = viewController;
        // TODO: 
    },

    dismiss: function(){
        if (this.presentedViewController){
            // TODO:
        }else if (this.presentingViewController){
            this.presentingViewController.dismiss();
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - State Restoration

    restorationIdentifier: null,

    // MARK: - Localization

    localizedString: function(key){
        return JSBundle.mainBundle.localizedString(key, this.$class.className);
    }


});