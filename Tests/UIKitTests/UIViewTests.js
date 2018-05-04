// #import "UIKit/UIKit.js"
// #import "TestKit/TestKit.js"
// #import "MockWindowServer.js"
/* global JSClass, TKTestSuite, UIView, MockWindowServer */
'use strict';

JSClass("UIViewTests", TKTestSuite, {

    windowServer: null,

    setup: function(){
        this.windowServer = MockWindowServer.init();
    },

    teardown: function(){
        this.windowServer = null;
    }

});