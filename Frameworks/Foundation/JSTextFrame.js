// #import "Foundation/JSObject.js"
// #import "Foundation/CoreTypes.js"
/* global JSClass, JSObject, JSSize, JSRange, JSRect, JSPoint, JSDynamicProperty, JSReadOnlyProperty, JSTextAlignment */
'use strict';

(function(){

JSClass("JSTextFrame", JSObject, {

    size: JSReadOnlyProperty('_size', null),
    usedSize: JSReadOnlyProperty('_usedSize', null),
    range: JSReadOnlyProperty('_range', null),
    lines: JSReadOnlyProperty('_lines', null),

    initWithLines: function(lines, size, attributes){
        if (lines.length > 0){
            this._range = JSRange(lines[0].range.location, lines[lines.length - 1].range.end - lines[0].range.location);   
        }else{
            this._range = JSRange.Zero;
        }
        this._lines = lines;
        var line;
        var y = 0;
        var width = 0;
        for (var i = 0, l = lines.length; i < l; ++i){
            line = lines[i];
            y = line.origin.y + line.size.height;
            if (line.size.width > width){
                width = line.size.width;
            }
        }
        this._size = JSSize(size);
        this._usedSize = JSSize(width, y);
        if (this._size.width === 0 || this._size.width === Number.MAX_VALUE){
            this._size.width = width;
        }
        if (this._size.height === 0 || this._size.height === Number.MAX_VALUE){
            this._size.height = y;
        }
        switch (attributes.textAlignment){
            case JSTextAlignment.center:
                for (i = 0, l = lines.length; i < l; ++i){
                    line = lines[i];
                    line.origin.x = (this._size.width - line.size.width + line.trailingWhitespaceWidth) / 2.0;
                }
                break;
            case JSTextAlignment.right:
                for (i = 0, l = lines.length; i < l; ++i){
                    line = lines[i];
                    line.origin.x = (this._size.width - line.size.width + line.trailingWhitespaceWidth);
                }
                break;
        }
    },

    drawInContextAtPoint: function(context, point){
        context.save();
        context.translateBy(point.x, point.y);
        for (var i = 0, l = this._lines.length; i < l; ++i){
            this._lines[i].drawInContextAtPoint(context, this._lines[i].origin);
        }
        context.restore();
    },

    lineIndexForCharacterAtIndex: function(index){
        // Bail if we have no lines
        if (this._lines.length === 0){
            return -1;
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
            min -= 1;
        }
        return min;
    },

    lineForCharacterAtIndex: function(index){
        var lineIndex = this.lineIndexForCharacterAtIndex(index);
        if (lineIndex >= 0){
            return this.lines[lineIndex];
        }
        return null;
    },

    lineAtPoint: function(point){
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
            min -= 1;
        }
        return this._lines[min];
    },

    rectForLine: function(line){
        return JSRect(line.origin, line.size);
    }

});

})();