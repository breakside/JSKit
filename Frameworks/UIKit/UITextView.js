// #import "UIView.js"
// #import "UITextLayer.js"
'use strict';

JSClass("UITextView", UIView, {

    enabled: JSDynamicProperty('_enabled', true, 'isEnabled'),
    text: UIViewLayerProperty(),
    attributedText: UIViewLayerProperty(),
    textColor: UIViewLayerProperty(),
    font: UIViewLayerProperty(),
    lineBreakMode: UIViewLayerProperty(),
    textAlignment: UIViewLayerProperty(),

    initWithSpec: function(spec){
        UITextView.$super.initWithSpec.call(this, spec);
        if (spec.containsKey("font")){
            this.font = spec.valueForKey("font", JSFont);
        }
        if (spec.containsKey("text")){
            this.text = spec.valueForKey("text");
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