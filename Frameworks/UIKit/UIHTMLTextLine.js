// #import "Foundation/Foundation.js"
// #import "UIKit/UIHTMLTextRun.js"
/* global JSClass, JSTextLine, UIHTMLTextLine, JSSize, UIHTMLTextRun, JSAttributedString, JSFont, JSRect */
'use strict';

(function(){

JSClass("UIHTMLTextLine", JSTextLine, {

    element: null,
    emptyTextNode: null,

    initWithElementAndFont: function(element, font, height, location){
        UIHTMLTextLine.$super.initWithHeight.call(this, height, location);
        this.element = element;
        element.style.font = font.cssString(height);
        this.emptyTextNode = element.appendChild(element.ownerDocument.createTextNode('\u200B'));
    },

    initWithElement: function(element, runs, trailingWhitespaceWidth){
        // constructing this.element before super init because super init calls
        // this.align, which neesd to use this.element
        UIHTMLTextLine.$super.initWithRuns.call(this, runs, trailingWhitespaceWidth);
        this.element = element;
        var run;
        for (var i = 0, l = runs.length; i < l; ++i){
            run = this.runs[i];
            if (run.element.parentNode !== this.element){
                this.element.appendChild(run.element);
            }
        }
    },

    verticallyAlignRuns: function(){
        // HTML does this for us
    },

    truncatedLine: function(width, token){
        if (token === undefined){
            token = '\u2026';
        }
        this.element.style.width = '%dpx'.sprintf(width);
        this.element.style.overflow = 'hidden';
        // only firefox supports an arbitrary string as the token, so for now
        // we'll just hard code ellipsis
        this.element.style.textOverflow = 'ellipsis';

        // TODO: update range?

        // This should perhaps return a copy, but for our current use cases,
        // there's no need to copy since the original line gets abandoned.
        return this;
    },

    rectForEmptyCharacter: function(){
        if (this.emptyTextNode === null){
            return UIHTMLTextLine.$super.rectForEmptyCharacter.call(this);
        }
        var range = this.emptyTextNode.ownerDocument.createRange();
        range.setStart(this.emptyTextNode, 0);
        range.setEnd(this.emptyTextNode, 0);
        var clientRect = range.getClientRects()[0];
        var elementClientRect = this.element.getBoundingClientRect();
        return JSRect(
            clientRect.left - elementClientRect.left,
            clientRect.top - elementClientRect.top,
            clientRect.width,
            clientRect.height
        );
    }

});

})();