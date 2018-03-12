// #import "Foundation/Foundation.js"
/* global JSClass, JSTextGlyphStorage, JSReadOnlyProperty, UIHTMLTextGlyphStorage */
'use strict';

(function(){

JSClass("UIHTMLTextGlyphStorage", JSTextGlyphStorage, {

    element: null,
    textNode: null,
    width: JSReadOnlyProperty(),

    initWithReusableElement: function(element, font, location){
        UIHTMLTextGlyphStorage.$super.initWithFont.call(this, font, location);
        this.element = element;
        if (this.element.firstChild === null){
            this.textNode = this.element.appendChild(element.ownerDocument.createTextNode(''));
        }else{
            this.textNode = this.element.firstChild;
            this.textNode.nodeValue = '';
        }
        this.element.style.font = font.cssString(font.htmlLineHeight + 4);
    },

    initWithDocument: function(domDocument, font, location){
        this.initWithReusableElement(domDocument.body.appendChild(domDocument.createElement('span')), font, location);
        this.element.style.visibility = 'hidden';
        this.element.style.position = 'absolute';
        this.element.style.verticalAlign = 'baseline';
        this.element.style.display = 'inline';
        this.element.dataset.uiText = "run";
        this.element.style.whiteSpace = 'pre';

        // this.shade = this.element.appendChild(domDocument.createElement('div'));
        // this.shade.style.position = 'absolute';
        // this.shade.style.top = '0';
        // this.shade.style.left = '0';
        // this.shade.style.bottom = '0';
        // this.shade.style.right = '0';
        // this.shade.style.backgroundColor = 'rgba(0,0,255,0.3)';
    },

    push: function(utf16, preserveRange){
        // Special handling for trailing newlines:
        // - we should only see newlines at the end of a run based on JSTypesetter logic
        // - we want to count the newline as part of our range
        // - we don't want to actually render the newline in HTML because it affects our size
        if (!preserveRange){
            this.range.length += utf16.length;
        }
        var iterator = utf16.userPerceivedCharacterIterator(utf16.length - 1);
        if (iterator.isMandatoryLineBreak){
            utf16 = utf16.substr(0, iterator.index);
            if (this.textNode.nodeValue === ''){
                this.textNode.nodeValue = '\u200B';
            }
        }
        if (utf16.length > 0){
            this.textNode.nodeValue += utf16;
        }
    },

    truncate: function(length, preserveRange){
        if (!preserveRange){
            this.range.length = length;
        }
        this.textNode.nodeValue = this.textNode.nodeValue.substr(0, length);
    },

    getWidth: function(){
        return this.element.offsetWidth;
    }

});

})();