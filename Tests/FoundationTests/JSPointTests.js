// #import "Foundation/Foundation.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, TKAssert, TKAssertNull, TKAssertNotNull, TKAssertEquals, TKAssertExactEquals, TKAssertObjectEquals, JSPoint */
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

    testNullFunction: function(){
        var point = JSPoint(null);
        TKAssertNull(point);
    },

    testNegatives: function(){
        var point = JSPoint(-1, -2);
        TKAssertEquals(point.x, -1);
        TKAssertEquals(point.y, -2);
    },

    testZero : function(){
        var point = JSPoint.Zero;
        TKAssertExactEquals(point.x, 0);
        TKAssertExactEquals(point.y, 0);
        // make sure .Zero returns a copy each time, and isn't a reference that can be modified
        point.x = 1;
        var point2 = JSPoint.Zero;
        TKAssertExactEquals(point2.x, 0);
    },

    testUnitCenter: function(){
        var point = JSPoint.UnitCenter;
        TKAssertEquals(point.x, 0.5);
        TKAssertEquals(point.y, 0.5);
        point.x = 1;
        // make sure .UnitCenter returns a copy each time, and isn't a reference that can be modified
        var point2 = JSPoint.UnitCenter;
        TKAssertEquals(point2.x, 0.5);
    }

});