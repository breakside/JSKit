// #import "Foundation/Foundation.js"
// #import "UIKit/UILayer.js"
/* global JSClass, JSObject, JSRange, UITextEditor, JSRect, JSColor, UILayer, JSTimer */
'use strict';

JSClass("UITextEditor", JSObject, {

    textLayer: null,
    selections: null,
    delegate: null,
    _cursorBlinkRate: 0.5,
    _cursorOffTimeout: null,
    _cursorOnTimeout: null,
    _handledSelectOnMouseDown: false,

    initWithTextLayer: function(textLayer){
        this.textLayer = textLayer;
        this.selections = [
            UITextEditorSelection(JSRange(0, 0), 0)
        ];
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
        var index = this.textLayer.characterIndexAtPoint(location);
        var isInSelection = false;
        var selection;
        // Should we hit test selection rects intead of check index?
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
        var characterRect;
        var selection;
        var cursorRect;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            characterRect = this.textLayer.rectForCharacterAtIndex(selection.range.location + selection.insertionIndex);
            cursorRect = JSRect(
                characterRect.origin.x,
                characterRect.origin.y,
                1.0,
                characterRect.size.height
            );
            selection.cursorLayer.frame = cursorRect;
        }
        this._cancelCursorTimers();
        this._cursorOn();
        if (this.delegate && this.delegate.textEditorDidPositionCursors){
            this.delegate.textEditorDidPositionCursors();
        }
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
        var selection = UITextEditorSelection(JSRange(index, 0), 0);
        this._setSingleSelection(selection);
    },

    _setSingleSelection: function(selection){
        for (var i = 0, l = this.selections.length; i < l; ++i){
            this._removeSelectionFromLayer(this.selections[i]);
        }
        this.selections = [selection];
        this.textLayer.addSublayer(this.selections[0].cursorLayer);
        this.layout();
    },

    _deleteRanges: function(ranges){
        var i, l;
        // Collapse overlapping or adjacent ranges
        for (i = ranges.length - 1; i > 0; --i){
            if (ranges[i - 1].end >= ranges[i].location){
                ranges[i - 1].length = ranges[i].end - ranges[i - 1].location;
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
                this.selections.push(UITextEditorSelection(JSRange(0, 0)));
            }
            this.selections[i].range = JSRange(adjustedRange.location, 0);
            this.selections[i].insertionIndex = 0;
        }
        for (var j = this.selections.length - i; j >= i; --j){
            this._removeSelectionFromLayer(this.selections[j]);
            this.this.selections.splice(j, 1);
        }
        this._collapseOverlappingSelections();
    },

    _collapseOverlappingSelections: function(){
        for (var i = this.selections.length - 1; i > 0; --i){
            if (this.selections[i - 1].end >= this.selections[i].location){
                this.selections[i - 1].length = this.selections[i].end - this.selections[i - 1].location;
                this.selections.splice(i, 1);
            }
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
            selection.insertionIndex = 0;
            locationAdjustment += textLength - adjustedRange.length;
        }
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

    deleteBackward: function(){
        var textStorage = this.textLayer.attributedText;
        var selection;
        var perceivedCharacterRange;
        var ranges = [];
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            if (selection.range.length === 0){
                if (selection.range.location > 0){
                    perceivedCharacterRange = textStorage.string.rangeForUserPerceivedCharacterAtIndex(selection.range.location - 1);
                    ranges.push(perceivedCharacterRange);
                }else{
                    ranges.push(JSRange(selection.range));
                }
            }else{
                ranges.push(JSRange(selection.range));
            }
        }
        this._deleteRanges(ranges);
    },

    deleteSelections: function(){
        var textStorage = this.textLayer.attributedText;
        var selection;
        var ranges = [];
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            if (selection.range.length > 0){
                ranges.push(JSRange(selection.range));
            }
        }
        this._deleteRanges(ranges);
    },

    deleteWordBackward: function(){
        var textStorage = this.textLayer.attributedText;
        var selection;
        var wordRange;
        var indexOfPreviousWord;
        var ranges = [];
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            if (selection.range.length === 0){
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
            }else{
                ranges.push(JSRange(selection.range));
            }
        }
        this._deleteRanges(ranges);
    },

    deleteToBeginningOfLine: function(){
        var textStorage = this.textLayer.attributedText;
        var ranges = [];
        var selection;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            if (selection.range.length === 0){
                if (selection.range.location > 0){
                    // TODO: get range to beginning of line
                }else{
                    ranges.push(JSRange(selection.range));
                }
            }else{
                ranges.push(JSRange(selection.range));
            }
        }
        this._deleteRanges(ranges);
    },

    deleteToBeginningOfDocument: function(){
        var textStorage = this.textLayer.attributedText;
        var ranges = [];
        var selection;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            if (selection.range.length === 0){
                if (selection.range.location > 0){
                    ranges.push(JSRange(0, selection.location));
                }else{
                    ranges.push(JSRange(selection.range));
                }
            }else{
                ranges.push(JSRange(selection.range));
            }
        }
        this._deleteRanges(ranges);
    },

    deleteForward: function(){
        var textStorage = this.textLayer.attributedText;
        var selection;
        var perceivedCharacterRange;
        var ranges = [];
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            if (selection.range.length === 0){
                if (selection.range.location < textStorage.string.length){
                    perceivedCharacterRange = textStorage.string.rangeForUserPerceivedCharacterAtIndex(selection.range.location);
                    ranges.push(perceivedCharacterRange);
                }else{
                    ranges.push(JSRange(selection.range));
                }
            }else{
                ranges.push(JSRange(selection.range));
            }
        }
        this._deleteRanges(ranges);
    },

    deleteWordForward: function(){
        var textStorage = this.textLayer.attributedText;
        var selection;
        var wordRange;
        var nextWordIndex;
        var adjustedIndex;
        var ranges = [];
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            if (selection.range.length === 0){
                if (selection.range.location < textStorage.string.length){
                    adjustedIndex = selection.range.location;
                    if (adjustedIndex > 0){
                        adjustedIndex -= 1;
                    }
                    wordRange = textStorage.string.rangeForWordAtIndex(adjustedIndex);
                    if (wordRange.end == selection.range.end){
                        nextWordIndex = textStorage.string.indexOfNextWordFromIndex(selection.range.location);
                        wordRange = textStorage.string.rangeForWordAtIndex(nextWordIndex);
                    }
                    ranges.push(JSRange(selection.range.location, wordRange.end - selection.range.location));
                }else{
                    ranges.push(JSRange(selection.range));
                }
            }else{
                ranges.push(JSRange(selection.range));
            }
        }
        this._deleteRanges(ranges);
    },

    deleteToEndOfLine: function(){
        var textStorage = this.textLayer.attributedText;
        var ranges = [];
        var selection;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            if (selection.range.length === 0){
                if (selection.range.location < textStorage.string.length){
                    // TODO: get range to end of line
                }else{
                    ranges.push(JSRange(selection.range));
                }
            }else{
                ranges.push(JSRange(selection.range));
            }
        }
        this._deleteRanges(ranges);
    },

    deleteToEndOfDocument: function(){
        var textStorage = this.textLayer.attributedText;
        var ranges = [];
        var selection;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            if (selection.range.length === 0){
                if (selection.range.location < textStorage.string.length){
                    ranges.push(JSRange(selection.location, textStorage.string.length - selection.location));
                }else{
                    ranges.push(JSRange(selection.range));
                }
            }else{
                ranges.push(JSRange(selection.range));
            }
        }
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
            if (selection.range.length === 0){
                if (selection.range.location > 0){
                    wordRange = textStorage.string.rangeForWordAtIndex(selection.range.location);
                    if (wordRange.location == selection.range.location){
                        indexOfPreviousWord = textStorage.string.indexOfPreviousWordFromIndex(selection.range.location);
                        selection.range = JSRange(indexOfPreviousWord, 0);
                    }else{
                        selection.range = JSRange(wordRange.location, 0);
                    }
                }
            }else{
                selection.range = JSRange(selection.range.location, 0);
            }
        }
        this._collapseOverlappingSelections();
        this.layout();
        this._cursorOn();
    },

    moveToBeginningOfLine: function(){
    },

    moveUp: function(){
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
            if (selection.range.length === 0){
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
                    selection.range = JSRange(wordRange.end, 0);
                }
            }else{
                selection.range = JSRange(selection.range.end, 0);
            }
        }
        this._collapseOverlappingSelections();
        this.layout();
        this._cursorOn();
    },

    moveToEndOfLine: function(){
        // TODO:
    },

    moveDown: function(){
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
        }
        this._collapseOverlappingSelections();
        this.layout();
        this._cursorOn();
    },

    moveWordBackwardAndModifySelection: function(){
    },

    moveToBeginningOfLineAndModifySelection: function(){
    },

    moveUpAndModifySelection: function(){
    },

    moveToBeginningOfDocumentAndModifySelection: function(){
    },

    moveForwardAndModifySelection: function(){
        var textStorage = this.textLayer.attributedText;
        var selection;
        var perceivedCharacterRange;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            if (selection.range.end < textStorage.string.length - 1){
                perceivedCharacterRange = textStorage.string.rangeForUserPerceivedCharacterAtIndex(selection.range.end);
                selection.range = JSRange(selection.range.location, perceivedCharacterRange.length + selection.range.length);
                selection.insertionIndex = selection.range.length;
            }
        }
        this._collapseOverlappingSelections();
        this.layout();
        this._cursorOn();
    },

    moveWordForwardAndModifySelection: function(){
    },

    moveToEndOfLineAndModifySelection: function(){
    },

    moveDownAndModifySelection: function(){
    },

    moveToEndOfDocumentAndModifySelection: function(){
    },

    selectAll: function(){
        var textStorage = this.textLayer.attributedText;
        var range = JSRange(0, textStorage.string.length);
        var selection = UITextEditorSelection(range, range.length);
        this._setSingleSelection(selection);
    }

});

var UITextEditorSelection = function(range, insertionIndex){
    if (this === undefined){
        if (range === null){
            return null;
        }
        return new UITextEditorSelection(range, insertionIndex);
    }else{
        if (range instanceof UITextEditorSelection){
            this.range = JSRange(range.range);
            this.insertionIndex = range.insertionIndex;
        }else{
            this.range = JSRange(range);
            this.insertionIndex = insertionIndex;
        }
        this.cursorLayer = UILayer.init();
        this.cursorLayer.backgroundColor = JSColor.initWithRGBA(0, 128/255.0, 255/255.0, 1.0);
    }
};

UITextEditorSelection.prototype = {

    range: null,
    insertionIndex: null,
    cursorLayer: null,
    selectionLayers: null,

    containsIndex: function(index){
        return this.range.length > 0 && this.range.contains(index);
    }

};