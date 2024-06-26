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

// #import "JSObject.js"
// #import "CoreTypes.js"
// #import "JSAttributedString.js"
// #import "JSColor.js"
// #import "JSParagraphStyle.js"
'use strict';

(function(){

JSClass("JSTextLayoutManager", JSObject, {

    textStorage: JSDynamicProperty('_textStorage', null),
    defaultFont: JSDynamicProperty('_defaultFont', null),
    defaultTextColor: JSDynamicProperty('_defaultTextColor', null),
    defaultParagraphStyle: JSDynamicProperty("_defaultParagraphStyle", null),
    includeEmptyFinalLine: false,

    delegate: null,
    editor: null,

    _textContainers: null,
    _needsLayout: false,

    init: function(){
        this._textContainers = [];
        this._defaultTextColor = JSColor.black;
        this._defaultParagraphStyle = JSParagraphStyle.init();
    },

    // MARK: - Managing Containers

    addTextContainer: function(container){
        this.insertTextContainerAtIndex(container, this._textContainers.length);
    },

    insertTextContainerAtIndex: function(container, index){
        this._textContainers.splice(index, 0, container);
        container.textLayoutManager = this;
    },

    removeTextContainerAtIndex: function(index){
        var container = this._textContainers[index];
        container.textLayoutManager = null;
        this._textContainers.splice(index, 1);
    },

    // MARK: - Managing Storage

    setTextStorage: function(storage){
        this._textStorage = storage;
        if (storage !== null){
            this._temporaryAttributedString = JSAttributedString.initWithString(storage.string);
        }else{
            this._temporaryAttributedString = null;
        }
    },

    replaceTextStorage: function(storage){
        var originalStorage = this._textStorage;
        if (storage === originalStorage){
            return;
        }
        if (originalStorage !== null){
            var managers = originalStorage.layoutManagers;
            originalStorage.removeAllLayoutManagers();
            var manager;
            for (var i = 0, l = managers.length; i < l; ++i){
                manager = managers[i];
                storage.addLayoutManager(manager);
            }
        }else{
            storage.addLayoutManager(this);
        }
        this.setNeedsLayout();
        if (this.editor){
            this.editor.textStorageDidChange();
        }
    },

    // MARK: - Styling

    setDefaultFont: function(font){
        if (font !== this._defaultFont){
            this._defaultFont = font;
            this.setNeedsLayout();
        }
    },

    setDefaultTextColor: function(color){
        if (color === null && this._defaultTextColor === null){
            return;
        }
        if (color !== null && this._defaultTextColor !== null && color.isEqual(this._defaultTextColor)){
            return;
        }
        this._defaultTextColor = color;
        this.setNeedsLayout();
    },

    setDefaultParagraphStyle: function(paragraphStyle){
        this._defaultParagraphStyle = paragraphStyle;
        this.setNeedsLayout();
    },

    // MARK: - Private Helpers for finalizing runs

    effectiveAttributedString: function(){
        var defaultAttributes = {};
        defaultAttributes[JSAttributedString.Attribute.font] = this._defaultFont;
        defaultAttributes[JSAttributedString.Attribute.textColor] = this._defaultTextColor;
        var str = JSAttributedString.initWithAttributedString(this._textStorage, defaultAttributes);
        if (this.includeEmptyFinalLine && str.string.length > 0){
            var iterator  = str.string.userPerceivedCharacterIterator(str.string.length - 1);
            if (iterator.isMandatoryLineBreak){
                // if we add a space after a trailing newline, the browser will
                // draw another line like we want.  Note that a 0x200B zero-width space
                // might be preferred, but it does not cause the browser to draw another line.
                // The regular space is invisible, and as long as the editor knows to ingore
                // anything beyond textStorage.string.length (as it should do anyway),
                // the space will never be revealed by cursor movement or editor behavior.
                str.appendString(" ");
            }
        }
        if (this._temporaryAttributedString !== null){
            var range = JSRange.Zero;
            var l = this._temporaryAttributedString.string.length;
            var attributes;
            do{
                range = this._temporaryAttributedString.rangeOfRunAtIndex(range.end);
                attributes = this._temporaryAttributedString.attributesAtIndex(range.location);
                str.addAttributesInRange(attributes, range);
            }while (range.end < l);
        }
        return str;
    },

    _temporaryAttributedString: null,

    addTemporaryAttributesInRange: function(attributes, range){
        this._temporaryAttributedString.addAttributesInRange(attributes, range);
        this.setNeedsLayout();
    },

    addTemporaryAttributeInRange: function(attribute, value, range){
        this._temporaryAttributedString.addAttributeInRange(attribute, value, range);
        this.setNeedsLayout();
    },

    setTemporaryAttributesInRange: function(attributes, range){
        this._temporaryAttributedString.setAttributesInRange(attributes, range);
        this.setNeedsLayout();
    },

    removeTemporaryAttributeInRange: function(attribute, range){
        this._temporaryAttributedString.removeAttributeInRange(attribute, range);
        this.setNeedsLayout();
    },

    temporaryAttributesAtIndex: function(index){
        return this._temporaryAttributedString.attributesAtIndex(index);
    },

    temporaryAttributeAtIndex: function(attributeName, index){
        return this._temporaryAttributedString.attributeAtIndex(attributeName, index);
    },

    longestRangeOfTemporaryAttributeAtIndex: function(attributeName, index){
        return this._temporaryAttributedString.longestRangeOfAttributeAtIndex(attributeName, index);
    },

    longestRangeOfTemporaryAttributesAtIndex: function(attributeNames, index){
        return this._temporaryAttributedString.longestRangeOfAttributesAtIndex(attributeNames, index);
    },

    // MARK: - Layout

    setNeedsLayout: function(){
        this._needsLayout = true;
        if (this.delegate && this.delegate.layoutManagerDidInvalidateLayout){
            this.delegate.layoutManagerDidInvalidateLayout(this);
        }
    },

    layoutIfNeeded: function(){
        if (this._needsLayout){
            this.layout();
        }
    },

    layout: function(){
        var attributedString = this.effectiveAttributedString();
        var str = attributedString.string;
        var range = JSRange(0, str.length);
        var containerIndex = 0;
        while (containerIndex < this._textContainers.length){
            var container = this._textContainers[containerIndex++];
            container.createTextFrame(attributedString, range);
            range.advance(container.textFrame.range.length);
            if (this.delegate && this.delegate.layoutManagerDidCompleteLayoutForContainer){
                this.delegate.layoutManagerDidCompleteLayoutForContainer(this, container, range.length > 0);
            }
        }
        this._needsLayout = false;
    },

    textStorageDidReplaceCharactersInRange: function(range, insertedLength){
        // TODO: is there a way to be smarter here and only adjust the pieces that have changed?
        this._temporaryAttributedString.replaceCharactersInRangeWithString(range, this._textStorage._string.substringInRange(JSRange(range.location, insertedLength)));
        // Save memory by returning to sharing the underlying string after diverging with the previous edit
        this._temporaryAttributedString._string = this._textStorage._string;
        this.setNeedsLayout();
        if (this.editor){
            this.editor.textStorageDidReplaceCharactersInRange(range, insertedLength);
        }
    },

    textStorageDidChangeAttributesInRange: function(range){
        // TODO: is there a way to be smarter here and only adjust the pieces that have changed?
        this.setNeedsLayout();
    },

    // MARK: - Drawing

    drawContainerInContextAtPoint: function(container, context, point){
        var textFrame = container.textFrame;
        if (textFrame !== null){
            textFrame.drawInContextAtPoint(context, point);
        }
        // TODO: draw attributes like strikethrough and underline
        // html already takes care of these
    },

    // MARK: - Querying Layout

    _textContainerIndexForCharacterAtIndex: function(index){
        // Bail if we have no containers or if the index is outside our container range
        if (this._textContainers.length === 0){
            return -1;
        }
        if (index < this._textContainers[0].range.location){
            return -1;
        }
        // Locate the container that contains the index
        // Using a binary search for efficiency, in case there are a large number of containers
        var min = 0;
        var max = this._textContainers.length - 1;
        var mid;
        var container;
        var i, l;
        while (min < max){
            mid = Math.floor(min + (max - min) / 2);
            container = this._textContainers[mid];
            i = container.range.location;
            l = container.range.length;
            if (index < i){
                max = mid;
            }else if (index >= (i + l)){
                min = mid + 1;
            }else{
                min = max = mid;
            }
        }
        if (min === this._textContainers.length){
            min -= 1;
        }
        return min;
    },

    textContainerForCharacterAtIndex: function(index){
        var containerIndex = this._textContainerIndexForCharacterAtIndex(index);
        if (containerIndex >= 0){
            return this._textContainers[containerIndex];
        }
        return null;
    },

    textContainerAtPoint: function(point){
        var container;
        var pointInContainer;
        for (var i = 0, l = this._textContainers.length; i < l; ++i){
            container = this._textContainers[i];
            pointInContainer = this.convertPointToTextContainer(point, container);
            if (point.x >= 0 && point.x < container.size.width && point.y >= 0 && point.y < container.size.y){
                return container;
            }
        }
        return null;
    },

    rectForCharacterAtIndex: function(index){
        var container = this.textContainerForCharacterAtIndex(index);
        if (container !== null){
            var rect = container.rectForCharacterAtIndex(index);
            return this.convertRectFromTextContainer(rect, container);
        }
        return JSRect.Zero;
    },

    convertRectFromTextContainer: function(rect, container){
        return JSRect(this.convertPointFromTextContainer(rect.origin, container), rect.size);
    },

    convertRectToTextContainer: function(rect, container){
        return JSRect(this.convertPointToTextContainer(rect.origin, container), rect.size);
    },

    convertPointFromTextContainer: function(point, container){
        return JSPoint(point.x + container.origin.x, point.y + container.origin.y);
    },

    convertPointToTextContainer: function(point, container){
        return JSPoint(point.x - container.origin.x, point.y - container.origin.y);
    },

    characterIndexAtPoint: function(point){
        var container = this.textContainerAtPoint(point);
        if (container === null && this.delegate && this.delegate.layoutManagerTextContainerForLocation){
            container = this.delegate.layoutManagerTextContainerForLocation(this, point);
        }
        if (container !== null){
            point = this.convertPointToTextContainer(point, container);
            var index = container.characterIndexAtPoint(point);
            // We may get an index length + 1 due to the way includeEmptyFinalLine
            // is implemented by adding an extra invisible character.
            // Correct to index so the caller isn't affected by this extra char.
            if (index > this.textStorage.string.length){
                index = this.textStorage.string.length;
            }
            return index;
        }
        return 0;
    },

    lineForCharacterAtIndex: function(index){
        var container = this.textContainerForCharacterAtIndex(index);
        if (container !== null){
            return container.lineForCharacterAtIndex(index);
        }
        return null;
    },

    lineEnumerator: function(index){
        return new JSTextLayoutManagerLineEnumerator(this, index);
    },

    rectsForCharacterRange: function(range){
        this.layoutIfNeeded();
        var remainingRange = JSRange(range);
        var rects = [];
        var lineEnumerator = this.lineEnumerator(remainingRange.location);
        var line;
        var container;
        var rect;
        var characterRect;
        var rightX;
        var leftX;
        var iterator;
        while (remainingRange.length > 0 && lineEnumerator.line !== null){
            line = lineEnumerator.line;
            container = lineEnumerator.container;
            if (remainingRange.end >= line.range.end){
                rightX = line.size.width;
                iterator = this.textStorage.string.userPerceivedCharacterIterator(line.range.end - 1);
                if (iterator.isMandatoryLineBreak){
                    rightX += 8;
                }
            }else{
                characterRect = line.rectForCharacterAtIndex(remainingRange.end);
                rightX = characterRect.origin.x;
            }
            if (remainingRange.location === line.range.location){
                leftX = 0;
            }else{
                characterRect = line.rectForCharacterAtIndex(remainingRange.location);
                leftX = characterRect.origin.x;
            }
            rect = JSRect(line.origin.x + leftX, line.origin.y, rightX - leftX, line.size.height);
            if (rect.origin.x < 0){
                rect.size.width += rect.origin.x;
                rect.origin.x = 0;
            }
            if (rect.origin.y < 0){
                rect.size.height += rect.origin.y;
                rect.origin.y = 0;
            }
            if (rect.origin.x + rect.size.width > container.size.width){
                rect.size.width = container.size.width - rect.origin.x;
            }
            if (rect.origin.y + rect.size.height > container.size.height){
                rect.size.height = container.size.height - rect.origin.y;
            }
            if (rect.size.width > 0 && rect.size.height > 0){
                rects.push(this.convertRectFromTextContainer(rect, container));
            }
            remainingRange.advance(line.range.end - remainingRange.location);
            lineEnumerator.increment();
        }
        return rects;
    },

    // TODO: temporary attributes

});

var JSTextLayoutManagerLineEnumerator = function(layoutManager, index){
    if (this === undefined){
        return new JSTextLayoutManagerLineEnumerator(index);
    }
    if (layoutManager instanceof JSTextLayoutManagerLineEnumerator){
        this._layoutManager = layoutManager._layoutManager;
        this._containerIndex = layoutManager._containerIndex;
        this._lineIndex = layoutManager._lineIndex;
    }else{
        if (index === undefined){
            index = 0;
        }
        this._layoutManager = layoutManager;
        this._containerIndex = layoutManager._textContainerIndexForCharacterAtIndex(index);
        var container = this.container;
        if (container !== null){
            this._lineIndex = container.lineIndexForCharacterAtIndex(index);
        }else{
            this._lineIndex = 0;
        }
    }
};

JSTextLayoutManagerLineEnumerator.prototype = {

    _layoutManager: null,
    _containerIndex: 0,
    _lineIndex: 0,

    increment: function(){
        if (this._containerIndex === this._layoutManager._textContainers.length){
            return;
        }
        if (this._containerIndex < 0){
            this._containerIndex = 0;
            this._lineIndex = 0;
        }else{
            this._lineIndex++;
            if (this._lineIndex === this.container.textFrame.lines.length){
                this._lineIndex = 0;
                this._containerIndex++;
            }
        }
    },

    decrement: function(){
        if (this._lineIndex === 0){
            if (this._containerIndex > 0){
                --this._containerIndex;
                this._lineIndex = this.container.textFrame.lines.length - 1;
            }else if (this._containerIndex === 0){
                --this._containerIndex;
            }
        }else{
            --this._lineIndex;
        }
    }

};

Object.defineProperties(JSTextLayoutManagerLineEnumerator.prototype, {
    container: {
        get: function(){
            if (this._containerIndex >= 0 && this._containerIndex < this._layoutManager._textContainers.length){
                return this._layoutManager._textContainers[this._containerIndex];
            }
            return null;
        }
    },

    line: {
        get: function(){
            var container = this.container;
            if (container !== null){
                return container.textFrame.lines[this._lineIndex];
            }
            return null;
        }
    },

    rect: {
        get: function(){
            var container = this.container;
            if (container !== null){
                var line = container.textFrame.lines[this._lineIndex];
                var rect = JSRect(line.origin, line.size);
                return this._layoutManager.convertRectFromTextContainer(rect, container);
            }
            return JSRect.Zero;
        }
    }
});

})();