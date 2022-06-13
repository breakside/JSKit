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

// #import Foundation
// #import "UIHTMLTextRun.js"
// jshint browser: true
'use strict';

(function(){

JSClass("UIHTMLTextLine", JSTextLine, {

    element: null,
    emptyTextNode: null,
    attachmentRuns: null,
    fontLineHeight: 0,
    canvasContext: null,

    initWithElementAndFont: function(element, font, height, location, canvasContext){
        UIHTMLTextLine.$super.initWithHeight.call(this, height, -font.displayDescender, location);
        this.element = element;
        element.style.font = font.cssString(height);
        this.emptyTextNode = element.appendChild(element.ownerDocument.createTextNode('\u200B'));
        this.fontLineHeight = font.displayLineHeight;
        this.attachmentRuns = [];
        this.element.dataset.rangeLocation = location;
        this.element.dataset.rangeLength = 0;
        this.element.dataset.jstext = "line";
        this.canvasContext = canvasContext;
    },

    initWithElement: function(element, runs, trailingWhitespaceWidth, attachmentRuns, canvasContext){
        // constructing this.element before super init because super init calls
        // this.align, which neesd to use this.element
        UIHTMLTextLine.$super.initWithRuns.call(this, runs, trailingWhitespaceWidth);
        this.element = element;
        this.attachmentRuns = attachmentRuns || [];
        var run;
        for (var i = 0, l = runs.length; i < l; ++i){
            run = this.runs[i];
            if (run.element.parentNode !== this.element){
                this.element.appendChild(run.element);
            }
        }
        this.element.dataset.rangeLocation = this._range.location;
        this.element.dataset.rangeLength = this._range.length;
        this.element.dataset.jstext = "line";
        this.canvasContext = canvasContext;
    },

    // verticallyAlignRuns: function(){
    //     // HTML does this for us
    // },

    truncatedLine: function(width, token){
        if (width + 0.1 >= this._size.width){
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
        var metrics = null;
        do {
            run = line.runs[runIndex];
            if (!run.attachment){
                this.canvasContext.font = run.font.cssString();
                metrics = this.canvasContext.measureText(token);
                if (line.size.width - run.size.width + metrics.width <= width){
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

        if (metrics !== null){
            var span = this.element.ownerDocument.createElement("span");
            span.setAttribute("style", run.element.getAttribute("style"));
            span.appendChild(this.element.ownerDocument.createTextNode(token));
            var tokenRun = UIHTMLTextRun.initWithElement(span, run.font, run.attributes, JSRange.Zero);
            tokenRun.size.width = metrics.width;
            line.runs.push(tokenRun);
            line.size.width += tokenRun.size.width;

            var iterator = run.textNode.nodeValue.userPerceivedCharacterIterator(run.textNode.nodeValue.length - 1);
            while (iterator.character !== null && iterator.isMandatoryLineBreak){
                iterator.decrement();
                run.range.length -= iterator.range.length;
                line.range.length -= iterator.range.length;
            }
            while (iterator.character !== null && line.size.width > width){
                metrics = this.canvasContext.measureText(iterator.utf16);
                run.size.width -= metrics.width;
                run.range.length -= iterator.range.length;
                line.size.width -= metrics.width;
                line.range.length -= iterator.range.length;
                run.textNode.nodeValue = run.textNode.nodeValue.substr(0, run.textNode.nodeValue.length - iterator.range.length);
                iterator.decrement();
            }

            if (run.range.length === 0){
                line.runs.splice(line.runs.length - 2, 1);
            }

            tokenRun.origin.x = line.size.width - tokenRun.size.width;

            line.verticallyAlignRuns();
        }

        return line;
    },

    copy: function(){
        var line = UIHTMLTextLine.$super.copy.call(this);
        line.element = this.element.cloneNode();
        if (this.emptyTextNode !== null){
            line.emptyTextNode = this.emptyTextNode.cloneNode();
            line.element.appendChild(line.emptyTextNode);
        }
        line.attachmentRuns = JSCopy(this.attachmentRuns);
        line.fontLineHeight = this.fontLineHeight;
        this.canvasContext = this.canvasContext;
        return line;
    },

    rectForEmptyCharacter: function(){
        return JSRect(0, 0, 0, this.fontLineHeight);
    },

    domSelectionPointForCharacterAtIndex: function(index){
        if (this.range.length === 0){
            return {node: this.emptyTextNode, offset: 0};
        }
        var run = this.runForCharacterAtIndex(index);
        if (run !== null){
            return run.domSelectionPointForCharacterAtIndex(index);
        }
        return {node: this.element, offset: 0};
    },

    debugDescription: JSReadOnlyProperty(),

    getDebugDescription: function(){
        if (this.emptyTextNode !== null){
            "  %dx%d @%d->%d [empty]".sprintf(this._size.width, this._size.height, this._range.location, this._range.end);
        }
        var lines = [];
        lines.push(["  %dx%d @%d->%d".sprintf(this._size.width, this._size.height, this._range.location, this._range.end)]);
        for (var i = 0, l = this.runs.length; i < l; ++i){
            lines.push(this.runs[i].debugDescription);
        }
        return lines.join("\n");
    },

    recalculateSize: function(){
        var lineClientRect = this.element.getBoundingClientRect();
        var runClientRect;
        // The line height should already be an integer, because it is derived from its
        // runs, which use integer font.displayLineHeight values for their heights.
        // However, the width may be a non-integer.  We round up because if we don't,
        // the browser may round down when we ask for a line to be X.y pixels wide, and
        // that wouldn't leave enough space for the final character.
        this._size = JSSize(Math.ceil(lineClientRect.width), this.size.height);
        var run;
        for (var i = 0, l = this.runs.length; i < l; ++i){
            run = this.runs[i];
            runClientRect = run.element.getBoundingClientRect();
            run._origin = JSPoint(runClientRect.left - lineClientRect.left, runClientRect.top - lineClientRect.top);
            run._size = JSSize(runClientRect.width, runClientRect.height);
        }
    },

    recalculateTrailingWhitespace: function(){
        var run;
        var iterator;
        this._trailingWhitespaceWidth = 0;
        for (var i = this.runs.length - 1; i >= 0; --i){
            run = this.runs[i];
            if (!run.textNode || run.textNode.nodeValue.length === 0){
                break;
            }
            iterator = run.textNode.nodeValue.unicodeIterator(run.textNode.nodeValue.length);
            iterator.decrement();
            while (iterator.index > 0 && iterator.isWhiteSpace){
                iterator.decrement();
            }
            if (!iterator.isWhiteSpace){
                iterator.increment();
                this._trailingWhitespaceWidth += run._textFrameConstructionWidthOfRange(JSRange(iterator.index, run.textNode.nodeValue.length - iterator.index));
                break;
            }
        }
    },

    recalculateRange: function(offset){
        var diff = 0;
        this._range = JSRange(this._range.location + offset, 0);
        var run;
        for (var i = 0, l = this._runs.length; i < l; ++i){
            run = this._runs[i];
            diff += run.recalculateRange(offset + diff);
            this._range.length += run._range.length;
        }
        this.element.dataset.rangeLocation = this._range.location;
        this.element.dataset.rangeLength = this._range.length;
        return diff;
    },

});

})();