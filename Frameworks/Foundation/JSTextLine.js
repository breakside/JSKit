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
// #import "CoreTypes.js"
// #import "JSTextRun.js"
'use strict';

(function(){

JSClass("JSTextLine", JSObject, {

    origin: JSReadOnlyProperty('_origin', null),
    size: JSReadOnlyProperty('_size', null),
    trailingWhitespaceWidth: JSReadOnlyProperty('_trailingWhitespaceWidth', 0),
    range: JSReadOnlyProperty('_range', null),
    runs: JSReadOnlyProperty('_runs', null),
    baseline: JSReadOnlyProperty('_baseline', 0),

    _init: function(range, trailingWhitespaceWidth){
        this._origin = JSPoint.Zero;
        this._range = range;
        this._size = JSSize.Zero;
        this._trailingWhitespaceWidth = trailingWhitespaceWidth;
    },

    initWithHeight: function(height, baseline, location){
        this._init(JSRange(location, 0), 0);
        this._runs = [];
        this._size.height = height;
        this._baseline = baseline;
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
        this.verticallyAlignRuns();
    },

    verticallyAlignRuns: function(){
        var run;
        var baseline = 0;
        var i, l;
        for (i = 0, l = this._runs.length; i < l; ++i){
            run = this._runs[i];
            if (run.baseline > baseline){
                baseline = run.baseline;
            }
        }
        var height = this._size.height;
        for (i = 0, l = this._runs.length; i < l; ++i){
            run = this._runs[i];
            if (run.size.height - run.baseline + baseline > height){
                height = run.size.height - run.baseline + baseline;
            }
        }
        this._size.height = height;
        for (i = 0, l = this._runs.length; i < l; ++i){
            run = this._runs[i];
            run.origin.y = height - baseline + run.baseline - run.size.height;
        }
        this._baseline = baseline;
    },

    drawInContextAtPoint: function(context, point){
        context.save();
        context.translateBy(point.x, point.y);
        for (var i = 0, l = this._runs.length; i < l; ++i){
            this._runs[i].drawInContextAtPoint(context, this._runs[i].origin);
        }
        context.restore();
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
            var rect = run.rectForCharacterAtIndex(index);
            rect.origin.x += run.origin.x;
            rect.origin.y += run.origin.y;
            return rect;
        }
        return this.rectForEmptyCharacter();
    },

    rectForEmptyCharacter: function(index){
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
        var line = this.$class.init();
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

    truncatedLine: function(width, token, force){
        if (width + 0.1 >= this._size.width && force !== true){
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
        var tokenChar = token.unicodeIterator().character;
        var tokenGlyph;
        var tokenRun;
        do {
            run = line.runs[runIndex];
            if (!run.attachment){
                tokenGlyph = run.font.glyphForCharacter(tokenChar);
                tokenRun = JSTextRun.initWithGlyphs([tokenGlyph], [1], run.font, run.attributes, JSRange.Zero);
                if (line.size.width - run.size.width + tokenRun.size.width <= width){
                    break;
                }
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

        if (tokenRun){
            line.runs.push(tokenRun);
            line.size.width += tokenRun.size.width;

            var glyph;
            var characterLength;
            var glyphWidth;
            while (line.size.width > width){
                // FIXME: could break up user perceived characters
                // Combining marks seem to have 0 width in some fonts, in which case
                // they won't be broken up since removing just the mark won't
                // reduce the line's width, but I'm not sure if that's
                // true for all multi-codepoint characters and all fonts
                glyph = run.glyphs.pop();
                glyphWidth = run.font.widthOfGlyph(glyph);
                characterLength = run.glyphCharacterLengths.pop();
                run.size.width -= glyphWidth;
                run.range.length -= characterLength;
                line.size.width -= glyphWidth;
                line.range.length -= characterLength;
            }

            tokenRun.origin.x = line.size.width - tokenRun.size.width;

            line.verticallyAlignRuns();
        }

        return line;
    }

});

})();