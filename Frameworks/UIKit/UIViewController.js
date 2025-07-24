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
/* global UINavigationItem, UINavigationController, UIApplication */
'use strict';

(function(){

var logger = JSLog("uikit", "vc");
var lifecycleLogger = JSLog("uikit", "vclife");

JSClass("UIViewController", UIResponder, {

    // -------------------------------------------------------------------------
    // MARK: - Creating a View Controller

    init: function(){
        if (JSBundle.mainBundle !== null){
            var spec = JSSpec.initWithResource(this.$class.className);
            if (spec !== null){
                if (!spec.initializeFilesOwner(this)){
                    return null;
                }
            }
        }
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

    isViewVisible: JSReadOnlyProperty("_isViewVisible", false),

    lifecycleState: JSReadOnlyProperty("_lifecycleState", 0),

    viewDidLoad: function(){
    },

    viewDidUnload: function(){
    },

    viewWillAppear: function(animated){
        this._lifecycleState = UIViewController.LifecycleState.appearing;
        lifecycleLogger.debug("viewWillAppear %{public}#%d animated:%b", this.$class.className, this.objectID, animated);
        this._loadViewIfNeeded();
    },

    viewDidAppear: function(animated){
        this._lifecycleState = UIViewController.LifecycleState.appeared;
        lifecycleLogger.debug("viewDidAppear %{public}#%d animated:%b", this.$class.className, this.objectID, animated);
        this._isViewVisible = true;
    },

    viewWillDisappear: function(animated){
        this._lifecycleState = UIViewController.LifecycleState.disappearing;
        lifecycleLogger.debug("viewWillDisappear %{public}#%d animated:%b", this.$class.className, this.objectID, animated);
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

    viewDidDisappear: function(animated){
        this._lifecycleState = UIViewController.LifecycleState.disappeared;
        lifecycleLogger.debug("viewDidDisappear %{public}#%d animated:%b", this.$class.className, this.objectID, animated);
        this._isViewVisible = false;
    },

    // -------------------------------------------------------------------------
    // MARK: - Lifecycle Control Methods

    beginAppearance: function(animated){
        this.beginAppearanceTransition(true, animated);
    },

    endAppearance: function(){
        this.endAppearanceTransition();
    },

    beginAppearanceWithAnimator: function(animator){
        this.beginAppearance(true);
        animator.addCompletion(function(){
            this.endAppearance();
        }, this);
    },

    scheduleAppearance: function(){
        this.beginAppearance(false);
        this._scheduleAppearanceTransition();
    },

    beginDisappearance: function(animated){
        this.beginAppearanceTransition(false, animated);
    },

    endDisappearance: function(){
        this.endAppearanceTransition();
    },

    beginDisappearanceWithAnimator: function(animator){
        this.beginDisappearance(true);
        animator.addCompletion(function(){
            this.endDisappearance();
        }, this);
    },

    scheduleDisappearance: function(){
        this.beginDisappearance(false);
        this._scheduleAppearanceTransition();
    },

    beginAppearanceTransition: function(isAppearing, animated){
        this._appearanceTransitionAnimated = animated;
        if (isAppearing){
            if (this._lifecycleState === UIViewController.LifecycleState.disappeared || this._lifecycleState === UIViewController.LifecycleState.disappearing){
                this.viewWillAppear(animated);
            }
        }else{
            if (this._lifecycleState === UIViewController.LifecycleState.appeared || this._lifecycleState === UIViewController.LifecycleState.appearing){
                this.viewWillDisappear(animated);
            }
        }
    },

    endAppearanceTransition: function(){
        if (this._appearanceTransitionAnimated){
            this._endAppearanceTransition(true);
        }else{
            this._scheduleAppearanceTransition();
        }
    },

    _endAppearanceTransition: function(){
        this._appearanceTransitionScheduled = false;
        if (this._lifecycleState === UIViewController.LifecycleState.appearing){
            this.viewDidAppear(this._appearanceTransitionAnimated);
        }else if (this._lifecycleState === UIViewController.LifecycleState.disappearing){
            this.viewDidDisappear(this._appearanceTransitionAnimated);
        }
    },

    _appearanceTransitionAnimated: false,
    _appearanceTransitionScheduled: false,

    _scheduleAppearanceTransition: function(){
        if (this._appearanceTransitionScheduled){
            return;
        }
        this._appearanceTransitionScheduled = true;
        this.schedule(this._endAppearanceTransition);
    },

    // -------------------------------------------------------------------------
    // MARK: - Display Loop Syncrhonization

    schedule: function(callback){
        var displayServer = UIApplication.shared.windowServer.displayServer;
        displayServer.schedule(callback, this);
    },

    // -------------------------------------------------------------------------
    // MARK: - Layout

    viewDidLayoutSubviews: function(){
    },

    sizeViewToFitSize: function(size){
        this.view.sizeToFitSize(size);
    },

    contentSizeThatFitsSize: function(maxSize){
        this.view.sizeToFitSize(maxSize);
        return JSSize(this.view.bounds.size);
    },

    // -------------------------------------------------------------------------
    // MARK: - Child View Controllers

    parentViewController: null,

    addChildViewController: function(viewController){
        if (viewController.parentViewController === this){
            return;
        }
        if (viewController.parentViewController !== null){
            viewController.removeFromParentViewController();
        }
        viewController.willMoveToParentViewController(this);
        viewController.parentViewController = this;
        viewController.didMoveToParentViewController(this);
    },

    removeFromParentViewController: function(){
        if (this.parentViewController === null){
            return;
        }
        this.willMoveToParentViewController(null);
        this.parentViewController = null;
        this.didMoveToParentViewController(null);
    },

    willMoveToParentViewController: function(parentViewController){
    },

    didMoveToParentViewController: function(parentViewController){
    },

    replaceChildViewController: function(previousChildViewController, childViewController, animator){
        if (previousChildViewController === childViewController){
            return;
        }
        if (this.isViewLoaded && this.isViewVisible){
            if (animator !== undefined && animator !== null){
                if (previousChildViewController !== null){
                    previousChildViewController.beginDisappearanceWithAnimator(animator);
                    previousChildViewController.removeFromParentViewController();
                }
                if (childViewController !== null){
                    this.addChildViewController(childViewController);
                    childViewController.beginAppearanceWithAnimator(animator);
                }
            }else{                
                if (previousChildViewController !== null){
                    previousChildViewController.scheduleDisappearance();
                    previousChildViewController.removeFromParentViewController();
                }
                if (childViewController !== null){
                    this.addChildViewController(childViewController);
                    childViewController.scheduleAppearance();
                }
            }
        }else{
            if (previousChildViewController !== null){
                if (previousChildViewController._lifecycleState === UIViewController.LifecycleState.appearing){
                    previousChildViewController.scheduleDisappearance();
                }
                previousChildViewController.removeFromParentViewController();
            }
            if (childViewController !== null){
                if (this._lifecycleState === UIViewController.LifecycleState.appearing){
                    childViewController.beginAppearance(this._appearanceTransitionAnimated);
                }
                this.addChildViewController(childViewController);
            }
        }
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

    window: JSReadOnlyProperty(),
    scene: JSReadOnlyProperty(),
    application: JSReadOnlyProperty(),

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

    getApplication: function(){
        var window = this.getWindow();
        if (window !== null){
            return window.application;
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

UIViewController.LifecycleState = {
    disappeared: 0,
    appearing: 1,
    appeared: 2,
    disappearing: 3
};

})();