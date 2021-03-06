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

JSClass('UIHTMLTextInputManager', UITextInputManager, {

    // The role of a `UITextInputManager` is to provide a `UIResponder` with information
    // regarding text input based on system events.  Typically in HTML apps this isn't even
    // a consideration because you just use an <input>, <textarea>, or <div contenteditable="true">
    // and the browser basically handles everything for you.
    //
    // These options, however, are woefully insufficient for meeting our goals.  One example goal
    // is a desire to have limited rich text, like only allowing bold, italic and underline.
    // The only way to do it with the existing options is to use contenteditable, but then we
    // get fully rich text that's very hard to limit because the browsers can provide input/format
    // mechanisms that we don't control (like Edit > Insert List).  It also means we have to do a lot
    // of html parsing to figure out what happened after an edit, and work backward to our JSAttributedString.
    // Another goal is the desire to have concurrent editing with multiple cursors and selections, which
    // is much easier to manage if we don't deal at all with HTML's concept of a single selection in the document.
    //
    // So, we'll avoid using those options and simply use non editable HTML elements to represent our
    // text.  Then we'll show our own cursors and selections and it'll look just like an editable element
    // to users.  This also has the major advantage of not tying our views to any special HTML rendering,
    // so the same code that renders in HTML can be used in non-HTML environments easily, provided that
    // environment has its own version of UITextInputManager.
    //
    // But then how can we handle editing events?  That's what the abstract UITextInputManager is for, and this
    // specialized subclass will be the single point for handling input-related events in an HTML environment, parsing them,
    // and dispatching calls to whatever view is the first responder.
    //
    // A simple approach would be to look at keydown events and figure out what character the user typed.
    // This quickly becomes problematic because OSes today provide many methods of input, some via software
    // that generate no keydown events for us (e.g., Edit > Special Characters and Emojis, Dictation).
    //
    // So we'll use a trick: a single hidden textarea that is focused and receives input in the traditional
    // HTML sense.  It will contain a special string value that we'll inspect on each input event,
    // figure out what changed, and finally reset to the known special state.  For inserting text, we could
    // just start with an empty textarea and be fine.  But the special string value is most useful in
    // other situations when figuring out what has been deleted or how the cursor has moved.  Since we aren't
    // interpreting the keystrokes ourself, and instead are watching what happens in a real textarea, we'll
    // automatically respect keyboard shortcuts on any system.
    //
    // The special string is:
    // abcd efgh ijkl
    // mnop q  t uvwx
    // yzAB CDEF GHIJ
    //
    // And the cursor is always placed between the q and the t, right in the middle.  Using four characters,
    // q  t, allows us to tell the difference between a single character move/delete and a word boundardy
    // move/delete.  Spaces around the insertion point don't confuse mobile text predictors as much as letters would.
    // Having three words on the line allows us to tell the difference between a word boundary
    // move/delete and a line boundary move/delete.  Having three lines allows us to catch up/down moves.

    // TODO: have the hidden input follow the real cursor location, so things like emoji and dictation
    //       windows popup in the right place
    // TODO: see if newer key/input events could help out and be more accurate
    // TODO: figure out what needs to change to work well with right to left input
    // TODO: see if there's a way to get the press-and-hold feature working on macOS
    //       press and hold i, for example, and a popup shows alternatives.  selecting
    //       an alternative fails to generate an input event because we've deleted the
    //       original i from the hidden textarea
    // FIXME:refine event handlers for Chrome, which doesn't seem to fire input after
    //       compose, and also sees a selection change after emoji input
    // TODO: figure out if we need to care about window blur/focus, or if there's a
    //       way to have a first responder in a focused window, but the hidden textarea unfocused.
    // FIXME:watch out for undo/redo, which won't do the right thing...probably need to override
    //       the keyboard shortcuts as best we can.  Not sure how to disable the menus.
    // FIXME:iOS shows the cursor for the hidden text input above everything...might need to go
    //       offscreen for mobile safari
    // FIXME:text entry on mobile without autocorrect is a pain
    // FIXME:mobile safari shows the input accessory view, but would love to hide it
    // FIXME:can't focus programmatically in mobile safari (need to try new MouseEvent())
    // TODO: consider what could change on mobile where we are far less concerned about capturing
    //       cursor movement as the result of key presses (e.g., no arrow keys to worry about)

    windowServer: null,
    domWindow: null,
    rootElement: null,
    hiddenInputElement: null,
    _isComposing: false,
    _selectedRange: JSRange(0, 0),
    _config: null,
    _rangeUpdateScheduled: false,
    _isFocused: false,

    initWithRootElement: function(rootElement){
        this.rootElement = rootElement;
        this.domWindow = this.rootElement.ownerDocument.defaultView;
        this.hiddenInputElement = rootElement.ownerDocument.createElement('textarea');
        this.hiddenInputElement.setAttribute("role", "none presentation");
        this.hiddenInputElement.setAttribute("aria-hidden", "true");
        this.rootElement.appendChild(this.hiddenInputElement);
        this.hiddenInputElement.style.position = 'absolute';
        // The positioning has some interesting quirks
        // 1. If offscreen, macOS will not show the dictation popup
        // 2. If offscreen, macOS will show the emoji popup, but always in the bottom left corner
        this.hiddenInputElement.style.top = '0';
        this.hiddenInputElement.style.left = '0';
        this.hiddenInputElement.style.opacity = '0';
        this.hiddenInputElement.style.pointerEvents = 'none';
        this.hiddenInputElement.style.cursor = 'default';
        this.hiddenInputElement.style.height = '60px';
        this.hiddenInputElement.style.width = '300px';
        this.hiddenInputElement.style.padding = '0';
        this.hiddenInputElement.style.border = '1px solid black';
        this.hiddenInputElement.style.font = '14px/20px monospace';
        this.hiddenInputElement.style.zIndex = -1;
        // TODO: watch out for autocomplete/autocorrect
        //       may not be an issue because of how we reset the textarea after each char
        this.setupEventListeners();
        this._updateSelectedRangeBound = this._updateSelectedRange.bind(this);
    },

    setupEventListeners: function(){
        this.domWindow.addEventListener('focus', this, false);
        this.domWindow.addEventListener('blur', this, false);
        this.hiddenInputElement.addEventListener('focus', this, false);
        this.hiddenInputElement.addEventListener('blur', this, false);
        this.hiddenInputElement.addEventListener('select', this, false);
        this.hiddenInputElement.addEventListener('keydown', this, false);
        this.hiddenInputElement.addEventListener('keyup', this, false);
        this.hiddenInputElement.addEventListener('input', this, false);
        this.hiddenInputElement.addEventListener('compositionstart', this, false);
        this.hiddenInputElement.addEventListener('compositionend', this, false);
    },

    windowDidChangeResponder: function(window){
        UIHTMLTextInputManager.$super.windowDidChangeResponder.call(this, window);
        this._ensureCorrectFocus();
    },

    _ensureCorrectFocus: function(){
        if (this.textInputClient){
            this._config = UIHTMLTextInputManager._HiddenConfig;
            if (!this._isFocused){
                this.hiddenInputElement.focus();
            }
            // FIXME: what if _isComposing is true?  The old responder needs to be told to stop
            this._reset();
        }else{
            if (this._isFocused){
                this.hiddenInputElement.blur();
            }
        }
    },

    handleEvent: function(e){
        this[e.type](e);
    },

    focus: function(e){
        if (e.currentTarget === this.domWindow){
            // logger.info("window focus");
        }else if (e.currentTarget === this.hiddenInputElement){
            this._isFocused = true;
            // logger.info("input focus");
        }
        e.stopPropagation();
    },

    blur: function(e){
        if (e.currentTarget === this.domWindow){
            // logger.info("window blur");
        }else if (e.currentTarget === this.hiddenInputElement){
            this._isFocused = false;
            // Mobile devices can hide the keyboard, blurring the hidden input
            // field even when there's a current responder.  In such a case,
            // we need to clear the current responder.
            // FIXME: we don't want to do this on a device with a physical keyboard
            // this.textInputClient.window.firstResponder = null;
        }
        e.stopPropagation();
    },

    select: function(e){
        this._scheduleRangeUpdate();
    },

    keydown: function(e){
        if (this._selectedRange.length > 0){
            if (!this._isComposing){
                logger.warn("keydown received while input has selection");
                this._reset();
            }
        }
        e.stopPropagation();
        var shouldPreventDefault = false;
        // We have to capture tab specially in order to prevent default,
        // or else the browser will unfocus the hidden textarea.
        // Tab is also a special UITextInput action, so different inputs
        // can handle it special.
        if (e.key == "Tab"){
            shouldPreventDefault = true;
            if (e.shiftKey){
                if (this.textInputClient && this.textInputClient.insertBacktab){
                    this.textInputClient.insertBacktab();
                }
            }else{
                if (this.textInputClient && this.textInputClient.insertTab){
                    this.textInputClient.insertTab();
                }
            }
        }
        this.windowServer.keydown(e, shouldPreventDefault);
        // Bit of a trick here to watch for cursor movement...
        // 1. The cursor position won't be updated until after the event fully propagates
        //    and is processed by the browser, so we need to wait until that happens
        // 2. When insterting or deleting, the selection will change, but we'll immediately
        //    reset the input to the known state.  Waiting allows us to conveniently miss these
        //    temporary changes that we don't want to bother with anyway
        //
        // requestAnimationFrame(f) should be more reliable and get called faster than setTimeout(f, 0)
        this._scheduleRangeUpdate();
    },

    _scheduleRangeUpdate: function(){
        if (!this._rangeUpdateScheduled){
            this.domWindow.requestAnimationFrame(this._updateSelectedRangeBound);
        }
    },

    keyup: function(e){
        e.stopPropagation();
        this.windowServer.keyup(e);
    },

    input: function(e){
        // TODO: use event data if it's a DOM 3 input event?
        this._dispatchActionForValueChange();
        if (!this._isComposing){
            this._reset();
        }
    },

    compositionstart: function(e){
        this._isComposing = true;
    },

    compositionend: function(e){
        this._isComposing = false;
    },

    _reset: function(){
        if (this._isComposing){
            logger.warn("calling _reset with _isComposing = true");
            this._isComposing = false;
        }
        this.hiddenInputElement.value = this._config.resetValue;
        this._selectedRange = this._config.resetSelection;
        this.hiddenInputElement.setSelectionRange(this._selectedRange.location, this._selectedRange.end);
    },

    _updateSelectedRange: function(){
        this._rangeUpdateScheduled = false;
        if (this._isComposing){
            // don't care about cursor changes when composing because they'll trigger a compose end
            return;
        }
        var oldRange = this._selectedRange;
        this._selectedRange = JSRange(this.hiddenInputElement.selectionStart, this.hiddenInputElement.selectionEnd - this.hiddenInputElement.selectionStart);
        if (!oldRange.isEqual(this._selectedRange)){
            this._dispatchActionForSelectionChange(oldRange);
            this._reset();
        }
    },

    _dispatchActionForSelectionChange: function(oldRange){
        // FIXME: right-to-left confusion with back/forward terminology?
        if (this._selectedRange.length === 0){
            // If there's no length to the selection, then we've simply moved the cursor
            switch (this._selectedRange.location){
                case 0:
                    // start of document
                    if (this.textInputClient && this.textInputClient.moveToBeginningOfDocument){
                        this.textInputClient.moveToBeginningOfDocument();
                    }
                    break;
                case this._config.resetSelection.location - this._config.prevLine:
                    // previous line
                    if (this.textInputClient && this.textInputClient.moveUp){
                        this.textInputClient.moveUp();
                    }
                    break;
                case this._config.resetSelection.location - this._config.starOfLine:
                    // start of line
                    if (this.textInputClient && this.textInputClient.moveToBeginningOfLine){
                        this.textInputClient.moveToBeginningOfLine();
                    }
                    break;
                case this._config.resetSelection.location - this._config.prevWord:
                    // back 1 word
                    if (this.textInputClient && this.textInputClient.moveWordBackward){
                        this.textInputClient.moveWordBackward();
                    }
                    break;
                case this._config.resetSelection.location - this._config.prevChar:
                    // back 1 char
                    if (this.textInputClient && this.textInputClient.moveBackward){
                        this.textInputClient.moveBackward();
                    }
                    break;
                case this._config.resetSelection.location + this._config.nextChar:
                    // forward 1 char
                    if (this.textInputClient && this.textInputClient.moveForward){
                        this.textInputClient.moveForward();
                    }
                    break;
                case this._config.resetSelection.location + this._config.nextWord:
                    // forward 1 word
                    if (this.textInputClient && this.textInputClient.moveWordForward){
                        this.textInputClient.moveWordForward();
                    }
                    break;
                case this._config.resetSelection.location + this._config.endOfLine:
                    // end of line
                    if (this.textInputClient && this.textInputClient.moveToEndOfLine){
                        this.textInputClient.moveToEndOfLine();
                    }
                    break;
                case this._config.resetSelection.location + this._config.nextLine:
                    // next line
                    if (this.textInputClient && this.textInputClient.moveDown){
                        this.textInputClient.moveDown();
                    }
                    break;
                case this._config.resetValue.length:
                    // end of document
                    if (this.textInputClient && this.textInputClient.moveToEndOfDocument){
                        this.textInputClient.moveToEndOfDocument();
                    }
                    break;
                default:
                    logger.warn("Unexpected selection point: %d", this._selectedRange.location);
                    break;
            }
        }else{
            // If the selection has a range, we're selecting something rather than moving
            if (this._selectedRange.location === 0 && this._selectedRange.length == this._config.resetValue.length){
                // select all
                if (this.textInputClient && this.textInputClient.selectAll){
                    this.textInputClient.selectAll();
                }
            }else if (this._selectedRange.location == this._config.resetSelection.location){
                // forward selection
                switch (this._selectedRange.length){
                    case this._config.nextChar:
                        // select next char
                        if (this.textInputClient && this.textInputClient.moveForwardAndModifySelection){
                            this.textInputClient.moveForwardAndModifySelection();
                        }
                        break;
                    case this._config.nextWord:
                        // select to end of word
                        if (this.textInputClient && this.textInputClient.moveWordForwardAndModifySelection){
                            this.textInputClient.moveWordForwardAndModifySelection();
                        }
                        break;
                    case this._config.endOfLine:
                        // select to end of line
                        if (this.textInputClient && this.textInputClient.moveToEndOfLineAndModifySelection){
                            this.textInputClient.moveToEndOfLineAndModifySelection();
                        }
                        break;
                    case this._config.nextLine:
                        // select to next line
                        if (this.textInputClient && this.textInputClient.moveDownAndModifySelection){
                            this.textInputClient.moveDownAndModifySelection();
                        }
                        break;
                    case this._config.resetValue.length - this._config.resetSelection.location:
                        // select to end of document
                        if (this.textInputClient && this.textInputClient.moveToEndOfDocumentAndModifySelection){
                            this.textInputClient.moveToEndOfDocumentAndModifySelection();
                        }
                        break;
                    default:
                        logger.warn("Unexpected selection: %d,%d", this._selectedRange.location, this._selectedRange.length);
                        break;
                }
            }else if (this._selectedRange.end == this._config.resetSelection.location){
                // backward selection
                switch (this._selectedRange.length){
                    case this._config.prevChar:
                        // select prev char
                        if (this.textInputClient && this.textInputClient.moveBackwardAndModifySelection){
                            this.textInputClient.moveBackwardAndModifySelection();
                        }
                        break;
                    case this._config.prevWord:
                        // select to start of word
                        if (this.textInputClient && this.textInputClient.moveWordBackwardAndModifySelection){
                            this.textInputClient.moveWordBackwardAndModifySelection();
                        }
                        break;
                    case this._config.starOfLine:
                        // select to start of line
                        if (this.textInputClient && this.textInputClient.moveToBeginningOfLineAndModifySelection){
                            this.textInputClient.moveToBeginningOfLineAndModifySelection();
                        }
                        break;
                    case this._config.prevLine:
                        // select to previous line
                        if (this.textInputClient && this.textInputClient.moveUpAndModifySelection){
                            this.textInputClient.moveUpAndModifySelection();
                        }
                        break;
                    case this._config.resetSelection.location:
                        // select to start of document
                        if (this.textInputClient && this.textInputClient.moveToBeginningOfDocumentAndModifySelection){
                            this.textInputClient.moveToBeginningOfDocumentAndModifySelection();
                        }
                        break;
                    default:
                        logger.warn("Unexpected selection: %d,%d", this._selectedRange.location, this._selectedRange.length);
                        break;
                }
            // }else if (this._selectedRange.location == this._config.resetSelection.location - this._config.prevWord && this._selectedRange.length == this._config.prevWord + this._config.nextWord){
            //     // select current word (is this even possible with the keyboard?)
            //     logger.info("select current word");
            // }else if (this._selectedRange.location == this._config.resetSelection.location - this._config.starOfLine && this._selectedRange.length == this._config.starOfLine + this._config.endOfLine){
            //     // select current line (is this even possible with the keyboard?)
            //     logger.info("select current line");
            }else{
                logger.warn("Unexpected selection: %d,%d", this._selectedRange.location, this._selectedRange.length);
            }
        }
    },

    _dispatchActionForValueChange: function(){
        // We're assuming there's no possibility of a "replace" operation where some text is removed
        // and other text inserted all at once.  Since we don't allow a selection in the hidden
        // input, this should be a safe assumption
        var value = this.hiddenInputElement.value;
        var original = this._config.resetValue;
        var addedLength = value.length - original.length;
        if (addedLength > 0){
            var start = value.substr(0, this._config.resetSelection.location);
            var end = value.substr(this._config.resetSelection.location + addedLength);
            if (start + end == original){
                var text = value.substr(this._config.resetSelection.location, addedLength);
                if (this._isComposing){
                    logger.info("compose: %{public}", text);
                    // TODO: dispatch compose update action
                }else{
                    if (text == "\n" || text == "\r" || text == "\r\n"){
                        if (this.textInputClient && this.textInputClient.insertNewline){
                            this.textInputClient.insertNewline();
                        }
                    }else{
                        if (this.textInputClient && this.textInputClient.insertText){
                            this.textInputClient.insertText(text);
                        }
                    }
                }
            }else{
                logger.warn("Unexpected input:\n%{public}", value);
            }
        }else if (addedLength < 0){
            // something has been removed
            if (!this._isComposing){
                var test;
                var l = this._config.resetSelection.location;
                var half1 = original.substr(0, l);
                var half2 = original.substr(l);
                if (value == half1.substr(0, half1.length - this._config.prevChar) + half2){
                    if (this.textInputClient && this.textInputClient.deleteBackward){
                        this.textInputClient.deleteBackward();
                    }
                }else if (value == half1.substr(0, half1.length - this._config.prevWord) + half2){
                    if (this.textInputClient && this.textInputClient.deleteWordBackward){
                        this.textInputClient.deleteWordBackward();
                    }
                }else if (value == half1.substr(0, half1.length - this._config.starOfLine) + half2){
                    if (this.textInputClient && this.textInputClient.deleteToBeginningOfLine){
                        this.textInputClient.deleteToBeginningOfLine();
                    }
                }else if (value == half2){
                    if (this.textInputClient && this.textInputClient.deleteToBeginningOfDocument){
                        this.textInputClient.deleteToBeginningOfDocument();
                    }
                }else if (value == half1 + half2.substr(this._config.nextChar)){
                    if (this.textInputClient && this.textInputClient.deleteForward){
                        this.textInputClient.deleteForward();
                    }
                }else if (value == half1 + half2.substr(this._config.nextWord)){
                    if (this.textInputClient && this.textInputClient.deleteWordForward){
                        this.textInputClient.deleteWordForward();
                    }
                }else if (value == half1 + half2.substr(this._config.endOfLine)){
                    if (this.textInputClient && this.textInputClient.deleteToEndOfLine){
                        this.textInputClient.deleteToEndOfLine();
                    }
                }else if (value == half1){
                    if (this.textInputClient && this.textInputClient.deleteToEndOfDocument){
                        this.textInputClient.deleteToEndOfDocument();
                    }
                }else if (value === ""){
                    if (this.textInputClient && this.textInputClient.deleteAll){
                        this.textInputClient.deleteAll();
                    }
                }else{
                    logger.warn("Unexpected delete:\n%{public}", value);
                }
            }else{
                logger.warn("Unexpected delete during composition:\n%{public}", value);
            }
        }
    }

});

UIHTMLTextInputManager._HiddenConfig = {
    resetValue: 'abcd efgh ijkl\nmnop q  t uvwx\nyzAB CDEF GHIJ',
    resetSelection: JSRange(22, 0),
    prevChar: 1,
    nextChar: 1,
    prevWord: 2,
    nextWord: 2,
    starOfLine: 7,
    endOfLine: 7,
    prevLine: 15,
    nextLine: 15
};

})();