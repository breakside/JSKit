// #import "Foundation/Foundation.js"
// #import "UIKit/UIHTMLTextLine.js"
// #import "UIKit/UIHTMLTextRun.js"
/* global JSClass, JSReadOnlyProperty, JSTextTypesetter, JSSize, UIHTMLTextTypesetter, UIHTMLTextLine, UIHTMLTextRun, JSRange, JSAttributedString, JSLineBreakMode, jslog_create */
'use strict';

(function(){

var logger = jslog_create("html-typesetter");

var sharedDomRange = null;
var layoutElementStack = [];
var layoutElementIndex = 0;

JSClass("UIHTMLTextTypesetter", JSTextTypesetter, {

    domDocument: JSReadOnlyProperty('_domDocument'),
    _cachedLayout: null,
    _suggestionCache: null,
    _htmlDisplayServer: null,

    initWithDocument: function(domDocument, htmlDisplayServer){
        UIHTMLTextTypesetter.$super.init.call(this);
        this._domDocument = domDocument;
        this._htmlDisplayServer = htmlDisplayServer;
        if (sharedDomRange === null){
            sharedDomRange = this._domDocument.createRange();
        }
    },

    layoutRange: function(range, size, lineBreakMode){
        if (size.width <= 0 || size.height <= 0){
            size = JSSize(size.width <= 0 ? Number.MAX_VALUE : size.width, size.height <= 0 ? Number.MAX_VALUE : size.height);
        }
        // Because Javascript only has a single thread, two typesetter instances
        // generally won't overlap, and we can save some energy by reusing the same
        // dom element to do the layout for every typesetter.
        // However, there is a case where layout happens recursively:
        // when an attachment view in one typesetter needs to typeset a string of its own.
        // (attachment views need to layout immediately so their size is known).
        // Therefore, we need a stack of layout elements rather than a single shared element.
        // FIXME: Allow removal of element after it is no longer needed
        var layoutElement;
        if (layoutElementIndex < layoutElementStack.length){
            layoutElement = layoutElementStack[layoutElementIndex];
        }else{
            layoutElement = this._domDocument.createElement('div');
            layoutElement.style.position = 'absolute';
            layoutElement.style.right = '0';
            layoutElement.style.right = '0';
            layoutElement.style.backgroundColor = 'rgb(255,240,240)';
            layoutElement.style.lineHeight = '0';
            this._domDocument.body.appendChild(layoutElement);
            layoutElementStack.push(layoutElement);
        }
        ++layoutElementIndex;
        this._styleElement(layoutElement, size, lineBreakMode);
        this._updateElement(layoutElement, range);
        --layoutElementIndex;
    },

    _styleElement: function(element, size, lineBreakMode){
        if (size.width < Number.MAX_VALUE){
            element.style.width = '%dpx'.sprintf(size.width);
            element.style.whiteSpace = 'pre-wrap';
        }else{
            element.style.width = '';
            element.style.whiteSpace = 'pre';
        }
        if (lineBreakMode === null){
            element.style.whiteSpace = 'nowrap';
            element.style.wordBreak = '';
            element.style.overflowWrap = '';
        }else{
            switch (lineBreakMode){
                case JSLineBreakMode.characterWrap:
                    element.style.wordBreak = 'break-all';
                    element.style.overflowWrap = '';
                    break;
                case JSLineBreakMode.truncateTail:
                case JSLineBreakMode.wordWrap:
                    element.style.wordBreak = '';
                    element.style.overflowWrap = 'break-word';
                    break;
            }
        }
    },

    _updateElement: function(element, range){
        var remainingRange = JSRange(range);
        var runIterator = this.attributedString.runIterator(range.location);
        var i = 0;
        var span;
        var runDescriptors = [];
        var runDescriptor;
        var attachment;
        var attachments = [];
        var previousAttachmentsByID = {};
        if (this._cachedLayout !== null){
            for (i = 0; i < this._cachedLayout.attachments.length; ++i){
                previousAttachmentsByID[this._cachedLayout.attachments[i].objectID] = this._cachedLayout.attachments[i];
            }
        }
        i = 0;
        while (remainingRange.length > 0){
            var utf16 = this._attributedString.string.substringInRange(runIterator.range.intersection(remainingRange));
            if (runIterator.range.length === 1 && utf16 == JSAttributedString.SpecialCharacter.attachmentUTF16){
                attachment = runIterator.attributes[JSAttributedString.Attribute.attachment];
                utf16 = '';
            }else{
                attachment = null;
            }
            if (i < element.childNodes.length){
                span = element.childNodes[i];
                span.firstChild.nodeValue = utf16;
            }else{
                span = element.appendChild(element.ownerDocument.createElement('span'));
                span.appendChild(span.ownerDocument.createTextNode(utf16));
            }
            if (attachment !== null){
                // Triggering display context creation here so an attachment view can become part
                // of the display server and do a proper layout before its size is needed when we
                // create the run descriptor below.
                this._htmlDisplayServer.attachmentInserted(attachment, span);
                if (attachment.objectID in previousAttachmentsByID){
                    delete previousAttachmentsByID[attachment.objectID];
                }
                attachments.push(attachment);
            }
            runDescriptor = UIHTMLTextTypesetterRunDescriptor(span, runIterator.attributes, runIterator.range.intersection(remainingRange), attachment);
            runDescriptors.push(runDescriptor);
            remainingRange.advance(runIterator.range.length);
            runIterator.increment();
            ++i;
        }
        for (var j = element.childNodes.length - 1; j >= i; --j){
            element.removeChild(element.childNodes[j]);
        }
        for (var id in previousAttachmentsByID){
            this._htmlDisplayServer.attachmentRemoved(previousAttachmentsByID[id]);
        }
        this._cachedLayout = {
            runDescriptors: runDescriptors,
            range: JSRange(range),
            attachments: attachments
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
        var attachments = [];
        var run;
        for (i = 0, l = fragments.length; i < l; ++i){
            fragment = fragments[i];
            var span = fragment.runDescriptor.span.cloneNode(false);
            if (!fragment.runDescriptor.attachment){
                span.appendChild(span.ownerDocument.createTextNode(this.attributedString.string.substringInRange(fragment.range)));
            }
            run = UIHTMLTextRun.initWithElement(span, fragment.runDescriptor.font, fragment.runDescriptor.attributes, fragment.range);
            runs.push(run);
            if (fragment.runDescriptor.attachment){
                // FIXME:
                // 1. Want context for attachment to be resuable to minimize dom manipulations, but
                //    also need a distinct context per text frame that uses this string+attachment
                attachments.push({
                    context: this._htmlDisplayServer.contextForAttachment(fragment.runDescriptor.attachment, span),
                    attachment: fragment.runDescriptor.attachment,
                    run: run
                });
            }
        }

        // NOTE: Deferring calculation of trailingWhitespaceWidth until all the lines are done and added to
        // a frame, otherwise unecessary and expensive browser layout operations will be triggered.

        return UIHTMLTextLine.initWithElement(element, runs, 0, attachments);
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
        return UIHTMLTextLine.initWithElementAndFont(element, font, font.displayLineHeight, range.location);
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

        var x = Number.MIN_VALUE;

        do {

            runDescriptor = runDescriptors[runIndex];

            if (runLineIndex === 0 && runDescriptor.startX < x){
                // This run starts off positioned to the left of the previous run's end, so
                // it must be on a new line.  Happens when the previous run's end coincides with a line wrap/break.
                // Since we've found our break, just stop here
                stop = !shouldIncludeExtraLine;
                shouldIncludeExtraLine = false;
                x = Number.MIN_VALUE;
            }else if (runLineIndex < runDescriptor.numberOfLines - 1){
                // This run has at least one more wrap/break point, so just add up to the next line
                lineRange = runDescriptor.rangeOfLine(runLineIndex, remainingRange.location);
                fragment = UIHTMLTextTypesetterRunDescriptorFragment(runDescriptor, remainingRange.intersection(lineRange));
                runLineIndex++;
                stop = !shouldIncludeExtraLine;
                shouldIncludeExtraLine = false;
                x = Number.MIN_VALUE;
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
            this.span.style.verticalAlign = '%dpx'.sprintf(this.attachment.baselineAdjustment);
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
            this.span.style.borderBottomWidth = '100%';
            // Font
            var font = JSTextTypesetter.FontFromAttributes(this.attributes);
            this.span.style.font = font.cssString();

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
            sharedDomRange.setEnd(textNode, mid + 1);
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
            return firstRect.x;
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