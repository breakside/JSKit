// #import "UIKit/UIKit.js"
// #import "TestKit/TestKit.js"
/* global JSClass, JSObject, UITouch, TKTestSuite, UIWindow, UIView, JSRect, JSPoint */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertThrows */
'use strict';

(function(){

JSClass("UITouchTests", TKTestSuite, {

    testInit: function(){
        var window = UIWindow.init();
        var touch = UITouch.initWithIdentifier(1, 123, window, JSPoint(5, 10));
        TKAssertEquals(touch.identifier, 1);
        TKAssertExactEquals(touch.window, window);
        TKAssertEquals(touch.locationInWindow.x, 5);
        TKAssertEquals(touch.locationInWindow.y, 10);
        TKAssertEquals(touch.timestamp, 123);
        TKAssertEquals(touch.phase, UITouch.Phase.began);
    },

    testUpdate: function(){
        var window = UIWindow.init();
        var touch = UITouch.initWithIdentifier(2, 123, window, JSPoint(5, 10));
        TKAssertEquals(touch.identifier, 2);
        touch.update(UITouch.Phase.moved, 124, window, JSPoint(6, 9));
        TKAssertEquals(touch.identifier, 2);
        TKAssertExactEquals(touch.window, window);
        TKAssertEquals(touch.locationInWindow.x, 6);
        TKAssertEquals(touch.locationInWindow.y, 9);
        TKAssertEquals(touch.timestamp, 124);
        TKAssertEquals(touch.phase, UITouch.Phase.moved);
    },

    testIsActive: function(){
        var window = UIWindow.init();
        var touch = UITouch.initWithIdentifier(2, 123, window, JSPoint(5, 10));
        TKAssertEquals(touch.isActive(), true);
        touch.update(UITouch.Phase.moved, 124, window, JSPoint(6, 9));
        TKAssertEquals(touch.isActive(), true);
        touch.update(UITouch.Phase.ended, 124, window, JSPoint(6, 9));
        TKAssertEquals(touch.isActive(), false);

        touch = UITouch.initWithIdentifier(2, 123, window, JSPoint(5, 10));
        TKAssertEquals(touch.isActive(), true);
        touch.update(UITouch.Phase.moved, 124, window, JSPoint(6, 9));
        TKAssertEquals(touch.isActive(), true);
        touch.update(UITouch.Phase.canceled, 124, window, JSPoint(6, 9));
        TKAssertEquals(touch.isActive(), false);
    },

    testLocationInView: function(){
        var window = UIWindow.init();
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