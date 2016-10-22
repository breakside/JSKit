// #import "Foundation/JSObject.js"
// #import "Foundation/CoreTypes.js"
/* global JSClass, JSObject, JSRect, JSDynamicProperty, JSAttributedString */
'use strict';

JSClass("JSTextFrame", JSObject, {

    bounds: JSDynamicProperty('_bounds', null),
    attributedText: JSDynamicProperty('_attributedText', null),
    text: JSDynamicProperty(),

    init: function(){
        this._init();
    },

    _init: function(){
        this._bounds = JSRect.Zero;
    },

    getBounds: function(){
        return this._bounds;
    },

    setBounds: function(bounds){
        this._bounds = bounds;
        this.didChangeBounds();
    },

    didChangeBounds: function(){
    },

    getAttributedText: function(){
        return this._attributedText;
    },

    setAttributedText: function(attributedText){
        this._attributedText = attributedText;
        this.didChangeText();
    },

    didChangeText: function(){
    },

    getText: function(){
        return this._attributedText !== null ? this._attributedText.string : null;
    },

    setText: function(text){
        this.setAttributedText(JSAttributedString.initWithString(text));
    },

    drawInContext: function(context){
        this._drawInUnspecifiedContext();
    },

    _drawInUnspecifiedContext: function(context){
    }

});