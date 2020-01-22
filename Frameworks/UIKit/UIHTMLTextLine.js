// #import Foundation
// #import "UIHTMLTextRun.js"
// jshint browser: true
'use strict';

(function(){

JSClass("UIHTMLTextLine", JSTextLine, {

    element: null,
    emptyTextNode: null,
    attachments: null,
    overflowed: false,

    initWithElementAndFont: function(element, font, height, location){
        UIHTMLTextLine.$super.initWithHeight.call(this, height, -font.displayDescender, location);
        this.element = element;
        element.style.font = font.cssString(height);
        this.emptyTextNode = element.appendChild(element.ownerDocument.createTextNode('\u200B'));
        this.attachments = [];
    },

    initWithElement: function(element, runs, trailingWhitespaceWidth, attachments){
        // constructing this.element before super init because super init calls
        // this.align, which neesd to use this.element
        UIHTMLTextLine.$super.initWithRuns.call(this, runs, trailingWhitespaceWidth);
        this.element = element;
        this.attachments = attachments || [];
        var run;
        for (var i = 0, l = runs.length; i < l; ++i){
            run = this.runs[i];
            if (run.element.parentNode !== this.element){
                this.element.appendChild(run.element);
            }
        }
    },

    // verticallyAlignRuns: function(){
    //     // HTML does this for us
    // },

    truncatedLine: function(width, token){
        if (!this.overflowed || width === Number.MAX_VALUE || width === 0){
            return this;
        }

        if (token === undefined){
            token = '\u2026';
        }

        this.element.style.maxWidth = '%dpx'.sprintf(width);
        this.element.style.overflow = 'hidden';
        // only firefox supports an arbitrary string as the token, so for now
        // we'll just hard code ellipsis
        this.element.style.textOverflow = 'ellipsis';

        // Adopt relevant styles from the final run, otherwise the ellipis will
        // use the style of the line div.  Currently this only adopts text color,
        // and font, taking care to keep our line height 0;
        if (this._runs.length > 0){
            var lastRun = this._runs[this._runs.length - 1];
            this.element.style.color = lastRun.element.style.color;
            this.element.style.font = lastRun.element.style.font;
            this.element.style.lineHeight = '0';
        }

        // Add an ellipsis...if it fits, great!  If not, we'll get the html generated ellipis
        this.element.appendChild(this.element.ownerDocument.createTextNode(token));

        // TODO: add JSTextRun with ellipsis (in case this line is drawn to a non-html context, and so .runs is consistent)
        // but this would also possibly require backing up 1+ characters to make enough room for the ellipis

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