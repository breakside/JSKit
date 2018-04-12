// #import "Foundation/Foundation.js"
/* global JSClass, JSReadOnlyProperty, JSTextTypesetter, JSTextRun, UIHTMLTextRun, JSSize, JSAttributedString, JSFont, JSRect, JSRange */
'use strict';

(function(){

var sharedDomRange = null;

JSClass("UIHTMLTextRun", JSTextRun, {

    element: null,
    textNode: null,

    initWithElement: function(element, font, attributes, range){
        UIHTMLTextRun.$super.initWithGlyphs.call(this, [], [], font, attributes, range);
        this.element = element;
        // Setting the correct height is important because the html line height may be less
        // than the font's pure line height.  In such a case, we don't want to overestimate
        // how tall a run/line is because that could lead to the framesetter thinking there's
        // not enough room for a line even when there really is.
        // NOTE: we do NOT want to measure the html element here and cause an expensive layout.
        // Only the UIHTMLTextFrame does the final measuring.
        this._size.height = font.htmlLineHeight;
        if (element.childNodes.length > 0 && element.firstChild.nodeType === element.TEXT_NODE){
            this.textNode = element.firstChild;
        }
        if (sharedDomRange === null){
            sharedDomRange = this.element.ownerDocument.createRange();
        }
    },

    updateOrigin: function(){
        this._origin.x = this.element.offsetLeft;
        this._origin.y = this.element.offsetTop;
    },

    drawInContextAtPoint: function(context, point){
        // UIHTMLTextRun should only exist inside a UIHTMLTextFrame structure, and
        // UIHTMLTextFrame short-circuits the drawing in an HTML context by simply adding its element,
        // which already contains all line and run elements, to the context.
        // However, if UIHTMLTextFrame is asked to draw in a non-HTML context, it follows
        // the default logic from JSTextFrame, in which case it calls on lines and runs to draw themselves.
        // Therefore, if we're called here, it means a non-HTML context is drawing the text frame.
        // Since we don't have references to any glyphs for drawing, and since we may need
        // to resolve fallback fonts for parts of this run, we can't rely on the JSTextRun drawing logic.
        // Instead, we'll use a generic typesetter to re-set our run.
        // NOTE: this assumes that the metrics of the typest run won't be noticably different
        // from the HTML layout.
        // NOTE: If fallback fonts are not available to the generic typesetter, some glyphs
        // that show in HTML may not show in this drawing
        // NOTE: calling line.drawInContextAtPoint will not cause recursive loops back here
        // because all of line's runs will be JSTextRuns, not UIHTMLTextRuns
        var typesetter = JSTextTypesetter.init();
        typesetter.attributedString = JSAttributedString.initWithString(this.textNode.value, this.attributes);
        var line = typesetter.createLine(JSRange(0, typesetter.attributedString.string.length));
        line.drawInContextAtPoint(context, point);
        // TODO: what if this is an attachment run?
    },

    characterIndexAtPoint: function(point){
        var min = 0;
        var max = this.range.length;
        var mid;
        var rect;
        var i = 0;
        while (min < max){
            mid = Math.floor(min + (max - min) / 2);
            rect = this.rectForCharacterAtIndex(mid);
            /*
            if (point.y < rect.origin.y){
                max = mid;
            }else if (point.y >= rect.origin.y + rect.size.height){
                min = mid + 1;
            }else 
            */
            if (point.x < rect.origin.x){
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
        return this.range.location + min;
    },

    widthOfRange: function(range){
        if (range.length === 0){
            return 0;
        }
        if (this.textNode === null){
            return this.element.getBoundingClientRect().width;
        }
        sharedDomRange.setStart(this.textNode, range.location);
        sharedDomRange.setEnd(this.textNode, range.end);
        var clientRect = this._pickCorrectClientRectFromRects(sharedDomRange.getClientRects());
        return clientRect.width;
    },

    rectForCharacterAtIndex: function(index){
        if (this.textNode === null){
            var boundingRect = this.element.getBoundingClientRect();
            if (index === 0){
                return JSRect(0, 0, boundingRect.width, boundingRect.height);
            }
            if (index === 1){
                return JSRect(boundingRect.width, 0, 0, boundingRect.height);
            }
            return JSRect.Zero;
        }
        // Create a DOM range for the character in the span because the DOM range can
        // report its size and coordinates
        var rect;
        if (index < this.textNode.nodeValue.length){
            sharedDomRange.setStart(this.textNode, index);
            sharedDomRange.setEnd(this.textNode, index + 1);
        }else{
            sharedDomRange.setStart(this.textNode, this.textNode.nodeValue.length);
            sharedDomRange.setEnd(this.textNode, this.textNode.nodeValue.length);
        }
        var clientRect = this._pickCorrectClientRectFromRects(sharedDomRange.getClientRects());
        // The rect reported by the DOM range is relative to the client window, so we
        // need to convert it to a JSRect relative to the text container origin
        if (clientRect === undefined){
            return JSRect.Zero;
        }
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

    _rectInElementForDOMClientRect: function(domClientRect){
        var elementClientRect = this.element.getBoundingClientRect();
        return JSRect(
            domClientRect.left - elementClientRect.left,
            domClientRect.top - elementClientRect.top,
            domClientRect.width,
            domClientRect.height
        );
    }

});

})();