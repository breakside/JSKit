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
// #import "UITextFramesetter.js"
// #import "UIHTMLTextFrame.js"
// #import "UIHTMLTextTypesetter.js"
/* global UIHTMLTextFramesetter, UIHTMLTextTypesetter, UIHTMLTextFrame */
// jshint browser: true
'use strict';

(function(){

JSClass("UIHTMLTextFramesetter", UITextFramesetter, {

    _domDocument: null,
    _htmlDisplayServer: null,
    _htmlTypesetter: null,
    _frameElement: null,
    _attachments: null,

    initWithDocument: function(domDocument, htmlDisplayServer){
        this._domDocument = domDocument;
        this._htmlDisplayServer = htmlDisplayServer;
        this._htmlTypesetter = UIHTMLTextTypesetter.initWithDocument(domDocument);
        this._attachments = [];
        UIHTMLTextFramesetter.$super.initWithTypesetter.call(this, this._htmlTypesetter);
    },

    createFrame: function(size, range, maximumLines){
        this._createFrameElementIfNeeded();
        this._enqueueElements();
        var attachmentsByObjectID = {};
        var attachment;
        var i, l;
        for (i = 0, l = this._attachments.length; i < l; ++i){
            attachment = this._attachments[i];
            attachmentsByObjectID[attachment.objectID] = attachment;
        }
        var frame = UIHTMLTextFramesetter.$super.createFrame.call(this, size, range, maximumLines);
        this._attachments = [];
        for (i = 0, l = frame.attachmentRuns.length; i < l; ++i){
            attachment = frame.attachmentRuns[i].attachment;
            this._attachments.push(attachment);
            if (attachment.objectID in attachmentsByObjectID){
                delete attachmentsByObjectID[attachment.objectID];
            }else{
                this._htmlDisplayServer.attachmentInserted(attachment);
            }
        }
        for (i in attachmentsByObjectID){
            attachment = attachmentsByObjectID[i];
            this._htmlDisplayServer.attachmentRemoved(attachment);
        }
        this._removeQueuedElements();
        return frame;
    },

    constructFrame: function(lines, size){
        return UIHTMLTextFrame.initWithElement(this._frameElement, lines, size);
    },

    _createFrameElementIfNeeded: function(){
        if (this._frameElement === null){
            this._frameElement = this._domDocument.createElement('div');
            this._frameElement.setAttribute("role", "none presentation");
            // this._frameElement.setAttribute("aria-hidden", "true");
            this._frameElement.style.position = 'absolute';
            this._frameElement.style.visibility = 'hidden';
            this._frameElement.style.overflow = 'hidden';
            // Disabling pointer events for text frame elements because of issue
            // with touch events not being fired when a text element changes out
            // from underneath a touch.  For example, when a button's title changes
            // color, the divs in a text frame are replaced* and a touchend event
            // is never fired because the element that was the target
            // of the original touchbegin is gone.  We don't need any events
            // firing from text elements anyway, so the simple fix is to disable them.
            this._frameElement.style.pointerEvents = 'none';
            this._domDocument.body.appendChild(this._frameElement);
        }
    },

    _enqueueElements: function(){
        var possibleLineElement;
        var possibleRunElement;
        var i, j;
        for (i = this._frameElement.childNodes.length - 1; i >= 0; --i){
            possibleLineElement = this._frameElement.childNodes[i];
            // enqueue disabled until futher testing/debugging
            // - tried it out in an effort to make Chrome happier when doing
            //   input composition, so we weren't removing and replacing
            //   the elements/nodes on each input
            // - Didn't really help the Chrome situation, but made Safari
            //   worse.  Safari can seemingly handle the elements being ripped
            //   out, but doesn't like the text node changing
            if (false && possibleLineElement.nodeType === Node.ELEMENT_NODE && possibleLineElement.dataset.jstext == "line"){
                this._htmlTypesetter.enqueueLineElement(possibleLineElement);
                for (j = possibleLineElement.childNodes.length - 1; j >= 0; --j){
                    possibleRunElement = possibleLineElement.childNodes[j];
                    if (possibleRunElement.nodeType === Node.ELEMENT_NODE && possibleRunElement.dataset.jstext == "run"){
                        this._htmlTypesetter.enqueueRunElement(possibleRunElement);
                    }else{
                        possibleLineElement.removeChild(possibleRunElement);
                    }
                }
            }else{
                this._frameElement.removeChild(possibleLineElement);
            }
        }
    },

    _removeQueuedElements: function(){
        var element = this._htmlTypesetter.dequeueLineElement();
        while (element !== null){
            element.parentNode.removeChild(element);
            element = this._htmlTypesetter.dequeueRunElement();
        }
        element = this._htmlTypesetter.dequeueRunElement();
        while (element !== null){
            // only bother removing the run if we haven't already removed its parent line
            if (element.parentNode.parentNode !== null){
                element.parentNode.removeChild(element);
            }
            element = this._htmlTypesetter.dequeueRunElement();
        }
    },

    _alignLinesInFrame: function(frame){
        UIHTMLTextFramesetter.$super._alignLinesInFrame.call(this, frame);
        this._updateSizesAndPositionsOfLinesInFrame(frame);
    },

    _updateSizesAndPositionsOfLinesInFrame: function(frame){
        var i, l;
        var line;

        // set our size
        frame.element.style.width = '%dpx'.sprintf(frame.size.width);
        frame.element.style.height = '%dpx'.sprintf(frame.size.height);

        // position the lines
        for (i = 0, l = frame.lines.length; i < l; ++i){
            line = frame.lines[i];
            line.element.style.height = '%dpx'.sprintf(line.size.height);
            line.element.style.left = '%dpx'.sprintf(line.origin.x);
            line.element.style.top = '%dpx'.sprintf(line.origin.y);
        }
    },

});

})();