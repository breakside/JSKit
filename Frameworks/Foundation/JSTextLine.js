// #import "Foundation/JSObject.js"
// #import "Foundation/CoreTypes.js"
// #import "Foundation/JSTextRun.js"
/* global JSClass, JSObject, JSSize, JSRange, JSPoint, JSRect, JSDynamicProperty, JSReadOnlyProperty, JSTextRun */
'use strict';

(function(){

JSClass("JSTextLine", JSObject, {

    origin: JSReadOnlyProperty('_origin', null),
    size: JSReadOnlyProperty('_size', null),
    usedSize: JSReadOnlyProperty('_usedSize', null),
    range: JSReadOnlyProperty('_range', null),
    strut: JSReadOnlyProperty('_strut', null),
    runs: JSReadOnlyProperty('_runs', null),

    init: function(){
        this._origin = JSPoint.Zero;
        this._size = JSSize.Zero;
        this._usedSize = JSSize.Zero;
        this._range = JSRange.Zero;
        this._runs = [];
    },

    reinit: function(){
        this._runs = [];
    },

    addStrut: function(run){
        this._strut = run;
        this._size.height = run.size.height;
    },

    addRun: function(run){
        this._runs.push(run);
        if (run.size.height > this._usedSize.height){
            this._usedSize.height = run.size.height;
        }
        if (run.size.height > this._size.height){
            this._size.height = run.size.height;
        }
        if (run.x + run.size.width > this._usedSize.width){
            this._usedSize.width = run.x + run.size.width;
        }
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
            var rect = run.rectForCharacterAtIndex(index - run.range.location);
            rect.origin.x += run.origin.x;
            rect.origin.y += run.origin.y;
            return rect;
        }
        return JSRect(0, this.strut.origin.y, 0, this.strut.size.height);
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
            i = run.range.location;
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
            if (point.x < run.origin.s){
                max = mid;
            }else if (point.x >= run.origin.x + run.size.height){
                min = mid + 1;
            }else{
                min = max = mid;
            }
        }
        if (min == this._runs.length){
            return null;
        }
        return this._runs[min];
    }

});

})();