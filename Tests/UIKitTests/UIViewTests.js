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

});