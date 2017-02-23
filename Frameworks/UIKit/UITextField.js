// #import "UIKit/UIView.js"
// #import "UIKit/UITextLayer.js"
// #import "UIKit/UITextEditor.js"
/* global JSClass, UIView, UITextField, UITextLayer, UIViewLayerProperty, JSDynamicProperty, JSReadOnlyProperty, JSLazyInitProperty, UILayer, JSColor, JSConstraintBox, JSFont, JSRange, JSTextAlignment, JSLineBreakMode */

'use strict';

JSClass("UITextField", UIView, {

    enabled: JSDynamicProperty('_enabled', true, 'isEnabled'),
    text: UIViewLayerProperty(),
    attributedText: UIViewLayerProperty(),
    textColor: UIViewLayerProperty(),
    font: UIViewLayerProperty(),
    _respondingIndicatorLayer: JSLazyInitProperty('_createRespondingIndicatorLayer'),
    _localEditor: null,

    initWithSpec: function(spec, values){
        UITextField.$super.initWithSpec.call(this, spec, values);
        if ("font" in values){
            var descriptor = spec.resolvedValue(values.font.descriptor);
            this.font = JSFont.fontWithDescriptor(descriptor, values.font.pointSize);
        }
        if ("text" in values){
            this.text = values.text;
        }
    },

    _commonViewInit: function(){
        UITextField.$super._commonViewInit.call(this);
        this.layer.textAlignment = JSTextAlignment.Left;
        this.layer.lineBreakMode = JSLineBreakMode.Clip;
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
    },

    resignFirstResponder: function(){
        this._respondingIndicatorLayer.removeFromSuperlayer();
    },

    mouseDown: function(event){
        if (!this._enabled) return;
        if (!this.isFirstResponder()){
            this.window.setFirstResponder(this);
        }
        var location = event.locationInView(this);
        this._localEditor.handleMouseDownAtLocation(location);
    },

    mouseDragged: function(event){
        var location = event.locationInView(this);
        this._localEditor.handMouseDraggedAtLocation(location);
    },

    mouseUp: function(event){
        var location = event.locationInView(this);
        this._localEditor.handleMouseUpAtLocation(location);
    },

    _createRespondingIndicatorLayer: function(){
        var layer = UILayer.init();
        layer.backgroundColor = JSColor.blackColor();
        layer.constraintBox = JSConstraintBox({left: 0, bottom: 0, right: 0, height: 1});
        return layer;
    },

    // MARK: - UITextInput protocol

    insertText: function(text){
        // TODO: sanitize text by replacing newlines with spaces
        this._localEditor.insertText(text);
        this.setNeedsDisplay();
    },

    insertNewline: function(){
    },

    insertTab: function(){
    },

    insertBacktab: function(){
    },

    deleteBackward: function(){
        this._localEditor.deleteBackward();
        this.setNeedsDisplay();
    },

    deleteToWordStart: function(){
    },

    deleteToLineStart: function(){
    },

    deleteToPreviousLine: function(){
    },

    deleteToDocumentStart: function(){
    },

    deleteForward: function(){
    },

    deleteToWordEnd: function(){
    },

    deleteToLineEnd: function(){
    },

    deleteToNextLine: function(){
    },

    deleteToDocumentEnd: function(){
    },

    selectBackward: function(){
    },

    selectToWordStart: function(){
    },

    selectToLineStart: function(){
    },

    selectToPreviousLine: function(){
    },

    selectToDocumentStart: function(){
    },

    selectForward: function(){
    },

    selectToWordEnd: function(){
    },

    selectToLineEnd: function(){
    },

    selectToNextLine: function(){
    },

    selectToDocumentEnd: function(){
    }

});

UITextField.layerClass = UITextLayer;