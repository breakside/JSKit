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
            if (spec.containsKey("stops")){
                var stops = spec.valueForKey("stops");
                var stop;
                var position;
                var color;
                for (var i = 0, l = stops.length; i < l - 1; i += 2){
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

    addStop: function(position, color){
        this.stops.push({position: position, color: color});
    },

    cssString: function(){
        var cssStops = [];
        var stop;
        for (var i = 0, l = this.stops.length; i < l; ++i){
            stop = this.stops[i];
            cssStops.push('%s %f%%'.sprintf(stop.color.cssString(), stop.position * 100));
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