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
// #import "UIHTMLTextLine.js"
'use strict';

(function(){

var logger = JSLog("uikit", "text");
var sharedCanvas = null;

JSClass("UIHTMLTextTypesetter", JSTextTypesetter, {

    domDocument: JSReadOnlyProperty('_domDocument'),

    initWithDocument: function(domDocument){
        UIHTMLTextTypesetter.$super.init.call(this);
        this._domDocument = domDocument;
        if (sharedCanvas === null){
            sharedCanvas = this._domDocument.createElement("canvas");
        }
        this.canvasContext = sharedCanvas.getContext("2d");
        this._runElementQueue = [];
        this._lineElementQueue = [];
    },

    _suggestedHTMLLineLayout: null,

    canvasContext: null,

    // MARK: - Element queue

    _lineElementQueue: null,
    _runElementQueue: null,

    enqueueLineElement: function(element){
        this._lineElementQueue.push(element);
    },

    enqueueRunElement: function(element){
        this._runElementQueue.push(element);
    },

    dequeueLineElement: function(){
        if (this._lineElementQueue.length > 0){
            return this._lineElementQueue.pop();
        }
        return null;
    },

    dequeueRunElement: function(){
        if (this._runElementQueue.length > 0){
            return this._runElementQueue.pop();
        }
        return null;
    },

    _runID: 0,

    _createRunElement: function(){
        if (this._runElementQueue.length > 0){
            return this._runElementQueue.pop();
        }
        var span = this.domDocument.createElement("span");
        span.dataset.typesetterId = ++this._runID;
        return span;
    },
    
    _lineID: 0,

    _createLineElement: function(){
        var element;
        if (this._lineElementQueue.length > 0){
            element = this._lineElementQueue.pop();
        }else{
            element = this.domDocument.createElement('div');
            element.dataset.typesetterId = ++this._lineID;
        }
        element.setAttribute("role", "none presentation");
        element.style.lineHeight = '0';
        element.style.whiteSpace = 'pre';
        return element;
    },

    // MARK: - Creating a Line

    createLine: function(range){
        if (range.length === 0){
            return this._createEmptyHTMLLine(range);
        }
        var layout = this._suggestedHTMLLineLayout;
        if (layout === null || !range.isEqual(layout.range)){
            layout = this._layoutHTMLLine(Number.MAX_VALUE, range, JSLineBreakMode.characterWrap);
        }
        return this._createLineFromHTMLLayout(layout);
    },

    suggestLineBreak: function(width, range, lineBreakMode){
        if (range.length === 0){
            return JSRange(range);
        }
        if (width <= 0){
            width = Number.MAX_VALUE;
        }
        this._suggestedHTMLLineLayout = this._layoutHTMLLine(width, range, lineBreakMode);
        return this._suggestedHTMLLineLayout.range;
    },

    // MARK: - Private Helpers for Line Creation

    _createEmptyHTMLLine: function(range){
        var attributes = this._attributedString.attributesAtIndex(range.location);
        attributes = this.resolveAttributes(attributes);
        var font = attributes.font || null;
        var element = this._createLineElement();
        return UIHTMLTextLine.initWithElementAndFont(element, font, font.displayLineHeight, range.location, this.canvasContext);
    },

    _createLineFromHTMLLayout: function(layout){
        var runs = [];
        var run;
        var x = 0;
        var runDescriptor;
        var span;
        var attachmentRuns = [];
        for (var i = 0, l = layout.runDescriptors.length; i < l; ++i){
            runDescriptor = layout.runDescriptors[i];
            span = this._createRunElement();
            if (!runDescriptor.attachment){
                this._styleTextElementWithAttributes(span, runDescriptor.attributes, runDescriptor.font);
                var utf16 = this.attributedString.string.substringInRange(JSRange(runDescriptor.location, runDescriptor.length));
                if (runDescriptor.attributes[JSAttributedString.Attribute.maskCharacter] !== undefined){
                    utf16 = utf16.stringByMaskingWithCharacter(runDescriptor.attributes[JSAttributedString.Attribute.maskCharacter]);
                }
                if (span.childNodes.length > 0){
                    span.childNodes[0].nodeValue = utf16;
                }else{
                    span.appendChild(span.ownerDocument.createTextNode(utf16));
                }
            }else{
                this._styleAttachmentElementWithAttributes(span, runDescriptor.attributes, runDescriptor.attachment);
                if (span.childNodes.length > 0){
                    span.removeChild(span.childNodes[0]);
                }
            }
            run = UIHTMLTextRun.initWithElement(span, runDescriptor.font, runDescriptor.attributes, JSRange(runDescriptor.location, runDescriptor.length));
            run.origin.x = x;
            run.size.width = runDescriptor.width;
            x += run.size.width;
            runs.push(run);
            if (runDescriptor.attachment){
                attachmentRuns.push(run);
            }
        }
        if (runs.length === 0){
            return this._createEmptyHTMLLine(layout.range);
        }
        var div = this._createLineElement();
        return UIHTMLTextLine.initWithElement(div, runs, layout.trailingWhitespaceWidth, attachmentRuns, this.canvasContext);
    },

    _styleTextElementWithAttributes: function(span, attributes, font){
        span.style.display = '';
        span.style.width = '';
        span.style.height = '';
        span.style.position = '';
        span.style.verticalAlign = '';
        span.style.borderBottomWidth = '100%';
        // Font
        span.style.font = font.cssString();

        // Decorations (underline, strike)
        var decorations = [];
        if (attributes[JSAttributedString.Attribute.underline]){
            decorations.push('underline');
        }
        if (attributes[JSAttributedString.Attribute.strike]){
            decorations.push('line-through');
        }
        span.style.textDecoration = decorations.join(' ');

        // Colors
        var textColor = attributes[JSAttributedString.Attribute.textColor];
        var backgroundColor = attributes[JSAttributedString.Attribute.backgroundColor];
        span.style.color = textColor ? textColor.cssString() : 'black';
        span.style.backgroundColor = backgroundColor ? backgroundColor.cssString() : '';
        span.style.pointerEvents = 'none';
    },

    _styleAttachmentElementWithAttributes: function(span, attributes, attachment){
        span.style.display = 'inline-block';
        span.style.position = 'relative';
        span.style.width = '%dpx'.sprintf(attachment.size.width);
        span.style.height = '%dpx'.sprintf(attachment.size.height);
        span.style.verticalAlign = '%dpx'.sprintf(-attachment.baselineAdjustment);
        span.style.font = '';
        span.style.textDecoration = '';
        span.style.color = '';
        span.style.backgroundColor = '';
        span.style.pointerEvents = 'all';
    },

    // MARK: - Private Helpers for Line Break Suggestion

    _layoutHTMLLine: function(width, range, lineBreakMode){
        var remainingRange = JSRange(range);
        var runDescriptors = [];
        var i, l;
        var usedWidth = 0;
        var newline = false;
        var runDescriptor = null;
        var printableRange = UIHTMLTextTypesetterPrintableRange(range.location, 0, 0);
        var printableRanges = [printableRange];
        var printable;
        var preferredFont = null;

        var iterator = this._attributedString.string.userPerceivedCharacterIterator(range.location);
        var runIterator = this._attributedString.runIterator(range.location);
        var attachment;
        var attributes;
        var metrics;
        // Create run descriptors that at fill the line, maybe going a bit over
        do {
            attributes = this.resolveAttributes(runIterator.attributes);
            if (runDescriptor === null){
                runDescriptor = UIHTMLTextTypesetterRunDescriptor(remainingRange.location, attributes);
                runDescriptors.push(runDescriptor);
                preferredFont = runDescriptor.font;
                if (preferredFont !== null){
                    this.canvasContext.font = preferredFont.cssString();
                }
            }
            newline = iterator.isMandatoryLineBreak;
            printable = !newline && !iterator.isWhiteSpace;
            attachment = attributes[JSAttributedString.Attribute.attachment] || null;
            if (attachment !== null){
                attachment.layout(preferredFont, width);
                usedWidth += attachment.size.width;
                runDescriptor.userPerceivedCharacterWidths.push(attachment.size.width);
                runDescriptor.userPerceivedCharacterLengths.push(1);
                runDescriptor.attachment = attachment;
            }else{
                if (!newline){
                    if (attributes[JSAttributedString.Attribute.maskCharacter] !== undefined){
                        metrics = this.canvasContext.measureText(attributes[JSAttributedString.Attribute.maskCharacter]);
                    }else{
                        metrics = this.canvasContext.measureText(iterator.utf16);
                    }
                    usedWidth += metrics.width;
                    runDescriptor.userPerceivedCharacterWidths.push(metrics.width);
                    runDescriptor.userPerceivedCharacterLengths.push(iterator.range.length);
                }
            }
            runDescriptor.length += iterator.range.length;
            remainingRange.advance(iterator.range.length);
            if (printable){
                if (printableRange === null){
                    printableRange = UIHTMLTextTypesetterPrintableRange(iterator.range.location, iterator.range.length, usedWidth);
                    printableRanges.push(printableRange);
                }else{
                    printableRange.length += iterator.range.length;
                    printableRange.width = usedWidth;
                }
            }else{
                printableRange = null;
            }
            iterator.increment();
            if (iterator.range.location >= runIterator.range.end){
                // NOTE: We expect iterator.location to fall on a run boundary, but
                // if it doesn't, then the run boundary splits a user-perceived character, and we'll
                // paint every byte of the character with the attributes that begin the character.
                // It's also technically possible for N runs to be in a N-length user-perceived
                // character, so we can't just assume that a single runIterator.increment() will get
                // us to the run that applies to the next user-perceived charater; therefore, we'll loop.
                // It is up to applications to ensure that run boundaries fall on user-perceived
                // character boundaries, but this code must assume that applications will do the
                // wrong thing, and handle those situations without crashing/looping forever/etc.
                do {
                    runIterator.increment();
                }while (runIterator.range.end < iterator.range.location);
                runDescriptor = null;
            }
        } while (remainingRange.length > 0 && printableRanges[printableRanges.length - 1].width <= width && !newline);

        // Remove any characters causing overage
        // But do nothing in truncation mode, just let the final character overflow so it can
        // be appropriately truncated by the caller
        if (printableRanges[printableRanges.length - 1].width > width && lineBreakMode != JSLineBreakMode.truncateTail){

            if (lineBreakMode == JSLineBreakMode.wordWrap){
                // word wrapping
                iterator.decrement();
                var characterBreakLocation = iterator.range.location;
                // back up to a line break opportunity
                while (iterator.index > range.location && !iterator.isLineBreakOpportunity){
                    iterator.decrement();
                }
                if (iterator.range.location <= range.location){
                    // we couldn't fit a word in, so break by character
                    usedWidth -= this._truncateHTMLRunDescriptorsToLocation(runDescriptors, characterBreakLocation);
                    this._truncateHTMLRangesToLocation(printableRanges, characterBreakLocation);
                }else{
                    usedWidth -= this._truncateHTMLRunDescriptorsToLocation(runDescriptors, iterator.range.location);
                    this._truncateHTMLRangesToLocation(printableRanges, iterator.range.location);
                }
            }else{
                // character wrapping (or unknown/invalid line break mode value)
                iterator.decrement();
                usedWidth -= this._truncateHTMLRunDescriptorsToLocation(runDescriptors, iterator.range.location);
                this._truncateHTMLRangesToLocation(printableRanges, iterator.range.location);
            }

            printableRanges[printableRanges.length - 1].width = Math.min(usedWidth, printableRanges[printableRanges.length - 1].width);
        }

        if (runDescriptors.length > 0){
            var lastDescriptor = runDescriptors[runDescriptors.length - 1];
            return {
                runDescriptors: runDescriptors,
                range: JSRange(range.location, lastDescriptor.location + lastDescriptor.length - range.location),
                trailingWhitespaceWidth: usedWidth - printableRanges[printableRanges.length - 1].width
            };
        }

        return {
            runDescriptors: [],
            range: JSRange(range.location, 0),
            trailingWhitespaceWidth: 0
        };
    },

    _truncateHTMLRunDescriptorsToLocation: function(runDescriptors, location){
        var runDescriptor;
        var end = location + 1;
        var removedWidth = 0;
        var characterWidth;
        var characterLength;
        var i, l;
        while (runDescriptors.length > 0 && end > location){
            runDescriptor = runDescriptors[runDescriptors.length - 1];
            end = runDescriptor.location + runDescriptor.length;
            while (end > location && runDescriptor.userPerceivedCharacterWidths.length > 0){
                characterWidth = runDescriptor.userPerceivedCharacterWidths.pop();
                removedWidth += characterWidth;
                characterLength = runDescriptor.userPerceivedCharacterLengths.pop();
                runDescriptor.length -= characterLength;
                end -= characterLength;
            }
            if (runDescriptor.userPerceivedCharacterWidths.length === 0){
                runDescriptors.pop();
            }
        }
        return removedWidth;
    },

    _truncateHTMLRangesToLocation: function(ranges, location){
        var end = location + 1;
        var range;
        while (ranges.length > 0 && end > location){
            range = ranges[ranges.length - 1];
            end = range.location;
            if (end >= location){
                ranges.pop();
            }else{
                range.length = location - range.location;
            }
        }
        if (ranges.length === 0){
            ranges.push(UIHTMLTextTypesetterPrintableRange(location, 0, 0));
        }
    },

});

var UIHTMLTextTypesetterRunDescriptor = function(location, attributes){
    if (this === undefined){
        return new UIHTMLTextTypesetterRunDescriptor(location, attributes);
    }
    if (location instanceof UIHTMLTextTypesetterRunDescriptor){
        this.location = location.location;
        this.attributes = location.attributes;
        this.length = location.length;
        this.userPerceivedCharacterWidths = JSCopy(location.userPerceivedCharacterWidths);
        this.userPerceivedCharacterLengths = JSCopy(location.userPerceivedCharacterLengths);
        this.font = location.font;
        this.attachment = location.attachment;
    }else{
        this.location = location;
        this.attributes = attributes;
        this.length = 0;
        this.userPerceivedCharacterWidths = [];
        this.userPerceivedCharacterLengths = [];
        this.font = attributes.font || null;
        this.attachment = null;
    }
};

Object.defineProperties(UIHTMLTextTypesetterRunDescriptor.prototype, {

    width: {
        get: function(){
            var width = 0;
            var i, l;
            for (i = 0, l = this.userPerceivedCharacterWidths.length; i < l; ++i){
                width += this.userPerceivedCharacterWidths[i];
            }
            return width;
        }
    }

});

var UIHTMLTextTypesetterPrintableRange = function(location, length, width){
    if (this === undefined){
        return new UIHTMLTextTypesetterPrintableRange(location, length, width);
    }
    if (location instanceof UIHTMLTextTypesetterPrintableRange){
        this.location = location.location;
        this.length = location.length;
        this.width = location.width;
    }else{
        this.location = location;
        this.length = length;
        this.width = width;
    }
};

})();