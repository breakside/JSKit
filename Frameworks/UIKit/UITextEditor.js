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
// #import "JSColor+UIKit.js"
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
        this.cursorColor = JSColor.highlight;
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
            var atomicRange;
            var affinity = UITextInput.SelectionAffinity.beforeCurrentCharacter;
            var selection = this._createSelectionAtLocation(location);
            if (selection.range.length === 0){
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
            }else{
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
                    draggingSelection.range = JSRange(draggingSelection.range.end, newSelection.range.end - draggingSelection.range.end);
                    draggingSelection.insertionPoint = UITextInput.SelectionInsertionPoint.end;
                }
            }else{
                if (newSelection.range.end >= draggingSelection.range.location){
                    draggingSelection.range = JSRange(draggingSelection.range.location, newSelection.range.end - draggingSelection.range.location);
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

    handleTouchesEndedAtLocation: function(location, touches, event){
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
        if (container === null || container.textFrame === null){
            return JSRect.Zero;
        }
        var rect = container.rectForCharacterAtIndex(index);
        var x = rect.origin.x - Math.floor(this.cursorWidth / 2);
        if (useRightEdge){
            x += rect.size.width;
        }
        if (x > container.textFrame.size.width - this.cursorWidth){
            x = container.textFrame.size.width - this.cursorWidth;
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

    bold: function(sender){
        this._toggleBooleanAttribute("bold", "Bold");
    },

    italic: function(sender){
        this._toggleBooleanAttribute("italic", "Italic");
    },

    underline: function(sender){
        this._toggleBooleanAttribute("underline", "Underline");
    },

    strike: function(sender){
        this._toggleBooleanAttribute("strike", "Strike");
    },

    setAttribute: function(name, value, undoName){
        this.undoManager.beginUndoGrouping();
        var i, l;
        var selection;
        var selections = this._selectionsCopy();
        for (i = 0, l = selections.length; i < l; ++i){
            selection = selections[i];
            this._setAttributeValueForSelection(name, value, selection);
        }
        this._setSelectionsAllowingUndo(selections);
        this.undoManager.endUndoGrouping();
        this.undoManager.setActionName(undoName);
    },

    removeAttribute: function(name, undoName){
        this.setAttribute(name, undefined, undoName);
    },

    removeParagraphAttribute: function(name, undoName){
        this.setParagraphAttribute(name, undefined, undoName);
    },

    setParagraphAttributes: function(attributes, undoName){
        this.undoManager.beginUndoGrouping();
        var name, value;
        var i, l;
        var selection;
        var selections = this._selectionsCopy();
        for (name in attributes){
            value = attributes[name];
            for (i = 0, l = selections.length; i < l; ++i){
                selection = selections[i];
                this._setParagraphAttributeForSelection(name, value, selection);
            }
        }
        this._setSelectionsAllowingUndo(selections);
        this.undoManager.endUndoGrouping();
        this.undoManager.setActionName(undoName);
    },

    setParagraphAttribute: function(name, value, undoName){
        this.undoManager.beginUndoGrouping();
        var i, l;
        var selection;
        var selections = this._selectionsCopy();
        for (i = 0, l = selections.length; i < l; ++i){
            selection = selections[i];
            this._setParagraphAttributeForSelection(name, value, selection);
        }
        this._setSelectionsAllowingUndo(selections);
        this.undoManager.endUndoGrouping();
        this.undoManager.setActionName(undoName);
    },

    _setParagraphAttributeForSelection: function(name, value, selection){
        var textStorage = this.textLayoutManager.textStorage;
        var replacementString;
        var replacementRange;
        var paragraphRange;
        paragraphRange = textStorage.string.rangeForParagraphAtIndex(selection.range.location);
        replacementRange = JSRange(paragraphRange);
        while (paragraphRange.length > 0 && paragraphRange.end < selection.range.end){
            paragraphRange = textStorage.string.rangeForParagraphAtIndex(replacementRange.end);
            replacementRange.length += paragraphRange.length;
        }
        if (replacementRange.length > 0){
            replacementString = textStorage.attributedSubstringInRange(replacementRange);
            if (value !== undefined){
                replacementString.addAttributeInRange(name, value, JSRange(0, replacementString.string.length));
            }else{
                replacementString.removeAttributeInRange(name, JSRange(0, replacementString.string.length));
            }
            this._replaceTextStorageRangeAllowingUndo(textStorage, replacementRange, replacementString);
        }else{
            selection.attributes = this._insertAttributesForSelection(selection);
            this.undoManager.registerUndo(this, this._setParagraphAttributeForSelection, name, selection.attributes[name], selection);
            if (value !== undefined){
                selection.attributes[name] = value;
            }else{
                delete selection.attributes[name];
            }
        }
    },

    _toggleBooleanAttribute: function(name, undoName){
        var selection;
        var textStorage = this.textLayoutManager.textStorage;
        var locationAdjustment = 0;
        var attributes;
        var i, l;
        var currentValue = true;
        var runIterator;
        for (i = 0, l = this.selections.length; i < l && currentValue === true; ++i){
            selection = this.selections[i];
            if (selection.range.length > 0){
                runIterator = textStorage.runIterator(selection.range.location);
                var j = 0;
                while (runIterator.range.location < selection.range.end && currentValue === true && j < 10000){
                    if (!runIterator.attributes[name]){
                        currentValue = false;
                    }
                    runIterator.increment();
                }
                if (j === 10000){
                    throw new Error("infinite loop");
                }
            }else{
                attributes = this._insertAttributesForSelection(selection);
                if (!attributes[name]){
                    currentValue = false;
                }
            }
        }
        this.undoManager.beginUndoGrouping();
        var selections = this._selectionsCopy();
        for (i = 0, l = selections.length; i < l; ++i){
            selection = selections[i];
            this._setAttributeValueForSelection(name, !currentValue, selection);
        }
        this._setSelectionsAllowingUndo(selections);
        this.undoManager.endUndoGrouping();
        this.undoManager.setActionName(undoName);
        this._resetSelectionAffinity();
    },

    _setAttributeValueForSelection: function(name, value, selection){
        var textStorage = this.textLayoutManager.textStorage;
        var replacementString;
        if (selection.range.length > 0){
            replacementString = textStorage.attributedSubstringInRange(selection.range);
            if (value !== null && value !== undefined){
                replacementString.addAttributeInRange(name, value, JSRange(0, replacementString.string.length));
            }else{
                replacementString.removeAttributeInRange(name, JSRange(0, replacementString.string.length));
            }
            this._replaceTextStorageRangeAllowingUndo(textStorage, selection.range, replacementString);
        }else{
            selection.attributes = this._insertAttributesForSelection(selection);
            var currentValue = selection.attributes[name];
            if (value !== null && value !== undefined){
                selection.attributes[name] = value;
            }else{
                delete selection.attributes[name];
            }
            this.undoManager.registerUndo(this, this._setAttributeValueForSelection, name, currentValue, selection);
        }
    },

    _createSelectionAtLocation: function(location){
        var index = this.textLayoutManager.characterIndexAtPoint(location);
        var atomicRange;
        if (this.delegate && this.delegate.atomicRangeForTextEditorIndex){
            atomicRange = this.delegate.atomicRangeForTextEditorIndex(this, index);
            if (atomicRange){
                return this._createSelection(atomicRange, UITextInput.SelectionInsertionPoint.end, UITextInput.SelectionAffinity.beforeCurrentCharacter);
            }
        }
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

    _selectionsCopy: function(){
        var selections = [];
        var i, l;
        for (i = 0, l = this.selections.length; i < l; ++i){
            selections.push(UITextInputSelection(this.selections[i]));
        }
        return selections;
    },

    _setSelectionsAllowingUndo: function(selections){
        this.undoManager.registerUndo(this, this._setSelectionsAllowingUndo, this._selectionsCopy());
        this.setSelections(selections);
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
        this.undoManager.beginUndoGrouping();
        var selections = this._selectionsCopy();
        for (i = 0, l = ranges.length; i < l; ++i){
            range = ranges[i];
            adjustedRange = JSRange(range.location + locationAdjustment, range.length);
            if (adjustedRange.length > 0){
                this._replaceTextStorageRangeAllowingUndo(textStorage, adjustedRange, null);
            }
            locationAdjustment -= range.length;
            if (i == selections.length){
                selections.push(this._createSelection(JSRange(0, 0)));
            }
            selections[i].range = JSRange(adjustedRange.location, 0);
        }
        for (var j = selections.length - 1; j >= i; --j){
            selections.splice(j, 1);
        }
        for (i = 0, l = selections.length; i < l; ++i){
            selections[i].affinity = UITextInput.SelectionAffinity.beforeCurrentCharacter;
        }
        this._setSelectionsAllowingUndo(selections);
        this.undoManager.endUndoGrouping();
        this.undoManager.setActionName("Typing");
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
        this._isHandlingSelectionAdjustments = true;
        textStorage.replaceCharactersInRangeWithAttributedString(range, attributedString);
        this._isHandlingSelectionAdjustments = false;
    },

    _collapseOverlappingSelections: function(sections){
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
        if (selection.attributes){
            return selection.attributes;
        }
        var index = selection.range.location;
        var iterator;
        if (selection.range.length === 0 && index > 0){
            iterator = this.textLayoutManager.textStorage.string.userPerceivedCharacterIterator(index);
            iterator.decrement();
            if (!iterator.isParagraphBreak){
                index = iterator.range.location;
            }
        }
        var attributes = JSCopy(this.textLayoutManager.textStorage.attributesAtIndex(index));
        if (JSAttributedString.Attribute.attachment in attributes){
            delete attributes[JSAttributedString.Attribute.attachment];
        }
        if (this.delegate && this.delegate.textEditorPrepareInsertAttributes){
            this.delegate.textEditorPrepareInsertAttributes(this, attributes);
        }
        return attributes;
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
        var i, l;
        var selections = this._selectionsCopy();
        this.undoManager.beginUndoGrouping();
        for (i = 0, l = selections.length; i < l; ++i){
            selection = selections[i];
            insertAttributes = this._insertAttributesForSelection(selection);
            adjustedRange = JSRange(selection.range.location + locationAdjustment, selection.range.length);
            this._replaceTextStorageRangeAllowingUndo(textStorage, adjustedRange, JSAttributedString.initWithString(text, insertAttributes));
            selection.range = JSRange(adjustedRange.location + textLength, 0);
            selection.affinity = UITextInput.SelectionAffinity.beforeCurrentCharacter;
            locationAdjustment += textLength - adjustedRange.length;
        }
        this._setSelectionsAllowingUndo(selections);
        this.undoManager.endUndoGrouping();
        this.undoManager.setActionName("Typing");
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
        this.insertText("\u2028");
    },

    insertTab: function(){
        this.insertText("\t");
    },

    insertBacktab: function(){
        this.insertText("\t");
    },

    deleteBackward: function(){
        if (this.hasSelectionRange()){
            this.deleteSelections();
            return;
        }
        var textStorage = this.textLayoutManager.textStorage;
        var selection;
        var range;
        var ranges = [];
        // we only get here if the selections all have 0 length
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            if (selection.range.location > 0){
                range = textStorage.string.rangeForUserPerceivedCharacterAtIndex(selection.range.location - 1);
                if (this.delegate && this.delegate.atomicRangeForTextEditorIndex){
                    range = JSRange(this.delegate.atomicRangeForTextEditorIndex(this, range.location)) || range;
                }
                ranges.push(range);
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
        var range;
        var ranges = [];
        // we only get here if the selections all have 0 length
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            indexOfPreviousWord = textStorage.string.indexOfWordStartBeforeIndex(selection.range.location);
            if (indexOfPreviousWord < selection.range.location && this.delegate && this.delegate.atomicRangeForTextEditorIndex){
                range = this.delegate.atomicRangeForTextEditorIndex(this, indexOfPreviousWord);
                if (range){
                    indexOfPreviousWord = range.location;
                }
            }
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
        var range;
        var indexOfLineStart;
        // we only get here if the selections all have 0 length
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            line = this._lineForSelectionStart(selection);
            if (line !== null && selection.range.location > line.range.location){
                indexOfLineStart = line.range.location;
                if (indexOfLineStart < selection.range.location && this.delegate && this.delegate.atomicRangeForTextEditorIndex){
                    range = this.delegate.atomicRangeForTextEditorIndex(this, indexOfLineStart);
                    if (range){
                        indexOfLineStart = range.location;
                    }
                }
                ranges.push(JSRange(indexOfLineStart, selection.range.location - indexOfLineStart));
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
        var range;
        var ranges = [];
        // we only get here if the selections all have 0 length
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            if (selection.range.location < textStorage.string.length){
                range = textStorage.string.rangeForUserPerceivedCharacterAtIndex(selection.range.location);
                if (this.delegate && this.delegate.atomicRangeForTextEditorIndex){
                    range = JSRange(this.delegate.atomicRangeForTextEditorIndex(this, range.location)) || range;
                }
                ranges.push(range);
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
        var range;
        var ranges = [];
        // we only get here if the selections all have 0 length
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            nextWordIndex = textStorage.string.indexOfWordEndAfterIndex(selection.range.location);
            if (nextWordIndex > selection.range.location && this.delegate && this.delegate.atomicRangeForTextEditorIndex){
                range = this.delegate.atomicRangeForTextEditorIndex(this, nextWordIndex - 1);
                if (range){
                    nextWordIndex = range.end;
                }
            }
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
        var range;
        var indexOfLineEnd;
        // we only get here if the selections all have 0 length
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            line = this._lineForSelectionStart(selection);
            if (line !== null && selection.range.location < line.range.end){
                indexOfLineEnd = line.range.end;
                if (this.delegate && this.delegate.atomicRangeForTextEditorIndex){
                    range = this.delegate.atomicRangeForTextEditorIndex(this, indexOfLineEnd - 1);
                    if (range){
                        indexOfLineEnd = range.end;
                    }
                }
                // Only delete up to a line break if one exists, but don't include the line break
                var iterator = textStorage.string.userPerceivedCharacterIterator(indexOfLineEnd - 1);
                if (iterator.isMandatoryLineBreak){
                    indexOfLineEnd = iterator.index;
                }
                ranges.push(JSRange(selection.range.location, indexOfLineEnd - selection.range.location));
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
        var atomicRange;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            selection.attributes = null;
            if (selection.range.length === 0){
                if (selection.range.location > 0){
                    perceivedCharacterRange = textStorage.string.rangeForUserPerceivedCharacterAtIndex(selection.range.location - 1);
                    atomicRange = null;
                    if (this.delegate && this.delegate.atomicRangeForTextEditorIndex){
                        atomicRange = this.delegate.atomicRangeForTextEditorIndex(this, perceivedCharacterRange.location);
                    }
                    if (atomicRange){
                        selection.range = JSRange(atomicRange);
                        selection.insertionPoint = UITextInput.SelectionInsertionPoint.start;
                    }else{
                        selection.range = JSRange(perceivedCharacterRange.location, 0);
                        selection.insertionPoint = UITextInput.SelectionInsertionPoint.end;
                    }
                }
            }else{
                selection.range = JSRange(selection.range.location, 0);
                selection.insertionPoint = UITextInput.SelectionInsertionPoint.end;
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
        var indexOfPreviousWord;
        var atomicRange;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            selection.attributes = null;
            indexOfPreviousWord = textStorage.string.indexOfWordStartBeforeIndex(selection.range.location);
            atomicRange = null;
            if (indexOfPreviousWord < selection.range.location && this.delegate && this.delegate.atomicRangeForTextEditorIndex){
                atomicRange = this.delegate.atomicRangeForTextEditorIndex(this, indexOfPreviousWord);
            }
            if (atomicRange){
                selection.range = JSRange(atomicRange);
                selection.insertionPoint = UITextInput.SelectionInsertionPoint.start;
            }else{
                selection.range = JSRange(indexOfPreviousWord, 0);
                selection.insertionPoint = UITextInput.SelectionInsertionPoint.end;
            }
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
        var atomicRange;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            selection.attributes = null;
            line = this._lineForSelectionStart(selection);
            if (line !== null){
                atomicRange = null;
                if (line.range.location < selection.range.location && this.delegate && this.delegate.atomicRangeForTextEditorIndex){
                    atomicRange = this.delegate.atomicRangeForTextEditorIndex(this, line.range.location);
                }
                if (atomicRange){
                    selection.range = JSRange(atomicRange);
                    selection.insertionPoint = UITextInput.SelectionInsertionPoint.start;
                }else{
                    selection.range = JSRange(line.range.location, 0);
                    selection.insertionPoint = UITextInput.SelectionInsertionPoint.end;
                }
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
        var atomicRange;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            selection.attributes = null;
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
                atomicRange = null;
                if (index < selection.range.location && this.delegate && this.delegate.atomicRangeForTextEditorIndex){
                    atomicRange = this.delegate.atomicRangeForTextEditorIndex(this, index);
                }
                if (atomicRange){
                    selection.range = JSRange(atomicRange);
                    selection.insertionPoint = UITextInput.SelectionInsertionPoint.start;
                    selection.affinity = UITextInput.SelectionAffinity.beforeCurrentCharacter;
                }else{
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
        var atomicRange;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            selection.attributes = null;
            if (selection.range.length === 0){
                if (selection.range.location < textStorage.string.length){
                    perceivedCharacterRange = textStorage.string.rangeForUserPerceivedCharacterAtIndex(selection.range.location);
                    atomicRange = null;
                    if (this.delegate && this.delegate.atomicRangeForTextEditorIndex){
                        atomicRange = this.delegate.atomicRangeForTextEditorIndex(this, perceivedCharacterRange.location);
                    }
                    if (atomicRange){
                        selection.range = JSRange(atomicRange);
                        selection.insertionPoint = UITextInput.SelectionInsertionPoint.end;
                    }else{
                        selection.range = JSRange(perceivedCharacterRange.end, 0);
                        selection.insertionPoint = UITextInput.SelectionInsertionPoint.end;
                    }
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
        var atomicRange;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            selection.attributes = null;
            nextWordIndex = textStorage.string.indexOfWordEndAfterIndex(selection.range.end);
            atomicRange = null;
            if (nextWordIndex > selection.range.location && this.delegate && this.delegate.atomicRangeForTextEditorIndex){
                atomicRange = this.delegate.atomicRangeForTextEditorIndex(this, nextWordIndex - 1);
            }
            if (atomicRange){
                selection.range = JSRange(atomicRange);
                selection.insertionPoint = UITextInput.SelectionInsertionPoint.end;
            }else{
                selection.range = JSRange(nextWordIndex, 0);
                selection.insertionPoint = UITextInput.SelectionInsertionPoint.end;
            }
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
        var atomicRange;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            selection.attributes = null;
            line = this._lineForSelectionEnd(selection);
            if (line !== null && line.range.end > selection.range.location){
                atomicRange = null;
                if (this.delegate && this.delegate.atomicRangeForTextEditorIndex){
                    atomicRange = this.delegate.atomicRangeForTextEditorIndex(this, line.range.end);
                }
                if (atomicRange){
                    selection.range = JSRange(atomicRange);
                    selection.insertionPoint = UITextInput.SelectionInsertionPoint.end;
                    selection.affinity = UITextInput.SelectionAffinity.beforeCurrentCharacter;
                }else{
                    var iterator = textStorage.string.userPerceivedCharacterIterator(line.range.end - 1);
                    if (iterator.isMandatoryLineBreak){
                        selection.range = JSRange(iterator.index, 0);
                        selection.affinity = UITextInput.SelectionAffinity.beforeCurrentCharacter;
                        selection.insertionPoint = UITextInput.SelectionInsertionPoint.end;
                    }else{
                        selection.range = JSRange(line.range.end, 0);
                        selection.affinity = UITextInput.SelectionAffinity.afterPreviousCharacter;
                        selection.insertionPoint = UITextInput.SelectionInsertionPoint.end;
                    }
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
        var atomicRange;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            selection.attributes = null;
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
                atomicRange = null;
                if (index > selection.range.location && this.delegate && this.delegate.atomicRangeForTextEditorIndex){
                    atomicRange = this.delegate.atomicRangeForTextEditorIndex(this, index);
                }
                if (atomicRange){
                    selection.range = JSRange(atomicRange);
                    selection.insertionPoint = UITextInput.SelectionInsertionPoint.end;
                    selection.affinity = UITextInput.SelectionAffinity.beforeCurrentCharacter;
                }else{
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
        var range;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            selection.attributes = null;
            if (selection.range.length > 0 && selection.insertionPoint == UITextInput.SelectionInsertionPoint.end){
                range = textStorage.string.rangeForUserPerceivedCharacterAtIndex(selection.range.end - 1);
                if (this.delegate && this.delegate.atomicRangeForTextEditorIndex){
                    range = this.delegate.atomicRangeForTextEditorIndex(this, range.location) || range;
                }
                selection.range.length -= range.length;
            }else{
                if (selection.range.location > 0){
                    range = textStorage.string.rangeForUserPerceivedCharacterAtIndex(selection.range.location - 1);
                    if (this.delegate && this.delegate.atomicRangeForTextEditorIndex){
                        range = this.delegate.atomicRangeForTextEditorIndex(this, range.location) || range;
                    }
                    selection.range = JSRange(range.location, range.length + selection.range.length);
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
        var atomicRange;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            selection.attributes = null;
            if (selection.insertionPoint == UITextInput.SelectionInsertionPoint.start){
                end = selection.range.end;
            }else{
                end = selection.range.location;
            }
            indexOfPreviousWord = textStorage.string.indexOfWordStartBeforeIndex(selection.range.location);
            if (this.delegate && this.delegate.atomicRangeForTextEditorIndex){
                atomicRange = this.delegate.atomicRangeForTextEditorIndex(this, indexOfPreviousWord);
                if (atomicRange){
                    indexOfPreviousWord = atomicRange.location;
                }
            }
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
        var atomicRange;
        var indexOfLineStart;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            selection.attributes = null;
            line = this._lineForSelectionStart(selection);
            atomicRange = null;
            if (line !== null){
                if (selection.insertionPoint == UITextInput.SelectionInsertionPoint.start){
                    end = selection.range.end;
                }else{
                    end = selection.range.location;
                }
                indexOfLineStart = line.range.location;
                if (indexOfLineStart < selection.range.location && this.delegate && this.delegate.atomicRangeForTextEditorIndex){
                    atomicRange = this.delegate.atomicRangeForTextEditorIndex(this, indexOfLineStart);
                    if (atomicRange){
                        indexOfLineStart = atomicRange.location;
                    }
                }
                selection.range = JSRange(indexOfLineStart, end - indexOfLineStart);
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
        var atomicRange;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            selection.attributes = null;
            cursorRect = this._cursorRectForSelection(selection);
            cursorX = cursorRect.origin.x + Math.floor(cursorRect.size.width / 2.0);
            lineEnumerator = this.textLayoutManager.lineEnumerator((selection.insertionPoint == UITextInput.SelectionInsertionPoint.start ? selection.range.location : selection.range.end) - (selection.affinity === UITextInput.SelectionAffinity.afterPreviousCharacter ? 1 : 0));
            line = lineEnumerator.line;
            lineEnumerator.decrement();
            if (lineEnumerator.line !== null){
                lineRect = lineEnumerator.rect;
                pointOnPreviousLine = JSPoint(cursorX, lineRect.origin.y + lineRect.size.height / 2);
                index = this.textLayoutManager.characterIndexAtPoint(pointOnPreviousLine);
                if (this.delegate && this.delegate.atomicRangeForTextEditorIndex){
                    atomicRange = this.delegate.atomicRangeForTextEditorIndex(this, index);
                    if (atomicRange){
                        index = atomicRange.location;
                    }
                }
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
        var range;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            selection.attributes = null;
            if (selection.range.length > 0 && selection.insertionPoint == UITextInput.SelectionInsertionPoint.start){
                range = textStorage.string.rangeForUserPerceivedCharacterAtIndex(selection.range.location);
                if (this.delegate && this.delegate.atomicRangeForTextEditorIndex){
                    range = this.delegate.atomicRangeForTextEditorIndex(this, range.location) || range;
                }
                selection.range.advance(range.length);
            }else{
                if (selection.range.end < textStorage.string.length){
                    range = textStorage.string.rangeForUserPerceivedCharacterAtIndex(selection.range.end);
                    if (this.delegate && this.delegate.atomicRangeForTextEditorIndex){
                        range = this.delegate.atomicRangeForTextEditorIndex(this, range.location) || range;
                    }
                    selection.range = JSRange(selection.range.location, range.length + selection.range.length);
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
        var atomicRange;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            selection.attributes = null;
            if (selection.insertionPoint == UITextInput.SelectionInsertionPoint.start){
                start = selection.range.end;
            }else{
                start = selection.range.location;
            }
            nextWordIndex = textStorage.string.indexOfWordEndAfterIndex(selection.range.end);
            if (nextWordIndex > selection.range.location && this.delegate && this.delegate.atomicRangeForTextEditorIndex){
                atomicRange = this.delegate.atomicRangeForTextEditorIndex(this, nextWordIndex - 1);
                if (atomicRange){
                    nextWordIndex = atomicRange.end;
                }
            }
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
        var atomicRange;
        var indexOfLineEnd;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            selection.attributes = null;
            line = this._lineForSelectionEnd(selection);
            if (selection.insertionPoint == UITextInput.SelectionInsertionPoint.start){
                start = selection.range.end;
            }else{
                start = selection.range.location;
            }
            if (line !== null){
                indexOfLineEnd = line.range.end;
                if (line.range.location > selection.range.location && this.delegate && this.delegate.atomicRangeForTextEditorIndex){
                    atomicRange = this.delegate.atomicRangeForTextEditorIndex(this, indexOfLineEnd - 1);
                    if (atomicRange){
                        indexOfLineEnd = atomicRange.end;
                    }
                }
                var iterator = textStorage.string.userPerceivedCharacterIterator(indexOfLineEnd - 1);
                if (iterator.isMandatoryLineBreak){
                    selection.range = JSRange(start, iterator.index - start);
                    selection.affinity = UITextInput.SelectionAffinity.beforeCurrentCharacter;
                }else{
                    selection.range = JSRange(start, indexOfLineEnd - start);
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
        var atomicRange;
        for (var i = 0, l = this.selections.length; i < l; ++i){
            selection = this.selections[i];
            selection.attributes = null;
            cursorRect = this._cursorRectForSelection(selection);
            cursorX = cursorRect.origin.x + Math.floor(cursorRect.size.width / 2.0);
            lineEnumerator = this.textLayoutManager.lineEnumerator((selection.insertionPoint == UITextInput.SelectionInsertionPoint.start ? selection.range.location : selection.range.end) - (selection.affinity === UITextInput.SelectionAffinity.afterPreviousCharacter ? 1 : 0));
            line = lineEnumerator.line;
            lineEnumerator.increment();
            if (lineEnumerator.line !== null){
                lineRect = lineEnumerator.rect;
                pointOnNextLine = JSPoint(cursorX, lineRect.origin.y + lineRect.size.height / 2);
                index = this.textLayoutManager.characterIndexAtPoint(pointOnNextLine);
                if (this.delegate && this.delegate.atomicRangeForTextEditorIndex){
                    atomicRange = this.delegate.atomicRangeForTextEditorIndex(this, index - 1);
                    if (atomicRange){
                        index = atomicRange.end;
                    }
                }
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
    },

});

})();