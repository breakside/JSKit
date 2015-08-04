// #import "UIKit/UILayer.js"
/* global JSClass, JSDynamicProperty, UIRenderer, UILayer, UILayerAnimatedProperty, UITextLayer */
'use strict';

JSClass("UITextLayer", UILayer, {
    text: JSDynamicProperty('_text', ''),
    textColor: UILayerAnimatedProperty(),
    font: null,

    setText: function(text){
        this._text = text;
        UIRenderer.defaultRenderer.setLayerNeedsRenderForKeyPath(this, 'text');
    },

    getText: function(){
        return this._text;
    }
});

UITextLayer.Properties = Object.create(UILayer.Properties);
UITextLayer.Properties.textColor = null;