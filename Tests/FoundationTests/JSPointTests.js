// #import "Foundation/Foundation.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, TKAssert, TKAssertNotNull, TKAssertEquals, TKAssertObjectEquals, JSPoint */
'use strict';

JSClass('JSPointTests', TKTestSuite, {

    testContructor: function(){
        var point = new JSPoint(1, 2);
        TKAssertEquals(point.x, 1);
        TKAssertEquals(point.y, 2);
    },

    testCopyConstructor: function(){
        var point = new JSPoint(3, 4);
        var point2 = new JSPoint(point);
        TKAssertEquals(point2.x, 3);
        TKAssertEquals(point2.y, 4);
        point2.x = 5;
        point2.y = 6;
        TKAssertEquals(point.x, 3);
        TKAssertEquals(point.y, 4);
    },

    testFunction: function(){
        var point = JSPoint(1, 2);
        TKAssertNotNull(point);
        TKAssert(point instanceof JSPoint);
        TKAssertEquals(point.x, 1);
        TKAssertEquals(point.y, 2);
    },

    testNegatives: function(){
        var point = JSPoint(-1, -2);
        TKAssertEquals(point.x, -1);
        TKAssertEquals(point.y, -2);
    }

});