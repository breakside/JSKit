// #import "UIKit/UIView.js"
// #import "UIKit/UITextLayer.js"
/* global JSClass, UIView, UITextField, UITextLayer, UIViewLayerProperty, JSReadOnlyProperty */

'use strict';

JSClass("UITextField", UIView, {

    text: UIViewLayerProperty(),
    attributedText: UIViewLayerProperty(),
    textColor: UIViewLayerProperty(),
    font: UIViewLayerProperty(),
    enabled: JSReadOnlyProperty('_enabled', true, 'isEnabled'),

    canBecomeFirstResponder: function(){
        return this._enabled;
    },

    canResignFirstResponder: function(){
        return true;
    },

    becomeFirstResponder: function(){
        // show cursor
        return true;
    },

    mouseDown: function(event){
        // set selection based on location
        this.window.setFirstResponder(this);
    },

});

UITextField.layerClass = UITextLayer;