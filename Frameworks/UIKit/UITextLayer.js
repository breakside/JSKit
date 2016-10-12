// #import "UIKit/UILayer.js"
/* global JSClass, JSDynamicProperty, UIDisplayServer, UILayer, UILayerAnimatedProperty, UITextLayer, JSAttributedString */
'use strict';

JSClass("UITextLayer", UILayer, {
    text: JSDynamicProperty(),
    attributedText: JSDynamicProperty('_attributedText', null),
    textColor: UILayerAnimatedProperty(),
    font: null,

    init: function(){
        UITextLayer.$super.init.call(this);
        this._attributedText = JSAttributedString.init();
    },

    setText: function(text){
        this.setAttributedText(JSAttributedString.initWithString(text));
    },

    getText: function(){
        return this._attributedText.string;
    },

    setAttributedText: function(text){
        this._attributedText = text;
        UIDisplayServer.defaultServer.setLayerNeedsDisplayForProperty(this, 'attributedText');
    },

    getAttributedText: function(){
        return this._attributedText;
    }

});

UITextLayer.Properties = Object.create(UILayer.Properties);
UITextLayer.Properties.textColor = null;