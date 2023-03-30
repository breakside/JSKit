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

// #import "JSObject.js"
// #import "JSColor.js"
// #import "CoreTypes.js"
'use strict';

JSClass('JSGradient', JSObject, {

    stops: null,
    start: null,
    end: null,

    init: function(){
        this.start = JSPoint(0, 0);
        this.end = JSPoint(0, 1);
        this.stops = [];
    },

    initWithSpec: function(spec){
        JSGradient.$super.initWithSpec.call(this, spec);
        this.stops = [];
        if (spec.containsKey('from') && spec.containsKey('to')){
            this.start = JSPoint(0, 0);
            this.end = JSPoint(0, 1);
            this.addStop(0, spec.valueForKey("from", JSColor));
            this.addStop(1, spec.valueForKey("to", JSColor));
        }else{
            if (spec.containsKey("start")){
                this.start = spec.valueForKey("start", JSPoint);
            }else{
                this.start = JSPoint(0, 0);
            }
            if (spec.containsKey("end")){
                this.end = spec.valueForKey("end", JSPoint);
            }else{
                this.end = JSPoint(0, 1);
            }
            var i, l;
            var color;
            var position;
            if (spec.containsKey("stops")){
                var stops = spec.valueForKey("stops");
                var stop;
                for (i = 0, l = stops.length; i < l - 1; i += 2){
                    position = stops.valueForKey(i);
                    if (typeof(position) === "string" && position.endsWith("%")){
                        position = parseFloat(position.substr(0, position.length - 1)) / 100;
                    }
                    if (isNaN(position)){
                        throw new Error("JSGradient.initWithSpec cannot parse `at` value. Must be a number or a percentage string");
                    }
                    color = stops.valueForKey(i + 1, JSColor);
                    this.addStop(position, color);
                }
            }else if (spec.containsKey("colors")){
                var colors = spec.valueForKey("colors");
                if (colors.length > 0){
                    if (colors.length == 1){
                        color = colors.valueForKey(i, JSColor);
                        this.addStop(0, color);
                        this.addStop(1, color);
                    }else{
                        position = 0;
                        var step = 1 / (colors.length - 1);
                        for (i = 0, l = colors.length; i < l; ++i, position += step){
                            color = colors.valueForKey(i, JSColor);
                            this.addStop(position, color);
                        }
                    }
                }
            }
        }
    },

    initWithStops: function(position1, color1 /* , ... */){
        this.init();
        var args = Array.prototype.slice.call(arguments, 0);
        for (var i = 0, l = args.length; i + 1 < l; i += 2){
            this.addStop(args[i], args[i + 1]);
        }
    },

    initWithColors: function(colors, start, end){
        this.init();
        if (start !== undefined){
            this.start = JSPoint(start);
        }
        if (end !== undefined){
            this.end = JSPoint(end);
        }
        if (colors.length > 0){
            if (colors.length < 2){
                this.addStop(0, colors[0]);
                this.addStop(1, colors[0]);
            }else{
                var step = 1 / (colors.length - 1);
                var position = 0;
                for (var i = 0, l = colors.length; i < l; ++i, position += step){
                    this.addStop(position, colors[i]);
                }
            }
        }
    },

    addStop: function(position, color){
        this.stops.push({position: position, color: color});
    },

    cssString: function(size){
        var cssStops = [];
        var stop;
        for (var i = 0, l = this.stops.length; i < l; ++i){
            stop = this.stops[i];
            cssStops.push('%s %f%%'.sprintf(stop.color.cssString(), stop.position * 100));
        }
        var start = JSPoint(this.start.x * size.width, this.start.y * size.height);
        var end = JSPoint(this.end.x * size.width, this.end.y * size.height);
        // css degrees start with 0 at bottom and go clockwise
        // atan degrees start with 0 at right and go anticlockwise
        // If we flip x and y, and then flip start and end, the atan
        // calc should come out right.
        var slope = (end.x - start.x) / (start.y - end.y);
        var angle = Math.atan(slope);
        if (end.y > start.y){
            angle += Math.PI;
        }
        angle = angle * 180 / Math.PI;
        return 'linear-gradient(%fdeg, %s)'.sprintf(angle, cssStops.join(', '));
    },

    colorAtPosition: function(position){
        if (position <= this.stops[0].position){
            return this.stops[0].color;
        }
        var l = this.stops.length;
        if (position >= this.stops[l - 1].position){
            return this.stops[l - 1].color;
        }
        var i;
        for (i = l - 2; i > 0; --i){
            if (position >= this.stops[i].position){
                break;
            }
        }
        var stop0 = this.stops[i];
        var stop1 = this.stops[i + 1];
        var percentage = (position - stop0.position) / (stop1.position - stop0.position);
        return stop0.color.colorByBlendingColor(stop1.color, percentage);
    },

    gradientBetweenPositions: function(position0, position1){
        var gradient = JSGradient.init();
        var position;
        var color;
        var i = 0;
        var l = this.stops.length;
        var stop0, stop1;
        var percentage;
        for (; i < l && this.stops[i].position < position0; ++i){
        }
        if (i < l){
            if (i > 0){
                stop0 = this.stops[i - 1];
                stop1 = this.stops[i];
                color = stop0.color.colorByBlendingColor(stop1.color, (position0 - stop0.position) / (stop1.position - stop0.position));
                gradient.addStop(0, color);
            }
            for (; i < l && this.stops[i].position <= position1; ++i){
                stop0 = this.stops[i];
                position = (stop0.position - position0) / (position1 - position0);
                gradient.addStop(position, stop0.color);
            }
            if (i < l && position1 > stop0.position){
                stop0 = this.stops[i - 1];
                stop1 = this.stops[i];
                color = stop0.color.colorByBlendingColor(stop1.color, (position1 - stop0.position) / (stop1.position - stop0.position));
                gradient.addStop(1, color);
            }
        }else{
            gradient.addStop(0, this.stops[l - 1].color);
            gradient.addStop(1, this.stops[l - 1].color);
        }
        return gradient;
    },

    rotated: function(radians){
        var transform = JSAffineTransform.Translated(0.5, 0.5);
        transform = transform.rotatedBy(radians);
        transform = transform.translatedBy(-0.5, -0.5);
        var gradient = JSGradient.init();
        gradient.start = transform.convertPointFromTransform(this.start);
        gradient.end = transform.convertPointFromTransform(this.end);
        gradient.stops = JSCopy(this.stops);
        return gradient;
    }

});

JSGradient.gradientBetweenColors = function(color1, color2){
    return JSGradient.initWithStops(0, color1, 1, color2);
};