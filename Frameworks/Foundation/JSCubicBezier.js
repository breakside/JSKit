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

// #import "CoreTypes.js"
// #import "JSMath.js"
'use strict';

JSGlobalObject.JSCubicBezier = function(p1, cp1, cp2, p2){
    if (this === undefined){
        return new JSCubicBezier(p1, cp1, cp2, p2);
    }
    if (p1 instanceof JSCubicBezier){
        this.p1 = JSPoint(p1.p1);
        this.cp1 = JSPoint(p1.cp1);
        this.cp2 = JSPoint(p1.cp2);
        this.p2 = JSPoint(p1.p2);
    }else{
        if (!(p1 instanceof JSPoint)){
            throw new Error("p1 must be a JSPoint");
        }
        if (!(cp1 instanceof JSPoint)){
            throw new Error("cp1 must be a JSPoint");
        }
        if (!(cp2 instanceof JSPoint)){
            throw new Error("cp2 must be a JSPoint");
        }
        if (!(p2 instanceof JSPoint)){
            throw new Error("p2 must be a JSPoint");
        }
        this.p1 = JSPoint(p1);
        this.cp1 = JSPoint(cp1);
        this.cp2 = JSPoint(cp2);
        this.p2 = JSPoint(p2);
    }
};

JSCubicBezier.prototype = {

    pointAtInterval: function(t){
        // Equation for a cubic bezier curve
        // (1-t)^3 * p1 + (1-t)^2 * 3 * t * cp1 + (1 - t) * 3 * t^2 * cp2 + t^3 * p2
        var T = 1 - t;
        var TT = T * T;
        var tt = t * t;
        var A = TT * T;
        var B = TT * 3 * t;
        var C = T * 3 * tt;
        var D = tt * t;
        var x = A * this.p1.x + B * this.cp1.x + C * this.cp2.x + D * this.p2.x;
        var y = A * this.p1.y + B * this.cp1.y + C * this.cp2.y + D * this.p2.y;
        return JSPoint(x, y);
    },

    intervalsForX: function(x){
        // (1-t)^3 * p1 + (1-t)^2 * 3 * t * cp1 + (1 - t) * 3 * t^2 * cp2 + t^3 * p2
        // rearrange so we can solve for t
        // =>
        // (-p1 + 3 * cp1 - 3 * cp2 + p2) * t^3 + (3 * p1 - 6 * cp1 + 3 * cp2) * t^2 + (-3 * p1 + 3 * cp1) * t + p1

        // make the coefficients
        var a = -this.p1.x + 3 * this.cp1.x - 3 * this.cp2.x + this.p2.x;
        var b = 3 * this.p1.x - 6 * this.cp1.x + 3 * this.cp2.x;
        var c = -3 * this.p1.x + 3 * this.cp1.x;
        var d = this.p1.x - x;

        // get the roots, which coorespond to intervals where x is our desired value
        var xIntervals = JSMath.solveCubic(a, b, c, d);
        var t;
        for (var i = xIntervals.length - 1; i >= 0; --i){
            t = Math.round(xIntervals[i] * 100000) / 100000;
            if (t >= 0 && t <= 1){
                xIntervals[i] = t;
            }else{
                xIntervals.splice(i, 1);
            }
        }
        return xIntervals;
    },

    yForX: function(x){
        var xIntervals = this.intervalsForX(x);
        var y = [];
        for (var i = xIntervals.length - 1; i >= 0; --i){
            y.push(this.pointAtInterval(xIntervals[i]).y);
        }

        return y;
    },

    boundingPoints: function(){
        var points = [this.p1, this.p2];
        // find other bounding points by solving where the derivative of our cubic equation equals zero
        // equation for the derivative
        // t^2 * (-3 * p1 + 9 * c1 - 9 * c2 + 3 * p2) + t * (6 * p1 - 12 * c1 + 6 * c2) + (-3 * p1 + 3 * c1);
        var a = -3 * this.p1.x + 9 * this.cp1.x - 9 * this.cp2.x + 3 * this.p2.x;
        var b = 6 * this.p1.x - 12 * this.cp1.x + 6 * this.cp2.x;
        var c = -3 * this.p1.x + 3 * this.cp1.x;
        var t = JSMath.solveQuadradic(a, b, c);
        if (t.length > 0 && t[0] >= 0 && t[0] <= 1){
            points.push(this.pointAtInterval(t[0]));
        }
        if (t.length > 1 && t[1] >= 0 && t[1] <= 1){
            points.push(this.pointAtInterval(t[1]));
        }

        a = -3 * this.p1.y + 9 * this.cp1.y - 9 * this.cp2.y + 3 * this.p2.y;
        b = 6 * this.p1.y - 12 * this.cp1.y + 6 * this.cp2.y;
        c = -3 * this.p1.y + 3 * this.cp1.y;
        t = JSMath.solveQuadradic(a, b, c);
        if (t.length > 0 && t[0] >= 0 && t[0] <= 1){
            points.push(this.pointAtInterval(t[0]));
        }
        if (t.length > 1 && t[1] >= 0 && t[1] <= 1){
            points.push(this.pointAtInterval(t[1]));
        }
        return points;
    }

};