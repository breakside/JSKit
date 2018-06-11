// #import "UIKit/UIKit.js"
// #import "TestKit/TestKit.js"
/* global JSClass, JSObject, UIEvent, UITouch, TKTestSuite, UIWindow, UIView, JSRect, JSPoint */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertThrows */
'use strict';

(function(){

JSClass("UIEventTests", TKTestSuite, {

    testInitMouseEvent: function(){
        var window = UIWindow.init();
        var event = UIEvent.initMouseEventWithType(UIEvent.Type.leftMouseDown, 1, window, JSPoint(200, 100));
        TKAssertEquals(event.category, UIEvent.Category.mouse);
        TKAssertEquals(event.type, UIEvent.Type.leftMouseDown);
        TKAssertEquals(event.timestamp, 1);
        TKAssertExactEquals(event.window, window);
        TKAssertObjectEquals(event.locationInWindow, JSPoint(200, 100));
    },

    testInitKeyEvent: function(){
        var window = UIWindow.init();
        var event = UIEvent.initKeyEventWithType(UIEvent.Type.keyDown, 1, window, 5);
        TKAssertEquals(event.category, UIEvent.Category.key);
        TKAssertEquals(event.type, UIEvent.Type.keyDown);
        TKAssertEquals(event.timestamp, 1);
        TKAssertExactEquals(event.window, window);
        TKAssertEquals(event.keyCode, 5);
    },

    testInitTouchEvent: function(){
        var event = UIEvent.initTouchEventWithType(UIEvent.Type.touchesBegan, 123);
        TKAssertEquals(event.category, UIEvent.Category.touches);
        TKAssertEquals(event.type, UIEvent.Type.touchesBegan);
        TKAssertEquals(event.timestamp, 123);
    },

    testInitScrollEvent: function(){
        var window = UIWindow.init();
        var event = UIEvent.initScrollEventWithType(UIEvent.Type.scrollWheel, 1, window, JSPoint(100, 200), 10, -3);
        TKAssertEquals(event.category, UIEvent.Category.scroll);
        TKAssertEquals(event.type, UIEvent.Type.scrollWheel);
        TKAssertEquals(event.timestamp, 1);
        TKAssertExactEquals(event.window, window);
        TKAssertObjectEquals(event.locationInWindow, JSPoint(100, 200));
        TKAssertObjectEquals(event.scrollingDelta, JSPoint(10, -3));
    },

    testLocationInView: function(){
        var window = UIWindow.init();
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
        var window = UIWindow.init();
        var event = UIEvent.initTouchEventWithType(UIEvent.Type.touchesBegan, 123);
        TKAssertEquals(event.windows.length, 0);
        TKAssertEquals(event.touches.length, 0);
        var touch1 = UITouch.initWithIdentifier(1, 123, window, JSPoint(5, 10));
        event.addTouch(touch1);
        TKAssertEquals(event.windows.length, 1);
        TKAssertEquals(event.touches.length, 1);
        TKAssertExactEquals(event.windows[0], window);
        TKAssertExactEquals(event.touches[0], touch1);

        var touch2 = UITouch.initWithIdentifier(2, 123, window, JSPoint(15, 110));
        event.addTouch(touch2);
        TKAssertEquals(event.windows.length, 1);
        TKAssertEquals(event.touches.length, 2);
        TKAssertExactEquals(event.windows[0], window);
        TKAssertExactEquals(event.touches[0], touch1);
        TKAssertExactEquals(event.touches[1], touch2);
    },

    testUpdateTouches: function(){
        var window1 = UIWindow.init();
        var window2 = UIWindow.init();
        var window3 = UIWindow.init();
        var touch1 = UITouch.initWithIdentifier(1, 123, window1, JSPoint(5, 10));
        var touch2 = UITouch.initWithIdentifier(2, 123, window1, JSPoint(15, 110));
        var touch3 = UITouch.initWithIdentifier(2, 123, window2, JSPoint(15, 110));
        var event = UIEvent.initTouchEventWithType(UIEvent.Type.touchesBegan, 123);
        event.addTouch(touch1);
        TKAssertEquals(event.category, UIEvent.Category.touches);
        TKAssertEquals(event.type, UIEvent.Type.touchesBegan);
        TKAssertEquals(event.timestamp, 123);
        TKAssertEquals(event.windows.length, 1);
        TKAssertExactEquals(event.windows[0], window1);
        TKAssertEquals(event.touches.length, 1);

        event.addTouch(touch2);
        event.updateTouches(UIEvent.Type.touchesBegan, 124);
        TKAssertEquals(event.windows.length, 1);
        TKAssertExactEquals(event.windows[0], window1);

        event.addTouch(touch3);
        event.updateTouches(UIEvent.Type.touchesBegan, 125);
        TKAssertEquals(event.windows.length, 2);
        TKAssertExactEquals(event.windows[0], window1);
        TKAssertExactEquals(event.windows[1], window2);

        touch1.update(UITouch.Phase.moved, 126, window1, JSPoint(6, 9));
        event.updateTouches(UIEvent.Type.touchesMoved, 126);
        TKAssertEquals(event.windows.length, 2);
        TKAssertExactEquals(event.windows[0], window1);
        TKAssertExactEquals(event.windows[1], window2);

        touch3.update(UITouch.Phase.moved, 127, window1, JSPoint(6, 9));
        event.updateTouches(UIEvent.Type.touchesMoved, 127);
        TKAssertEquals(event.windows.length, 1);
        TKAssertExactEquals(event.windows[0], window1);
    },

    testTouchForIdentifier: function(){
        var window = UIWindow.init();
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
        var window1 = UIWindow.init();
        var window2 = UIWindow.init();
        var window3 = UIWindow.init();
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