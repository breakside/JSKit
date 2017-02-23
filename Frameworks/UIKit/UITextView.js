// #imoprt "UIKit/UIView.js"
// #import "UIKit/UITextLayer.js"
/* global JSClass, UIView, UITextLayer, JSDynamicProperty, UITextView, JSFont, UIViewLayerProperty */
'use strict';

JSClass("UITextView", UIView, {

    enabled: JSDynamicProperty('_enabled', true, 'isEnabled'),
    text: UIViewLayerProperty(),
    attributedText: UIViewLayerProperty(),
    textColor: UIViewLayerProperty(),
    font: UIViewLayerProperty(),
    lineBreakMode: UIViewLayerProperty(),
    textAlignment: UIViewLayerProperty(),

    initWithSpec: function(spec, values){
        UITextView.$super.initWithSpec.call(this, spec, values);
        if ("font" in values){
            var descriptor = spec.resolvedValue(values.font.descriptor);
            this.font = JSFont.fontWithDescriptor(descriptor, values.font.pointSize);
        }
        if ("text" in values){
            this.text = values.text;
        }
    },

    // MARK: - UIResponder 

    canBecomeFirstResponder: function(){
        return this._enabled;
    },

    canResignFirstResponder: function(){
        return true;
    },

    becomeFirstResponder: function(){
        // TODO: update visual to indicate focus
    },

    resignFirstResponder: function(){
        // TODO: update visual to indicate no focus
    },

    // MARK: - Mouse Events

    mouseDown: function(event){
        if (!this._enabled){
            return UITextView.$super.mouseDown.call(this, event);
        }
        this.window.setFirstResponder(this);
        if (this.isFirstResponder()){
            var location = event.locationInView(this.view);
            this._localEditor.handleMouseDownAtLocation(location);
        }
    },

    mouseUp: function(event){
        if (!this.window.isFirstResponder()){
            return UITextView.$super.mouseUp.call(this, event);
        }
        var location = event.locationInView(this.view);
        this._localEditor.handleMouseUpAtLocation(location);
    },

    mouseDragged: function(event){
        if (!this.window.isFirstResponder()){
            return UITextView.$super.mouseDragged.call(this, event);
        }
        var location = event.locationInView(this.view);
        this._localEditor.handleMouseDraggedAtLocation(location);
    }

});

UITextView.layerClass = UITextLayer;