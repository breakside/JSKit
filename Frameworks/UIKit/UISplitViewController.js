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
        if (this._mainViewController !== null && this._view.mainView === null){
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
        if (this._leadingViewController !== null && this.leadingViewOpen){
            this._leadingViewController.viewWillAppear(animated);
        }
        if (this._mainViewController !== null){
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
        if (this._mainViewController !== null){
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
        if (this._mainViewController !== null){
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
        if (this._mainViewController !== null){
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
            return;
        }
        this.replaceChildViewController(this._mainViewController, mainViewController);
        this._mainViewController = mainViewController;
        if (this.isViewLoaded){
            this.view.mainView = mainViewController !== null ? mainViewController.view : null;
        }
    },

    _setMainViewControllerCollapsed: function(mainViewController){
        if (this._mainViewController !== null){
            if (this._leadingViewController.isKindOfClass(UINavigationController)){
                if (this._mainViewController === this._leadingViewController.topViewController){
                    this._leadingViewController.popViewController(false);
                }
            }else{
                if (this._mainViewController === this._leadingViewController.presentedViewController){
                    this._leadingViewController.dismiss(false);
                }
            }
            this._leadingViewController.view.layoutIfNeeded();
        }
        this._mainViewController = mainViewController;
        if (this._mainViewController !== null){
            this._leadingViewController.show(this._mainViewController, this);
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
        var willAppear = !this.splitView.leadingViewOpen;
        if (willAppear){
            this._leadingViewController.viewWillAppear(animated);
        }else{
            this._leadingViewController.viewWillDisappear(animated);
        }
        if (!animated){
            this.splitView.leadingViewOpen = !this.splitView.leadingViewOpen;
            if (willAppear){
                this._leadingViewController.enqueueDidAppear();
            }else{
                this._leadingViewController.enqueueDidDisappear();
            }
        }else{
            // make sure to apply any pending layouts before doing the animation,
            // otherwise the pending layouts will get caught up in the animation
            this.splitView.layoutIfNeeded();
            var animator = UIViewPropertyAnimator.initWithDuration(0.15 * percentRemaining);
            var self = this;
            this.splitView.leadingViewOpen = !this.splitView.leadingViewOpen;
            animator.addAnimations(function(){
                self.splitView.layoutIfNeeded();
            });
            animator.addCompletion(function(){
                self._leadingAnimator = null;
                if (willAppear){
                    self._leadingViewController.viewDidAppear(animated);
                }else{
                    self._leadingViewController.viewDidDisappear(animated);
                }
            });
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
        var willAppear = !this.splitView.leadingViewOpen;
        if (willAppear){
            this._trailingViewController.viewWillAppear(animated);
        }else{
            this._trailingViewController.viewWillDisappear(animated);
        }
        if (!animated){
            this.splitView.trailingViewOpen = !this.splitView.trailingViewOpen;
            if (willAppear){
                this._trailingViewController.enqueueDidAppear();
            }else{
                this._trailingViewController.enqueueDidDisappear();
            }
        }else{
            // make sure to apply any pending layouts before doing the animation,
            // otherwise the pending layouts will get caught up in the animation
            this.splitView.layoutIfNeeded();
            var animator = UIViewPropertyAnimator.initWithDuration(0.15 * percentRemaining);
            var self = this;
            this.splitView.trailingViewOpen = !this.splitView.trailingViewOpen;
            animator.addAnimations(function(){
                self.splitView.layoutIfNeeded();
            });
            animator.addCompletion(function(){
                self._trailingAnimator = null;
                if (willAppear){
                    self._trailingViewController.viewDidAppear(animated);
                }else{
                    self._trailingViewController.viewDidDisappear(animated);
                }
            });
            this._trailingAnimator = animator;
            animator.start();
        }
    },

    splitViewDidToggleView: function(splitView, toggledView){
    },

    isChangingTraits: false,

    traitCollectionDidChange: function(previous){
        UISplitViewController.$super.traitCollectionDidChange.call(this);
        if (this.view.canHideMain && previous.horizontalSizeClass != this.traitCollection.horizontalSizeClass){
            if (previous.horizontalSizeClass === UIUserInterface.SizeClass.compact){
                if (this._leadingViewController.isKindOfClass(UINavigationController)){
                    if (this._mainViewController === this._leadingViewController.topViewController){
                        this._leadingViewController.popViewController(false);
                    }
                }else{
                    if (this._leadingViewController.presentedViewController === this._mainViewController){
                        this._leadingViewController.dismiss(false);
                    }
                }
            }
            this.isChangingTraits = true;
            var vc = this._mainViewController;
            this.mainViewController = null;
            this.mainViewController = vc;
            this.isChangingTraits = false;
        }
    },

    show: function(viewController, sender){
        this.mainViewController = viewController;
    }

});