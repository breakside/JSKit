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
    },

    interpolation: function(p1, percentage){
        return JSPoint(
            this.x + (p1.x - this.x) * percentage,
            this.y + (p1.y - this.y) * percentage
        );
    },

    lineToPointContainsPoint: function(other, point, tolerance){
        // first check if we're within the box defined by the segment
        var minX, maxX;
        if (this.x <= other.x){
            minX = this.x - tolerance;
            maxX = other.x + tolerance;
        }else{
            minX = other.x - tolerance;
            maxX = this.x + tolerance;
        }
        var minY, maxY;
        if (this.y <= other.y){
            minY = this.y - tolerance;
            maxY = other.y + tolerance;
        }else{
            minY = other.y - tolerance;
            maxY = this.y + tolerance;
        }
        if (point.x < minX){
            return false;
        }
        if (point.x > maxX){
            return false;
        }
        if (point.y < minY){
            return false;
        }
        if (point.y > maxY){
            return false;
        }

        // next check for the special cases of a vertical and horizontal line,
        // where we must be near the line if we're within the box
        var dx = (other.x - this.x);
        var dy = (other.y - this.y);
        if (Math.abs(dx) < 0.00001 || (Math.abs(dy) < 0.00001)){
            return true;
        }

        // Finally, find the nearest point to the line and see how far away we are
        var m1 = dy / dx;
        var b1 = this.y - m1 * this.x;
        var m2 = -1/m1;
        var b2 = point.y - m2 * point.x;
        var x = (b2 - b1) / (m1 - m2);
        var y = m1 * x + b1;
        return JSPoint(x, y).distanceToPoint(point) <= tolerance;
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