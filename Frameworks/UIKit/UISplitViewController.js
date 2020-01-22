// #import "UIViewController.js"
// #import "UISplitView.js"
// #import "UIViewPropertyAnimator.js"
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

    setLeadingViewController: function(leadingViewController){
        if (this._leadingViewController !== null){
            this._leadingViewController.removeFromParentViewController();
        }
        this._leadingViewController = leadingViewController;
        if (this._leadingViewController){
            this.addChildViewController(this._leadingViewController);
        }
        if (this._view !== null){
            var view = null;
            if (this._leadingViewController !== null){
                view = this._leadingViewController.view;
            }
            this._view.leadingView = view;
        }
    },

    setTrailingViewController: function(trailingViewController){
        if (this._trailingViewController !== null){
            this._trailingViewController.removeFromParentViewController();
        }
        this._trailingViewController = trailingViewController;
        if (this._trailingViewController){
            this.addChildViewController(this._trailingViewController);
        }
        if (this._view !== null){
            var view = null;
            if (this._trailingViewController !== null){
                view = this._trailingViewController.view;
            }
            this._view.trailingView = view;
        }
    },

    setMainViewController: function(mainViewController){
        if (this._mainViewController !== null){
            this._mainViewController.removeFromParentViewController();
        }
        this._mainViewController = mainViewController;
        if (this._mainViewController){
            this.addChildViewController(this._mainViewController);
        }
        if (this._view !== null){
            var view = null;
            if (this._mainViewController !== null){
                view = this._mainViewController.view;
            }
            this._view.mainView = view;
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
            // TODO: view did appear/disappear, but only after the next display frame
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
        if (!animated){
            this.splitView.trailingViewOpen = !this.splitView.trailingViewOpen;
            // TODO: viewWillAppear/viewDidAppear
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
            });
            this._trailingAnimator = animator;
            animator.start();
        }
    },

    splitViewDidToggleView: function(splitView, toggledView){
    },

});