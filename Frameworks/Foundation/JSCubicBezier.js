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

    yForX: function(x){
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

        var y = [];
        var t;
        for (var i = xIntervals.length - 1; i >= 0; --i){
            t = Math.round(xIntervals[i] * 100000) / 100000;
            if (t >= 0 && t <= 1){
                y.push(this.pointAtInterval(t).y);
            }
        }

        return y;
    }

};