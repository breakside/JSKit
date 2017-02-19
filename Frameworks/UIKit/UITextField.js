// #import "UIKit/UIView.js"
// #import "UIKit/UITextLayer.js"
/* global JSClass, UIView, UITextField, UITextLayer, UIViewLayerProperty, JSReadOnlyProperty, JSLazyInitProperty, UILayer, JSColor, JSConstraintBox, JSFont */

'use strict';

JSClass("UITextField", UIView, {

    text: UIViewLayerProperty(),
    attributedText: UIViewLayerProperty(),
    textColor: UIViewLayerProperty(),
    font: UIViewLayerProperty(),
    enabled: JSReadOnlyProperty('_enabled', true, 'isEnabled'),
    _respondingIndicatorLayer: JSLazyInitProperty('_createRespondingIndicatorLayer'),

    initWithSpec: function(spec, values){
        UITextField.$super.initWithSpec.call(this, spec, values);
        if ("fontDescriptor" in values){
            var pointSize = 14.0;
            if ("fontSize" in values){
                pointSize = values.fontSize;
            }
            var descriptor = spec.resolvedValue(values.fontDescriptor);
            this.font = JSFont.fontWithDescriptor(descriptor, pointSize);
        }
        if ("text" in values){
            this.text = values.text;
        }
    },

    canBecomeFirstResponder: function(){
        return this._enabled;
    },

    canResignFirstResponder: function(){
        return true;
    },

    becomeFirstResponder: function(){
        // show cursor at insertion point
        this.layer.addSublayer(this._respondingIndicatorLayer);
        return true;
    },

    resignFirstResponder: function(){
        this._respondingIndicatorLayer.removeFromSuperlayer();
        return true;
    },

    mouseDown: function(event){
        // 1. If no selection, set insertion point
        // 2. If selection, and location is on selection, don't change anything
        // 3. If selection, and location is outside selection, set insertion point
        // set selection based on location
        this.window.setFirstResponder(this);
        // TODO: something with a UITextInputServer
    },

    keyDown: function(event){
        this.text = "%d".sprintf(event.keyCode);
    },

    _createRespondingIndicatorLayer: function(){
        var layer = UILayer.init();
        layer.backgroundColor = JSColor.blackColor();
        layer.constraintBox = JSConstraintBox({left: 0, bottom: 0, right: 0, height: 1});
        return layer;
    }

});

UITextField.layerClass = UITextLayer;