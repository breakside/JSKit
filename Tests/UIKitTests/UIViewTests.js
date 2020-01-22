// #import UIKit
// #import TestKit
// #import "MockWindowServer.js"
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