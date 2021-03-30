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
        // NOTE: onbeforeinput insn't exposed in Chrome even though it supports the beforeinput event
        this.supportsBeforeinputEvent = ("onbeforeinput" in HTMLElement.prototype) || userAgentKnownToSupportBeforeInput();
        this.canLayoutDuringComposition = !userAgentIsKnownToFailCompositionIfDOMChanges();
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
            if (this._editableElement !== null){
                this._editableElement.focus();
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
            this._editableElement.focus();
        }
        this.scheduleDocumentSelectionUpdate();
    },

    documentSelectionUpdateScheduled: false,

    scheduleDocumentSelectionUpdate: function(){
        // var error = new Error("scheduleDocumentSelectionUpdate");
        // logger.debug("%{error}", error);
        if (!this.documentSelectionUpdateScheduled){
            this.documentSelectionUpdateScheduled = true;
            this.windowServer.displayServer.schedule(this.updateDocumentSelection, this);
        }
    },

    textFrameForSelections: function(){
        if (this.textInputClient === null){
            return null;
        }
        if (!this.textInputClient.textInputLayoutManager){
            return null;
        }
        if (!this.textInputClient.textInputSelections){
            return null;
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
            return null;
        }
        selection = selections[0];
        container1 = layoutManager.textContainerForCharacterAtIndex(selection.startLocation);
        container2 = layoutManager.textContainerForCharacterAtIndex(selection.insertionLocation);
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
            domSelection.setBaseAndExtent(anchor.node, anchor.offset, focus.node, focus.offset);
            logger.debug("setting dom selection: %d->%d", anchor.offset, focus.offset);
        }else if (this._editableElement !== null){
            logger.warn("input layout manager container missing frame");
            domSelection.setBaseAndExtent(this._editableElement, 0, this._editableElement, 0);
        }
    },

    sendActionsForEvent: function(event){
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
    },

    blur: function(e){
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
                logger.warn("assuming insertionLocation for end point");
                i1 = this.textInputClient.textInputSelections()[0].insertionLocation;
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
        return +element.dataset.rangeLocation + element.dataset.rangeLength;
    },

    keydown: function(e){
        logger.debug("keydown: %{public}", e.key);
        e.stopPropagation();
        var preventDefault = true;

        // We don't want to preventDefault on anything that looks like
        // it'll cause input
        var text = null;
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
        var selections = this.selectionsForDOMRanges(e.getTargetRanges());
        logger.debug("beforeinput %{public}: type=%{public}, data=%{public} dataTransfer=%{public}", selections, e.inputType, e.data, e.dataTransfer !== null ? e.dataTransfer.getData("text/plain") : null);
        switch (e.inputType){
            case "insertText":
                e.preventDefault();
                this.textInputClient.insertText(e.data);
                this.scheduleDocumentSelectionUpdate();
                break;
            case "insertLineBreak":
                e.preventDefault();
                this.textInputClient.insertLineBreak();
                this.scheduleDocumentSelectionUpdate();
                break;
            case "insertParagraph":
                e.preventDefault();
                this.textInputClient.insertNewline();
                this.scheduleDocumentSelectionUpdate();
                break;
            case "insertFromDrop":
            case "insertReplacementText":
            case "insertTranspose":
                e.preventDefault();
                this.textInputClient.replaceText(selections, e.dataTransfer.getData("text/plain"));
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
                this.textInputClient.deleteWordBackward();
                this.scheduleDocumentSelectionUpdate();
                break;
            case "deleteWordForward":
                e.preventDefault();
                this.textInputClient.deleteWordForward();
                this.scheduleDocumentSelectionUpdate();
                break;
            case "deleteSoftLineBackward":
                e.preventDefault();
                this.textInputClient.deleteToBeginningOfLine();
                this.scheduleDocumentSelectionUpdate();
                break;
            case "deleteSoftLineForward":
                e.preventDefault();
                this.textInputClient.deleteToEndOfLine();
                this.scheduleDocumentSelectionUpdate();
                break;
            case "deleteHardLineBackward":
                e.preventDefault();
                this.textInputClient.deleteToBeginningOfLine();
                this.scheduleDocumentSelectionUpdate();
                break;
            case "deleteHardLineForward":
                e.preventDefault();
                this.textInputClient.deleteToEndOfLine();
                this.scheduleDocumentSelectionUpdate();
                break;
            case "deleteContent":
                e.preventDefault();
                this.textInputClient.deleteBackward();
                this.scheduleDocumentSelectionUpdate();
                break;
            case "deleteContentBackward":
                e.preventDefault();
                this.textInputClient.deleteBackward();
                this.scheduleDocumentSelectionUpdate();
                break;
            case "deleteContentForward":
                e.preventDefault();
                this.textInputClient.deleteForward();
                this.scheduleDocumentSelectionUpdate();
                break;
            case "deleteByComposition":
                // 2021-03-26 not supported by any browser
                // - should be called before the first insertCompositionText
                //   if there's a current selection
                // - UITextEditor will clear the text automatically if necessary
                // e.preventDefault();
                // this.textInputClient.replaceText(selections, "");
                break;
            case "insertCompositionText":
                // not cancelable
                // browser will insert the new composing text 1
                if (this.compositionstartHasData){
                    this.textInputClient.replaceText(selections, "");
                    this.compositionstartHasData = false;
                }
                break;
            case "deleteCompositionText":
                // 2021-03-26 only supported by safari
                // not cancelable
                // - called before insertFromComposition to indicate the
                //   compsed text will be deleted
                // - we'll handle this in compositionend instead
                break;
            case "insertFromComposition":
                // 2021-03-26 only supported by safari
                // - we'll handle this in compositionend instead
                // - preventing default so input doesn't fire and DOM isn't updated
                // NOTE:
                // Safari calls beforeinput, input, then compositionend
                // Spec says beforeinput, compositionend, input
                e.preventDefault();
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
                e.preventDefault();
                // not supported
                break;
        }
    },

    input: function(e){
        logger.debug("input: type=%{public}, data=%{public} dataTransfer=%{public}", e.inputType, e.data, e.dataTransfer !== null ? e.dataTransfer.getData("text/plain") : null);
        var layoutManager = this.textInputClient.textInputLayoutManager();
        switch (e.inputType){
            case "insertCompositionText":
                // Firefox calls this after compositionend, making it an
                // unreliable signal.  We'll use compositionupdate, which
                // is fired correctly by Firefox.
                // Setting the marked text (in compositionupdate) will trigger a layout, which will
                // update DOM.  Safari and Firefox are fine, but Chrome doesn't
                // appreciate such an edit and will fail to complete the composition.
                // So instead:
                // - tell the layout manager it doesn't need an update after all
                // - find the relevant text run and do a manual update to its size
                //   and range, updating its parent line an frame as needed
                // we do this in the update event 
                if (!this.canLayoutDuringComposition){
                    layoutManager._needsLayout = false;
                //     var textFrame = layoutManager._textContainers[0]._textFrame;
                //     logger.debug("%{public}", textFrame.element.outerHTML);
                //     if (textFrame !== null){
                //         logger.debug("text: %{public}", this.textInputClient.text);
                //         logger.debug("%{public}", textFrame.debugDescription);
                //     }else{
                //         logger.warn("compositionupdate no text frame");
                //     }
                }
                break;
            case "deleteCompositionText":
                // Only safari supports this, and we don't really care because
                // we can do what we need in compositionend instead, which
                // all browsers support
                break;
            default:
                logger.debug("input: %{public}", e.data);
                logger.warn("contenteditable received input");
                // Trigger a new layout of the edited text, which will recreate
                // the lines/runs without whatever was just inserted by the browser
                if (layoutManager !== null){
                    layoutManager.setNeedsLayout();
                    this.scheduleDocumentSelectionUpdate();
                }
                break;
        }
    },

    compositionstartHasData: false,

    compositionstart: function(e){
        logger.debug("compositionstart: %{public}", e.data);
        if (e.data !== null && e.data.length > 0){
            this.compositionstartHasData = true;
            // data will be deleted in beforeinput
        }
    },

    compositionupdate: function(e){
        logger.debug("compositionupdate: %{public}", e.data);
        this.textInputClient.setMarkedText(e.data);
    },

    compositionend: function(e){
        logger.debug("compositionend: %{public}", e.data);
        this.textInputClient.clearMarkedText();
        this.textInputClient.insertText(e.data);
        this.scheduleDocumentSelectionUpdate();
    },

    _ensureCorrectFocus: function(){
        if (this._editableElement !== null){
            this._editableElement.focus();
            this.updateDocumentSelection();
        }
    }

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
        logger(e);
    }
    return false;
};

var userAgentIsKnownToFailCompositionIfDOMChanges = function(){
    // User agent checks aren't ideal, but there's really no other
    // way to tell how the browser behaves during input composition.
    // 2021-03-29: Safari and Firefox are known to be fine with DOM
    // changes during input composition.  Chrome is known have problems.
    try{
        var matches = navigator.userAgent.match(/Android\/(\d+)/);
        if (matches !== null){
            return true;
        }
    }catch (e){
        logger(e);
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