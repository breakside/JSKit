// #import "UIKit/UILayer.js"
/* global JSClass, JSDynamicProperty, UIDisplayServer, JSTextFrame, JSRect, JSPoint, UILayer, UILayerAnimatedProperty, UITextLayer, JSAttributedString */
'use strict';

JSClass("UITextLayer", UILayer, {
    text: JSDynamicProperty(),
    attributedText: JSDynamicProperty('_attributedText', null),
    textColor: UILayerAnimatedProperty(),
    font: null,
    _textFrame: null,

    init: function(){
        UITextLayer.$super.init.call(this);
        this._attributedText = JSAttributedString.init();
        this._textFrame = JSTextFrame.init();
    },

    didChangeBounds: function(){
        this._textFrame.bounds = JSRect(JSPoint(0, 0), this.model.bounds.size);
        this.setNeedsDisplay();
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

    drawInContext: function(context){
        this._textFrame.drawInContext(context);
    }

});

UITextLayer.Properties = Object.create(UILayer.Properties);
UITextLayer.Properties.textColor = null;