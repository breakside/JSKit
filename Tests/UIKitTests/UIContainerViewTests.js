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

JSClass("UIContainerViewTests", TKTestSuite, {

    app: null,

    setup: function(){
        this.app = UIMockApplication.initEmpty();
    },

    teardown: function(){
        this.app.deinit();
        this.app = null;
    },

    testInitWithFrame: function(){
        var view = UIContainerView.init();
        TKAssertNotNull(view);
        TKAssertObjectEquals(view.contentInsets, JSInsets.Zero);
        TKAssertNull(view.contentView);
        TKAssertExactEquals(view.alignment, UIContainerView.Alignment.full);
        TKAssertFloatEquals(view.maximumContentSize.width, 0);
        TKAssertFloatEquals(view.maximumContentSize.height, 0);
    },

    testInitWithSpec: function(){
        var spec = JSSpec.initWithDictionary({
            contentInsets: "5,10",
            alignment: "center",
            contentView: {
                tag: 1
            },
            maximumContentSize: "300,0"
        });
        var view = UIContainerView.initWithSpec(spec);
        TKAssertNotNull(view);
        TKAssertObjectEquals(view.contentInsets, JSInsets(5, 10));
        TKAssertInstance(view.contentView, UIView);
        TKAssertEquals(view.contentView.tag, 1);
        TKAssertExactEquals(view.subviews.length, 1);
        TKAssertExactEquals(view.subviews[0], view.contentView);
        TKAssertExactEquals(view.contentView.superview, view);
        TKAssertExactEquals(view.alignment, UIContainerView.Alignment.center);
        TKAssertFloatEquals(view.maximumContentSize.width, 300);
        TKAssertFloatEquals(view.maximumContentSize.height, 0);

        spec = JSSpec.initWithDictionary({});
        view = UIContainerView.initWithSpec(spec);
        TKAssertNotNull(view);
        TKAssertObjectEquals(view.contentInsets, JSInsets.Zero);
        TKAssertNull(view.contentView);
        TKAssertExactEquals(view.alignment, UIContainerView.Alignment.full);
        TKAssertFloatEquals(view.maximumContentSize.width, 0);
        TKAssertFloatEquals(view.maximumContentSize.height, 0);
    },

    testSetContentInsets: function(){
        var view = UIContainerView.init();
        view.layoutIfNeeded();
        TKAssertExactEquals(view.layer.needsLayout(), false);
        view.contentInsets = JSInsets(10);
        TKAssertExactEquals(view.layer.needsLayout(), true);
    },

    testSetMaximumContentSize: function(){
        var view = UIContainerView.init();
        view.layoutIfNeeded();
        TKAssertExactEquals(view.layer.needsLayout(), false);
        view.maximumContentSize = JSSize(300, 0);
        TKAssertExactEquals(view.layer.needsLayout(), true);
    },

    testSetAlignment: function(){
        var view = UIContainerView.init();
        view.layoutIfNeeded();
        TKAssertExactEquals(view.layer.needsLayout(), false);
        view.alignment = UIContainerView.Alignment.center;
        TKAssertExactEquals(view.layer.needsLayout(), true);
    },

    testSetContentView: function(){
        var view = UIContainerView.init();
        view.layoutIfNeeded();
        var contentView1 = UIView.init();
        var contentView2 = UIView.init();
        TKAssertExactEquals(view.layer.needsLayout(), false);
        view.contentView = contentView1;
        TKAssertExactEquals(view.layer.needsLayout(), true);
        TKAssertExactEquals(view.subviews.length, 1);
        TKAssertExactEquals(view.subviews[0], contentView1);
        TKAssertExactEquals(view.contentView, contentView1);
        TKAssertExactEquals(contentView1.superview, view);
        TKAssertNull(contentView2.superview);

        view.contentView = contentView2;
        TKAssertExactEquals(view.layer.needsLayout(), true);
        TKAssertExactEquals(view.subviews.length, 1);
        TKAssertExactEquals(view.subviews[0], contentView2);
        TKAssertExactEquals(view.contentView, contentView2);
        TKAssertExactEquals(contentView2.superview, view);
        TKAssertNull(contentView1.superview);
    },

    testLayoutSubviewsFull: function(){
        var view = UIContainerView.initWithFrame(JSRect(10, 20, 200, 300));
        var contentView = UIView.init();
        view.contentView = contentView;
        view.layoutIfNeeded();
        TKAssertEquals(view.contentView.frame.origin.x, 0);
        TKAssertEquals(view.contentView.frame.origin.y, 0);
        TKAssertEquals(view.contentView.frame.size.width, 200);
        TKAssertEquals(view.contentView.frame.size.height, 300);

        view.contentInsets = JSInsets(1, 2, 3, 4);
        view.layoutIfNeeded();
        TKAssertEquals(view.contentView.frame.origin.x, 2);
        TKAssertEquals(view.contentView.frame.origin.y, 1);
        TKAssertEquals(view.contentView.frame.size.width, 194);
        TKAssertEquals(view.contentView.frame.size.height, 296);

        view.bounds = JSRect(0, 0, 10, 20);
        view.layoutIfNeeded();
        TKAssertEquals(view.contentView.frame.origin.x, 2);
        TKAssertEquals(view.contentView.frame.origin.y, 1);
        TKAssertEquals(view.contentView.frame.size.width, 4);
        TKAssertEquals(view.contentView.frame.size.height, 16);
    },

    testLayoutSubviewsCenter: function(){
        var view = UIContainerView.initWithFrame(JSRect(10, 20, 200, 300));
        view.alignment = UIContainerView.Alignment.center;
        var contentView = UIContainerViewTestsCustomView.initWithSize(JSSize(30, 40));
        view.contentView = contentView;
        view.layoutIfNeeded();
        TKAssertEquals(view.contentView.position.x, 100);
        TKAssertEquals(view.contentView.position.y, 150);
        TKAssertEquals(view.contentView.bounds.size.width, 30);
        TKAssertEquals(view.contentView.bounds.size.height, 40);

        view.contentInsets = JSInsets(1, 2, 3, 4);
        view.layoutIfNeeded();
        TKAssertEquals(view.contentView.position.x, 99);
        TKAssertEquals(view.contentView.position.y, 149);
        TKAssertEquals(view.contentView.bounds.size.width, 30);
        TKAssertEquals(view.contentView.bounds.size.height, 40);

        view.bounds = JSRect(0, 0, 10, 20);
        view.layoutIfNeeded();
        TKAssertEquals(view.contentView.frame.origin.x, 2);
        TKAssertEquals(view.contentView.frame.origin.y, 1);
        TKAssertEquals(view.contentView.frame.size.width, 4);
        TKAssertEquals(view.contentView.frame.size.height, 16);
    }

});

JSClass("UIContainerViewTestsCustomView", UIView, {
    size: null,

    initWithSize: function(size){
        this.init();
        this.size = JSSize(size);
    },

    getIntrinsicSize: function(){
        return JSSize(this.size);
    },

    sizeToFitSize: function(maxSize){
        var size = JSSize(this.size);
        if (size.width > maxSize.width){
            size.width = maxSize.width;
        }
        if (size.height > maxSize.height){
            size.height = maxSize.height;
        }
        this.bounds = JSRect(JSPoint.Zero, size);
    }

});