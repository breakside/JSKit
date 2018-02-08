// #import "Foundation/Foundation.js"
// #import "UIKit/UIHTMLTextFrame.js"
/* global JSClass, JSReadOnlyProperty, JSTextTypesetter, JSTextRun, UIHTMLTextRun, JSAttributedString, JSFont, JSRect */
'use strict';

(function(){

var sharedDomRange = null;

JSClass("UIHTMLTextRun", JSTextRun, {

    element: null,
    textNode: null,

    initWithDocument: function(domDocument, attributes){
        UIHTMLTextRun.$super.initWithAttributes(attributes);
        this.element = domDocument.createElement('span');
        this.element.style.visibility = 'hidden';
        domDocument.body.appendChild(this.element);
        this.element.style.display = 'inline';
        this.element.style.verticalAlign = 'baseline';
        this.element.style.position = 'absolute';
        this.element.dataset.uiText = "run";
        this.textNode = this.element.appendChild(domDocument.createTextNode(''));
        this.styleUsingAttributes(attributes);
        if (sharedDomRange === null){
            sharedDomRange = domDocument.createRange();
        }

        // this.shade = this.element.appendChild(domDocument.createElement('div'));
        // this.shade.style.position = 'absolute';
        // this.shade.style.top = '0';
        // this.shade.style.left = '0';
        // this.shade.style.bottom = '0';
        // this.shade.style.right = '0';
        // this.shade.style.backgroundColor = 'rgba(0,0,255,0.3)';
    },

    addUserPerceivedCharacter: function(utf16){
        this.textNode.nodeValue += utf16;
        this.updateSize();
    },

    removeTrailingCharacter: function(utf16Width){
        this.textNode.nodeValue = this.textNode.nodeValue.substr(0, this.textNode.nodeValue.length - utf16Width);
        this.updateSize();
    },

    updateSize: function(){
        this.size.width = this.element.offsetWidth;
    },

    styleUsingAttributes: function(attributes){
        // Font
        var font = JSTextTypesetter.FontFromAttributes(attributes);
        this.element.style.font = font.cssString(font.htmlLineHeight + 4);
        this._size.height = font.htmlLineHeight;
        this.origin.y = 2;

        // Decorations (underline, strike)
        var decorations = [];
        if (attributes[JSAttributedString.Attribute.Underline]){
            decorations.push('underline');
        }
        if (attributes[JSAttributedString.Attribute.Strike]){
            decorations.push('line-through');
        }
        this.element.style.textDecoration = decorations.join(' ');

        // Colors
        var textColor = attributes[JSAttributedString.Attribute.TextColor];
        var backgroundColor = attributes[JSAttributedString.Attribute.BackgroundColor];
        this.element.style.color = textColor.cssString();
        this.element.style.backgroundColor = backgroundColor ? backgroundColor.cssString() : '';
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