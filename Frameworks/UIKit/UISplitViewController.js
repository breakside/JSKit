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
// #import "UISplitView.js"
// #import "UIViewPropertyAnimator.js"
// #import "UINavigationController.js"
'use strict';

JSClass("UISplitViewController", UIViewController, {

    leadingViewController: JSDynamicProperty('_leadingViewController', null),
    mainViewController: JSDynamicProperty('_mainViewController', null),
    trailingViewController: JSDynamicProperty('_trailingViewController', null),

    leadingViewOpen: JSReadOnlyProperty(null, null, 'isLeadingViewOpen'),
    trailingViewOpen: JSReadOnlyProperty(null, null, 'isTrailingViewOpen'),

    splitView: JSReadOnlyProperty(),
    _defaultViewClass: UISplitView,

    initWithSpec: function(spec){
        if (spec.containsKey('leadingViewController')){
            this._leadingViewController = spec.valueForKey("leadingViewController");
        }
        if (spec.containsKey('trailingViewController')){
            this._trailingViewController = spec.valueForKey("trailingViewController");
        }
        if (spec.containsKey('mainViewController')){
            this._mainViewController = spec.valueForKey("mainViewController");
        }
        UISplitViewController.$super.initWithSpec.call(this, spec);
        if (this._leadingViewController !== null){
            this.addChildViewController(this._leadingViewController);
        }
        if (this._trailingViewController !== null){
            this.addChildViewController(this._trailingViewController);
        }
        if (this._mainViewController !== null){
            this.addChildViewController(this._mainViewController);
        }
    },

    viewDidLoad: function(){
        UISplitViewController.$super.viewDidLoad.call(this);
        this._view.delegate = this;
        if (this._mainViewController !== null && this._view.mainView === null && !this._view.mainHidden){
            this._view.mainView = this._mainViewController.view;
        }
        if (this._leadingViewController !== null && this._view.leadingView === null){
            this._view.leadingView = this._leadingViewController.view;
        }
        if (this._trailingViewController !== null && this._view.trailingView === null){
            this._view.trailingView = this._trailingViewController.view;
        }
    },

    viewWillAppear: function(animated){
        UISplitViewController.$super.viewWillAppear.call(this, animated);
        if (this.view.mainHidden){
            this._moveMainViewControllerToLeading();
        }
        if (this._leadingViewController !== null && this.leadingViewOpen){
            this._leadingViewController.viewWillAppear(animated);
        }
        if (this._mainViewController !== null && !this._view.mainHidden){
            this._mainViewController.viewWillAppear(animated);
        }
        if (this._trailingViewController !== null && this.trailingViewOpen){
            this._trailingViewController.viewWillAppear(animated);
        }
    },

    viewDidAppear: function(animated){
        UISplitViewController.$super.viewDidAppear.call(this, animated);
        if (this._leadingViewController !== null && this.leadingViewOpen){
            this._leadingViewController.viewDidAppear(animated);
        }
        if (this._mainViewController !== null && !this._view.mainHidden){
            this._mainViewController.viewDidAppear(animated);
        }
        if (this._trailingViewController !== null && this.trailingViewOpen){
            this._trailingViewController.viewDidAppear(animated);
        }
    },

    viewWillDisappear: function(animated){
        UISplitViewController.$super.viewWillDisappear.call(this, animated);
        if (this._leadingViewController !== null && this.leadingViewOpen){
            this._leadingViewController.viewWillDisappear(animated);
        }
        if (this._mainViewController !== null && !this._view.mainHidden){
            this._mainViewController.viewWillDisappear(animated);
        }
        if (this._trailingViewController !== null && this.trailingViewOpen){
            this._trailingViewController.viewWillDisappear(animated);
        }
    },

    viewDidDisappear: function(animated){
        UISplitViewController.$super.viewDidDisappear.call(this, animated);
        if (this._leadingViewController !== null && this.leadingViewOpen){
            this._leadingViewController.viewDidDisappear(animated);
        }
        if (this._mainViewController !== null && !this._view.mainHidden){
            this._mainViewController.viewDidDisappear(animated);
        }
        if (this._trailingViewController !== null && this.trailingViewOpen){
            this._trailingViewController.viewDidDisappear(animated);
        }
    },

    setLeadingViewController: function(leadingViewController){
        this.replaceChildViewController(this._leadingViewController, leadingViewController);
        this._leadingViewController = leadingViewController;
        if (this.isViewLoaded){
            this.view.leadingView  = leadingViewController !== null ? leadingViewController.view : null;
        }
    },

    setTrailingViewController: function(trailingViewController){
        this.replaceChildViewController(this._trailingViewController, trailingViewController);
        this._trailingViewController = trailingViewController;
        if (this.isViewLoaded){
            this.view.trailingView = trailingViewController !== null ? trailingViewController.view : null;
        }
    },

    setMainViewController: function(mainViewController){
        if (this.isViewLoaded && this.view.mainHidden){
            this._setMainViewControllerCollapsed(mainViewController);
        }else{
            this._setMainViewControllerFull(mainViewController);
        }
    },

    _mainNavigationRootViewController: null,

    _setMainViewControllerFull: function(mainViewController){
        this.replaceChildViewController(this._mainViewController, mainViewController);
        this._mainViewController = mainViewController;
        if (this.isViewLoaded){
            this.view.mainView = mainViewController !== null ? mainViewController.view : null;
        }
    },

    _setMainViewControllerCollapsed: function(mainViewController){
        if (this._leadingViewController.isKindOfClass(UINavigationController)){
            this._setMainViewControllerOnLeadingNavigationController(mainViewController, this._leadingViewController);
        }else{
            this._setMainViewControllerOnLeadingViewController(mainViewController, this._leadingViewController);
        }
    },

    _setMainViewControllerOnLeadingNavigationController: function(mainViewController, navigationController){
        // 1. Determine if we need to pop off any view controllers to remove the current mainViewController
        var i;
        var viewControllers = null;
        if (this._mainViewController !== null){
            if (this._mainViewController instanceof UINavigationController){
                i = navigationController.viewControllers.indexOf(this._mainNavigationRootViewController);
            }else{
                i = navigationController.viewControllers.indexOf(this._mainViewController);
            }
            if (i > 0){
                if (mainViewController === this._mainViewController){
                    // Bail if we're being asked to show the same view controller that's already shown
                    // NOTE: this check only comes after finding that the view controller
                    // is indeed part of the presentation tree becuase without a notification
                    // from the navigation controller when views are popped by the user,
                    // we may be in a situation where this._mainViewController is set, but
                    // is not part of the navigation stack
                    return;
                }
                viewControllers = navigationController.viewControllers.slice(0, i);
            }
        }
        // 2. Update the nav controller
        if (mainViewController !== null){
            if (mainViewController instanceof UINavigationController){
                // When the new main view controller is a nav controller itself,
                // move it's view controller to the leading nav controller
                var mainNavigationController = mainViewController;
                this._mainNavigationRootViewController = mainNavigationController.viewControllers[0];
                if (viewControllers === null && mainNavigationController.viewControllers.length === 1){
                    // In a typical case, the main nav controller has just one view controller,
                    // which we'll move to the leading nav controller with a push animation
                    mainNavigationController.setViewControllers([UIViewController.init()]);
                    navigationController.pushViewController(this._mainNavigationRootViewController, true);
                }else{
                    // If the main nav controller has more than one view controller, or we're replacing some
                    // there's not a meaningful animation we can show, so we'll just
                    // update the leading nav without animation
                    if (viewControllers === null){
                        viewControllers = JSCopy(navigationController.viewControllers);
                    }
                    var l;
                    for (i = 0, l = mainNavigationController.viewControllers.length; i < l; ++i){
                        viewControllers.push(mainNavigationController.viewControllers[i]);
                    }
                    mainNavigationController.viewControllers = [UIViewController.init()];
                    navigationController.viewControllers = viewControllers;
                }
            }else{
                // When the new main view controller is NOT a nav controller,
                // we'll just push it unless we have other updates to do
                if (viewControllers === null){
                    navigationController.pushViewController(mainViewController, true);
                }else{
                    viewControllers.push(mainViewController);
                    navigationController.viewControllers = viewControllers;
                }
            }
        }else{
            if (viewControllers !== null){
                navigationController.popToViewController(viewControllers[viewControllers.length - 1], true);
            }
        }
        this._mainViewController = mainViewController;
    },

    _setMainViewControllerOnLeadingViewController: function(mainViewController, viewController){
        // Bail if we're being asked to show the same view controller that's already shown
        if (mainViewController === this._mainViewController){
            return;
        }
        // 1. Dismiss the current mainViewController
        if (this._mainViewController !== null){
            if (this._mainViewController === viewController.presentedViewController){
                viewController.dismiss();
            }
        }
        // 2. Present the new mainViewController
        if (mainViewController !== null){
            viewController.presentViewController(mainViewController);
        }
        this._mainViewController = mainViewController;
    },

    _moveMainViewControllerToLeading: function(){
        if (this._mainViewController === null){
            return;
        }
        if (this._leadingViewController instanceof UINavigationController){
            this._moveMainViewControllerToLeadingNavigationController(this._leadingViewController);
        }else{
            this._moveMainViewControllerToLeadingViewController(this._leadingViewController);
        }
    },

    _moveMainViewControllerToLeadingNavigationController: function(navigationController){
        var viewControllers = JSCopy(navigationController.viewControllers);
        if (this._mainViewController instanceof UINavigationController){
            var mainNavigationController = this._mainViewController;
            this._mainNavigationRootViewController = mainNavigationController.viewControllers[0];
            var i, l;
            for (i = 0, l = mainNavigationController.viewControllers.length; i < l; ++i){
                viewControllers.push(mainNavigationController.viewControllers[i]);
            }
            mainNavigationController.viewControllers = [UIViewController.init()];
            if (this.isViewVisible){
                mainNavigationController.scheduleDisappearance();
            }
        }else{
            this.view.mainView = null;
            viewControllers.push(this._mainViewController);
        }
        navigationController.viewControllers = viewControllers;
    },

    _moveMainViewControllerToLeadingViewController: function(viewController){
        this.view.mainView = null;
        viewController.presentViewController(this._mainViewController, false);
    },

    _moveMainViewControllerFromLeading: function(){
        if (this._mainViewController === null){
            return;
        }
        var initialMainViewController = this._mainViewController;
        if (this._leadingViewController instanceof UINavigationController){
            this._moveMainViewControllerFromLeadingNavigationController(this._leadingViewController);
        }else{
            this._moveMainViewControllerFromLeadingViewController(this._leadingViewController);
        }
    },

    _moveMainViewControllerFromLeadingNavigationController: function(navigationController){
        if (this._mainViewController instanceof UINavigationController){
            var mainNavigationController = this._mainViewController;
            var i = navigationController.viewControllers.indexOf(this._mainNavigationRootViewController);
            if (i > 0){
                if (mainNavigationController.view.superview === null){
                    this.view.mainView = mainNavigationController.view;
                }
                mainNavigationController.scheduleAppearance();
                var viewControllers = navigationController.viewControllers.slice(i);
                navigationController.popToViewController(navigationController.viewControllers[i - 1], false);
                viewControllers[viewControllers.length - 1].scheduleAppearance();
                mainNavigationController.viewControllers = viewControllers;
            }else{
                this._mainViewController = null;
                if (this.isViewLoaded){
                    this.view.mainView = null;
                }
            }
            this._mainNavigationRootViewController = null;
        }else{
            navigationController.popToViewController(this._mainViewController, false);
            if (navigationController.topViewController === this._mainViewController){
                navigationController.popViewController(false);
                if (this.isViewLoaded){
                    this._mainViewController.scheduleAppearance();
                    this.view.mainView = this._mainViewController.view;
                }
            }else{
                this._mainViewController = null;
                if (this.isViewLoaded){
                    this.view.mainView = null;
                }
            }
        }
    },

    _moveMainViewControllerFromLeadingViewController: function(viewController){
        if (viewController.presentedViewController === this._mainViewController){
            viewController.dismiss(false);
            if (this.isViewLoaded){
                this._mainViewController.scheduleAppearance();
                this.view.mainView = this._mainViewController.view;
            }
        }else{
            this._mainViewController = null;
            if (this.isViewLoaded){
                this.view.mainView = null;
            }
        }
    },

    getSplitView: function(){
        return this._view;
    },

    loadView: function(){
        var leadingView = null;
        var trailingView = null;
        var mainView = null;
        if (this._leadingViewController !== null){
            leadingView = this._leadingViewController.view;
        }
        if (this._trailingViewController){
            trailingView = this._trailingViewController.view;
        }
        if (this._mainViewController){
            mainView = this._mainViewController.view;
        }
        this._view = UISplitView.initWithMainView(mainView, leadingView, trailingView);
    },

    hideLeadingView: function(animated){
        if (this.splitView.leadingViewOpen){
            this.toggleLeadingView(animated);
        }
    },

    showLeadingView: function(animated){
        if (!this.splitView.leadingViewOpen){
            this.toggleLeadingView(animated);
        }
    },

    _leadingAnimator: null,

    toggleLeadingView: function(animated){
        var percentRemaining = 1;
        if (this._leadingAnimator !== null){
            this._leadingAnimator.stop();
            percentRemaining = this._leadingAnimator.percentComplete;
            this._leadingAnimator = null;
        }
        var opening = !this.splitView.leadingViewOpen;
        this._leadingViewController.beginAppearanceTransition(opening, animated);
        if (!animated){
            this.splitView.leadingViewOpen = opening;
            this._leadingViewController.endAppearanceTransition();
        }else{
            // make sure to apply any pending layouts before doing the animation,
            // otherwise the pending layouts will get caught up in the animation
            this.splitView.layoutIfNeeded();
            var animator = UIViewPropertyAnimator.initWithDuration(0.15 * percentRemaining);
            this.splitView.leadingViewOpen = opening;
            animator.addAnimations(function(){
                this.splitView.layoutIfNeeded();
            }, this);
            animator.addCompletion(function(){
                this._leadingAnimator = null;
                this._leadingViewController.endAppearanceTransition();
            }, this);
            this._leadingAnimator = animator;
            animator.start();
        }
    },

    isLeadingViewOpen: function(){
        return this.splitView.leadingViewOpen;
    },

    isTrailingViewOpen: function(){
        return this.splitView.trailingViewOpen;
    },

    hideTrailingView: function(animated){
        if (this.splitView.trailingViewOpen){
            this.toggleTrailingView(animated);
        }
    },

    showTrailingView: function(animated){
        if (!this.splitView.trailingViewOpen){
            this.toggleTrailingView(animated);
        }
    },

    _trailingAnimator: null,

    toggleTrailingView: function(animated){
        var percentRemaining = 1;
        if (this._trailingAnimator !== null){
            this._trailingAnimator.stop();
            percentRemaining = this._trailingAnimator.percentComplete;
            this._trailingAnimator = null;
        }
        var opening = !this.splitView.trailingViewOpen;
        this._trailingViewController.beginAppearanceTransition(opening, animated);
        if (!animated){
            this.splitView.trailingViewOpen = !this.splitView.trailingViewOpen;
            this._trailingViewController.endAppearanceTransition();
        }else{
            // make sure to apply any pending layouts before doing the animation,
            // otherwise the pending layouts will get caught up in the animation
            this.splitView.layoutIfNeeded();
            var animator = UIViewPropertyAnimator.initWithDuration(0.15 * percentRemaining);
            this.splitView.trailingViewOpen = !this.splitView.trailingViewOpen;
            animator.addAnimations(function(){
                this.splitView.layoutIfNeeded();
            }, this);
            animator.addCompletion(function(){
                this._trailingAnimator = null;
                this._trailingViewController.endAppearanceTransition();
            }, this);
            this._trailingAnimator = animator;
            animator.start();
        }
    },

    splitViewDidToggleView: function(splitView, toggledView){
    },

    traitCollectionDidChange: function(previous){
        UISplitViewController.$super.traitCollectionDidChange.call(this);
        if (this.view.canHideMain && previous.horizontalSizeClass != this.traitCollection.horizontalSizeClass){
            if (previous.horizontalSizeClass === UIUserInterface.SizeClass.compact){
                this._moveMainViewControllerFromLeading();
            }else{
                this._moveMainViewControllerToLeading();

            }
        }
    },

    show: function(viewController, sender){
        this.mainViewController = viewController;
    }

});