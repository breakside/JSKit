// #import "Foundation/JSObject.js"
// #import "Foundation/JSColor.js"
/* global JSClass, JSObject, JSGradient, JSPoint */
'use strict';

JSClass('JSGradient', JSObject, {

    stops: null,
    start: null,
    end: null,

    init: function(){
        this.start = JSPoint(0, 0);
        this.end = JSPoint(0, 1);
        this.stops = {};
    },

    initWithSpec: function(spec, values){
        JSGradient.$super.initWithSpec.call(this, spec, values);
        this.start = JSPoint(0, 0);
        this.end = JSPoint(0, 1);
        this.stops = {};
        if (('from' in values) && ('to' in values)){
            this.addStop(0, spec.resolvedValue(values.from, "JSColor"));
            this.addStop(1, spec.resolvedValue(values.to, "JSColor"));
        }
    },

    initWithStops: function(position1, color1 /* , ... */){
        this.init();
        var args = Array.prototype.slice.call(arguments, 0);
        for (var i = 0, l = args.length; i + 1 < l; i += 2){
            this.addStop(args[i], args[i + 1]);
        }
    },

    addStop: function(position, color){
        this.stops[position] = color;
    },

    cssString: function(){
        var color;
        var cssStops = [];
        for (var position in this.stops){
            color = this.stops[position];
            cssStops.push('%s %f%%'.sprintf(color.cssString(), position * 100));
        }
        // css degrees start with 0 at bottom and go clockwise
        // atan degrees start with 0 at right and go anticlockwise
        // If we flip x and y, and then flip start and end, the atan
        // calc should come out right.
        var slope = (this.end.x - this.start.x) / (this.start.y - this.end.y);
        var angle = Math.atan(slope);
        if (this.end.y > this.start.y){
            angle += Math.PI;
        }
        angle = angle * 180 / Math.PI;
        return 'linear-gradient(%fdeg, %s)'.sprintf(angle, cssStops.join(', '));
    }

});

JSGradient.gradientBetweenColors = function(color1, color2){
    return JSGradient.initWithStops(0, color1, 1, color2);
};