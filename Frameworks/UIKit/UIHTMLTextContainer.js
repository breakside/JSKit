// #import "Foundation/Foundation.js"
/* global JSClass, JSTextContainer, UIHTMLTextContainer, JSAttributedString, JSFont, JSLineBreakMode */
'use strict';

JSClass("UIHTMLTextContainer", JSTextContainer, {

    element: null,
    _spans: null,
    _resuableSpans: null,

    initWithDocument: function(document, size){
        UIHTMLTextContainer.$super.initWithSize.call(this, size);
        this.element = document.createElement('div');
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
            span.style.width = '%dpx'.sprintf(size.width);
            span.style.height = '%dpx'.sprintf(size.height);
        }else{
            var span = this._dequeueReusableSpan();
            span.dataset.index = startIndex;
            this._styleSpan(span, attributes);
            span.style.display = 'inline';
            span.firstChild.nodeValue = runCharacters;
            if (!span.parentNode){
                this.element.appendChild(span);
            }
        }
        // TODO: check size and truncation
        return runCharacters.length;
    },

    characterIndexAtPoint: function(point){
    },

    rectForCharacterAtIndex: function(index){
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