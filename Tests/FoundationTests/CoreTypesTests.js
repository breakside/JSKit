// #import "Foundation/Foundation.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, TKAssert, TKAssertNotNull, TKAssertEquals, TKAssertObjectEquals, JSSize */
'use strict';

JSClass('CoreTypesTests', TKTestSuite, {

    testSizeContructor: function(){
        var size = new JSSize(1,2);
        TKAssertEquals(size.width, 1);
        TKAssertEquals(size.height, 2);
    },

    testSizeFunction: function(){
        var size = JSSize(1,2);
        TKAssertNotNull(size);
        TKAssert(size instanceof JSSize);
        TKAssertEquals(size.width, 1);
        TKAssertEquals(size.height, 2);
    },

    testSizeNegatives: function(){
        var size = JSSize(-1,-2);
        TKAssertEquals(size.width, -1);
        TKAssertEquals(size.height, -2);
    }

});