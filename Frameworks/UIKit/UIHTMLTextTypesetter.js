// #import "Foundation/Foundation.js"
// #import "UIKit/UIHTMLTextLine.js"
// #import "UIKit/UIHTMLTextRun.js"
/* global JSClass, JSReadOnlyProperty, JSTextTypesetter, JSSize, UIHTMLTextTypesetter, UIHTMLTextLine, UIHTMLTextRun, JSRange, JSAttributedString, JSLineBreakMode, jslog_create */
'use strict';

(function(){

var logger = jslog_create("html-typesetter");

var sharedDomRange = null;
var sharedElement = null;

JSClass("UIHTMLTextTypesetter", JSTextTypesetter, {

    domDocument: JSReadOnlyProperty('_domDocument'),
    _element: null,
    _cachedLayout: null,
    _suggestionCache: null,

    initWithDocument: function(domDocument){
        UIHTMLTextTypesetter.$super.init.call(this);
        this._domDocument = domDocument;
        if (sharedElement === null){
            sharedElement = domDocument.createElement('div');
            sharedElement.style.position = 'absolute';
            sharedElement.style.right = '0';
            sharedElement.style.right = '0';
            sharedElement.style.backgroundColor = 'rgb(255,240,240)';
            sharedElement.style.lineHeight = '0';
            this._domDocument.body.appendChild(sharedElement);
        }
        this._element = sharedElement;
        if (sharedDomRange === null){
            sharedDomRange = this._domDocument.createRange();
        }
    },

    layoutRange: function(range, size, lineBreakMode){
        this._styleElement(size, lineBreakMode);
        this._updateElement(range);
    },

    _styleElement: function(size, lineBreakMode){
        if (size.width){
            this._element.style.width = '%dpx'.sprintf(size.width);
            this._element.style.whiteSpace = 'pre-wrap';
        }else{
            this._element.style.width = '';
            this._element.style.whiteSpace = 'pre';
        }
        if (lineBreakMode === null){
            this._element.style.whiteSpace = 'nowrap';
            this._element.style.wordBreak = '';
            this._element.style.overflowWrap = '';
        }else{
            switch (lineBreakMode){
                case JSLineBreakMode.characterWrap:
                    this._element.style.wordBreak = 'break-all';
                    this._element.style.overflowWrap = '';
                    break;
                case JSLineBreakMode.truncateTail:
                case JSLineBreakMode.wordWrap:
                    this._element.style.wordBreak = '';
                    this._element.style.overflowWrap = 'break-word';
                    break;
            }
        }
    },

    _updateElement: function(range){
        var remainingRange = JSRange(range);
        var runIterator = this.attributedString.runIterator(range.location);
        var i = 0;
        var span;
        var runDescriptors = [];
        var runDescriptor;
        var attachment;
        while (remainingRange.length > 0){
            var utf16 = this._attributedString.string.substringInRange(runIterator.range.intersection(remainingRange));
            if (runIterator.range.length === 1 && utf16 == JSAttributedString.SpecialCharacter.AttachmentUTF16){
                attachment = runIterator.attributes[JSAttributedString.Attribute.attachment];
                utf16 = '';
            }else{
                attachment = null;
            }
            if (i < this._element.childNodes.length){
                span = this._element.childNodes[i];
                span.firstChild.nodeValue = utf16;
            }else{
                span = this._element.appendChild(this._element.ownerDocument.createElement('span'));
                span.appendChild(span.ownerDocument.createTextNode(utf16));
            }
            runDescriptor = UIHTMLTextTypesetterRunDescriptor(span, runIterator.attributes, runIterator.range.intersection(remainingRange), attachment);
            runDescriptors.push(runDescriptor);
            remainingRange.advance(utf16.length);
            runIterator.increment();
            ++i;
        }
        for (var j = this._element.childNodes.length - 1; j >= i; --j){
            this._element.removeChild(this._element.childNodes[j]);
        }
        this._cachedLayout = {
            runDescriptors: runDescriptors,
            range: JSRange(range)
        };
        this._suggestionCache = null;
    },

    createLine: function(range){
        if (range.length === 0){
            return this._createEmptyLine(range);
        }
        var fragments = null;
        var i, l;
        if (this._suggestionCache !== null){
            fragments = this._suggestionCache.fragments;
        }
        if (fragments === null || fragments[0].range.location != range.location || fragments[fragments.length - 1].range.end != range.end){
            logger.warn("Calling createLine without matching suggestion, re-calculating layout");
            this.layoutRange(range, JSSize.Zero, JSLineBreakMode.wordWrap);
            var runDescriptors = this._cachedLayout.runDescriptors;
            fragments = [];
            for (i = 0, l = runDescriptors.length; i < l; ++i){
                fragments.push(UIHTMLTextTypesetterRunDescriptorFragment(runDescriptors[i], runDescriptors[i].range));
            }
        }
        var element = this._createLineElement();
        var fragment;
        var runs = [];
        var run;
        for (i = 0, l = fragments.length; i < l; ++i){
            fragment = fragments[i];
            var span = fragment.runDescriptor.span.cloneNode(false);
            if (!fragment.runDescriptor.attachment){
                span.appendChild(span.ownerDocument.createTextNode(this.attributedString.string.substringInRange(fragment.range)));
            }
            run = UIHTMLTextRun.initWithElement(span, fragment.runDescriptor.font, fragment.runDescriptor.attributes, fragment.range);
            if (fragment.runDescriptor.attachment){
                var context = UIHTMLDisplayServerContext.initWithElement(span);
                fragment.runDescriptor.attachment.drawInContext(context);
            }
            runs.push(run);
        }
        return UIHTMLTextLine.initWithElement(element, runs, 0);
    },

    _createLineElement: function(){
        var element = this.domDocument.createElement('div');
        element.style.lineHeight = '0';
        element.style.whiteSpace = 'pre';
        return element;
    },

    _createEmptyLine: function(range){
        var attributes = this._attributedString.attributesAtIndex(range.location);
        var font = JSTextTypesetter.FontFromAttributes(attributes);
        var element = this._createLineElement();
        return UIHTMLTextLine.initWithElementAndFont(element, font, font.htmlLineHeight + 4, range.location);
    },

    suggestLineBreak: function(width, range, lineBreakMode){
        if (range.length === 0){
            return JSRange(range);
        }
        if (this._cachedLayout === null || !this._cachedLayout.range.containsRange(range)){
            logger.warn("Calling suggestLineBreak on unprepared range, re-calculating layout");
            this.layoutRange(range, JSSize(width, 0), lineBreakMode);
        }

        var expectedLocation = this._cachedLayout.runDescriptors[0].range.location;
        var runIndex = 0;
        var runLineIndex = 0;
        if (this._suggestionCache !== null){
            expectedLocation = this._suggestionCache.fragments[this._suggestionCache.fragments.length - 1].range.end;
            runIndex = this._suggestionCache.runIndex;
            runLineIndex = this._suggestionCache.runLineIndex;
        }

        if (range.location != expectedLocation){
            logger.warn("Calling suggestLineBreak at unexpected location, re-calculating layout");
            this.layoutRange(range, JSSize(width, 0), lineBreakMode);
            runIndex = 0;
            runLineIndex = 0;
        }

        var runDescriptors = this._cachedLayout.runDescriptors;
        var runDescriptor;
        var fragments = [];
        var fragment;
        var remainingRange = JSRange(range);
        var lineRange;

        var stop = false;
        var shouldIncludeExtraLine = lineBreakMode == JSLineBreakMode.truncateTail;

        var boundingRect = this._element.getBoundingClientRect();
        var x = boundingRect.x;

        do {

            runDescriptor = runDescriptors[runIndex];

            if (runLineIndex === 0 && runDescriptor.startX < x){
                // This run starts off positioned to the left of the previous run's end, so
                // it must be on a new line.  Happens when the previous run's end coincides with a line wrap/break.
                // Since we've found our break, just stop here
                stop = !shouldIncludeExtraLine;
                shouldIncludeExtraLine = false;
                x = boundingRect.x;
            }else if (runLineIndex < runDescriptor.numberOfLines - 1){
                // This run has at least one more wrap/break point, so just add up to the next line
                lineRange = runDescriptor.rangeOfLine(runLineIndex, remainingRange.location);
                fragment = UIHTMLTextTypesetterRunDescriptorFragment(runDescriptor, remainingRange.intersection(lineRange));
                runLineIndex++;
                stop = !shouldIncludeExtraLine;
                shouldIncludeExtraLine = false;
                x = boundingRect.x;
                remainingRange.advance(fragment.range.length);
                fragments.push(fragment);
            }else{
                // We're on the final line of our run, so just add its remainder as a fragment
                fragment = UIHTMLTextTypesetterRunDescriptorFragment(runDescriptor, remainingRange.intersection(runDescriptor.range));
                runIndex++;
                runLineIndex = 0;
                x = runDescriptor.endX;
                remainingRange.advance(fragment.range.length);
                fragments.push(fragment);
            }

        }while (runIndex < runDescriptors.length && !stop && remainingRange.length > 0);

        this._suggestionCache = {
            fragments: fragments,
            runIndex: runIndex,
            runLineIndex: runLineIndex
        };

        if (fragments.length > 0){
            return JSRange(fragments[0].range.location, fragments[fragments.length - 1].range.end - fragments[0].range.location);
        }

        return JSRange(range.location, 0);
    }

});

var UIHTMLTextTypesetterRunDescriptor = function(span, attributes, range, attachment){
    if (this === undefined){
        return new UIHTMLTextTypesetterRunDescriptor(span, attributes, range, attachment);
    }
    this.span = span;
    this.font = JSTextTypesetter.FontFromAttributes(attributes);
    this.attributes = attributes;
    this.range = JSRange(range);
    this.attachment = attachment || null;
    this.updateStyle();
};

UIHTMLTextTypesetterRunDescriptor.prototype = {

    updateStyle: function(){
        if (this.attachment !== null){
            this.span.style.display = 'inline-block';
            this.span.style.position = 'relative';
            this.span.style.width = '%dpx'.sprintf(this.attachment.size.width);
            this.span.style.height = '%dpx'.sprintf(this.attachment.size.height);
            this.span.style.verticalAlign = 'bottom';
            this.span.style.font = '';
            this.span.style.textDecoration = '';
            this.span.style.color = '';
            this.span.style.backgroundColor = '';
        }else{
            this.span.style.display = '';
            this.span.style.width = '';
            this.span.style.height = '';
            this.span.style.position = '';
            this.span.style.verticalAlign = '';
            // Font
            var font = JSTextTypesetter.FontFromAttributes(this.attributes);
            this.span.style.font = font.cssString(font.htmlLineHeight + 4);

            // Decorations (underline, strike)
            var decorations = [];
            if (this.attributes[JSAttributedString.Attribute.underline]){
                decorations.push('underline');
            }
            if (this.attributes[JSAttributedString.Attribute.strike]){
                decorations.push('line-through');
            }
            this.span.style.textDecoration = decorations.join(' ');

            // Colors
            var textColor = this.attributes[JSAttributedString.Attribute.textColor];
            var backgroundColor = this.attributes[JSAttributedString.Attribute.backgroundColor];
            this.span.style.color = textColor ? textColor.cssString() : 'black';
            this.span.style.backgroundColor = backgroundColor ? backgroundColor.cssString() : '';
        }
    },

    rangeOfLine: function(lineIndex, startingLocation){
        var lineRect = this.clientRects[lineIndex + 1];
        var doc = this.span.ownerDocument;
        var y = lineRect.y;
        var min = startingLocation - this.range.location;
        var max = this.range.length;
        var mid;
        var rects;
        var i = 0;
        var textNode = this.span.firstChild;
        // FIXME: caretRangeFromPoint is really fast, but not supported in IE and 
        // stops working when the text node is off screen
        if (doc.caretRangeFromPoint){
            var range = doc.caretRangeFromPoint(lineRect.x, lineRect.y + lineRect.height / 2);
            if (range !== null){
                mid = min = max = range.startOffset;
            }
        }
        while (min < max){
            mid = Math.floor(min + (max - min) / 2);
            sharedDomRange.setStart(textNode, mid);
            sharedDomRange.setEnd(textNode, mid);
            rects = sharedDomRange.getClientRects();
            if (rects.length == 1 || rects[0].y == rects[1].y){
                if (rects[0].y < y){
                    min = mid + 1;
                }else{
                    max = mid;
                }
            }else{
                if (rects[0].y >= y){
                    max = mid;
                }else{
                    min = max = mid;
                }
            }
        }
        return JSRange(startingLocation, this.range.location + min - startingLocation);
    }
};

Object.defineProperties(UIHTMLTextTypesetterRunDescriptor.prototype, {

    clientRects: {
        configurable: true,
        get: function UIHTMLTextTypesetterRunDescriptor_getClientRects(){
            var rects = this.span.getClientRects();
            Object.defineProperty(this, 'clientRects', {
                value: rects
            });
            return rects;
        }
    },

    startX: {
        get: function UIHTMLTextTypesetterRunDescriptor_getStartX(){
            var firstRect = this.clientRects[0];
            return firstRect.x + firstRect.width;
        }
    },

    endX: {
        get: function UIHTMLTextTypesetterRunDescriptor_getEndX(){
            var lastRect = this.clientRects[this.clientRects.length - 1];
            return lastRect.x + lastRect.width;
        }
    },

    numberOfLines: {
        get: function UIHTMLTextTypesetterRunDescriptor_getNumberOfLines(){
            return this.clientRects.length;
        }
    }
});

var UIHTMLTextTypesetterRunDescriptorFragment = function(runDescriptor, range){
    if (this === undefined){
        return new UIHTMLTextTypesetterRunDescriptorFragment(runDescriptor, range);
    }
    this.runDescriptor = runDescriptor;
    this.range = range;
};

})();