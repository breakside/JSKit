// #import "Foundation/JSObject.js"
// #import "Foundation/CoreTypes.js"
// #import "Foundation/JSTextRun.js"
/* global JSClass, JSObject, JSTextAlignment, JSSize, JSRange, JSPoint, JSRect, JSDynamicProperty, JSReadOnlyProperty, JSTextRun */
'use strict';

(function(){

JSClass("JSTextLine", JSObject, {

    origin: JSReadOnlyProperty('_origin', null),
    size: JSReadOnlyProperty('_size', null),
    usedSize: JSReadOnlyProperty('_usedSize', null),
    range: JSReadOnlyProperty('_range', null),
    runs: JSReadOnlyProperty('_runs', null),
    frameIndex: 0,

    initWithRuns: function(runs, origin, width, textAlignment){
        this._origin = JSPoint(origin);
        this._range = JSRange(runs[0].range.location, runs[runs.length - 1].range.end - runs[0].range.location);
        this._runs = runs;
        this._usedSize = JSSize.Zero;
        var run;
        for (var i = 0, l = runs.length; i < l; ++i){
            run = runs[i];
            if (run.origin.y + run.size.height > this._usedSize.height){
                this._usedSize.height = run.origin.y + run.size.height;
            }
            if (run.origin.x + run.size.width > this._usedSize.width){
                this._usedSize.width = run.origin.x + run.size.width;
            }
        }
        this._size = JSSize(width || this._usedSize.width, this._usedSize.height);
        this.align(textAlignment);
    },

    drawInContext: function(context){
        for (var i = 0, l = this._runs.length; i < l; ++i){
            this._runs[i].drawInContext(context);
        }
    },

    characterIndexAtPoint: function(point){
        var run = this.runContainingPoint(point);
        if (run !== null){
            point = JSPoint(point.x - run.origin.x, point.y - run.origin.y);
            return run.characterIndexAtPoint(point);
        }
        return 0;
    },

    rectForCharacterAtIndex: function(index){
        var run = this.runContainingCharacterAtIndex(index);
        if (run !== null){
            // FIXME: go all the way to the end of the line if character is not printed, 
            // such as trailing whitespace at the end of a line.
            var rect = run.rectForCharacterAtIndex(index - (run.range.location - this.range.location));
            rect.origin.x += run.origin.x;
            rect.origin.y += run.origin.y;
            return rect;
        }
        return JSRect.Zero;
    },

    runContainingCharacterAtIndex: function(index){
        // Bail if we have no runs
        if (this._runs.length === 0){
            return null;
        }
        // Locate the run that contains the index
        // Using a binary search for efficiency, in case there are a large number of runs
        var min = 0;
        var max = this._runs.length;
        var mid;
        var run;
        var i, l;
        while (min < max){
            mid = Math.floor(min + (max - min) / 2);
            run = this._runs[mid];
            i = run.range.location - this.range.location;
            l = run.range.length;
            if (index < i){
                max = mid;
            }else if (index >= (i + l)){
                min = mid + 1;
            }else{
                min = max = mid;
            }
        }
        if (min == this._runs.length){
            return this._runs[min - 1];
        }
        return this._runs[min];
    },

    runContainingPoint: function(point){
        // Bail if we have no runs
        if (this._runs.length === 0){
            return null;
        }
        // Locate the run that contains the point
        // Using a binary search for efficiency, in case there are a large number of runs
        var min = 0;
        var max = this._runs.length;
        var mid;
        var run;
        // Search assumes runs are stacked horizontally with no spaces
        while (min < max){
            mid = Math.floor(min + (max - min) / 2);
            run = this._runs[mid];
            if (point.x < run.origin.x){
                max = mid;
            }else if (point.x >= run.origin.x + run.size.width){
                min = mid + 1;
            }else{
                min = max = mid;
            }
        }
        if (min == this._runs.length){
            return this._runs[min - 1];
        }
        return this._runs[min];
    },

    align: function(textAlignment){
        var i, l;
        switch (textAlignment){
            case JSTextAlignment.left:
                break;
            case JSTextAlignment.center:
                for (i = 0, l = this._runs.length; i < l; ++i){
                    this._runs[i].origin.x += (this._size.width - this._usedSize.width) / 2.0;
                }
                break;
            case JSTextAlignment.right:
                for (i = 0, l = this._runs.length; i < l; ++i){
                    this._runs[i].origin.x += (this._size.width - this._usedSize.width);
                }
                break;
            case JSTextAlignment.justify:
                // TODO: ugh
                break;
        }
    }

});

})();