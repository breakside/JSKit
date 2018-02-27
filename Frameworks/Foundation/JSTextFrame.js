// #import "Foundation/JSObject.js"
// #import "Foundation/CoreTypes.js"
/* global JSClass, JSObject, JSSize, JSRange, JSPoint, JSDynamicProperty, JSReadOnlyProperty */
'use strict';

(function(){

JSClass("JSTextFrame", JSObject, {

    size: JSReadOnlyProperty('_size', null),
    usedSize: JSReadOnlyProperty('_usedSize', null),
    range: JSReadOnlyProperty('_range', null),
    lines: JSReadOnlyProperty('_lines', null),

    initWithLines: function(lines, size){
        this._usedSize = JSSize.Zero;
        if (lines.length > 0){
            this._range = JSRange(lines[0].range.location, lines[lines.length - 1].range.end - lines[0].range.location);   
        }else{
            this._range = JSRange.Zero;
        }
        this._lines = lines;
        var line;
        for (var i = 0, l = lines.length; i < l; ++i){
            line = lines[i];
            if (line.origin.y + line.size.height > this._usedSize.height){
                this._usedSize.height = line.origin.y + line.size.height;
            }
            if (line.origin.x + line.size.width > this._usedSize.width){
                this._usedSize.width = line.origin.x + line.size.width;
            }
        }
        this._size = JSSize(size.width || this._usedSize.width, size.height || this._usedSize.height);
    },

    drawInContextAtPoint: function(context, point){
        context.save();
        context.translatCTM(point.x, point.y);
        for (var i = 0, l = this._lines.length; i < l; ++i){
            this._lines[i].drawInContext(context);
        }
        context.restore();
    },

    lineContainingCharacterAtIndex: function(index){
        // Bail if we have no lines
        if (this._lines.length === 0){
            return null;
        }
        // Locate the line that contains the index
        // Using a binary search for efficiency, in case there are a large number of lines
        var min = 0;
        var max = this._lines.length;
        var mid;
        var line;
        var i, l;
        while (min < max){
            mid = Math.floor(min + (max - min) / 2);
            line = this._lines[mid];
            i = line.range.location - this.range.location;
            l = line.range.length;
            if (index < i){
                max = mid;
            }else if (index >= (i + l)){
                min = mid + 1;
            }else{
                min = max = mid;
            }
        }
        if (min == this._lines.length){
            return this._lines[min - 1];
        }
        return this._lines[min];
    },

    lineContainingPoint: function(point){
        // Bail if we have no lines
        if (this._lines.length === 0){
            return null;
        }
        // Locate the line that contains the point
        // Using a binary search for efficiency, in case there are a large number of lines
        var min = 0;
        var max = this._lines.length;
        var mid;
        var line;
        // Search assumes lines are stacked vertically with no spaces
        while (min < max){
            mid = Math.floor(min + (max - min) / 2);
            line = this._lines[mid];
            if (point.y < line.origin.y){
                max = mid;
            }else if (point.y >= line.origin.y + line.size.height){
                min = mid + 1;
            }else{
                min = max = mid;
            }
        }
        if (min == this._lines.length){
            return null;
        }
        return this._lines[min];
    }

});

})();