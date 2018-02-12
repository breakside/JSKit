// #import "UIKit/UIKit.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, UIAnimation, TKAssertEquals, TKAssertExactEquals */
'use strict';

JSClass("UIAnimationTests", TKTestSuite, {

    testLinearTimingFunction: function(){
        var x = UIAnimation.linearTimingFunction(10);
        TKAssertEquals(x, 10);
        x = UIAnimation.linearTimingFunction(45);
        TKAssertEquals(x, 45);
        x = UIAnimation.linearTimingFunction(-10);
        TKAssertEquals(x, -10);
    },

    testInterpolateNull: function(){
        var x = UIAnimation.interpolateNull(0, 10, 0.2);
        TKAssertEquals(x, 0);
        x = UIAnimation.interpolateNull(50, 10, 0.6);
        TKAssertEquals(x, 50);
        x = UIAnimation.interpolateNull(-20, -10, 0.75);
        TKAssertEquals(x, -20);
        x = UIAnimation.interpolateNull(null, 10, 0.6);
        TKAssertEquals(x, null);
        x = UIAnimation.interpolateNull(undefined, -10, 0.75);
        TKAssertEquals(x, undefined);
        x = UIAnimation.interpolateNull(50, null, 0.6);
        TKAssertEquals(x, 50);
        x = UIAnimation.interpolateNull(-20, undefined, 0.75);
        TKAssertEquals(x, -20);
    },

    testInterpolateNumber: function(){
    },

    testInterpolatePoint: function(){
    },

    testInterpolateSize: function(){
    },

    testInterpolateRect: function(){
    },

    testInterpolateAffineTransform: function(){
    },

    testInterpolate1Color: function(){
    },

    testInterpolate2Color: function(){
    },

    testInterpolate3Color: function(){
    },

    testInterpolate4Color: function(){
    }

});