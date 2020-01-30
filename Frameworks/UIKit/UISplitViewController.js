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

    _mainHidden: false,

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

    _isVisible: false,

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
        this._isVisible = true;
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
        this._isVisible = false;
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
        var callAppearanceMethods = this._isVisible && this.leadingViewOpen;
        var disappearingViewController = null;
        if (this._leadingViewController !== null){
            if (callAppearanceMethods){
                this._leadingViewController.viewWillDisappear(false);
                disappearingViewController = this._leadingViewController;
            }
            this._leadingViewController.removeFromParentViewController();
        }
        this._leadingViewController = leadingViewController;
        if (this._leadingViewController){
            if (callAppearanceMethods){
                this._leadingViewController.viewWillAppear(false);
            }
            this.addChildViewController(this._leadingViewController);
        }
        if (this._view !== null){
            var view = null;
            if (this._leadingViewController !== null){
                view = this._leadingViewController.view;
            }
            this._view.leadingView = view;
        }
        if (callAppearanceMethods){
            if (disappearingViewController !== null){
                disappearingViewController.viewDidDisappear(false);
            }
            if (this._leadingViewController !== null){
                this._leadingViewController.viewDidAppear(false);
            }
        }
    },

    setTrailingViewController: function(trailingViewController){
        var callAppearanceMethods = this._isVisible && this.trailingViewOpen;
        var disappearingViewController = null;
        if (this._trailingViewController !== null){
            if (callAppearanceMethods){
                this._trailingViewController.viewWillDisappear(false);
                disappearingViewController = this._trailingViewController;
            }
            this._trailingViewController.removeFromParentViewController();
        }
        this._trailingViewController = trailingViewController;
        if (this._trailingViewController){
            if (callAppearanceMethods){
                this._trailingViewController.viewWillAppear(false);
            }
            this.addChildViewController(this._trailingViewController);
        }
        if (this._view !== null){
            var view = null;
            if (this._trailingViewController !== null){
                view = this._trailingViewController.view;
            }
            this._view.trailingView = view;
        }
        if (callAppearanceMethods){
            if (disappearingViewController !== null){
                disappearingViewController.viewDidDisappear(false);
            }
            if (this._trailingViewController !== null){
                this._trailingViewController.viewDidAppear(false);
            }
        }
    },

    setMainViewController: function(mainViewController){
        var callAppearanceMethods = this._isVisible;
        var disappearingViewController = null;
        if (this._mainViewController !== null && this._mainViewController.parentViewController === this){
            if (callAppearanceMethods){
                this._mainViewController.viewWillDisappear(false);
                disappearingViewController = this._mainViewController;
            }
            this._mainViewController.removeFromParentViewController();
        }
        this._mainViewController = mainViewController;
        if (this.view.mainHidden){
            if (this._mainViewController){
                this._leadingViewController.show(this._mainViewController, this);
            }
        }else{
            if (this._mainViewController){
                if (callAppearanceMethods){
                    this._mainViewController.viewWillAppear(false);
                }
                this.addChildViewController(this._mainViewController);
            }
            if (this._view !== null){
                var view = null;
                if (this._mainViewController !== null){
                    view = this._mainViewController.view;
                }
                this._view.mainView = view;
            }
            if (callAppearanceMethods){
                if (disappearingViewController !== null){
                    disappearingViewController.viewDidDisappear(false);
                }
                if (this._mainViewController !== null){
                    this._mainViewController.viewDidAppear(false);
                }
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