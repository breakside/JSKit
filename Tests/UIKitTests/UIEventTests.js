// #import "UIKit/UIKit.js"
// #import "TestKit/TestKit.js"
/* global JSClass, JSObject, UIEvent, TKTestSuite, UIWindow, UIView, JSRect, JSPoint, TKAssertEquals, TKAssertObjectEquals */
'use strict';

(function(){

JSClass("UIEventTests", TKTestSuite, {

    testInitMouseEvent: function(){
        var window = UIWindow.init();
        var event = UIEvent.initMouseEventWithType(UIEvent.Type.LeftMouseDown, 1, window, JSPoint(200, 100));
        TKAssertEquals(event.category, UIEvent.Category.Mouse);
        TKAssertEquals(event.type, UIEvent.Type.LeftMouseDown);
        TKAssertEquals(event.timestamp, 1);
        TKAssertEquals(event.window, window);
        TKAssertObjectEquals(event.locationInWindow, JSPoint(200, 100));
    },

    testInitKeyEvent: function(){
        var window = UIWindow.init();
        var event = UIEvent.initKeyEventWithType(UIEvent.Type.KeyDown, 1, window, 5);
        TKAssertEquals(event.category, UIEvent.Category.Key);
        TKAssertEquals(event.type, UIEvent.Type.KeyDown);
        TKAssertEquals(event.timestamp, 1);
        TKAssertEquals(event.window, window);
        TKAssertEquals(event.keyCode, 5);
    },

    testLocationInView: function(){
        var window = UIWindow.init();
        var view1 = UIView.initWithFrame(JSRect(10, 15, 20, 25));
        var view2 = UIView.initWithFrame(JSRect(2, 3, 7, 8));
        window.contentView.addSubview(view1);
        view1.addSubview(view2);
        var event = UIEvent.initMouseEventWithType(UIEvent.Type.LeftMouseDown, 1, window, JSPoint(16, 24));
        var location1 = event.locationInView(view1);
        TKAssertObjectEquals(location1, JSPoint(6, 9));
        var location2 = event.locationInView(view2);
        TKAssertObjectEquals(location2, JSPoint(4, 6));
    }

});

})();