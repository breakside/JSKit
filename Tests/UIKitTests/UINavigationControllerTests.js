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
        var counts = {
            viewWillAppear: 0,
            viewDidAppear: 0,
            viewWillDisappear: 0,
            viewDidDisappear: 0
        };
        var contentClass = UIViewController.$extend({
            viewWillAppear: function(animated){
                contentClass.$super.viewWillAppear.call(this, animated);
                ++counts.viewWillAppear;
            },
            viewDidAppear: function(animated){
                contentClass.$super.viewDidAppear.call(this, animated);
                ++counts.viewDidAppear;
            },
            viewWillDisappear: function(animated){
                contentClass.$super.viewWillDisappear.call(this, animated);
                ++counts.viewWillDisappear;
            },
            viewDidDisappear: function(animated){
                contentClass.$super.viewDidDisappear.call(this, animated);
                ++counts.viewDidDisappear;
            }
        }, "UINavigationControllerTestsClass1");
        var viewController = contentClass.init();
        var navigationController = UINavigationController.initWithRootViewController(viewController);
        TKAssertEquals(counts.viewWillAppear, 0);
        TKAssertEquals(counts.viewDidAppear, 0);
        TKAssertEquals(counts.viewWillDisappear, 0);
        TKAssertEquals(counts.viewDidDisappear, 0);
        TKAssertExactEquals(viewController.isViewVisible, false);
        navigationController.viewWillAppear(false);
        TKAssertEquals(counts.viewWillAppear, 1);
        TKAssertEquals(counts.viewDidAppear, 0);
        TKAssertEquals(counts.viewWillDisappear, 0);
        TKAssertEquals(counts.viewDidDisappear, 0);
        TKAssertExactEquals(viewController.isViewVisible, false);
        navigationController.viewDidAppear(false);
        TKAssertEquals(counts.viewWillAppear, 1);
        TKAssertEquals(counts.viewDidAppear, 1);
        TKAssertEquals(counts.viewWillDisappear, 0);
        TKAssertEquals(counts.viewDidDisappear, 0);
        TKAssertExactEquals(viewController.isViewVisible, true);
        navigationController.viewWillDisappear(false);
        TKAssertEquals(counts.viewWillAppear, 1);
        TKAssertEquals(counts.viewDidAppear, 1);
        TKAssertEquals(counts.viewWillDisappear, 1);
        TKAssertEquals(counts.viewDidDisappear, 0);
        TKAssertExactEquals(viewController.isViewVisible, true);
        navigationController.viewDidDisappear(false);
        TKAssertEquals(counts.viewWillAppear, 1);
        TKAssertEquals(counts.viewDidAppear, 1);
        TKAssertEquals(counts.viewWillDisappear, 1);
        TKAssertEquals(counts.viewDidDisappear, 1);
        TKAssertExactEquals(viewController.isViewVisible, false);
    },

    testPushPopNotAnimated: function(){
        var counts = {
            viewWillAppear1: 0,
            viewDidAppear1: 0,
            viewWillDisappear1: 0,
            viewDidDisappear1: 0,
            viewWillAppear2: 0,
            viewDidAppear2: 0,
            viewWillDisappear2: 0,
            viewDidDisappear2: 0
        };
        var contentClass1 = UIViewController.$extend({
            viewWillAppear: function(animated){
                contentClass1.$super.viewWillAppear.call(this, animated);
                ++counts.viewWillAppear1;
            },
            viewDidAppear: function(animated){
                contentClass1.$super.viewDidAppear.call(this, animated);
                ++counts.viewDidAppear1;
            },
            viewWillDisappear: function(animated){
                contentClass1.$super.viewWillDisappear.call(this, animated);
                ++counts.viewWillDisappear1;
            },
            viewDidDisappear: function(animated){
                contentClass1.$super.viewDidDisappear.call(this, animated);
                ++counts.viewDidDisappear1;
            }
        }, "UINavigationControllerTestsClass1");
        var contentClass2 = UIViewController.$extend({
            viewWillAppear: function(animated){
                contentClass2.$super.viewWillAppear.call(this, animated);
                ++counts.viewWillAppear2;
            },
            viewDidAppear: function(animated){
                contentClass2.$super.viewDidAppear.call(this, animated);
                ++counts.viewDidAppear2;
            },
            viewWillDisappear: function(animated){
                contentClass2.$super.viewWillDisappear.call(this, animated);
                ++counts.viewWillDisappear2;
            },
            viewDidDisappear: function(animated){
                contentClass2.$super.viewDidDisappear.call(this, animated);
                ++counts.viewDidDisappear2;
            }
        }, "UINavigationControllerTestsClass2");
        var viewController1 = contentClass1.init();
        var viewController2 = contentClass2.init();
        var navigationController = UINavigationController.initWithRootViewController(viewController1);
        this.window.contentViewController = navigationController;
        TKAssertEquals(counts.viewWillAppear1, 1);
        TKAssertEquals(counts.viewDidAppear1, 0);
        TKAssertEquals(counts.viewWillDisappear1, 0);
        TKAssertEquals(counts.viewDidDisappear1, 0);
        TKAssertExactEquals(viewController1.isViewVisible, false);
        this.app.updateDisplay();
        TKAssertEquals(counts.viewWillAppear1, 1);
        TKAssertEquals(counts.viewDidAppear1, 1);
        TKAssertEquals(counts.viewWillDisappear1, 0);
        TKAssertEquals(counts.viewDidDisappear1, 0);
        TKAssertExactEquals(viewController1.isViewVisible, true);

        navigationController.pushViewController(viewController2, false);
        TKAssertEquals(counts.viewWillAppear1, 1);
        TKAssertEquals(counts.viewDidAppear1, 1);
        TKAssertEquals(counts.viewWillDisappear1, 1);
        TKAssertEquals(counts.viewDidDisappear1, 0);
        TKAssertEquals(counts.viewWillAppear2, 1);
        TKAssertEquals(counts.viewDidAppear2, 0);
        TKAssertEquals(counts.viewWillDisappear2, 0);
        TKAssertEquals(counts.viewDidDisappear2, 0);
        TKAssertExactEquals(viewController1.isViewVisible, true);
        TKAssertExactEquals(viewController2.isViewVisible, false);
        TKAssertEquals(viewController1.parentViewController, navigationController);
        TKAssertEquals(viewController2.parentViewController, navigationController);
        this.app.updateDisplay();
        TKAssertEquals(counts.viewWillAppear1, 1);
        TKAssertEquals(counts.viewDidAppear1, 1);
        TKAssertEquals(counts.viewWillDisappear1, 1);
        TKAssertEquals(counts.viewDidDisappear1, 1);
        TKAssertEquals(counts.viewWillAppear2, 1);
        TKAssertEquals(counts.viewDidAppear2, 1);
        TKAssertEquals(counts.viewWillDisappear2, 0);
        TKAssertEquals(counts.viewDidDisappear2, 0);
        TKAssertExactEquals(viewController1.isViewVisible, false);
        TKAssertExactEquals(viewController2.isViewVisible, true);
        TKAssertEquals(viewController1.parentViewController, navigationController);
        TKAssertEquals(viewController2.parentViewController, navigationController);

        navigationController.popViewController(false);
        TKAssertEquals(counts.viewWillAppear1, 2);
        TKAssertEquals(counts.viewDidAppear1, 1);
        TKAssertEquals(counts.viewWillDisappear1, 1);
        TKAssertEquals(counts.viewDidDisappear1, 1);
        TKAssertEquals(counts.viewWillAppear2, 1);
        TKAssertEquals(counts.viewDidAppear2, 1);
        TKAssertEquals(counts.viewWillDisappear2, 1);
        TKAssertEquals(counts.viewDidDisappear2, 0);
        TKAssertExactEquals(viewController1.isViewVisible, false);
        TKAssertExactEquals(viewController2.isViewVisible, true);
        TKAssertEquals(viewController1.parentViewController, navigationController);
        this.app.updateDisplay();
        TKAssertEquals(counts.viewWillAppear1, 2);
        TKAssertEquals(counts.viewDidAppear1, 2);
        TKAssertEquals(counts.viewWillDisappear1, 1);
        TKAssertEquals(counts.viewDidDisappear1, 1);
        TKAssertEquals(counts.viewWillAppear2, 1);
        TKAssertEquals(counts.viewDidAppear2, 1);
        TKAssertEquals(counts.viewWillDisappear2, 1);
        TKAssertEquals(counts.viewDidDisappear2, 1);
        TKAssertExactEquals(viewController1.isViewVisible, true);
        TKAssertExactEquals(viewController2.isViewVisible, false);
        TKAssertEquals(viewController1.parentViewController, navigationController);
        TKAssertEquals(viewController2.parentViewController, null);
    },

    testPushPopAnimated: function(){
        var counts = {
            viewWillAppear1: 0,
            viewDidAppear1: 0,
            viewWillDisappear1: 0,
            viewDidDisappear1: 0,
            viewWillAppear2: 0,
            viewDidAppear2: 0,
            viewWillDisappear2: 0,
            viewDidDisappear2: 0
        };
        var contentClass1 = UIViewController.$extend({
            viewWillAppear: function(animated){
                contentClass1.$super.viewWillAppear.call(this, animated);
                ++counts.viewWillAppear1;
            },
            viewDidAppear: function(animated){
                contentClass1.$super.viewDidAppear.call(this, animated);
                ++counts.viewDidAppear1;
            },
            viewWillDisappear: function(animated){
                contentClass1.$super.viewWillDisappear.call(this, animated);
                ++counts.viewWillDisappear1;
            },
            viewDidDisappear: function(animated){
                contentClass1.$super.viewDidDisappear.call(this, animated);
                ++counts.viewDidDisappear1;
            }
        }, "UINavigationControllerTestsClass1");
        var contentClass2 = UIViewController.$extend({
            viewWillAppear: function(animated){
                contentClass2.$super.viewWillAppear.call(this, animated);
                ++counts.viewWillAppear2;
            },
            viewDidAppear: function(animated){
                contentClass2.$super.viewDidAppear.call(this, animated);
                ++counts.viewDidAppear2;
            },
            viewWillDisappear: function(animated){
                contentClass2.$super.viewWillDisappear.call(this, animated);
                ++counts.viewWillDisappear2;
            },
            viewDidDisappear: function(animated){
                contentClass2.$super.viewDidDisappear.call(this, animated);
                ++counts.viewDidDisappear2;
            }
        }, "UINavigationControllerTestsClass2");
        var viewController1 = contentClass1.init();
        var viewController2 = contentClass2.init();
        var navigationController = UINavigationController.initWithRootViewController(viewController1);
        this.window.contentViewController = navigationController;
        TKAssertEquals(counts.viewWillAppear1, 1);
        TKAssertEquals(counts.viewDidAppear1, 0);
        TKAssertEquals(counts.viewWillDisappear1, 0);
        TKAssertEquals(counts.viewDidDisappear1, 0);
        TKAssertExactEquals(viewController1.isViewVisible, false);
        this.app.updateDisplay();
        TKAssertEquals(counts.viewWillAppear1, 1);
        TKAssertEquals(counts.viewDidAppear1, 1);
        TKAssertEquals(counts.viewWillDisappear1, 0);
        TKAssertEquals(counts.viewDidDisappear1, 0);
        TKAssertExactEquals(viewController1.isViewVisible, true);
        TKAssertFloatEquals(navigationController.view.bounds.size.width, 200);
        TKAssertFloatEquals(navigationController.view.bounds.size.height, 400);
        TKAssertFloatEquals(viewController1.view.bounds.size.width, 200);
        TKAssertFloatEquals(viewController1.view.position.x, 100);
        TKAssertEquals(viewController1.parentViewController, navigationController);

        navigationController.pushViewController(viewController2, true);
        TKAssertEquals(counts.viewWillAppear1, 1);
        TKAssertEquals(counts.viewDidAppear1, 1);
        TKAssertEquals(counts.viewWillDisappear1, 1);
        TKAssertEquals(counts.viewDidDisappear1, 0);
        TKAssertEquals(counts.viewWillAppear2, 1);
        TKAssertEquals(counts.viewDidAppear2, 0);
        TKAssertEquals(counts.viewWillDisappear2, 0);
        TKAssertEquals(counts.viewDidDisappear2, 0);
        TKAssertExactEquals(viewController1.isViewVisible, true);
        TKAssertExactEquals(viewController2.isViewVisible, false);
        this.app.updateDisplay();
        this.app.updateDisplay(UIAnimation.Duration.transition / 2);
        TKAssertEquals(counts.viewWillAppear1, 1);
        TKAssertEquals(counts.viewDidAppear1, 1);
        TKAssertEquals(counts.viewWillDisappear1, 1);
        TKAssertEquals(counts.viewDidDisappear1, 0);
        TKAssertEquals(counts.viewWillAppear2, 1);
        TKAssertEquals(counts.viewDidAppear2, 0);
        TKAssertEquals(counts.viewWillDisappear2, 0);
        TKAssertEquals(counts.viewDidDisappear2, 0);
        TKAssertExactEquals(viewController1.isViewVisible, true);
        TKAssertExactEquals(viewController2.isViewVisible, false);
        TKAssertExactEquals(viewController1.view.superview, navigationController.view);
        TKAssertExactEquals(viewController2.view.superview, navigationController.view);
        TKAssertFloatEquals(viewController1.view.layer.presentation.transform.tx, -50);
        TKAssertFloatEquals(viewController2.view.layer.presentation.transform.tx, 100);
        TKAssertEquals(viewController1.parentViewController, navigationController);
        TKAssertEquals(viewController2.parentViewController, navigationController);
        this.app.updateDisplay(UIAnimation.Duration.transition / 2 + 0.1);
        TKAssertEquals(counts.viewWillAppear1, 1);
        TKAssertEquals(counts.viewDidAppear1, 1);
        TKAssertEquals(counts.viewWillDisappear1, 1);
        TKAssertEquals(counts.viewDidDisappear1, 1);
        TKAssertEquals(counts.viewWillAppear2, 1);
        TKAssertEquals(counts.viewDidAppear2, 1);
        TKAssertEquals(counts.viewWillDisappear2, 0);
        TKAssertEquals(counts.viewDidDisappear2, 0);
        TKAssertExactEquals(viewController1.isViewVisible, false);
        TKAssertExactEquals(viewController2.isViewVisible, true);
        TKAssertExactEquals(viewController1.view.superview, null);
        TKAssertExactEquals(viewController2.view.superview, navigationController.view);
        TKAssertEquals(viewController1.parentViewController, navigationController);
        TKAssertEquals(viewController2.parentViewController, navigationController);

        navigationController.popViewController(true);
        TKAssertEquals(counts.viewWillAppear1, 2);
        TKAssertEquals(counts.viewDidAppear1, 1);
        TKAssertEquals(counts.viewWillDisappear1, 1);
        TKAssertEquals(counts.viewDidDisappear1, 1);
        TKAssertEquals(counts.viewWillAppear2, 1);
        TKAssertEquals(counts.viewDidAppear2, 1);
        TKAssertEquals(counts.viewWillDisappear2, 1);
        TKAssertEquals(counts.viewDidDisappear2, 0);
        TKAssertExactEquals(viewController1.isViewVisible, false);
        TKAssertExactEquals(viewController2.isViewVisible, true);
        this.app.updateDisplay();
        this.app.updateDisplay(UIAnimation.Duration.transition / 2);
        TKAssertEquals(counts.viewWillAppear1, 2);
        TKAssertEquals(counts.viewDidAppear1, 1);
        TKAssertEquals(counts.viewWillDisappear1, 1);
        TKAssertEquals(counts.viewDidDisappear1, 1);
        TKAssertEquals(counts.viewWillAppear2, 1);
        TKAssertEquals(counts.viewDidAppear2, 1);
        TKAssertEquals(counts.viewWillDisappear2, 1);
        TKAssertEquals(counts.viewDidDisappear2, 0);
        TKAssertExactEquals(viewController1.isViewVisible, false);
        TKAssertExactEquals(viewController2.isViewVisible, true);
        TKAssertExactEquals(viewController1.view.superview, navigationController.view);
        TKAssertExactEquals(viewController2.view.superview, navigationController.view);
        TKAssertFloatEquals(viewController1.view.layer.presentation.transform.tx, -50);
        TKAssertFloatEquals(viewController2.view.layer.presentation.transform.tx, 100);
        TKAssertEquals(viewController1.parentViewController, navigationController);
        TKAssertEquals(viewController2.parentViewController, navigationController);
        this.app.updateDisplay(UIAnimation.Duration.transition / 2 + 0.1);
        TKAssertEquals(counts.viewWillAppear1, 2);
        TKAssertEquals(counts.viewDidAppear1, 2);
        TKAssertEquals(counts.viewWillDisappear1, 1);
        TKAssertEquals(counts.viewDidDisappear1, 1);
        TKAssertEquals(counts.viewWillAppear2, 1);
        TKAssertEquals(counts.viewDidAppear2, 1);
        TKAssertEquals(counts.viewWillDisappear2, 1);
        TKAssertEquals(counts.viewDidDisappear2, 1);
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
        var counts = {
            viewWillAppear1: 0,
            viewDidAppear1: 0,
            viewWillDisappear1: 0,
            viewDidDisappear1: 0,
            viewWillAppear2: 0,
            viewDidAppear2: 0,
            viewWillDisappear2: 0,
            viewDidDisappear2: 0,
            viewWillAppear3: 0,
            viewDidAppear3: 0,
            viewWillDisappear3: 0,
            viewDidDisappear3: 0
        };
        var contentClass1 = UIViewController.$extend({
            viewWillAppear: function(animated){
                contentClass1.$super.viewWillAppear.call(this, animated);
                ++counts.viewWillAppear1;
            },
            viewDidAppear: function(animated){
                contentClass1.$super.viewDidAppear.call(this, animated);
                ++counts.viewDidAppear1;
            },
            viewWillDisappear: function(animated){
                contentClass1.$super.viewWillDisappear.call(this, animated);
                ++counts.viewWillDisappear1;
            },
            viewDidDisappear: function(animated){
                contentClass1.$super.viewDidDisappear.call(this, animated);
                ++counts.viewDidDisappear1;
            }
        }, "UINavigationControllerTestsClass1");
        var contentClass2 = UIViewController.$extend({
            viewWillAppear: function(animated){
                contentClass2.$super.viewWillAppear.call(this, animated);
                ++counts.viewWillAppear2;
            },
            viewDidAppear: function(animated){
                contentClass2.$super.viewDidAppear.call(this, animated);
                ++counts.viewDidAppear2;
            },
            viewWillDisappear: function(animated){
                contentClass2.$super.viewWillDisappear.call(this, animated);
                ++counts.viewWillDisappear2;
            },
            viewDidDisappear: function(animated){
                contentClass2.$super.viewDidDisappear.call(this, animated);
                ++counts.viewDidDisappear2;
            }
        }, "UINavigationControllerTestsClass2");
        var contentClass3 = UIViewController.$extend({
            viewWillAppear: function(animated){
                contentClass3.$super.viewWillAppear.call(this, animated);
                ++counts.viewWillAppear3;
            },
            viewDidAppear: function(animated){
                contentClass3.$super.viewDidAppear.call(this, animated);
                ++counts.viewDidAppear3;
            },
            viewWillDisappear: function(animated){
                contentClass3.$super.viewWillDisappear.call(this, animated);
                ++counts.viewWillDisappear3;
            },
            viewDidDisappear: function(animated){
                contentClass3.$super.viewDidDisappear.call(this, animated);
                ++counts.viewDidDisappear3;
            }
        }, "UINavigationControllerTestsClass3");
        var viewController1 = contentClass1.init();
        var viewController2 = contentClass2.init();
        var viewController3 = contentClass3.init();
        var navigationController = UINavigationController.initWithRootViewController(viewController1);
        this.window.contentViewController = navigationController;
        this.app.updateDisplay();
        TKAssertEquals(counts.viewWillAppear1, 1);
        TKAssertEquals(counts.viewDidAppear1, 1);
        TKAssertEquals(counts.viewWillDisappear1, 0);
        TKAssertEquals(counts.viewDidDisappear1, 0);
        TKAssertEquals(counts.viewWillAppear2, 0);
        TKAssertEquals(counts.viewDidAppear2, 0);
        TKAssertEquals(counts.viewWillDisappear2, 0);
        TKAssertEquals(counts.viewDidDisappear2, 0);
        TKAssertEquals(counts.viewWillAppear3, 0);
        TKAssertEquals(counts.viewDidAppear3, 0);
        TKAssertEquals(counts.viewWillDisappear3, 0);
        TKAssertEquals(counts.viewDidDisappear3, 0);

        navigationController.viewControllers = [viewController2, viewController3];
        TKAssertExactEquals(navigationController.viewControllers.length, 2);
        TKAssertExactEquals(navigationController.viewControllers[0], viewController2);
        TKAssertExactEquals(navigationController.viewControllers[1], viewController3);
        TKAssertExactEquals(navigationController.topViewController, viewController3);
        TKAssertExactEquals(viewController1.parentViewController, null);
        TKAssertExactEquals(viewController2.parentViewController, navigationController);
        TKAssertExactEquals(viewController3.parentViewController, navigationController);
        TKAssertEquals(counts.viewWillAppear1, 1);
        TKAssertEquals(counts.viewDidAppear1, 1);
        TKAssertEquals(counts.viewWillDisappear1, 1);
        TKAssertEquals(counts.viewDidDisappear1, 0);
        TKAssertEquals(counts.viewWillAppear2, 0);
        TKAssertEquals(counts.viewDidAppear2, 0);
        TKAssertEquals(counts.viewWillDisappear2, 0);
        TKAssertEquals(counts.viewDidDisappear2, 0);
        TKAssertEquals(counts.viewWillAppear3, 1);
        TKAssertEquals(counts.viewDidAppear3, 0);
        TKAssertEquals(counts.viewWillDisappear3, 0);
        TKAssertEquals(counts.viewDidDisappear3, 0);
        this.app.updateDisplay();
        TKAssertEquals(counts.viewWillAppear1, 1);
        TKAssertEquals(counts.viewDidAppear1, 1);
        TKAssertEquals(counts.viewWillDisappear1, 1);
        TKAssertEquals(counts.viewDidDisappear1, 1);
        TKAssertEquals(counts.viewWillAppear2, 0);
        TKAssertEquals(counts.viewDidAppear2, 0);
        TKAssertEquals(counts.viewWillDisappear2, 0);
        TKAssertEquals(counts.viewDidDisappear2, 0);
        TKAssertEquals(counts.viewWillAppear3, 1);
        TKAssertEquals(counts.viewDidAppear3, 1);
        TKAssertEquals(counts.viewWillDisappear3, 0);
        TKAssertEquals(counts.viewDidDisappear3, 0);
    }
});