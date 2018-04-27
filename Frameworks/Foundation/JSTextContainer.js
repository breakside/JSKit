// #import "Foundation/CoreTypes.js"
// #import "Foundation/JSObject.js"
// #import "Foundation/JSTextLayoutManager.js"
// #import "Foundation/JSTextFramesetter.js"
/* global JSClass, JSObject, JSTextFramesetter, JSCustomProperty, JSDynamicProperty, JSTextLayoutManager, JSSize, JSRect, JSRange, JSPoint, JSReadOnlyProperty, JSLineBreakMode, JSTextAlignment, JSAttributedString */
'use strict';

(function(){

var JSTextContainerAttributeProperty = function(){
    if (this === undefined){
        return new JSTextContainerAttributeProperty();
    }
};

JSTextContainerAttributeProperty.prototype = Object.create(JSCustomProperty.prototype);

JSTextContainerAttributeProperty.prototype.define = function(C, key, extensions){
    Object.defineProperty(C.prototype, key, {
        configurable: false,
        enumerable: false,
        set: function JSTextContainer_setAttributeProperty(value){
            this.framesetter.attributes[key] = value;
            this._notifyLayoutManager();
        },
        get: function JSTextContainer_getAttributeProperty(){
            return this.framesetter.attributes[key];
        }
    });
};

JSClass("JSTextContainer", JSObject, {

    origin: JSDynamicProperty('_origin', JSPoint.Zero),
    size: JSDynamicProperty('_size', null),
    range: JSReadOnlyProperty(),
    lineBreakMode: JSTextContainerAttributeProperty(),
    textAlignment: JSTextContainerAttributeProperty(),
    lineSpacing: JSTextContainerAttributeProperty(),
    minimumLineHeight: JSTextContainerAttributeProperty(),
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
            // NOTE: If we're being sized up, and we already have all of the string in our frame,
            // no layout is needed.
            if (!this._textFrame){
                this._notifyLayoutManager();
            }else{
                if (size.width != this._textFrame.size.width || size.height != this._textFrame.size.height){
                    if (!(size.width >= this._textFrame.size.width && size.height >= this._textFrame.size.height && this._textFrame.range.location === 0 && this._textFrame.range.length >= this._textLayoutManager.textStorage.string.length)){
                        this._notifyLayoutManager();
                    }
                }
            }
        }
    },

    setMaximumNumberOfLines: function(maxLines){
        if (maxLines != this._maximumNumberOfLines){
            this._maximumNumberOfLines = maxLines;
            this._notifyLayoutManager();
        }
    },

    createTextFrame: function(attributedString, range){
        this.framesetter.attributedString = attributedString;
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

})();