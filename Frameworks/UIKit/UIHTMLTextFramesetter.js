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
    _htmlTypesetter: null,
    _reusableFrameElement: null,

    initWithDocument: function(domDocument, htmlDisplayServer){
        this._htmlTypesetter = UIHTMLTextTypesetter.initWithDocument(domDocument, htmlDisplayServer);
        UIHTMLTextFramesetter.$super.initWithTypesetter.call(this, this._htmlTypesetter);
        this._domDocument = domDocument;
    },

    createFrame: function(size, range, maximumLines){
        this._creatingFrame = true;
        this._resetReusableFrameElement();
        var lineBreakMode = this.effectiveLineBreakMode(this.attributes.lineBreakMode, 1, maximumLines);
        this._htmlTypesetter.layoutRange(range, size, lineBreakMode);
        return UIHTMLTextFramesetter.$super.createFrame.call(this, size, range, maximumLines);
    },

    constructFrame: function(lines, size, attributes){
        return UIHTMLTextFrame.initWithElement(this._reusableFrameElement, lines, size, attributes);
    },

    _resetReusableFrameElement: function(){
        if (this._reusableFrameElement === null){
            this._reusableFrameElement = this._domDocument.createElement('div');
            this._reusableFrameElement.style.position = 'absolute';
            this._reusableFrameElement.style.visibility = 'hidden';
            this._reusableFrameElement.style.overflow = 'hidden';
            // Disabling pointer events for text frame elements because of issue
            // with touch events not being fired when a text element changes out
            // from underneath a touch.  For example, when a button's title changes
            // color, the divs in a text frame are replaced* and a touchend event
            // is never fired because the element that was the target
            // of the original touchbegin is gone.  We don't need any events
            // firing from text elements anyway, so the simple fix is to disable them.
            //
            // * It would be nice to not replace the text line divs in the first place, but
            //   that is an optimzation we don't absolutely need right now.  Even when
            //   it gets done, we should probably leave events disabled on text elements
            //   since they're never needed.
            this._reusableFrameElement.style.pointerEvents = 'none';
            this._domDocument.body.appendChild(this._reusableFrameElement);
        }else{
            var nodes = this._reusableFrameElement.childNodes;
            for (var i = nodes.length - 1; i >= 0; --i){
                this._reusableFrameElement.removeChild(nodes[i]);
            }
        }
    }

});

})();