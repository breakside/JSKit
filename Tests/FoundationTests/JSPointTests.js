// #import Foundation
// #import TestKit
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
    },

    testDistanceToPoint: function(){
        var a = JSPoint(3, 4);
        var b = JSPoint(3, 7);
        var d = a.distanceToPoint(b);
        TKAssertEquals(d, 3);
        d = b.distanceToPoint(a);
        TKAssertEquals(d, 3);

        b = JSPoint(-3, 13);
        d = a.distanceToPoint(b);
        TKAssertFloatEquals(d, 10.8166538264);
        d = b.distanceToPoint(a);
        TKAssertFloatEquals(d, 10.8166538264);
    },

    testAngleToPoint: function(){
        var a = JSPoint(1, 2);
        var b = JSPoint(3, 2);
        var angle = a.angleToPoint(b);
        TKAssertFloatEquals(angle, 0);
        angle = b.angleToPoint(a);
        TKAssertFloatEquals(angle, Math.PI);

        b = JSPoint(2, 3);
        angle = a.angleToPoint(b);
        TKAssertFloatEquals(angle, Math.PI / 4);
        angle = b.angleToPoint(a);
        TKAssertFloatEquals(angle, Math.PI * 5 / 4);

        b = JSPoint(1, 3);
        angle = a.angleToPoint(b);
        TKAssertFloatEquals(angle, Math.PI / 2);
        angle = b.angleToPoint(a);
        TKAssertFloatEquals(angle, Math.PI * 3 / 2);

        b = JSPoint(0, 3);
        angle = a.angleToPoint(b);
        TKAssertFloatEquals(angle, Math.PI * 3 / 4);
        angle = b.angleToPoint(a);
        TKAssertFloatEquals(angle, Math.PI * 7 / 4);

        b = JSPoint(1, 1);
        angle = a.angleToPoint(b);
        TKAssertFloatEquals(angle, Math.PI * 3 / 2);
        angle = b.angleToPoint(a);
        TKAssertFloatEquals(angle, Math.PI / 2);

        b = JSPoint(2, 1);
        angle = a.angleToPoint(b);
        TKAssertFloatEquals(angle, Math.PI * 7 / 4);
        angle = b.angleToPoint(a);
        TKAssertFloatEquals(angle, Math.PI * 3 / 4);
    }

});