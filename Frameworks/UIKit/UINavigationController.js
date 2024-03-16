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
// #import "UINavigationBar.js"
// #import "UIScrollView.js"
// #import "UIViewPropertyAnimator.js"
// #import "JSColor+UIKit.js"
/* global UISplitViewController */
'use strict';

JSProtocol("UINavigationControllerDelegate", JSProtocol, {

    navigationControllerWillShowViewController: function(navigationController, viewController){},
    navigationControllerDidShowViewController: function(navigationController, viewController){}

});

JSClass("UINavigationController", UIViewController, {

    initWithRootViewController: function(rootViewController, barStyler){
        UINavigationController.$super.init.call(this);
        this.addChildViewController(rootViewController);
        this._viewControllers = [rootViewController];
        this.navigationBar = UINavigationBar.initWithRootItem(rootViewController.navigationItem, barStyler);
        this.navigationItem.hidesNavigationBar = true;
    },

    initWithSpec: function(spec){
        UINavigationController.$super.initWithSpec.call(this, spec);
        this._viewControllers = [];
        if (spec.containsKey("root")){
            var root = spec.valueForKey("root", UIViewController);
            this._viewControllers.push(root);
            this.addChildViewController(root);
        }
        if (spec.containsKey("navigationBar")){
            this.navigationBar = spec.valueForKey("navigationBar", UINavigationBar);
            this.navigationBar.items = [this._viewControllers[0].navigationItem];
        }else{
            this.navigationBar = UINavigationBar.initWithRootItem(this._viewControllers[0].navigationItem);
        }
        if (spec.containsKey("delegate")){
            this.delegate = spec.valueForKey("delegate");
        }
        this.navigationItem.hidesNavigationBar = true;
    },

    // --------------------------------------------------------------------
    // MARK: - Delegate

    delegate: null,

    scheduleDelegateShowViewController: function(viewController){
        if (this.delegate && this.delegate.navigationControllerWillShowViewController){
            this.delegate.navigationControllerWillShowViewController(this, viewController);
        }
        this.schedule(function(){
            if (this.topViewController === viewController){
                if (this.delegate && this.delegate.navigationControllerDidShowViewController){
                    this.delegate.navigationControllerDidShowViewController(this, viewController);
                }
            }
        });
    },

    // --------------------------------------------------------------------
    // MARK: - View Lifecycle

    viewDidLoad: function(){
        UINavigationController.$super.viewDidLoad.call(this);
        this.view.addSubview(this._navigationBar);
        var topView = this.topViewController.view;
        if (this.topViewController.navigationItem.hidesNavigationBar){
            this.view.addSubview(topView);
        }else{
            this.view.insertSubviewBelowSibling(topView, this._navigationBar);
        }
        this.view.setNeedsLayout();
    },

    viewWillAppear: function(animated){
        UINavigationController.$super.viewWillAppear.call(this, animated);
        this.topViewController.viewWillAppear(animated);
    },

    viewDidAppear: function(animated){
        UINavigationController.$super.viewDidAppear.call(this, animated);
        this.topViewController.viewDidAppear(animated);
    },

    viewWillDisappear: function(animated){
        UINavigationController.$super.viewWillDisappear.call(this, animated);
        this.topViewController.viewWillDisappear(animated);
    },

    viewDidDisappear: function(animated){
        UINavigationController.$super.viewDidDisappear.call(this, animated);
        this.topViewController.viewDidDisappear(animated);
    },

    // --------------------------------------------------------------------
    // MARK: - Navigation Bar

    navigationBar: JSDynamicProperty('_navigationBar', null),

    setNavigationBar: function(navigationBar){
        if (this._navigationBar !== null){
            this._navigationBar._navigationController = null;
        }
        this._navigationBar = navigationBar;
        this._navigationBar._navigationController = this;
        var items = [];
        for (var i = 0, l = this._viewControllers.length; i < l; ++i){
            items.push(this._viewControllers[i].navigationItem);
        }
        this._navigationBar.items = items;
    },

    // --------------------------------------------------------------------
    // MARK: - View Controllers

    viewControllers: JSDynamicProperty('_viewControllers', null),

    setViewControllers: function(viewControllers){
        var oldTopViewController = this.topViewController;
        var newTopViewController = viewControllers[viewControllers.length - 1];
        var i, l;
        var viewController;
        for (i = 0, l = this._viewControllers.length; i < l; ++i){
            viewController = this._viewControllers[i];
            if (viewControllers.indexOf(viewController) < 0){
                viewController.removeFromParentViewController();
            }
        }
        this._viewControllers = JSCopy(viewControllers);
        var items = [];
        for (i = 0, l = this._viewControllers.length; i < l; ++i){
            viewController = this._viewControllers[i];
            this.addChildViewController(viewController);
            items.push(viewController.navigationItem);
        }
        this._navigationBar.items = items;
        if (this.isViewLoaded){
            if (this.isViewVisible){
                if (newTopViewController !== oldTopViewController){
                    oldTopViewController.scheduleDisappearance();
                    newTopViewController.scheduleAppearance();
                    this.scheduleDelegateShowViewController(newTopViewController);
                }
            }
            oldTopViewController.view.removeFromSuperview();
            if (newTopViewController.navigationItem.hidesNavigationBar){
                this.view.addSubview(newTopViewController.view);
            }else{
                this.view.insertSubviewBelowSibling(newTopViewController.view, this._navigationBar);
            }
            this.navigationBar.hidden = newTopViewController.navigationItem.hidesNavigationBar;
            this.view.setNeedsLayout();
        }
    },

    topViewController: JSReadOnlyProperty(),
    backViewController: JSReadOnlyProperty(),

    getTopViewController: function(){
        return this._viewControllers[this._viewControllers.length - 1];
    },

    getBackViewController: function(){
        if (this._viewControllers.length > 1){
            return this._viewControllers[this._viewControllers.length - 2];
        }
        return null;
    },

    popAnimator: null,
    pushAnimator: null,

    createPushAnimator: function(){
        return UIViewPropertyAnimator.initWithDuration(UIAnimation.Duration.transition, UIAnimation.Timing.easeInOut);
    },

    createPopAnimator: function(){
        return UIViewPropertyAnimator.initWithDuration(UIAnimation.Duration.transition, UIAnimation.Timing.easeInOut);
    },

    pushViewController: function(viewController, animated){
        if (this.popAnimator !== null || this.pushAnimator !== null){
            return;
        }
        var fromViewController = this.topViewController;
        var fromItem = fromViewController.navigationItem;
        var fromView = fromViewController.view;
        var view = viewController.view;
        var item = viewController.navigationItem;
        var navigationBar = this._navigationBar;
        this.addChildViewController(viewController);
        this._viewControllers.push(viewController);
        if (this.isViewLoaded){
            if (this.isViewVisible){
                var isHidingNavigationBar = !fromItem.hidesNavigationBar && item.hidesNavigationBar;
                var isShowingNavigationBar = fromItem.hidesNavigationBar && !item.hidesNavigationBar;
                if (animated){
                    this.pushAnimator = this.createPushAnimator();
                    fromViewController.beginDisappearanceWithAnimator(this.pushAnimator);
                    viewController.beginAppearanceWithAnimator(this.pushAnimator);
                    if (this.delegate && this.delegate.navigationControllerWillShowViewController){
                        this.delegate.navigationControllerWillShowViewController(this, viewController);
                    }
                    if (isShowingNavigationBar){
                        this.view.addSubview(navigationBar);
                        this.view.insertSubviewBelowSibling(view, navigationBar);
                        navigationBar.pushItem(item, false);
                    }else if (isHidingNavigationBar){
                        this.view.addSubview(view);
                    }else{
                        this.view.insertSubviewAboveSibling(view, fromView);
                        navigationBar.pushItem(item, animated);
                    }
                    this.layoutChildViewController(viewController);
                    view.transform = JSAffineTransform.Translated(view.bounds.size.width, 0);
                    view.shadowColor = JSColor.windowShadow;
                    view.shadowRadius = 20;
                    if (isShowingNavigationBar){
                        navigationBar.transform = view.transform;
                        navigationBar.hidden = false;
                    }
                    this.pushAnimator.addAnimations(function(){
                        view.transform = JSAffineTransform.Identity;
                        fromView.transform = JSAffineTransform.Translated(-fromView.bounds.size.width / 2, 0);
                        if (isShowingNavigationBar){
                            navigationBar.transform = JSAffineTransform.Identity;
                        }else if (isHidingNavigationBar){
                            navigationBar.transform = fromView.transform;
                        }
                    });
                    this.pushAnimator.addCompletion(function(){
                        this.pushAnimator = null;
                        navigationBar.hidden = item.hidesNavigationBar;
                        if (isHidingNavigationBar){
                            navigationBar.transform = JSAffineTransform.Identity;
                            navigationBar.pushItem(item, false);
                        }
                        fromView.removeFromSuperview();
                        fromView.transform = JSAffineTransform.Identity;
                        view.shadowColor = null;
                        if (this.delegate && this.delegate.navigationControllerDidShowViewController){
                            this.delegate.navigationControllerDidShowViewController(this, viewController);
                        }
                    }, this);
                    this.pushAnimator.start();
                }else{
                    fromViewController.scheduleDisappearance();
                    viewController.scheduleAppearance();
                    this.scheduleDelegateShowViewController(viewController);
                    if (isShowingNavigationBar){
                        this.view.addSubview(navigationBar);
                        this.view.insertSubviewBelowSibling(view, navigationBar);
                        navigationBar.pushItem(item, false);
                    }else if (isHidingNavigationBar){
                        this.view.addSubview(view);
                    }else{
                        this.view.insertSubviewAboveSibling(view, fromView);
                        navigationBar.pushItem(item, animated);
                    }
                    fromView.removeFromSuperview();
                    this.view.setNeedsLayout();
                    navigationBar.hidden = item.hidesNavigationBar;
                }
            }else{
                fromView.removeFromSuperview();
                if (item.hidesNavigationBar){
                    this.view.addSubview(view);
                }else{
                    this.view.insertSubviewBelowSibling(view, navigationBar);
                }
                navigationBar.pushItem(item, false);
                navigationBar.hidden = item.hidesNavigationBar;
                this.view.setNeedsLayout();
            }
        }else{
            navigationBar.hidden = item.hidesNavigationBar;
            navigationBar.pushItem(item, false);
        }
    },

    popViewController: function(animated){
        this.popToViewController(this.backViewController, animated);
    },

    popToRootViewController: function(animated){
        this.popToViewController(this._viewControllers[0], animated);
    },

    popToViewController: function(viewController, animated){
        if (this.popAnimator !== null || this.pushAnimator !== null){
            return;
        }
        if (viewController === null){
            return;
        }
        var index = this._indexOfViewController(viewController);
        if (index < 0){
            return;
        }
        if (index === this._viewControllers.length - 1){
            return;
        }
        var fromViewController = this.topViewController;
        var fromView = fromViewController.view;
        var fromItem = fromViewController.navigationItem;
        var view = viewController.view;
        var item = viewController.navigationItem;
        var navigationBar = this._navigationBar;
        var i, l;
        for (i = this._viewControllers.length - 1; i > index; --i){
            this._viewControllers[i].removeFromParentViewController();
            this._viewControllers.pop();
        }
        if (this.isViewLoaded){
            if (this.isViewVisible){
                var isHidingNavigationBar = !fromItem.hidesNavigationBar && item.hidesNavigationBar;
                var isShowingNavigationBar = fromItem.hidesNavigationBar && !item.hidesNavigationBar;
                if (animated){
                    this.popAnimator = this.createPopAnimator();
                    fromViewController.beginDisappearanceWithAnimator(this.popAnimator);
                    viewController.beginAppearanceWithAnimator(this.popAnimator);
                    if (this.delegate && this.delegate.navigationControllerWillShowViewController){
                        this.delegate.navigationControllerWillShowViewController(this, viewController);
                    }
                    if (isShowingNavigationBar){
                        this.view.insertSubviewBelowSibling(view, navigationBar);
                        navigationBar.popToItem(item, false);
                    }else if (isHidingNavigationBar){
                        this.view.insertSubviewBelowSibling(view, fromView);
                    }else{
                        this.view.insertSubviewBelowSibling(view, fromView);
                        navigationBar.popToItem(item, animated);   
                    }
                    this.layoutChildViewController(viewController);
                    view.transform = JSAffineTransform.Translated(-view.bounds.size.width / 2, 0);
                    fromView.shadowColor = JSColor.windowShadow;
                    fromView.shadowRadius = 20;
                    if (isShowingNavigationBar){
                        navigationBar.transform = view.transform;
                        navigationBar.hidden = false;
                    }
                    this.popAnimator.addAnimations(function(){
                        view.transform = JSAffineTransform.Identity;
                        fromView.transform = JSAffineTransform.Translated(fromView.bounds.size.width, 0);
                        if (isShowingNavigationBar){
                            navigationBar.transform = JSAffineTransform.Identity;
                        }else if (isHidingNavigationBar){
                            navigationBar.transform = fromView.transform;
                        }
                    });
                    this.popAnimator.addCompletion(function(){
                        this.popAnimator = null;
                        navigationBar.hidden = item.hidesNavigationBar;
                        if (isHidingNavigationBar){
                            navigationBar.transform = JSAffineTransform.Identity;
                            navigationBar.popToItem(item, false);
                        }
                        fromView.removeFromSuperview();
                        fromView.shadowColor = null;
                        fromView.transform = JSAffineTransform.Identity;
                        if (this.delegate && this.delegate.navigationControllerDidShowViewController){
                            this.delegate.navigationControllerDidShowViewController(this, viewController);
                        }
                    }, this);
                    this.popAnimator.start();
                }else{
                    fromViewController.scheduleDisappearance();
                    viewController.scheduleAppearance();
                    this.scheduleDelegateShowViewController(viewController);
                    if (isShowingNavigationBar){
                        this.view.insertSubviewBelowSibling(view, navigationBar);
                        navigationBar.popToItem(item, false);
                    }else if (isHidingNavigationBar){
                        this.view.insertSubviewBelowSibling(view, fromView);
                    }else{
                        this.view.insertSubviewBelowSibling(view, fromView);
                        navigationBar.popToItem(item, animated);   
                    }
                    fromView.removeFromSuperview();
                    this.view.setNeedsLayout();
                    navigationBar.hidden = item.hidesNavigationBar;
                }
            }else{
                fromView.removeFromSuperview();
                if (item.hidesNavigationBar){
                    this.view.addSubview(view);
                }else{
                    this.view.insertSubviewBelowSibling(view, navigationBar);
                }
                navigationBar.popToItem(item, false);
                navigationBar.hidden = item.hidesNavigationBar;
                this.view.setNeedsLayout();
            }
        }else{
            navigationBar.hidden = item.hidesNavigationBar;
            navigationBar.popToItem(item, false);
        }
    },

    _indexOfViewController: function(viewController){
        for (var i = this._viewControllers.length - 1; i >= 0; --i){
            if (this._viewControllers[i] === viewController){
                return i;
            }
        }
        return -1;
    },

    show: function(viewController, sender){
        var animated = true;
        if (sender && sender.isKindOfClass && sender.isKindOfClass(UISplitViewController) && sender.isChangingTraits){
            animated = false;
        }
        this.pushViewController(viewController, animated);
    },

    // --------------------------------------------------------------------
    // MARK: Layout

    automaticallyAdjustsInsets: true,
    
    viewDidLayoutSubviews: function(){
        var barHeight = this._navigationBar.intrinsicSize.height;
        var size = this.view.bounds.size;
        this._navigationBar.frame = JSRect(0, 0, size.width, barHeight);
        this.layoutChildViewController(this.topViewController);
    },

    layoutChildViewController: function(viewController){
        var y;
        var view = viewController.view;
        var size = this.view.bounds.size;
        var barFrame = this._navigationBar.frame;
        var barHidden = viewController.navigationItem.hidesNavigationBar;
        if (barHidden || this._navigationBar.coversContent){
            y = barFrame.origin.y;
            if (!barHidden && this.automaticallyAdjustsInsets && view.isKindOfClass(UIScrollView)){
                var insets = JSInsets(view.contentInsets);
                insets.top = this._navigationBar.coveredContentTopInset;
                view.contentInsets = insets;
            }
        }else{
            y = barFrame.origin.y + barFrame.size.height;
        }
        view.frame = JSRect(0, y, size.width, size.height - y);
    }

});