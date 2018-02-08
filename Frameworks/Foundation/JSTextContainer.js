// #include "Foundation/CoreTypes.js"
// #include "Foundation/JSObject.js"
// #include "Foundation/JSTextLayoutManager.js"
// #include "Foundation/JSTextLine.js"
/* global JSClass, JSObject, JSTextLine, JSTextFramesetter, JSDynamicProperty, JSTextLayoutManager, JSSize, JSRect, JSRange, JSPoint, JSReadOnlyProperty, JSAttributedString, JSLineBreakMode, JSTextAlignment */
'use strict';

JSClass("JSTextContainer", JSObject, {

    size: JSDynamicProperty('_size', null),
    range: JSReadOnlyProperty('_range', null),
    lineBreakMode: JSDynamicProperty('_lineBreakMode', JSLineBreakMode.WordWrap),
    textAlignment: JSDynamicProperty('_textAlignment', JSTextAlignment.Left),
    textLayoutManager: JSDynamicProperty('_textLayoutManager', null),
    maximumNumberOfLines: JSDynamicProperty('_maximumNumberOfLines', 0),
    framesetter: null,
    textFrame: JSReadOnlyProperty('_textFrame', null),

    initWithSize: function(size){
        this.framesetter = JSTextFramesetter.init();
        this._size = JSSize(size);
        this._range = JSRange.Zero;
    },

    setSize: function(size){
        if (size.width != this._size.width || size.height != this._size.height){
            this._size = JSSize(size);
            this._notifyLayoutManager();
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
        this._textFrame = this.framesetter.createFrame(this.size, attributedString, range, this._maximumNumberOfLines, this._lineBreakMode, this._textAlignment);
    },

    characterIndexAtPoint: function(point){
        if (this._textFrame !== null){
            var line = this._textFrame.lineContainingPoint(point);
            if (line !== null){
                point = JSPoint(point.x - line.origin.x, point.y - line.origin.y);
                return line.characterIndexAtPoint(point);
            }
        }
        return 0;
    },

    rectForCharacterAtIndex: function(index){
        if (this._textFrame !== null){
            var line = this._textFrame.lineContainingCharacterAtIndex(index);
            if (line !== null){
                var rect = line.rectForCharacterAtIndex(index - line.range.location);
                rect.origin.x += line.origin.x;
                rect.origin.y += line.origin.y;
                return rect;
            }
        }
        // TODO: consider strut line
        return JSRect.Zero;
    },

    _notifyLayoutManager: function(){
        if (this._textLayoutManager !== null){
            this._textLayoutManager.setNeedsLayout();
        }
    }

});