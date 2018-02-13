// #import "Foundation/Foundation.js"
/* global JSClass, JSTextGlyphStorage, JSReadOnlyProperty, UIHTMLTextGlyphStorage */
'use strict';

(function(){

JSClass("UIHTMLTextGlyphStorage", JSTextGlyphStorage, {

    element: null,
    textNode: null,
    width: JSReadOnlyProperty(),
    _lastPushLength: 0,

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
        this.initWithReusableElement(domDocument.createElement('span'), font, location);
        domDocument.body.appendChild(this.element);
        this.element.style.visibility = 'hidden';
        this.element.style.position = 'absolute';
        this.element.style.verticalAlign = 'baseline';
        this.element.style.display = 'inline';
        this.element.dataset.uiText = "run";

        // this.shade = this.element.appendChild(domDocument.createElement('div'));
        // this.shade.style.position = 'absolute';
        // this.shade.style.top = '0';
        // this.shade.style.left = '0';
        // this.shade.style.bottom = '0';
        // this.shade.style.right = '0';
        // this.shade.style.backgroundColor = 'rgba(0,0,255,0.3)';
    },

    push: function(utf16){
        this.textNode.nodeValue += utf16;
        this.range.length += utf16.length;
        this._lastPushLength = utf16.length;
    },

    pop: function(){
        // only supports one pop, which for now is all we need
        this.textNode.nodeValue = this.textNode.nodeValue.substr(0, this.textNode.nodeValue.length - this._lastPushLength);
        this.range.length -= this._lastPushLength;
        this._lastPushLength = 0;
    },

    getWidth: function(){
        return this.element.offsetWidth;
    }

});

})();