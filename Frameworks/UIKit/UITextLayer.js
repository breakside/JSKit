// #import "UIKit/UILayer.js"
/* global JSClass, JSDynamicProperty, UIDisplayServer, JSTextFrame, JSRect, JSPoint, UILayer, UILayerAnimatedProperty, UITextLayer, JSAttributedString */
'use strict';

// FIXME: find a a good home for this
var UITextAlignment = {
    Left: 0,
    Center: 1,
    Right: 2,
    Justify: 3
};

var UILineBreakMode = {
    NoBreak: 0,
    WordWrap: 1
};

JSClass("UITextLayer", UILayer, {
    text: JSDynamicProperty(),
    attributedText: JSDynamicProperty('_attributedText', null),
    textColor: UILayerAnimatedProperty(),
    textAlignment: JSDynamicProperty('_textAlignment', UITextAlignment.Left),
    font: JSDynamicProperty('_font', null),
    lineBreakMode: JSDynamicProperty('_lineBreakMode', UILineBreakMode.NoBreak),
    _textFrame: null,

    init: function(){
        UITextLayer.$super.init.call(this);
        this._attributedText = JSAttributedString.init();
        this._textFrame = JSTextFrame.init();
    },

    didChangeProperty: function(keyPath){
        UITextLayer.$super.didChangeProperty.call(this, keyPath);
        if (keyPath == 'bounds.size'){
            this._textFrame.bounds = JSRect(JSPoint(0, 0), this.model.bounds.size);
            this.setNeedsDisplay();
        }
    },

    setText: function(text){
        this.setAttributedText(JSAttributedString.initWithString(text));
    },

    getText: function(){
        return this._attributedText.string;
    },

    setAttributedText: function(text){
        this._attributedText = text;
        this._textFrame.attributedText = text;
        this.setNeedsDisplay();
    },

    getAttributedText: function(){
        return this._attributedText;
    },

    setTextAlignment: function(alignment){
        this._textAlignment = alignment;
        this.didChangeProperty('textAlignment');
    },

    getTextAlignment: function(){
        return this._textAlignment;
    },

    setFont: function(font){
        this._font = font;
        this.didChangeProperty('font');
    },

    getFont: function(){
        return this._font;
    },

    setLineBreakMode: function(mode){
        this._lineBreakMode = mode;
        this.didChangeProperty('lineBreakMode');
    },

    getLineBrakeMode: function(){
        return this._lineBreakMode;
    },

    drawInContext: function(context){
        this._textFrame.drawInContext(context);
    }

});

UITextLayer.Properties = Object.create(UILayer.Properties);
UITextLayer.Properties.textColor = null;