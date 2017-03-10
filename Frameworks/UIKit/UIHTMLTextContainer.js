// #import "Foundation/Foundation.js"
/* global JSClass, JSTextContainer, UIHTMLTextContainer, JSAttributedString, JSFont, JSLineBreakMode, JSRect */
'use strict';

JSClass("UIHTMLTextContainer", JSTextContainer, {

    element: null,
    _range: null,
    _spans: null,
    _resuableSpans: null,

    initWithDocument: function(document, size){
        UIHTMLTextContainer.$super.initWithSize.call(this, size);
        this.element = document.createElement('div');
        this._range = document.createRange();
        this._spans = [];
        this._resuableSpans = [];
    },

    beginLayout: function(){
        UIHTMLTextContainer.$super.beginLayout.call(this);
        for (var i = 0, l = this._spans.length; i < l; ++i){
            this._enqueueResuableSpan(this._spans[i]);
        }
        this._spans = [];

        this.element.style.textAlign = this.textAlignment;
        switch (this.lineBreakMode){
            case JSLineBreakMode.TruncateTail:
            case JSLineBreakMode.WordWrap:
                this.element.style.whiteSpace = 'pre-wrap';
                break;
            default:
            case JSLineBreakMode.Clip:
                this.element.style.whiteSpace = 'pre';
                break;
        }

        this.element.style.lineHeight = '0';
        this.element.style.width = '%dpx'.sprintf(this.size.width);
        this.element.style.height = '%dpx'.sprintf(this.size.height);
    },

    finishLayout: function(){
        var span;
        for (var i = 0, l = this._resuableSpans.length; i < l; ++i){
            span = this._resuableSpans[i];
            span.parentNode.removeChild(span);
        }
        this._resuableSpans = [];
    },

    layout: function(runCharacters, startIndex, attributes){
        if (runCharacters.length == 1 && runCharacters[0] == JSAttributedString.SpecialCharacter.Attachment){
            var size; // TODO: get size from layout manager
            span.style.display = 'inline-block';
            span.style.verticalAlign = 'bottom';
            span.style.width = '%dpx'.sprintf(size.width);
            span.style.height = '%dpx'.sprintf(size.height);
        }else{
            var span = this._dequeueReusableSpan();
            span.dataset.index = startIndex;
            span.dataset.length = runCharacters.length;
            this._styleSpan(span, attributes);
            span.style.display = 'inline';
            span.style.verticalAlign = 'baseline';
            span.firstChild.nodeValue = runCharacters;
            if (!span.parentNode){
                this.element.appendChild(span);
            }
            this._spans.push(span);
        }
        // TODO: check size and truncation
        return runCharacters.length;
    },

    characterIndexAtPoint: function(point){
        if (this._spans.length === 0){
            return 0;
        }
    },

    rectForCharacterAtIndex: function(index){
        index = this._validCharacterIndex(index);
        var span = this._spanForCharacterAtIndex(index);
        if (span){
            // Create a DOM range for the character in the span because the DOM range can
            // report its size and coordinates
            var indexInSpan = index - span.dataset.index;
            this._range.setStart(span.firstChild, indexInSpan);
            this._range.setEnd(span.firstChild, indexInSpan + 1);
            var rangeClientRect = this._range.getClientRects()[0];
            // The rect reported by the DOM range is relative to the client window, so we
            // need to convert it to a JSRect relative to the text container origin
            var rect = this._rectInElementForDOMClientRect(rangeClientRect);
            return rect;
        }
        return JSRect.Zero;
    },

    _validCharacterIndex: function(index){
        // Sanitize the index argument so it's a valid index in one of our spans
        var maxIndex = this._maxCharacterIndex();
        if (index < 0){
            index = 0;
        }else if (index > maxIndex){
            index = maxIndex;
        }
        return index;
    },

    _spanForCharacterAtIndex: function(index){
        // Bail if we have no spans
        if (this._spans.length === 0){
            return null;
        }
        // Locate the span that contains the index
        // Using a binary search for efficiency, in case there are a large number of spans
        var min = 0;
        var max = this._spans.length;
        var mid;
        var span;
        while (min < max){
            mid = Math.floor(min + (max - min) / 2);
            span = this._spans[mid];
            if (index < span.dataset.index){
                max = mid;
            }else if (index >= (span.dataset.index + span.dataset.length)){
                min = mid + 1;
            }else{
                min = max = mid;
            }
        }
        return span;
    },

    _maxCharacterIndex: function(){
        if (this._spans.length === 0){
            return 0;
        }
        var lastSpan = this._spans[this._spans.length - 1];
        return lastSpan.index + lastSpan.length;
    },

    _rectInElementForDOMClientRect: function(domClientRect){
        var elementClientRect = this.element.getBoundingClientRect();
        return JSRect(
            domClientRect.left - elementClientRect.left,
            domClientRect.top - elementClientRect.top,
            domClientRect.width,
            domClientRect.height
        );
    },

    drawInContextAtPoint: function(context, point){
        this.textLayoutManager.layoutIfNeeded();
        this.element.style.left = '%dpx'.sprintf(point.x);
        this.element.style.top = '%dpx'.sprintf(point.y);
        if (context.element !== this.element.parentNode){
            context.element.appendChild(this.element);
        }
    },

    _styleSpan: function(span, attributes){
        // Font
        var font = attributes[JSAttributedString.Attribute.Font];
        if (attributes[JSAttributedString.Attribute.Bold]){
            font = font.fontWithWeight(JSFont.Weight.Bold);
        }
        if (attributes[JSAttributedString.Attribute.Italic]){
            font = font.fontWithStyle(JSFont.Style.Italic);
        }
        span.style.font = font.cssString();

        // Decorations (underline, strike)
        var decorations = [];
        if (attributes[JSAttributedString.Attribute.Underline]){
            decorations.push('underline');
        }
        if (attributes[JSAttributedString.Attribute.Strike]){
            decorations.push('line-through');
        }
        span.style.textDecoration = decorations.join(' ');

        // Colors
        var textColor = attributes[JSAttributedString.Attribute.TextColor];
        var backgroundColor = attributes[JSAttributedString.Attribute.BackgroundColor];
        span.style.color = textColor.cssString();
        span.style.backgroundColor = backgroundColor ? backgroundColor.cssString() : '';
    },

    _enqueueResuableSpan: function(span){
        this._resuableSpans.push(span);
    },

    _dequeueReusableSpan: function(){
        if (this._resuableSpans.length > 0){
            return this._resuableSpans.shift();
        }
        var doc = this.element.ownerDocument;
        var span = doc.createElement('span');
        span.appendChild(doc.createTextNode(''));
        return span;
    }

});