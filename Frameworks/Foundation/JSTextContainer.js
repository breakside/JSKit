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
    sizeTracksText: JSDynamicProperty('_sizeTracksText', false),
    framesetter: null,
    textFrame: JSReadOnlyProperty('_textFrame', null),

    initWithSize: function(size){
        this.framesetter = JSTextFramesetter.init();
        this._size = JSSize(size);
        this._range = JSRange.Zero;
    },

    setSize: function(size){
        var notify = !this._sizeTracksText || (this._maximumNumberOfLines === 0 && size.width != this._size.width);
        if (size.width != this._size.width || size.height != this._size.height){
            this._size = JSSize(size);
            if (notify){
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

    setSizeTracksText: function(sizeTracksText){
        if (sizeTracksText != this._sizeTracksText){
            this._sizeTracksText = sizeTracksText;
            this._notifyLayoutManager();
        }
    },

    createTextFrame: function(attributedString, range){
        var size = JSSize(this.size);
        if (this._sizeTracksText){
            size.height = 0;
            if (this._maximumNumberOfLines !== 0){
                size.width = 0;
            }
        }
        this.framesetter.attributedString = attributedString;
        this._textFrame = this.framesetter.createFrame(size, range, this._maximumNumberOfLines, this._lineBreakMode, this._textAlignment);
        if (this._sizeTracksText){
            this.size.height = this._textFrame.height;
            if (this._maximumNumberOfLines !== 0){
                this.size.width = this._textFrame.width;
            }
        }
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