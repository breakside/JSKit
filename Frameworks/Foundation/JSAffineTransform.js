// #feature Math.sqrt
// #feature Math.atan
/* global JSGlobalObject, JSAffineTransform */
'use strict';

JSGlobalObject.JSAffineTransform = function JSAffineTransform(a, b, c, d, tx, ty){
    if (this === undefined){
        if (a === null){
            return null;
        }
        return new JSAffineTransform(a, b, c, d, tx, ty);
    }else if (a instanceof JSAffineTransform){
        this.a = a.a;
        this.b = a.b;
        this.c = a.c;
        this.d = a.d;
        this.tx = a.tx;
        this.ty = a.ty;
    }else{
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.tx = tx;
        this.ty = ty;
    }
};

JSAffineTransform.prototype = {
    a: 0,
    b: 0,
    c: 0,
    d: 0,
    tx: 0,
    ty: 0,

    convertPointFromTransform: function(point){
        // X' = a * X + c * Y + tx
        // Y' = b * X + d * Y + ty
        return JSPoint(
            this.a * point.x + this.c * point.y + this.tx,
            this.b * point.x + this.d * point.y + this.ty
        );
    },

    convertPointToTransform: function(point){
        var inverse = this.inverse();
        return inverse.convertPointFromTransform(point);
    },

    scaledBy: function(sx, sy){
        return JSAffineTransform.Scaled(sx, sy).concatenatedWith(this);
    },

    translatedBy: function(tx, ty){
        return JSAffineTransform.Translated(tx, ty).concatenatedWith(this);
    },

    rotatedBy: function(rads){
        return JSAffineTransform.Rotated(rads).concatenatedWith(this);
    },

    rotatedByDegrees: function(degrees){
        return this.rotatedBy(degrees * Math.PI / 180.0);
    },

    concatenatedWith: function(transform){
        return new JSAffineTransform(
            this.a * transform.a + this.b * transform.c,
            this.a * transform.b + this.b * transform.d,
            this.c * transform.a + this.d * transform.c,
            this.c * transform.b + this.d * transform.d,
            this.tx * transform.a + this.ty * transform.c + transform.tx,
            this.tx * transform.b + this.ty * transform.d + transform.ty
        );
    },

    inverse: function(){
        var determinant = this.a * this.d - this.b * this.c;
        return  new JSAffineTransform(
            this.d / determinant,
            -this.b / determinant,
            -this.c / determinant,
            this.a / determinant,
            (this.c * this.ty - this.d * this.tx) / determinant,
            (this.b * this.tx - this.a * this.ty) / determinant
        );
    },

    isEqual: function(other){
        return this.a == other.a && this.b == other.b && this.c == other.c && this.d == other.d && this.tx == other.tx && this.ty == other.ty;
    }
};

Object.defineProperty(JSAffineTransform.prototype, 'isIdentity', {
    configurable: false,
    get: function JSAffineTransform_isIdentity(){
        return this.a === 1 && this.b === 0 && this.c === 0 && this.d === 1 && this.tx === 0 && this.ty === 0;
    }
});

Object.defineProperty(JSAffineTransform.prototype, 'isRotated', {
    configurable: false,
    get: function JSAffineTransform_isIdentity(){
        return this.b !== 0 || this.c !== 0;
    }
});

Object.defineProperty(JSAffineTransform, 'Identity', {
    get: function(){
        return new JSAffineTransform(1, 0, 0, 1, 0, 0);
    }
});

JSAffineTransform.Scaled = function(sx, sy){
    if (sy === undefined) sy = sx;
    return new JSAffineTransform(sx, 0, 0, sy, 0, 0);
};

JSAffineTransform.Translated = function(tx, ty){
    return new JSAffineTransform(1, 0, 0, 1, tx, ty);
};

JSAffineTransform.Rotated = function(rads){
        var cos = Math.cos(rads);
        var sin = Math.sin(rads);
        return new JSAffineTransform(cos, sin, -sin, cos, 0, 0);
};

JSAffineTransform.RotatedDegrees = function(degs){
    return JSAffineTransform.Rotated(degs * Math.PI / 180.0);
};

JSAffineTransform.Flipped = function(height){
    return JSAffineTransform.Translated(0, height).scaledBy(1, -1);
};

JSAffineTransform.initWithSpec = function(spec){
    if (spec.stringValue !== null){
        var parts = spec.stringValue.parseNumberArray();
        if (parts.length === 6){
            return JSAffineTransform.apply(undefined, parts);
        }
        return null;
    }
    var transform = JSAffineTransform.Identity;
    if (spec.containsKey('scale')){
        var scale = spec.valueForKey("scale");
        if (typeof(scale) === 'number'){
            transform = transform.scaledBy(scale, scale);
        }else if (typeof(scale) === 'string'){
            scale = scale.parseNumberArray();
            transform = transform.scaledBy(scale[0], scale[1]);
        }else if (scale.containsKey('x') && scale.containsKey('y')){
            transform = transform.scaledBy(scale.valueForKey("x"), scale.valueForKey("y"));
        }
    }
    if (spec.containsKey('rotate')){
        transform = transform.rotatedByDegrees(spec.valueForKey("rotate"));
    }
    if (spec.containsKey('a')){
        transform.a = spec.valueForKey("a");
    }
    if (spec.containsKey('b')){
        transform.b = spec.valueForKey("b");
    }
    if (spec.containsKey('c')){
        transform.c = spec.valueForKey("c");
    }
    if (spec.containsKey('d')){
        transform.d = spec.valueForKey("d");
    }
    if (spec.containsKey('tx')){
        transform.tx = spec.valueForKey("txt");
    }
    if (spec.containsKey('ty')){
        transform.ty = spec.valueForKey("ty");
    }
    return transform;
};