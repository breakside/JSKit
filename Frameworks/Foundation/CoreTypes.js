// #feature Math.cos
// #feature Math.sin
'use strict';
/* global JSGlobalObject, JSSize, JSPoint, JSRect, JSRange, JSAffineTransform, JSConstraintBox, JSInsets */
// -----------------------------------------------------------------------------
// Mark: Sizes

JSGlobalObject.JSSize = function JSSize(width, height){
    if (this === undefined){
        if (width === null){
            return null;
        }
        return new JSSize(width, height);
    }else{
        if (width instanceof JSSize){
            this.width = width.width;
            this.height = width.height;
        }else{
            this.width = width;
            this.height = height;
        }
    }
};

JSSize.prototype = {
    width: 0,
    height: 0,

    isEqual: function(other){
        return this.width == other.width && this.height == other.height;
    },

    toString: function(){
        return "%sx%s".sprintf(this.width, this.height);
    }
};

Object.defineProperty(JSSize, 'Zero', {
    get: function(){
        return new JSSize(0, 0);
    }
});

JSGlobalObject.JSPoint = function JSPoint(x, y){
    if (this === undefined){
        if (x === null){
            return null;
        }
        return new JSPoint(x, y);
    }else{
        if (x instanceof JSPoint){
            this.x = x.x;
            this.y = x.y;
        }else{
            this.x = x;
            this.y = y;
        }
    }
};

JSPoint.prototype = {
    x: 0,
    y: 0,

    isEqual: function(other){
        return this.x == other.x && this.y == other.y;
    },

    toString: function(){
        return "%s,%s".sprintf(this.x, this.y);
    }
};

Object.defineProperty(JSPoint, 'Zero', {
    get: function(){
        return new JSPoint(0, 0);
    }
});

Object.defineProperty(JSPoint, 'UnitCenter', {
    get: function(){
        return new JSPoint(0.5, 0.5);
    }
});


JSGlobalObject.JSRect = function JSRect(x, y, width, height){
    if (this === undefined){
        if (x === null){
            return null;
        }
        return new JSRect(x, y, width, height);
    }else{
        if (x instanceof JSRect){
            this.origin = JSPoint(x.origin);
            this.size = JSSize(x.size);
        }else if ((x instanceof JSPoint) && (y instanceof JSSize)){
            this.origin = JSPoint(x);
            this.size = JSSize(y);
        }else{
            this.origin = JSPoint(x, y);
            this.size = JSSize(width, height);
        }
    }
};

JSRect.prototype = {
    origin: null,
    size: null,

    rectWithInsets: function(top, right, bottom, left){
        if (right === undefined) right = top;
        if (bottom === undefined) bottom = top;
        if (left === undefined) left = right;
        return new JSRect(this.origin.x + left, this.origin.y + top, this.size.width - left - right, this.size.height - top - bottom);
    },

    containsPoint: function(point){
        return point.x >= this.origin.x && point.y >= this.origin.y && point.x < (this.origin.x + this.size.width) && point.y < (this.origin.y + this.size.height);
    },

    isEqual: function(other){
        return this.origin.isEqual(other.origin) && this.size.isEqual(other.size);
    },

    toString: function(){
        return "%s@%s".sprintf(this.size, this.origin);
    }
};

Object.defineProperty(JSRect, 'Zero', {
    get: function(){
        return new JSRect(0, 0, 0, 0);
    }
});

JSGlobalObject.JSRange = function JSRange(location, length){
    if (this === undefined){
        if (location === null){
            return null;
        }
        return new JSRange(location, length);
    }else{
        if (location instanceof JSRange){
            this.location = location.location;
            this.length = location.length;
        }else{
            this.location = location;
            this.length = length;
        }
    }
};

JSRange.prototype = {
    location: 0,
    length: 0,

    contains: function(i){
        return i >= this.location && i < (this.location + this.length);
    },

    isEqual: function(other){
        return this.location === other.location && this.length === other.length;
    },

    advance: function(x){
        if (x > this.length){
            x = this.length;
        }
        this.location += x;
        this.length -= x;
    },

    intersection: function(other){
        if (other.end <= this.location){
            return JSRange(this.location, 0);
        }
        if (other.location >= this.end){
            return JSRange(this.end, 0);
        }
        var location = this.location;
        if (other.location > location){
            location = other.location;
        }
        var end = this.end;
        if (other.end < end){
            end = other.end;
        }
        return new JSRange(location, end - location);
    },

    toString: function(){
        return "%s,%s".sprintf(this.location, this.length);
    }
};

Object.defineProperty(JSRange.prototype, 'end', {
    configurable: false,
    get: function(){
        return this.location + this.length;
    }
});

Object.defineProperty(JSRange, 'Zero', {
    get: function(){
        return new JSRange(0, 0);
    }
});


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

JSGlobalObject.JSConstraintBox = function JSConstraintBox(props){
    if (this === undefined){
        if (props === null){
            return null;
        }
        return new JSConstraintBox(props);
    }else{
        if (props !== undefined){
            for (var x in props){
                this[x] = props[x];
            }
        }
    }
};

JSConstraintBox.prototype = {
    top: undefined,
    bottom: undefined,
    left: undefined,
    right: undefined,
    width: undefined,
    height: undefined
};

JSConstraintBox.Size = function(width, height){
    var box = JSConstraintBox();
    box.width = width;
    box.height = height;
    return box;
};

JSConstraintBox.Margin = function(top, right, bottom, left){
    var box = JSConstraintBox();
    box.top = (top === undefined) ? 0 : top;
    box.right = (right === undefined) ? box.top : right;
    box.bottom = (bottom === undefined) ? box.top : bottom;
    box.left = (left === undefined) ? box.right : left;
    return box;
};

JSConstraintBox.AnchorTop = function(height){
    return new JSConstraintBox({
        top: 0,
        left: 0,
        right: 0,
        height: height
    });
};

JSConstraintBox.AnchorLeft = function(width){
    return new JSConstraintBox({
        top: 0,
        left: 0,
        bottom: 0,
        width: width
    });
};

JSConstraintBox.AnchorBottom = function(height){
    return new JSConstraintBox({
        bottom: 0,
        left: 0,
        right: 0,
        height: height
    });
};

JSConstraintBox.AnchorRight = function(width){
    return new JSConstraintBox({
        top: 0,
        right: 0,
        bottom: 0,
        width: width
    });
};

JSConstraintBox.Rect = function(rect){
    return new JSConstraintBox({
        top: rect.origin.y,
        left: rect.origin.x,
        width: rect.size.width,
        height: rect.size.height
    });
};

JSGlobalObject.JSInsets = function(top, left, bottom, right){
    if (this === undefined){
        if (top === null){
            return null;
        }
        return new JSInsets(top, left, bottom, right);
    }
    if (top instanceof JSInsets){
        this.top = top.top;
        this.left = top.left;
        this.bottom = top.bottom;
        this.right = top.right;
    }else{
        this.top = top;
        this.left = left === undefined ? this.top : left;
        this.bottom = bottom === undefined ? this.top : bottom;
        this.right = right === undefined ? this.left : right;
    }
};

JSInsets.prototype = {
};

Object.defineProperty(JSInsets, 'Zero', {
    enumerable: false,
    get: function JSInsets_Zero(){
        return new JSInsets(0);
    }
});

JSGlobalObject.JSLineBreakMode = {
    TruncateTail: 0,
    WordWrap: 1,
    CharacterWrap: 2
};

JSGlobalObject.JSTextAlignment = {
    Left: "left",
    Center: "center",
    Right: "right",
    Justify: "justify"
};