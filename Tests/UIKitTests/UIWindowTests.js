// #import UIKit
// #import TestKit
// #import UIKitTesting
"use strict";

JSClass("UIWindowTests", TKTestSuite, {

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

    testInit: function(){
        var window = UIWindow.init();
        TKAssertExactEquals(window.application, this.app);
    },

    testInitWithFrame: function(){
        var window = UIWindow.initWithFrame(JSRect(0,0,100,100));
        TKAssertExactEquals(window.application, this.app);
    }

});