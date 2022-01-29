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

JSClass("UIViewControllerTests", TKTestSuite, {

    app: null,
    window: null,

    setup: function(){
        this.app = UIMockApplication.initEmpty();
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

    testInit: function(){
        var viewController = UIViewController.init();
        TKAssert(!viewController.isViewLoaded);
        TKAssert(!viewController.isViewVisible);
    },

    testInitWithSpec: function(){
        var spec = JSSpec.initWithDictionary({
            view: {tag: 1},
            navigationItem: {title: "testing"},
            tabViewItem: {title: "test2"}
        });
        var viewController = UIViewController.initWithSpec(spec);
        TKAssertExactEquals(viewController.isViewLoaded, false);
        TKAssertExactEquals(viewController.navigationItem.title, "testing");
        TKAssertExactEquals(viewController.tabViewItem.title, "test2");
        var view = viewController.view;
        TKAssertExactEquals(view.tag, 1);
    },

    testLoadView: function(){
        var viewController = UIViewController.init();
        var view = viewController.view;
        TKAssertExactEquals(viewController.isViewLoaded, true);
        TKAssertExactEquals(viewController.view.$class, UIView);
    },

    testViewLifecycle: function(){
        var viewController = UIViewControllerTestsViewController.init();
        TKAssertEquals(viewController.viewWillAppearCount, 0);
        TKAssertEquals(viewController.viewDidAppearCount, 0);
        TKAssertEquals(viewController.viewWillDisappearCount, 0);
        TKAssertEquals(viewController.viewDidDisappearCount, 0);
        TKAssertExactEquals(viewController.lifecycleState, UIViewController.LifecycleState.disappeared);
        TKAssertExactEquals(viewController.isViewVisible, false);
        viewController.viewWillAppear(false);
        TKAssertEquals(viewController.viewWillAppearCount, 1);
        TKAssertEquals(viewController.viewDidAppearCount, 0);
        TKAssertEquals(viewController.viewWillDisappearCount, 0);
        TKAssertEquals(viewController.viewDidDisappearCount, 0);
        TKAssertExactEquals(viewController.lifecycleState, UIViewController.LifecycleState.appearing);
        TKAssertExactEquals(viewController.isViewVisible, false);
        viewController.viewDidAppear(false);
        TKAssertEquals(viewController.viewWillAppearCount, 1);
        TKAssertEquals(viewController.viewDidAppearCount, 1);
        TKAssertEquals(viewController.viewWillDisappearCount, 0);
        TKAssertEquals(viewController.viewDidDisappearCount, 0);
        TKAssertExactEquals(viewController.lifecycleState, UIViewController.LifecycleState.appeared);
        TKAssertExactEquals(viewController.isViewVisible, true);
        viewController.viewWillDisappear(false);
        TKAssertEquals(viewController.viewWillAppearCount, 1);
        TKAssertEquals(viewController.viewDidAppearCount, 1);
        TKAssertEquals(viewController.viewWillDisappearCount, 1);
        TKAssertEquals(viewController.viewDidDisappearCount, 0);
        TKAssertExactEquals(viewController.lifecycleState, UIViewController.LifecycleState.disappearing);
        TKAssertExactEquals(viewController.isViewVisible, true);
        viewController.viewDidDisappear(false);
        TKAssertEquals(viewController.viewWillAppearCount, 1);
        TKAssertEquals(viewController.viewDidAppearCount, 1);
        TKAssertEquals(viewController.viewWillDisappearCount, 1);
        TKAssertEquals(viewController.viewDidDisappearCount, 1);
        TKAssertExactEquals(viewController.lifecycleState, UIViewController.LifecycleState.disappeared);
        TKAssertExactEquals(viewController.isViewVisible, false);
    },

    testViewLifecycleControl: function(){
        var viewController = UIViewControllerTestsViewController.init();
        TKAssertEquals(viewController.viewWillAppearCount, 0);
        TKAssertEquals(viewController.viewDidAppearCount, 0);
        TKAssertEquals(viewController.viewWillDisappearCount, 0);
        TKAssertEquals(viewController.viewDidDisappearCount, 0);
        TKAssertExactEquals(viewController.lifecycleState, UIViewController.LifecycleState.disappeared);
        TKAssertExactEquals(viewController.isViewVisible, false);
        viewController.beginAppearance(false);
        TKAssertEquals(viewController.viewWillAppearCount, 1);
        TKAssertEquals(viewController.viewDidAppearCount, 0);
        TKAssertEquals(viewController.viewWillDisappearCount, 0);
        TKAssertEquals(viewController.viewDidDisappearCount, 0);
        TKAssertExactEquals(viewController.lifecycleState, UIViewController.LifecycleState.appearing);
        TKAssertExactEquals(viewController.isViewVisible, false);
        viewController.beginAppearance(false);
        TKAssertEquals(viewController.viewWillAppearCount, 1);
        TKAssertEquals(viewController.viewDidAppearCount, 0);
        TKAssertEquals(viewController.viewWillDisappearCount, 0);
        TKAssertEquals(viewController.viewDidDisappearCount, 0);
        TKAssertExactEquals(viewController.lifecycleState, UIViewController.LifecycleState.appearing);
        TKAssertExactEquals(viewController.isViewVisible, false);
        viewController.endAppearance();
        TKAssertEquals(viewController.viewWillAppearCount, 1);
        TKAssertEquals(viewController.viewDidAppearCount, 0);
        TKAssertEquals(viewController.viewWillDisappearCount, 0);
        TKAssertEquals(viewController.viewDidDisappearCount, 0);
        TKAssertExactEquals(viewController.lifecycleState, UIViewController.LifecycleState.appearing);
        TKAssertExactEquals(viewController.isViewVisible, false);
        this.app.updateDisplay();
        TKAssertEquals(viewController.viewWillAppearCount, 1);
        TKAssertEquals(viewController.viewDidAppearCount, 1);
        TKAssertEquals(viewController.viewWillDisappearCount, 0);
        TKAssertEquals(viewController.viewDidDisappearCount, 0);
        TKAssertExactEquals(viewController.lifecycleState, UIViewController.LifecycleState.appeared);
        TKAssertExactEquals(viewController.isViewVisible, true);
        viewController.endAppearance();
        TKAssertEquals(viewController.viewWillAppearCount, 1);
        TKAssertEquals(viewController.viewDidAppearCount, 1);
        TKAssertEquals(viewController.viewWillDisappearCount, 0);
        TKAssertEquals(viewController.viewDidDisappearCount, 0);
        TKAssertExactEquals(viewController.lifecycleState, UIViewController.LifecycleState.appeared);
        TKAssertExactEquals(viewController.isViewVisible, true);
        this.app.updateDisplay();
        TKAssertEquals(viewController.viewWillAppearCount, 1);
        TKAssertEquals(viewController.viewDidAppearCount, 1);
        TKAssertEquals(viewController.viewWillDisappearCount, 0);
        TKAssertEquals(viewController.viewDidDisappearCount, 0);
        TKAssertExactEquals(viewController.lifecycleState, UIViewController.LifecycleState.appeared);
        TKAssertExactEquals(viewController.isViewVisible, true);
        viewController.beginDisappearance(false);
        TKAssertEquals(viewController.viewWillAppearCount, 1);
        TKAssertEquals(viewController.viewDidAppearCount, 1);
        TKAssertEquals(viewController.viewWillDisappearCount, 1);
        TKAssertEquals(viewController.viewDidDisappearCount, 0);
        TKAssertExactEquals(viewController.lifecycleState, UIViewController.LifecycleState.disappearing);
        TKAssertExactEquals(viewController.isViewVisible, true);
        viewController.beginDisappearance(false);
        TKAssertEquals(viewController.viewWillAppearCount, 1);
        TKAssertEquals(viewController.viewDidAppearCount, 1);
        TKAssertEquals(viewController.viewWillDisappearCount, 1);
        TKAssertEquals(viewController.viewDidDisappearCount, 0);
        TKAssertExactEquals(viewController.lifecycleState, UIViewController.LifecycleState.disappearing);
        TKAssertExactEquals(viewController.isViewVisible, true);
        viewController.endDisappearance();
        TKAssertEquals(viewController.viewWillAppearCount, 1);
        TKAssertEquals(viewController.viewDidAppearCount, 1);
        TKAssertEquals(viewController.viewWillDisappearCount, 1);
        TKAssertEquals(viewController.viewDidDisappearCount, 0);
        TKAssertExactEquals(viewController.lifecycleState, UIViewController.LifecycleState.disappearing);
        TKAssertExactEquals(viewController.isViewVisible, true);
        this.app.updateDisplay();
        TKAssertEquals(viewController.viewWillAppearCount, 1);
        TKAssertEquals(viewController.viewDidAppearCount, 1);
        TKAssertEquals(viewController.viewWillDisappearCount, 1);
        TKAssertEquals(viewController.viewDidDisappearCount, 1);
        TKAssertExactEquals(viewController.lifecycleState, UIViewController.LifecycleState.disappeared);
        TKAssertExactEquals(viewController.isViewVisible, false);

        viewController = UIViewControllerTestsViewController.init();
        TKAssertEquals(viewController.viewWillAppearCount, 0);
        TKAssertEquals(viewController.viewDidAppearCount, 0);
        TKAssertEquals(viewController.viewWillDisappearCount, 0);
        TKAssertEquals(viewController.viewDidDisappearCount, 0);
        TKAssertExactEquals(viewController.lifecycleState, UIViewController.LifecycleState.disappeared);
        TKAssertExactEquals(viewController.isViewVisible, false);
        viewController.beginAppearance(true);
        TKAssertEquals(viewController.viewWillAppearCount, 1);
        TKAssertEquals(viewController.viewDidAppearCount, 0);
        TKAssertEquals(viewController.viewWillDisappearCount, 0);
        TKAssertEquals(viewController.viewDidDisappearCount, 0);
        TKAssertExactEquals(viewController.lifecycleState, UIViewController.LifecycleState.appearing);
        TKAssertExactEquals(viewController.isViewVisible, false);
        viewController.beginAppearance(true);
        TKAssertEquals(viewController.viewWillAppearCount, 1);
        TKAssertEquals(viewController.viewDidAppearCount, 0);
        TKAssertEquals(viewController.viewWillDisappearCount, 0);
        TKAssertEquals(viewController.viewDidDisappearCount, 0);
        TKAssertExactEquals(viewController.lifecycleState, UIViewController.LifecycleState.appearing);
        TKAssertExactEquals(viewController.isViewVisible, false);
        viewController.endAppearance();
        TKAssertEquals(viewController.viewWillAppearCount, 1);
        TKAssertEquals(viewController.viewDidAppearCount, 1);
        TKAssertEquals(viewController.viewWillDisappearCount, 0);
        TKAssertEquals(viewController.viewDidDisappearCount, 0);
        TKAssertExactEquals(viewController.lifecycleState, UIViewController.LifecycleState.appeared);
        TKAssertExactEquals(viewController.isViewVisible, true);
        viewController.endAppearance();
        TKAssertEquals(viewController.viewWillAppearCount, 1);
        TKAssertEquals(viewController.viewDidAppearCount, 1);
        TKAssertEquals(viewController.viewWillDisappearCount, 0);
        TKAssertEquals(viewController.viewDidDisappearCount, 0);
        TKAssertExactEquals(viewController.lifecycleState, UIViewController.LifecycleState.appeared);
        TKAssertExactEquals(viewController.isViewVisible, true);
        this.app.updateDisplay();
        TKAssertEquals(viewController.viewWillAppearCount, 1);
        TKAssertEquals(viewController.viewDidAppearCount, 1);
        TKAssertEquals(viewController.viewWillDisappearCount, 0);
        TKAssertEquals(viewController.viewDidDisappearCount, 0);
        TKAssertExactEquals(viewController.lifecycleState, UIViewController.LifecycleState.appeared);
        TKAssertExactEquals(viewController.isViewVisible, true);
        viewController.beginDisappearance(true);
        TKAssertEquals(viewController.viewWillAppearCount, 1);
        TKAssertEquals(viewController.viewDidAppearCount, 1);
        TKAssertEquals(viewController.viewWillDisappearCount, 1);
        TKAssertEquals(viewController.viewDidDisappearCount, 0);
        TKAssertExactEquals(viewController.lifecycleState, UIViewController.LifecycleState.disappearing);
        TKAssertExactEquals(viewController.isViewVisible, true);
        viewController.beginDisappearance(true);
        TKAssertEquals(viewController.viewWillAppearCount, 1);
        TKAssertEquals(viewController.viewDidAppearCount, 1);
        TKAssertEquals(viewController.viewWillDisappearCount, 1);
        TKAssertEquals(viewController.viewDidDisappearCount, 0);
        TKAssertExactEquals(viewController.lifecycleState, UIViewController.LifecycleState.disappearing);
        TKAssertExactEquals(viewController.isViewVisible, true);
        viewController.endDisappearance();
        TKAssertEquals(viewController.viewWillAppearCount, 1);
        TKAssertEquals(viewController.viewDidAppearCount, 1);
        TKAssertEquals(viewController.viewWillDisappearCount, 1);
        TKAssertEquals(viewController.viewDidDisappearCount, 1);
        TKAssertExactEquals(viewController.lifecycleState, UIViewController.LifecycleState.disappeared);
        TKAssertExactEquals(viewController.isViewVisible, false);

    }
});

JSClass("UIViewControllerTestsViewController", UIViewController, {

    viewWillAppearCount: 0,
    viewDidAppearCount: 0,
    viewWillDisappearCount: 0,
    viewDidDisappearCount: 0,

    viewWillAppear: function(animated){
        UIViewControllerTestsViewController.$super.viewWillAppear.call(this, animated);
        ++this.viewWillAppearCount;
    },

    viewDidAppear: function(animated){
        UIViewControllerTestsViewController.$super.viewDidAppear.call(this, animated);
        ++this.viewDidAppearCount;
    },

    viewWillDisappear: function(animated){
        UIViewControllerTestsViewController.$super.viewWillDisappear.call(this, animated);
        ++this.viewWillDisappearCount;
    },

    viewDidDisappear: function(animated){
        UIViewControllerTestsViewController.$super.viewDidDisappear.call(this, animated);
        ++this.viewDidDisappearCount;
    }

});