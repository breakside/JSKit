// #import "Foundation/Foundation.js"
// #import "UIKit/UILayer.js"
/* global JSClass, JSDynamicProperty, JSObject, JSRange, UITextEditor, JSRect, JSPoint, JSColor, UILayer, JSTimer */
'use strict';

(function(){

JSClass("UITextEditor", JSObject, {

    textLayer: null,
    selections: null,
    delegate: null,
    _isFirstResponder: false,
    _cursorBlinkRate: 0.5,
    _cursorOffTimeout: null,
    _cursorOnTimeout: null,
    _handledSelectOnMouseDown: false,
    cursorColor: JSDynamicProperty('_cursorColor', null),

    initWithTextLayer: function(textLayer){
        this.textLayer = textLayer;
        this._cursorColor = JSColor.initWithRGBA(0, 128/255.0, 255/255.0, 1.0);
        this.selections = [
            this._createSelection(JSRange(0, 0), 0)
        ];
    },

    setCursorColor: function(cursorColor){
        this._cursorColor = cursorColor;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            this.selections.cursorLayer.backgroundColor = this._cursorColor;
        }
    },

    hasSelectionRange: function(){
        for (var i = 0, l = this.selections.length; i < l; ++i){
            if (this.selections[i].range.length > 0){
                return true;
            }
        }
        return false;
    },

    setSelectionRange: function(range, insertionPoint, affinity){
        if (range === undefined || range === null){
            range = JSRange.Zero;
        }else{
            range = this._sanitizedRange(range);
        }
        this.setSelectionRanges([range], insertionPoint, affinity);
    },

    setSelectionRanges: function(selectionRanges, insertionPoint, affinity){
        if (selectionRanges === null || selectionRanges === undefined || selectionRanges.length === 0){
            selectionRanges = [JSRange.Zero];
        }
        var selections = [];
        selectionRanges.sort(function(a, b){
            return a.location - b.location;
        });
        var range;
        for (var i = 0, l = selectionRanges.length; i < l; ++i){
            range = this._sanitizedRange(selectionRanges[i]);
            selections.push(this._createSelection(range, insertionPoint, affinity));
        }
        this._setSelections(selections);
    },

    _sanitizedRange: function(range){
        return JSRange(0, this.textLayer.attributedText.string.length).intersection(range);
    },

    layout: function(){
        this._positionCursors();
    },

    handleMouseDownAtLocation: function(location){
        // When mousing down, we behave differently depending on if the location is
        // in an existing selection or outside of every selection.
        // 1. Inside a selection means we may start dragging the selection, so don't update anything yet
        // 2. Outside a selection means we should immediately create a single selection point at the location
        //    and be ready for any subsequent drag to extend the new selection
        //
        // TODO: double and triple mouse downs to select word and line, respectively
        var index = this.textLayer.characterIndexAtPoint(location);
        var isInSelection = false;
        var selection;
        // FIXME: Should we hit test selection rects intead of check index? (yes)
        // Optimization: we really only care about selections that are visible
        // Optimization: could binary search through selections
        for (var i = 0, l = this.selections.length; i < l && !isInSelection; ++i){
            selection = this.selections[i];
            isInSelection = selection.containsIndex(index);
        }
        if (isInSelection){
            // Wait for drag
            this._handledSelectOnMouseDown = false;
        }else{
            this._handledSelectOnMouseDown = true;
            this._setSingleSelectionAtIndex(index);
            // TODO: if index is a wrapped line boundary and the click was at the end of the previous
            // line, set the selection affinity accordingly
        }
    },

    handleMouseDraggedAtLocation: function(location){
        if (this._handledSelectOnMouseDown){
            var index = this.textLayer.characterIndexAtPoint(location);
            // We should only have one selection, based on the logic that sets _handledSelectOnMouseDown
            // in handleMouseDownAtLocation
            var selection = this.selections[0];
            var length = index - selection.range.location;
            if (length < 0){
                selection.range = JSRange(index, -length);
            }else{
                selection.range = JSRange(selection.range.location, length);
            }
        }
    },

    handleMouseUpAtLocation: function(location){
        var index = this.textLayer.characterIndexAtPoint(location);
        // TODO: not if we've dragged (need to work out drag events, may not even send mouseUp)
        if (!this._handledSelectOnMouseDown){
            this._setSingleSelectionAtIndex(index);
        }
    },

    didBecomeFirstResponder: function(){
        this._isFirstResponder = true;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            this.textLayer.addSublayer(this.selections[i].cursorLayer);
        }
        this._positionCursors();
    },

    didResignFirstResponder: function(){
        this._cancelCursorTimers();
        for (var i = 0, l = this.selections.length; i < l; ++i){
            this.selections[i].cursorLayer.removeFromSuperlayer();
        }
        this._isFirstResponder = false;
    },

    insertionRect: function(){
        if (this.selections.length === 0){
            return JSRect.Zero;
        }
        return this.selections[this.selections.length - 1].cursorLayer.frame;
    },

    // -------------------------------------------------------------------------
    // MARK: - Cursor blinking

    _cancelCursorTimers: function(){
        if (this._cursorOffTimeout !== null){
            this._cursorOffTimeout.invalidate();
            this._cursorOffTimeout = null;
        }
        if (this._cursorOnTimeout !== null){
            this._cursorOnTimeout.invalidate();
            this._cursorOnTimeout = null;
        }
    },

    _positionCursors: function(){
        var selection;
        var cursorRect;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            cursorRect = this._cursorRectForSelection(selection);
            selection.cursorLayer.frame = cursorRect;
        }
        this._cursorOn();
        if (this.delegate && this.delegate.textEditorDidPositionCursors){
            this.delegate.textEditorDidPositionCursors();
        }
    },

    _cursorRectForSelection: function(selection){
        var characterRect;
        if (selection.affinity === UITextEditor.SelectionAffinity.afterPreviousCharacter && selection.insertionLocation > 0){
            characterRect = this.textLayer.rectForCharacterAtIndex(selection.insertionLocation - 1);
            return JSRect(
                characterRect.origin.x + characterRect.size.width,
                characterRect.origin.y,
                1.0,
                characterRect.size.height
            );
        }
        characterRect = this.textLayer.rectForCharacterAtIndex(selection.insertionLocation);
        return JSRect(
            characterRect.origin.x,
            characterRect.origin.y,
            1.0,
            characterRect.size.height
        );
    },

    _cursorOff: function(){
        this._cancelCursorTimers();
        this._cursorOffTimeout = null;
        this._cursorOnTimeout = JSTimer.scheduledTimerWithInterval(this._cursorBlinkRate, this._cursorOn, this);
        var selection;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            selection.cursorLayer.alpha = 0.0;
        }
    },

    _cursorOn: function(){
        this._cancelCursorTimers();
        this._cursorOnTimeout = null;
        this._cursorOffTimeout = JSTimer.scheduledTimerWithInterval(this._cursorBlinkRate, this._cursorOff, this);
        var selection;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            selection.cursorLayer.alpha = 1.0;
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Common editing operations

    _removeSelectionFromLayer: function(selection){
        selection.cursorLayer.removeFromSuperlayer();
    },

    _setSingleSelectionAtIndex: function(index){
        var selection = this._createSelection(JSRange(index, 0), 0);
        this._setSingleSelection(selection);
    },

    _setSingleSelection: function(selection){
        this._setSelections([selection]);
    },

    _setSelections: function(selections){
        var i, l;
        for (i = 0, l = this.selections.length; i < l; ++i){
            this._removeSelectionFromLayer(this.selections[i]);
        }
        this.selections = selections;
        if (this._isFirstResponder){
            for (i = 0, l = this.selections.length; i < l; ++i){
                this.textLayer.addSublayer(this.selections[i].cursorLayer);
            }
        }
        this._collapseOverlappingSelections();
        this.layout();
    },

    _deleteRanges: function(ranges){
        var i, l;
        // Collapse overlapping or adjacent ranges
        for (i = ranges.length - 1; i > 0; --i){
            if (ranges[i - 1].end >= ranges[i].location){
                ranges[i - 1].length = Math.max(ranges[i].end, ranges[i - 1].end) - ranges[i - 1].location;
                ranges.splice(i, 1);
            }
        }
        var range;
        var adjustedRange;
        var locationAdjustment = 0;
        var textStorage = this.textLayer.attributedText;
        for (i = 0, l = ranges.length; i < l; ++i){
            range = ranges[i];
            adjustedRange = JSRange(range.location + locationAdjustment, range.length);
            if (adjustedRange.length > 0){
                textStorage.deleteCharactersInRange(adjustedRange);
            }
            locationAdjustment -= range.length;
            if (i == this.selections.length){
                this.selections.push(this._createSelection(JSRange(0, 0)));
            }
            this.selections[i].range = JSRange(adjustedRange.location, 0);
        }
        for (var j = this.selections.length - 1; j >= i; --j){
            this._removeSelectionFromLayer(this.selections[j]);
            this.selections.splice(j, 1);
        }
        this._collapseOverlappingSelections();
        this._resetSelectionAffinity();
    },

    _collapseOverlappingSelections: function(){
        for (var i = this.selections.length - 1; i > 0; --i){
            if (this.selections[i - 1].range.end >= this.selections[i].range.location){
                this.selections[i - 1].range.length = Math.max(this.selections[i].range.end, this.selections[i - 1].range.end) - this.selections[i - 1].range.location;
                this._removeSelectionFromLayer(this.selections[i]);
                this.selections.splice(i, 1);
            }
        }
    },

    _resetSelectionAffinity: function(){
        for (var i = 0, l = this.selections.length; i < l; ++i){
            this.selections[i].affinity = UITextEditor.SelectionAffinity.beforeCurrentCharacter;
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - UITextInput protocol

    insertText: function(text){
        var selection;
        var textStorage = this.textLayer.attributedText;
        var textLength = text.length;
        var locationAdjustment = 0;
        var adjustedRange;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            adjustedRange = JSRange(selection.range.location + locationAdjustment, selection.range.length);
            textStorage.replaceCharactersInRangeWithString(adjustedRange, text);
            selection.range = JSRange(adjustedRange.location + textLength, 0);
            locationAdjustment += textLength - adjustedRange.length;
        }
        this._resetSelectionAffinity();
    },

    insertNewline: function(){
        this.insertText("\n");
    },

    insertTab: function(){
        this.insertText("\t");
    },

    insertBacktab: function(){
        this.insertText("\t");
    },

    deleteSelections: function(){
        var textStorage = this.textLayer.attributedText;
        var selection;
        var ranges = [];
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            ranges.push(JSRange(selection.range));
        }
        this._deleteRanges(ranges);
    },

    deleteBackward: function(){
        if (this.hasSelectionRange()){
            this.deleteSelections();
            return;
        }
        var textStorage = this.textLayer.attributedText;
        var selection;
        var perceivedCharacterRange;
        var ranges = [];
        // we only get here if the selections all have 0 length
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            if (selection.range.location > 0){
                perceivedCharacterRange = textStorage.string.rangeForUserPerceivedCharacterAtIndex(selection.range.location - 1);
                ranges.push(perceivedCharacterRange);
            }else{
                ranges.push(JSRange(selection.range));
            }
        }
        this._deleteRanges(ranges);
    },

    deleteWordBackward: function(){
        if (this.hasSelectionRange()){
            this.deleteSelections();
            return;
        }
        var textStorage = this.textLayer.attributedText;
        var selection;
        var wordRange;
        var indexOfPreviousWord;
        var ranges = [];
        // we only get here if the selections all have 0 length
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            if (selection.range.location > 0){
                wordRange = textStorage.string.rangeForWordAtIndex(selection.range.location);
                if (wordRange.location == selection.range.location){
                    indexOfPreviousWord = textStorage.string.indexOfPreviousWordFromIndex(selection.range.location);
                    ranges.push(JSRange(indexOfPreviousWord, selection.range.location - indexOfPreviousWord));
                }else{
                    ranges.push(JSRange(wordRange.location, selection.range.location - wordRange.location));
                }
            }else{
                ranges.push(JSRange(selection.range));
            }
        }
        this._deleteRanges(ranges);
    },

    deleteToBeginningOfLine: function(){
        if (this.hasSelectionRange()){
            this.deleteSelections();
            return;
        }
        var textStorage = this.textLayer.attributedText;
        var ranges = [];
        var selection;
        var line;
        // we only get here if the selections all have 0 length
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            line = this._lineForSelectionStart(selection);
            if (line !== null && selection.range.location > line.range.location){
                ranges.push(JSRange(line.range.location, selection.range.location - line.range.location));
            }else{
                ranges.push(JSRange(selection.range));
            }
        }
        this._deleteRanges(ranges);
    },

    deleteToBeginningOfDocument: function(){
        if (this.hasSelectionRange()){
            this.deleteSelections();
            return;
        }
        // we only get here if the selections all have 0 length
        var textStorage = this.textLayer.attributedText;
        var ranges = [JSRange(0, this.selections[this.selections.length - 1].range.location)];
        this._deleteRanges(ranges);
    },

    deleteForward: function(){
        if (this.hasSelectionRange()){
            this.deleteSelections();
            return;
        }
        var textStorage = this.textLayer.attributedText;
        var selection;
        var perceivedCharacterRange;
        var ranges = [];
        // we only get here if the selections all have 0 length
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            if (selection.range.location < textStorage.string.length){
                perceivedCharacterRange = textStorage.string.rangeForUserPerceivedCharacterAtIndex(selection.range.location);
                ranges.push(perceivedCharacterRange);
            }else{
                ranges.push(JSRange(selection.range));
            }
        }
        this._deleteRanges(ranges);
    },

    deleteWordForward: function(){
        if (this.hasSelectionRange()){
            this.deleteSelections();
            return;
        }
        var textStorage = this.textLayer.attributedText;
        var selection;
        var wordRange;
        var nextWordIndex;
        var adjustedIndex;
        var ranges = [];
        // we only get here if the selections all have 0 length
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            if (selection.range.location < textStorage.string.length){
                adjustedIndex = selection.range.location;
                if (adjustedIndex > 0){
                    adjustedIndex -= 1;
                }
                wordRange = textStorage.string.rangeForWordAtIndex(adjustedIndex);
                if (wordRange.end == selection.range.location){
                    nextWordIndex = textStorage.string.indexOfNextWordFromIndex(selection.range.location);
                    wordRange = textStorage.string.rangeForWordAtIndex(nextWordIndex);
                }
                ranges.push(JSRange(selection.range.location, wordRange.end - selection.range.location));
            }else{
                ranges.push(JSRange(selection.range));
            }
        }
        this._deleteRanges(ranges);
    },

    deleteToEndOfLine: function(){
        if (this.hasSelectionRange()){
            this.deleteSelections();
            return;
        }
        var textStorage = this.textLayer.attributedText;
        var ranges = [];
        var selection;
        var line;
        // we only get here if the selections all have 0 length
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            line = this._lineForSelectionStart(selection);
            if (line !== null && selection.range.location < line.range.end){
                // Only delete up to a line break if one exists, but don't include the line break
                var iterator = textStorage.string.userPerceivedCharacterIterator(line.range.end - 1);
                if (iterator.isMandatoryLineBreak){
                    ranges.push(JSRange(selection.range.location, iterator.index - selection.range.location));
                }else{
                    ranges.push(JSRange(selection.range.location, line.range.end - selection.range.location));
                }
            }else{
                ranges.push(JSRange(selection.range));
            }
        }
        this._deleteRanges(ranges);
    },

    deleteToEndOfDocument: function(){
        if (this.hasSelectionRange()){
            this.deleteSelections();
            return;
        }
        // we only get here if the selections all have 0 length
        var textStorage = this.textLayer.attributedText;
        var location = this.selections[0].range.location;
        var ranges = [JSRange(location, textStorage.string.length - location)];
        this._deleteRanges(ranges);
    },
    
    moveBackward: function(){
        var textStorage = this.textLayer.attributedText;
        var selection;
        var perceivedCharacterRange;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            if (selection.range.length === 0){
                if (selection.range.location > 0){
                    perceivedCharacterRange = textStorage.string.rangeForUserPerceivedCharacterAtIndex(selection.range.location - 1);
                    selection.range = JSRange(perceivedCharacterRange.location, 0);
                }
            }else{
                selection.range = JSRange(selection.range.location, 0);
            }
        }
        this._collapseOverlappingSelections();
        this._resetSelectionAffinity();
        this.layout();
        this._cursorOn();
    },

    moveWordBackward: function(){
        var textStorage = this.textLayer.attributedText;
        var selection;
        var wordRange;
        var indexOfPreviousWord;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            if (selection.range.location > 0){
                wordRange = textStorage.string.rangeForWordAtIndex(selection.range.location);
                if (wordRange.location == selection.range.location){
                    indexOfPreviousWord = textStorage.string.indexOfPreviousWordFromIndex(selection.range.location);
                    selection.range = JSRange(indexOfPreviousWord, 0);
                }else{
                    selection.range = JSRange(wordRange.location, 0);
                }
            }
        }
        this._collapseOverlappingSelections();
        this._resetSelectionAffinity();
        this.layout();
        this._cursorOn();
    },

    moveToBeginningOfLine: function(){
        var textStorage = this.textLayer.attributedText;
        var selection;
        var line;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            line = this._lineForSelectionStart(selection);
            if (line !== null){
                selection.range = JSRange(line.range.location, 0);
            }
        }
        this._collapseOverlappingSelections();
        this._resetSelectionAffinity();
        this.layout();
        this._cursorOn();
    },

    moveUp: function(){
        var textStorage = this.textLayer.attributedText;
        var selection;
        var index;
        var pointOnPreviousLine;
        var line;
        var lineRect;
        var previousLine;
        var cursorRect;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            line = this._lineForSelectionStart(selection);
            previousLine = this.textLayer.lineBeforeLine(line);
            if (previousLine !== null){
                selection.insertionPoint = UITextEditor.SelectionInsertionPoint.start;
                cursorRect = this._cursorRectForSelection(selection);
                lineRect = this.textLayer.rectForLine(previousLine);
                pointOnPreviousLine = JSPoint(cursorRect.origin.x, lineRect.origin.y + lineRect.size.height / 2);
                index = this.textLayer.characterIndexAtPoint(pointOnPreviousLine);
                selection.range = JSRange(index, 0);
                if (selection.range.location === line.range.location && selection.range.location > 0){
                    var iterator = textStorage.string.userPerceivedCharacterIterator(selection.range.location - 1);
                    if (iterator.isMandatoryLineBreak){
                        selection.range = JSRange(iterator.index, 0);
                        selection.affinity = UITextEditor.SelectionAffinity.beforeCurrentCharacter;
                    }else{
                        selection.affinity = UITextEditor.SelectionAffinity.afterPreviousCharacter;
                    }
                }else{
                    selection.affinity = UITextEditor.SelectionAffinity.beforeCurrentCharacter;
                }
            }else{
                selection.range = JSRange.Zero;
                selection.affinity = UITextEditor.SelectionAffinity.beforeCurrentCharacter;
            }
        }
        this._collapseOverlappingSelections();
        this.layout();
        this._cursorOn();
    },

    moveToBeginningOfDocument: function(){
        this._setSingleSelectionAtIndex(0);
        this._cursorOn();
    },

    moveForward: function(){
        var textStorage = this.textLayer.attributedText;
        var selection;
        var perceivedCharacterRange;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            if (selection.range.length === 0){
                if (selection.range.location < textStorage.string.length){
                    perceivedCharacterRange = textStorage.string.rangeForUserPerceivedCharacterAtIndex(selection.range.location);
                    selection.range = JSRange(perceivedCharacterRange.end, 0);
                }
            }else{
                selection.range = JSRange(selection.range.end, 0);
            }
        }
        this._collapseOverlappingSelections();
        this._resetSelectionAffinity();
        this.layout();
        this._cursorOn();
    },

    moveWordForward: function(){
        var textStorage = this.textLayer.attributedText;
        var selection;
        var wordRange;
        var nextWordIndex;
        var adjustedIndex;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            if (selection.range.end < textStorage.string.length){
                adjustedIndex = selection.range.end;
                if (adjustedIndex > 0){
                    adjustedIndex -= 1;
                }
                wordRange = textStorage.string.rangeForWordAtIndex(adjustedIndex);
                if (wordRange.end == selection.range.end){
                    nextWordIndex = textStorage.string.indexOfNextWordFromIndex(selection.range.end);
                    wordRange = textStorage.string.rangeForWordAtIndex(nextWordIndex);
                }
                selection.range = JSRange(wordRange.end, 0);
            }
        }
        this._collapseOverlappingSelections();
        this._resetSelectionAffinity();
        this.layout();
        this._cursorOn();
    },

    moveToEndOfLine: function(){
        var textStorage = this.textLayer.attributedText;
        var selection;
        var line;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            line = this._lineForSelectionEnd(selection);
            if (line !== null && line.range.end > selection.range.location){
                var iterator = textStorage.string.userPerceivedCharacterIterator(line.range.end - 1);
                if (iterator.isMandatoryLineBreak){
                    selection.range = JSRange(iterator.index, 0);
                    selection.affinity = UITextEditor.SelectionAffinity.beforeCurrentCharacter;
                }else{
                    selection.range = JSRange(line.range.end, 0);
                    selection.affinity = UITextEditor.SelectionAffinity.afterPreviousCharacter;
                }
            }
        }
        this._collapseOverlappingSelections();
        this.layout();
        this._cursorOn();
    },

    moveDown: function(){
        var textStorage = this.textLayer.attributedText;
        var selection;
        var index;
        var pointOnNextLine;
        var line;
        var lineRect;
        var nextLine;
        var cursorRect;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            line = this._lineForSelectionStart(selection);
            nextLine = this.textLayer.lineAfterLine(line);
            if (nextLine !== null){
                selection.insertionPoint = UITextEditor.SelectionInsertionPoint.end;
                cursorRect = this._cursorRectForSelection(selection);
                lineRect = this.textLayer.rectForLine(nextLine);
                pointOnNextLine = JSPoint(cursorRect.origin.x, lineRect.origin.y + lineRect.size.height / 2);
                index = this.textLayer.characterIndexAtPoint(pointOnNextLine);
                selection.range = JSRange(index, 0);
                if (selection.range.location === nextLine.range.end && selection.range.location > 0){
                    var iterator = textStorage.string.userPerceivedCharacterIterator(selection.range.location - 1);
                    if (iterator.isMandatoryLineBreak){
                        selection.range = JSRange(iterator.index, 0);
                        selection.affinity = UITextEditor.SelectionAffinity.beforeCurrentCharacter;
                    }else{
                        selection.affinity = UITextEditor.SelectionAffinity.afterPreviousCharacter;
                    }
                }else{
                    selection.affinity = UITextEditor.SelectionAffinity.beforeCurrentCharacter;
                }
            }else{
                selection.range = JSRange(line.range.end, 0);
                selection.affinity = UITextEditor.SelectionAffinity.beforeCurrentCharacter;
            }
        }
        this._collapseOverlappingSelections();
        this.layout();
        this._cursorOn();
    },

    moveToEndOfDocument: function(){
        var textStorage = this.textLayer.attributedText;
        this._setSingleSelectionAtIndex(textStorage.string.length);
        this._cursorOn();
    },

    moveBackwardAndModifySelection: function(){
        var textStorage = this.textLayer.attributedText;
        var selection;
        var perceivedCharacterRange;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            if (selection.range.location > 0){
                perceivedCharacterRange = textStorage.string.rangeForUserPerceivedCharacterAtIndex(selection.range.location - 1);
                selection.range = JSRange(perceivedCharacterRange.location, perceivedCharacterRange.length + selection.range.length);
            }
            selection.insertionPoint = UITextEditor.SelectionInsertionPoint.start;
        }
        this._collapseOverlappingSelections();
        this._resetSelectionAffinity();
        this.layout();
        this._cursorOn();
    },

    moveWordBackwardAndModifySelection: function(){
        var textStorage = this.textLayer.attributedText;
        var selection;
        var wordRange;
        var indexOfPreviousWord;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            if (selection.range.location > 0){
                wordRange = textStorage.string.rangeForWordAtIndex(selection.range.location);
                if (wordRange.location == selection.range.location){
                    indexOfPreviousWord = textStorage.string.indexOfPreviousWordFromIndex(selection.range.location);
                    selection.range = JSRange(indexOfPreviousWord, selection.range.end - indexOfPreviousWord);
                }else{
                    selection.range = JSRange(wordRange.location, selection.range.end - wordRange.location);
                }
            }
            selection.insertionPoint = UITextEditor.SelectionInsertionPoint.start;
        }
        this._collapseOverlappingSelections();
        this._resetSelectionAffinity();
        this.layout();
        this._cursorOn();
    },

    moveToBeginningOfLineAndModifySelection: function(){
        var textStorage = this.textLayer.attributedText;
        var selection;
        var line;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            line = this._lineForSelectionStart(selection);
            if (line !== null){
                selection.range = JSRange(line.range.location, selection.range.end - line.range.location);
            }
            selection.insertionPoint = UITextEditor.SelectionInsertionPoint.start;
        }
        this._collapseOverlappingSelections();
        this._resetSelectionAffinity();
        this.layout();
        this._cursorOn();
    },

    moveUpAndModifySelection: function(){
        var textStorage = this.textLayer.attributedText;
        var selection;
        var index;
        var pointOnPreviousLine;
        var line;
        var lineRect;
        var previousLine;
        var cursorRect;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            line = this._lineForSelectionStart(selection);
            previousLine = this.textLayer.lineBeforeLine(line);
            selection.insertionPoint = UITextEditor.SelectionInsertionPoint.start;
            if (previousLine !== null){
                cursorRect = this._cursorRectForSelection(selection);
                lineRect = this.textLayer.rectForLine(previousLine);
                pointOnPreviousLine = JSPoint(cursorRect.origin.x, lineRect.origin.y + lineRect.size.height / 2);
                index = this.textLayer.characterIndexAtPoint(pointOnPreviousLine);
                selection.range = JSRange(index, selection.range.end - index);
                if (selection.range.location === line.range.location && selection.range.location > 0){
                    var iterator = textStorage.string.userPerceivedCharacterIterator(selection.range.location - 1);
                    if (iterator.isMandatoryLineBreak){
                        selection.range = JSRange(iterator.index, selection.range.length + index - iterator.index);
                        selection.affinity = UITextEditor.SelectionAffinity.beforeCurrentCharacter;
                    }else{
                        selection.affinity = UITextEditor.SelectionAffinity.afterPreviousCharacter;
                    }
                }else{
                    selection.affinity = UITextEditor.SelectionAffinity.beforeCurrentCharacter;
                }
            }else{
                selection.range = JSRange(0, selection.range.end);
                selection.affinity = UITextEditor.SelectionAffinity.beforeCurrentCharacter;
            }
        }
        this._collapseOverlappingSelections();
        this.layout();
        this._cursorOn();
    },

    moveToBeginningOfDocumentAndModifySelection: function(){
        var selection = this._createSelection(JSRange(0, this.selections[this.selections.length - 1].range.end), 0);
        this._setSingleSelection(selection);
        this.layout();
        this._cursorOn();
    },

    moveForwardAndModifySelection: function(){
        var textStorage = this.textLayer.attributedText;
        var selection;
        var perceivedCharacterRange;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            if (selection.range.end < textStorage.string.length){
                perceivedCharacterRange = textStorage.string.rangeForUserPerceivedCharacterAtIndex(selection.range.end);
                selection.range = JSRange(selection.range.location, perceivedCharacterRange.length + selection.range.length);
            }
            selection.insertionPoint = UITextEditor.SelectionInsertionPoint.end;
        }
        this._collapseOverlappingSelections();
        this._resetSelectionAffinity();
        this.layout();
        this._cursorOn();
    },

    moveWordForwardAndModifySelection: function(){
        var textStorage = this.textLayer.attributedText;
        var selection;
        var wordRange;
        var nextWordIndex;
        var adjustedIndex;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            if (selection.range.end < textStorage.string.length){
                adjustedIndex = selection.range.end;
                if (adjustedIndex > 0){
                    adjustedIndex -= 1;
                }
                wordRange = textStorage.string.rangeForWordAtIndex(adjustedIndex);
                if (wordRange.end == selection.range.end){
                    nextWordIndex = textStorage.string.indexOfNextWordFromIndex(selection.range.end);
                    wordRange = textStorage.string.rangeForWordAtIndex(nextWordIndex);
                }
                selection.range = JSRange(selection.range.location, wordRange.end - selection.range.location);
            }
            selection.insertionPoint = UITextEditor.SelectionInsertionPoint.end;
        }
        this._collapseOverlappingSelections();
        this._resetSelectionAffinity();
        this.layout();
        this._cursorOn();
    },

    moveToEndOfLineAndModifySelection: function(){
        var textStorage = this.textLayer.attributedText;
        var selection;
        var line;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            line = this._lineForSelectionEnd(selection);
            if (line !== null && line.range.end > selection.range.location){
                var iterator = textStorage.string.userPerceivedCharacterIterator(line.range.end - 1);
                if (iterator.isMandatoryLineBreak){
                    selection.range = JSRange(selection.range.location, iterator.index - selection.range.location);
                    selection.affinity = UITextEditor.SelectionAffinity.beforeCurrentCharacter;
                }else{
                    selection.range = JSRange(selection.range.location, line.range.end - selection.range.location);
                    selection.affinity = UITextEditor.SelectionAffinity.afterPreviousCharacter;
                }
            }
            selection.insertionPoint = UITextEditor.SelectionInsertionPoint.end;
        }
        this._collapseOverlappingSelections();
        this.layout();
        this._cursorOn();
    },

    moveDownAndModifySelection: function(){
        var textStorage = this.textLayer.attributedText;
        var selection;
        var index;
        var pointOnNextLine;
        var line;
        var lineRect;
        var nextLine;
        var cursorRect;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            line = this._lineForSelectionStart(selection);
            nextLine = this.textLayer.lineAfterLine(line);
            selection.insertionPoint = UITextEditor.SelectionInsertionPoint.end;
            if (nextLine !== null){
                cursorRect = this._cursorRectForSelection(selection);
                lineRect = this.textLayer.rectForLine(nextLine);
                pointOnNextLine = JSPoint(cursorRect.origin.x, lineRect.origin.y + lineRect.size.height / 2);
                index = this.textLayer.characterIndexAtPoint(pointOnNextLine);
                selection.range = JSRange(selection.range.location, index - selection.range.location);
                if (selection.range.end === nextLine.range.end && selection.range.end > 0){
                    var iterator = textStorage.string.userPerceivedCharacterIterator(selection.range.end - 1);
                    if (iterator.isMandatoryLineBreak){
                        selection.range = JSRange(selection.range.location, selection.range.length - index + iterator.index);
                        selection.affinity = UITextEditor.SelectionAffinity.beforeCurrentCharacter;
                    }else{
                        selection.affinity = UITextEditor.SelectionAffinity.afterPreviousCharacter;
                    }
                }else{
                    selection.affinity = UITextEditor.SelectionAffinity.beforeCurrentCharacter;
                }
            }else{
                selection.range = JSRange(selection.range.location, line.range.end - selection.range.location);
                selection.affinity = UITextEditor.SelectionAffinity.beforeCurrentCharacter;
            }
        }
        this._collapseOverlappingSelections();
        this.layout();
        this._cursorOn();
    },

    moveToEndOfDocumentAndModifySelection: function(){
        var textStorage = this.textLayer.attributedText;
        var location = this.selections[0].range.location;
        var range = JSRange(location, textStorage.string.length - location);
        var selection = this._createSelection(range, UITextEditor.SelectionInsertionPoint.end);
        this._setSingleSelection(selection);
        this.layout();
        this._cursorOn();
    },

    selectAll: function(){
        var textStorage = this.textLayer.attributedText;
        var range = JSRange(0, textStorage.string.length);
        var selection = this._createSelection(range, UITextEditor.SelectionInsertionPoint.end);
        this._setSingleSelection(selection);
    },

    _createSelection: function(range, insertionPoint, affinity){
        var selection = UITextEditorSelection(range, insertionPoint, affinity);
        selection.cursorLayer.backgroundColor = this._cursorColor;
        return selection;
    },

    _lineForSelectionStart: function(selection){
        if (selection.affinity === UITextEditor.SelectionAffinity.afterPreviousCharacter && selection.range.location > 0){
            return this.textLayer.lineContainingCharacterAtIndex(selection.range.location - 1);
        }
        return this.textLayer.lineContainingCharacterAtIndex(selection.range.location);
    },

    _lineForSelectionEnd: function(selection){
        if (selection.affinity === UITextEditor.SelectionAffinity.afterPreviousCharacter && selection.range.end > 0){
            return this.textLayer.lineContainingCharacterAtIndex(selection.range.end - 1);
        }
        return this.textLayer.lineContainingCharacterAtIndex(selection.range.end);
    }

});

UITextEditor.SelectionInsertionPoint = {
    start: 0,
    end: 1
};

UITextEditor.SelectionAffinity = {
    beforeCurrentCharacter: 0,
    afterPreviousCharacter: 1
};

var UITextEditorSelection = function(range, insertionPoint, affinity){
    if (this === undefined){
        if (range === null){
            return null;
        }
        return new UITextEditorSelection(range, insertionPoint, affinity);
    }else{
        if (range instanceof UITextEditorSelection){
            this.range = JSRange(range.range);
            this.insertionPoint = range.insertionPoint;
            this.affinity = range.affinity;
        }else{
            if (insertionPoint === undefined){
                insertionPoint = UITextEditor.SelectionInsertionPoint.end;
            }
            if (affinity === undefined){
                affinity = UITextEditor.SelectionAffinity.beforeCurrentCharacter;
            }
            this.range = JSRange(range);
            this.insertionPoint = insertionPoint;
            this.affinity = affinity;
        }
        this.cursorLayer = UILayer.init();
        this.selectionLayers = [];
    }
};

UITextEditorSelection.prototype = {

    range: null,
    insertionPoint: null,
    affinity: null,
    cursorLayer: null,
    selectionLayers: null,

    containsIndex: function(index){
        return this.range.length > 0 && this.range.contains(index);
    },

};

Object.defineProperties(UITextEditorSelection.prototype, {

    insertionLocation: {
        get: function UITextEditorSelection_getInsertionIndex(){
            var location = this.range.location;
            if (this.insertionPoint === UITextEditor.SelectionInsertionPoint.end){
                location += this.range.length;
            }
            return location;
        }
    }

});

})();