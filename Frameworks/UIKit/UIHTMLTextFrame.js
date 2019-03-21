// #import "Foundation/Foundation.js"
// #import "UIKit/UIHTMLTextLine.js"
// #import "UIKit/UIHTMLDisplayServerContext.js"
// #import "UIKit/UITextAttachmentView.js"
/* global JSClass, JSTextFrame, UIHTMLTextFrame, UIHTMLTextLine, JSAttributedString, JSRange, JSFont, JSPoint, JSRect, JSSize, UIHTMLDisplayServerContext, UITextAttachmentView */
'use strict';

(function(){

JSClass("UIHTMLTextFrame", JSTextFrame, {

    element: null,
    attachments: null,

    initWithElement: function(element, lines, size, attributes){
        this.element = element;
        this.attachments = [];
        var line;
        var i, l;
        var j, k;

        // If our element is not in the document, we need to add it so calls
        // to getBoundingClientRect() will work.
        // The HTML framesetter always adds a newly created frame to the document,
        // but it's possible to be removed from the document if we're reusing a
        // frame that's in a view that itself has been removed from the document.
        // After we're done making calls, we'll add it back to the original parent
        // in its original location.
        var originalParent = null;
        var originalSibling = null;
        if (!this.element.isConnected){
            originalParent = this.element.parentNode;
            originalSibling = this.element.nextSibling;
            this.element.ownerDocument.body.appendChild(this.element);
            this.element.style.visibility = 'hidden';
        }

        // add all the lines to our element
        for (i = 0, l = lines.length; i < l; ++i){
            line = lines[i];
            if (line.element.parentNode !== this.element){
                line.element.style.position = 'absolute';
                this.element.appendChild(line.element);
            }
        }

        // set the size of all the lines and runs
        // NOTE: this could be a job for the typesetter, but doing so incrementally
        // as runs/lines are created would force a extra layouts that aren't necessary.
        // So we try to force only one layout here and then grab all the metrics
        var lineClientRect;
        var runClientRect;
        var run;
        var iterator;
        var y = 0;
        for (i = 0, l = lines.length; i < l; ++i){
            line = lines[i];
            lineClientRect = line.element.getBoundingClientRect();
            line._origin = JSPoint(0, y);
            // The line height should already be an integer, because it is derived from its
            // runs, which use integer font.displayLineHeight values for their heights.
            // However, the width may be a non-integer.  We round up because if we don't,
            // the browser may round down when we ask for a line to be X.y pixels wide, and
            // that wouldn't leave enough space for the final character.
            line._size = JSSize(Math.ceil(lineClientRect.width), line.size.height);
            y += line._size.height;
            for (j = 0, k = line.runs.length; j < k; ++j){
                run = line.runs[j];
                runClientRect = run.element.getBoundingClientRect();
                run._origin = JSPoint(runClientRect.left - lineClientRect.left, runClientRect.top - lineClientRect.top);
                run._size = JSSize(runClientRect.width, runClientRect.height);
            }
            // measure any trailing whitespace
            for (j = line.runs.length - 1; j >= 0; --j){
                run = line.runs[j];
                if (!run.textNode || run.textNode.nodeValue.length === 0){
                    break;
                }
                iterator = run.textNode.nodeValue.unicodeIterator(run.textNode.nodeValue.length);
                iterator.decrement();
                while (iterator.index > 0 && iterator.isWhiteSpace){
                    iterator.decrement();
                }
                if (!iterator.isWhiteSpace){
                    iterator.increment();
                    line._trailingWhitespaceWidth += run.widthOfRange(JSRange(iterator.index, run.textNode.nodeValue.length - iterator.index));
                    break;
                }
            }
        }

        var attachmentInfo;
        for (i = 0, l = lines.length; i < l; ++i){
            line = lines[i];
            for (j = 0, k = line.attachments.length; j < k; ++j){
                attachmentInfo = line.attachments[j];
                if (attachmentInfo.attachment.isKindOfClass(UITextAttachmentView)){
                    // attachmentInfo.attachment.view.frame = JSRect(
                    //     JSPoint(line.origin.x + attachmentInfo.run.origin.x, line.origin.y + attachmentInfo.run.origin.y),
                    //     attachmentInfo.attachment.view.frame.size
                    // );
                }
                this.attachments.push(attachmentInfo);
            }
        }

        if (originalParent !== null){
            originalParent.insertBefore(this.element, originalSibling);
        }

        // Superclass init will adjust origins according to text alignment, but
        // we must have properly set the line size and trailingWhitespaceWidth first
        UIHTMLTextFrame.$super.initWithLines.call(this, lines, size, attributes);
        this._updateSizesAndPositions();
    },

    adjustSize: function(newSize){
        UIHTMLTextFrame.$super.adjustSize.call(this, newSize);
        this._updateSizesAndPositions();
    },

    _updateSizesAndPositions: function(){
        var i, l;
        var line;

        // set our size
        this.element.style.width = '%dpx'.sprintf(this.size.width);
        this.element.style.height = '%dpx'.sprintf(this.size.height);

        // position the lines
        for (i = 0, l = this.lines.length; i < l; ++i){
            line = this.lines[i];
            line.element.style.height = '%dpx'.sprintf(line.size.height);
            line.element.style.left = '%dpx'.sprintf(line.origin.x);
            line.element.style.top = '%dpx'.sprintf(line.origin.y);
        }
    },

    drawInContextAtPoint: function(context, point){
        if (context.isKindOfClass(UIHTMLDisplayServerCanvasContext)){
            if (this.element.style.visibility == 'hidden'){
                this.element.style.visibility = '';
            }
            context.addExternalElementInRect(this.element, JSRect(point, this.size));
            var attachmentInfo;
            for (var i = 0, l = this.attachments.length; i < l; ++i){
                attachmentInfo = this.attachments[i];
                attachmentInfo.attachment.drawInContextAtPoint(attachmentInfo.context, JSPoint.Zero);
            }
        }else{
            UIHTMLTextFrame.$super.drawInContextAtPoint.call(this, context, point);
        }
    },

});

})();