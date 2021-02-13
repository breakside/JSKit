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

// #import "UITextInputManager.js"
// #feature 'key' in KeyboardEvent.prototype
/* global UIHTMLTextInputManager */
// jshint browser: true
'use strict';

(function(){

var logger = JSLog("uikit", "text");

JSClass('UIHTMLContentEditableTextInputManager', UITextInputManager, {

    windowServer: null,
    domWindow: null,
    domDocument: null,
    rootElement: null,
    editableElement: JSDynamicProperty("_editableElement", null),
    styleElement: null,
    supportsBeforeinputEvent: false,

    initWithRootElement: function(rootElement){
        UIHTMLContentEditableTextInputManager.$super.initForPlatform.call(this, UIPlatform.shared);
        this.rootElement = rootElement;
        this.domDocument = this.rootElement.ownerDocument;
        this.domWindow = this.domDocument.defaultView;
        this.supportsBeforeinputEvent = "onbeforeinput" in HTMLElement.prototype;
        this.styleElement = this.domDocument.createElement("style");
        this.styleElement.type = "text/css";
        this.domDocument.head.appendChild(this.styleElement);
        var stylesheet = this.styleElement.sheet;
        stylesheet.insertRule(".uitextinputfocus *::selection { background-color: transparent; }", 0);
    },

    windowDidChangeResponder: function(window){
        UIHTMLTextInputManager.$super.windowDidChangeResponder.call(this, window);
        if (this.textInputClient === null){
            this.editableElement = null;
        }else{
            var layer = null;
            var context = null;
            if (this.textInputClient.textInputLayer){
                layer = this.textInputClient.textInputLayer();
                if (layer !== null){
                    context = this.windowServer.displayServer.contextForLayer(layer);
                }
            }
            if (context !== null){
                this.editableElement = context.element;
            }else{
                this.editableElement = null;
            }
        }
    },

    setEditableElement: function(editableElement){
        if (editableElement === this._editableElement){
            return;
        }
        if (this._editableElement !== null){
            this.removeEventListeners();
        }
        this._editableElement = editableElement;
        if (this._editableElement !== null){
            this.addEventListeners();
            this._editableElement.focus();
        }
        this.windowServer.displayServer.schedule(this.updateDocumentSelection, this);
    },

    updateDocumentSelection: function(){
        var domSelection = this.domWindow.getSelection();
        domSelection.removeAllRanges();
        if (this.textInputClient === null){
            return;
        }
        if (!this.textInputClient.textInputLayoutManager){
            return;
        }
        if (!this.textInputClient.textInputSelections){
            return;
        }
        var layoutManager = this.textInputClient.textInputLayoutManager();
        var selections = this.textInputClient.textInputSelections();
        var selection;
        var range;
        var start, end;
        var container1;
        var container2;
        var domRange;
        var anchor;
        var focus;
        // As of September 2020, only Firefox supports multiple ranges, and even
        // with Selection.addRange(), there doesn't appear to be a way to specify
        // a backwards selection where the focus is before the anchor.
        // Therefore, we'll just use the first selection from our text input
        // client, which may only be a problem for accessibility users who
        // are doing multiple selections.
        if (selections.length === 0){
            return;
        }
        selection = selections[0];
        range = selection.range;
        if (selection.insertionPoint === UITextInput.SelectionInsertionPoint.start){
            start = range.end;
            end = range.location;
        }else{
            start = range.location;
            end = range.end;
        }
        container1 = layoutManager.textContainerForCharacterAtIndex(start);
        container2 = layoutManager.textContainerForCharacterAtIndex(end);
        if (container1 && container2){
            if (container1 === container2){
                if (container1.textFrame !== null){
                    anchor = container1.textFrame.domSelectionPointForCharacterAtIndex(start);
                    focus = container1.textFrame.domSelectionPointForCharacterAtIndex(end);
                    domSelection.setBaseAndExtent(anchor.node, anchor.offset, focus.node, focus.offset);
                }else{
                    logger.warn("input layout manager container missing frame");
                }
            }else{
                // TODO: multiple containers
                // Use multiple selections to the edges of the containers instead
                // of selecting anythig in between the containers that should
                // not be selected.
                // But, see above comment about multiple selections
                logger.warn("input layout manager has multiple containers");
            }
        }else{
            logger.warn("input layout manager cannot find start and end containers");
        }
    },

    sendActionsForEvent: function(event){
        UIHTMLContentEditableTextInputManager.$super.sendActionsForEvent.call(this, event);
        this.windowServer.displayServer.schedule(this.updateDocumentSelection, this);
    },

    insertText: function(text){
        if (this.textInputClient === null){
            return;
        }
        if (text === null || text === ""){
            return;
        }
        this.textInputClient.insertText(text);
        this.windowServer.displayServer.schedule(this.updateDocumentSelection, this);
    },

    addEventListeners: function(){
        this._editableElement.classList.add("uitextinputfocus");
        this._editableElement.contentEditable = "true";
        this._editableElement.setAttribute("spellcheck", "false");
        this._editableElement.style.userSelect = "auto";
        this._editableElement.style.webkitUserSelect = "auto";
        this._editableElement.style.mozUserSelect = "auto";
        this._editableElement.style.caretColor = "transparent";
        this._editableElement.addEventListener("focus", this);
        this._editableElement.addEventListener("focusin", this);
        this._editableElement.addEventListener("focusout", this);
        this._editableElement.addEventListener("blur", this);
        this._editableElement.addEventListener("beforeinput", this);
        this._editableElement.addEventListener("input", this);
        this._editableElement.addEventListener("select", this);
        this._editableElement.addEventListener("keyup", this);
        this._editableElement.addEventListener("keydown", this);
        this._editableElement.addEventListener("compositionstart", this);
        this._editableElement.addEventListener("compositionend", this);
        this.domDocument.addEventListener("selectionchange", this);
    },

    removeEventListeners: function(){
        this._editableElement.classList.remove("uitextinputfocus");
        this._editableElement.contentEditable = "false";
        this._editableElement.removeAttribute("spellcheck");
        this._editableElement.style.userSelect = "";
        this._editableElement.style.webkitUserSelect = "";
        this._editableElement.style.mozUserSelect = "";
        this._editableElement.style.caretColor = "";
        this._editableElement.removeEventListener("focus", this);
        this._editableElement.removeEventListener("focusin", this);
        this._editableElement.removeEventListener("focusout", this);
        this._editableElement.removeEventListener("blur", this);
        this._editableElement.removeEventListener("beforeinput", this);
        this._editableElement.removeEventListener("input", this);
        this._editableElement.removeEventListener("select", this);
        this._editableElement.removeEventListener("keyup", this);
        this._editableElement.removeEventListener("keydown", this);
        this._editableElement.removeEventListener("compositionstart", this);
        this._editableElement.removeEventListener("compositionend", this);
        this.domDocument.removeEventListener("selectionchange", this);
    },

    handleEvent: function(e){
        this[e.type](e);
    },

    focusin: function(e){
    },

    focusout: function(e){
    },

    focus: function(e){
    },

    blur: function(e){
    },

    select: function(e){
    },

    selectionchange: function(e){
        // this.updateDocumentSelection();
    },

    keydown: function(e){
        e.stopPropagation();
        var text = null;
        var iterator = e.key.userPerceivedCharacterIterator();
        var preventDefault = true;
        if (iterator.nextIndex === e.key.length){
            text = e.key;
            preventDefault = false;
        }
        this.windowServer._createKeyEventFromDOMEvent(e, UIEvent.Type.keyDown, preventDefault);
        if (!this.supportsBeforeinputEvent && this.textInputClient !== null && text !== null && text !== ""){
            e.preventDefault();
            this.insertText(text);
        }
    },

    keyup: function(e){
    },

    beforeinput: function(e){
        e.preventDefault();
        this.insertText(e.data);
    },

    input: function(e){
        logger.warn("contenteditable received input");
        if (this.textInputClient !== null){
            // Trigger a new layout of the edited text, which will recreate
            // the lines/runs without whatever was just inserted by the browser
            var layoutManager = this.textInputClient.textInputLayoutManager();
            if (layoutManager !== null){
                layoutManager.setNeedsLayout();
                this.windowServer.displayServer.schedule(this.updateDocumentSelection, this);
            }
        }
    },

    compositionstart: function(e){
    },

    compositionend: function(e){
    },

    _ensureCorrectFocus: function(){
        if (this._editableElement !== null){
            this._editableElement.focus();
            this.updateDocumentSelection();
        }
    }

});

})();