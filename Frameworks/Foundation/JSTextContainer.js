// #import "Foundation/CoreTypes.js"
// #import "Foundation/JSObject.js"
// #import "Foundation/JSTextLayoutManager.js"
// #import "Foundation/JSTextFramesetter.js"
/* global JSClass, JSObject, JSTextFramesetter, JSDynamicProperty, JSTextLayoutManager, JSSize, JSRect, JSRange, JSPoint, JSReadOnlyProperty, JSLineBreakMode, JSTextAlignment, JSAttributedString */
'use strict';

JSClass("JSTextContainer", JSObject, {

    origin: JSDynamicProperty('_origin', JSPoint.Zero),
    size: JSDynamicProperty('_size', null),
    range: JSReadOnlyProperty(),
    lineBreakMode: JSDynamicProperty('_lineBreakMode', JSLineBreakMode.wordWrap),
    textAlignment: JSDynamicProperty('_textAlignment', JSTextAlignment.left),
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
            // Only notify the layout manager if we're actually change frame size
            // The frame size can be different from our size if we were sized without
            // constraints, and are now being sized to match the result
            if (!this._textFrame || size.width != this._textFrame.size.width || size.height != this._textFrame.size.height){
                this._notifyLayoutManager();
            }
        }
    },

    setLineBreakMode: function(lineBreakMode){
        if (lineBreakMode != this._lineBreakMode){
            this._lineBreakMode = lineBreakMode;
            this._notifyLayoutManager();
        }
    },

    setTextAlignment: function(textAlignment){
        this._textAlignment = textAlignment;
        // TODO: update lines
    },

    setMaximumNumberOfLines: function(maxLines){
        if (maxLines != this._maximumNumberOfLines){
            this._maximumNumberOfLines = maxLines;
            this._notifyLayoutManager();
        }
    },

    createTextFrame: function(attributedString, range){
        this.framesetter.attributedString = attributedString;
        var paragraphAttributes = {};
        paragraphAttributes[JSAttributedString.Attribute.lineBreakMode] = this._lineBreakMode;
        paragraphAttributes[JSAttributedString.Attribute.textAlignment] = this._textAlignment;
        this._textFrame = this.framesetter.createFrame(this.size, range, this._maximumNumberOfLines, paragraphAttributes);
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
            var rect = line.rectForCharacterAtIndex(index - (line.range.location - this._textFrame.range.location));
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
    }

});