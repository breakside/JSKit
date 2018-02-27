// #import "UIKit/UIKit.js"
// #import "TestKit/TestKit.js"
// #import "MockWindowServer.js"
/* global JSClass, JSObject, TKTestSuite, UITouch, JSPoint, MockWindowServer, MockLayer, UIApplication, UIEvent, TKAssert, TKAssertNull, TKAssertEquals, TKAssertNotNull, TKAssertExactEquals, TKAssertThrows */
'use strict';

(function(){

JSClass("MockLayer", JSObject, {

    sublayers: null,
    displayed: false,

    init: function(){
        this.sublayers = [];
    },

    display: function(){
        this.displayed = true;
    }

});

JSClass("UIApplicationTests", TKTestSuite, {

    app: null,

    setup: function(){
        var windowServer = MockWindowServer.init();
        this.app = UIApplication.initWithWindowServer(windowServer);
    },

    teardown: function(){
        this.app.deinit();
        this.app = null;
    },

    testSharedApplication: function(){
        TKAssertNotNull(this.app);
        TKAssertExactEquals(this.app, UIApplication.sharedApplication);
    },

    testSingleApplication: function(){
        TKAssertExactEquals(this.app, UIApplication.sharedApplication);
        TKAssertThrows(function(){
            var windowServer = MockWindowServer.init();
            this.app = UIApplication.initWithWindowServer(windowServer);
        });
    },

    testDelegateDidFinishLaunching: function(){
        var launched = false;
        this.app.delegate = {
            applicationDidFinishLaunching: function(){
                launched = true;
            }
        };
        this.app.run();
        TKAssert(launched);
    },

    testWindowInserted: function(){
        var mockWindow1 = { layer: MockLayer.init() };
        var mockWindow2 = { layer: MockLayer.init() };
        TKAssertEquals(this.app.windows.length, 0);
        this.app.windowInserted(mockWindow1);
        TKAssertEquals(this.app.windows.length, 1);
        TKAssert(mockWindow1.layer.displayed);
        TKAssert(!this.app.windowServer.displayServer.updateNeeded);
        this.app.windowInserted(mockWindow2);
        TKAssertEquals(this.app.windows.length, 2);
        TKAssertExactEquals(this.app.windows[0], mockWindow1);
        TKAssertExactEquals(this.app.windows[1], mockWindow2);
    },

    testWindowRemoved: function(){
        var mockWindow1 = { layer: MockLayer.init() };
        var mockWindow2 = { layer: MockLayer.init() };
        var mockWindow3 = { layer: MockLayer.init() };
        TKAssertEquals(this.app.windows.length, 0);
        this.app.windowInserted(mockWindow1);
        TKAssertEquals(this.app.windows.length, 1);
        this.app.windowInserted(mockWindow2);
        TKAssertEquals(this.app.windows.length, 2);
        this.app.windowInserted(mockWindow3);
        TKAssertEquals(this.app.windows.length, 3);
        this.app.windowRemoved(mockWindow2);
        TKAssertEquals(this.app.windows.length, 2);
        TKAssertExactEquals(this.app.windows[0], mockWindow1);
        TKAssertExactEquals(this.app.windows[1], mockWindow3);
        this.app.windowRemoved(mockWindow1);
        TKAssertEquals(this.app.windows.length, 1);
        TKAssertExactEquals(this.app.windows[0], mockWindow3);
        this.app.windowRemoved(mockWindow3);
        TKAssertEquals(this.app.windows.length, 0);
    },

    testKeyWindow: function(){
        var mockWindow = { layer: MockLayer.init() };
        TKAssertNull(this.app.keyWindow);
        this.app.keyWindow = mockWindow;
        TKAssertExactEquals(this.app.keyWindow, mockWindow);
    },

    testSendEvent: function(){
        var mockWindow = {
            layer: MockLayer.init() ,
            receivedEvent: null,
            sendEvent: function(event){
                this.receivedEvent = event;
            }
        };
        var event = UIEvent.initKeyEventWithType(UIEvent.Type.KeyDown, 1, mockWindow, 0x41);
        this.app.sendEvent(event);
        TKAssertExactEquals(mockWindow.receivedEvent, event);
    },

    testSendTouchEvent: function(){
        var mockWindow1 = {
            objectID: 1,
            layer: MockLayer.init() ,
            receivedEvent: null,
            sendEvent: function(event){
                this.receivedEvent = event;
            }
        };
        var mockWindow2 = {
            objectID: 2,
            layer: MockLayer.init() ,
            receivedEvent: null,
            sendEvent: function(event){
                this.receivedEvent = event;
            }
        };
        var event = UIEvent.initTouchEventWithType(UIEvent.Type.TouchesBegan, 123);
        var touch1 = UITouch.initWithIdentifier(1, 123, mockWindow1, JSPoint(10, 15));
        var touch2 = UITouch.initWithIdentifier(1, 124, mockWindow2, JSPoint(10, 15));
        event.addTouch(touch1);
        this.app.sendEvent(event);
        TKAssertExactEquals(mockWindow1.receivedEvent, event);
        TKAssertNull(mockWindow2.receivedEvent);

        mockWindow1.receivedEvent = null;
        event.addTouch(touch2);
        event.updateTouches(UIEvent.Type.TouchesBegan, 124);
        this.app.sendEvent(event);
        TKAssertExactEquals(mockWindow1.receivedEvent, event);
        TKAssertExactEquals(mockWindow2.receivedEvent, event);
    },

    testSendAction: function(){
        var testCount = 0;
        var lastSender = null;
        var mockResponder = {
            targetForAction: function(action, sender){
                return this;
            },
            test: function(sender){
                ++testCount;
                lastSender = sender;
            }
        };
        var mockWindow = {
            layer: MockLayer.init() ,
            firstResponder: mockResponder
        };
        this.app.keyWindow = mockWindow;
        TKAssertEquals(testCount, 0);
        this.app.sendAction('test');
        TKAssertEquals(testCount, 1);
        TKAssertExactEquals(lastSender, this.app);
    }

});

})();