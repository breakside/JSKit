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
        var windowServer = UIMockWindowServer.init();
        var bundle = JSBundle.initWithDictionary({Info: {},});
        this.app = UIApplication.initWithBundle(bundle, this.windowServer);
        JSFont.registerSystemFontDescriptor(UIMockFontDescriptor.init());
    },

    teardown: function(){
        this.app.deinit();
        this.app = null;
    },

    testSharedApplication: function(){
        TKAssertNotNull(this.app);
        TKAssertExactEquals(this.app, UIApplication.shared);
    },

    testSingleApplication: function(){
        TKAssertExactEquals(this.app, UIApplication.shared);
        TKAssertThrows(function(){
            var windowServer = UIMockWindowServer.init();
            var bundle = JSBundle.initWithDictionary({Info: {}});
            this.app = UIApplication.initWithBundle(bundle, windowServer);
        });
    },

    testDelegateDidFinishLaunching: function(){
        var launched = false;
        var app = this.app;
        app.delegate = {
            applicationDidFinishLaunching: function(){
                launched = true;
                var window = UIRootWindow.initWithApplication(app);
                window.open();
            }
        };
        var expectation = TKExpectation.init();
        app.bundle = JSBundle.initWithDictionary({
            Info: {
                UIApplicationRequiresUserDefaults: false,
                UIApplicationRequiresFileManager: false
            }
        });
        expectation.call(app.run, app, function(error){
            TKAssertNull(error);
            TKAssert(launched);
        });
        this.wait(expectation, 1.0);
    },

    testWindows: function(){
        TKAssertEquals(this.app.windows.length, 0);
        var window1 = UIWindow.initWithApplication(this.app);
        TKAssertEquals(this.app.windows.length, 0);
        var window2 = UIWindow.initWithApplication(this.app);
        TKAssertEquals(this.app.windows.length, 0);
        window1.open();
        this.app.updateDisplay();
        TKAssertEquals(this.app.windows.length, 1);
        window2.open();
        this.app.updateDisplay();
        TKAssertEquals(this.app.windows.length, 2);
        window2.close();
        this.app.updateDisplay();
        TKAssertEquals(this.app.windows.length, 1);
        window1.close();
        this.app.updateDisplay();
        TKAssertEquals(this.app.windows.length, 0);
    },

    testKeyWindow: function(){
        var window1 = UIWindow.initWithApplication(this.app);
        window1.makeKeyAndOrderFront();
        this.app.updateDisplay();
        TKAssertNotNull(this.app.keyWindow);
        TKAssertExactEquals(this.app.keyWindow, window1);
    },

    testMainWindow: function(){
        var window1 = UIWindow.initWithApplication(this.app);
        window1.open();
        window1.makeMain();
        this.app.updateDisplay();
        TKAssertNotNull(this.app.mainWindow);
        TKAssertExactEquals(this.app.mainWindow, window1);
    },

    testSendEvent: function(){
        var mockWindow = {
            layer: MockLayer.init() ,
            receivedEvent: null,
            sendEvent: function(event){
                this.receivedEvent = event;
            }
        };
        var event = UIEvent.initKeyEventWithType(UIEvent.Type.keyDown, 1, mockWindow, "a", 0x41);
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
        var event = UIEvent.initTouchEventWithType(UIEvent.Type.touchesBegan, 123);
        var touch1 = UITouch.initWithIdentifier(1, 123, mockWindow1, JSPoint(10, 15));
        var touch2 = UITouch.initWithIdentifier(1, 124, mockWindow2, JSPoint(10, 15));
        event.addTouch(touch1);
        this.app.sendEvent(event);
        TKAssertExactEquals(mockWindow1.receivedEvent, event);
        TKAssertNull(mockWindow2.receivedEvent);

        mockWindow1.receivedEvent = null;
        event.addTouch(touch2);
        event.updateTouches(UIEvent.Type.touchesBegan, 124);
        this.app.sendEvent(event);
        TKAssertExactEquals(mockWindow1.receivedEvent, event);
        TKAssertExactEquals(mockWindow2.receivedEvent, event);
    },

    testSendAction: function(){
        var testCount = 0;
        var lastSender = null;
        var window1 = UIWindow.initWithApplication(this.app);
        window1.makeKeyAndOrderFront();
        this.app.updateDisplay();
        var viewClass = UIView.$extend({
            canBecomeFirstResponder: function(){
                return true;
            },
            targetForAction: function(action, sender){
                return this;
            },
            test: function(sender){
                ++testCount;
                lastSender = sender;
            },
        }, "TestView");
        var view = viewClass.init();
        window1.contentView.addSubview(view);
        window1.firstResponder = view;
        TKAssertEquals(testCount, 0);
        this.app.sendAction('test');
        TKAssertEquals(testCount, 1);
        TKAssertExactEquals(lastSender, this.app);
    }

});

})();