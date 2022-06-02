// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #import Foundation
// #import "UIHTMLTextLine.js"
// #import "UIHTMLDisplayServerContext.js"
// #import "UITextAttachmentView.js"
// jshint browser: true
/* global UIHTMLDisplayServerCanvasContext */
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
        //
        // UPDATE 2020-07-26 - When text frames are drawn inside a scaled or rotated
        // view, the getBoundingClientRect() based calculations return transformed
        // values, which we don't want.  The quickest fix is to ALWAYS remove the
        // frame element from its parent and attach it to the document body so
        // it will be untransformed.  This doesn't appear to be a major performance
        // issue, but it would be nice to find another way around.  For now, I'm
        // preserving the original code with the addition of `true || ` to always
        // enter the conditional.
        var originalParent = null;
        var originalSibling = null;
        if (true || !this.element.isConnected){
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
        var origin = JSPoint(0, 0);
        for (i = 0, l = lines.length; i < l; ++i){
            line = lines[i];
            line.recalculateSize();
            line.recalculateTrailingWhitespace();
            line._origin = JSPoint(origin);
            origin.y += line._size.height;
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

        if (size.width === 0 || size.width === Number.MAX_VALUE){
            this._widthMatchesUsedWidth = true;
        }
        if (size.height === 0 || size.height === Number.MAX_VALUE){
            this._heightMatchesUsedHeight = true;
        }

        // Superclass init will adjust origins according to text alignment, but
        // we must have properly set the line size and trailingWhitespaceWidth first
        UIHTMLTextFrame.$super.initWithLines.call(this, lines, size, attributes);
        this._updateSizesAndPositions();
        this.element.dataset.rangeLocation = this._range.location;
        this.element.dataset.rangeLength = this._range.length;
        this.element.dataset.jstext = "frame";
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
                if (attachmentInfo.context.element.parentNode !== attachmentInfo.run.element){
                    attachmentInfo.run.element.appendChild(attachmentInfo.context.element);
                }
                attachmentInfo.context.save();
                attachmentInfo.context.setFillColor(attachmentInfo.run.attributes.textColor);
                attachmentInfo.attachment.drawInContextAtPoint(attachmentInfo.context, JSPoint.Zero);
                attachmentInfo.context.restore();
            }
        }else{
            UIHTMLTextFrame.$super.drawInContextAtPoint.call(this, context, point);
        }
    },

    domSelectionPointForCharacterAtIndex: function(index){
        var line = this.lineForCharacterAtIndex(index);
        if (line !== null){
            return line.domSelectionPointForCharacterAtIndex(index);
        }
        return {node: this.element, offset: 0};
    },

    debugDescription: JSReadOnlyProperty(),

    getDebugDescription: function(){
        var lines =  ["[UIHTMLTextFrame]"];
        lines.push(["%dx%d (%dx%d used) @%d->%d".sprintf(this._size.width, this._size.height, this._usedSize.width, this._usedSize.height, this._range.location, this._range.end)]);
        for (var i = 0, l = this.lines.length; i < l; ++i){
            lines.push(this.lines[i].debugDescription);
        }
        return lines.join("\n");
    },

    recalculateRange: function(offset){
        var diff = 0;
        this._range = JSRange(this._range.location + offset, 0);
        var line;
        for (var i = 0, l = this._lines.length; i < l; ++i){
            line = this._lines[i];
            diff += line.recalculateRange(offset + diff);
            this._range.length += line._range.length;
        }
        this.element.dataset.rangeLocation = this._range.location;
        this.element.dataset.rangeLength = this._range.length;
        return diff;
    },

    _widthMatchesUsedWidth: false,
    _heightMatchesUsedHeight: false,

    recalculateSize: function(){
        var i, l;
        var line;
        var origin = JSPoint(0, 0);
        var width = 0;
        for (i = 0, l = this._lines.length; i < l; ++i){
            line = this._lines[i];
            line.recalculateSize();
            line.recalculateTrailingWhitespace();
            line._origin = JSPoint(origin);
            origin.y += line._size.height;
            if (line.size.width > width){
                width = line.size.width;
            }
        }
        this._usedSize = JSSize(width, origin.y);
        if (this._widthMatchesUsedWidth){
            this._size = JSSize(this._usedSize.width, this._size.height);
        }
        if (this._heightMatchesUsedHeight){
            this._size = JSSize(this._size.width, this._usedSize.height);
        }
        this._updateSizesAndPositions();
    }

});

})();