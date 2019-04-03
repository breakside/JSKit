// #import Foundation
/* global JSClass, JSReadOnlyProperty, JSTextTypesetter, JSTextRun, UIHTMLTextRun, JSSize, JSAttributedString, JSFont, JSRect, JSRange */
'use strict';

(function(){

var sharedDomRange = null;

JSClass("UIHTMLTextRun", JSTextRun, {

    element: null,
    textNode: null,
    _maskFactor: 1,

    initWithElement: function(element, font, attributes, range){
        UIHTMLTextRun.$super.initWithGlyphs.call(this, [], [], font, attributes, range);
        this.element = element;
        // Setting the correct height is important because the html line height may be less
        // than the font's pure line height.  In such a case, we don't want to overestimate
        // how tall a run/line is because that could lead to the framesetter thinking there's
        // not enough room for a line even when there really is.
        // NOTE: we do NOT want to measure the html element here and cause an expensive layout.
        // Only the UIHTMLTextFrame does the final measuring.
        this._size.height = font.displayLineHeight;
        if (element.childNodes.length > 0 && element.firstChild.nodeType === element.TEXT_NODE){
            this.textNode = element.firstChild;
        }
        if (sharedDomRange === null){
            sharedDomRange = this.element.ownerDocument.createRange();
        }

        // If we're in a masked scenario like a password field, each utf16 character
        // has been replaced by a new "mask character".  If the mask character is actually
        // a surrogate pair, then we have a text node with two utf16 characters (the surrogate pair)
        // for every one original character.  We need to account for this doubling factor when
        // doing calculations involving character offsets and text node character indicies.
        // NOTE: A non-1 mask factor is really rare, and really only useful in novelty situations
        // such as a password field that uses an emoji as the masking character, but it's easy to
        // handle, so here it is.
        var mask = attributes[JSAttributedString.Attribute.maskCharacter];
        if (mask){
            this._maskFactor = mask.length;
        }
        this.baseline = -font.displayDescender;
    },

    updateOrigin: function(){
        this._origin.x = this.element.offsetLeft;
        this._origin.y = this.element.offsetTop;
    },

    drawInContextAtPoint: function(context, point){
        // A UIHTMLTextRun should only be created as part of a UIHTMLTextFrame.
        // When the frame is rendered to an UIHTMLDisplayServerCanvasContext, it
        // simply adds itself (including its descendant lines & runs) as a single
        // external element to the context.
        // So lines and runs never need to draw themselves.
        //
        // However, the frame is rendered to a non html-canvas context, we need
        // to draw ourself.
        // 
        // If we're drawing to an html-svg canvas, we can take a few shortcuts.
        //
        // If we're drawing to any other kind of canvas, we need to make up for
        // the fact that the html typesetter never bothers to handle fallback
        // fonts for missing glyphs, and therefore re-layout using a plain typesetter.

        if (context.isKindOfClass(UIHTMLDisplayServerContext)){
            // The assumption is that we're drawing to an html-svg canvas because otherwise
            // our ancestor text frame would have short-cut the drawing without looping to lines and runs.
            if (this.attachment){
                var attachmentContext = context.displayServer.contextForAttachment(this.attachment);
                context.addExternalElementInRect(attachmentContext.element, JSRect(point, this.attachment.size));
            }else{
                // If we're in an HTML context, the browser will take care of resovling fallback fonts
                // so just send use showText instead of creating a new line and calling showGlyphs.
                context.save();
                context.translateBy(point.x, point.y + this.font.ascender);
                context.setFont(this.font);
                context.setFillColor(this.attributes.textColor);
                context.showText(this.textNode.nodeValue);
                context.restore();
            }
        }else{
            // If we're not in an HTML context, we may need to resolve fallback fonts
            // for parts of this run, so we can't just call showText.
            // Instead, we'll use a generic typesetter to re-set our run and fill in any missing glyphs.
            // NOTE: this assumes that the metrics of the typest run won't be noticably different
            // from the HTML layout.
            // NOTE: If fallback fonts are not available to the generic typesetter, some glyphs
            // that show in HTML may not show in this drawing
            var typesetter = JSTextTypesetter.init();
            typesetter.attributedString = JSAttributedString.initWithString(this.textNode.nodeValue, this.attributes);
            var line = typesetter.createLine(JSRange(0, typesetter.attributedString.string.length));
            line.drawInContextAtPoint(context, point);
        }
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
        sharedDomRange.setStart(this.textNode, range.location * this._maskFactor);
        sharedDomRange.setEnd(this.textNode, range.end * this._maskFactor);
        var clientRect = this._pickCorrectClientRectFromRects(sharedDomRange.getClientRects());
        if (clientRect === undefined){
            return 0;
        }
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
        index *= this._maskFactor;
        if (index < this.textNode.nodeValue.length){
            var iterator = this.textNode.nodeValue.userPerceivedCharacterIterator(index);
            sharedDomRange.setStart(this.textNode, iterator.range.location);
            sharedDomRange.setEnd(this.textNode, iterator.range.end);
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