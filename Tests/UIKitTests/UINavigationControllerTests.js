// Copyright 2022 Breakside Inc.
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

// #import UIKit
// #import TestKit
// #import UIKitTesting
"use strict";

JSClass("UINavigationControllerTests", TKTestSuite, {

    app: null,
    window: null,

    setup: function(){
        this.app = UIMockApplication.initEmpty();
        this.app.setScreenSize(JSSize(200, 400));
        var expectation = TKExpectation.init();
        expectation.call(this.app.run, this.app, function(error){
            TKAssertNull(error);
            this.window = UIRootWindow.initWithApplication(this.app);
            this.window.makeKeyAndOrderFront();
            this.app.updateDisplay();
        }, this);
        this.wait(expectation, 1.0);
    },

    teardown: function(){
        var expectation = TKExpectation.init();
        expectation.call(this.app.stop, this.app, function(){
            this.app = null;
        }, this);
        this.wait(expectation, 1.0);
    },

    testInitWithRootViewController: function(){
        var viewController = UIViewController.init();
        var navigationController = UINavigationController.initWithRootViewController(viewController);
        TKAssertNotNull(navigationController.navigationBar);
        TKAssertExactEquals(navigationController.viewControllers.length, 1);
        TKAssertExactEquals(navigationController.viewControllers[0], viewController);
        TKAssertExactEquals(navigationController.topViewController, viewController);
        TKAssertExactEquals(viewController.parentViewController, navigationController);
    },

    testInitWithSpec: function(){
        var spec = JSSpec.initWithDictionary({
            root: {class: "UIViewController"}
        });
        var navigationController = UINavigationController.initWithSpec(spec);
        TKAssertExactEquals(navigationController.isViewLoaded, false);
        TKAssertNotNull(navigationController.navigationBar);
        TKAssertExactEquals(navigationController.viewControllers.length, 1);
        TKAssertInstance(navigationController.viewControllers[0], UIViewController);
        TKAssertExactEquals(navigationController.topViewController, navigationController.viewControllers[0]);
        TKAssertExactEquals(navigationController.viewControllers[0].parentViewController, navigationController);
    },

    testLoadView: function(){
        var viewController = UIViewController.init();
        var navigationController = UINavigationController.initWithRootViewController(viewController);
        var view = navigationController.view;
        TKAssertExactEquals(viewController.isViewLoaded, true);
        TKAssertExactEquals(view.subviews.length, 2);
        TKAssertExactEquals(view.subviews[0], viewController.view);
        TKAssertExactEquals(view.subviews[1], navigationController.navigationBar);
    },

    testViewLifecycle: function(){
        var viewController = UINavigationControllerTestsViewController.init();
        var navigationController = UINavigationController.initWithRootViewController(viewController);
        TKAssertEquals(viewController.viewWillAppearCount, 0);
        TKAssertEquals(viewController.viewDidAppearCount, 0);
        TKAssertEquals(viewController.viewWillDisappearCount, 0);
        TKAssertEquals(viewController.viewDidDisappearCount, 0);
        TKAssertExactEquals(viewController.isViewVisible, false);
        navigationController.viewWillAppear(false);
        TKAssertEquals(viewController.viewWillAppearCount, 1);
        TKAssertEquals(viewController.viewDidAppearCount, 0);
        TKAssertEquals(viewController.viewWillDisappearCount, 0);
        TKAssertEquals(viewController.viewDidDisappearCount, 0);
        TKAssertExactEquals(viewController.isViewVisible, false);
        navigationController.viewDidAppear(false);
        TKAssertEquals(viewController.viewWillAppearCount, 1);
        TKAssertEquals(viewController.viewDidAppearCount, 1);
        TKAssertEquals(viewController.viewWillDisappearCount, 0);
        TKAssertEquals(viewController.viewDidDisappearCount, 0);
        TKAssertExactEquals(viewController.isViewVisible, true);
        navigationController.viewWillDisappear(false);
        TKAssertEquals(viewController.viewWillAppearCount, 1);
        TKAssertEquals(viewController.viewDidAppearCount, 1);
        TKAssertEquals(viewController.viewWillDisappearCount, 1);
        TKAssertEquals(viewController.viewDidDisappearCount, 0);
        TKAssertExactEquals(viewController.isViewVisible, true);
        navigationController.viewDidDisappear(false);
        TKAssertEquals(viewController.viewWillAppearCount, 1);
        TKAssertEquals(viewController.viewDidAppearCount, 1);
        TKAssertEquals(viewController.viewWillDisappearCount, 1);
        TKAssertEquals(viewController.viewDidDisappearCount, 1);
        TKAssertExactEquals(viewController.isViewVisible, false);
    },

    testPushPopNotAnimated: function(){
        var viewController1 = UINavigationControllerTestsViewController.init();
        var viewController2 = UINavigationControllerTestsViewController.init();
        var navigationController = UINavigationController.initWithRootViewController(viewController1);
        this.window.contentViewController = navigationController;
        TKAssertEquals(viewController1.viewWillAppearCount, 1);
        TKAssertEquals(viewController1.viewDidAppearCount, 0);
        TKAssertEquals(viewController1.viewWillDisappearCount, 0);
        TKAssertEquals(viewController1.viewDidDisappearCount, 0);
        TKAssertExactEquals(viewController1.isViewVisible, false);
        this.app.updateDisplay();
        TKAssertEquals(viewController1.viewWillAppearCount, 1);
        TKAssertEquals(viewController1.viewDidAppearCount, 1);
        TKAssertEquals(viewController1.viewWillDisappearCount, 0);
        TKAssertEquals(viewController1.viewDidDisappearCount, 0);
        TKAssertExactEquals(viewController1.isViewVisible, true);

        navigationController.pushViewController(viewController2, false);
        TKAssertEquals(viewController1.viewWillAppearCount, 1);
        TKAssertEquals(viewController1.viewDidAppearCount, 1);
        TKAssertEquals(viewController1.viewWillDisappearCount, 1);
        TKAssertEquals(viewController1.viewDidDisappearCount, 0);
        TKAssertEquals(viewController2.viewWillAppearCount, 1);
        TKAssertEquals(viewController2.viewDidAppearCount, 0);
        TKAssertEquals(viewController2.viewWillDisappearCount, 0);
        TKAssertEquals(viewController2.viewDidDisappearCount, 0);
        TKAssertExactEquals(viewController1.isViewVisible, true);
        TKAssertExactEquals(viewController2.isViewVisible, false);
        TKAssertEquals(viewController1.parentViewController, navigationController);
        TKAssertEquals(viewController2.parentViewController, navigationController);
        this.app.updateDisplay();
        TKAssertEquals(viewController1.viewWillAppearCount, 1);
        TKAssertEquals(viewController1.viewDidAppearCount, 1);
        TKAssertEquals(viewController1.viewWillDisappearCount, 1);
        TKAssertEquals(viewController1.viewDidDisappearCount, 1);
        TKAssertEquals(viewController2.viewWillAppearCount, 1);
        TKAssertEquals(viewController2.viewDidAppearCount, 1);
        TKAssertEquals(viewController2.viewWillDisappearCount, 0);
        TKAssertEquals(viewController2.viewDidDisappearCount, 0);
        TKAssertExactEquals(viewController1.isViewVisible, false);
        TKAssertExactEquals(viewController2.isViewVisible, true);
        TKAssertEquals(viewController1.parentViewController, navigationController);
        TKAssertEquals(viewController2.parentViewController, navigationController);

        navigationController.popViewController(false);
        TKAssertEquals(viewController1.viewWillAppearCount, 2);
        TKAssertEquals(viewController1.viewDidAppearCount, 1);
        TKAssertEquals(viewController1.viewWillDisappearCount, 1);
        TKAssertEquals(viewController1.viewDidDisappearCount, 1);
        TKAssertEquals(viewController2.viewWillAppearCount, 1);
        TKAssertEquals(viewController2.viewDidAppearCount, 1);
        TKAssertEquals(viewController2.viewWillDisappearCount, 1);
        TKAssertEquals(viewController2.viewDidDisappearCount, 0);
        TKAssertExactEquals(viewController1.isViewVisible, false);
        TKAssertExactEquals(viewController2.isViewVisible, true);
        TKAssertEquals(viewController1.parentViewController, navigationController);
        this.app.updateDisplay();
        TKAssertEquals(viewController1.viewWillAppearCount, 2);
        TKAssertEquals(viewController1.viewDidAppearCount, 2);
        TKAssertEquals(viewController1.viewWillDisappearCount, 1);
        TKAssertEquals(viewController1.viewDidDisappearCount, 1);
        TKAssertEquals(viewController2.viewWillAppearCount, 1);
        TKAssertEquals(viewController2.viewDidAppearCount, 1);
        TKAssertEquals(viewController2.viewWillDisappearCount, 1);
        TKAssertEquals(viewController2.viewDidDisappearCount, 1);
        TKAssertExactEquals(viewController1.isViewVisible, true);
        TKAssertExactEquals(viewController2.isViewVisible, false);
        TKAssertEquals(viewController1.parentViewController, navigationController);
        TKAssertEquals(viewController2.parentViewController, null);
    },

    testPushPopAnimated: function(){
        var viewController1 = UINavigationControllerTestsViewController.init();
        var viewController2 = UINavigationControllerTestsViewController.init();
        var navigationController = UINavigationController.initWithRootViewController(viewController1);
        this.window.contentViewController = navigationController;
        TKAssertEquals(viewController1.viewWillAppearCount, 1);
        TKAssertEquals(viewController1.viewDidAppearCount, 0);
        TKAssertEquals(viewController1.viewWillDisappearCount, 0);
        TKAssertEquals(viewController1.viewDidDisappearCount, 0);
        TKAssertExactEquals(viewController1.isViewVisible, false);
        this.app.updateDisplay();
        TKAssertEquals(viewController1.viewWillAppearCount, 1);
        TKAssertEquals(viewController1.viewDidAppearCount, 1);
        TKAssertEquals(viewController1.viewWillDisappearCount, 0);
        TKAssertEquals(viewController1.viewDidDisappearCount, 0);
        TKAssertExactEquals(viewController1.isViewVisible, true);
        TKAssertFloatEquals(navigationController.view.bounds.size.width, 200);
        TKAssertFloatEquals(navigationController.view.bounds.size.height, 400);
        TKAssertFloatEquals(viewController1.view.bounds.size.width, 200);
        TKAssertFloatEquals(viewController1.view.position.x, 100);
        TKAssertEquals(viewController1.parentViewController, navigationController);

        navigationController.pushViewController(viewController2, true);
        TKAssertEquals(viewController1.viewWillAppearCount, 1);
        TKAssertEquals(viewController1.viewDidAppearCount, 1);
        TKAssertEquals(viewController1.viewWillDisappearCount, 1);
        TKAssertEquals(viewController1.viewDidDisappearCount, 0);
        TKAssertEquals(viewController2.viewWillAppearCount, 1);
        TKAssertEquals(viewController2.viewDidAppearCount, 0);
        TKAssertEquals(viewController2.viewWillDisappearCount, 0);
        TKAssertEquals(viewController2.viewDidDisappearCount, 0);
        TKAssertExactEquals(viewController1.isViewVisible, true);
        TKAssertExactEquals(viewController2.isViewVisible, false);
        this.app.updateDisplay();
        this.app.updateDisplay(UIAnimation.Duration.transition / 2);
        TKAssertEquals(viewController1.viewWillAppearCount, 1);
        TKAssertEquals(viewController1.viewDidAppearCount, 1);
        TKAssertEquals(viewController1.viewWillDisappearCount, 1);
        TKAssertEquals(viewController1.viewDidDisappearCount, 0);
        TKAssertEquals(viewController2.viewWillAppearCount, 1);
        TKAssertEquals(viewController2.viewDidAppearCount, 0);
        TKAssertEquals(viewController2.viewWillDisappearCount, 0);
        TKAssertEquals(viewController2.viewDidDisappearCount, 0);
        TKAssertExactEquals(viewController1.isViewVisible, true);
        TKAssertExactEquals(viewController2.isViewVisible, false);
        TKAssertExactEquals(viewController1.view.superview, navigationController.view);
        TKAssertExactEquals(viewController2.view.superview, navigationController.view);
        TKAssertFloatEquals(viewController1.view.layer.presentation.transform.tx, -50);
        TKAssertFloatEquals(viewController2.view.layer.presentation.transform.tx, 100);
        TKAssertEquals(viewController1.parentViewController, navigationController);
        TKAssertEquals(viewController2.parentViewController, navigationController);
        this.app.updateDisplay(UIAnimation.Duration.transition / 2 + 0.1);
        TKAssertEquals(viewController1.viewWillAppearCount, 1);
        TKAssertEquals(viewController1.viewDidAppearCount, 1);
        TKAssertEquals(viewController1.viewWillDisappearCount, 1);
        TKAssertEquals(viewController1.viewDidDisappearCount, 1);
        TKAssertEquals(viewController2.viewWillAppearCount, 1);
        TKAssertEquals(viewController2.viewDidAppearCount, 1);
        TKAssertEquals(viewController2.viewWillDisappearCount, 0);
        TKAssertEquals(viewController2.viewDidDisappearCount, 0);
        TKAssertExactEquals(viewController1.isViewVisible, false);
        TKAssertExactEquals(viewController2.isViewVisible, true);
        TKAssertExactEquals(viewController1.view.superview, null);
        TKAssertExactEquals(viewController2.view.superview, navigationController.view);
        TKAssertEquals(viewController1.parentViewController, navigationController);
        TKAssertEquals(viewController2.parentViewController, navigationController);

        navigationController.popViewController(true);
        TKAssertEquals(viewController1.viewWillAppearCount, 2);
        TKAssertEquals(viewController1.viewDidAppearCount, 1);
        TKAssertEquals(viewController1.viewWillDisappearCount, 1);
        TKAssertEquals(viewController1.viewDidDisappearCount, 1);
        TKAssertEquals(viewController2.viewWillAppearCount, 1);
        TKAssertEquals(viewController2.viewDidAppearCount, 1);
        TKAssertEquals(viewController2.viewWillDisappearCount, 1);
        TKAssertEquals(viewController2.viewDidDisappearCount, 0);
        TKAssertExactEquals(viewController1.isViewVisible, false);
        TKAssertExactEquals(viewController2.isViewVisible, true);
        this.app.updateDisplay();
        this.app.updateDisplay(UIAnimation.Duration.transition / 2);
        TKAssertEquals(viewController1.viewWillAppearCount, 2);
        TKAssertEquals(viewController1.viewDidAppearCount, 1);
        TKAssertEquals(viewController1.viewWillDisappearCount, 1);
        TKAssertEquals(viewController1.viewDidDisappearCount, 1);
        TKAssertEquals(viewController2.viewWillAppearCount, 1);
        TKAssertEquals(viewController2.viewDidAppearCount, 1);
        TKAssertEquals(viewController2.viewWillDisappearCount, 1);
        TKAssertEquals(viewController2.viewDidDisappearCount, 0);
        TKAssertExactEquals(viewController1.isViewVisible, false);
        TKAssertExactEquals(viewController2.isViewVisible, true);
        TKAssertExactEquals(viewController1.view.superview, navigationController.view);
        TKAssertExactEquals(viewController2.view.superview, navigationController.view);
        TKAssertFloatEquals(viewController1.view.layer.presentation.transform.tx, -50);
        TKAssertFloatEquals(viewController2.view.layer.presentation.transform.tx, 100);
        TKAssertEquals(viewController1.parentViewController, navigationController);
        TKAssertEquals(viewController2.parentViewController, null);
        this.app.updateDisplay(UIAnimation.Duration.transition / 2 + 0.1);
        TKAssertEquals(viewController1.viewWillAppearCount, 2);
        TKAssertEquals(viewController1.viewDidAppearCount, 2);
        TKAssertEquals(viewController1.viewWillDisappearCount, 1);
        TKAssertEquals(viewController1.viewDidDisappearCount, 1);
        TKAssertEquals(viewController2.viewWillAppearCount, 1);
        TKAssertEquals(viewController2.viewDidAppearCount, 1);
        TKAssertEquals(viewController2.viewWillDisappearCount, 1);
        TKAssertEquals(viewController2.viewDidDisappearCount, 1);
        TKAssertExactEquals(viewController1.isViewVisible, true);
        TKAssertExactEquals(viewController2.isViewVisible, false);
        TKAssertExactEquals(viewController1.view.superview, navigationController.view);
        TKAssertExactEquals(viewController2.view.superview, null);
        TKAssertEquals(viewController1.parentViewController, navigationController);
        TKAssertEquals(viewController2.parentViewController, null);
    },

    testPushPopHidesNavigationBar: function(){
        var viewController1 = UIViewController.init();
        var viewController2 = UIViewController.init();
        viewController2.navigationItem.hidesNavigationBar = true;
        var styler = UINavigationBarDefaultStyler.init();
        styler.coversContent = false;
        var navigationController = UINavigationController.initWithRootViewController(viewController1, styler);
        var navigationBar = navigationController.navigationBar;
        this.window.contentViewController = navigationController;
        this.app.updateDisplay();
        TKAssertExactEquals(navigationBar.hidden, false);
        TKAssertFloatEquals(viewController1.view.bounds.size.height, 400 - navigationBar.bounds.size.height);

        navigationController.pushViewController(viewController2, false);
        this.app.updateDisplay();
        TKAssertExactEquals(navigationBar.hidden, true);
        TKAssertFloatEquals(viewController2.view.bounds.size.height, 400);

        navigationController.popViewController(false);
        this.app.updateDisplay();
        TKAssertExactEquals(navigationBar.hidden, false);
        TKAssertFloatEquals(viewController1.view.bounds.size.height, 400 - navigationBar.bounds.size.height);
    },

    testPushPopAnimatedHidesNavigationBar: function(){
        var viewController1 = UIViewController.init();
        var viewController2 = UIViewController.init();
        viewController2.navigationItem.hidesNavigationBar = true;
        var styler = UINavigationBarDefaultStyler.init();
        styler.coversContent = false;
        var navigationController = UINavigationController.initWithRootViewController(viewController1, styler);
        var navigationBar = navigationController.navigationBar;
        this.window.contentViewController = navigationController;
        this.app.updateDisplay();
        TKAssertExactEquals(navigationBar.hidden, false);
        TKAssertFloatEquals(viewController1.view.bounds.size.height, 400 - navigationBar.bounds.size.height);
        TKAssertFloatEquals(viewController1.view.bounds.size.width, 200);
        TKAssertFloatEquals(viewController1.view.position.x, 100);

        navigationController.pushViewController(viewController2, true);
        this.app.updateDisplay();
        this.app.updateDisplay(UIAnimation.Duration.transition / 2);
        TKAssertExactEquals(navigationBar.hidden, false);
        TKAssertGreaterThan(navigationBar.subviewIndex, viewController1.view.subviewIndex);
        TKAssertGreaterThan(viewController2.view.subviewIndex, navigationBar.subviewIndex);
        TKAssertFloatEquals(navigationBar.layer.presentation.transform.tx, -50);
        TKAssertFloatEquals(viewController1.view.bounds.size.height, 400 - navigationBar.bounds.size.height);
        TKAssertFloatEquals(viewController2.view.bounds.size.height, 400);
        TKAssertFloatEquals(viewController1.view.layer.presentation.transform.tx, -50);
        TKAssertFloatEquals(viewController2.view.layer.presentation.transform.tx, 100);
        this.app.updateDisplay(UIAnimation.Duration.transition / 2 + 0.1);
        TKAssertExactEquals(navigationBar.hidden, true);
        TKAssertFloatEquals(viewController2.view.bounds.size.height, 400);

        navigationController.popViewController(true);
        this.app.updateDisplay();
        this.app.updateDisplay(UIAnimation.Duration.transition / 2);
        TKAssertExactEquals(navigationBar.hidden, false);
        TKAssertGreaterThan(viewController2.view.subviewIndex, viewController1.subviewIndex);
        TKAssertGreaterThan(navigationBar.subviewIndex, viewController2.subviewIndex);
        TKAssertFloatEquals(navigationBar.layer.presentation.transform.tx, -50);
        TKAssertFloatEquals(viewController1.view.bounds.size.height, 400 - navigationBar.bounds.size.height);
        TKAssertFloatEquals(viewController2.view.bounds.size.height, 400);
        TKAssertFloatEquals(viewController1.view.layer.presentation.transform.tx, -50);
        TKAssertFloatEquals(viewController2.view.layer.presentation.transform.tx, 100);
        this.app.updateDisplay(UIAnimation.Duration.transition / 2 + 0.1);
        TKAssertExactEquals(navigationBar.hidden, false);
        TKAssertFloatEquals(viewController1.view.bounds.size.height, 400 - navigationBar.bounds.size.height);
    },

    testSetViewControllers: function(){
        var viewController1 = UINavigationControllerTestsViewController.init();
        var viewController2 = UINavigationControllerTestsViewController.init();
        var viewController3 = UINavigationControllerTestsViewController.init();
        var navigationController = UINavigationController.initWithRootViewController(viewController1);
        this.window.contentViewController = navigationController;
        this.app.updateDisplay();
        TKAssertEquals(viewController1.viewWillAppearCount, 1);
        TKAssertEquals(viewController1.viewDidAppearCount, 1);
        TKAssertEquals(viewController1.viewWillDisappearCount, 0);
        TKAssertEquals(viewController1.viewDidDisappearCount, 0);
        TKAssertEquals(viewController2.viewWillAppearCount, 0);
        TKAssertEquals(viewController2.viewDidAppearCount, 0);
        TKAssertEquals(viewController2.viewWillDisappearCount, 0);
        TKAssertEquals(viewController2.viewDidDisappearCount, 0);
        TKAssertEquals(viewController3.viewWillAppearCount, 0);
        TKAssertEquals(viewController3.viewDidAppearCount, 0);
        TKAssertEquals(viewController3.viewWillDisappearCount, 0);
        TKAssertEquals(viewController3.viewDidDisappearCount, 0);

        navigationController.viewControllers = [viewController2, viewController3];
        TKAssertExactEquals(navigationController.viewControllers.length, 2);
        TKAssertExactEquals(navigationController.viewControllers[0], viewController2);
        TKAssertExactEquals(navigationController.viewControllers[1], viewController3);
        TKAssertExactEquals(navigationController.topViewController, viewController3);
        TKAssertExactEquals(viewController1.parentViewController, null);
        TKAssertExactEquals(viewController2.parentViewController, navigationController);
        TKAssertExactEquals(viewController3.parentViewController, navigationController);
        TKAssertEquals(viewController1.viewWillAppearCount, 1);
        TKAssertEquals(viewController1.viewDidAppearCount, 1);
        TKAssertEquals(viewController1.viewWillDisappearCount, 1);
        TKAssertEquals(viewController1.viewDidDisappearCount, 0);
        TKAssertEquals(viewController2.viewWillAppearCount, 0);
        TKAssertEquals(viewController2.viewDidAppearCount, 0);
        TKAssertEquals(viewController2.viewWillDisappearCount, 0);
        TKAssertEquals(viewController2.viewDidDisappearCount, 0);
        TKAssertEquals(viewController3.viewWillAppearCount, 1);
        TKAssertEquals(viewController3.viewDidAppearCount, 0);
        TKAssertEquals(viewController3.viewWillDisappearCount, 0);
        TKAssertEquals(viewController3.viewDidDisappearCount, 0);
        this.app.updateDisplay();
        TKAssertEquals(viewController1.viewWillAppearCount, 1);
        TKAssertEquals(viewController1.viewDidAppearCount, 1);
        TKAssertEquals(viewController1.viewWillDisappearCount, 1);
        TKAssertEquals(viewController1.viewDidDisappearCount, 1);
        TKAssertEquals(viewController2.viewWillAppearCount, 0);
        TKAssertEquals(viewController2.viewDidAppearCount, 0);
        TKAssertEquals(viewController2.viewWillDisappearCount, 0);
        TKAssertEquals(viewController2.viewDidDisappearCount, 0);
        TKAssertEquals(viewController3.viewWillAppearCount, 1);
        TKAssertEquals(viewController3.viewDidAppearCount, 1);
        TKAssertEquals(viewController3.viewWillDisappearCount, 0);
        TKAssertEquals(viewController3.viewDidDisappearCount, 0);
    }
});

JSClass("UINavigationControllerTestsViewController", UIViewController, {

    viewWillAppearCount: 0,
    viewDidAppearCount: 0,
    viewWillDisappearCount: 0,
    viewDidDisappearCount: 0,

    viewWillAppear: function(animated){
        UINavigationControllerTestsViewController.$super.viewWillAppear.call(this, animated);
        ++this.viewWillAppearCount;
    },

    viewDidAppear: function(animated){
        UINavigationControllerTestsViewController.$super.viewDidAppear.call(this, animated);
        ++this.viewDidAppearCount;
    },

    viewWillDisappear: function(animated){
        UINavigationControllerTestsViewController.$super.viewWillDisappear.call(this, animated);
        ++this.viewWillDisappearCount;
    },

    viewDidDisappear: function(animated){
        UINavigationControllerTestsViewController.$super.viewDidDisappear.call(this, animated);
        ++this.viewDidDisappearCount;
    }

});