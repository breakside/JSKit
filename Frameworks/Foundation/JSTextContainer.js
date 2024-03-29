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

// #import "CoreTypes.js"
// #import "JSObject.js"
// #import "JSTextLayoutManager.js"
// #import "JSTextFramesetter.js"
'use strict';

(function(){

var logger = JSLog("foundation", "text");

JSClass("JSTextContainer", JSObject, {

    origin: JSDynamicProperty('_origin', JSPoint.Zero),
    size: JSDynamicProperty('_size', null),
    range: JSReadOnlyProperty(),
    textLayoutManager: JSDynamicProperty('_textLayoutManager', null),
    maximumNumberOfLines: JSDynamicProperty('_maximumNumberOfLines', 0),
    framesetter: null,
    textFrame: JSReadOnlyProperty('_textFrame', null),

    initWithSize: function(size){
        this.framesetter = JSTextFramesetter.init();
        this._origin = JSPoint.Zero;
        this._size = JSSize(size);
    },

    getRange: function(){
        if (this._textFrame === null){
            return JSSize.Zero;
        }
        return this._textFrame.range;
    },

    setSize: function(size){
        if (size.width != this._size.width || size.height != this._size.height){
            this._size = JSSize(size);
            if (!this._textFrame){
                // If we don't have a frame yet, then we need to do a full layout
                this._notifyLayoutManager();
            }else{
                // If we have a frame and its size is changing, we *may* need to do a new layout
                if (size.width != this._textFrame.size.width || size.height != this._textFrame.size.height){
                    var shouldNotify = true;
                    // If we are a single line label and we have all of the string, we *may not* need to do a new layout
                    if (this._maximumNumberOfLines == 1 && this._textFrame.range.location === 0 && this._textFrame.range.length >= this._textLayoutManager.textStorage.string.length){
                        // If the new size can still fit the entire layout, then no need to do a new layout manager layout
                        if (size.width < Number.MAX_VALUE && size.height < Number.MAX_VALUE && size.width >= this._textFrame.usedSize.width && size.height >= this._textFrame.usedSize.height){
                            // Text frame can do a shortcut update by trimming excess size without affecting truncation
                            shouldNotify = false;
                            this.framesetter._resizeFrame(this._textFrame, size);
                        }
                    }
                    if (shouldNotify){
                        this._notifyLayoutManager();
                    }
                }
            }
        }
    },

    setOrigin: function(origin){
        this._origin = JSPoint(origin);
    },

    setMaximumNumberOfLines: function(maxLines){
        if (maxLines != this._maximumNumberOfLines){
            this._maximumNumberOfLines = maxLines;
            this._notifyLayoutManager();
        }
    },

    createTextFrame: function(attributedString, range){
        this.framesetter.attributedString = attributedString;
        this.framesetter.defaultParagraphStyle = this._textLayoutManager.defaultParagraphStyle;
        this._textFrame = this.framesetter.createFrame(this.size, range, this._maximumNumberOfLines);
    },

    characterIndexAtPoint: function(point){
        var line = this.lineAtPoint(point);
        if (line !== null){
            point = JSPoint(point.x - line.origin.x, point.y - line.origin.y);
            return line.characterIndexAtPoint(point);
        }
        return 0;
    },

    rectForCharacterAtIndex: function(index, useLineHeight){
        var line = this.lineForCharacterAtIndex(index);
        if (line !== null){
            var rect = line.rectForCharacterAtIndex(index);
            if (useLineHeight){
                rect.origin.y = line.origin.y;
                rect.size.height = line.size.height;
            }else{
                rect.origin.x += line.origin.x;
                rect.origin.y += line.origin.y;
            }
            return rect;
        }
        return JSRect.Zero;
    },

    lineIndexForCharacterAtIndex: function(index){
        if (this._textFrame === null){
            return null;
        }
        return this._textFrame.lineIndexForCharacterAtIndex(index);
    },

    lineForCharacterAtIndex: function(index){
        if (this._textFrame === null){
            return null;
        }
        return this._textFrame.lineForCharacterAtIndex(index);
    },

    lineAtPoint: function(point){
        if (this._textFrame === null){
            return null;
        }
        return this._textFrame.lineAtPoint(point);
    },

    rectForLine: function(line){
        return this._textFrame.rectForLine(line);
    },

    _notifyLayoutManager: function(){
        if (this._textLayoutManager !== null){
            this._textLayoutManager.setNeedsLayout();
        }
    },

    // MARK: - Deprecated

    lineBreakMode: JSDynamicProperty(),

    getLineBreakMode: function(){
        logger.warn("JSTextContainer.lineBreakMode is deprecated");
        return this._textLayoutManager.defaultParagraphStyle.lineBreakMode;
    },

    setLineBreakMode: function(lineBreakMode){
        logger.warn("JSTextContainer.lineBreakMode is deprecated");
        this._textLayoutManager.defaultParagraphStyle = this._textLayoutManager.defaultParagraphStyle.styleWithAttributes({lineBreakMode: lineBreakMode});
    },

    textAlignment: JSDynamicProperty(),

    getTextAlignment: function(){
        logger.warn("JSTextContainer.textAlignment is deprecated");
        return this._textLayoutManager.defaultParagraphStyle.textAlignment;
    },

    setTextAlignment: function(textAlignment){
        logger.warn("JSTextContainer.textAlignment is deprecated");
        this._textLayoutManager.defaultParagraphStyle = this._textLayoutManager.defaultParagraphStyle.styleWithAttributes({textAlignment: textAlignment});
    },

    lineSpacing: JSDynamicProperty(),

    getLineSpacing: function(){
        logger.warn("JSTextContainer.lineSpacing is deprecated");
        return this._textLayoutManager.defaultParagraphStyle.lineSpacing;
    },

    setLineSpacing: function(lineSpacing){
        logger.warn("JSTextContainer.lineSpacing is deprecated");
        this._textLayoutManager.defaultParagraphStyle = this._textLayoutManager.defaultParagraphStyle.styleWithAttributes({lineSpacing: lineSpacing});
    },

    minimumLineHeight: JSDynamicProperty(),

    getMinimumLineHeight: function(){
        logger.warn("JSTextContainer.minimumLineHeight is deprecated");
        return this._textLayoutManager.defaultParagraphStyle.minimumLineHeight;
    },

    setMinimumLineHeight: function(minimumLineHeight){
        logger.warn("JSTextContainer.minimumLineHeight is deprecated");
        this._textLayoutManager.defaultParagraphStyle = this._textLayoutManager.defaultParagraphStyle.styleWithAttributes({minimumLineHeight: minimumLineHeight});
    },

});

})();