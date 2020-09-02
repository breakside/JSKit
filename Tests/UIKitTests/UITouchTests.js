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
'use strict';

(function(){

JSClass("UITouchTests", TKTestSuite, {

    testInit: function(){
        var window = UIRootWindow.init();
        var touch = UITouch.initWithIdentifier(1, 123, window, JSPoint(5, 10));
        TKAssertEquals(touch.identifier, 1);
        TKAssertExactEquals(touch.window, window);
        TKAssertEquals(touch.locationInWindow.x, 5);
        TKAssertEquals(touch.locationInWindow.y, 10);
        TKAssertEquals(touch.timestamp, 123);
        TKAssertEquals(touch.phase, UITouch.Phase.began);
    },

    testUpdate: function(){
        var window = UIRootWindow.init();
        var touch = UITouch.initWithIdentifier(2, 123, window, JSPoint(5, 10));
        TKAssertEquals(touch.identifier, 2);
        touch.update(UITouch.Phase.moved, 124, JSPoint(6, 9));
        TKAssertEquals(touch.identifier, 2);
        TKAssertExactEquals(touch.window, window);
        TKAssertEquals(touch.locationInWindow.x, 6);
        TKAssertEquals(touch.locationInWindow.y, 9);
        TKAssertEquals(touch.timestamp, 124);
        TKAssertEquals(touch.phase, UITouch.Phase.moved);
    },

    testLocationInView: function(){
        var window = UIRootWindow.init();
        var view1 = UIView.initWithFrame(JSRect(10, 15, 20, 25));
        var view2 = UIView.initWithFrame(JSRect(2, 3, 7, 8));
        window.contentView.addSubview(view1);
        view1.addSubview(view2);
        var touch = UITouch.initWithIdentifier(1, 123, window, JSPoint(16, 24));
        var location1 = touch.locationInView(view1);
        TKAssertObjectEquals(location1, JSPoint(6, 9));
        var location2 = touch.locationInView(view2);
        TKAssertObjectEquals(location2, JSPoint(4, 6));
    }

});

})();