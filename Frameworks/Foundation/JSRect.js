// #import "JSPoint.js"
// #import "JSSize.js"
// #import "JSInsets.js"
'use strict';

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

    rectWithInsets: function(top, left, bottom, right){
        if (top instanceof JSInsets){
            right = top.right;
            bottom = top.bottom;
            left = top.left;
            top = top.top;
        }
        if (left === undefined) left = top;
        if (bottom === undefined) bottom = top;
        if (right === undefined) right = left;
        return new JSRect(this.origin.x + left, this.origin.y + top, this.size.width - left - right, this.size.height - top - bottom);
    },

    containsPoint: function(point){
        return point.x >= this.origin.x && point.y >= this.origin.y && point.x < (this.origin.x + this.size.width) && point.y < (this.origin.y + this.size.height);
    },

    intersectsRect: function(other){
        var xIntersects = (other.origin.x < (this.origin.x + this.size.width) && (other.origin.x + other.size.width) > this.origin.x);
        var yIntersects = (other.origin.y < (this.origin.y + this.size.height) && (other.origin.y + other.size.height) > this.origin.y);
        return xIntersects && yIntersects;
    },

    isEqual: function(other){
        return this.origin.isEqual(other.origin) && this.size.isEqual(other.size);
    },

    toString: function(){
        return "%s@%s".sprintf(this.size, this.origin);
    }
};

Object.defineProperty(JSRect.prototype, 'center', {

    get: function JSRect_getCenter(){
        return JSPoint(this.origin.x + this.size.width / 2, this.origin.y + this.size.height / 2);
    },

    set: function JSRect_setCenter(center){
        this.origin = JSPoint(center.x - this.size.width / 2, center.y - this.size.height / 2);
    }

});

Object.defineProperty(JSRect, 'Zero', {
    get: function(){
        return new JSRect(0, 0, 0, 0);
    }
});

JSRect.initWithSpec = function(spec){
    if (spec.stringValue !== null){
        var parts = spec.stringValue.parseNumberArray();
        if (parts.length === 4){
            return JSRect.apply(undefined, parts);
        }
        return null;
    }
    var rect = JSRect.Zero;
    if (spec.containsKey('origin')){
        rect.origin = spec.valueForKey("origin", JSPoint);
    }else{
        if (spec.containsKey('x')){
            rect.origin.x = spec.valueForKey("x");
        }
        if (spec.containsKey('y')){
            rect.origin.x = spec.valueForKey("y");
        }
    }
    if (spec.containsKey('size')){
        rect.size = spec.valueForKey("size", JSSize);
    }else{
        if (spec.containsKey('width')){
            rect.size.width = spec.valueForKey("width");
        }
        if (spec.containsKey('height')){
            rect.size.height = spec.valueForKey("height");
        }
    }
    return rect;
};