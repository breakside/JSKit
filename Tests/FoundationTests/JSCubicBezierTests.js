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

// #import Foundation
// #import TestKit
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
    },

    testBoundingPoints: function(){
        // Vertical S
        var p1 = JSPoint(3, 4);
        var p2 = JSPoint(3, 5);
        var c1 = JSPoint(3.2, 4.2);
        var c2 = JSPoint(2.8, 4.8);
        var curve = JSCubicBezier(p1, c1, c2, p2);
        var points = curve.boundingPoints();
        TKAssertEquals(points.length, 4);
        var rect = this.rectIncludingPoints(points);
        TKAssertNotNull(rect);
        TKAssertFloatEquals(rect.origin.x, 2.9422649);
        TKAssertFloatEquals(rect.origin.y, 4);
        TKAssertFloatEquals(rect.size.width, 0.1154700);
        TKAssertFloatEquals(rect.size.height, 1);

        // Horizontal S
        p1 = JSPoint(4, 3);
        p2 = JSPoint(5, 3);
        c1 = JSPoint(4.2, 3.2);
        c2 = JSPoint(4.8, 2.8);
        curve = JSCubicBezier(p1, c1, c2, p2);
        points = curve.boundingPoints();
        TKAssertEquals(points.length, 4);
        rect = this.rectIncludingPoints(points);
        TKAssertNotNull(rect);
        TKAssertFloatEquals(rect.origin.x, 4);
        TKAssertFloatEquals(rect.origin.y, 2.9422649);
        TKAssertFloatEquals(rect.size.width, 1);
        TKAssertFloatEquals(rect.size.height, 0.1154700);

        // Vertical C
        p1 = JSPoint(3, 4);
        p2 = JSPoint(3, 5);
        c1 = JSPoint(2.8, 4.2);
        c2 = JSPoint(2.8, 4.8);
        curve = JSCubicBezier(p1, c1, c2, p2);
        points = curve.boundingPoints();
        TKAssertEquals(points.length, 3);
        rect = this.rectIncludingPoints(points);
        TKAssertNotNull(rect);
        TKAssertFloatEquals(rect.origin.x, 2.85);
        TKAssertFloatEquals(rect.origin.y, 4);
        TKAssertFloatEquals(rect.size.width, 0.15);
        TKAssertFloatEquals(rect.size.height, 1);

        // Horizontal U
        p1 = JSPoint(4, 3);
        p2 = JSPoint(5, 3);
        c1 = JSPoint(4.2, 3.2);
        c2 = JSPoint(4.8, 3.2);
        curve = JSCubicBezier(p1, c1, c2, p2);
        points = curve.boundingPoints();
        TKAssertEquals(points.length, 3);
        rect = this.rectIncludingPoints(points);
        TKAssertNotNull(rect);
        TKAssertFloatEquals(rect.origin.x, 4);
        TKAssertFloatEquals(rect.origin.y, 3);
        TKAssertFloatEquals(rect.size.width, 1);
        TKAssertFloatEquals(rect.size.height, 0.15);

        // Vertical C flipped
        p1 = JSPoint(3, 4);
        p2 = JSPoint(3, 5);
        c1 = JSPoint(3.2, 4.2);
        c2 = JSPoint(3.2, 4.8);
        curve = JSCubicBezier(p1, c1, c2, p2);
        points = curve.boundingPoints();
        TKAssertEquals(points.length, 3);
        rect = this.rectIncludingPoints(points);
        TKAssertNotNull(rect);
        TKAssertFloatEquals(rect.origin.x, 3);
        TKAssertFloatEquals(rect.origin.y, 4);
        TKAssertFloatEquals(rect.size.width, 0.15);
        TKAssertFloatEquals(rect.size.height, 1);

        // Horizontal U Flipped
        p1 = JSPoint(4, 3);
        p2 = JSPoint(5, 3);
        c1 = JSPoint(4.2, 2.8);
        c2 = JSPoint(4.8, 2.8);
        curve = JSCubicBezier(p1, c1, c2, p2);
        points = curve.boundingPoints();
        TKAssertEquals(points.length, 3);
        rect = this.rectIncludingPoints(points);
        TKAssertNotNull(rect);
        TKAssertFloatEquals(rect.origin.x, 4);
        TKAssertFloatEquals(rect.origin.y, 2.85);
        TKAssertFloatEquals(rect.size.width, 1);
        TKAssertFloatEquals(rect.size.height, 0.15);

        // Exactly vertical
        p1 = JSPoint(3, 4);
        p2 = JSPoint(3, 5);
        c1 = JSPoint(3, 4.2);
        c2 = JSPoint(3, 4.8);
        curve = JSCubicBezier(p1, c1, c2, p2);
        points = curve.boundingPoints();
        TKAssertEquals(points.length, 2);
        rect = this.rectIncludingPoints(points);
        TKAssertNotNull(rect);
        TKAssertFloatEquals(rect.origin.x, 3);
        TKAssertFloatEquals(rect.origin.y, 4);
        TKAssertFloatEquals(rect.size.width, 0);
        TKAssertFloatEquals(rect.size.height, 1);

        // Exactly horizontal
        p1 = JSPoint(4, 3);
        p2 = JSPoint(5, 3);
        c1 = JSPoint(4.2, 3);
        c2 = JSPoint(4.8, 3);
        curve = JSCubicBezier(p1, c1, c2, p2);
        points = curve.boundingPoints();
        TKAssertEquals(points.length, 2);
        rect = this.rectIncludingPoints(points);
        TKAssertNotNull(rect);
        TKAssertFloatEquals(rect.origin.x, 4);
        TKAssertFloatEquals(rect.origin.y, 3);
        TKAssertFloatEquals(rect.size.width, 1);
        TKAssertFloatEquals(rect.size.height, 0);

        // Exaggerated C
        p1 = JSPoint(3, 4);
        p2 = JSPoint(3, 5);
        c1 = JSPoint(2.8, 3.8);
        c2 = JSPoint(2.8, 5.2);
        curve = JSCubicBezier(p1, c1, c2, p2);
        points = curve.boundingPoints();
        TKAssertEquals(points.length, 5);
        rect = this.rectIncludingPoints(points);
        TKAssertNotNull(rect);
        TKAssertFloatEquals(rect.origin.x, 2.85);
        TKAssertFloatEquals(rect.origin.y, 3.980384);
        TKAssertFloatEquals(rect.size.width, 0.15);
        TKAssertFloatEquals(rect.size.height, 1.0392304);

        // Exaggerated U
        p1 = JSPoint(4, 3);
        p2 = JSPoint(5, 3);
        c1 = JSPoint(3.8, 3.2);
        c2 = JSPoint(5.2, 3.2);
        curve = JSCubicBezier(p1, c1, c2, p2);
        points = curve.boundingPoints();
        TKAssertEquals(points.length, 5);
        rect = this.rectIncludingPoints(points);
        TKAssertNotNull(rect);
        TKAssertFloatEquals(rect.origin.x, 3.980384);
        TKAssertFloatEquals(rect.origin.y, 3);
        TKAssertFloatEquals(rect.size.width, 1.0392304);
        TKAssertFloatEquals(rect.size.height, 0.15);
    },

    rectIncludingPoints: function(points){
        if (points.length === 0){
            return null;
        }
        var min = JSPoint(points[0]);
        var max = JSPoint(points[0]);
        var point;
        for (var i = 1, l = points.length; i < l; ++i){
            point = points[i];
            if (point.x < min.x){
                min.x = point.x;
            }
            if (point.y < min.y){
                min.y = point.y;
            }
            if (point.x > max.x){
                max.x = point.x;
            }
            if (point.y > max.y){
                max.y = point.y;
            }
        }
        return JSRect(min, JSSize(max.x - min.x, max.y - min.y));
    }

});