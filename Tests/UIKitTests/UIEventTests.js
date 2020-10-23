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

(function(){

JSClass("UIEventTests", TKTestSuite, {

    setup: function(){
        this.application = UIMockApplication.init();
    },

    teardown: function(){
        this.application.deinit();
    },

    testInitMouseEvent: function(){
        var window = UIRootWindow.init();
        var event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDown, 1, window, JSPoint(200, 100));
        TKAssertEquals(event.category, UIEvent.Category.mouse);
        TKAssertEquals(event.type, UIEvent.Type.leftMouseDown);
        TKAssertEquals(event.timestamp, 1);
        TKAssertExactEquals(event.window, window);
        TKAssertObjectEquals(event.locationInWindow, JSPoint(200, 100));
    },

    testInitKeyEvent: function(){
        var window = UIRootWindow.init();
        var event = UIEvent.initKeyEventWithType(UIEvent.Type.keyDown, 1, window, UIEvent.Key.enter, 0x13);
        TKAssertEquals(event.category, UIEvent.Category.key);
        TKAssertEquals(event.type, UIEvent.Type.keyDown);
        TKAssertEquals(event.timestamp, 1);
        TKAssertExactEquals(event.window, window);
        TKAssertEquals(event.key, UIEvent.Key.enter);
    },

    testInitTouchEvent: function(){
        var event = UIEvent.initTouchEventWithType(UIEvent.Type.touchesBegan, 123);
        TKAssertEquals(event.category, UIEvent.Category.touches);
        TKAssertEquals(event.type, UIEvent.Type.touchesBegan);
        TKAssertEquals(event.timestamp, 123);
    },

    testInitScrollEvent: function(){
        var window = UIRootWindow.init();
        var event = UIEvent.initScrollEventWithType(UIEvent.Type.scrollWheel, 1, window, JSPoint(100, 200), 10, -3, 1);
        TKAssertEquals(event.category, UIEvent.Category.scroll);
        TKAssertEquals(event.type, UIEvent.Type.scrollWheel);
        TKAssertEquals(event.timestamp, 1);
        TKAssertExactEquals(event.window, window);
        TKAssertObjectEquals(event.locationInWindow, JSPoint(100, 200));
        TKAssertObjectEquals(event.scrollingDelta, JSPoint(10, -3));
    },

    testInitGestureEvent: function(){
        var window = UIRootWindow.init();
        var event = UIEvent.initGestureEventWithType(UIEvent.Type.magnify, 1, window, JSPoint(100, 200), UIEvent.Phase.began, 1.1);
        TKAssertEquals(event.category, UIEvent.Category.gesture);
        TKAssertEquals(event.type, UIEvent.Type.magnify);
        TKAssertEquals(event.timestamp, 1);
        TKAssertExactEquals(event.window, window);
        TKAssertObjectEquals(event.locationInWindow, JSPoint(100, 200));
        TKAssertExactEquals(event.phase, UIEvent.Phase.began);
        TKAssertFloatEquals(event.magnification, 1.1);

        event = UIEvent.initGestureEventWithType(UIEvent.Type.rotate, 1, window, JSPoint(100, 200), UIEvent.Phase.changed, Math.PI);
        TKAssertEquals(event.category, UIEvent.Category.gesture);
        TKAssertEquals(event.type, UIEvent.Type.rotate);
        TKAssertEquals(event.timestamp, 1);
        TKAssertExactEquals(event.window, window);
        TKAssertObjectEquals(event.locationInWindow, JSPoint(100, 200));
        TKAssertExactEquals(event.phase, UIEvent.Phase.changed);
        TKAssertFloatEquals(event.rotation, Math.PI);
    },

    testLocationInView: function(){
        var window = UIRootWindow.init();
        var view1 = UIView.initWithFrame(JSRect(10, 15, 20, 25));
        var view2 = UIView.initWithFrame(JSRect(2, 3, 7, 8));
        window.contentView.addSubview(view1);
        view1.addSubview(view2);
        var event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDown, 1, window, JSPoint(16, 24));
        var location1 = event.locationInView(view1);
        TKAssertObjectEquals(location1, JSPoint(6, 9));
        var location2 = event.locationInView(view2);
        TKAssertObjectEquals(location2, JSPoint(4, 6));
    },

    testAddTouch: function(){
        var window = UIRootWindow.init();
        var event = UIEvent.initTouchEventWithType(UIEvent.Type.touchesBegan, 123);
        TKAssertNull(event.window);
        TKAssertEquals(event.touches.length, 0);
        var touch1 = UITouch.initWithIdentifier(1, 123, window, JSPoint(5, 10));
        event.addTouch(touch1);
        TKAssertEquals(event.touches.length, 1);
        TKAssertExactEquals(event.touches[0], touch1);

        var touch2 = UITouch.initWithIdentifier(2, 123, window, JSPoint(15, 110));
        event.addTouch(touch2);
        TKAssertEquals(event.touches.length, 2);
        TKAssertExactEquals(event.touches[0], touch1);
        TKAssertExactEquals(event.touches[1], touch2);
    },

    testUpdateTouches: function(){
        var window1 = UIRootWindow.init();
        var window2 = UIRootWindow.init();
        var window3 = UIRootWindow.init();
        var touch1 = UITouch.initWithIdentifier(1, 123, window1, JSPoint(5, 10));
        var touch2 = UITouch.initWithIdentifier(2, 123, window1, JSPoint(15, 110));
        var touch3 = UITouch.initWithIdentifier(2, 123, window2, JSPoint(15, 110));
        var event = UIEvent.initTouchEventWithType(UIEvent.Type.touchesBegan, 123);
        event.addTouch(touch1);
        TKAssertEquals(event.category, UIEvent.Category.touches);
        TKAssertEquals(event.type, UIEvent.Type.touchesBegan);
        TKAssertEquals(event.timestamp, 123);
        TKAssertEquals(event.touches.length, 1);

        event.addTouch(touch2);
        event.updateTouches(UIEvent.Type.touchesBegan, 124);

        event.addTouch(touch3);
        event.updateTouches(UIEvent.Type.touchesBegan, 125);

        touch1.update(UITouch.Phase.moved, 126, JSPoint(6, 9));
        event.updateTouches(UIEvent.Type.touchesMoved, 126);

        touch3.update(UITouch.Phase.moved, 127, JSPoint(6, 9));
        event.updateTouches(UIEvent.Type.touchesMoved, 127);
    },

    testTouchForIdentifier: function(){
        var window = UIRootWindow.init();
        var event = UIEvent.initTouchEventWithType(UIEvent.Type.touchesBegan, 123);
        var touch1 = UITouch.initWithIdentifier(1, 123, window, JSPoint(5, 10));
        var touch2 = UITouch.initWithIdentifier(2, 123, window, JSPoint(15, 110));
        event.addTouch(touch1);
        event.addTouch(touch2);
        var touch = event.touchForIdentifier(1);
        TKAssertExactEquals(touch, touch1);
        touch = event.touchForIdentifier(2);
        TKAssertExactEquals(touch, touch2);
        touch = event.touchForIdentifier(3);
        TKAssertNull(touch);
    },

    testTouchesForWindow: function(){
        var window1 = UIRootWindow.init();
        var window2 = UIRootWindow.init();
        var window3 = UIRootWindow.init();
        var event = UIEvent.initTouchEventWithType(UIEvent.Type.touchesBegan, 123);
        var touch1 = UITouch.initWithIdentifier(1, 123, window1, JSPoint(5, 10));
        var touch2 = UITouch.initWithIdentifier(2, 123, window1, JSPoint(15, 110));
        var touch3 = UITouch.initWithIdentifier(2, 123, window2, JSPoint(15, 110));
        event.addTouch(touch1);
        event.addTouch(touch2);
        event.addTouch(touch3);
        var touches = event.touchesInWindow(window1);
        TKAssertEquals(touches.length, 2);
        TKAssertExactEquals(touches[0], touch1);
        TKAssertExactEquals(touches[1], touch2);
        touches = event.touchesInWindow(window2);
        TKAssertEquals(touches.length, 1);
        TKAssertExactEquals(touches[0], touch3);
        touches = event.touchesInWindow(window3);
        TKAssertEquals(touches.length, 0);
    }

});

})();