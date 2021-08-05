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

// #import UIKit
// #import TestKit
// #import UIKitTesting
"use strict";

JSClass("UIStackViewTests", TKTestSuite, {

    app: null,
    windowServer: null,

    setup: function(){
        this.windowServer = UIMockWindowServer.init();
        var bundle = JSBundle.initWithDictionary({Info: {}});
        this.app = UIApplication.initWithBundle(bundle, this.windowServer);
        JSFont.registerSystemFontDescriptor(UIMockFontDescriptor.init());
    },

    teardown: function(){
        this.app.deinit();
        this.app = null;
    },

    testInitWithFrame: function(){
        var stackView = UIStackView.initWithFrame(JSRect(0, 0, 100, 200));
        TKAssertExactEquals(stackView.arrangeAllSubviews, true);
        TKAssertObjectEquals(stackView.contentInsets, JSInsets.Zero);
    },

    testInitWithArrangedSubviews: function(){
        var stackView = UIStackView.initWithArrangedSubviews([]);
        TKAssertExactEquals(stackView.arrangeAllSubviews, false);
        TKAssertObjectEquals(stackView.contentInsets, JSInsets.Zero);

        var view1 = UIView.init();
        var view2 = UIView.init();
        stackView = UIStackView.initWithArrangedSubviews([view1, view2]);
        TKAssertExactEquals(stackView.arrangeAllSubviews, false);
        TKAssertEquals(stackView.subviews.length, 2);
        TKAssertEquals(stackView.arrangedSubviews.length, 2);
        TKAssertExactEquals(stackView.arrangedSubviews[0], view1);
        TKAssertExactEquals(stackView.arrangedSubviews[1], view2);
    },

    testInitWithSpec: function(){
        var spec = JSSpec.initWithDictionary({});
        var stackView = UIStackView.initWithSpec(spec);
        TKAssertExactEquals(stackView.arrangeAllSubviews, true);
        TKAssertObjectEquals(stackView.contentInsets, JSInsets.Zero);

        spec = JSSpec.initWithDictionary({
            subviews: [{}, {}],
            contentInsets: "5,10"
        });
        stackView = UIStackView.initWithSpec(spec);
        TKAssertExactEquals(stackView.arrangeAllSubviews, true);
        TKAssertObjectEquals(stackView.contentInsets, JSInsets(5, 10));
        TKAssertEquals(stackView.subviews.length, 2);
        TKAssertEquals(stackView.arrangedSubviews.length, 2);

        spec = JSSpec.initWithDictionary({
            arrangedSubviews: [{}, {}]
        });
        stackView = UIStackView.initWithSpec(spec);
        TKAssertExactEquals(stackView.arrangeAllSubviews, false);
        TKAssertObjectEquals(stackView.contentInsets, JSInsets.Zero);
        TKAssertEquals(stackView.subviews.length, 2);
        TKAssertEquals(stackView.arrangedSubviews.length, 2);

        spec = JSSpec.initWithDictionary({
            arrangedSubviews: [{tag: 2}, {tag: 3}],
            subviews: [{tag: 1}]
        });
        stackView = UIStackView.initWithSpec(spec);
        TKAssertExactEquals(stackView.arrangeAllSubviews, false);
        TKAssertObjectEquals(stackView.contentInsets, JSInsets.Zero);
        TKAssertEquals(stackView.subviews.length, 3);
        TKAssertEquals(stackView.subviews[0].tag, 1);
        TKAssertEquals(stackView.subviews[1].tag, 2);
        TKAssertEquals(stackView.subviews[2].tag, 3);
        TKAssertEquals(stackView.arrangedSubviews.length, 2);
        TKAssertEquals(stackView.arrangedSubviews[0].tag, 2);
        TKAssertEquals(stackView.arrangedSubviews[1].tag, 3);
    },

    testAddSubview: function(){
        var stackView = UIStackView.init();
        var view1 = UIView.init();
        stackView.addSubview(view1);
        TKAssertEquals(stackView.subviews.length, 1);
        TKAssertEquals(stackView.arrangedSubviews.length, 1);
        TKAssertExactEquals(stackView.subviews[0], view1);
        TKAssertExactEquals(stackView.arrangedSubviews[0], view1);

        stackView = UIStackView.initWithArrangedSubviews([]);
        view1 = UIView.init();
        stackView.addSubview(view1);
        TKAssertEquals(stackView.subviews.length, 1);
        TKAssertEquals(stackView.arrangedSubviews.length, 0);
        TKAssertExactEquals(stackView.subviews[0], view1);
    },

    testInsertSubviewAtIndex: function(){
        var stackView = UIStackView.init();
        var view1 = UIView.init();
        stackView.insertSubviewAtIndex(view1, 0);
        TKAssertEquals(stackView.subviews.length, 1);
        TKAssertEquals(stackView.arrangedSubviews.length, 1);
        TKAssertExactEquals(stackView.subviews[0], view1);
        TKAssertExactEquals(stackView.arrangedSubviews[0], view1);

        stackView = UIStackView.initWithArrangedSubviews([]);
        view1 = UIView.init();
        stackView.insertSubviewAtIndex(view1, 0);
        TKAssertEquals(stackView.subviews.length, 1);
        TKAssertEquals(stackView.arrangedSubviews.length, 0);
        TKAssertExactEquals(stackView.subviews[0], view1);
    },

    testInsertSubviewBelowSibling: function(){
        var stackView = UIStackView.init();
        var view1 = UIView.init();
        var view2 = UIView.init();
        stackView.addSubview(view1);
        stackView.insertSubviewBelowSibling(view2, view1);
        TKAssertEquals(stackView.subviews.length, 2);
        TKAssertEquals(stackView.arrangedSubviews.length, 2);
        TKAssertExactEquals(stackView.subviews[0], view2);
        TKAssertExactEquals(stackView.subviews[1], view1);
        TKAssertExactEquals(stackView.arrangedSubviews[0], view2);
        TKAssertExactEquals(stackView.arrangedSubviews[1], view1);

        stackView = UIStackView.initWithArrangedSubviews([]);
        view1 = UIView.init();
        view2 = UIView.init();
        stackView.addSubview(view1);
        stackView.insertSubviewBelowSibling(view2, view1);
        TKAssertEquals(stackView.subviews.length, 2);
        TKAssertEquals(stackView.arrangedSubviews.length, 0);
        TKAssertExactEquals(stackView.subviews[0], view2);
        TKAssertExactEquals(stackView.subviews[1], view1);
    },

    testInsertSubviewAboveSibling: function(){
        var stackView = UIStackView.init();
        var view1 = UIView.init();
        var view2 = UIView.init();
        stackView.addSubview(view1);
        stackView.insertSubviewAboveSibling(view2, view1);
        TKAssertEquals(stackView.subviews.length, 2);
        TKAssertEquals(stackView.arrangedSubviews.length, 2);
        TKAssertExactEquals(stackView.subviews[0], view1);
        TKAssertExactEquals(stackView.subviews[1], view2);
        TKAssertExactEquals(stackView.arrangedSubviews[0], view1);
        TKAssertExactEquals(stackView.arrangedSubviews[1], view2);

        stackView = UIStackView.initWithArrangedSubviews([]);
        view1 = UIView.init();
        view2 = UIView.init();
        stackView.addSubview(view1);
        stackView.insertSubviewAboveSibling(view2, view1);
        TKAssertEquals(stackView.subviews.length, 2);
        TKAssertEquals(stackView.arrangedSubviews.length, 0);
        TKAssertExactEquals(stackView.subviews[0], view1);
        TKAssertExactEquals(stackView.subviews[1], view2);
    },

    testRemoveSubview: function(){
        var stackView = UIStackView.init();
        var view1 = UIView.init();
        var view2 = UIView.init();
        stackView.addSubview(view1);
        stackView.addSubview(view2);
        stackView.removeSubview(view1);
        TKAssertEquals(stackView.subviews.length, 1);
        TKAssertEquals(stackView.arrangedSubviews.length, 1);
        TKAssertExactEquals(stackView.subviews[0], view2);
        TKAssertExactEquals(stackView.arrangedSubviews[0], view2);

        stackView = UIStackView.initWithArrangedSubviews([]);
        view1 = UIView.init();
        view2 = UIView.init();
        stackView.addSubview(view1);
        stackView.addSubview(view2);
        stackView.removeSubview(view1);
        TKAssertEquals(stackView.subviews.length, 1);
        TKAssertEquals(stackView.arrangedSubviews.length, 0);
        TKAssertExactEquals(stackView.subviews[0], view2);
    },

    testAddArrangedSubview: function(){
        var stackView = UIStackView.init();
        var view1 = UIView.init();
        stackView.addArrangedSubview(view1);
        TKAssertEquals(stackView.subviews.length, 1);
        TKAssertEquals(stackView.arrangedSubviews.length, 1);
        TKAssertExactEquals(stackView.subviews[0], view1);
        TKAssertExactEquals(stackView.arrangedSubviews[0], view1);

        stackView = UIStackView.initWithArrangedSubviews([]);
        view1 = UIView.init();
        stackView.addArrangedSubview(view1);
        TKAssertEquals(stackView.subviews.length, 1);
        TKAssertEquals(stackView.arrangedSubviews.length, 1);
        TKAssertExactEquals(stackView.subviews[0], view1);
        TKAssertExactEquals(stackView.arrangedSubviews[0], view1);
    },

    testInsertArrangedSubviewAtIndex: function(){
        var stackView = UIStackView.init();
        var view1 = UIView.init();
        var view2 = UIView.init();
        stackView.insertArrangedSubviewAtIndex(view1, 0);
        stackView.insertArrangedSubviewAtIndex(view2, 0);
        TKAssertEquals(stackView.subviews.length, 2);
        TKAssertEquals(stackView.arrangedSubviews.length, 2);
        TKAssertExactEquals(stackView.subviews[0], view2);
        TKAssertExactEquals(stackView.subviews[1], view1);
        TKAssertExactEquals(stackView.arrangedSubviews[0], view2);
        TKAssertExactEquals(stackView.arrangedSubviews[1], view1);

        stackView = UIStackView.initWithArrangedSubviews([]);
        view1 = UIView.init();
        view2 = UIView.init();
        stackView.insertArrangedSubviewAtIndex(view1, 0);
        stackView.insertArrangedSubviewAtIndex(view2, 0);
        TKAssertEquals(stackView.subviews.length, 2);
        TKAssertEquals(stackView.arrangedSubviews.length, 2);
        TKAssertExactEquals(stackView.subviews[0], view1);
        TKAssertExactEquals(stackView.subviews[1], view2);
        TKAssertExactEquals(stackView.arrangedSubviews[0], view2);
        TKAssertExactEquals(stackView.arrangedSubviews[1], view1);
    },

    testRemoveArrangedSubview: function(){
        var stackView = UIStackView.init();
        var view1 = UIView.init();
        var view2 = UIView.init();
        stackView.addArrangedSubview(view1);
        stackView.addArrangedSubview(view2);
        stackView.removeArrangedSubview(view1);
        TKAssertEquals(stackView.subviews.length, 1);
        TKAssertEquals(stackView.arrangedSubviews.length, 1);
        TKAssertExactEquals(stackView.subviews[0], view2);
        TKAssertExactEquals(stackView.arrangedSubviews[0], view2);

        stackView = UIStackView.initWithArrangedSubviews([]);
        view1 = UIView.init();
        view2 = UIView.init();
        stackView.addArrangedSubview(view1);
        stackView.addArrangedSubview(view2);
        stackView.removeArrangedSubview(view1);
        TKAssertEquals(stackView.subviews.length, 2);
        TKAssertEquals(stackView.arrangedSubviews.length, 1);
        TKAssertExactEquals(stackView.subviews[0], view1);
        TKAssertExactEquals(stackView.subviews[1], view2);
        TKAssertExactEquals(stackView.arrangedSubviews[0], view2);
    },

    testLayoutSubviewsVerticalNoDistributionFullAlignment: function(){
        var stackView = UIStackView.init();
        stackView.axis = UIStackView.Axis.vertical;
        stackView.distribution = UIStackView.Distribution.none;
        stackView.alignment = UIStackView.Alignment.full;

        var view1 = UIStackViewTestView.initWithIntrinsicSize(JSSize(100, 20));
        var view2 = UIStackViewTestView.initWithIntrinsicSize(JSSize(200, 30));
        var view3 = UIStackViewTestView.initWithIntrinsicSize(JSSize(300, 40));

        stackView.addSubview(view1);
        stackView.addSubview(view2);
        stackView.addSubview(view3);

        stackView.bounds = JSRect(0, 0, 200, 300);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 0);
        TKAssertEquals(view1.frame.origin.y, 0);
        TKAssertEquals(view1.frame.size.width, 200);
        TKAssertEquals(view1.frame.size.height, 20);
        TKAssertEquals(view2.frame.origin.x, 0);
        TKAssertEquals(view2.frame.origin.y, 20);
        TKAssertEquals(view2.frame.size.width, 200);
        TKAssertEquals(view2.frame.size.height, 30);
        TKAssertEquals(view3.frame.origin.x, 0);
        TKAssertEquals(view3.frame.origin.y, 50);
        TKAssertEquals(view3.frame.size.width, 200);
        TKAssertEquals(view3.frame.size.height, 40);

        stackView.contentInsets = JSInsets(3, 4, 5, 6);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 4);
        TKAssertEquals(view1.frame.origin.y, 3);
        TKAssertEquals(view1.frame.size.width, 190);
        TKAssertEquals(view1.frame.size.height, 20);
        TKAssertEquals(view2.frame.origin.x, 4);
        TKAssertEquals(view2.frame.origin.y, 23);
        TKAssertEquals(view2.frame.size.width, 190);
        TKAssertEquals(view2.frame.size.height, 30);
        TKAssertEquals(view3.frame.origin.x, 4);
        TKAssertEquals(view3.frame.origin.y, 53);
        TKAssertEquals(view3.frame.size.width, 190);
        TKAssertEquals(view3.frame.size.height, 40);

        stackView.viewSpacing = 10;
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 4);
        TKAssertEquals(view1.frame.origin.y, 3);
        TKAssertEquals(view1.frame.size.width, 190);
        TKAssertEquals(view1.frame.size.height, 20);
        TKAssertEquals(view2.frame.origin.x, 4);
        TKAssertEquals(view2.frame.origin.y, 33);
        TKAssertEquals(view2.frame.size.width, 190);
        TKAssertEquals(view2.frame.size.height, 30);
        TKAssertEquals(view3.frame.origin.x, 4);
        TKAssertEquals(view3.frame.origin.y, 73);
        TKAssertEquals(view3.frame.size.width, 190);
        TKAssertEquals(view3.frame.size.height, 40);

        stackView.bounds = JSRect(0, 0, 100, 20);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 4);
        TKAssertEquals(view1.frame.origin.y, 3);
        TKAssertEquals(view1.frame.size.width, 90);
        TKAssertEquals(view1.frame.size.height, 20);
        TKAssertEquals(view2.frame.origin.x, 4);
        TKAssertEquals(view2.frame.origin.y, 33);
        TKAssertEquals(view2.frame.size.width, 90);
        TKAssertEquals(view2.frame.size.height, 30);
        TKAssertEquals(view3.frame.origin.x, 4);
        TKAssertEquals(view3.frame.origin.y, 73);
        TKAssertEquals(view3.frame.size.width, 90);
        TKAssertEquals(view3.frame.size.height, 40);
    },

    testLayoutSubviewsVerticalNoDistributionLeadingAlignment: function(){
        var stackView = UIStackView.init();
        stackView.axis = UIStackView.Axis.vertical;
        stackView.distribution = UIStackView.Distribution.none;
        stackView.alignment = UIStackView.Alignment.leading;

        var view1 = UIStackViewTestView.initWithIntrinsicSize(JSSize(100, 20));
        var view2 = UIStackViewTestView.initWithIntrinsicSize(JSSize(200, 30));
        var view3 = UIStackViewTestView.initWithIntrinsicSize(JSSize(300, 40));

        stackView.addSubview(view1);
        stackView.addSubview(view2);
        stackView.addSubview(view3);

        stackView.bounds = JSRect(0, 0, 200, 300);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 0);
        TKAssertEquals(view1.frame.origin.y, 0);
        TKAssertEquals(view1.frame.size.width, 100);
        TKAssertEquals(view1.frame.size.height, 20);
        TKAssertEquals(view2.frame.origin.x, 0);
        TKAssertEquals(view2.frame.origin.y, 20);
        TKAssertEquals(view2.frame.size.width, 200);
        TKAssertEquals(view2.frame.size.height, 30);
        TKAssertEquals(view3.frame.origin.x, 0);
        TKAssertEquals(view3.frame.origin.y, 50);
        TKAssertEquals(view3.frame.size.width, 200);
        TKAssertEquals(view3.frame.size.height, 40);

        stackView.contentInsets = JSInsets(3, 4, 5, 6);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 4);
        TKAssertEquals(view1.frame.origin.y, 3);
        TKAssertEquals(view1.frame.size.width, 100);
        TKAssertEquals(view1.frame.size.height, 20);
        TKAssertEquals(view2.frame.origin.x, 4);
        TKAssertEquals(view2.frame.origin.y, 23);
        TKAssertEquals(view2.frame.size.width, 190);
        TKAssertEquals(view2.frame.size.height, 30);
        TKAssertEquals(view3.frame.origin.x, 4);
        TKAssertEquals(view3.frame.origin.y, 53);
        TKAssertEquals(view3.frame.size.width, 190);
        TKAssertEquals(view3.frame.size.height, 40);

        stackView.viewSpacing = 10;
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 4);
        TKAssertEquals(view1.frame.origin.y, 3);
        TKAssertEquals(view1.frame.size.width, 100);
        TKAssertEquals(view1.frame.size.height, 20);
        TKAssertEquals(view2.frame.origin.x, 4);
        TKAssertEquals(view2.frame.origin.y, 33);
        TKAssertEquals(view2.frame.size.width, 190);
        TKAssertEquals(view2.frame.size.height, 30);
        TKAssertEquals(view3.frame.origin.x, 4);
        TKAssertEquals(view3.frame.origin.y, 73);
        TKAssertEquals(view3.frame.size.width, 190);
        TKAssertEquals(view3.frame.size.height, 40);

        stackView.bounds = JSRect(0, 0, 100, 20);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 4);
        TKAssertEquals(view1.frame.origin.y, 3);
        TKAssertEquals(view1.frame.size.width, 90);
        TKAssertEquals(view1.frame.size.height, 20);
        TKAssertEquals(view2.frame.origin.x, 4);
        TKAssertEquals(view2.frame.origin.y, 33);
        TKAssertEquals(view2.frame.size.width, 90);
        TKAssertEquals(view2.frame.size.height, 30);
        TKAssertEquals(view3.frame.origin.x, 4);
        TKAssertEquals(view3.frame.origin.y, 73);
        TKAssertEquals(view3.frame.size.width, 90);
        TKAssertEquals(view3.frame.size.height, 40);
    },

    testLayoutSubviewsVerticalNoDistributionCenterAlignment: function(){
        var stackView = UIStackView.init();
        stackView.axis = UIStackView.Axis.vertical;
        stackView.distribution = UIStackView.Distribution.none;
        stackView.alignment = UIStackView.Alignment.center;

        var view1 = UIStackViewTestView.initWithIntrinsicSize(JSSize(100, 20));
        var view2 = UIStackViewTestView.initWithIntrinsicSize(JSSize(200, 30));
        var view3 = UIStackViewTestView.initWithIntrinsicSize(JSSize(300, 40));

        stackView.addSubview(view1);
        stackView.addSubview(view2);
        stackView.addSubview(view3);

        stackView.bounds = JSRect(0, 0, 200, 300);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 50);
        TKAssertEquals(view1.frame.origin.y, 0);
        TKAssertEquals(view1.frame.size.width, 100);
        TKAssertEquals(view1.frame.size.height, 20);
        TKAssertEquals(view2.frame.origin.x, 0);
        TKAssertEquals(view2.frame.origin.y, 20);
        TKAssertEquals(view2.frame.size.width, 200);
        TKAssertEquals(view2.frame.size.height, 30);
        TKAssertEquals(view3.frame.origin.x, 0);
        TKAssertEquals(view3.frame.origin.y, 50);
        TKAssertEquals(view3.frame.size.width, 200);
        TKAssertEquals(view3.frame.size.height, 40);

        stackView.contentInsets = JSInsets(3, 4, 5, 6);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 49);
        TKAssertEquals(view1.frame.origin.y, 3);
        TKAssertEquals(view1.frame.size.width, 100);
        TKAssertEquals(view1.frame.size.height, 20);
        TKAssertEquals(view2.frame.origin.x, 4);
        TKAssertEquals(view2.frame.origin.y, 23);
        TKAssertEquals(view2.frame.size.width, 190);
        TKAssertEquals(view2.frame.size.height, 30);
        TKAssertEquals(view3.frame.origin.x, 4);
        TKAssertEquals(view3.frame.origin.y, 53);
        TKAssertEquals(view3.frame.size.width, 190);
        TKAssertEquals(view3.frame.size.height, 40);

        stackView.viewSpacing = 10;
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 49);
        TKAssertEquals(view1.frame.origin.y, 3);
        TKAssertEquals(view1.frame.size.width, 100);
        TKAssertEquals(view1.frame.size.height, 20);
        TKAssertEquals(view2.frame.origin.x, 4);
        TKAssertEquals(view2.frame.origin.y, 33);
        TKAssertEquals(view2.frame.size.width, 190);
        TKAssertEquals(view2.frame.size.height, 30);
        TKAssertEquals(view3.frame.origin.x, 4);
        TKAssertEquals(view3.frame.origin.y, 73);
        TKAssertEquals(view3.frame.size.width, 190);
        TKAssertEquals(view3.frame.size.height, 40);

        stackView.bounds = JSRect(0, 0, 100, 20);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 4);
        TKAssertEquals(view1.frame.origin.y, 3);
        TKAssertEquals(view1.frame.size.width, 90);
        TKAssertEquals(view1.frame.size.height, 20);
        TKAssertEquals(view2.frame.origin.x, 4);
        TKAssertEquals(view2.frame.origin.y, 33);
        TKAssertEquals(view2.frame.size.width, 90);
        TKAssertEquals(view2.frame.size.height, 30);
        TKAssertEquals(view3.frame.origin.x, 4);
        TKAssertEquals(view3.frame.origin.y, 73);
        TKAssertEquals(view3.frame.size.width, 90);
        TKAssertEquals(view3.frame.size.height, 40);
    },

    testLayoutSubviewsVerticalNoDistributionTrailingAlignment: function(){
        var stackView = UIStackView.init();
        stackView.axis = UIStackView.Axis.vertical;
        stackView.distribution = UIStackView.Distribution.none;
        stackView.alignment = UIStackView.Alignment.trailing;

        var view1 = UIStackViewTestView.initWithIntrinsicSize(JSSize(100, 20));
        var view2 = UIStackViewTestView.initWithIntrinsicSize(JSSize(200, 30));
        var view3 = UIStackViewTestView.initWithIntrinsicSize(JSSize(300, 40));

        stackView.addSubview(view1);
        stackView.addSubview(view2);
        stackView.addSubview(view3);

        stackView.bounds = JSRect(0, 0, 200, 300);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 100);
        TKAssertEquals(view1.frame.origin.y, 0);
        TKAssertEquals(view1.frame.size.width, 100);
        TKAssertEquals(view1.frame.size.height, 20);
        TKAssertEquals(view2.frame.origin.x, 0);
        TKAssertEquals(view2.frame.origin.y, 20);
        TKAssertEquals(view2.frame.size.width, 200);
        TKAssertEquals(view2.frame.size.height, 30);
        TKAssertEquals(view3.frame.origin.x, 0);
        TKAssertEquals(view3.frame.origin.y, 50);
        TKAssertEquals(view3.frame.size.width, 200);
        TKAssertEquals(view3.frame.size.height, 40);

        stackView.contentInsets = JSInsets(3, 4, 5, 6);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 94);
        TKAssertEquals(view1.frame.origin.y, 3);
        TKAssertEquals(view1.frame.size.width, 100);
        TKAssertEquals(view1.frame.size.height, 20);
        TKAssertEquals(view2.frame.origin.x, 4);
        TKAssertEquals(view2.frame.origin.y, 23);
        TKAssertEquals(view2.frame.size.width, 190);
        TKAssertEquals(view2.frame.size.height, 30);
        TKAssertEquals(view3.frame.origin.x, 4);
        TKAssertEquals(view3.frame.origin.y, 53);
        TKAssertEquals(view3.frame.size.width, 190);
        TKAssertEquals(view3.frame.size.height, 40);

        stackView.viewSpacing = 10;
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 94);
        TKAssertEquals(view1.frame.origin.y, 3);
        TKAssertEquals(view1.frame.size.width, 100);
        TKAssertEquals(view1.frame.size.height, 20);
        TKAssertEquals(view2.frame.origin.x, 4);
        TKAssertEquals(view2.frame.origin.y, 33);
        TKAssertEquals(view2.frame.size.width, 190);
        TKAssertEquals(view2.frame.size.height, 30);
        TKAssertEquals(view3.frame.origin.x, 4);
        TKAssertEquals(view3.frame.origin.y, 73);
        TKAssertEquals(view3.frame.size.width, 190);
        TKAssertEquals(view3.frame.size.height, 40);

        stackView.bounds = JSRect(0, 0, 100, 20);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 4);
        TKAssertEquals(view1.frame.origin.y, 3);
        TKAssertEquals(view1.frame.size.width, 90);
        TKAssertEquals(view1.frame.size.height, 20);
        TKAssertEquals(view2.frame.origin.x, 4);
        TKAssertEquals(view2.frame.origin.y, 33);
        TKAssertEquals(view2.frame.size.width, 90);
        TKAssertEquals(view2.frame.size.height, 30);
        TKAssertEquals(view3.frame.origin.x, 4);
        TKAssertEquals(view3.frame.origin.y, 73);
        TKAssertEquals(view3.frame.size.width, 90);
        TKAssertEquals(view3.frame.size.height, 40);
    },

    testLayoutSubviewsVerticalEqualDistributionFullAlignment: function(){
        var stackView = UIStackView.init();
        stackView.axis = UIStackView.Axis.vertical;
        stackView.distribution = UIStackView.Distribution.equal;
        stackView.alignment = UIStackView.Alignment.full;

        var view1 = UIStackViewTestView.initWithIntrinsicSize(JSSize(100, 20));
        var view2 = UIStackViewTestView.initWithIntrinsicSize(JSSize(200, 30));
        var view3 = UIStackViewTestView.initWithIntrinsicSize(JSSize(300, 40));

        stackView.addSubview(view1);
        stackView.addSubview(view2);
        stackView.addSubview(view3);

        stackView.bounds = JSRect(0, 0, 200, 300);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 0);
        TKAssertEquals(view1.frame.origin.y, 0);
        TKAssertEquals(view1.frame.size.width, 200);
        TKAssertEquals(view1.frame.size.height, 100);
        TKAssertEquals(view2.frame.origin.x, 0);
        TKAssertEquals(view2.frame.origin.y, 100);
        TKAssertEquals(view2.frame.size.width, 200);
        TKAssertEquals(view2.frame.size.height, 100);
        TKAssertEquals(view3.frame.origin.x, 0);
        TKAssertEquals(view3.frame.origin.y, 200);
        TKAssertEquals(view3.frame.size.width, 200);
        TKAssertEquals(view3.frame.size.height, 100);

        stackView.contentInsets = JSInsets(3, 4, 9, 6);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 4);
        TKAssertEquals(view1.frame.origin.y, 3);
        TKAssertEquals(view1.frame.size.width, 190);
        TKAssertEquals(view1.frame.size.height, 96);
        TKAssertEquals(view2.frame.origin.x, 4);
        TKAssertEquals(view2.frame.origin.y, 99);
        TKAssertEquals(view2.frame.size.width, 190);
        TKAssertEquals(view2.frame.size.height, 96);
        TKAssertEquals(view3.frame.origin.x, 4);
        TKAssertEquals(view3.frame.origin.y, 195);
        TKAssertEquals(view3.frame.size.width, 190);
        TKAssertEquals(view3.frame.size.height, 96);

        stackView.viewSpacing = 12;
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 4);
        TKAssertEquals(view1.frame.origin.y, 3);
        TKAssertEquals(view1.frame.size.width, 190);
        TKAssertEquals(view1.frame.size.height, 88);
        TKAssertEquals(view2.frame.origin.x, 4);
        TKAssertEquals(view2.frame.origin.y, 103);
        TKAssertEquals(view2.frame.size.width, 190);
        TKAssertEquals(view2.frame.size.height, 88);
        TKAssertEquals(view3.frame.origin.x, 4);
        TKAssertEquals(view3.frame.origin.y, 203);
        TKAssertEquals(view3.frame.size.width, 190);
        TKAssertEquals(view3.frame.size.height, 88);

        stackView.bounds = JSRect(0, 0, 100, 39);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 4);
        TKAssertEquals(view1.frame.origin.y, 3);
        TKAssertEquals(view1.frame.size.width, 90);
        TKAssertEquals(view1.frame.size.height, 1);
        TKAssertEquals(view2.frame.origin.x, 4);
        TKAssertEquals(view2.frame.origin.y, 16);
        TKAssertEquals(view2.frame.size.width, 90);
        TKAssertEquals(view2.frame.size.height, 1);
        TKAssertEquals(view3.frame.origin.x, 4);
        TKAssertEquals(view3.frame.origin.y, 29);
        TKAssertEquals(view3.frame.size.width, 90);
        TKAssertEquals(view3.frame.size.height, 1);

        stackView.bounds = JSRect(0, 0, 100, 30);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 4);
        TKAssertEquals(view1.frame.origin.y, 3);
        TKAssertEquals(view1.frame.size.width, 90);
        TKAssertEquals(view1.frame.size.height, 0);
        TKAssertEquals(view2.frame.origin.x, 4);
        TKAssertEquals(view2.frame.origin.y, 15);
        TKAssertEquals(view2.frame.size.width, 90);
        TKAssertEquals(view2.frame.size.height, 0);
        TKAssertEquals(view3.frame.origin.x, 4);
        TKAssertEquals(view3.frame.origin.y, 27);
        TKAssertEquals(view3.frame.size.width, 90);
        TKAssertEquals(view3.frame.size.height, 0);
    },

    testLayoutSubviewsVerticalEqualDistributionLeadingAlignment: function(){
        var stackView = UIStackView.init();
        stackView.axis = UIStackView.Axis.vertical;
        stackView.distribution = UIStackView.Distribution.equal;
        stackView.alignment = UIStackView.Alignment.leading;

        var view1 = UIStackViewTestView.initWithIntrinsicSize(JSSize(100, 20));
        var view2 = UIStackViewTestView.initWithIntrinsicSize(JSSize(200, 30));
        var view3 = UIStackViewTestView.initWithIntrinsicSize(JSSize(300, 40));

        stackView.addSubview(view1);
        stackView.addSubview(view2);
        stackView.addSubview(view3);

        stackView.bounds = JSRect(0, 0, 200, 300);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 0);
        TKAssertEquals(view1.frame.origin.y, 0);
        TKAssertEquals(view1.frame.size.width, 100);
        TKAssertEquals(view1.frame.size.height, 100);
        TKAssertEquals(view2.frame.origin.x, 0);
        TKAssertEquals(view2.frame.origin.y, 100);
        TKAssertEquals(view2.frame.size.width, 200);
        TKAssertEquals(view2.frame.size.height, 100);
        TKAssertEquals(view3.frame.origin.x, 0);
        TKAssertEquals(view3.frame.origin.y, 200);
        TKAssertEquals(view3.frame.size.width, 200);
        TKAssertEquals(view3.frame.size.height, 100);

        stackView.contentInsets = JSInsets(3, 4, 9, 6);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 4);
        TKAssertEquals(view1.frame.origin.y, 3);
        TKAssertEquals(view1.frame.size.width, 100);
        TKAssertEquals(view1.frame.size.height, 96);
        TKAssertEquals(view2.frame.origin.x, 4);
        TKAssertEquals(view2.frame.origin.y, 99);
        TKAssertEquals(view2.frame.size.width, 190);
        TKAssertEquals(view2.frame.size.height, 96);
        TKAssertEquals(view3.frame.origin.x, 4);
        TKAssertEquals(view3.frame.origin.y, 195);
        TKAssertEquals(view3.frame.size.width, 190);
        TKAssertEquals(view3.frame.size.height, 96);

        stackView.viewSpacing = 12;
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 4);
        TKAssertEquals(view1.frame.origin.y, 3);
        TKAssertEquals(view1.frame.size.width, 100);
        TKAssertEquals(view1.frame.size.height, 88);
        TKAssertEquals(view2.frame.origin.x, 4);
        TKAssertEquals(view2.frame.origin.y, 103);
        TKAssertEquals(view2.frame.size.width, 190);
        TKAssertEquals(view2.frame.size.height, 88);
        TKAssertEquals(view3.frame.origin.x, 4);
        TKAssertEquals(view3.frame.origin.y, 203);
        TKAssertEquals(view3.frame.size.width, 190);
        TKAssertEquals(view3.frame.size.height, 88);

        stackView.bounds = JSRect(0, 0, 100, 39);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 4);
        TKAssertEquals(view1.frame.origin.y, 3);
        TKAssertEquals(view1.frame.size.width, 90);
        TKAssertEquals(view1.frame.size.height, 1);
        TKAssertEquals(view2.frame.origin.x, 4);
        TKAssertEquals(view2.frame.origin.y, 16);
        TKAssertEquals(view2.frame.size.width, 90);
        TKAssertEquals(view2.frame.size.height, 1);
        TKAssertEquals(view3.frame.origin.x, 4);
        TKAssertEquals(view3.frame.origin.y, 29);
        TKAssertEquals(view3.frame.size.width, 90);
        TKAssertEquals(view3.frame.size.height, 1);

        stackView.bounds = JSRect(0, 0, 100, 30);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 4);
        TKAssertEquals(view1.frame.origin.y, 3);
        TKAssertEquals(view1.frame.size.width, 90);
        TKAssertEquals(view1.frame.size.height, 0);
        TKAssertEquals(view2.frame.origin.x, 4);
        TKAssertEquals(view2.frame.origin.y, 15);
        TKAssertEquals(view2.frame.size.width, 90);
        TKAssertEquals(view2.frame.size.height, 0);
        TKAssertEquals(view3.frame.origin.x, 4);
        TKAssertEquals(view3.frame.origin.y, 27);
        TKAssertEquals(view3.frame.size.width, 90);
        TKAssertEquals(view3.frame.size.height, 0);
    },

    testLayoutSubviewsVerticalEqualDistributionCenterAlignment: function(){
        var stackView = UIStackView.init();
        stackView.axis = UIStackView.Axis.vertical;
        stackView.distribution = UIStackView.Distribution.equal;
        stackView.alignment = UIStackView.Alignment.center;

        var view1 = UIStackViewTestView.initWithIntrinsicSize(JSSize(100, 20));
        var view2 = UIStackViewTestView.initWithIntrinsicSize(JSSize(200, 30));
        var view3 = UIStackViewTestView.initWithIntrinsicSize(JSSize(300, 40));

        stackView.addSubview(view1);
        stackView.addSubview(view2);
        stackView.addSubview(view3);

        stackView.bounds = JSRect(0, 0, 200, 300);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 50);
        TKAssertEquals(view1.frame.origin.y, 0);
        TKAssertEquals(view1.frame.size.width, 100);
        TKAssertEquals(view1.frame.size.height, 100);
        TKAssertEquals(view2.frame.origin.x, 0);
        TKAssertEquals(view2.frame.origin.y, 100);
        TKAssertEquals(view2.frame.size.width, 200);
        TKAssertEquals(view2.frame.size.height, 100);
        TKAssertEquals(view3.frame.origin.x, 0);
        TKAssertEquals(view3.frame.origin.y, 200);
        TKAssertEquals(view3.frame.size.width, 200);
        TKAssertEquals(view3.frame.size.height, 100);

        stackView.contentInsets = JSInsets(3, 4, 9, 6);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 49);
        TKAssertEquals(view1.frame.origin.y, 3);
        TKAssertEquals(view1.frame.size.width, 100);
        TKAssertEquals(view1.frame.size.height, 96);
        TKAssertEquals(view2.frame.origin.x, 4);
        TKAssertEquals(view2.frame.origin.y, 99);
        TKAssertEquals(view2.frame.size.width, 190);
        TKAssertEquals(view2.frame.size.height, 96);
        TKAssertEquals(view3.frame.origin.x, 4);
        TKAssertEquals(view3.frame.origin.y, 195);
        TKAssertEquals(view3.frame.size.width, 190);
        TKAssertEquals(view3.frame.size.height, 96);

        stackView.viewSpacing = 12;
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 49);
        TKAssertEquals(view1.frame.origin.y, 3);
        TKAssertEquals(view1.frame.size.width, 100);
        TKAssertEquals(view1.frame.size.height, 88);
        TKAssertEquals(view2.frame.origin.x, 4);
        TKAssertEquals(view2.frame.origin.y, 103);
        TKAssertEquals(view2.frame.size.width, 190);
        TKAssertEquals(view2.frame.size.height, 88);
        TKAssertEquals(view3.frame.origin.x, 4);
        TKAssertEquals(view3.frame.origin.y, 203);
        TKAssertEquals(view3.frame.size.width, 190);
        TKAssertEquals(view3.frame.size.height, 88);

        stackView.bounds = JSRect(0, 0, 100, 39);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 4);
        TKAssertEquals(view1.frame.origin.y, 3);
        TKAssertEquals(view1.frame.size.width, 90);
        TKAssertEquals(view1.frame.size.height, 1);
        TKAssertEquals(view2.frame.origin.x, 4);
        TKAssertEquals(view2.frame.origin.y, 16);
        TKAssertEquals(view2.frame.size.width, 90);
        TKAssertEquals(view2.frame.size.height, 1);
        TKAssertEquals(view3.frame.origin.x, 4);
        TKAssertEquals(view3.frame.origin.y, 29);
        TKAssertEquals(view3.frame.size.width, 90);
        TKAssertEquals(view3.frame.size.height, 1);

        stackView.bounds = JSRect(0, 0, 100, 30);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 4);
        TKAssertEquals(view1.frame.origin.y, 3);
        TKAssertEquals(view1.frame.size.width, 90);
        TKAssertEquals(view1.frame.size.height, 0);
        TKAssertEquals(view2.frame.origin.x, 4);
        TKAssertEquals(view2.frame.origin.y, 15);
        TKAssertEquals(view2.frame.size.width, 90);
        TKAssertEquals(view2.frame.size.height, 0);
        TKAssertEquals(view3.frame.origin.x, 4);
        TKAssertEquals(view3.frame.origin.y, 27);
        TKAssertEquals(view3.frame.size.width, 90);
        TKAssertEquals(view3.frame.size.height, 0);
    },

    testLayoutSubviewsVerticalEqualDistributionTrailingAlignment: function(){
        var stackView = UIStackView.init();
        stackView.axis = UIStackView.Axis.vertical;
        stackView.distribution = UIStackView.Distribution.equal;
        stackView.alignment = UIStackView.Alignment.trailing;

        var view1 = UIStackViewTestView.initWithIntrinsicSize(JSSize(100, 20));
        var view2 = UIStackViewTestView.initWithIntrinsicSize(JSSize(200, 30));
        var view3 = UIStackViewTestView.initWithIntrinsicSize(JSSize(300, 40));

        stackView.addSubview(view1);
        stackView.addSubview(view2);
        stackView.addSubview(view3);

        stackView.bounds = JSRect(0, 0, 200, 300);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 100);
        TKAssertEquals(view1.frame.origin.y, 0);
        TKAssertEquals(view1.frame.size.width, 100);
        TKAssertEquals(view1.frame.size.height, 100);
        TKAssertEquals(view2.frame.origin.x, 0);
        TKAssertEquals(view2.frame.origin.y, 100);
        TKAssertEquals(view2.frame.size.width, 200);
        TKAssertEquals(view2.frame.size.height, 100);
        TKAssertEquals(view3.frame.origin.x, 0);
        TKAssertEquals(view3.frame.origin.y, 200);
        TKAssertEquals(view3.frame.size.width, 200);
        TKAssertEquals(view3.frame.size.height, 100);

        stackView.contentInsets = JSInsets(3, 4, 9, 6);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 94);
        TKAssertEquals(view1.frame.origin.y, 3);
        TKAssertEquals(view1.frame.size.width, 100);
        TKAssertEquals(view1.frame.size.height, 96);
        TKAssertEquals(view2.frame.origin.x, 4);
        TKAssertEquals(view2.frame.origin.y, 99);
        TKAssertEquals(view2.frame.size.width, 190);
        TKAssertEquals(view2.frame.size.height, 96);
        TKAssertEquals(view3.frame.origin.x, 4);
        TKAssertEquals(view3.frame.origin.y, 195);
        TKAssertEquals(view3.frame.size.width, 190);
        TKAssertEquals(view3.frame.size.height, 96);

        stackView.viewSpacing = 12;
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 94);
        TKAssertEquals(view1.frame.origin.y, 3);
        TKAssertEquals(view1.frame.size.width, 100);
        TKAssertEquals(view1.frame.size.height, 88);
        TKAssertEquals(view2.frame.origin.x, 4);
        TKAssertEquals(view2.frame.origin.y, 103);
        TKAssertEquals(view2.frame.size.width, 190);
        TKAssertEquals(view2.frame.size.height, 88);
        TKAssertEquals(view3.frame.origin.x, 4);
        TKAssertEquals(view3.frame.origin.y, 203);
        TKAssertEquals(view3.frame.size.width, 190);
        TKAssertEquals(view3.frame.size.height, 88);

        stackView.bounds = JSRect(0, 0, 100, 39);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 4);
        TKAssertEquals(view1.frame.origin.y, 3);
        TKAssertEquals(view1.frame.size.width, 90);
        TKAssertEquals(view1.frame.size.height, 1);
        TKAssertEquals(view2.frame.origin.x, 4);
        TKAssertEquals(view2.frame.origin.y, 16);
        TKAssertEquals(view2.frame.size.width, 90);
        TKAssertEquals(view2.frame.size.height, 1);
        TKAssertEquals(view3.frame.origin.x, 4);
        TKAssertEquals(view3.frame.origin.y, 29);
        TKAssertEquals(view3.frame.size.width, 90);
        TKAssertEquals(view3.frame.size.height, 1);

        stackView.bounds = JSRect(0, 0, 100, 30);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 4);
        TKAssertEquals(view1.frame.origin.y, 3);
        TKAssertEquals(view1.frame.size.width, 90);
        TKAssertEquals(view1.frame.size.height, 0);
        TKAssertEquals(view2.frame.origin.x, 4);
        TKAssertEquals(view2.frame.origin.y, 15);
        TKAssertEquals(view2.frame.size.width, 90);
        TKAssertEquals(view2.frame.size.height, 0);
        TKAssertEquals(view3.frame.origin.x, 4);
        TKAssertEquals(view3.frame.origin.y, 27);
        TKAssertEquals(view3.frame.size.width, 90);
        TKAssertEquals(view3.frame.size.height, 0);
    },

    testLayoutSubviewsHorizontalNoDistributionFullAlignment: function(){
        var stackView = UIStackView.init();
        stackView.axis = UIStackView.Axis.horizontal;
        stackView.distribution = UIStackView.Distribution.none;
        stackView.alignment = UIStackView.Alignment.full;

        var view1 = UIStackViewTestView.initWithIntrinsicSize(JSSize(20, 100));
        var view2 = UIStackViewTestView.initWithIntrinsicSize(JSSize(30, 200));
        var view3 = UIStackViewTestView.initWithIntrinsicSize(JSSize(40, 300));

        stackView.addSubview(view1);
        stackView.addSubview(view2);
        stackView.addSubview(view3);

        stackView.bounds = JSRect(0, 0, 300, 200);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 0);
        TKAssertEquals(view1.frame.origin.y, 0);
        TKAssertEquals(view1.frame.size.width, 20);
        TKAssertEquals(view1.frame.size.height, 200);
        TKAssertEquals(view2.frame.origin.x, 20);
        TKAssertEquals(view2.frame.origin.y, 0);
        TKAssertEquals(view2.frame.size.width, 30);
        TKAssertEquals(view2.frame.size.height, 200);
        TKAssertEquals(view3.frame.origin.x, 50);
        TKAssertEquals(view3.frame.origin.y, 0);
        TKAssertEquals(view3.frame.size.width, 40);
        TKAssertEquals(view3.frame.size.height, 200);

        stackView.contentInsets = JSInsets(4, 3, 6, 5);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 3);
        TKAssertEquals(view1.frame.origin.y, 4);
        TKAssertEquals(view1.frame.size.width, 20);
        TKAssertEquals(view1.frame.size.height, 190);
        TKAssertEquals(view2.frame.origin.x, 23);
        TKAssertEquals(view2.frame.origin.y, 4);
        TKAssertEquals(view2.frame.size.width, 30);
        TKAssertEquals(view2.frame.size.height, 190);
        TKAssertEquals(view3.frame.origin.x, 53);
        TKAssertEquals(view3.frame.origin.y, 4);
        TKAssertEquals(view3.frame.size.width, 40);
        TKAssertEquals(view3.frame.size.height, 190);

        stackView.viewSpacing = 10;
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 3);
        TKAssertEquals(view1.frame.origin.y, 4);
        TKAssertEquals(view1.frame.size.width, 20);
        TKAssertEquals(view1.frame.size.height, 190);
        TKAssertEquals(view2.frame.origin.x, 33);
        TKAssertEquals(view2.frame.origin.y, 4);
        TKAssertEquals(view2.frame.size.width, 30);
        TKAssertEquals(view2.frame.size.height, 190);
        TKAssertEquals(view3.frame.origin.x, 73);
        TKAssertEquals(view3.frame.origin.y, 4);
        TKAssertEquals(view3.frame.size.width, 40);
        TKAssertEquals(view3.frame.size.height, 190);

        stackView.bounds = JSRect(0, 0, 20, 100);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 3);
        TKAssertEquals(view1.frame.origin.y, 4);
        TKAssertEquals(view1.frame.size.width, 20);
        TKAssertEquals(view1.frame.size.height, 90);
        TKAssertEquals(view2.frame.origin.x, 33);
        TKAssertEquals(view2.frame.origin.y, 4);
        TKAssertEquals(view2.frame.size.width, 30);
        TKAssertEquals(view2.frame.size.height, 90);
        TKAssertEquals(view3.frame.origin.x, 73);
        TKAssertEquals(view3.frame.origin.y, 4);
        TKAssertEquals(view3.frame.size.width, 40);
        TKAssertEquals(view3.frame.size.height, 90);
    },

    testLayoutSubviewsHorizontalNoDistributionLeadingAlignment: function(){
        var stackView = UIStackView.init();
        stackView.axis = UIStackView.Axis.horizontal;
        stackView.distribution = UIStackView.Distribution.none;
        stackView.alignment = UIStackView.Alignment.leading;

        var view1 = UIStackViewTestView.initWithIntrinsicSize(JSSize(20, 100));
        var view2 = UIStackViewTestView.initWithIntrinsicSize(JSSize(30, 200));
        var view3 = UIStackViewTestView.initWithIntrinsicSize(JSSize(40, 300));

        stackView.addSubview(view1);
        stackView.addSubview(view2);
        stackView.addSubview(view3);

        stackView.bounds = JSRect(0, 0, 300, 200);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 0);
        TKAssertEquals(view1.frame.origin.y, 0);
        TKAssertEquals(view1.frame.size.width, 20);
        TKAssertEquals(view1.frame.size.height, 100);
        TKAssertEquals(view2.frame.origin.x, 20);
        TKAssertEquals(view2.frame.origin.y, 0);
        TKAssertEquals(view2.frame.size.width, 30);
        TKAssertEquals(view2.frame.size.height, 200);
        TKAssertEquals(view3.frame.origin.x, 50);
        TKAssertEquals(view3.frame.origin.y, 0);
        TKAssertEquals(view3.frame.size.width, 40);
        TKAssertEquals(view3.frame.size.height, 200);

        stackView.contentInsets = JSInsets(4, 3, 6, 5);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 3);
        TKAssertEquals(view1.frame.origin.y, 4);
        TKAssertEquals(view1.frame.size.width, 20);
        TKAssertEquals(view1.frame.size.height, 100);
        TKAssertEquals(view2.frame.origin.x, 23);
        TKAssertEquals(view2.frame.origin.y, 4);
        TKAssertEquals(view2.frame.size.width, 30);
        TKAssertEquals(view2.frame.size.height, 190);
        TKAssertEquals(view3.frame.origin.x, 53);
        TKAssertEquals(view3.frame.origin.y, 4);
        TKAssertEquals(view3.frame.size.width, 40);
        TKAssertEquals(view3.frame.size.height, 190);

        stackView.viewSpacing = 10;
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 3);
        TKAssertEquals(view1.frame.origin.y, 4);
        TKAssertEquals(view1.frame.size.width, 20);
        TKAssertEquals(view1.frame.size.height, 100);
        TKAssertEquals(view2.frame.origin.x, 33);
        TKAssertEquals(view2.frame.origin.y, 4);
        TKAssertEquals(view2.frame.size.width, 30);
        TKAssertEquals(view2.frame.size.height, 190);
        TKAssertEquals(view3.frame.origin.x, 73);
        TKAssertEquals(view3.frame.origin.y, 4);
        TKAssertEquals(view3.frame.size.width, 40);
        TKAssertEquals(view3.frame.size.height, 190);

        stackView.bounds = JSRect(0, 0, 20, 100);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 3);
        TKAssertEquals(view1.frame.origin.y, 4);
        TKAssertEquals(view1.frame.size.width, 20);
        TKAssertEquals(view1.frame.size.height, 90);
        TKAssertEquals(view2.frame.origin.x, 33);
        TKAssertEquals(view2.frame.origin.y, 4);
        TKAssertEquals(view2.frame.size.width, 30);
        TKAssertEquals(view2.frame.size.height, 90);
        TKAssertEquals(view3.frame.origin.x, 73);
        TKAssertEquals(view3.frame.origin.y, 4);
        TKAssertEquals(view3.frame.size.width, 40);
        TKAssertEquals(view3.frame.size.height, 90);
    },

    testLayoutSubviewsHorizontalNoDistributionCenterAlignment: function(){
        var stackView = UIStackView.init();
        stackView.axis = UIStackView.Axis.horizontal;
        stackView.distribution = UIStackView.Distribution.none;
        stackView.alignment = UIStackView.Alignment.center;

        var view1 = UIStackViewTestView.initWithIntrinsicSize(JSSize(20, 100));
        var view2 = UIStackViewTestView.initWithIntrinsicSize(JSSize(30, 200));
        var view3 = UIStackViewTestView.initWithIntrinsicSize(JSSize(40, 300));

        stackView.addSubview(view1);
        stackView.addSubview(view2);
        stackView.addSubview(view3);

        stackView.bounds = JSRect(0, 0, 300, 200);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 0);
        TKAssertEquals(view1.frame.origin.y, 50);
        TKAssertEquals(view1.frame.size.width, 20);
        TKAssertEquals(view1.frame.size.height, 100);
        TKAssertEquals(view2.frame.origin.x, 20);
        TKAssertEquals(view2.frame.origin.y, 0);
        TKAssertEquals(view2.frame.size.width, 30);
        TKAssertEquals(view2.frame.size.height, 200);
        TKAssertEquals(view3.frame.origin.x, 50);
        TKAssertEquals(view3.frame.origin.y, 0);
        TKAssertEquals(view3.frame.size.width, 40);
        TKAssertEquals(view3.frame.size.height, 200);

        stackView.contentInsets = JSInsets(4, 3, 6, 5);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 3);
        TKAssertEquals(view1.frame.origin.y, 49);
        TKAssertEquals(view1.frame.size.width, 20);
        TKAssertEquals(view1.frame.size.height, 100);
        TKAssertEquals(view2.frame.origin.x, 23);
        TKAssertEquals(view2.frame.origin.y, 4);
        TKAssertEquals(view2.frame.size.width, 30);
        TKAssertEquals(view2.frame.size.height, 190);
        TKAssertEquals(view3.frame.origin.x, 53);
        TKAssertEquals(view3.frame.origin.y, 4);
        TKAssertEquals(view3.frame.size.width, 40);
        TKAssertEquals(view3.frame.size.height, 190);

        stackView.viewSpacing = 10;
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 3);
        TKAssertEquals(view1.frame.origin.y, 49);
        TKAssertEquals(view1.frame.size.width, 20);
        TKAssertEquals(view1.frame.size.height, 100);
        TKAssertEquals(view2.frame.origin.x, 33);
        TKAssertEquals(view2.frame.origin.y, 4);
        TKAssertEquals(view2.frame.size.width, 30);
        TKAssertEquals(view2.frame.size.height, 190);
        TKAssertEquals(view3.frame.origin.x, 73);
        TKAssertEquals(view3.frame.origin.y, 4);
        TKAssertEquals(view3.frame.size.width, 40);
        TKAssertEquals(view3.frame.size.height, 190);

        stackView.bounds = JSRect(0, 0, 20, 100);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 3);
        TKAssertEquals(view1.frame.origin.y, 4);
        TKAssertEquals(view1.frame.size.width, 20);
        TKAssertEquals(view1.frame.size.height, 90);
        TKAssertEquals(view2.frame.origin.x, 33);
        TKAssertEquals(view2.frame.origin.y, 4);
        TKAssertEquals(view2.frame.size.width, 30);
        TKAssertEquals(view2.frame.size.height, 90);
        TKAssertEquals(view3.frame.origin.x, 73);
        TKAssertEquals(view3.frame.origin.y, 4);
        TKAssertEquals(view3.frame.size.width, 40);
        TKAssertEquals(view3.frame.size.height, 90);
    },

    testLayoutSubviewsHorizontalNoDistributionTrailingAlignment: function(){
        var stackView = UIStackView.init();
        stackView.axis = UIStackView.Axis.horizontal;
        stackView.distribution = UIStackView.Distribution.none;
        stackView.alignment = UIStackView.Alignment.trailing;

        var view1 = UIStackViewTestView.initWithIntrinsicSize(JSSize(20, 100));
        var view2 = UIStackViewTestView.initWithIntrinsicSize(JSSize(30, 200));
        var view3 = UIStackViewTestView.initWithIntrinsicSize(JSSize(40, 300));

        stackView.addSubview(view1);
        stackView.addSubview(view2);
        stackView.addSubview(view3);

        stackView.bounds = JSRect(0, 0, 300, 200);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 0);
        TKAssertEquals(view1.frame.origin.y, 100);
        TKAssertEquals(view1.frame.size.width, 20);
        TKAssertEquals(view1.frame.size.height, 100);
        TKAssertEquals(view2.frame.origin.x, 20);
        TKAssertEquals(view2.frame.origin.y, 0);
        TKAssertEquals(view2.frame.size.width, 30);
        TKAssertEquals(view2.frame.size.height, 200);
        TKAssertEquals(view3.frame.origin.x, 50);
        TKAssertEquals(view3.frame.origin.y, 0);
        TKAssertEquals(view3.frame.size.width, 40);
        TKAssertEquals(view3.frame.size.height, 200);

        stackView.contentInsets = JSInsets(4, 3, 6, 5);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 3);
        TKAssertEquals(view1.frame.origin.y, 94);
        TKAssertEquals(view1.frame.size.width, 20);
        TKAssertEquals(view1.frame.size.height, 100);
        TKAssertEquals(view2.frame.origin.x, 23);
        TKAssertEquals(view2.frame.origin.y, 4);
        TKAssertEquals(view2.frame.size.width, 30);
        TKAssertEquals(view2.frame.size.height, 190);
        TKAssertEquals(view3.frame.origin.x, 53);
        TKAssertEquals(view3.frame.origin.y, 4);
        TKAssertEquals(view3.frame.size.width, 40);
        TKAssertEquals(view3.frame.size.height, 190);

        stackView.viewSpacing = 10;
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 3);
        TKAssertEquals(view1.frame.origin.y, 94);
        TKAssertEquals(view1.frame.size.width, 20);
        TKAssertEquals(view1.frame.size.height, 100);
        TKAssertEquals(view2.frame.origin.x, 33);
        TKAssertEquals(view2.frame.origin.y, 4);
        TKAssertEquals(view2.frame.size.width, 30);
        TKAssertEquals(view2.frame.size.height, 190);
        TKAssertEquals(view3.frame.origin.x, 73);
        TKAssertEquals(view3.frame.origin.y, 4);
        TKAssertEquals(view3.frame.size.width, 40);
        TKAssertEquals(view3.frame.size.height, 190);

        stackView.bounds = JSRect(0, 0, 20, 100);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 3);
        TKAssertEquals(view1.frame.origin.y, 4);
        TKAssertEquals(view1.frame.size.width, 20);
        TKAssertEquals(view1.frame.size.height, 90);
        TKAssertEquals(view2.frame.origin.x, 33);
        TKAssertEquals(view2.frame.origin.y, 4);
        TKAssertEquals(view2.frame.size.width, 30);
        TKAssertEquals(view2.frame.size.height, 90);
        TKAssertEquals(view3.frame.origin.x, 73);
        TKAssertEquals(view3.frame.origin.y, 4);
        TKAssertEquals(view3.frame.size.width, 40);
        TKAssertEquals(view3.frame.size.height, 90);
    },

    testLayoutSubviewsHorizontalNoDistributionFirstBaselineAlignment: function(){
        var stackView = UIStackView.init();
        stackView.axis = UIStackView.Axis.horizontal;
        stackView.distribution = UIStackView.Distribution.none;
        stackView.alignment = UIStackView.Alignment.firstBaseline;

        var view1 = UIStackViewTestView.initWithIntrinsicSize(JSSize(20, 100), 15);
        var view2 = UIStackViewTestView.initWithIntrinsicSize(JSSize(30, 200), 45);
        var view3 = UIStackViewTestView.initWithIntrinsicSize(JSSize(40, 300), 25);

        stackView.addSubview(view1);
        stackView.addSubview(view2);
        stackView.addSubview(view3);

        stackView.bounds = JSRect(0, 0, 300, 200);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 0);
        TKAssertEquals(view1.frame.origin.y, 30);
        TKAssertEquals(view1.frame.size.width, 20);
        TKAssertEquals(view1.frame.size.height, 100);
        TKAssertEquals(view2.frame.origin.x, 20);
        TKAssertEquals(view2.frame.origin.y, 0);
        TKAssertEquals(view2.frame.size.width, 30);
        TKAssertEquals(view2.frame.size.height, 200);
        TKAssertEquals(view3.frame.origin.x, 50);
        TKAssertEquals(view3.frame.origin.y, 20);
        TKAssertEquals(view3.frame.size.width, 40);
        TKAssertEquals(view3.frame.size.height, 200);

        stackView.contentInsets = JSInsets(4, 3, 6, 5);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 3);
        TKAssertEquals(view1.frame.origin.y, 34);
        TKAssertEquals(view1.frame.size.width, 20);
        TKAssertEquals(view1.frame.size.height, 100);
        TKAssertEquals(view2.frame.origin.x, 23);
        TKAssertEquals(view2.frame.origin.y, 4);
        TKAssertEquals(view2.frame.size.width, 30);
        TKAssertEquals(view2.frame.size.height, 190);
        TKAssertEquals(view3.frame.origin.x, 53);
        TKAssertEquals(view3.frame.origin.y, 24);
        TKAssertEquals(view3.frame.size.width, 40);
        TKAssertEquals(view3.frame.size.height, 190);

        stackView.viewSpacing = 10;
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 3);
        TKAssertEquals(view1.frame.origin.y, 34);
        TKAssertEquals(view1.frame.size.width, 20);
        TKAssertEquals(view1.frame.size.height, 100);
        TKAssertEquals(view2.frame.origin.x, 33);
        TKAssertEquals(view2.frame.origin.y, 4);
        TKAssertEquals(view2.frame.size.width, 30);
        TKAssertEquals(view2.frame.size.height, 190);
        TKAssertEquals(view3.frame.origin.x, 73);
        TKAssertEquals(view3.frame.origin.y, 24);
        TKAssertEquals(view3.frame.size.width, 40);
        TKAssertEquals(view3.frame.size.height, 190);

        stackView.bounds = JSRect(0, 0, 20, 100);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 3);
        TKAssertEquals(view1.frame.origin.y, 34);
        TKAssertEquals(view1.frame.size.width, 20);
        TKAssertEquals(view1.frame.size.height, 90);
        TKAssertEquals(view2.frame.origin.x, 33);
        TKAssertEquals(view2.frame.origin.y, 4);
        TKAssertEquals(view2.frame.size.width, 30);
        TKAssertEquals(view2.frame.size.height, 90);
        TKAssertEquals(view3.frame.origin.x, 73);
        TKAssertEquals(view3.frame.origin.y, 24);
        TKAssertEquals(view3.frame.size.width, 40);
        TKAssertEquals(view3.frame.size.height, 90);
    },

    testLayoutSubviewsHorizontalNoDistributionLastBaselineAlignment: function(){
        var stackView = UIStackView.init();
        stackView.axis = UIStackView.Axis.horizontal;
        stackView.distribution = UIStackView.Distribution.none;
        stackView.alignment = UIStackView.Alignment.lastBaseline;

        var view1 = UIStackViewTestView.initWithIntrinsicSize(JSSize(20, 100), 0, 15);
        var view2 = UIStackViewTestView.initWithIntrinsicSize(JSSize(30, 200), 0, 45);
        var view3 = UIStackViewTestView.initWithIntrinsicSize(JSSize(40, 300), 0, 25);

        stackView.addSubview(view1);
        stackView.addSubview(view2);
        stackView.addSubview(view3);

        stackView.bounds = JSRect(0, 0, 300, 200);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 0);
        TKAssertEquals(view1.frame.origin.y, 90);
        TKAssertEquals(view1.frame.size.width, 20);
        TKAssertEquals(view1.frame.size.height, 100);
        TKAssertEquals(view2.frame.origin.x, 20);
        TKAssertEquals(view2.frame.origin.y, 20);
        TKAssertEquals(view2.frame.size.width, 30);
        TKAssertEquals(view2.frame.size.height, 200);
        TKAssertEquals(view3.frame.origin.x, 50);
        TKAssertEquals(view3.frame.origin.y, 0);
        TKAssertEquals(view3.frame.size.width, 40);
        TKAssertEquals(view3.frame.size.height, 200);

        stackView.contentInsets = JSInsets(4, 3, 6, 5);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 3);
        TKAssertEquals(view1.frame.origin.y, 84);
        TKAssertEquals(view1.frame.size.width, 20);
        TKAssertEquals(view1.frame.size.height, 100);
        TKAssertEquals(view2.frame.origin.x, 23);
        TKAssertEquals(view2.frame.origin.y, 24);
        TKAssertEquals(view2.frame.size.width, 30);
        TKAssertEquals(view2.frame.size.height, 190);
        TKAssertEquals(view3.frame.origin.x, 53);
        TKAssertEquals(view3.frame.origin.y, 4);
        TKAssertEquals(view3.frame.size.width, 40);
        TKAssertEquals(view3.frame.size.height, 190);

        stackView.viewSpacing = 10;
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 3);
        TKAssertEquals(view1.frame.origin.y, 84);
        TKAssertEquals(view1.frame.size.width, 20);
        TKAssertEquals(view1.frame.size.height, 100);
        TKAssertEquals(view2.frame.origin.x, 33);
        TKAssertEquals(view2.frame.origin.y, 24);
        TKAssertEquals(view2.frame.size.width, 30);
        TKAssertEquals(view2.frame.size.height, 190);
        TKAssertEquals(view3.frame.origin.x, 73);
        TKAssertEquals(view3.frame.origin.y, 4);
        TKAssertEquals(view3.frame.size.width, 40);
        TKAssertEquals(view3.frame.size.height, 190);

        stackView.bounds = JSRect(0, 0, 20, 100);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 3);
        TKAssertEquals(view1.frame.origin.y, 4);
        TKAssertEquals(view1.frame.size.width, 20);
        TKAssertEquals(view1.frame.size.height, 90);
        TKAssertEquals(view2.frame.origin.x, 33);
        TKAssertEquals(view2.frame.origin.y, 34);
        TKAssertEquals(view2.frame.size.width, 30);
        TKAssertEquals(view2.frame.size.height, 90);
        TKAssertEquals(view3.frame.origin.x, 73);
        TKAssertEquals(view3.frame.origin.y, 14);
        TKAssertEquals(view3.frame.size.width, 40);
        TKAssertEquals(view3.frame.size.height, 90);
    },

    testLayoutSubviewsHorizontalEqualDistributionFullAlignment: function(){
        var stackView = UIStackView.init();
        stackView.axis = UIStackView.Axis.horizontal;
        stackView.distribution = UIStackView.Distribution.equal;
        stackView.alignment = UIStackView.Alignment.full;

        var view1 = UIStackViewTestView.initWithIntrinsicSize(JSSize(20, 100));
        var view2 = UIStackViewTestView.initWithIntrinsicSize(JSSize(30, 200));
        var view3 = UIStackViewTestView.initWithIntrinsicSize(JSSize(400, 300));

        stackView.addSubview(view1);
        stackView.addSubview(view2);
        stackView.addSubview(view3);

        stackView.bounds = JSRect(0, 0, 300, 200);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 0);
        TKAssertEquals(view1.frame.origin.y, 0);
        TKAssertEquals(view1.frame.size.width, 100);
        TKAssertEquals(view1.frame.size.height, 200);
        TKAssertEquals(view2.frame.origin.x, 100);
        TKAssertEquals(view2.frame.origin.y, 0);
        TKAssertEquals(view2.frame.size.width, 100);
        TKAssertEquals(view2.frame.size.height, 200);
        TKAssertEquals(view3.frame.origin.x, 200);
        TKAssertEquals(view3.frame.origin.y, 0);
        TKAssertEquals(view3.frame.size.width, 100);
        TKAssertEquals(view3.frame.size.height, 200);

        stackView.contentInsets = JSInsets(4, 3, 6, 9);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 3);
        TKAssertEquals(view1.frame.origin.y, 4);
        TKAssertEquals(view1.frame.size.width, 96);
        TKAssertEquals(view1.frame.size.height, 190);
        TKAssertEquals(view2.frame.origin.x, 99);
        TKAssertEquals(view2.frame.origin.y, 4);
        TKAssertEquals(view2.frame.size.width, 96);
        TKAssertEquals(view2.frame.size.height, 190);
        TKAssertEquals(view3.frame.origin.x, 195);
        TKAssertEquals(view3.frame.origin.y, 4);
        TKAssertEquals(view3.frame.size.width, 96);
        TKAssertEquals(view3.frame.size.height, 190);

        stackView.viewSpacing = 12;
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 3);
        TKAssertEquals(view1.frame.origin.y, 4);
        TKAssertEquals(view1.frame.size.width, 88);
        TKAssertEquals(view1.frame.size.height, 190);
        TKAssertEquals(view2.frame.origin.x, 103);
        TKAssertEquals(view2.frame.origin.y, 4);
        TKAssertEquals(view2.frame.size.width, 88);
        TKAssertEquals(view2.frame.size.height, 190);
        TKAssertEquals(view3.frame.origin.x, 203);
        TKAssertEquals(view3.frame.origin.y, 4);
        TKAssertEquals(view3.frame.size.width, 88);
        TKAssertEquals(view3.frame.size.height, 190);

        stackView.bounds = JSRect(0, 0, 39, 100);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 3);
        TKAssertEquals(view1.frame.origin.y, 4);
        TKAssertEquals(view1.frame.size.width, 1);
        TKAssertEquals(view1.frame.size.height, 90);
        TKAssertEquals(view2.frame.origin.x, 16);
        TKAssertEquals(view2.frame.origin.y, 4);
        TKAssertEquals(view2.frame.size.width, 1);
        TKAssertEquals(view2.frame.size.height, 90);
        TKAssertEquals(view3.frame.origin.x, 29);
        TKAssertEquals(view3.frame.origin.y, 4);
        TKAssertEquals(view3.frame.size.width, 1);
        TKAssertEquals(view3.frame.size.height, 90);

        stackView.bounds = JSRect(0, 0, 30, 100);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 3);
        TKAssertEquals(view1.frame.origin.y, 4);
        TKAssertEquals(view1.frame.size.width, 0);
        TKAssertEquals(view1.frame.size.height, 90);
        TKAssertEquals(view2.frame.origin.x, 15);
        TKAssertEquals(view2.frame.origin.y, 4);
        TKAssertEquals(view2.frame.size.width, 0);
        TKAssertEquals(view2.frame.size.height, 90);
        TKAssertEquals(view3.frame.origin.x, 27);
        TKAssertEquals(view3.frame.origin.y, 4);
        TKAssertEquals(view3.frame.size.width, 0);
        TKAssertEquals(view3.frame.size.height, 90);
    },

    testLayoutSubviewsHorizontalEqualDistributionLeadingAlignment: function(){
        var stackView = UIStackView.init();
        stackView.axis = UIStackView.Axis.horizontal;
        stackView.distribution = UIStackView.Distribution.equal;
        stackView.alignment = UIStackView.Alignment.leading;

        var view1 = UIStackViewTestView.initWithIntrinsicSize(JSSize(20, 100));
        var view2 = UIStackViewTestView.initWithIntrinsicSize(JSSize(30, 200));
        var view3 = UIStackViewTestView.initWithIntrinsicSize(JSSize(400, 300));

        stackView.addSubview(view1);
        stackView.addSubview(view2);
        stackView.addSubview(view3);

        stackView.bounds = JSRect(0, 0, 300, 200);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 0);
        TKAssertEquals(view1.frame.origin.y, 0);
        TKAssertEquals(view1.frame.size.width, 100);
        TKAssertEquals(view1.frame.size.height, 100);
        TKAssertEquals(view2.frame.origin.x, 100);
        TKAssertEquals(view2.frame.origin.y, 0);
        TKAssertEquals(view2.frame.size.width, 100);
        TKAssertEquals(view2.frame.size.height, 200);
        TKAssertEquals(view3.frame.origin.x, 200);
        TKAssertEquals(view3.frame.origin.y, 0);
        TKAssertEquals(view3.frame.size.width, 100);
        TKAssertEquals(view3.frame.size.height, 200);

        stackView.contentInsets = JSInsets(4, 3, 6, 9);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 3);
        TKAssertEquals(view1.frame.origin.y, 4);
        TKAssertEquals(view1.frame.size.width, 96);
        TKAssertEquals(view1.frame.size.height, 100);
        TKAssertEquals(view2.frame.origin.x, 99);
        TKAssertEquals(view2.frame.origin.y, 4);
        TKAssertEquals(view2.frame.size.width, 96);
        TKAssertEquals(view2.frame.size.height, 190);
        TKAssertEquals(view3.frame.origin.x, 195);
        TKAssertEquals(view3.frame.origin.y, 4);
        TKAssertEquals(view3.frame.size.width, 96);
        TKAssertEquals(view3.frame.size.height, 190);

        stackView.viewSpacing = 12;
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 3);
        TKAssertEquals(view1.frame.origin.y, 4);
        TKAssertEquals(view1.frame.size.width, 88);
        TKAssertEquals(view1.frame.size.height, 100);
        TKAssertEquals(view2.frame.origin.x, 103);
        TKAssertEquals(view2.frame.origin.y, 4);
        TKAssertEquals(view2.frame.size.width, 88);
        TKAssertEquals(view2.frame.size.height, 190);
        TKAssertEquals(view3.frame.origin.x, 203);
        TKAssertEquals(view3.frame.origin.y, 4);
        TKAssertEquals(view3.frame.size.width, 88);
        TKAssertEquals(view3.frame.size.height, 190);

        stackView.bounds = JSRect(0, 0, 39, 100);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 3);
        TKAssertEquals(view1.frame.origin.y, 4);
        TKAssertEquals(view1.frame.size.width, 1);
        TKAssertEquals(view1.frame.size.height, 90);
        TKAssertEquals(view2.frame.origin.x, 16);
        TKAssertEquals(view2.frame.origin.y, 4);
        TKAssertEquals(view2.frame.size.width, 1);
        TKAssertEquals(view2.frame.size.height, 90);
        TKAssertEquals(view3.frame.origin.x, 29);
        TKAssertEquals(view3.frame.origin.y, 4);
        TKAssertEquals(view3.frame.size.width, 1);
        TKAssertEquals(view3.frame.size.height, 90);

        stackView.bounds = JSRect(0, 0, 30, 100);
        stackView.layoutIfNeeded();
        TKAssertEquals(view1.frame.origin.x, 3);
        TKAssertEquals(view1.frame.origin.y, 4);
        TKAssertEquals(view1.frame.size.width, 0);
        TKAssertEquals(view1.frame.size.height, 90);
        TKAssertEquals(view2.frame.origin.x, 15);
        TKAssertEquals(view2.frame.origin.y, 4);
        TKAssertEquals(view2.frame.size.width, 0);
        TKAssertEquals(view2.frame.size.height, 90);
        TKAssertEquals(view3.frame.origin.x, 27);
        TKAssertEquals(view3.frame.origin.y, 4);
        TKAssertEquals(view3.frame.size.width, 0);
        TKAssertEquals(view3.frame.size.height, 90);
    },

    testSizeToFitSizeVerticalNoDistributionFullAlignment: function(){
        var stackView = UIStackView.init();
        stackView.axis = UIStackView.Axis.vertical;
        stackView.distribution = UIStackView.Distribution.none;
        stackView.alignment = UIStackView.Alignment.full;

        var view1 = UIStackViewTestView.initWithIntrinsicSize(JSSize(100, 20));
        var view2 = UIStackViewTestView.initWithIntrinsicSize(JSSize(200, 30));
        var view3 = UIStackViewTestView.initWithIntrinsicSize(JSSize(300, 40));

        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 0);
        TKAssertEquals(stackView.bounds.size.height, 0);

        stackView.addSubview(view1);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 100);
        TKAssertEquals(stackView.bounds.size.height, 20);

        stackView.addSubview(view2);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 200);
        TKAssertEquals(stackView.bounds.size.height, 50);

        stackView.addSubview(view3);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 200);
        TKAssertEquals(stackView.bounds.size.height, 90);

        stackView.removeAllSubviews();
        stackView.contentInsets = JSInsets(3, 4, 5, 6);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 10);
        TKAssertEquals(stackView.bounds.size.height, 8);

        stackView.addSubview(view1);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 110);
        TKAssertEquals(stackView.bounds.size.height, 28);

        stackView.addSubview(view2);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 200);
        TKAssertEquals(stackView.bounds.size.height, 58);

        stackView.addSubview(view3);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 200);
        TKAssertEquals(stackView.bounds.size.height, 98);

        stackView.removeAllSubviews();
        stackView.viewSpacing = 10;
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 10);
        TKAssertEquals(stackView.bounds.size.height, 8);

        stackView.addSubview(view1);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 110);
        TKAssertEquals(stackView.bounds.size.height, 28);

        stackView.addSubview(view2);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 200);
        TKAssertEquals(stackView.bounds.size.height, 68);

        stackView.addSubview(view3);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 200);
        TKAssertEquals(stackView.bounds.size.height, 118);
    },

    testSizeToFitSizeVerticalNoDistributionLeadingAlignment: function(){
        var stackView = UIStackView.init();
        stackView.axis = UIStackView.Axis.vertical;
        stackView.distribution = UIStackView.Distribution.none;
        stackView.alignment = UIStackView.Alignment.leading;

        var view1 = UIStackViewTestView.initWithIntrinsicSize(JSSize(100, 20));
        var view2 = UIStackViewTestView.initWithIntrinsicSize(JSSize(200, 30));
        var view3 = UIStackViewTestView.initWithIntrinsicSize(JSSize(300, 40));

        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 0);
        TKAssertEquals(stackView.bounds.size.height, 0);

        stackView.addSubview(view1);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 100);
        TKAssertEquals(stackView.bounds.size.height, 20);

        stackView.addSubview(view2);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 200);
        TKAssertEquals(stackView.bounds.size.height, 50);

        stackView.addSubview(view3);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 200);
        TKAssertEquals(stackView.bounds.size.height, 90);

        stackView.removeAllSubviews();
        stackView.contentInsets = JSInsets(3, 4, 5, 6);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 10);
        TKAssertEquals(stackView.bounds.size.height, 8);

        stackView.addSubview(view1);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 110);
        TKAssertEquals(stackView.bounds.size.height, 28);

        stackView.addSubview(view2);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 200);
        TKAssertEquals(stackView.bounds.size.height, 58);

        stackView.addSubview(view3);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 200);
        TKAssertEquals(stackView.bounds.size.height, 98);

        stackView.removeAllSubviews();
        stackView.viewSpacing = 10;
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 10);
        TKAssertEquals(stackView.bounds.size.height, 8);

        stackView.addSubview(view1);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 110);
        TKAssertEquals(stackView.bounds.size.height, 28);

        stackView.addSubview(view2);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 200);
        TKAssertEquals(stackView.bounds.size.height, 68);

        stackView.addSubview(view3);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 200);
        TKAssertEquals(stackView.bounds.size.height, 118);
    },

    testSizeToFitSizeVerticalNoDistributionCenterAlignment: function(){
        var stackView = UIStackView.init();
        stackView.axis = UIStackView.Axis.vertical;
        stackView.distribution = UIStackView.Distribution.none;
        stackView.alignment = UIStackView.Alignment.center;

        var view1 = UIStackViewTestView.initWithIntrinsicSize(JSSize(100, 20));
        var view2 = UIStackViewTestView.initWithIntrinsicSize(JSSize(200, 30));
        var view3 = UIStackViewTestView.initWithIntrinsicSize(JSSize(300, 40));

        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 0);
        TKAssertEquals(stackView.bounds.size.height, 0);

        stackView.addSubview(view1);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 100);
        TKAssertEquals(stackView.bounds.size.height, 20);

        stackView.addSubview(view2);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 200);
        TKAssertEquals(stackView.bounds.size.height, 50);

        stackView.addSubview(view3);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 200);
        TKAssertEquals(stackView.bounds.size.height, 90);

        stackView.removeAllSubviews();
        stackView.contentInsets = JSInsets(3, 4, 5, 6);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 10);
        TKAssertEquals(stackView.bounds.size.height, 8);

        stackView.addSubview(view1);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 110);
        TKAssertEquals(stackView.bounds.size.height, 28);

        stackView.addSubview(view2);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 200);
        TKAssertEquals(stackView.bounds.size.height, 58);

        stackView.addSubview(view3);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 200);
        TKAssertEquals(stackView.bounds.size.height, 98);

        stackView.removeAllSubviews();
        stackView.viewSpacing = 10;
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 10);
        TKAssertEquals(stackView.bounds.size.height, 8);

        stackView.addSubview(view1);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 110);
        TKAssertEquals(stackView.bounds.size.height, 28);

        stackView.addSubview(view2);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 200);
        TKAssertEquals(stackView.bounds.size.height, 68);

        stackView.addSubview(view3);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 200);
        TKAssertEquals(stackView.bounds.size.height, 118);
    },

    testSizeToFitSizeVerticalNoDistributionTrailingAlignment: function(){
        var stackView = UIStackView.init();
        stackView.axis = UIStackView.Axis.vertical;
        stackView.distribution = UIStackView.Distribution.none;
        stackView.alignment = UIStackView.Alignment.trailing;

        var view1 = UIStackViewTestView.initWithIntrinsicSize(JSSize(100, 20));
        var view2 = UIStackViewTestView.initWithIntrinsicSize(JSSize(200, 30));
        var view3 = UIStackViewTestView.initWithIntrinsicSize(JSSize(300, 40));

        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 0);
        TKAssertEquals(stackView.bounds.size.height, 0);

        stackView.addSubview(view1);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 100);
        TKAssertEquals(stackView.bounds.size.height, 20);

        stackView.addSubview(view2);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 200);
        TKAssertEquals(stackView.bounds.size.height, 50);

        stackView.addSubview(view3);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 200);
        TKAssertEquals(stackView.bounds.size.height, 90);

        stackView.removeAllSubviews();
        stackView.contentInsets = JSInsets(3, 4, 5, 6);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 10);
        TKAssertEquals(stackView.bounds.size.height, 8);

        stackView.addSubview(view1);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 110);
        TKAssertEquals(stackView.bounds.size.height, 28);

        stackView.addSubview(view2);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 200);
        TKAssertEquals(stackView.bounds.size.height, 58);

        stackView.addSubview(view3);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 200);
        TKAssertEquals(stackView.bounds.size.height, 98);

        stackView.removeAllSubviews();
        stackView.viewSpacing = 10;
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 10);
        TKAssertEquals(stackView.bounds.size.height, 8);

        stackView.addSubview(view1);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 110);
        TKAssertEquals(stackView.bounds.size.height, 28);

        stackView.addSubview(view2);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 200);
        TKAssertEquals(stackView.bounds.size.height, 68);

        stackView.addSubview(view3);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 200);
        TKAssertEquals(stackView.bounds.size.height, 118);
    },

    testSizeToFitSizeVerticalEqualDistribution: function(){
        var stackView = UIStackView.init();
        stackView.axis = UIStackView.Axis.vertical;
        stackView.distribution = UIStackView.Distribution.equal;
        stackView.alignment = UIStackView.Alignment.full;

        var view1 = UIStackViewTestView.initWithIntrinsicSize(JSSize(100, 20));
        var view2 = UIStackViewTestView.initWithIntrinsicSize(JSSize(200, 30));
        var view3 = UIStackViewTestView.initWithIntrinsicSize(JSSize(300, 40));

        stackView.bounds = JSRect(0, 0, 250, 250);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 0);
        TKAssertEquals(stackView.bounds.size.height, 300);

        stackView.addSubview(view1);
        stackView.sizeToFitSize(JSSize(300, 200));
        TKAssertEquals(stackView.bounds.size.width, 100);
        TKAssertEquals(stackView.bounds.size.height, 200);

        stackView.addSubview(view2);
        stackView.bounds = JSRect(0, 0, 250, 250);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 200);
        TKAssertEquals(stackView.bounds.size.height, 300);

        stackView.addSubview(view3);
        stackView.sizeToFitSize(JSSize(300, 200));
        TKAssertEquals(stackView.bounds.size.width, 300);
        TKAssertEquals(stackView.bounds.size.height, 200);

        stackView.removeAllSubviews();
        stackView.contentInsets = JSInsets(3, 4, 5, 6);
        stackView.bounds = JSRect(0, 0, 250, 250);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 10);
        TKAssertEquals(stackView.bounds.size.height, 300);

        stackView.addSubview(view1);
        stackView.sizeToFitSize(JSSize(300, 200));
        TKAssertEquals(stackView.bounds.size.width, 110);
        TKAssertEquals(stackView.bounds.size.height, 200);

        stackView.addSubview(view2);
        stackView.bounds = JSRect(0, 0, 250, 250);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 200);
        TKAssertEquals(stackView.bounds.size.height, 300);

        stackView.addSubview(view3);
        stackView.sizeToFitSize(JSSize(300, 200));
        TKAssertEquals(stackView.bounds.size.width, 300);
        TKAssertEquals(stackView.bounds.size.height, 200);

        stackView.removeAllSubviews();
        stackView.viewSpacing = 10;
        stackView.bounds = JSRect(0, 0, 250, 250);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 10);
        TKAssertEquals(stackView.bounds.size.height, 300);

        stackView.addSubview(view1);
        stackView.sizeToFitSize(JSSize(300, 200));
        TKAssertEquals(stackView.bounds.size.width, 110);
        TKAssertEquals(stackView.bounds.size.height, 200);

        stackView.addSubview(view2);
        stackView.bounds = JSRect(0, 0, 250, 250);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 200);
        TKAssertEquals(stackView.bounds.size.height, 300);

        stackView.addSubview(view3);
        stackView.sizeToFitSize(JSSize(300, 200));
        TKAssertEquals(stackView.bounds.size.width, 300);
        TKAssertEquals(stackView.bounds.size.height, 200);

        stackView.bounds = JSRect(0, 0, 250, 250);
        stackView.sizeToFitSize(JSSize(300, Number.MAX_VALUE));
        TKAssertEquals(stackView.bounds.size.width, 300);
        TKAssertEquals(stackView.bounds.size.height, 250);
    },

    testSizeToFitSizeHorizontalNoDistributionFullAlignment: function(){
        var stackView = UIStackView.init();
        stackView.axis = UIStackView.Axis.horizontal;
        stackView.distribution = UIStackView.Distribution.none;
        stackView.alignment = UIStackView.Alignment.full;

        var view1 = UIStackViewTestView.initWithIntrinsicSize(JSSize(20, 100));
        var view2 = UIStackViewTestView.initWithIntrinsicSize(JSSize(30, 200));
        var view3 = UIStackViewTestView.initWithIntrinsicSize(JSSize(40, 300));

        stackView.sizeToFitSize(JSSize(300, 200));
        TKAssertEquals(stackView.bounds.size.width, 0);
        TKAssertEquals(stackView.bounds.size.height, 0);

        stackView.addSubview(view1);
        stackView.sizeToFitSize(JSSize(300, 200));
        TKAssertEquals(stackView.bounds.size.width, 20);
        TKAssertEquals(stackView.bounds.size.height, 100);

        stackView.addSubview(view2);
        stackView.sizeToFitSize(JSSize(300, 200));
        TKAssertEquals(stackView.bounds.size.width, 50);
        TKAssertEquals(stackView.bounds.size.height, 200);

        stackView.addSubview(view3);
        stackView.sizeToFitSize(JSSize(300, 200));
        TKAssertEquals(stackView.bounds.size.width, 90);
        TKAssertEquals(stackView.bounds.size.height, 200);

        stackView.removeAllSubviews();
        stackView.contentInsets = JSInsets(4, 3, 6, 5);
        stackView.sizeToFitSize(JSSize(300, 200));
        TKAssertEquals(stackView.bounds.size.width, 8);
        TKAssertEquals(stackView.bounds.size.height, 10);

        stackView.addSubview(view1);
        stackView.sizeToFitSize(JSSize(300, 200));
        TKAssertEquals(stackView.bounds.size.width, 28);
        TKAssertEquals(stackView.bounds.size.height, 110);

        stackView.addSubview(view2);
        stackView.sizeToFitSize(JSSize(300, 200));
        TKAssertEquals(stackView.bounds.size.width, 58);
        TKAssertEquals(stackView.bounds.size.height, 200);

        stackView.addSubview(view3);
        stackView.sizeToFitSize(JSSize(300, 200));
        TKAssertEquals(stackView.bounds.size.width, 98);
        TKAssertEquals(stackView.bounds.size.height, 200);

        stackView.removeAllSubviews();
        stackView.viewSpacing = 10;
        stackView.sizeToFitSize(JSSize(300, 200));
        TKAssertEquals(stackView.bounds.size.width, 8);
        TKAssertEquals(stackView.bounds.size.height, 10);

        stackView.addSubview(view1);
        stackView.sizeToFitSize(JSSize(300, 200));
        TKAssertEquals(stackView.bounds.size.width, 28);
        TKAssertEquals(stackView.bounds.size.height, 110);

        stackView.addSubview(view2);
        stackView.sizeToFitSize(JSSize(300, 200));
        TKAssertEquals(stackView.bounds.size.width, 68);
        TKAssertEquals(stackView.bounds.size.height, 200);

        stackView.addSubview(view3);
        stackView.sizeToFitSize(JSSize(300, 200));
        TKAssertEquals(stackView.bounds.size.width, 118);
        TKAssertEquals(stackView.bounds.size.height, 200);
    },

    testSizeToFitSizeHorizontalNoDistributionLeadingAlignment: function(){
        var stackView = UIStackView.init();
        stackView.axis = UIStackView.Axis.horizontal;
        stackView.distribution = UIStackView.Distribution.none;
        stackView.alignment = UIStackView.Alignment.leading;

        var view1 = UIStackViewTestView.initWithIntrinsicSize(JSSize(20, 100));
        var view2 = UIStackViewTestView.initWithIntrinsicSize(JSSize(30, 200));
        var view3 = UIStackViewTestView.initWithIntrinsicSize(JSSize(40, 300));

        stackView.sizeToFitSize(JSSize(300, 200));
        TKAssertEquals(stackView.bounds.size.width, 0);
        TKAssertEquals(stackView.bounds.size.height, 0);

        stackView.addSubview(view1);
        stackView.sizeToFitSize(JSSize(300, 200));
        TKAssertEquals(stackView.bounds.size.width, 20);
        TKAssertEquals(stackView.bounds.size.height, 100);

        stackView.addSubview(view2);
        stackView.sizeToFitSize(JSSize(300, 200));
        TKAssertEquals(stackView.bounds.size.width, 50);
        TKAssertEquals(stackView.bounds.size.height, 200);

        stackView.addSubview(view3);
        stackView.sizeToFitSize(JSSize(300, 200));
        TKAssertEquals(stackView.bounds.size.width, 90);
        TKAssertEquals(stackView.bounds.size.height, 200);

        stackView.removeAllSubviews();
        stackView.contentInsets = JSInsets(4, 3, 6, 5);
        stackView.sizeToFitSize(JSSize(300, 200));
        TKAssertEquals(stackView.bounds.size.width, 8);
        TKAssertEquals(stackView.bounds.size.height, 10);

        stackView.addSubview(view1);
        stackView.sizeToFitSize(JSSize(300, 200));
        TKAssertEquals(stackView.bounds.size.width, 28);
        TKAssertEquals(stackView.bounds.size.height, 110);

        stackView.addSubview(view2);
        stackView.sizeToFitSize(JSSize(300, 200));
        TKAssertEquals(stackView.bounds.size.width, 58);
        TKAssertEquals(stackView.bounds.size.height, 200);

        stackView.addSubview(view3);
        stackView.sizeToFitSize(JSSize(300, 200));
        TKAssertEquals(stackView.bounds.size.width, 98);
        TKAssertEquals(stackView.bounds.size.height, 200);

        stackView.removeAllSubviews();
        stackView.viewSpacing = 10;
        stackView.sizeToFitSize(JSSize(300, 200));
        TKAssertEquals(stackView.bounds.size.width, 8);
        TKAssertEquals(stackView.bounds.size.height, 10);

        stackView.addSubview(view1);
        stackView.sizeToFitSize(JSSize(300, 200));
        TKAssertEquals(stackView.bounds.size.width, 28);
        TKAssertEquals(stackView.bounds.size.height, 110);

        stackView.addSubview(view2);
        stackView.sizeToFitSize(JSSize(300, 200));
        TKAssertEquals(stackView.bounds.size.width, 68);
        TKAssertEquals(stackView.bounds.size.height, 200);

        stackView.addSubview(view3);
        stackView.sizeToFitSize(JSSize(300, 200));
        TKAssertEquals(stackView.bounds.size.width, 118);
        TKAssertEquals(stackView.bounds.size.height, 200);
    },

    testSizeToFitSizeHorizontalEqualDistribution: function(){
        var stackView = UIStackView.init();
        stackView.axis = UIStackView.Axis.horizontal;
        stackView.distribution = UIStackView.Distribution.equal;
        stackView.alignment = UIStackView.Alignment.full;

        var view1 = UIStackViewTestView.initWithIntrinsicSize(JSSize(20, 100));
        var view2 = UIStackViewTestView.initWithIntrinsicSize(JSSize(30, 200));
        var view3 = UIStackViewTestView.initWithIntrinsicSize(JSSize(40, 300));

        stackView.bounds = JSRect(0, 0, 250, 250);
        stackView.sizeToFitSize(JSSize(300, 200));
        TKAssertEquals(stackView.bounds.size.width, 300);
        TKAssertEquals(stackView.bounds.size.height, 0);

        stackView.addSubview(view1);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 200);
        TKAssertEquals(stackView.bounds.size.height, 100);

        stackView.addSubview(view2);
        stackView.bounds = JSRect(0, 0, 250, 250);
        stackView.sizeToFitSize(JSSize(300, 200));
        TKAssertEquals(stackView.bounds.size.width, 300);
        TKAssertEquals(stackView.bounds.size.height, 200);

        stackView.addSubview(view3);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 200);
        TKAssertEquals(stackView.bounds.size.height, 300);

        stackView.removeAllSubviews();
        stackView.contentInsets = JSInsets(4, 3, 6, 5);
        stackView.bounds = JSRect(0, 0, 250, 250);
        stackView.sizeToFitSize(JSSize(300, 200));
        TKAssertEquals(stackView.bounds.size.width, 300);
        TKAssertEquals(stackView.bounds.size.height, 10);

        stackView.addSubview(view1);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 200);
        TKAssertEquals(stackView.bounds.size.height, 110);

        stackView.addSubview(view2);
        stackView.bounds = JSRect(0, 0, 250, 250);
        stackView.sizeToFitSize(JSSize(300, 200));
        TKAssertEquals(stackView.bounds.size.width, 300);
        TKAssertEquals(stackView.bounds.size.height, 200);

        stackView.addSubview(view3);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 200);
        TKAssertEquals(stackView.bounds.size.height, 300);

        stackView.removeAllSubviews();
        stackView.viewSpacing = 10;
        stackView.bounds = JSRect(0, 0, 250, 250);
        stackView.sizeToFitSize(JSSize(300, 200));
        TKAssertEquals(stackView.bounds.size.width, 300);
        TKAssertEquals(stackView.bounds.size.height, 10);

        stackView.addSubview(view1);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 200);
        TKAssertEquals(stackView.bounds.size.height, 110);

        stackView.addSubview(view2);
        stackView.bounds = JSRect(0, 0, 250, 250);
        stackView.sizeToFitSize(JSSize(300, 200));
        TKAssertEquals(stackView.bounds.size.width, 300);
        TKAssertEquals(stackView.bounds.size.height, 200);

        stackView.addSubview(view3);
        stackView.sizeToFitSize(JSSize(200, 300));
        TKAssertEquals(stackView.bounds.size.width, 200);
        TKAssertEquals(stackView.bounds.size.height, 300);

        stackView.bounds = JSRect(0, 0, 250, 250);
        stackView.sizeToFitSize(JSSize(Number.MAX_VALUE, 300));
        TKAssertEquals(stackView.bounds.size.width, 250);
        TKAssertEquals(stackView.bounds.size.height, 300);
    },

});

JSClass("UIStackViewTestView", UIView, {

    _intrinsicSize: null,
    _firstBaseline: null,
    _lastBaseline: null,

    initWithIntrinsicSize: function(intrinsicSize, firstBaseline, lastBaseline){
        this.initWithFrame(JSRect(0, 0, 100, 100));
        this._intrinsicSize = JSSize(intrinsicSize);
        this._firstBaseline = firstBaseline || 0;
        this._lastBaseline = lastBaseline || 0;
    },

    getIntrinsicSize: function(){
        return JSSize(this._intrinsicSize);
    },

    sizeToFitSize: function(maxSize){
        var size = JSSize(this._intrinsicSize);
        if (size.width > maxSize.width){
            size.width = maxSize.width;
        }
        if (size.height > maxSize.height){
            size.height = maxSize.height;
        }
        this.bounds = JSRect(JSPoint.Zero, size);
    },

    getFirstBaselineOffsetFromTop: function(){
        return this._firstBaseline;
    },

    getLastBaselineOffsetFromBottom: function(){
        return this._lastBaseline;
    }

});