// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #import UIKit
// #import TestKit
'use strict';

JSClass("UIAnimationTests", TKTestSuite, {

    testLinearTimingFunction: function(){
        var y = UIAnimation.Timing.linear(10);
        TKAssertEquals(y, 10);
        y = UIAnimation.Timing.linear(45);
        TKAssertEquals(y, 45);
        y = UIAnimation.Timing.linear(-10);
        TKAssertEquals(y, -10);
    },

    testCubicBezierTimingFunction: function(){
        var cp1 = JSPoint(0.5, 0);
        var cp2 = JSPoint(0.5, 1);
        var timing = UIAnimation.Timing.cubicBezier(cp1, cp2);
        var y = timing(0);
        TKAssertFloatEquals(y, 0);
        y = timing(1);
        TKAssertFloatEquals(y, 1);
        y = timing(0.5);
        TKAssertFloatEquals(y, 0.5);
        y = timing(0.1);
        TKAssertFloatEquals(y, 0.0146, 0.0001);
        y = timing(0.9);
        TKAssertFloatEquals(y, 0.9853, 0.0001);
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
        x = UIAnimation.interpolateNull(undefined, undefined, 0.75);
        TKAssertEquals(x, undefined);
        x = UIAnimation.interpolateNull(null, null, 0.75);
        TKAssertEquals(x, null);
    },

    testInterpolateNumber: function(){
        var x = UIAnimation.interpolateNumber(0, 10, 0.5);
        TKAssertFloatEquals(x, 5);
        x = UIAnimation.interpolateNumber(-10, 10, 0.5);
        TKAssertFloatEquals(x, 0);
        x = UIAnimation.interpolateNumber(5, 25, 0.75);
        TKAssertFloatEquals(x, 20);
        x = UIAnimation.interpolateNumber(8, 80, 0);
        TKAssertFloatEquals(x, 8);
        x = UIAnimation.interpolateNumber(8, 80, 1);
        TKAssertFloatEquals(x, 80);
        x = UIAnimation.interpolateNumber(8, 80, 2);
        TKAssertFloatEquals(x, 152);
        x = UIAnimation.interpolateNumber(8, 80, -0.1);
        TKAssertFloatEquals(x, 0.8);
        x = UIAnimation.interpolateNumber(80, 80, 0.3);
        TKAssertFloatEquals(x, 80);
        x = UIAnimation.interpolateNumber(-4, -4, 0.3);
        TKAssertFloatEquals(x, -4);


        x = UIAnimation.interpolateNumber(5, 15, -1);
        TKAssertFloatEquals(x, -5);
        x = UIAnimation.interpolateNumber(5, 15, -0.2);
        TKAssertFloatEquals(x, 3);
        x = UIAnimation.interpolateNumber(5, 15, 1.3);
        TKAssertFloatEquals(x, 18);
        x = UIAnimation.interpolateNumber(5, 15, 2);
        TKAssertFloatEquals(x, 25);
    },

    testInterpolatePoint: function(){
        var point1 = JSPoint(0, 0);
        var point2 = JSPoint(10, 20);
        var point3 = UIAnimation.interpolatePoint(point1, point2, 0.25);
        TKAssertFloatEquals(point1.x, 0);
        TKAssertFloatEquals(point1.y, 0);
        TKAssertFloatEquals(point2.x, 10);
        TKAssertFloatEquals(point2.y, 20);
        TKAssertFloatEquals(point3.x, 2.5);
        TKAssertFloatEquals(point3.y, 5.0);
        point3 = UIAnimation.interpolatePoint(JSPoint(-5, -20), JSPoint(20, 30), 0.6);
        TKAssertFloatEquals(point3.x, 10);
        TKAssertFloatEquals(point3.y, 10);
        point3 = UIAnimation.interpolatePoint(JSPoint(8, -20), JSPoint(80, -50), 0);
        TKAssertFloatEquals(point3.x, 8);
        TKAssertFloatEquals(point3.y, -20);
        point3 = UIAnimation.interpolatePoint(JSPoint(8, -20), JSPoint(80, -50), 1);
        TKAssertFloatEquals(point3.x, 80);
        TKAssertFloatEquals(point3.y, -50);
        point3 = UIAnimation.interpolatePoint(JSPoint(8, -20), JSPoint(80, -50), 2);
        TKAssertFloatEquals(point3.x, 152);
        TKAssertFloatEquals(point3.y, -80);
        point3 = UIAnimation.interpolatePoint(JSPoint(8, -20), JSPoint(80, -50), -0.1);
        TKAssertFloatEquals(point3.x, 0.8);
        TKAssertFloatEquals(point3.y, -17);
        point3 = UIAnimation.interpolatePoint(JSPoint(8, -20), JSPoint(8, -20), 0.3);
        TKAssertFloatEquals(point3.x, 8);
        TKAssertFloatEquals(point3.y, -20);
    },

    testInterpolateSize: function(){
        var size1 = JSSize(0, 0);
        var size2 = JSSize(10, 20);
        var size3 = UIAnimation.interpolateSize(size1, size2, 0.25);
        TKAssertFloatEquals(size1.width, 0);
        TKAssertFloatEquals(size1.height, 0);
        TKAssertFloatEquals(size2.width, 10);
        TKAssertFloatEquals(size2.height, 20);
        TKAssertFloatEquals(size3.width, 2.5);
        TKAssertFloatEquals(size3.height, 5.0);
        size3 = UIAnimation.interpolateSize(JSSize(-5, -20), JSSize(20, 30), 0.6);
        TKAssertFloatEquals(size3.width, 10);
        TKAssertFloatEquals(size3.height, 10);
        size3 = UIAnimation.interpolateSize(JSSize(8, -20), JSSize(80, -50), 0);
        TKAssertFloatEquals(size3.width, 8);
        TKAssertFloatEquals(size3.height, -20);
        size3 = UIAnimation.interpolateSize(JSSize(8, -20), JSSize(80, -50), 1);
        TKAssertFloatEquals(size3.width, 80);
        TKAssertFloatEquals(size3.height, -50);
        size3 = UIAnimation.interpolateSize(JSSize(8, -20), JSSize(80, -50), 2);
        TKAssertFloatEquals(size3.width, 152);
        TKAssertFloatEquals(size3.height, -80);
        size3 = UIAnimation.interpolateSize(JSSize(8, -20), JSSize(80, -50), -0.1);
        TKAssertFloatEquals(size3.width, 0.8);
        TKAssertFloatEquals(size3.height, -17);
        size3 = UIAnimation.interpolateSize(JSSize(8, -20), JSSize(8, -20), 0.3);
        TKAssertFloatEquals(size3.width, 8);
        TKAssertFloatEquals(size3.height, -20);
    },

    testInterpolateRect: function(){
        var rect1 = JSRect(0, 0, 0, 0);
        var rect2 = JSRect(10, 20, 30, 40);
        var rect3 = UIAnimation.interpolateRect(rect1, rect2, 0.25);
        TKAssertFloatEquals(rect1.origin.x, 0);
        TKAssertFloatEquals(rect1.origin.y, 0);
        TKAssertFloatEquals(rect1.size.width, 0);
        TKAssertFloatEquals(rect1.size.height, 0);
        TKAssertFloatEquals(rect2.origin.x, 10);
        TKAssertFloatEquals(rect2.origin.y, 20);
        TKAssertFloatEquals(rect2.size.width, 30);
        TKAssertFloatEquals(rect2.size.height, 40);
        TKAssertFloatEquals(rect3.origin.x, 2.5);
        TKAssertFloatEquals(rect3.origin.y, 5.0);
        TKAssertFloatEquals(rect3.size.width, 7.5);
        TKAssertFloatEquals(rect3.size.height, 10);
        rect3 = UIAnimation.interpolateRect(JSRect(-5, -20, -15, -12), JSRect(20, 30, 40, 50), 0.6);
        TKAssertFloatEquals(rect3.origin.x, 10);
        TKAssertFloatEquals(rect3.origin.y, 10);
        TKAssertFloatEquals(rect3.size.width, 18);
        TKAssertFloatEquals(rect3.size.height, 25.2);
        rect3 = UIAnimation.interpolateRect(JSRect(8, -20, 2, -40), JSRect(80, -50, 12, -100), 0);
        TKAssertFloatEquals(rect3.origin.x, 8);
        TKAssertFloatEquals(rect3.origin.y, -20);
        TKAssertFloatEquals(rect3.size.width, 2);
        TKAssertFloatEquals(rect3.size.height, -40);
        rect3 = UIAnimation.interpolateRect(JSRect(8, -20, 2, -40), JSRect(80, -50, 12, -100), 1);
        TKAssertFloatEquals(rect3.origin.x, 80);
        TKAssertFloatEquals(rect3.origin.y, -50);
        TKAssertFloatEquals(rect3.size.width, 12);
        TKAssertFloatEquals(rect3.size.height, -100);
        rect3 = UIAnimation.interpolateRect(JSRect(8, -20, 2, -40), JSRect(80, -50, 12, -100), 2);
        TKAssertFloatEquals(rect3.origin.x, 152);
        TKAssertFloatEquals(rect3.origin.y, -80);
        TKAssertFloatEquals(rect3.size.width, 22);
        TKAssertFloatEquals(rect3.size.height, -160);
        rect3 = UIAnimation.interpolateRect(JSRect(8, -20, 2, -40), JSRect(80, -50, 12, -100), -0.1);
        TKAssertFloatEquals(rect3.origin.x, 0.8);
        TKAssertFloatEquals(rect3.origin.y, -17);
        TKAssertFloatEquals(rect3.size.width, 1);
        TKAssertFloatEquals(rect3.size.height, -34);
        rect3 = UIAnimation.interpolateRect(JSRect(8, -20, 2, -40), JSRect(8, -20, 2, -40), 0.3);
        TKAssertFloatEquals(rect3.origin.x, 8);
        TKAssertFloatEquals(rect3.origin.y, -20);
        TKAssertFloatEquals(rect3.size.width, 2);
        TKAssertFloatEquals(rect3.size.height, -40);
    },

    testInterpolateAffineTransform: function(){
        var t1 = JSAffineTransform(1, 0, 0, 1, 0, 0);
        var t2 = JSAffineTransform(5, 0.2, -0.4, 7, 20, -30);
        var t3 = UIAnimation.interpolateAffineTransform(t1, t2, 0.5);
        TKAssertFloatEquals(t3.a, 3);
        TKAssertFloatEquals(t3.b, 0.1);
        TKAssertFloatEquals(t3.c, -0.2);
        TKAssertFloatEquals(t3.d, 4);
        TKAssertFloatEquals(t3.tx, 10);
        TKAssertFloatEquals(t3.ty, -15);
        t3 = UIAnimation.interpolateAffineTransform(t1, t2, 0);
        TKAssertFloatEquals(t3.a, 1);
        TKAssertFloatEquals(t3.b, 0);
        TKAssertFloatEquals(t3.c, 0);
        TKAssertFloatEquals(t3.d, 1);
        TKAssertFloatEquals(t3.tx, 0);
        TKAssertFloatEquals(t3.ty, 0);
        t3 = UIAnimation.interpolateAffineTransform(t1, t2, 1);
        TKAssertFloatEquals(t3.a, 5);
        TKAssertFloatEquals(t3.b, 0.2);
        TKAssertFloatEquals(t3.c, -0.4);
        TKAssertFloatEquals(t3.d, 7);
        TKAssertFloatEquals(t3.tx, 20);
        TKAssertFloatEquals(t3.ty, -30);
        t1 = JSAffineTransform(1, 2, 3, 4, 5, 6);
        t2 = JSAffineTransform(1, 2, 3, 4, 5, 6);
        t3 = UIAnimation.interpolateAffineTransform(t1, t2, 0.3);
        TKAssertFloatEquals(t3.a, 1);
        TKAssertFloatEquals(t3.b, 2);
        TKAssertFloatEquals(t3.c, 3);
        TKAssertFloatEquals(t3.d, 4);
        TKAssertFloatEquals(t3.tx, 5);
        TKAssertFloatEquals(t3.ty, 6);
    },

    testInterpolate1Color: function(){
        var space = UIAnimationTests1ColorSpace.init();
        var color1 = JSColor.initWithSpaceAndComponents(space, [0.2]);
        var color2 = JSColor.initWithSpaceAndComponents(space, [0.6]);
        var color3 = UIAnimation.interpolate1Color(color1, color2, 0.5);
        TKAssertFloatEquals(color1.components[0], 0.2);
        TKAssertFloatEquals(color2.components[0], 0.6);
        TKAssertExactEquals(color3.space, space);
        TKAssertFloatEquals(color3.components[0], 0.4);
        color3 = UIAnimation.interpolate1Color(color1, color2, 0);
        TKAssertFloatEquals(color3.components[0], 0.2);
        color3 = UIAnimation.interpolate1Color(color1, color2, 1);
        TKAssertFloatEquals(color3.components[0], 0.6);
        color3 = UIAnimation.interpolate1Color(color1, color2, 2);
        TKAssertFloatEquals(color3.components[0], 1.0);
        color3 = UIAnimation.interpolate1Color(color1, color2, -0.1);
        TKAssertFloatEquals(color3.components[0], 0.16);
        color1 = JSColor.initWithSpaceAndComponents(space, [-0.2]);
        color2 = JSColor.initWithSpaceAndComponents(space, [1.6]);
        color3 = UIAnimation.interpolate1Color(color1, color2, 0.25);
        TKAssertFloatEquals(color3.components[0], 0.25);
        color1 = JSColor.initWithSpaceAndComponents(space, [0.7]);
        color2 = JSColor.initWithSpaceAndComponents(space, [0.7]);
        color3 = UIAnimation.interpolate1Color(color1, color2, 0.3);
        TKAssertFloatEquals(color3.components[0], 0.7);
        color1 = JSColor.initWithSpaceAndComponents(space, [0.7]);
        color2 = JSColor.initWithSpaceAndComponents(space, [0.3]);
        color3 = UIAnimation.interpolate1Color(color1, color2, 0.25);
        TKAssertFloatEquals(color3.components[0], 0.6);
    },

    testInterpolate2Color: function(){
        var color1 = JSColor.initWithSpaceAndComponents(JSColorSpace.gray, [0.2, 0.0]);
        var color2 = JSColor.initWithSpaceAndComponents(JSColorSpace.gray, [0.6, 1.0]);
        var color3 = UIAnimation.interpolate2Color(color1, color2, 0.5);
        TKAssertFloatEquals(color1.components[0], 0.2);
        TKAssertFloatEquals(color1.components[1], 0.0);
        TKAssertFloatEquals(color2.components[0], 0.6);
        TKAssertFloatEquals(color2.components[1], 1.0);
        TKAssertExactEquals(color3.space, JSColorSpace.gray);
        TKAssertFloatEquals(color3.components[0], 0.4);
        TKAssertFloatEquals(color3.components[1], 0.5);
        color3 = UIAnimation.interpolate2Color(color1, color2, 0);
        TKAssertFloatEquals(color3.components[0], 0.2);
        TKAssertFloatEquals(color3.components[1], 0.0);
        color3 = UIAnimation.interpolate2Color(color1, color2, 1);
        TKAssertFloatEquals(color3.components[0], 0.6);
        TKAssertFloatEquals(color3.components[1], 1.0);
        color3 = UIAnimation.interpolate2Color(color1, color2, 2);
        TKAssertFloatEquals(color3.components[0], 1.0);
        TKAssertFloatEquals(color3.components[1], 2.0);
        color3 = UIAnimation.interpolate2Color(color1, color2, -0.1);
        TKAssertFloatEquals(color3.components[0], 0.16);
        TKAssertFloatEquals(color3.components[1], -0.1);
        color1 = JSColor.initWithSpaceAndComponents(JSColorSpace.gray, [-0.2, 0.5]);
        color2 = JSColor.initWithSpaceAndComponents(JSColorSpace.gray, [1.6, 0.5]);
        color3 = UIAnimation.interpolate2Color(color1, color2, 0.25);
        TKAssertFloatEquals(color3.components[0], 0.25);
        TKAssertFloatEquals(color3.components[1], 0.5);
        color1 = JSColor.initWithSpaceAndComponents(JSColorSpace.gray, [-0.2, 0.5]);
        color2 = JSColor.initWithSpaceAndComponents(JSColorSpace.gray, [1.6, 0.1]);
        color3 = UIAnimation.interpolate2Color(color1, color2, 0.25);
        TKAssertFloatEquals(color3.components[0], 0.25);
        TKAssertFloatEquals(color3.components[1], 0.4);
    },

    testInterpolate3Color: function(){
        var space = UIAnimationTests3ColorSpace.init();
        var color1 = JSColor.initWithSpaceAndComponents(space, [0.2, 0.0, 0.5]);
        var color2 = JSColor.initWithSpaceAndComponents(space, [0.6, 1.0, 0.1]);
        var color3 = UIAnimation.interpolate3Color(color1, color2, 0.5);
        TKAssertFloatEquals(color1.components[0], 0.2);
        TKAssertFloatEquals(color1.components[1], 0.0);
        TKAssertFloatEquals(color1.components[2], 0.5);
        TKAssertFloatEquals(color2.components[0], 0.6);
        TKAssertFloatEquals(color2.components[1], 1.0);
        TKAssertFloatEquals(color2.components[2], 0.1);
        TKAssertExactEquals(color3.space, space);
        TKAssertFloatEquals(color3.components[0], 0.4);
        TKAssertFloatEquals(color3.components[1], 0.5);
        TKAssertFloatEquals(color3.components[2], 0.3);
        color3 = UIAnimation.interpolate3Color(color1, color2, 0);
        TKAssertFloatEquals(color3.components[0], 0.2);
        TKAssertFloatEquals(color3.components[1], 0.0);
        TKAssertFloatEquals(color3.components[2], 0.5);
        color3 = UIAnimation.interpolate3Color(color1, color2, 1);
        TKAssertFloatEquals(color3.components[0], 0.6);
        TKAssertFloatEquals(color3.components[1], 1.0);
        TKAssertFloatEquals(color3.components[2], 0.1);
        color3 = UIAnimation.interpolate3Color(color1, color2, 2);
        TKAssertFloatEquals(color3.components[0], 1.0);
        TKAssertFloatEquals(color3.components[1], 2.0);
        TKAssertFloatEquals(color3.components[2], -0.3);
        color3 = UIAnimation.interpolate3Color(color1, color2, -0.1);
        TKAssertFloatEquals(color3.components[0], 0.16);
        TKAssertFloatEquals(color3.components[1], -0.1);
        TKAssertFloatEquals(color3.components[2], 0.54);
        color1 = JSColor.initWithSpaceAndComponents(space, [-0.2, 0.5, 1.0]);
        color2 = JSColor.initWithSpaceAndComponents(space, [1.6, 0.5, 0.0]);
        color3 = UIAnimation.interpolate3Color(color1, color2, 0.25);
        TKAssertFloatEquals(color3.components[0], 0.25);
        TKAssertFloatEquals(color3.components[1], 0.5);
        TKAssertFloatEquals(color3.components[2], 0.75);
    },

    testInterpolate4Color: function(){
        var color1 = JSColor.initWithSpaceAndComponents(JSColorSpace.rgb, [0.2, 0.0, 0.5, 1.0]);
        var color2 = JSColor.initWithSpaceAndComponents(JSColorSpace.rgb, [0.6, 1.0, 0.1, 0.8]);
        var color3 = UIAnimation.interpolate4Color(color1, color2, 0.5);
        TKAssertFloatEquals(color1.components[0], 0.2);
        TKAssertFloatEquals(color1.components[1], 0.0);
        TKAssertFloatEquals(color1.components[2], 0.5);
        TKAssertFloatEquals(color1.components[3], 1.0);
        TKAssertFloatEquals(color2.components[0], 0.6);
        TKAssertFloatEquals(color2.components[1], 1.0);
        TKAssertFloatEquals(color2.components[2], 0.1);
        TKAssertFloatEquals(color2.components[3], 0.8);
        TKAssertExactEquals(color3.space, JSColorSpace.rgb);
        TKAssertFloatEquals(color3.components[0], 0.4);
        TKAssertFloatEquals(color3.components[1], 0.5);
        TKAssertFloatEquals(color3.components[2], 0.3);
        TKAssertFloatEquals(color3.components[3], 0.9);
        color3 = UIAnimation.interpolate4Color(color1, color2, 0);
        TKAssertFloatEquals(color3.components[0], 0.2);
        TKAssertFloatEquals(color3.components[1], 0.0);
        TKAssertFloatEquals(color3.components[2], 0.5);
        TKAssertFloatEquals(color3.components[3], 1.0);
        color3 = UIAnimation.interpolate4Color(color1, color2, 1);
        TKAssertFloatEquals(color3.components[0], 0.6);
        TKAssertFloatEquals(color3.components[1], 1.0);
        TKAssertFloatEquals(color3.components[2], 0.1);
        TKAssertFloatEquals(color3.components[3], 0.8);
        color3 = UIAnimation.interpolate4Color(color1, color2, 2);
        TKAssertFloatEquals(color3.components[0], 1.0);
        TKAssertFloatEquals(color3.components[1], 2.0);
        TKAssertFloatEquals(color3.components[2], -0.3);
        TKAssertFloatEquals(color3.components[3], 0.6);
        color3 = UIAnimation.interpolate4Color(color1, color2, -0.1);
        TKAssertFloatEquals(color3.components[0], 0.16);
        TKAssertFloatEquals(color3.components[1], -0.1);
        TKAssertFloatEquals(color3.components[2], 0.54);
        TKAssertFloatEquals(color3.components[3], 1.02);
        color1 = JSColor.initWithSpaceAndComponents(JSColorSpace.rgb, [-0.2, 0.5, 1.0, 0.0]);
        color2 = JSColor.initWithSpaceAndComponents(JSColorSpace.rgb, [1.6, 0.5, 0.0, 0.0]);
        color3 = UIAnimation.interpolate4Color(color1, color2, 0.25);
        TKAssertFloatEquals(color3.components[0], 0.25);
        TKAssertFloatEquals(color3.components[1], 0.5);
        TKAssertFloatEquals(color3.components[2], 0.75);
        TKAssertFloatEquals(color3.components[3], 0.0);
    },

    testInterpolationForValues: function(){
        var interpolation = UIAnimation.interpolationForValues(null, null);
        TKAssertExactEquals(interpolation, UIAnimation.interpolateNull);

        interpolation = UIAnimation.interpolationForValues(1, null);
        TKAssertExactEquals(interpolation, UIAnimation.interpolateNull);

        interpolation = UIAnimation.interpolationForValues(null, 1);
        TKAssertExactEquals(interpolation, UIAnimation.interpolateNull);

        interpolation = UIAnimation.interpolationForValues(undefined, undefined);
        TKAssertExactEquals(interpolation, UIAnimation.interpolateNull);

        interpolation = UIAnimation.interpolationForValues(1, undefined);
        TKAssertExactEquals(interpolation, UIAnimation.interpolateNull);

        interpolation = UIAnimation.interpolationForValues(undefined, 1);
        TKAssertExactEquals(interpolation, UIAnimation.interpolateNull);

        interpolation = UIAnimation.interpolationForValues(1, 2);
        TKAssertExactEquals(interpolation, UIAnimation.interpolateNumber);

        interpolation = UIAnimation.interpolationForValues(JSPoint(0,0), JSPoint(1,1));
        TKAssertExactEquals(interpolation, UIAnimation.interpolatePoint);

        interpolation = UIAnimation.interpolationForValues(JSSize(0,0), JSSize(1,1));
        TKAssertExactEquals(interpolation, UIAnimation.interpolateSize);

        interpolation = UIAnimation.interpolationForValues(JSRect(0,0,10,10), JSRect(1,1,20,20));
        TKAssertExactEquals(interpolation, UIAnimation.interpolateRect);

        interpolation = UIAnimation.interpolationForValues(JSAffineTransform(1,0,0,1,0,0), JSAffineTransform(2,0,0,2,20,30));
        TKAssertExactEquals(interpolation, UIAnimation.interpolateAffineTransform);

        var space = UIAnimationTests1ColorSpace.init();
        interpolation = UIAnimation.interpolationForValues(JSColor.initWithSpaceAndComponents(space, [1]), JSColor.initWithSpaceAndComponents(space, [0]));
        TKAssertExactEquals(interpolation, UIAnimation.interpolate1Color);

        interpolation = UIAnimation.interpolationForValues(JSColor.initWithSpaceAndComponents(JSColorSpace.gray, [1,0]), JSColor.initWithSpaceAndComponents(JSColorSpace.gray, [0,0.5]));
        TKAssertExactEquals(interpolation, UIAnimation.interpolate2Color);

        space = UIAnimationTests3ColorSpace.init();
        interpolation = UIAnimation.interpolationForValues(JSColor.initWithSpaceAndComponents(space, [1,0,1]), JSColor.initWithSpaceAndComponents(space, [0,1,0.5]));
        TKAssertExactEquals(interpolation, UIAnimation.interpolate3Color);

        interpolation = UIAnimation.interpolationForValues(JSColor.initWithSpaceAndComponents(JSColorSpace.rgb, [1,0,1,1]), JSColor.initWithSpaceAndComponents(JSColorSpace.rgb, [0,1,0.5,1]));
        TKAssertExactEquals(interpolation, UIAnimation.interpolate4Color);

        var fn = function(from, to, progress){ return from; };
        var from = {animationInterpolation: fn};
        var to = {animationInterpolation: fn};

        interpolation = UIAnimation.interpolationForValues(from, to);
        TKAssertExactEquals(interpolation, fn);

        from = {};
        to = {};
        interpolation = UIAnimation.interpolationForValues(from, to);
        TKAssertExactEquals(interpolation, UIAnimation.interpolateNull);
    }

});

JSClass("UIAnimationTests1ColorSpace", JSColorSpace, {

    numberOfComponents: 0,

});

JSClass("UIAnimationTests3ColorSpace", JSColorSpace, {

    numberOfComponents: 2,

});