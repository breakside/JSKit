// #import "Foundation/Foundation.js"
// #import "UIKit/UIHTMLTextRun.js"
/* global JSClass, JSTextLine, UIHTMLTextLine, UIHTMLTextRun, JSAttributedString, JSFont, JSLineBreakMode, JSRect */
'use strict';

(function(){

JSClass("UIHTMLTextLine", JSTextLine, {

    element: null,
    _strutRun: null,

    initWithReusableElement: function(element, alignment){
        UIHTMLTextLine.$super.initWithAlignment.call(this, alignment);
        this.element = element;
        this.element.style.textAlign = alignment;
    },

    initWithDocument: function(domDocument, alignment){
        this.initWithReusableElement(domDocument.createElement('div'), alignment);
        this.element.dataset.uiText = "line";
        this.element.style.whiteSpace = 'pre';
        this.element.style.position = "relative";
        this.element.style.lineHeight = '0';

        // this.shade = this.element.appendChild(domDocument.createElement('div'));
        // this.shade.style.position = 'absolute';
        // this.shade.style.top = '0';
        // this.shade.style.left = '0';
        // this.shade.style.bottom = '0';
        // this.shade.style.right = '0';
        // this.shade.style.backgroundColor = 'rgba(0,255,0,0.3)';
    },

    addStrut: function(run){
        UIHTMLTextLine.$super.addStrut.call(this, run);
        this._adoptRun(run);
        run.element.dataset.uiText = "strut";
    },

    addRun: function(run){
        UIHTMLTextLine.$super.addRun.call(this, run);
        this._adoptRun(run);
    },

    _adoptRun: function(run){
        if (run.element.parentNode !== this.element){
            run.element.style.visibility = '';
            run.element.style.position = 'relative';
            this.element.appendChild(run.element);
        }
    },

    setAttributes: function(attributes){
        // TODO: style strut with attributes
    },

    /*
    _spans: null,
    _lines: null,

    characterIndexAtPoint: function(point){
        if (this._spans.length === 0){
            return 0;
        }
        var span = this._spanContainingPoint(point);
        if (span !== null){
            var min = 0;
            var max = parseInt(span.dataset.length);
            var mid;
            var rect;
            var i = 0;
            while (min < max){
                mid = Math.floor(min + (max - min) / 2);
                rect = this._rectForCharacterAtInSpanAtIndex(span, mid);
                if (point.y < rect.origin.y){
                    max = mid;
                }else if (point.y >= rect.origin.y + rect.size.height){
                    min = mid + 1;
                }else if (point.x < rect.origin.x){
                    max = mid;
                }else if (point.x >= rect.origin.x + rect.size.width){
                    min = mid + 1;
                }else{
                    if (point.x >= rect.origin.x + rect.size.width / 2){
                        min = max = mid + 1;
                    }else{
                        min = max = mid;
                    }
                }
            }
            return parseInt(span.dataset.index) + min;
        }
        return 0;
    },

    rectForCharacterAtIndex: function(index){
        index = this._validCharacterIndex(index);
        var span = this._spanContainingCharacterAtIndex(index);
        if (span){
            return this._rectForCharacterAtInSpanAtIndex(span, index - parseInt(span.dataset.index));
        }
        var structClientRect = this._strutSpan.getClientRects()[0];
        var rect = this._rectInElementForDOMClientRect(structClientRect);
        rect.size.width = 0;
        return rect;
    },

    _rectForCharacterAtInSpanAtIndex: function(span, index){
        // Create a DOM range for the character in the span because the DOM range can
        // report its size and coordinates
        var rect;
        this._domRange.setStart(span.firstChild, index);
        this._domRange.setEnd(span.firstChild, index + 1);
        var clientRect = this._pickCorrectClientRectFromRects(this._domRange.getClientRects());
        // The rect reported by the DOM range is relative to the client window, so we
        // need to convert it to a JSRect relative to the text container origin
        rect = this._rectInElementForDOMClientRect(clientRect);
        return rect;

    },

    _pickCorrectClientRectFromRects: function(rects){
        // A single range may have multiple client rects.  A range ending just before a newline
        // will have a second rect that is zero width.  A range starting just after a newline
        // will have a first rect that is zero width.  A range over a newline will have three
        // rects, all with zero width, and we want the middle one.
        if (rects.length > 1 && rects[0].width === 0){
            return rects[1];
        }
        return rects[0];
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

    _spanContainingCharacterAtIndex: function(index){
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
        var i, l;
        while (min < max){
            mid = Math.floor(min + (max - min) / 2);
            span = this._spans[mid];
            i = parseInt(span.dataset.index);
            l = parseInt(span.dataset.length);
            if (index < i){
                max = mid;
            }else if (index >= (i + l)){
                min = mid + 1;
            }else{
                min = max = mid;
            }
        }
        if (min == this._spans.length){
            return null;
        }
        return this._spans[min];
    },

    _spanContainingPoint: function(point){
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
        var rects;
        var rect;
        while (min < max){
            mid = Math.floor(min + (max - min) / 2);
            span = this._spans[mid];
            rects = span.getClientRects();
            rect = this._rectInElementForDOMClientRect(rects[0]);
            if (point.y < rect.origin.y){
                // The point is higher than our first line, so search previous spans
                max = mid;
            }else{
                rect = this._rectInElementForDOMClientRect(rects[rects.length - 1]);
                if (point.y > rect.origin.y + rect.size.height){
                    // The pont is below our last line, so seach following span
                    min = mid + 1;
                }else{
                    // The point is within our lines, but may not be within our span because
                    // our first line may not start at the start on the left edge and our last
                    // line may not end on the right edge
                    rect = this._rectInElementForDOMClientRect(rects[0]);
                    if (point.x < rect.origin.x){
                        max = mid;
                    }else{
                        rect = this._rectInElementForDOMClientRect(rects[rects.length - 1]);
                        if (point.x > rect.origin.x + rect.size.width){
                            min = mid + 1;
                        }else{
                            min = max = mid;
                        }
                    }
                }
            }
        }
        if (min == this._spans.length){
            min -= 1;
        }
        return this._spans[min];
    },

    _maxCharacterIndex: function(){
        if (this._spans.length === 0){
            return 0;
        }
        var lastSpan = this._spans[this._spans.length - 1];
        return parseInt(lastSpan.dataset.index) + parseInt(lastSpan.dataset.length);
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

    beginLayout: function(attributes){
        UIHTMLTextLine.$super.beginLayout.call(this);
        for (var i = 0, l = this._spans.length; i < l; ++i){
            this._enqueueResuableSpan(this._spans[i]);
        }
        this._spans = [];

        this.element.style.textAlign = this.textAlignment;
        this.element.style.whiteSpace = 'pre';

        this.element.style.lineHeight = '0';
        this.element.style.width = '%dpx'.sprintf(this.size.width);

        this._styleSpan(this._strutSpan, attributes);
    },

    finishLayout: function(){
        var span;
        for (var i = 0, l = this._resuableSpans.length; i < l; ++i){
            span = this._resuableSpans[i];
            span.parentNode.removeChild(span);
        }
        this._resuableSpans = [];
        if (this._spans.length === 0){
            this._strutSpan.dataset.index = 0;
            this._strutSpan.dataset.length = 0;
        }else{
            span = this._spans[this._spans.length - 1];
            this._strutSpan.dataset.index = span.dataset.index;
            this._strutSpan.dataset.length = 0;
            this._strutSpan.style.font = span.style.font;
        }
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
                this.element.insertBefore(span, this._strutSpan);
            }
            this._spans.push(span);
        }
        // TODO: check size and truncation
        return runCharacters.length;
    },
    _resuableSpans: null,

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
    */

});

})();