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
// #import "UILayer.js"
// #import "UITextInput.js"
'use strict';

(function(){

JSClass("UITextEditor", JSObject, {

    layoutLayer: null,
    textLayoutManager: null,
    undoManager: null,
    selections: null,
    markedTextRanges: null,
    delegate: null,
    cursorColor: JSDynamicProperty('_cursorColor', null),
    cursorWidth: 2.0,
    insertAttributes: null,
    _isFirstResponder: false,
    _isWindowKey: false,
    _cursorBlinkRate: 0.5,
    _cursorOffTimeout: null,
    _cursorOnTimeout: null,
    _handledSelectOnMouseDown: false,
    _cursorLayers: null,
    _selectionHighlightLayers: null,
    _selectionHighlightColor: null,
    _draggingSelectionIndex: null,

    initWithTextLayer: function(textLayer){
        this.layoutLayer = textLayer;
        this.undoManager = JSUndoManager.init();
        this._cursorLayers = [];
        this._selectionHighlightLayers = [];
        this.textLayoutManager = textLayer.textLayoutManager;
        this.textLayoutManager.editor = this;
        this.cursorColor = JSColor.black;
        this.selections = [
            this._createSelection(JSRange(0, 0), UITextInput.SelectionInsertionPoint.end)
        ];
        this.markedTextRanges = [];
    },

    setCursorColor: function(cursorColor){
        this._cursorColor = cursorColor;
        this._selectionHighlightColor = cursorColor.colorWithAlpha(0.25);
        var i, l;
        for (i = 0, l = this._cursorLayers.length; i < l; ++i){
            this._cursorLayers[i].backgroundColor = this._cursorColor;
        }
        for (i = 0, l = this._selectionHighlightLayers; i < l; ++i){
            this._selectionHighlightLayers[i].backgroundColor = this._selectionHighlightColor;
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
            range = selectionRanges[i];
            selections.push(this._createSelection(range, insertionPoint, affinity));
        }
        this.setSelections(selections);
    },

    _sanitizedRange: function(range){
        return JSRange(0, this.textLayoutManager.textStorage.string.length).intersection(range);
    },

    textStorageDidChange: function(){
        this._sanitizeSelections();
    },

    _sanitizeSelections: function(){
        for (var i = 0, l = this.selections.length; i < l; ++i){
            this.selections[i].range = this._sanitizedRange(this.selections[i].range);
        }
        this._collapseOverlappingSelections();
        this.layout();
    },

    layout: function(){
        this._positionSelectionHighlights();
        this._positionCursors();
    },

    handleMouseDownAtLocation: function(location, event){
        if (event.clickCount === 1){
            // When mousing down, we behave differently depending on if the location is
            // in an existing selection or outside of every selection.
            // 1. Inside a selection means we may start dragging the selection, so don't update anything yet
            // 2. Outside a selection means we should immediately create a single selection point at the location
            //    and be ready for any subsequent drag to extend the new selection
            //
            var isInSelection = false;
            // FIXME: Should we hit test selection rects intead of check index? (yes)
            // Watch out for hits outside of a line, but inside a selection range
            // Optimization: we really only care about selections that are visible
            // Optimization: could binary search through selections
            if (isInSelection){
                // Wait for drag
                this._handledSelectOnMouseDown = false;
            }else{
                this._handledSelectOnMouseDown = true;
                this._setSingleSelectionAtLocation(location);
                this._draggingSelectionIndex = 0;
            }
        }else{
            this._handledSelectOnMouseDown = true;
            var range = null;
            var affinity = UITextInput.SelectionAffinity.beforeCurrentCharacter;
            var selection = this._createSelectionAtLocation(location);
            var index = selection.range.location - (selection.affinity == UITextInput.SelectionAffinity.afterPreviousCharacter ? 1 : 0);
            if (event.clickCount === 2){
                range = this.textLayoutManager.textStorage.string.rangeForWordAtIndex(index);
                affinity = selection.affinity;
            }else if (event.clickCount === 3){
                range = this.textLayoutManager.textStorage.string.rangeForLineAtIndex(index);
            }
            if (range !== null){
                selection = this._createSelection(range, UITextInput.SelectionInsertionPoint.end, affinity);
                this._insertSelection(selection);
            }
            this._cursorOn();
        }
    },

    handleMouseDraggedAtLocation: function(location, event){
        if (this._handledSelectOnMouseDown){
            var draggingSelection = this.selections[this._draggingSelectionIndex];
            this.selections.splice(this._draggingSelectionIndex, 1);
            var newSelection = this._createSelectionAtLocation(location);
            draggingSelection.affinity = newSelection.affinity;
            if (draggingSelection.insertionPoint == UITextInput.SelectionInsertionPoint.start){
                if (newSelection.range.location < draggingSelection.range.end){
                    draggingSelection.range = JSRange(newSelection.range.location, draggingSelection.range.end - newSelection.range.location);
                }else{
                    draggingSelection.range = JSRange(draggingSelection.range.end, newSelection.range.location - draggingSelection.range.end);
                    draggingSelection.insertionPoint = UITextInput.SelectionInsertionPoint.end;
                }
            }else{
                if (newSelection.range.location >= draggingSelection.range.location){
                    draggingSelection.range = JSRange(draggingSelection.range.location, newSelection.range.location - draggingSelection.range.location);
                }else{
                    draggingSelection.range = JSRange(newSelection.range.location, draggingSelection.range.location - newSelection.range.location);
                    draggingSelection.insertionPoint = UITextInput.SelectionInsertionPoint.start;
                }
            }
            this._draggingSelectionIndex = this._insertSelection(draggingSelection);
            this._cursorOn();
        }else{
            // we're dragging the current selection(s)...do drag and drop stuff
        }
    },

    handleMouseUpAtLocation: function(location, event){
        // TODO: not if we've dragged (need to work out drag events, may not even send mouseUp)
        if (!this._handledSelectOnMouseDown){
            this._setSingleSelectionAtLocation(location);
        }
        this._draggingSelection = null;
    },

    handleTouchesBeganAtLocation: function(location, touches, event){
        this._setSingleSelectionAtLocation(location);
    },

    handleTouchesMovedAtLocation: function(location, touches, event){
        this._setSingleSelectionAtLocation(location);
    },

    handleTouchesEnded: function(touches, event){
    },

    handleTouchesCanceled: function(touches, event){
    },

    didBecomeFirstResponder: function(isWindowKey, shouldSelect){
        this._isWindowKey = isWindowKey;
        if (shouldSelect){
            this.selectAll();
        }
        this._isFirstResponder = true;
        this.layout();
    },

    didResignFirstResponder: function(){
        this._hideCursors();
        this._hideSelections();
        this._isFirstResponder = false;
        this.undoManager.clear();
    },

    windowDidChangeKeyStatus: function(window){
        this._isWindowKey = window.isKeyWindow;
        if (this._isWindowKey){
            this._positionCursors();
        }else{
            this._hideCursors();
        }
    },

    insertionRect: function(){
        if (this._cursorLayers.length === 0){
            return JSRect.Zero;
        }
        return this._cursorLayers[this._cursorLayers.length - 1].frame;
    },

    // -------------------------------------------------------------------------
    // MARK: - Cursor blinking

    _createCursorLayer: function(){
        var layer = UILayer.init();
        layer.backgroundColor = this._cursorColor;
        this.layoutLayer.addSublayer(layer);
        return layer;
    },

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
        if (!this._isFirstResponder || !this._isWindowKey){
            return;
        }
        var i, l;
        for (i = this._cursorLayers.length, l = this.selections.length; i < l; ++i){
            this._cursorLayers.push(this._createCursorLayer());
        }
        i = this.selections.length;
        for (var j = this._cursorLayers.length - 1; j >= i; --j){
            this._cursorLayers[j].removeFromSuperlayer();
            this._cursorLayers.splice(j, 1);
        }
        var selection;
        var cursorRect;
        for (i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            cursorRect = this._cursorRectForSelection(selection);
            this._cursorLayers[i].frame = cursorRect;
        }
        this._cursorOn();
        if (this.delegate && this.delegate.textEditorDidPositionCursors){
            this.delegate.textEditorDidPositionCursors();
        }
    },

    _cursorRectForSelection: function(selection){
        var index = selection.insertionLocation;
        var useRightEdge = false;
        if (selection.affinity === UITextInput.SelectionAffinity.afterPreviousCharacter && selection.insertionLocation > 0){
            index -= 1;
            useRightEdge = true;
        }
        var container = this.textLayoutManager.textContainerForCharacterAtIndex(index);
        if (container === null){
            return JSRect.Zero;
        }
        var rect = container.rectForCharacterAtIndex(index);
        var x = rect.origin.x - Math.floor(this.cursorWidth / 2);
        if (useRightEdge){
            x += rect.size.width;
        }
        if (x > container.size.width - this.cursorWidth){
            x = container.size.width - this.cursorWidth;
        }
        if (x < 0){
            if (useRightEdge){
                x = -this.cursorWidth;
            }else{
                x = 0;
            }
        }
        var cursorRectInContainer = JSRect(
            x,
            rect.origin.y,
            this.cursorWidth,
            rect.size.height
        );
        return this.textLayoutManager.convertRectFromTextContainer(cursorRectInContainer, container);
    },

    _cursorOff: function(){
        this._cancelCursorTimers();
        this._cursorOffTimeout = null;
        this._cursorOnTimeout = JSTimer.scheduledTimerWithInterval(this._cursorBlinkRate, this._cursorOn, this);
        for (var i = 0, l = this._cursorLayers.length; i < l; ++i){
            this._cursorLayers[i].alpha = 0.0;
        }
    },

    _cursorOn: function(){
        this._cancelCursorTimers();
        this._cursorOnTimeout = null;
        this._cursorOffTimeout = JSTimer.scheduledTimerWithInterval(this._cursorBlinkRate, this._cursorOff, this);
        for (var i = 0, l = this._cursorLayers.length; i < l; ++i){
            this._cursorLayers[i].alpha = 1.0;
        }
    },

    _hideCursors: function(){
        this._cancelCursorTimers();
        for (var i = 0, l = this._cursorLayers.length; i < l; ++i){
            this._cursorLayers[i].removeFromSuperlayer();
        }
        this._cursorLayers = [];
    },

    // -------------------------------------------------------------------------
    // MARK: - Selection Highlights

    _positionSelectionHighlights: function(){
        if (!this._isFirstResponder || !this._isWindowKey){
            return;
        }
        // TODO: show paragraph marks when highlighting
        var selectionsWithLengths = [];
        var selection;
        var i, l;
        for (i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            if (selection.range.length > 0){
                selectionsWithLengths.push(selection);
            }
        }
        var frames = [];
        var selectionFrames = null;
        for (i = 0, l = selectionsWithLengths.length; i < l; ++i){
            selection = selectionsWithLengths[i];
            selectionFrames = this._highlightFramesForSelection(selection);
            frames.push.apply(frames, selectionFrames);
        }
        var highlightLayer;
        for (i = this._selectionHighlightLayers.length, l = frames.length; i < l; ++i){
            highlightLayer = this._createSelectionHighlightLayer();
            this._selectionHighlightLayers.push(highlightLayer);
        }
        i = frames.length;
        for (var j = this._selectionHighlightLayers.length - 1; j >= i; --j){
            this._selectionHighlightLayers[j].removeFromSuperlayer();
            this._selectionHighlightLayers.splice(j, 1);
        }
        for (i = 0, l = frames.length; i < l; ++i){
            highlightLayer = this._selectionHighlightLayers[i];
            highlightLayer.frame = frames[i];
        }
    },

    _highlightFramesForSelection: function(selection){
        // TODO: could filter results based on what is visible, if performance with a large number of
        // rects becomes problematic
        return this.textLayoutManager.rectsForCharacterRange(selection.range);
    },

    _createSelectionHighlightLayer: function(){
        var layer = UILayer.init();
        layer.backgroundColor = this._selectionHighlightColor;
        this.layoutLayer.addSublayer(layer);
        return layer;
    },

    _hideSelections: function(){
        for (var i = 0, l = this._selectionHighlightLayers.length; i < l; ++i){
            this._selectionHighlightLayers[i].removeFromSuperlayer();
        }
        this._selectionHighlightLayers = [];
    },

    // -------------------------------------------------------------------------
    // MARK: - Common editing operations

    _createSelectionAtLocation: function(location){
        var index = this.textLayoutManager.characterIndexAtPoint(location);
        var rect = this.textLayoutManager.rectForCharacterAtIndex(index);
        var affinity;
        if (rect.origin.y > location.y){
            // If the character is below where we clicked, then we must be immediately
            // after a line break, and should really show the cursor on the previous line.
            // Either
            // 1. The location is after a hard line break, in which case the cursor should go before the line break
            // 2. The location is after a wrap, in which case the cursor should go at the end of the clicked line
            if (index > 0){
                var iterator = this.textLayoutManager.textStorage.string.userPerceivedCharacterIterator(index - 1);
                if (iterator.isMandatoryLineBreak){
                    index = iterator.range.location;
                    affinity = UITextInput.SelectionAffinity.beforeCurrentCharacter;
                }
            }
            if (affinity === undefined){
                affinity = UITextInput.SelectionAffinity.afterPreviousCharacter;
            }
        }
        var selection = this._createSelection(JSRange(index, 0), UITextInput.SelectionInsertionPoint.end, affinity);
        return selection;
    },

    _setSingleSelectionAtLocation: function(location){
        var selection = this._createSelectionAtLocation(location);
        this._setSingleSelection(selection);
    },

    _setSingleSelectionAtIndex: function(index){
        var selection = this._createSelection(JSRange(index, 0), 0);
        this._setSingleSelection(selection);
    },

    _setSingleSelection: function(selection){
        this.setSelections([selection]);
    },

    setSelections: function(selections){
        var i, l;
        this.selections = JSCopy(selections);
        this._collapseOverlappingSelections();
        this.layout();
    },

    _insertSelection: function(selection){
        var searcher = JSBinarySearcher(this.selections, function(a, b){
            return a.range.location - b.range.location;
        });
        var index = searcher.insertionIndexForValue(selection);
        this.selections.splice(index, 0, selection);
        var removed = this._collapseOverlappingSelections();
        this.layout();
        for (var i = removed.length - 1; i >= 0 && removed[i] < index; --i){
            --index;
        }
        return index;
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
        var textStorage = this.textLayoutManager.textStorage;
        this._isHandlingSelectionAdjustments = true;
        this.undoManager.beginUndoGrouping();
        for (i = 0, l = ranges.length; i < l; ++i){
            range = ranges[i];
            adjustedRange = JSRange(range.location + locationAdjustment, range.length);
            if (adjustedRange.length > 0){
                this._replaceTextStorageRangeAllowingUndo(textStorage, adjustedRange, null);
            }
            locationAdjustment -= range.length;
            if (i == this.selections.length){
                this.selections.push(this._createSelection(JSRange(0, 0)));
            }
            this.selections[i].range = JSRange(adjustedRange.location, 0);
        }
        this._isHandlingSelectionAdjustments = false;
        for (var j = this.selections.length - 1; j >= i; --j){
            this.selections.splice(j, 1);
        }
        this.undoManager.endUndoGrouping();
        this.undoManager.setActionName("Typing");
        this._collapseOverlappingSelections();
        this._resetSelectionAffinity();
    },

    _replaceTextStorageRangeAllowingUndo: function(textStorage, range, attributedString){
        var replacedString = null;
        var insertedLength = 0;
        if (range.length > 0){
            replacedString = textStorage.attributedSubstringInRange(range);
        }
        if (attributedString !== null){
            insertedLength = attributedString.string.length;
        }
        this.undoManager.registerUndo(this, this._replaceTextStorageRangeAllowingUndo, textStorage, JSRange(range.location, insertedLength), replacedString);
        textStorage.replaceCharactersInRangeWithAttributedString(range, attributedString);
    },

    _collapseOverlappingSelections: function(){
        var removed = [];
        for (var i = this.selections.length - 1; i > 0; --i){
            if (this.selections[i - 1].range.end >= this.selections[i].range.location){
                this.selections[i - 1].range.length = Math.max(this.selections[i].range.end, this.selections[i - 1].range.end) - this.selections[i - 1].range.location;
                this.selections.splice(i, 1);
                removed.push(i);
            }
        }
        return removed;
    },

    _resetSelectionAffinity: function(){
        for (var i = 0, l = this.selections.length; i < l; ++i){
            this.selections[i].affinity = UITextInput.SelectionAffinity.beforeCurrentCharacter;
        }
    },

    _insertAttributesForSelection: function(selection){
        var index = selection.range.location > 0 ? selection.range.location - 1 : 0;
        var attributes = this.textLayoutManager.textStorage.attributesAtIndex(index);
        if (JSAttributedString.Attribute.attachment in attributes){
            attributes = JSCopy(attributes);
            delete attributes[JSAttributedString.Attribute.attachment];
        }
        return attributes;
    },

    _isHandlingSelectionAdjustments: false,

    textStorageDidReplaceCharactersInRange: function(range, insertedLength){
        if (!this._isHandlingSelectionAdjustments){
            var selection;
            var locationAdjustment = insertedLength - range.length;
            for (var i = this.selections.length - 1; i >= 0; --i){
                selection = this.selections[i];
                if (selection.range.location >= range.end){
                    selection.range = JSRange(selection.range.location + locationAdjustment, selection.range.length);
                }else if (selection.range.location >= range.location){
                    selection.range = JSRange(range.location, Math.max(0, selection.range.length + locationAdjustment));
                }else{
                    break;
                }
            }
            this._collapseOverlappingSelections();
        }
        if (this.delegate && this.delegate.textEditorDidReplaceCharactersInRange){
            this.delegate.textEditorDidReplaceCharactersInRange(this, range, insertedLength);
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - UITextInput protocol

    insertText: function(text){
        var selection;
        var textStorage = this.textLayoutManager.textStorage;
        var textLength = text.length;
        var locationAdjustment = 0;
        var adjustedRange;
        var insertAttributes;
        this._isHandlingSelectionAdjustments = true;
        this.undoManager.beginUndoGrouping();
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            insertAttributes = this.insertAttributes;
            if (insertAttributes === null){
                insertAttributes = this._insertAttributesForSelection(selection);
            }
            adjustedRange = JSRange(selection.range.location + locationAdjustment, selection.range.length);
            this._replaceTextStorageRangeAllowingUndo(textStorage, adjustedRange, JSAttributedString.initWithString(text, insertAttributes));
            selection.range = JSRange(adjustedRange.location + textLength, 0);
            locationAdjustment += textLength - adjustedRange.length;
        }
        this.undoManager.endUndoGrouping();
        this.undoManager.setActionName("Typing");
        this._isHandlingSelectionAdjustments = false;
        this._resetSelectionAffinity();
    },

    setMarkedText: function(text){
        var i, l;
        if (this.markedTextRanges.length > 0){
            var selections = [];
            for (i = 0, l = this.markedTextRanges.length; i < l; ++i){
                selections.push(UITextInputSelection(this.markedTextRanges[i]));
            }
            this.setSelections(selections);
        }
        this.insertText(text);
        for (i = 0, l = this.selections.length; i < l; ++i){
            this.markedTextRanges.push(JSRange(this.selections[i].range.location - text.length, text.length));
        }
    },

    clearMarkedText: function(){
        this._deleteRanges(this.markedTextRanges);
        this.markedTextRanges = [];
    },

    insertNewline: function(){
        this.insertText("\n");
    },

    insertLineBreak: function(){
        this.insertText("\n");
    },

    insertTab: function(){
        this.insertText("\t");
    },

    insertBacktab: function(){
        this.insertText("\t");
    },

    deleteSelections: function(){
        var textStorage = this.textLayoutManager.textStorage;
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
        var textStorage = this.textLayoutManager.textStorage;
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
        var textStorage = this.textLayoutManager.textStorage;
        var selection;
        var indexOfPreviousWord;
        var ranges = [];
        // we only get here if the selections all have 0 length
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            indexOfPreviousWord = textStorage.string.indexOfWordStartBeforeIndex(selection.range.location);
            ranges.push(JSRange(indexOfPreviousWord, selection.range.location - indexOfPreviousWord));
        }
        this._deleteRanges(ranges);
    },

    deleteToBeginningOfLine: function(){
        if (this.hasSelectionRange()){
            this.deleteSelections();
            return;
        }
        var textStorage = this.textLayoutManager.textStorage;
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
        var textStorage = this.textLayoutManager.textStorage;
        var ranges = [JSRange(0, this.selections[this.selections.length - 1].range.location)];
        this._deleteRanges(ranges);
    },

    deleteForward: function(){
        if (this.hasSelectionRange()){
            this.deleteSelections();
            return;
        }
        var textStorage = this.textLayoutManager.textStorage;
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
        var textStorage = this.textLayoutManager.textStorage;
        var selection;
        var nextWordIndex;
        var ranges = [];
        // we only get here if the selections all have 0 length
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            nextWordIndex = textStorage.string.indexOfWordEndAfterIndex(selection.range.location);
            ranges.push(JSRange(selection.range.location, nextWordIndex - selection.range.location));
        }
        this._deleteRanges(ranges);
    },

    deleteToEndOfLine: function(){
        if (this.hasSelectionRange()){
            this.deleteSelections();
            return;
        }
        var textStorage = this.textLayoutManager.textStorage;
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
        var textStorage = this.textLayoutManager.textStorage;
        var location = this.selections[0].range.location;
        var ranges = [JSRange(location, textStorage.string.length - location)];
        this._deleteRanges(ranges);
    },
    
    moveBackward: function(){
        var textStorage = this.textLayoutManager.textStorage;
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
        var textStorage = this.textLayoutManager.textStorage;
        var selection;
        var wordRange;
        var indexOfPreviousWord;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            indexOfPreviousWord = textStorage.string.indexOfWordStartBeforeIndex(selection.range.location);
            selection.range = JSRange(indexOfPreviousWord, 0);
        }
        this._collapseOverlappingSelections();
        this._resetSelectionAffinity();
        this.layout();
        this._cursorOn();
    },

    moveToBeginningOfLine: function(){
        var textStorage = this.textLayoutManager.textStorage;
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
        var textStorage = this.textLayoutManager.textStorage;
        var selection;
        var index;
        var pointOnPreviousLine;
        var line;
        var lineRect;
        var cursorRect;
        var lineEnumerator;
        var cursorX;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            selection.insertionPoint = UITextInput.SelectionInsertionPoint.start;
            cursorRect = this._cursorRectForSelection(selection);
            cursorX = cursorRect.origin.x + Math.floor(cursorRect.size.width / 2.0);
            lineEnumerator = this.textLayoutManager.lineEnumerator(selection.range.location - (selection.affinity === UITextInput.SelectionAffinity.afterPreviousCharacter ? 1 : 0));
            line = lineEnumerator.line;
            lineEnumerator.decrement();
            if (lineEnumerator.line !== null){
                lineRect = lineEnumerator.rect;
                pointOnPreviousLine = JSPoint(cursorX, lineRect.origin.y + lineRect.size.height / 2);
                index = this.textLayoutManager.characterIndexAtPoint(pointOnPreviousLine);
                selection.range = JSRange(index, 0);
                if (selection.range.location === line.range.location && selection.range.location > 0){
                    var iterator = textStorage.string.userPerceivedCharacterIterator(selection.range.location - 1);
                    if (iterator.isMandatoryLineBreak){
                        selection.range = JSRange(iterator.index, 0);
                        selection.affinity = UITextInput.SelectionAffinity.beforeCurrentCharacter;
                    }else{
                        selection.affinity = UITextInput.SelectionAffinity.afterPreviousCharacter;
                    }
                }else{
                    selection.affinity = UITextInput.SelectionAffinity.beforeCurrentCharacter;
                }
            }else{
                selection.range = JSRange.Zero;
                selection.affinity = UITextInput.SelectionAffinity.beforeCurrentCharacter;
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
        var textStorage = this.textLayoutManager.textStorage;
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
        var textStorage = this.textLayoutManager.textStorage;
        var selection;
        var wordRange;
        var nextWordIndex;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            nextWordIndex = textStorage.string.indexOfWordEndAfterIndex(selection.range.end);
            selection.range = JSRange(nextWordIndex, 0);
        }
        this._collapseOverlappingSelections();
        this._resetSelectionAffinity();
        this.layout();
        this._cursorOn();
    },

    moveToEndOfLine: function(){
        var textStorage = this.textLayoutManager.textStorage;
        var selection;
        var line;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            line = this._lineForSelectionEnd(selection);
            if (line !== null && line.range.end > selection.range.location){
                var iterator = textStorage.string.userPerceivedCharacterIterator(line.range.end - 1);
                if (iterator.isMandatoryLineBreak){
                    selection.range = JSRange(iterator.index, 0);
                    selection.affinity = UITextInput.SelectionAffinity.beforeCurrentCharacter;
                }else{
                    selection.range = JSRange(line.range.end, 0);
                    selection.affinity = UITextInput.SelectionAffinity.afterPreviousCharacter;
                }
            }
        }
        this._collapseOverlappingSelections();
        this.layout();
        this._cursorOn();
    },

    moveDown: function(){
        var textStorage = this.textLayoutManager.textStorage;
        var selection;
        var index;
        var pointOnNextLine;
        var line;
        var lineRect;
        var cursorRect;
        var cursorX;
        var lineEnumerator;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            selection.insertionPoint = UITextInput.SelectionInsertionPoint.end;
            cursorRect = this._cursorRectForSelection(selection);
            cursorX = cursorRect.origin.x + Math.floor(cursorRect.size.width / 2.0);
            lineEnumerator = this.textLayoutManager.lineEnumerator(selection.range.end - (selection.affinity === UITextInput.SelectionAffinity.afterPreviousCharacter ? 1 : 0));
            line = lineEnumerator.line;
            lineEnumerator.increment();
            if (lineEnumerator.line !== null){
                lineRect = lineEnumerator.rect;
                pointOnNextLine = JSPoint(cursorX, lineRect.origin.y + lineRect.size.height / 2);
                index = this.textLayoutManager.characterIndexAtPoint(pointOnNextLine);
                selection.range = JSRange(index, 0);
                if (selection.range.location === lineEnumerator.line.range.end && selection.range.location > 0){
                    var iterator = textStorage.string.userPerceivedCharacterIterator(selection.range.location - 1);
                    if (iterator.isMandatoryLineBreak){
                        selection.range = JSRange(iterator.index, 0);
                        selection.affinity = UITextInput.SelectionAffinity.beforeCurrentCharacter;
                    }else{
                        selection.affinity = UITextInput.SelectionAffinity.afterPreviousCharacter;
                    }
                }else{
                    selection.affinity = UITextInput.SelectionAffinity.beforeCurrentCharacter;
                }
            }else{
                selection.range = this._sanitizedRange(JSRange(line.range.end, 0));
                selection.affinity = UITextInput.SelectionAffinity.beforeCurrentCharacter;
            }
        }
        this._collapseOverlappingSelections();
        this.layout();
        this._cursorOn();
    },

    moveToEndOfDocument: function(){
        var textStorage = this.textLayoutManager.textStorage;
        this._setSingleSelectionAtIndex(textStorage.string.length);
        this._cursorOn();
    },

    moveBackwardAndModifySelection: function(){
        var textStorage = this.textLayoutManager.textStorage;
        var selection;
        var perceivedCharacterRange;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            if (selection.range.length > 0 && selection.insertionPoint == UITextInput.SelectionInsertionPoint.end){
                perceivedCharacterRange = textStorage.string.rangeForUserPerceivedCharacterAtIndex(selection.range.end - 1);
                selection.range.length -= perceivedCharacterRange.length;
            }else{
                if (selection.range.location > 0){
                    perceivedCharacterRange = textStorage.string.rangeForUserPerceivedCharacterAtIndex(selection.range.location - 1);
                    selection.range = JSRange(perceivedCharacterRange.location, perceivedCharacterRange.length + selection.range.length);
                }
                selection.insertionPoint = UITextInput.SelectionInsertionPoint.start;
            }
        }
        this._collapseOverlappingSelections();
        this._resetSelectionAffinity();
        this.layout();
        this._cursorOn();
    },

    moveWordBackwardAndModifySelection: function(){
        var textStorage = this.textLayoutManager.textStorage;
        var selection;
        var wordRange;
        var indexOfPreviousWord;
        var end;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            if (selection.insertionPoint == UITextInput.SelectionInsertionPoint.start){
                end = selection.range.end;
            }else{
                end = selection.range.location;
            }
            indexOfPreviousWord = textStorage.string.indexOfWordStartBeforeIndex(selection.range.location);
            selection.range = JSRange(indexOfPreviousWord, end - indexOfPreviousWord);
            selection.insertionPoint = UITextInput.SelectionInsertionPoint.start;
        }
        this._collapseOverlappingSelections();
        this._resetSelectionAffinity();
        this.layout();
        this._cursorOn();
    },

    moveToBeginningOfLineAndModifySelection: function(){
        var textStorage = this.textLayoutManager.textStorage;
        var selection;
        var line;
        var end;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            line = this._lineForSelectionStart(selection);
            if (line !== null){
                if (selection.insertionPoint == UITextInput.SelectionInsertionPoint.start){
                    end = selection.range.end;
                }else{
                    end = selection.range.location;
                }
                selection.range = JSRange(line.range.location, end - line.range.location);
            }
            selection.insertionPoint = UITextInput.SelectionInsertionPoint.start;
        }
        this._collapseOverlappingSelections();
        this._resetSelectionAffinity();
        this.layout();
        this._cursorOn();
    },

    moveUpAndModifySelection: function(){
        var textStorage = this.textLayoutManager.textStorage;
        var selection;
        var index;
        var pointOnPreviousLine;
        var line;
        var lineRect;
        var cursorRect;
        var cursorX;
        var lineEnumerator;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            cursorRect = this._cursorRectForSelection(selection);
            cursorX = cursorRect.origin.x + Math.floor(cursorRect.size.width / 2.0);
            lineEnumerator = this.textLayoutManager.lineEnumerator((selection.insertionPoint == UITextInput.SelectionInsertionPoint.start ? selection.range.location : selection.range.end) - (selection.affinity === UITextInput.SelectionAffinity.afterPreviousCharacter ? 1 : 0));
            line = lineEnumerator.line;
            lineEnumerator.decrement();
            if (lineEnumerator.line !== null){
                lineRect = lineEnumerator.rect;
                pointOnPreviousLine = JSPoint(cursorX, lineRect.origin.y + lineRect.size.height / 2);
                index = this.textLayoutManager.characterIndexAtPoint(pointOnPreviousLine);
                if (index === line.range.location && index > 0){
                    var iterator = textStorage.string.userPerceivedCharacterIterator(index - 1);
                    if (iterator.isMandatoryLineBreak){
                        index = iterator.index;
                        selection.affinity = UITextInput.SelectionAffinity.beforeCurrentCharacter;
                    }else{
                        selection.affinity = UITextInput.SelectionAffinity.afterPreviousCharacter;
                    }
                }else{
                    selection.affinity = UITextInput.SelectionAffinity.beforeCurrentCharacter;
                }
                if (selection.insertionPoint == UITextInput.SelectionInsertionPoint.start){
                    selection.range = JSRange(index, selection.range.end - index);
                }else{
                    if (index >= selection.range.location){
                        selection.range = JSRange(selection.range.location, index - selection.range.location);
                    }else{
                        selection.range = JSRange(index, selection.range.location - index);
                        selection.insertionPoint = UITextInput.SelectionInsertionPoint.start;
                    }
                }
            }else{
                if (selection.insertionPoint == UITextInput.SelectionInsertionPoint.start){
                    selection.range = JSRange(0, selection.range.end);
                }else{
                    selection.range = JSRange(0, selection.range.location);
                }
                selection.affinity = UITextInput.SelectionAffinity.beforeCurrentCharacter;
                selection.insertionPoint = UITextInput.SelectionInsertionPoint.start;
            }
        }
        this._collapseOverlappingSelections();
        this.layout();
        this._cursorOn();
    },

    moveToBeginningOfDocumentAndModifySelection: function(){
        var finalSelection = this.selections[this.selections.length - 1];
        var end;
        if (finalSelection.insertionPoint == UITextInput.SelectionInsertionPoint.start){
            end = finalSelection.range.end;
        }else{
            end = finalSelection.range.location;
        }
        var selection = this._createSelection(JSRange(0, end), UITextInput.SelectionInsertionPoint.start);
        this._setSingleSelection(selection);
        this.layout();
        this._cursorOn();
    },

    moveForwardAndModifySelection: function(){
        var textStorage = this.textLayoutManager.textStorage;
        var selection;
        var perceivedCharacterRange;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            if (selection.range.length > 0 && selection.insertionPoint == UITextInput.SelectionInsertionPoint.start){
                perceivedCharacterRange = textStorage.string.rangeForUserPerceivedCharacterAtIndex(selection.range.location);
                selection.range.advance(perceivedCharacterRange.length);
            }else{
                if (selection.range.end < textStorage.string.length){
                    perceivedCharacterRange = textStorage.string.rangeForUserPerceivedCharacterAtIndex(selection.range.end);
                    selection.range = JSRange(selection.range.location, perceivedCharacterRange.length + selection.range.length);
                }
                selection.insertionPoint = UITextInput.SelectionInsertionPoint.end;
            }
        }
        this._collapseOverlappingSelections();
        this._resetSelectionAffinity();
        this.layout();
        this._cursorOn();
    },

    moveWordForwardAndModifySelection: function(){
        var textStorage = this.textLayoutManager.textStorage;
        var selection;
        var wordRange;
        var nextWordIndex;
        var start;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            if (selection.insertionPoint == UITextInput.SelectionInsertionPoint.start){
                start = selection.range.end;
            }else{
                start = selection.range.location;
            }
            nextWordIndex = textStorage.string.indexOfWordEndAfterIndex(selection.range.end);
            selection.range = JSRange(start, nextWordIndex - start);
            selection.insertionPoint = UITextInput.SelectionInsertionPoint.end;
        }
        this._collapseOverlappingSelections();
        this._resetSelectionAffinity();
        this.layout();
        this._cursorOn();
    },

    moveToEndOfLineAndModifySelection: function(){
        var textStorage = this.textLayoutManager.textStorage;
        var selection;
        var line;
        var start;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            line = this._lineForSelectionEnd(selection);
            if (selection.insertionPoint == UITextInput.SelectionInsertionPoint.start){
                start = selection.range.end;
            }else{
                start = selection.range.location;
            }
            if (line !== null){
                var iterator = textStorage.string.userPerceivedCharacterIterator(line.range.end - 1);
                if (iterator.isMandatoryLineBreak){
                    selection.range = JSRange(start, iterator.index - start);
                    selection.affinity = UITextInput.SelectionAffinity.beforeCurrentCharacter;
                }else{
                    selection.range = JSRange(start, line.range.end - start);
                    selection.affinity = UITextInput.SelectionAffinity.afterPreviousCharacter;
                }
            }
            selection.insertionPoint = UITextInput.SelectionInsertionPoint.end;
        }
        this._collapseOverlappingSelections();
        this.layout();
        this._cursorOn();
    },

    moveDownAndModifySelection: function(){
        var textStorage = this.textLayoutManager.textStorage;
        var selection;
        var index;
        var pointOnNextLine;
        var line;
        var lineEnumerator;
        var lineRect;
        var cursorRect;
        var cursorX;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            cursorRect = this._cursorRectForSelection(selection);
            cursorX = cursorRect.origin.x + Math.floor(cursorRect.size.width / 2.0);
            lineEnumerator = this.textLayoutManager.lineEnumerator((selection.insertionPoint == UITextInput.SelectionInsertionPoint.start ? selection.range.location : selection.range.end) - (selection.affinity === UITextInput.SelectionAffinity.afterPreviousCharacter ? 1 : 0));
            line = lineEnumerator.line;
            lineEnumerator.increment();
            if (lineEnumerator.line !== null){
                lineRect = lineEnumerator.rect;
                pointOnNextLine = JSPoint(cursorX, lineRect.origin.y + lineRect.size.height / 2);
                index = this.textLayoutManager.characterIndexAtPoint(pointOnNextLine);
                if (index === lineEnumerator.line.range.end && index > 0){
                    var iterator = textStorage.string.userPerceivedCharacterIterator(index - 1);
                    if (iterator.isMandatoryLineBreak){
                        index = iterator.index;
                        selection.affinity = UITextInput.SelectionAffinity.beforeCurrentCharacter;
                    }else{
                        selection.affinity = UITextInput.SelectionAffinity.afterPreviousCharacter;
                    }
                }else{
                    selection.affinity = UITextInput.SelectionAffinity.beforeCurrentCharacter;
                }
                if (selection.insertionPoint == UITextInput.SelectionInsertionPoint.end){
                    selection.range = JSRange(selection.range.location, index - selection.range.location);
                }else{
                    if (index < selection.range.end){
                        selection.range = JSRange(index, selection.range.end - index);
                    }else{
                        selection.range = JSRange(selection.range.end, index - selection.range.end);
                        selection.insertionPoint = UITextInput.SelectionInsertionPoint.end;
                    }
                }
            }else{
                if (selection.insertionPoint == UITextInput.SelectionInsertionPoint.end){
                    selection.range = this._sanitizedRange(JSRange(selection.range.location, line.range.end - selection.range.location));
                }else{
                    selection.range = this._sanitizedRange(JSRange(selection.range.end), line.range.end - selection.range.end);
                }
                selection.insertionPoint = UITextInput.SelectionInsertionPoint.end;
                selection.affinity = UITextInput.SelectionAffinity.beforeCurrentCharacter;
            }
        }
        this._collapseOverlappingSelections();
        this.layout();
        this._cursorOn();
    },

    moveToEndOfDocumentAndModifySelection: function(){
        var textStorage = this.textLayoutManager.textStorage;
        var firstSelection = this.selections[0];
        var start;
        if (firstSelection.insertionPoint == UITextInput.SelectionInsertionPoint.start){
            start = firstSelection.range.end;
        }else{
            start = firstSelection.range.location;
        }
        var range = JSRange(start, textStorage.string.length - start);
        var selection = this._createSelection(range, UITextInput.SelectionInsertionPoint.end);
        this._setSingleSelection(selection);
        this.layout();
        this._cursorOn();
    },

    selectAll: function(){
        var textStorage = this.textLayoutManager.textStorage;
        var range = JSRange(0, textStorage.string.length);
        var selection = this._createSelection(range, UITextInput.SelectionInsertionPoint.end);
        this._setSingleSelection(selection);
    },

    _createSelection: function(range, insertionPoint, affinity){
        range = this._sanitizedRange(range);
        var selection = UITextInputSelection(range, insertionPoint, affinity);
        return selection;
    },

    _lineForSelectionStart: function(selection){
        if (selection.affinity === UITextInput.SelectionAffinity.afterPreviousCharacter && selection.range.location > 0){
            return this.textLayoutManager.lineForCharacterAtIndex(selection.range.location - 1);
        }
        return this.textLayoutManager.lineForCharacterAtIndex(selection.range.location);
    },

    _lineForSelectionEnd: function(selection){
        if (selection.affinity === UITextInput.SelectionAffinity.afterPreviousCharacter && selection.range.end > 0){
            return this.textLayoutManager.lineForCharacterAtIndex(selection.range.end - 1);
        }
        return this.textLayoutManager.lineForCharacterAtIndex(selection.range.end);
    }

});

})();