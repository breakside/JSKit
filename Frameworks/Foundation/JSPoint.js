// #feature Math.sqrt
// #feature Math.atan
'use strict';

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
            if (isNaN(x) || isNaN(y)){
                throw new Error("Creating point with NaN");
            }
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
    },

    distanceToPoint: function(other){
        var dx = other.x - this.x;
        var dy = other.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    },

    angleToPoint: function(other){
        var a = Math.atan((other.y - this.y) / (other.x - this.x));
        if (other.x < this.x){
            a += Math.PI;
        }
        if (a < 0){
            a += Math.PI + Math.PI;
        }
        return a;
    },

    adding: function(other){
        return JSPoint(this.x + other.x, this.y + other.y);
    },

    subtracting: function(other){
        return JSPoint(this.x - other.x, this.y - other.y);
    }
};

JSPoint.initWithSpec = function(spec){
    if (spec.stringValue !== null){
        var parts = spec.stringValue.parseNumberArray();
        if (parts.length === 2){
            return JSPoint(parts[0], parts[1]);
        }
        return null;
    }
    if (spec.containsKey('x') && spec.containsKey('y')){
        return JSPoint(spec.valueForKey("x"), spec.valueForKey("y"));
    }
    return null;
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