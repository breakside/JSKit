// Copyright 2021 Breakside Inc.
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

JSClass("UIContainerViewControllerTests", TKTestSuite, {

    app: null,

    setup: function(){
        this.app = UIMockApplication.initEmpty();
        var expectation = TKExpectation.init();
        expectation.call(this.app.run, this.app, function(error){
            TKAssertNull(error);
        });
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
        var controller = UIContainerViewController.init();
        TKAssertNull(controller.contentViewController);
        TKAssertExactEquals(controller.isViewLoaded, false);
    },

    testInitWithSpec: function(){
        var spec = JSSpec.initWithDictionary({});
        var controller = UIContainerViewController.initWithSpec(spec);
        TKAssertNull(controller.contentViewController);
        TKAssertExactEquals(controller.isViewLoaded, false);

        spec = JSSpec.initWithDictionary({
            contentViewController: {
                class: "UIViewController"
            }
        });
        controller = UIContainerViewController.initWithSpec(spec);
        TKAssertInstance(controller.contentViewController, UIViewController);
        TKAssertExactEquals(controller.isViewLoaded, false);
    },

    testLoadView: function(){
        var controller = UIContainerViewController.init();
        var view = controller.view;
        TKAssertInstance(view, UIContainerView);
        TKAssertNull(view.contentView);

        controller = UIContainerViewController.init();
        var contentController = UIViewController.init();
        controller.contentViewController = contentController;
        view = controller.view;
        TKAssertInstance(view, UIContainerView);
        TKAssertExactEquals(view.contentView, contentController.view);
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
        }, "UIContainerViewControllerTestsClass1");
        var controller = UIContainerViewController.init();
        controller.viewWillAppear(false);
        controller.viewDidAppear(false);
        controller.viewWillDisappear(false);
        controller.viewDidDisappear(false);

        controller = UIContainerViewController.init();
        var contentViewController = contentClass.init();
        controller.contentViewController = contentViewController;
        TKAssertEquals(counts.viewWillAppear, 0);
        TKAssertEquals(counts.viewDidAppear, 0);
        TKAssertEquals(counts.viewWillDisappear, 0);
        TKAssertEquals(counts.viewDidDisappear, 0);
        TKAssertExactEquals(contentViewController.isViewVisible, false);
        controller.viewWillAppear(false);
        TKAssertEquals(counts.viewWillAppear, 1);
        TKAssertEquals(counts.viewDidAppear, 0);
        TKAssertEquals(counts.viewWillDisappear, 0);
        TKAssertEquals(counts.viewDidDisappear, 0);
        TKAssertExactEquals(contentViewController.isViewVisible, false);
        controller.viewDidAppear(false);
        TKAssertEquals(counts.viewWillAppear, 1);
        TKAssertEquals(counts.viewDidAppear, 1);
        TKAssertEquals(counts.viewWillDisappear, 0);
        TKAssertEquals(counts.viewDidDisappear, 0);
        TKAssertExactEquals(contentViewController.isViewVisible, true);
        controller.viewWillDisappear(false);
        TKAssertEquals(counts.viewWillAppear, 1);
        TKAssertEquals(counts.viewDidAppear, 1);
        TKAssertEquals(counts.viewWillDisappear, 1);
        TKAssertEquals(counts.viewDidDisappear, 0);
        TKAssertExactEquals(contentViewController.isViewVisible, true);
        controller.viewDidDisappear(false);
        TKAssertEquals(counts.viewWillAppear, 1);
        TKAssertEquals(counts.viewDidAppear, 1);
        TKAssertEquals(counts.viewWillDisappear, 1);
        TKAssertEquals(counts.viewDidDisappear, 1);
        TKAssertExactEquals(contentViewController.isViewVisible, false);
    },

    testSetContentViewController: function(){
        var window = UIWindow.init();
        window.makeKeyAndOrderFront();
        var contentClass = UIViewController.$extend({
            init: function(){
                this.counts = {
                    viewWillAppear: 0,
                    viewDidAppear: 0,
                    viewWillDisappear: 0,
                    viewDidDisappear: 0
                };
            },
            viewWillAppear: function(animated){
                contentClass.$super.viewWillAppear.call(this, animated);
                ++this.counts.viewWillAppear;
            },
            viewDidAppear: function(animated){
                contentClass.$super.viewDidAppear.call(this, animated);
                ++this.counts.viewDidAppear;
            },
            viewWillDisappear: function(animated){
                contentClass.$super.viewWillDisappear.call(this, animated);
                ++this.counts.viewWillDisappear;
            },
            viewDidDisappear: function(animated){
                contentClass.$super.viewDidDisappear.call(this, animated);
                ++this.counts.viewDidDisappear;
            }
        }, "UIContainerViewControllerTestsClass1");
        var controller = UIContainerViewController.init();
        var contentController1 = contentClass.init();
        var contentController2 = contentClass.init();
        controller.contentViewController = contentController1;
        TKAssertEquals(contentController1.counts.viewWillAppear, 0);
        TKAssertEquals(contentController1.counts.viewDidAppear, 0);
        TKAssertEquals(contentController1.counts.viewWillDisappear, 0);
        TKAssertEquals(contentController1.counts.viewDidDisappear, 0);
        TKAssertExactEquals(contentController1.isViewVisible, false);
        TKAssertEquals(contentController2.counts.viewWillAppear, 0);
        TKAssertEquals(contentController2.counts.viewDidAppear, 0);
        TKAssertEquals(contentController2.counts.viewWillDisappear, 0);
        TKAssertEquals(contentController2.counts.viewDidDisappear, 0);
        TKAssertExactEquals(contentController2.isViewVisible, false);
        var view = controller.view;
        window.contentView = view;
        TKAssertExactEquals(view.contentView, contentController1.view);
        TKAssertExactEquals(contentController1.parentViewController, controller);
        TKAssertNull(contentController2.view.superview);
        TKAssertNull(contentController2.parentViewController);
        TKAssertEquals(contentController1.counts.viewWillAppear, 0);
        TKAssertEquals(contentController1.counts.viewDidAppear, 0);
        TKAssertEquals(contentController1.counts.viewWillDisappear, 0);
        TKAssertEquals(contentController1.counts.viewDidDisappear, 0);
        TKAssertExactEquals(contentController1.isViewVisible, false);
        TKAssertEquals(contentController2.counts.viewWillAppear, 0);
        TKAssertEquals(contentController2.counts.viewDidAppear, 0);
        TKAssertEquals(contentController2.counts.viewWillDisappear, 0);
        TKAssertEquals(contentController2.counts.viewDidDisappear, 0);
        TKAssertExactEquals(contentController2.isViewVisible, false);

        controller.contentViewController = contentController2;
        view = controller.view;
        TKAssertExactEquals(view.contentView, contentController2.view);
        TKAssertExactEquals(contentController2.parentViewController, controller);
        TKAssertNull(contentController1.view.superview);
        TKAssertNull(contentController1.parentViewController);
        TKAssertEquals(contentController1.counts.viewWillAppear, 0);
        TKAssertEquals(contentController1.counts.viewDidAppear, 0);
        TKAssertEquals(contentController1.counts.viewWillDisappear, 0);
        TKAssertEquals(contentController1.counts.viewDidDisappear, 0);
        TKAssertExactEquals(contentController1.isViewVisible, false);
        TKAssertEquals(contentController2.counts.viewWillAppear, 0);
        TKAssertEquals(contentController2.counts.viewDidAppear, 0);
        TKAssertEquals(contentController2.counts.viewWillDisappear, 0);
        TKAssertEquals(contentController2.counts.viewDidDisappear, 0);
        TKAssertExactEquals(contentController2.isViewVisible, false);

        controller.viewWillAppear(false);
        controller.viewDidAppear(false);
        TKAssertNull(contentController1.parentViewController);
        TKAssertEquals(contentController1.counts.viewWillAppear, 0);
        TKAssertEquals(contentController1.counts.viewDidAppear, 0);
        TKAssertEquals(contentController1.counts.viewWillDisappear, 0);
        TKAssertEquals(contentController1.counts.viewDidDisappear, 0);
        TKAssertExactEquals(contentController1.isViewVisible, false);
        TKAssertEquals(contentController2.counts.viewWillAppear, 1);
        TKAssertEquals(contentController2.counts.viewDidAppear, 1);
        TKAssertEquals(contentController2.counts.viewWillDisappear, 0);
        TKAssertEquals(contentController2.counts.viewDidDisappear, 0);
        TKAssertExactEquals(contentController2.isViewVisible, true);

        controller.contentViewController = contentController1;
        view = controller.view;
        TKAssertExactEquals(view.contentView, contentController1.view);
        TKAssertExactEquals(contentController1.parentViewController, controller);
        TKAssertNull(contentController2.view.superview);
        TKAssertNull(contentController2.parentViewController);
        TKAssertEquals(contentController1.counts.viewWillAppear, 1);
        TKAssertEquals(contentController1.counts.viewDidAppear, 0);
        TKAssertEquals(contentController1.counts.viewWillDisappear, 0);
        TKAssertEquals(contentController1.counts.viewDidDisappear, 0);
        TKAssertExactEquals(contentController1.isViewVisible, false);
        TKAssertEquals(contentController2.counts.viewWillAppear, 1);
        TKAssertEquals(contentController2.counts.viewDidAppear, 1);
        TKAssertEquals(contentController2.counts.viewWillDisappear, 1);
        TKAssertEquals(contentController2.counts.viewDidDisappear, 0);
        TKAssertExactEquals(contentController2.isViewVisible, true);

        this.app.updateDisplay();

        TKAssertEquals(contentController1.counts.viewWillAppear, 1);
        TKAssertEquals(contentController1.counts.viewDidAppear, 1);
        TKAssertEquals(contentController1.counts.viewWillDisappear, 0);
        TKAssertEquals(contentController1.counts.viewDidDisappear, 0);
        TKAssertExactEquals(contentController1.isViewVisible, true);
        TKAssertEquals(contentController2.counts.viewWillAppear, 1);
        TKAssertEquals(contentController2.counts.viewDidAppear, 1);
        TKAssertEquals(contentController2.counts.viewWillDisappear, 1);
        TKAssertEquals(contentController2.counts.viewDidDisappear, 1);
        TKAssertExactEquals(contentController2.isViewVisible, false);

        controller.viewWillDisappear(false);
        controller.viewDidDisappear(false);
        TKAssertEquals(contentController1.counts.viewWillAppear, 1);
        TKAssertEquals(contentController1.counts.viewDidAppear, 1);
        TKAssertEquals(contentController1.counts.viewWillDisappear, 1);
        TKAssertEquals(contentController1.counts.viewDidDisappear, 1);
        TKAssertExactEquals(contentController1.isViewVisible, false);
        TKAssertEquals(contentController2.counts.viewWillAppear, 1);
        TKAssertEquals(contentController2.counts.viewDidAppear, 1);
        TKAssertEquals(contentController2.counts.viewWillDisappear, 1);
        TKAssertEquals(contentController2.counts.viewDidDisappear, 1);
        TKAssertExactEquals(contentController2.isViewVisible, false);

        controller.contentViewController = contentController2;
        view = controller.view;
        TKAssertExactEquals(view.contentView, contentController2.view);
        TKAssertExactEquals(contentController2.parentViewController, controller);
        TKAssertNull(contentController1.view.superview);
        TKAssertNull(contentController1.parentViewController);
        TKAssertEquals(contentController1.counts.viewWillAppear, 1);
        TKAssertEquals(contentController1.counts.viewDidAppear, 1);
        TKAssertEquals(contentController1.counts.viewWillDisappear, 1);
        TKAssertEquals(contentController1.counts.viewDidDisappear, 1);
        TKAssertExactEquals(contentController1.isViewVisible, false);
        TKAssertEquals(contentController2.counts.viewWillAppear, 1);
        TKAssertEquals(contentController2.counts.viewDidAppear, 1);
        TKAssertEquals(contentController2.counts.viewWillDisappear, 1);
        TKAssertEquals(contentController2.counts.viewDidDisappear, 1);
        TKAssertExactEquals(contentController2.isViewVisible, false);
    }
});