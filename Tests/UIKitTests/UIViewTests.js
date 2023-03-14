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
'use strict';

JSClass("UIViewTests", TKTestSuite, {

    windowServer: null,

    setup: function(){
        this.windowServer = UIMockWindowServer.init();
    },

    teardown: function(){
        this.windowServer = null;
    },

    testIsDescendantOfView: function(){
        var view1 = UIView.init();
        var view2 = UIView.init();
        var view3 = UIView.init();
        var view4 = UIView.init();
        var view5 = UIView.init();
        var view6 = UIView.init();

        view1.addSubview(view2);
        view2.addSubview(view3);
        view4.addSubview(view5);

        TKAssertExactEquals(view1.isDescendantOfView(view2), false);
        TKAssertExactEquals(view1.isDescendantOfView(view3), false);
        TKAssertExactEquals(view1.isDescendantOfView(view4), false);
        TKAssertExactEquals(view1.isDescendantOfView(view5), false);
        TKAssertExactEquals(view1.isDescendantOfView(view6), false);

        TKAssertExactEquals(view2.isDescendantOfView(view1), true);
        TKAssertExactEquals(view2.isDescendantOfView(view3), false);
        TKAssertExactEquals(view2.isDescendantOfView(view4), false);
        TKAssertExactEquals(view2.isDescendantOfView(view5), false);
        TKAssertExactEquals(view2.isDescendantOfView(view6), false);

        TKAssertExactEquals(view3.isDescendantOfView(view1), true);
        TKAssertExactEquals(view3.isDescendantOfView(view2), true);
        TKAssertExactEquals(view3.isDescendantOfView(view4), false);
        TKAssertExactEquals(view3.isDescendantOfView(view5), false);
        TKAssertExactEquals(view3.isDescendantOfView(view6), false);

        TKAssertExactEquals(view4.isDescendantOfView(view1), false);
        TKAssertExactEquals(view4.isDescendantOfView(view2), false);
        TKAssertExactEquals(view4.isDescendantOfView(view3), false);
        TKAssertExactEquals(view4.isDescendantOfView(view5), false);
        TKAssertExactEquals(view4.isDescendantOfView(view6), false);

        TKAssertExactEquals(view5.isDescendantOfView(view1), false);
        TKAssertExactEquals(view5.isDescendantOfView(view2), false);
        TKAssertExactEquals(view5.isDescendantOfView(view3), false);
        TKAssertExactEquals(view5.isDescendantOfView(view4), true);
        TKAssertExactEquals(view5.isDescendantOfView(view6), false);

        TKAssertExactEquals(view6.isDescendantOfView(view1), false);
        TKAssertExactEquals(view6.isDescendantOfView(view2), false);
        TKAssertExactEquals(view6.isDescendantOfView(view3), false);
        TKAssertExactEquals(view6.isDescendantOfView(view4), false);
        TKAssertExactEquals(view6.isDescendantOfView(view5), false);
    },

    testHitTest: function(){
        var view = UIView.init();
        view.bounds = JSRect(0, 0, 100, 100);
        var hit = view.hitTest(JSPoint(0, 0));
        TKAssertExactEquals(hit, view);
        hit = view.hitTest(JSPoint(99.9, 99.9));
        TKAssertExactEquals(hit, view);
        hit = view.hitTest(JSPoint(100, 99.9));
        TKAssertExactEquals(hit, null);
        hit = view.hitTest(JSPoint(99.0, 100));
        TKAssertExactEquals(hit, null);
        hit = view.hitTest(JSPoint(0, -0.1));
        TKAssertExactEquals(hit, null);
        hit = view.hitTest(JSPoint(-0.1, 0));
        TKAssertExactEquals(hit, null);

        var subview1 = UIView.init();
        subview1.frame = JSRect(10, 10, 50, 50);
        var subview2 = UIView.init();
        subview2.frame = JSRect(40, 40, 50, 50);
        view.addSubview(subview1);
        view.addSubview(subview2);
        hit = view.hitTest(JSPoint(9, 9));
        TKAssertExactEquals(hit, view);
        hit = view.hitTest(JSPoint(90, 90));
        TKAssertExactEquals(hit, view);
        hit = view.hitTest(JSPoint(10, 10));
        TKAssertExactEquals(hit, subview1);
        hit = view.hitTest(JSPoint(39, 39));
        TKAssertExactEquals(hit, subview1);
        hit = view.hitTest(JSPoint(40, 40));
        TKAssertExactEquals(hit, subview2);
        hit = view.hitTest(JSPoint(89, 89));
        TKAssertExactEquals(hit, subview2);

        subview1.zIndex = 1;
        hit = view.hitTest(JSPoint(40, 40));
        TKAssertExactEquals(hit, subview1);
        hit = view.hitTest(JSPoint(59, 59));
        TKAssertExactEquals(hit, subview1);
        hit = view.hitTest(JSPoint(60, 60));
        TKAssertExactEquals(hit, subview2);

        subview1.zIndex = 0;
        hit = view.hitTest(JSPoint(40, 40));
        TKAssertExactEquals(hit, subview2);
        hit = view.hitTest(JSPoint(59, 59));
        TKAssertExactEquals(hit, subview2);
        hit = view.hitTest(JSPoint(60, 60));
        TKAssertExactEquals(hit, subview2);

        var sublayer = UILayer.init();
        sublayer.frame = JSRect(10, 10, 80, 80);
        view.layer.addSublayer(sublayer);
        hit = view.hitTest(JSPoint(0, 0));
        TKAssertExactEquals(hit, view);
        hit = view.hitTest(JSPoint(99.9, 99.9));
        TKAssertExactEquals(hit, view);
        hit = view.hitTest(JSPoint(100, 99.9));
        TKAssertExactEquals(hit, null);
        hit = view.hitTest(JSPoint(99.0, 100));
        TKAssertExactEquals(hit, null);
        hit = view.hitTest(JSPoint(0, -0.1));
        TKAssertExactEquals(hit, null);
        hit = view.hitTest(JSPoint(-0.1, 0));
        TKAssertExactEquals(hit, null);
        hit = view.hitTest(JSPoint(9, 9));
        TKAssertExactEquals(hit, view);
        hit = view.hitTest(JSPoint(90, 90));
        TKAssertExactEquals(hit, view);
        hit = view.hitTest(JSPoint(10, 10));
        TKAssertExactEquals(hit, subview1);
        hit = view.hitTest(JSPoint(39, 39));
        TKAssertExactEquals(hit, subview1);
        hit = view.hitTest(JSPoint(40, 40));
        TKAssertExactEquals(hit, subview2);
        hit = view.hitTest(JSPoint(89, 89));
        TKAssertExactEquals(hit, subview2);
    },

});