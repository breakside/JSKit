'use strict';

JSGlobalObject.JSMath = {};

JSMath.isAcceptablyEquivalent = function(x, y, threshold){
    if (threshold === undefined){
        threshold = 1e-6;
    }
    return Math.abs(x - y) < threshold;
};

JSMath.solveLinear = function(a, b){
    if (JSMath.isAcceptablyEquivalent(a, 0)){
        return [];
    }
    return [-b / a];
};

JSMath.solveQuadradic = function(a, b, c){
    if (JSMath.isAcceptablyEquivalent(a, 0)){
        return JSMath.solveLinear(b, c);
    }
    // x = (-b +/- srqt(b^2 - 4ac)) / 2a
    var bb = b * b;
    var square = bb - 4 * a * c;
    var twoA = 2 * a;
    if (JSMath.isAcceptablyEquivalent(square, 0)){
        return [-b / twoA];
    }
    if (square > 0){
        var root = Math.sqrt(square);
        return [
            (-b + root) / twoA,
            (-b - root) / twoA
        ];
    }
    return [];
};

JSMath.solveCubic = function(a, b, c, d){
    if (JSMath.isAcceptablyEquivalent(a, 0)){
        return JSMath.solveQuadradic(b, c, d);
    }
    // https://en.wikipedia.org/wiki/Cubic_function#General_solution_to_the_cubic_equation_with_real_coefficients
    var aa = a * a;
    var aaa = aa * a;
    var bb = b * b;
    var bbb = bb * b;
    var cc = c * c;
    var ccc = cc * c;
    var dd = d * d;
    var D = 18 * a * b * c * d  - 4 * bbb * d + bb * cc - 4 * a * ccc - 27 * aa * dd;
    var D0 = bb - 3 * a * c;
    var D1 = 2 * bbb - 9 * a * b * c + 27 * aa * d;

    if (D > 0){
        // three distinct real roots
        var p = (3 * a * c - bb) / (3 * aa);
        var q = (2 * bbb - 9 * a * b * c + 27 * aa * d) /  (27 * aaa);
        var t;
        var angle;
        var roots = [];
        for (var i = 0; i < 3; ++i){
            angle = Math.acos(((3 * q) / (2 * p)) * Math.sqrt(-3 / p)) / 3 - (2 * i * Math.PI / 3);
            t = 2 * Math.sqrt(-p / 3) * Math.cos(angle);
            roots.push(t - b / (3 * a));
        }
        return roots;
    }

    if (D < 0){
        // one real root
        var q2 = -27 * aa * D;
        var CCC;
        var C;
        if (D0 === 0){
            CCC = D1;
        }else{
            CCC = (D1 + Math.sqrt(q2)) / 2;
        }
        if (CCC < 0){
            C = -Math.pow(-CCC, 1/3);
        }else{
            C = Math.pow(CCC, 1/3);
        }
        if (C === 0){
            return 0;
        }
        return [-1 / (3 * a) * (b + C + D0/C)];
    }

    // D == 0: All real roots, but only 1 or 2 unique
    if (D0 === 0){
        // 1 unique root
        return [-b / (3 * a)];
    }
    // 2 unique roots
    return [
        (9 * a * d - b * c) / (2 * D0),
        (4 * a * b * c - 9 * aa * d - bbb) / (a * D0)
    ];
};