// #import "UIKit/UITextInputManager.js"
/* global JSClass, UITextInputManager, JSLog, JSRange, UIHTMLTextInputManager */
'use strict';

JSClass('UIHTMLTextInputManager', UITextInputManager, {

    // The role of a UITextInputManager is to provide a responder with information
    // regarding text input based on system events.  Generally in HTML this isn't an issue
    // at all because you just use an <input>, <textarea>, or <div contenteditable="true">
    // and the browser basically handles everything for you.
    //
    // These options, however, are woefully insufficient for meeting our goals.  One example
    // is a desire to have limited rich text, like only allowing bold, italic and underline.
    // The only way to do it with the existing options is to use contenteditable, but then we
    // get fully rich text that's very hard to limit because the browsers can provide input/format
    // mechanisms that we don't control (like Edit > Insert List).  It also means we have to do a lot
    // of html parsing to figure out what happened after an edit, and work backward to our JSAttributedString.
    // Another example is the desire to have concurrent editing with multiple cursors and selections, which
    // is much easier to manage if we don't deal at all with HTML's concept of a single selection.
    //
    // So, we'll avoid using those options and simply use non editable HTML elements to represent our
    // text.  Then we'll show our own cursors and selections and it'll look just like an editable element
    // to users.  This also has the major advantage of not tying our views to any special HTML rendering,
    // so the same code that renders in HTML can be used in non-HTML environments easily, provided that
    // environment has its own version of UITextInputManager.
    //
    // But then how can we handle editing events?  That's what the UITextInputManager is for, and this
    // specialized subclass will be the single point for handling input-related HTML events, parsing them,
    // and dispatching calls to whatever view is the first responder.
    //
    // A simple approach would be to look at keydown events and figure out what character the user typed.
    // This quickly becomes problematic because OSes today provide many methods of input, some via software
    // that generate no keydown events for us (e.g., Edit > Special Characters and Emojis, Dictation).
    //
    // So we'll use a trick: a single hidden textarea that is focused and receives input in the traditional
    // HTML sense.  It will contain a special string value that we'll inspect on each input event,
    // figure out what changed, and finally reset to the known special state.  For inserting text, we could
    // just start with an empty textarea and be find.  But the special string value is most useful in
    // other situations when figuring out what has been deleted or how the cursor has moved.  Since we aren't
    // interpreting the keystrokes ourself, and instead are watching what happens in a real textarea, we'll
    // automatically respect any keyboard shortcuts on given system.
    //
    // The special string is:
    // abcd efgh ijkl
    // mnop qrst uvwx
    // yzAB CDEF GHIJ
    //
    // And the cursor is always placed between the r and the s, right in the middle.  Using four letters,
    // qsrt, allows us to tell the difference between a single character move/delete and a word boundardy
    // move/delete.  Having three words on the line allows us to tell the difference between a word boundary
    // move/delete and a line boundary move/delete.  Having three lines allows us to catch up/down moves.

    // TODO: have the hidden input follow the real cursor, so things like emoji and dictation
    //       windows popup in the right place
    // TODO: see newer key/input events could help out and be more accurate
    // TODO: handle tab (and maybe enter) keypresses
    // TODO: figure out comminucation protocol between this and the responder
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

    windowServer: null,
    domWindow: null,
    rootElement: null,
    hiddenInputElement: null,
    _isComposing: false,
    _selectedRange: JSRange(0, 0),
    _config: null,
    _rangeUpdateScheduled: false,
    _responder: null,

    initWithRootElement: function(rootElement){
        this.rootElement = rootElement;
        this.domWindow = this.rootElement.ownerDocument.defaultView;
        this.hiddenInputElement = rootElement.ownerDocument.createElement('textarea');
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
        var responder = window.firstResponder;
        if (responder){
            this._config = UIHTMLTextInputManager._HiddenConfig;
            this.hiddenInputElement.focus();
            // FIXME: what if _isComposing is true?  The old responder needs to be told to stop
            this._reset();
        }else{
            this.hiddenInputElement.blur();
        }
        this._responder = responder;
    },

    handleEvent: function(e){
        this[e.type](e);
    },

    focus: function(e){
        if (e.currentTarget === this.domWindow){
            // JSLog("window focus");
        }else if (e.currentTarget === this.hiddenInputElement){
            // JSLog("input focus");
        }
        e.stopPropagation();
    },

    blur: function(e){
        if (e.currentTarget === this.domWindow){
            // JSLog("window blur");
        }else if (e.currentTarget === this.hiddenInputElement){
            // JSLog("input blur");
        }
        e.stopPropagation();
    },

    select: function(e){
        this._scheduleRangeUpdate();
    },

    keydown: function(e){
        if (this._selectedRange.length > 0){
            if (!this._isComposing){
                JSLog("keydown received while input has selection");
                this._reset();
            }
        }
        e.stopPropagation();
        // We have to capture tab specially or else the browser will
        // unfocus the textarea
        if (e.keyCode == 0x09){  // TAB
            e.preventDefault();
            // TODO: dispatch tab action
            if (e.shiftKey){
            }else{
            }
        }
        // We have to capture undo/redo specially because the browser's
        // sense of text edits is completely wrong and will be very
        // confusing to the user.  Longer term, we'll use our own undo
        // stack and repond to these presses.
        // These checks could be more specific to platform, but I don't see a problem
        // catching combinations like Ctrl+Z on a Mac.
        if (e.keyCode == 0x5A){ // z
            // Ctrl+Z is Undo on Windows
            // Cmd+Z is Undo on Mac
            if (e.ctrlKey || e.metaKey){
                e.preventDefault();
            }
        }
        if (e.keyCode == 0x59){ // y
            // Ctrl+Y is Redo on Windows
            if (e.ctrlKey){
                e.preventDefault();
            }
        }
        this.windowServer.keydown(e);
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
            JSLog("calling _reset with _isComposing = true");
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
                    JSLog("start of document");
                    // start of document
                    break;
                case this._config.resetSelection.location - this._config.prevLine:
                    JSLog("previous line");
                    // previous line
                    break;
                case this._config.resetSelection.location - this._config.starOfLine:
                    JSLog("start of line");
                    // start of line
                    break;
                case this._config.resetSelection.location - this._config.prevWord:
                    JSLog("back 1 word");
                    // back 1 word
                    break;
                case this._config.resetSelection.location - this._config.prevChar:
                    JSLog("back 1 char");
                    // back 1 char
                    break;
                case this._config.resetSelection.location + this._config.nextChar:
                    JSLog("forward 1 char");
                    // forward 1 char
                    break;
                case this._config.resetSelection.location + this._config.nextWord:
                    JSLog("forward 1 word");
                    // forward 1 word
                    break;
                case this._config.resetSelection.location + this._config.endOfLine:
                    JSLog("end of line");
                    // end of line
                    break;
                case this._config.resetSelection.location + this._config.nextLine:
                    JSLog("next line");
                    // next line
                    break;
                case this._config.resetValue.length:
                    JSLog("end of document");
                    // end of document
                    break;
                default:
                    JSLog("Unexpected selection point: %d".sprintf(this._selectedRange.location));
                    break;
            }
        }else{
            // If the selection has a range, we're selecting something rather than moving
            if (this._selectedRange.location === 0 && this._selectedRange.length == this._config.resetValue.length){
                // select all
                JSLog("select all");
            }else if (this._selectedRange.location == this._config.resetSelection.location){
                // forward selection
                switch (this._selectedRange.length){
                    case this._config.nextChar:
                        // select next char
                        JSLog("select next char");
                        break;
                    case this._config.nextWord:
                        // select to end of word
                        JSLog("select to end of word");
                        break;
                    case this._config.endOfLine:
                        // select to end of line
                        JSLog("select to end of line");
                        break;
                    case this._config.nextLine:
                        // select to next line
                        JSLog("select to next line");
                        break;
                    case this._config.resetValue.length - this._config.resetSelection.location:
                        // select to end of document
                        JSLog("select to end of document");
                        break;
                    default:
                        JSLog("Unexpected selection: %d,%d".sprintf(this._selectedRange.location, this._selectedRange.length));
                        break;
                }
            }else if (this._selectedRange.end == this._config.resetSelection.location){
                // backward selection
                switch (this._selectedRange.length){
                    case this._config.prevChar:
                        // select prev char
                        JSLog("select prev char");
                        break;
                    case this._config.prevWord:
                        // select to start of word
                        JSLog("select to start of word");
                        break;
                    case this._config.starOfLine:
                        // select to start of line
                        JSLog("select to start of line");
                        break;
                    case this._config.prevLine:
                        // select to previous line
                        JSLog("select to previous line");
                        break;
                    case this._config.resetSelection.location:
                        // select to start of document
                        JSLog("select to start of document");
                        break;
                    default:
                        JSLog("Unexpected selection: %d,%d".sprintf(this._selectedRange.location, this._selectedRange.length));
                        break;
                }
            }else if (this._selectedRange.location == this._config.resetSelection.location - this._config.prevWord && this._selectedRange.length == this._config.prevWord + this._config.nextWord){
                // select current word (is this even possible with the keyboard?)
                JSLog("select current word");
            }else if (this._selectedRange.location == this._config.resetSelection.location - this._config.starOfLine && this._selectedRange.length == this._config.starOfLine + this._config.endOfLine){
                // select current line (is this even possible with the keyboard?)
                JSLog("select current line");
            }else{
                JSLog("Unexpected selection: %d,%d".sprintf(this._selectedRange.location, this._selectedRange.length));
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
                    JSLog("compose: %s".sprintf(text));
                    // TODO: dispatch compose update action
                }else{
                    JSLog("input: %s".sprintf(text));
                    // TODO: dispatch text action
                }
            }else{
                JSLog("Unexpected input:\n%s".sprintf(value));
            }
        }else if (addedLength < 0){
            // something has been removed
            if (!this._isComposing){
                var test;
                var l = this._config.resetSelection.location;
                var half1 = original.substr(0, l);
                var half2 = original.substr(l);
                if (value == half1.substr(0, half1.length - this._config.prevChar) + half2){
                    JSLog("delete back char");
                }else if (value == half1.substr(0, half1.length - this._config.prevWord) + half2){
                    JSLog("delete to start of word");
                }else if (value == half1.substr(0, half1.length - this._config.starOfLine) + half2){
                    JSLog("delete to start of line");
                }else if (value == half1.substr(0, half1.length - this._config.prevLine) + half2){
                    JSLog("delete prev line");
                }else if (value == half2){
                    JSLog("delete to start of document");
                }else if (value == half1 + half2.substr(this._config.nextChar)){
                    JSLog("delete forward char");
                }else if (value == half1 + half2.substr(this._config.nextWord)){
                    JSLog("delete to end of word");
                }else if (value == half1 + half2.substr(this._config.endOfLine)){
                    JSLog("delete to end of line");
                }else if (value == half1 + half2.substr(this._config.nextLine)){
                    JSLog("delete next line");
                }else if (value == half1){
                    JSLog("delete to end of document");
                }else if (value === ""){
                    JSLog("delete all");
                }else if (value == half1.substr(0, half1.length - this._config.starOfLine) + half2.substr(this._config.endOfLine)){
                    JSLog("delete line");
                }else{
                    JSLog("Unexpected delete:\n%s".sprintf(value));
                }
            }else{
                JSLog("Unexpected delete during composition:\n%s".sprintf(value));
            }
        }
    }

});

UIHTMLTextInputManager._HiddenConfig = {
    resetValue: 'abcd efgh ijkl\nmnop qrst uvwx\nyzAB CDEF GHIJ',
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
