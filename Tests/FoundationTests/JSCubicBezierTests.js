// #import "Foundation/Foundation.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, JSCubicBezier, JSPoint */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
'use strict';

JSClass("JSCubicBezierTests", TKTestSuite, {

    testConstructor: function(){
        var p1 = JSPoint(1, 2);
        var cp1 = JSPoint(3, 4);
        var cp2 = JSPoint(5, 6);
        var p2 = JSPoint(7, 8);
        var curve = new JSCubicBezier(p1, cp1, cp2, p2);
        TKAssertEquals(curve.p1.x, 1);
        TKAssertEquals(curve.p1.y, 2);
        TKAssertEquals(curve.cp1.x, 3);
        TKAssertEquals(curve.cp1.y, 4);
        TKAssertEquals(curve.cp2.x, 5);
        TKAssertEquals(curve.cp2.y, 6);
        TKAssertEquals(curve.p2.x, 7);
        TKAssertEquals(curve.p2.y, 8);
        TKAssertNotExactEquals(curve.p1, p1);
        TKAssertNotExactEquals(curve.cp1, p1);
        TKAssertNotExactEquals(curve.cp2, p2);
        TKAssertNotExactEquals(curve.p2, p2);

        TKAssertThrows(function(){
            var curve = new JSCubicBezier();
        });

        TKAssertThrows(function(){
            var curve = new JSCubicBezier(p1);
        });

        TKAssertThrows(function(){
            var curve = new JSCubicBezier(p1, cp1);
        });

        TKAssertThrows(function(){
            var curve = new JSCubicBezier(p1, cp1, cp2);
        });
    },

    testCopyConstructor: function(){
        var p1 = JSPoint(1, 2);
        var cp1 = JSPoint(3, 4);
        var cp2 = JSPoint(5, 6);
        var p2 = JSPoint(7, 8);
        var curve1 = new JSCubicBezier(p1, cp1, cp2, p2);
        var curve2 = new JSCubicBezier(curve1);
        TKAssertEquals(curve2.p1.x, 1);
        TKAssertEquals(curve2.p1.y, 2);
        TKAssertEquals(curve2.cp1.x, 3);
        TKAssertEquals(curve2.cp1.y, 4);
        TKAssertEquals(curve2.cp2.x, 5);
        TKAssertEquals(curve2.cp2.y, 6);
        TKAssertEquals(curve2.p2.x, 7);
        TKAssertEquals(curve2.p2.y, 8);
        TKAssertNotExactEquals(curve2.p1, curve1.p1);
        TKAssertNotExactEquals(curve2.cp1, curve1.p1);
        TKAssertNotExactEquals(curve2.cp2, curve1.p2);
        TKAssertNotExactEquals(curve2.p2, curve1.p2);
    },

    testPointAtInterval: function(){
        var p1 = JSPoint(17, 15);
        var cp1 = JSPoint(96, 27);
        var cp2 = JSPoint(-10, 92);
        var p2 = JSPoint(81, 86);
        var curve = JSCubicBezier(p1, cp1, cp2, p2);

        var p = curve.pointAtInterval(0);
        TKAssertFloatEquals(p.x, 17, 0.01);
        TKAssertFloatEquals(p.y, 15, 0.01);

        p = curve.pointAtInterval(1);
        TKAssertFloatEquals(p.x, 81, 0.01);
        TKAssertFloatEquals(p.y, 86, 0.01);

        p = curve.pointAtInterval(0.1);
        TKAssertFloatEquals(p.x, 35.53, 0.01);
        TKAssertFloatEquals(p.y, 20.06, 0.01);

        p = curve.pointAtInterval(0.25);
        TKAssertFloatEquals(p.x, 47.53, 0.01);
        TKAssertFloatEquals(p.y, 32, 0.01);

        p = curve.pointAtInterval(0.5);
        TKAssertFloatEquals(p.x, 44.5, 0.01);
        TKAssertFloatEquals(p.y, 57.25, 0.01);

        p = curve.pointAtInterval(0.75);
        TKAssertFloatEquals(p.x, 43.71, 0.01);
        TKAssertFloatEquals(p.y, 79.12, 0.01);

        p = curve.pointAtInterval(0.9);
        TKAssertFloatEquals(p.x, 59.22, 0.01);
        TKAssertFloatEquals(p.y, 85.79, 0.01);
    },

    testYForX: function(){
        var p1 = JSPoint(17, 15);
        var cp1 = JSPoint(96, 27);
        var cp2 = JSPoint(-10, 92);
        var p2 = JSPoint(81, 86);
        var curve = JSCubicBezier(p1, cp1, cp2, p2);

        var y = curve.yForX(17);
        TKAssertEquals(y.length, 1);
        TKAssertFloatEquals(y[0], 15, 0.01);

        y = curve.yForX(36.78);
        TKAssertEquals(y.length, 1);
        TKAssertFloatEquals(y[0], 20.68, 0.01);

        y = curve.yForX(45);
        TKAssertEquals(y.length, 3);
        TKAssertFloatEquals(y[0], 27.22, 0.01);
        TKAssertFloatEquals(y[1], 55.63, 0.01);
        TKAssertFloatEquals(y[2], 80.54, 0.01);

        y = curve.yForX(58.95);
        TKAssertEquals(y.length, 1);
        TKAssertFloatEquals(y[0], 85.76, 0.01);

        y = curve.yForX(81);
        TKAssertEquals(y.length, 1);
        TKAssertFloatEquals(y[0], 86, 0.01);
    }

});