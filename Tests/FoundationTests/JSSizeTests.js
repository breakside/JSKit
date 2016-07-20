// #import "Foundation/Foundation.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, TKAssert, TKAssertNotNull, TKAssertEquals, TKAssertObjectEquals, JSSize */
'use strict';

JSClass('JSSizeTests', TKTestSuite, {

    testContructor: function(){
        var size = new JSSize(1, 2);
        TKAssertEquals(size.width, 1);
        TKAssertEquals(size.height, 2);
    },

    testCopyConstructor: function(){
        var size = new JSSize(3, 4);
        var size2 = new JSSize(size);
        TKAssertEquals(size2.width, 3);
        TKAssertEquals(size2.height, 4);
        size2.width = 5;
        size2.height = 6;
        TKAssertEquals(size.width, 3);
        TKAssertEquals(size.height, 4);
    },

    testFunction: function(){
        var size = JSSize(1, 2);
        TKAssertNotNull(size);
        TKAssert(size instanceof JSSize);
        TKAssertEquals(size.width, 1);
        TKAssertEquals(size.height, 2);
    },

    testNegatives: function(){
        var size = JSSize(-1, -2);
        TKAssertEquals(size.width, -1);
        TKAssertEquals(size.height, -2);
    }

});