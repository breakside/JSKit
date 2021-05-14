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
    },

    delegate: null,
    _isVisible: false,

    // MARK: - View Lifecycle

    viewDidLoad: function(){
        UINavigationController.$super.viewDidLoad.call(this);
        this.view.addSubview(this._navigationBar);
        this.view.insertSubviewBelowSibling(this.topViewController.view, this._navigationBar);
        this.view.setNeedsLayout();
    },

    viewWillAppear: function(animated){
        UINavigationController.$super.viewWillAppear.call(this, animated);
        this._isVisible = true;
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
        this._isVisible = false;
        this.topViewController.viewDidDisappear(animated);
    },

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

    // MARK: - View Controllers

    viewControllers: JSDynamicProperty('_viewControllers', null),

    setViewControllers: function(viewControllers){
        var newTopViewController = viewControllers[viewControllers.length - 1];
        var newView = newTopViewController.view;
        if (newTopViewController !== this.topViewController){
            this.topViewController.viewWillDisappear();
            newTopViewController.viewWillAppear();
            if (this.delegate && this.delegate.navigationControllerWillShowViewController){
                this.delegate.navigationControllerWillShowViewController(this, newTopViewController);
            }
        }
        this.topViewController.view.removeFromSuperview();
        var i, l;
        for (i = 0, l = this._viewControllers.length; i < l; ++i){
            this._viewControllers[i].removeFromParentViewController();
        }
        this._viewControllers = JSCopy(viewControllers);
        var items = [];
        for (i = 0, l = this._viewControllers.length; i < l; ++i){
            this.addChildViewController(this._viewControllers[i]);
            items.push(this._viewControllers[i].navigationItem);
        }
        this._navigationBar.items = items;
        this.view.insertSubviewBelowSibling(this.topViewController.view, this._navigationBar);
        this.view.setNeedsLayout();
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
        return UIViewPropertyAnimator.initWithDuration(0.3, UIAnimation.Timing.easeInOut);
    },

    createPopAnimator: function(){
        return UIViewPropertyAnimator.initWithDuration(0.3, UIAnimation.Timing.easeInOut);
    },

    pushViewController: function(viewController, animated){
        if (this.popAnimator !== null || this.pushAnimator !== null){
            return;
        }
        if (!this._isVisible){
            animated = false;
        }
        if (animated){
            this.pushAnimator = this.createPushAnimator();
        }
        var fromViewController = this.topViewController;
        var view = viewController.view;
        if (this._isVisible){
            fromViewController.viewWillDisappear(animated);
            viewController.viewWillAppear(animated);
        }
        if (this.delegate && this.delegate.navigationControllerWillShowViewController){
            this.delegate.navigationControllerWillShowViewController(this, viewController);
        }
        this.addChildViewController(viewController);
        this._viewControllers.push(viewController);
        this._navigationBar.pushItem(viewController.navigationItem, animated);
        this.view.insertSubviewBelowSibling(view, this._navigationBar);
        if (!animated){
            if (this._isVisible){
                fromViewController.enqueueDidDisappear();
                viewController.enqueueDidAppear(animated);
            }
            if (this.delegate && this.delegate.navigationControllerDidShowViewController){
                this.delegate.navigationControllerDidShowViewController(this, viewController);
            }
            fromViewController.view.removeFromSuperview();
            this.view.setNeedsLayout();
        }else{
            var navController = this;
            this.layoutChildView(viewController.view);
            viewController.view.transform = JSAffineTransform.Translated(viewController.view.bounds.size.width, 0);
            viewController.view.shadowColor = JSColor.initWithWhite(0, 0.4);
            viewController.view.shadowRadius = 20;
            this.pushAnimator.addAnimations(function(){
                viewController.view.transform = JSAffineTransform.Identity;
                fromViewController.view.transform = JSAffineTransform.Translated(-fromViewController.view.bounds.size.width / 2, 0);
            });
            this.pushAnimator.addCompletion(function(){
                navController.pushAnimator = null;
                fromViewController.view.removeFromSuperview();
                fromViewController.viewDidDisappear(true);
                fromViewController.view.transform = JSAffineTransform.Identity;
                viewController.shadowColor = null;
                viewController.viewDidAppear(true);
                if (navController.delegate && navController.delegate.navigationControllerDidShowViewController){
                    navController.delegate.navigationControllerDidShowViewController(navController, viewController);
                }
            });
            JSRunLoop.main.schedule(function(){
                this.pushAnimator.start();
            }, this);
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
        if (!this._isVisible){
            animated = false;
        }
        if (animated){
            this.popAnimator = this.createPopAnimator();
        }
        var fromViewController = this.topViewController;
        var view = viewController.view;
        if (this._isVisible){
            fromViewController.viewWillDisappear(animated);
            viewController.viewWillAppear(animated);
        }
        if (this.delegate && this.delegate.navigationControllerWillShowViewController){
            this.delegate.navigationControllerWillShowViewController(this, viewController);
        }
        this._viewControllers.splice(index + 1, this._viewControllers.length - index);
        this._navigationBar.popToItem(viewController.navigationItem, animated);
        this.view.insertSubviewBelowSibling(view, fromViewController.view);
        if (!animated){
            if (this._isVisible){
                fromViewController.enqueueDidDisappear();
                viewController.enqueueDidAppear();
            }
            if (this.delegate && this.delegate.navigationControllerDidShowViewController){
                this.delegate.navigationControllerDidShowViewController(this, viewController);
            }
            fromViewController.view.removeFromSuperview();
            this.view.setNeedsLayout();
        }else{
            var navController = this;
            this.layoutChildView(viewController.view);
            viewController.view.transform = JSAffineTransform.Translated(-viewController.view.bounds.size.width / 2, 0);
            fromViewController.view.shadowColor = JSColor.initWithWhite(0, 0.4);
            fromViewController.view.shadowRadius = 20;
            this.popAnimator.addAnimations(function(){
                viewController.view.transform = JSAffineTransform.Identity;
                fromViewController.view.transform = JSAffineTransform.Translated(fromViewController.view.bounds.size.width, 0);
            });
            this.popAnimator.addCompletion(function(){
                fromViewController.view.removeFromSuperview();
                navController.popAnimator = null;
                fromViewController.removeFromParentViewController();
                fromViewController.shadowColor = null;
                viewController.viewDidAppear(animated);
                fromViewController.viewDidDisappear(animated);
                fromViewController.view.transform = JSAffineTransform.Identity;
                if (navController.delegate && navController.delegate.navigationControllerDidShowViewController){
                    navController.delegate.navigationControllerDidShowViewController(navController, viewController);
                }
            });
            JSRunLoop.main.schedule(function(){
                this.popAnimator.start();
            }, this);
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

    // MARK: Layout

    automaticallyAdjustsInsets: true,
    
    viewDidLayoutSubviews: function(){
        var barHeight = this._navigationBar.intrinsicSize.height;
        var size = this.view.bounds.size;
        var contentView = this.topViewController.view;
        this._navigationBar.frame = JSRect(0, 0, size.width, barHeight);
        this.layoutChildView(contentView);
    },

    layoutChildView: function(view){
        var y;
        var size = this.view.bounds.size;
        var barFrame = this._navigationBar.frame;
        if (this._navigationBar.coversContent){
            y = barFrame.origin.y;
            if (this.automaticallyAdjustsInsets && view.isKindOfClass(UIScrollView)){
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