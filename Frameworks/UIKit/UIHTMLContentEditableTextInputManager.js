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
/* global UIHTMLTextInputManager, UIDevice, UIView, UIUserInterface */
// jshint browser: true
'use strict';

(function(){

var logger = JSLog("uikit", "text");

JSClass('UIHTMLContentEditableTextInputManager', UITextInputManager, {

    windowServer: null,
    domWindow: null,
    domDocument: null,
    rootElement: null,
    textInputLayer: JSDynamicProperty("_textInputLayer", null),
    layoutManager: JSDynamicProperty("_layoutManager", null),
    editableElement: JSDynamicProperty("_editableElement", null),
    editableContext: JSDynamicProperty("_editableContext", null),
    styleElement: null,
    supportsBeforeinputEvent: false,

    initWithRootElement: function(rootElement){
        UIHTMLContentEditableTextInputManager.$super.initForPlatform.call(this, UIPlatform.shared);
        this.rootElement = rootElement;
        this.domDocument = this.rootElement.ownerDocument;
        this.domWindow = this.domDocument.defaultView;
        // NOTE: onbeforeinput insn't exposed in older Chrome versions even though it supports the beforeinput event
        this.supportsBeforeinputEvent = ("onbeforeinput" in HTMLElement.prototype) || userAgentKnownToSupportBeforeInput();
        this.shouldPreventSpaceInput = !userAgentKnownToRequireSpaceInput();
        this.styleElement = this.domDocument.createElement("style");
        this.styleElement.type = "text/css";
        this.domDocument.head.appendChild(this.styleElement);
        var stylesheet = this.styleElement.sheet;
        stylesheet.insertRule(".uitextinputfocus *::selection { background-color: transparent; }", 0);
    },

    windowDidChangeResponder: function(window){
        UIHTMLTextInputManager.$super.windowDidChangeResponder.call(this, window);
        if (this.textInputClient === null){
            this.textInputLayer = null;
            this.layoutManager = null;
        }else{
            this.layoutManager = this.textInputClient.textInputLayoutManager ? this.textInputClient.textInputLayoutManager() : null;
            this.textInputLayer = this.textInputClient.textInputLayer ? this.textInputClient.textInputLayer() : null;
        }
    },

    setTextInputLayer: function(layer){
        this._textInputLayer = layer;
        if (this._textInputLayer !== null){
            this.editableContext = this.windowServer.displayServer.contextForLayer(this._textInputLayer);
        }else{
            this.editableContext = null;
        }
    },

    setEditableContext: function(context){
        this._editableContext = context;
        if (this._editableContext !== null){
            this.editableElement = this._editableContext.element;
        }else{
            this.editableElement = null;
        }
    },

    setEditableElement: function(editableElement){
        if (editableElement === this._editableElement){
            if (this._editableElement !== null){
                this._editableElement.focus({preventScroll: true});
                this.scheduleDocumentSelectionUpdate();
            }
            return;
        }
        if (this._editableElement !== null){
            this.revertEditableElement();
            this._editableElement.blur();
        }
        this._editableElement = editableElement;
        if (this._editableElement !== null){
            this.setupEditableElement();
            this._editableElement.focus({preventScroll: true});
        }
        this.scheduleDocumentSelectionUpdate();
    },

    documentSelectionUpdateScheduled: false,

    scheduleDocumentSelectionUpdate: function(){
        if (!this.documentSelectionUpdateScheduled){
            this.documentSelectionUpdateScheduled = true;
            this.windowServer.displayServer.schedule(this.updateDocumentSelection, this);
        }
    },

    textFrameForSelections: function(){
        if (this._layoutManager === null){
            return null;
        }
        if (!this.textInputClient.textInputSelections){
            return null;
        }
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
            return null;
        }
        selection = selections[0];
        container1 = this._layoutManager.textContainerForCharacterAtIndex(selection.startLocation);
        container2 = this._layoutManager.textContainerForCharacterAtIndex(selection.insertionLocation);
        if (container1 && container2){
            if (container1 === container2){
                return container1.textFrame;
            }
            // TODO: multiple containers
            // Use multiple selections to the edges of the containers instead
            // of selecting anythig in between the containers that should
            // not be selected.
            // But, see above comment about multiple selections
            logger.warn("input layout manager has multiple containers");
        }else{
            logger.warn("input layout manager cannot find start and end containers");
        }
        return null;
    },

    updateDocumentSelection: function(){
        this.documentSelectionUpdateScheduled = false;
        var domSelection = this.domWindow.getSelection();
        domSelection.removeAllRanges();
        var textFrame = this.textFrameForSelections();
        if (textFrame !== null){
            var selection = this.textInputClient.textInputSelections()[0];
            var anchor = textFrame.domSelectionPointForCharacterAtIndex(selection.startLocation);
            var focus = textFrame.domSelectionPointForCharacterAtIndex(selection.insertionLocation);
            if (anchor.offset < 0 || focus.offset < 0){
                throw new Error("negative dom offset");
            }
            try{
                domSelection.setBaseAndExtent(anchor.node, anchor.offset, focus.node, focus.offset);
            }catch (e){
                logger.debug("selection: @%d +%d", selection.range.location, selection.range.length);
                logger.debug("anchor: %{public} @%d", anchor.toString(), anchor.offset);
                logger.debug("focus: %{public} @%d", focus.toString(), focus.offset);
                logger.error("failed to update html selection: %{error}", e);
            }
            // logger.debug("setting dom selection: %d->%d", anchor.offset, focus.offset);
            if (domSelection.anchorNode){
                // logger.debug("  selection anchor: %{public} @ %d", domSelection.anchorNode.nodeValue, domSelection.anchorOffset);
                // logger.debug("  range focus     : %{public} @ %d", domSelection.focusNode.nodeValue, domSelection.focusOffset);
            }
        }else if (this._editableElement !== null){
            logger.warn("input layout manager container missing frame");
            domSelection.setBaseAndExtent(this._editableElement, 0, this._editableElement, 0);
        }
    },

    sendActionsForEvent: function(event){
        if (event.key === UIEvent.Key.backspace){
            return;
        }
        if (event.key === UIEvent.Key.delete){
            return;
        }
        if (UIHTMLContentEditableTextInputManager.$super.sendActionsForEvent.call(this, event)){
            this.scheduleDocumentSelectionUpdate();
        }
    },

    setupEditableElement: function(){
        this._editableElement.classList.add("uitextinputfocus");
        this._editableElement.contentEditable = "true";
        this._editableElement.setAttribute("spellcheck", "false");
        this._editableElement.style.userSelect = "auto";
        this._editableElement.style.webkitUserSelect = "auto";
        this._editableElement.style.mozUserSelect = "auto";
        this._editableElement.style.caretColor = "transparent";
        this._editableElement.style.outline = "none";
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
        this._editableElement.addEventListener("compositionupdate", this);
        this._editableElement.addEventListener("compositionend", this);
        this.domDocument.addEventListener("selectionchange", this);
        if (this.textInputClient !== null){
            var keyboardType = this.textInputClient.keyboardType;
            if (keyboardType === null || keyboardType === undefined){
                keyboardType = UITextInput.KeyboardType.default;
            }
            this._editableElement.inputMode = htmlInputModeByKeyboardType[keyboardType];

            var autocapitalizationType = this.textInputClient.autocapitalizationType;
            if (autocapitalizationType === null || autocapitalizationType === undefined){
                autocapitalizationType = UITextInput.AutocapitalizationType.none;
            }
            this._editableElement.autocapitalize = htmlAutocapitalizeByType[autocapitalizationType];

            var textContentType = this.textInputClient.textContentType;
            if (textContentType === null || textContentType === undefined){
                textContentType = UITextInput.TextContentType.none;
            }
            var autocomplete = htmlAutocompleteByTextContentType[textContentType];
            if (autocomplete === ""){
                if (this.textInputClient.secureTextEntry){
                    autocomplete = "off";
                }else{
                    autocomplete = "on";
                }
            }
            this._editableElement.setAttribute("autocomplete", autocomplete);

            if (this.textInputClient.secureTextEntry){
                this._editableElement.setAttribute("autocorrect", "off");
            }else{
                this._editableElement.removeAttribute("autocorrect");
            }
        }
    },

    revertEditableElement: function(){
        this._editableElement.classList.remove("uitextinputfocus");
        this._editableElement.contentEditable = "false";
        this._editableElement.removeAttribute("spellcheck");
        this._editableElement.style.userSelect = "";
        this._editableElement.style.webkitUserSelect = "";
        this._editableElement.style.mozUserSelect = "";
        this._editableElement.style.caretColor = "";
        this._editableElement.style.outline = "";
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
        this._editableElement.removeEventListener("compositionupdate", this);
        this._editableElement.removeEventListener("compositionend", this);
        this.domDocument.removeEventListener("selectionchange", this);
    },

    handleEvent: function(e){
        if (this.textInputClient === null){
            return;   
        }
        this[e.type](e);
    },

    focusin: function(e){
    },

    focusout: function(e){
    },

    focus: function(e){
        if (UIDevice.shared && UIDevice.shared.primaryPointerType === UIUserInterface.PointerType.touch){
            if (this.textInputClient instanceof UIView){
                this._cancelNullFirstResponder(this.textInputClient);
            }
        }
    },

    blur: function(e){
        if (UIDevice.shared && UIDevice.shared.primaryPointerType === UIUserInterface.PointerType.touch){
            if (this.textInputClient instanceof UIView){
                if (this.textInputClient.window){
                    if (this.textInputClient.window.firstResponder === this.textInputClient){
                        this._scheduleNullFirstResponder(this.textInputClient);
                    }
                }
            }
        }
    },

    _nullFirstResponderTimer: null,

    _scheduleNullFirstResponder: function(view){
        this._nullFirstResponderTimer = JSTimer.scheduledTimerWithInterval(0.2, function(){
            this._nullFirstResponderTimer = null;
            if (view.window && view.window.firstResponder === view){
                view.window.firstResponder = null;
            }
        }, this);
    },

    _cancelNullFirstResponder: function(responder){
        if (this._nullFirstResponderTimer){
            this._nullFirstResponderTimer.invalidate();
            this._nullFirstResponderTimer = null;
        }
    },

    select: function(e){
    },

    selectionchange: function(e){
    },

    selectionsForDOMRanges: function(ranges){
        var selections = [];
        var i0;
        var i1;
        var range;
        for (var i = 0, l = ranges.length; i < l; ++i){
            range = ranges[i];
            i0 = this.characterIndexFromDOMSelectionPoint(ranges[i].startContainer, ranges[i].startOffset);
            i1 = this.characterIndexFromDOMSelectionPoint(ranges[i].endContainer, ranges[i].endOffset);
            if (i0 === null){
                logger.warn("assuming 0 for start point");
                i0 = 0;
            }
            if (i1 === null){
                if (this.textInputClient.textInputSelections){
                    logger.warn("assuming insertionLocation for end point");
                    i1 = this.textInputClient.textInputSelections()[0].insertionLocation;
                }else{
                    logger.warn("assuming 0 for end point");
                    i1 = 0;
                }
            }
            selections.push(UITextInputSelection(JSRange(i0, i1 - i0, UITextInput.SelectionInsertionPoint.end)));
        }
        return selections;
    },

    characterIndexFromDOMSelectionPoint: function(node, offset){
        if (node === this._editableElement){
            return 0;
        }
        var element;
        if (node.nodeType === Node.TEXT_NODE){
            element = node.parentNode;
            if (!("rangeLocation" in element.dataset)){
                logger.warn("dom selection point is not in a text frame");
                return null;
            }
            return +element.dataset.rangeLocation + offset;
        }
        if (offset < node.childNodes.length){
            element = node.childNodes[offset];
            if (element.nodeType === Node.TEXT_NODE){
                element = element.parentNode;
            }
            if (!("rangeLocation" in element.dataset)){
                logger.warn("dom selection point is not in a text frame");
                return null;
            }
            return +element.dataset.rangeLocation;
        }
        element = node;
        if (!("rangeLocation" in element.dataset)){
            logger.warn("dom selection point is not in a text frame");
            return null;
        }
        return +element.dataset.rangeLocation + (+element.dataset.rangeLength);
    },

    keydown: function(e){
        // logger.debug("keydown: %{public}", e.key);
        e.stopPropagation();
        var preventDefault = true;

        // We don't want to preventDefault on anything that looks like
        // it'll cause input
        var text = null;
        if (e.key === null){
            logger.warn("got a null key value for keydown code:%{public} keyCode:%d", e.code, e.keyCode);
        }else if (e.key === undefined){
            logger.warn("got an undefined key value for keydown code:%{public} keyCode:%d", e.code, e.keyCode);
        }else if (e.key === ""){
            logger.warn("got an empty key value for keydown code:%{public} keyCode:%d", e.code, e.keyCode);
        }else{
            var iterator = e.key.userPerceivedCharacterIterator();
            if (iterator.nextIndex === e.key.length){
                text = e.key;
                preventDefault = false;
            }else if (e.key.startsWith(".") && e.key.length > 1){
                // iOS has keys for ".com", ".org", etc.  They don't follow
                // the key string (https://www.w3.org/TR/uievents-key/#key-string)
                // specification, in that they are more than one user percived
                // character long.  But since they always start with a ".", we
                // can special case it and assume when key = ".anything", it's
                // meant to be inserted
                text = e.key;
                preventDefault = false;
            }else if (e.key == "Backspace" || e.key == "Delete"){
                preventDefault = false;
            }
        }
        this.windowServer._createKeyEventFromDOMEvent(e, UIEvent.Type.keyDown, preventDefault);
        if (!this.supportsBeforeinputEvent && this.textInputClient !== null && text !== null && text !== ""){
            e.preventDefault();
            this.textClient.insertText(text);
        }
    },

    keyup: function(e){
    },

    beforeinput: function(e){
        var domSelection = this.domDocument.getSelection();
        var domRanges = e.getTargetRanges();
        var selections = this.selectionsForDOMRanges(domRanges);
        var inputClientSelections = [];
        // logger.debug("beforeinput %{public}: type=%{public}, data=%{public} dataTransfer=%{public}", selections, e.inputType, e.data, e.dataTransfer !== null ? e.dataTransfer.getData("text/plain") : null);
        // if (domRanges.length > 0){
        //     logger.debug("  range start     : %{public} @ %d", domRanges[0].startContainer.nodeValue, domRanges[0].startOffset);
        //     logger.debug("  range end       : %{public} @ %d", domRanges[0].endContainer.nodeValue, domRanges[0].endOffset);
        // }
        // if (domSelection.anchorNode){
        //     logger.debug("  selection anchor: %{public} @ %d", domSelection.anchorNode.nodeValue, domSelection.anchorOffset);
        //     logger.debug("  range focus     : %{public} @ %d", domSelection.focusNode.nodeValue, domSelection.focusOffset);
        // }
        switch (e.inputType){
            case "insertText":
                // Chrome will use insertText when it really should use replaceText, so
                // we could look for situations that seem more like a replacement, when
                // the event selections are different from our current selections.
                // BUT, Chrome also reports nonsensical event selections, so we'd
                // end up editing the wrong part of the text anyway.  Better to
                // just do an insert than replace some random part of the text.
                // if (selections.length > 0 && selections[0].range.length > 0){
                //     inputClientSelections = this.textInputClient.textInputSelections ? this.textInputClient.textInputSelections() : [];
                //     if (inputClientSelections.length > 0 && !inputClientSelections[0].range.isEqual(selections[0].range)){
                //         if (this.textInputClient.replaceText){
                //             this.textInputClient.replaceText(selections, e.data);
                //             this.scheduleDocumentSelectionUpdate();
                //             break;
                //         }
                //     }
                // }
                if (this.shouldPreventSpaceInput || e.data !== " "){
                    e.preventDefault();
                }
                if (e.data === null){
                    logger.warn("received null data for insertText, ignoring");
                }else{
                    this.textInputClient.insertText(e.data);
                    this.scheduleDocumentSelectionUpdate();
                }
                break;
            case "insertLineBreak":
                e.preventDefault();
                if (this.textInputClient.insertLineBreak){
                    this.textInputClient.insertLineBreak();
                }else{
                    this.textInputClient.insertText("\n");
                }
                this.scheduleDocumentSelectionUpdate();
                break;
            case "insertParagraph":
                e.preventDefault();
                if (this.textInputClient.insertNewline){
                    this.textInputClient.insertNewline();
                }else{
                    this.textInputClient.insertText("\n");
                }
                this.scheduleDocumentSelectionUpdate();
                break;
            case "insertFromDrop":
            case "insertReplacementText":
            case "insertTranspose":
                e.preventDefault();
                if (this.textInputClient.replaceText){
                    this.textInputClient.replaceText(selections, e.dataTransfer.getData("text/plain"));
                }else{
                    logger.warn("UITextInputClient missing implementation of replaceText()");
                }
                this.scheduleDocumentSelectionUpdate();
                break;
            case "insertFromYank":
            case "insertFromPaste":
            case "insertFromPasteAsQuotation":
                e.preventDefault();
                this.textInputClient.insertText(e.dataTransfer.getData("text/plain"));
                this.scheduleDocumentSelectionUpdate();
                break;
            case "deleteWordBackward":
                e.preventDefault();
                if (this.textInputClient.deleteWordBackward){
                    this.textInputClient.deleteWordBackward();
                    this.scheduleDocumentSelectionUpdate();
                }
                break;
            case "deleteWordForward":
                e.preventDefault();
                if (this.textInputClient.deleteWordForward){
                    this.textInputClient.deleteWordForward();
                    this.scheduleDocumentSelectionUpdate();
                }
                break;
            case "deleteSoftLineBackward":
                e.preventDefault();
                if (this.textInputClient.deleteToBeginningOfLine){
                    this.textInputClient.deleteToBeginningOfLine();
                    this.scheduleDocumentSelectionUpdate();
                }
                break;
            case "deleteSoftLineForward":
                e.preventDefault();
                if (this.textInputClient.deleteToEndOfLine){
                    this.textInputClient.deleteToEndOfLine();
                    this.scheduleDocumentSelectionUpdate();
                }
                break;
            case "deleteHardLineBackward":
                e.preventDefault();
                if (this.textInputClient.deleteToBeginningOfLine){
                    this.textInputClient.deleteToBeginningOfLine();
                    this.scheduleDocumentSelectionUpdate();
                }
                break;
            case "deleteHardLineForward":
                e.preventDefault();
                if (this.textInputClient.deleteToEndOfLine){
                    this.textInputClient.deleteToEndOfLine();
                    this.scheduleDocumentSelectionUpdate();
                }
                break;
            case "deleteContent":
                e.preventDefault();
                if (this.textInputClient.deleteBackward){
                    this.textInputClient.deleteBackward();
                    this.scheduleDocumentSelectionUpdate();
                }
                break;
            case "deleteContentBackward":
                e.preventDefault();
                if (this.textInputClient.deleteBackward){
                    this.textInputClient.deleteBackward();
                    this.scheduleDocumentSelectionUpdate();
                }
                break;
            case "deleteContentForward":
                e.preventDefault();
                if (this.textInputClient.deleteForward){
                    this.textInputClient.deleteForward();
                    this.scheduleDocumentSelectionUpdate();
                }
                break;
            case "insertCompositionText":
                // not cancelable
                // browser will insert the new composing text
                if (this.textInputClient.replaceText){
                    this.textInputClient.replaceText(selections, e.data);
                }
                break;
            case "deleteCompositionText":
                // Removed from input events spec, but Safari implemented it,
                // so it may still fire. Need to handle.
                if (this.textInputClient.replaceText){
                    this.textInputClient.replaceText(selections, "");
                }
                break;
            case "insertFromComposition":
                // Removed from input events spec, but Safari implemented it,
                // so it may still fire. Need to handle.
                if (this.textInputClient.replaceText){
                    this.textInputClient.replaceText(selections, e.data);
                }
                break;
            case "deleteByDrag":
            case "deleteByCut":
            case "deleteEntireSoftLine":
            case "insertLink":
            case "historyUndo":
            case "historyRedo":
            case "formatBold":
            case "formatItalic":
            case "formatUnderline":
            case "formatStrikeThrough":
            case "formatSuperscript":
            case "formatSubscript":
            case "formatJustifyFull":
            case "formatJustifyCenter":
            case "formatJustifyRight":
            case "formatJustifyLeft":
            case "formatIndent":
            case "formatOutdent":
            case "formatRemove":
            case "formatSetBlockTextDirection":
            case "formatSetInlineTextDirection":
            case "formatBackColor":
            case "formatFontColor":
            case "formatFontName":
            case "insertOrderedList":
            case "insertUnorderedList":
            case "insertHorizontalRule":
                // not supported, so not allowed
                e.preventDefault();
                break;
            default:
                // anything else, not allowed
                logger.warn("contenteditable received unknown beforeinput %{public}", e.inputType);
                e.preventDefault();
                break;
        }
    },

    input: function(e){
        // logger.debug("input: type=%{public}, data=%{public} dataTransfer=%{public}", e.inputType, e.data, e.dataTransfer !== null ? e.dataTransfer.getData("text/plain") : null);
        // logger.debug("%{public}", this._editableElement.innerHTML);
        switch (e.inputType){
            case "insertCompositionText":
                // Cannot be canceled during beforeinput, so we expect this 
                // input event to run. Allow the browser to do its thing here.
                break;
            case "deleteCompositionText":
            case "insertFromComposition":
                // Removed from input events spec, but Safari implemented it,
                // so it may still fire.  No need to log a warning.
                break;
            case "deleteContentBackward":
                // Android doesn't cancel deleteContentBackward in some situations
                // related to text re-composition.  Nothing for us to do here,
                // but also no need to log a warning.
                break;
            default:
                // logger.debug("input: %{public}", e.data);
                if (this.shouldPreventSpaceInput || e.inputType !== "insertText" || e.data !== " "){
                    logger.warn("contenteditable received input %{public}", e.inputType);
                }
                // Trigger a new layout of the edited text, which will recreate
                // the lines/runs without whatever was just inserted by the browser
                if (this._layoutManager !== null){
                    this._layoutManager.setNeedsLayout();
                    this.scheduleDocumentSelectionUpdate();
                }
                break;
        }
    },

    _isComposing: false,

    compositionstart: function(e){
        // var domSelection = this.domDocument.getSelection();
        // var domRanges = [];
        // for (var i = 0, l = domSelection.rangeCount; i < l; ++i){
        //     domRanges.push(domSelection.getRangeAt(i));
        // }
        // var selections = this.selectionsForDOMRanges(domRanges);
        // logger.debug("compositionstart %{public}: %{public}", selections, e.data);
        if (!this._isComposing){
            this._isComposing = true;
            this._preventDOMUpdates();
        }else{
            // known to happen with Android SwiftKey keyboard
            logger.warn("received compositionstart, but already started");
        }
    },

    compositionupdate: function(e){
        // var domSelection = this.domDocument.getSelection();
        // var domRanges = [];
        // for (var i = 0, l = domSelection.rangeCount; i < l; ++i){
        //     domRanges.push(domSelection.getRangeAt(i));
        // }
        // var selections = this.selectionsForDOMRanges(domRanges);
        // logger.debug("compositionupdate %{public}: %{public}", selections, e.data);
        if (!this._isComposing){
            logger.warn("got compositionupdate, but not started");
        }
    },

    compositionend: function(e){
        // logger.debug("compositionend: %{public}", e.data);

        if (this._isComposing){
            this._isComposing = false;
            this._resumeDOMUpdates();
            this.scheduleDocumentSelectionUpdate();
            this._cleanupTextNodes();
        }else{
            logger.warn("got compositionend, but already ended");
        }
    },

    _originalLayoutMethod: null,

    _preventDOMUpdates: function(){
        if (this._layoutManager === null){
            return;
        }
        this._originalLayoutMethod = this._layoutManager.layout;
        Object.defineProperty(this._layoutManager, "layout", {
            configurable: true,
            writable: false,
            enumerable: false,
            value: function(){
                var container;
                var offset = 0;
                for (var i = 0, l = this._textContainers.length; i < l; ++i){
                    container = this._textContainers[i];
                    offset += container._textFrame.recalculateRange(offset);
                    container._textFrame.recalculateSize();
                    container.framesetter._updateSizesAndPositionsOfLinesInFrame(container._textFrame);
                }
            }
        });
        // var container;
        // var i, l;
        // for (i = 0, l = this._layoutManager._textContainers.length; i < l; ++i){
        //     container = this._layoutManager._textContainers[i];
        //     if (container._textFrame instanceof UIHTMLTextFrame){
        //         container._textFrame.element.style.overflow = "visible";
        //     }
        // }
    },

    _resumeDOMUpdates: function(){
        if (this._layoutManager === null){
            return;
        }
        // var container;
        // var i, l;
        // for (i = 0, l = this._layoutManager._textContainers.length; i < l; ++i){
        //     container = this._layoutManager._textContainers[i];
        //     if (container._textFrame instanceof UIHTMLTextFrame){
        //         container._textFrame.element.style.overflow = "hidden";
        //     }
        // }
        Object.defineProperty(this._layoutManager, "layout", {
            configurable: true,
            writable: false,
            enumerable: false,
            value: this._originalLayoutMethod
        });
        this._originalLayoutMethod = null;
    },

    _ensureCorrectFocus: function(){
        if (this._editableElement !== null){
            this._editableElement.focus({preventScroll: true});
            this.updateDocumentSelection();
        }
    },

    _cleanupTextNodes: function(){
        if (this._editableElement === null){
            return;
        }
        var child;
        for (var i = this._editableElement.childNodes.length - 1; i >= 0; --i){
            child = this._editableElement.childNodes[i];
            if (child.nodeType === Node.TEXT_NODE){
                logger.warn("removing stray text node in editableElement");
                this._editableElement.removeChild(child);
            }
        }
    },

});

var userAgentKnownToSupportBeforeInput = function(){
    // User agent checks aren't ideal, but Chrome doesn't expose the fact
    // that it supports the beforeinput event
    try{
        var matches = navigator.userAgent.match(/Chrome\/(\d+)/);
        if (matches !== null){
            return parseInt(matches[1]) >= 88;
        }
    }catch (e){
        logger.warn("Failed to check user agent: %{error}", e);
    }
    return false;
};

var userAgentKnownToRequireSpaceInput = function(){
    // User agent checks aren't ideal, but Android has issues with calling
    // preventDefault() on beforeinput when the input text is a space, so
    // a user agent check is the best we can do.
    try{
        var matches = navigator.userAgent.match(/Android[\/ ](\d+)/);
        return matches !== null;
    }catch (e){
        logger.warn("Failed to check user agent: %{error}", e);
    }
    return false;
};

var htmlInputModeByKeyboardType = {};
htmlInputModeByKeyboardType[UITextInput.KeyboardType.default] = "";
htmlInputModeByKeyboardType[UITextInput.KeyboardType.url] = "url";
htmlInputModeByKeyboardType[UITextInput.KeyboardType.email] = "email";
htmlInputModeByKeyboardType[UITextInput.KeyboardType.phone] = "tel";
htmlInputModeByKeyboardType[UITextInput.KeyboardType.number] = "numeric";
htmlInputModeByKeyboardType[UITextInput.KeyboardType.decimal] = "decimal";
htmlInputModeByKeyboardType[UITextInput.KeyboardType.search] = "search";

var htmlAutocapitalizeByType = {};
htmlAutocapitalizeByType[UITextInput.AutocapitalizationType.none] = "none";
htmlAutocapitalizeByType[UITextInput.AutocapitalizationType.words] = "words";
htmlAutocapitalizeByType[UITextInput.AutocapitalizationType.sentences] = "sentences";
htmlAutocapitalizeByType[UITextInput.AutocapitalizationType.characters] = "characters";

var htmlAutocompleteByTextContentType = {};
htmlAutocompleteByTextContentType[UITextInput.TextContentType.none] = "";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.url] = "url";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.email] = "email";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.phone] = "tel";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.username] = "username";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.password] = "current-password";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.newPassword] = "new-password";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.oneTimeCode] = "one-time-code";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.name] = "name";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.namePrefix] = "honorific-prefix";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.givenName] = "given-name";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.middleName] = "additional-name";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.familyName] = "family-name";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.nameSuffix] = "honorific-suffix";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.nickname] = "nickname";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.organizationName] = "organization-title";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.streetAddress] = "street-address";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.streetAddressLine1] = "address-line1";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.streetAddressLine2] = "address-line2";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.city] = "address-level2";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.state] = "address-level1";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.locality] = "address-level3";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.country] = "country-name";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.postalCode] = "postal-code";

})();