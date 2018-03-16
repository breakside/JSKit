// #import "Foundation/Foundation.js"
/* global JSClass, JSReadOnlyProperty, JSTextTypesetter, JSTextRun, UIHTMLTextRun, JSSize, JSAttributedString, JSFont, JSRect */
'use strict';

(function(){

var sharedDomRange = null;

JSClass("UIHTMLTextRun", JSTextRun, {

    element: null,
    textNode: null,

    initWithElement: function(element, font, attributes, range){
        UIHTMLTextRun.$super.initWithGlyphs.call(this, [], font, attributes, range);
        this.element = element;
        this.textNode = element.firstChild;
        if (sharedDomRange === null){
            sharedDomRange = this.element.ownerDocument.createRange();
        }
    },

    updateOrigin: function(){
        this._origin.x = this.element.offsetLeft;
        this._origin.y = this.element.offsetTop;
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
        sharedDomRange.setStart(this.textNode, range.location);
        sharedDomRange.setEnd(this.textNode, range.end);
        var clientRect = this._pickCorrectClientRectFromRects(sharedDomRange.getClientRects());
        return clientRect.width;
    },

    rectForCharacterAtIndex: function(index){
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