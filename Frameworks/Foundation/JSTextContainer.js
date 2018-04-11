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
    sizeTracksText: JSDynamicProperty('_sizeTracksText', false),
    framesetter: null,
    textFrame: JSReadOnlyProperty('_textFrame', null),

    initWithSize: function(size){
        this.framesetter = JSTextFramesetter.init();
        this._origin = JSPoint.Zero;
        this._size = JSSize(size);
    },

    hitTest: function(point){
        if (point.x >= 0 && point.x < this.size.width && point.y >= 0 && point.y < this.size.height){
            var line = this.lineAtPoint(point);
            if (line !== null){
                var run = line.runAtPoint(JSPoint(point.x - line.origin.x, point.y - line.origin.y));
                if (run !== null){
                    return run;
                }
            }
            return this;
        }
        return null;
    },

    getRange: function(){
        if (this._textFrame === null){
            return JSSize.Zero;
        }
        return this._textFrame.range;
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
        // TODO: get hit objects from framesetter or frame, use them in hitTest
        if (this._sizeTracksText){
            this.size.height = this._textFrame.size.height;
            if (this._maximumNumberOfLines !== 0){
                this.size.width = this._textFrame.size.width;
            }
        }
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