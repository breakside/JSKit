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
        // show cursor at insertion point
        return true;
    },

    mouseDown: function(event){
        // 1. If no selection, set insertion point
        // 2. If selection, and location is on selection, don't change anything
        // 3. If selection, and location is outside selection, set insertion point
        // set selection based on location
        this.window.setFirstResponder(this);
    },

});

UITextField.layerClass = UITextLayer;