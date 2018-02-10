// #import "UIKit/UIKit.js"
// #import "TestKit/TestKit.js"
// #import "MockWindowServer.js"
/* global JSClass, TKTestSuite, UILayer, MockWindowServer */
'use strict';

JSClass("UILayerTests", TKTestSuite, {

    windowServer: null,

    setup: function(){
        this.windowServer = MockWindowServer.init();
    },

    tearDown: function(){
        this.windowServer = null;
    }

});