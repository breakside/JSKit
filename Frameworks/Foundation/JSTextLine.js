// #import "Foundation/JSObject.js"
// #import "Foundation/CoreTypes.js"
// #import "Foundation/JSTextRun.js"
/* global JSClass, JSObject, JSTextLine, JSTextGlyph, JSTextAlignment, JSSize, JSRange, JSPoint, JSRect, JSDynamicProperty, JSReadOnlyProperty, JSTextRun */
'use strict';

(function(){

JSClass("JSTextLine", JSObject, {

    origin: JSReadOnlyProperty('_origin', null),
    size: JSReadOnlyProperty('_size', null),
    trailingWhitespaceWidth: JSReadOnlyProperty('_trailingWhitespaceWidth', 0),
    range: JSReadOnlyProperty('_range', null),
    runs: JSReadOnlyProperty('_runs', null),

    _init: function(range, trailingWhitespaceWidth){
        this._origin = JSPoint.Zero;
        this._range = range;
        this._size = JSSize.Zero;
        this._trailingWhitespaceWidth = trailingWhitespaceWidth;
    },

    initWithHeight: function(height, location){
        this._init(JSRange(location, 0), 0);
        this._runs = [];
        this._size.height = height;
    },

    initWithRuns: function(runs, trailingWhitespaceWidth){
        this._init(JSRange(runs[0].range.location, runs[runs.length - 1].range.end - runs[0].range.location), trailingWhitespaceWidth);
        this._runs = runs;
        var run;
        var x = 0;
        for (var i = 0, l = runs.length; i < l; ++i){
            run = runs[i];
            run.origin.x = x;
            x += run.size.width;
            if (run.size.height > this._size.height){
                this._size.height = run.size.height;
            }
            this._size.width += run.size.width;
        }
    },

    drawInContext: function(context){
        for (var i = 0, l = this._runs.length; i < l; ++i){
            this._runs[i].drawInContext(context);
        }
    },

    characterIndexAtPoint: function(point){
        var run = this.runAtPoint(point);
        if (run !== null){
            point = JSPoint(point.x - run.origin.x, point.y - run.origin.y);
            return run.characterIndexAtPoint(point);
        }
        return 0;
    },

    rectForCharacterAtIndex: function(index){
        var run = this.runForCharacterAtIndex(index);
        if (run !== null){
            var rect = run.rectForCharacterAtIndex(index - (run.range.location - this.range.location));
            rect.origin.x += run.origin.x;
            rect.origin.y += run.origin.y;
            return rect;
        }
        return JSRect(0, 0, 0, this.size.height);
    },

    runForCharacterAtIndex: function(index){
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

    runAtPoint: function(point){
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

    copy: function(){
        var line = JSTextLine.init();
        line._origin = JSPoint(this._origin);
        line._size = JSSize(this._size);
        line._trailingWhitespaceWidth = this._trailingWhitespaceWidth;
        line._range = JSRange(this._range);
        line._runs = [];
        for (var i = 0, l = this._runs.length; i < l; ++i){
            line._runs.push(this._runs[i].copy());
        }
        return line;
    },

    truncatedLine: function(width, token){
        if (width >= this._size.width){
            return this;
        }

        if (token === undefined){
            token = "\u2026";
        }
        var line = this.copy();

        // get rid of any runs that put us over the limit
        var runIndex = line.runs.length - 1;
        while (runIndex > 0 && line.size.width - line.runs[runIndex].size.width >= width){
            line.size.width -= line.runs[runIndex].size.width;
            line.range.length -= line.runs[runIndex].range.length;
            line.runs.pop();
            --runIndex;
        }

        // Find the run that has space for ellipis
        var run;
        var tokenGlyph;
        var tokenRun;
        do {
            run = line.runs[runIndex];
            tokenGlyph = JSTextGlyph.FromUTF16(token, run.font);
            tokenRun = JSTextRun.initWithGlyphs([tokenGlyph], run.font, run.attributes, JSRange.Zero);
            if (line.size.width - run.size.width + tokenRun.size.width <= width){
                break;
            }
            line.runs.pop();
            line.size.width -= run.size.width;
            line.range.length -= run.range.length;
            --runIndex;
        }while (runIndex >= 0);

        // Bail if there's no room for even the token
        if (runIndex < 0){
            return line;
        }

        line.runs.push(tokenRun);
        line.size.width += tokenRun.size.width;

        var glyph;
        while (line.size.width > width){
            glyph = run.glyphs.pop();
            run.size.width -= glyph.width;
            run.range.length -= glyph.length;
            line.size.width -= glyph.width;
            line.range.length -= glyph.length;
        }

        return line;
    }

});

})();