// #import "Foundation/Foundation.js"
// #import "UIKit/UILayer.js"
/* global JSClass, JSObject, JSRange, UITextEditor, JSRect, JSColor, UILayer, JSTimer */
'use strict';

JSClass("UITextEditor", JSObject, {

    textLayer: null,
    selections: null,
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
            // We should only have one selection
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
    },

    didResignFirstResponder: function(){
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

    _positionCursor: function(){
        var characterRect = this.textLayer.rectForCharacterAtIndex(this._cursorIndex);
        this._cursorLayer.position = characterRect.origin;
        this._cancelCursorTimers();
        this._cursorOn();
    },

    _cursorOff: function(){
        this._cursorOffTimeout = null;
        this._cursorOnTimeout = JSTimer.scheduledTimerWithInterval(this._cursorBlinkRate, this._cursorOn, this);
        this._cursorLayer.alpha = 0.0;
    },

    _cursorOn: function(){
        this._cursorOnTimeout = null;
        this._cursorOffTimeout = JSTimer.scheduledTimerWithInterval(this._cursorBlinkRate, this._cursorOff, this);
        this._cursorLayer.alpha = 1.0;
    },

    // -------------------------------------------------------------------------
    // MARK: - Common editing operations

    _setSingleSelectionAtIndex: function(index){
        // TODO: clear current selections
        // TODO: add single selection: UITextEditorSelection(JSRange(index, 0), 0);
    },

    _deleteRanges: function(ranges){
        // FIXME: reuse selections if available (instead of destroying & re-creating layers)
        // TODO: collapse overlapping ranges
        var range;
        var adjustedRange;
        var locationAdjustment = 0;
        var textStorage = this.textLayer.attributedText;
        // TODO: clear selections
        var selections = [];
        for (var i = 0, l = ranges.length; i < l; ++i){
            range = ranges[i];
            adjustedRange = JSRange(range.location + locationAdjustment, range.length);
            if (adjustedRange.length > 0){
                textStorage.deleteCharactersInRange(adjustedRange);
            }
            locationAdjustment -= range.length;
            selections.push(UITextEditorSelection(JSRange(adjustedRange.location, 0), 0));
        }
        // TODO: collapse overlapping selections
        // TODO: update this.selections to match selections
        // Watch out!  Can't query layer for new cursor positions until new layout is done
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
        // Watch out!  Can't query layer for new cursor positions until new layout is done
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
                    perceivedCharacterRange = textStorage.rangeForPerceivedCharacterAtIndex(selection.range.location - 1);
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

    deleteWordBackward: function(){
        var textStorage = this.textLayer.attributedText;
        var selection;
        var wordRange;
        var ranges = [];
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            if (selection.range.length === 0){
                if (selection.range.location > 0){
                    // TODO: figure out range to start of word
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
        var ranges = [];
        // TODO: populate ranges
        this._deleteRanges(ranges);
    },

    deleteToBeginningOfDocument: function(){
    },

    deleteForward: function(){
    },

    deleteWordForward: function(){
    },

    deleteToEndOfLine: function(){
    },

    deleteToEndOfDocument: function(){
    },
    
    moveBackward: function(){
        var textStorage = this.layer.attributedText;
        var selection;
        var perceivedCharacterRange;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            if (selection.range.length === 0){
                if (selection.range.location > 0){
                    perceivedCharacterRange = textStorage.rangeForPerceivedCharacterAtIndex(selection.range.location - 1);
                    selection.range = JSRange(perceivedCharacterRange.location, 0);
                }
            }else{
                selection.range = JSRange(selection.range.location, 0);
            }
        }
        // TODO: collapse overlapping selections
        // TODO: update cursors & selections
    },

    moveWordBackward: function(){
    },

    moveToBeginningOfLine: function(){
    },

    moveUp: function(){
    },

    moveToBeginningOfDocument: function(){
    },

    moveForward: function(){
    },

    moveWordForward: function(){
    },

    moveToEndOfLine: function(){
    },

    moveDown: function(){
    },

    moveToEndOfDocument: function(){
    },

    
    moveBackwardAndExtendSelection: function(){
        var textStorage = this.layer.attributedText;
        var selection;
        var perceivedCharacterRange;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            if (selection.range.location > 0){
                perceivedCharacterRange = textStorage.rangeForPerceivedCharacterAtIndex(selection.range.location - 1);
                selection.range = JSRange(perceivedCharacterRange.location, perceivedCharacterRange.length + selection.range.length);
            }
        }
        // TODO: collapse overlapping selections
        // TODO: update cursors & selections
    },

    moveWordBackwardAndExtendSelection: function(){
    },

    moveToBeginningOfLineAndExtendSelection: function(){
    },

    moveUpAndExtendSelection: function(){
    },

    moveToBeginningOfDocumentAndExtendSelection: function(){
    },

    moveForwardAndExtendSelection: function(){
        var textStorage = this.layer.attributedText;
        var selection;
        var perceivedCharacterRange;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            perceivedCharacterRange = textStorage.rangeForPerceivedCharacterAtIndex(selection.range.location);
            selection.range = JSRange(selection.range.location, perceivedCharacterRange.length + selection.range.length);
        }
        // TODO: collapse overlapping selections
        // TODO: update cursors & selections
    },

    moveWordForwardAndExtendSelection: function(){
    },

    moveToEndOfLineAndExtendSelection: function(){
    },

    moveDownAndExtendSelection: function(){
    },

    moveToEndOfDocumentAndExtendSelection: function(){
    },

    selectAll: function(){
        var textStorage = this.textLayer.attributedText;
        var selection = JSRange(0, textStorage.string.nativeString.length);
        // TODO: replace this.selections with selection
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
        this.cursorLayer.backroundColor = JSColor.blackColor();
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