// #include "Foundation/CoreTypes.js"
// #include "Foundation/JSObject.js"
// #include "Foundation/JSTextLayoutManager.js"
/* global JSClass, JSObject, JSDynamicProperty, JSTextLayoutManager, JSSize, JSPoint, JSAttributedString, JSLineBreakMode, JSTextAlignment */
'use strict';

JSClass("JSTextContainer", JSObject, {

    size: JSDynamicProperty('_size', JSSize.Zero),
    lineBreakMode: JSDynamicProperty('_lineBreakMode', JSLineBreakMode.WordWrap),
    textAlignment: JSDynamicProperty('_textAlignment', JSTextAlignment.Left),
    textLayoutManager: JSDynamicProperty('_textLayoutManager', null),

    _layoutPoint: JSPoint.Zero,

    initWithSize: function(size){
        this.size = size;
    },

    setSize: function(size){
        this._size = JSSize(size);
        this._notifyLayoutManager();
    },

    setLineBreakMode: function(lineBreakMode){
        this._lineBreakMode = lineBreakMode;
        this._notifyLayoutManager();
    },

    setTextAlignment: function(textAlignment){
        this._textAlignment = textAlignment;
        this._notifyLayoutManager();
    },  

    beginLayout: function(){
        this._layoutPoint = JSPoint.Zero;
    },

    finishLayout: function(){
    },

    layout: function(runCharacters, startIndex, attributes){
        // An attachment should always be a single character with its own attributes
        if (runCharacters.length == 1 && runCharacters.charAt(0) == JSAttributedString.SpecialCharacter.Attachment){
            // TODO: get attachment size & view from layout manager
        }else{
            // TODO: layout any characters that fit in remaining size and advance _layoutPoint
        }
        // TODO: return number of characters that fit
        return 0;
    },

    drawInContextAtPoint: function(context, point){
        this.textLayoutManager.layoutIfNeeded();
    },

    characterIndexAtPoint: function(point){
    },

    rectForCharacterAtIndex: function(index){
    },

    _notifyLayoutManager: function(){
        if (this._textLayoutManager !== null){
            this._textLayoutManager.setNeedsLayout();
        }
    }

});