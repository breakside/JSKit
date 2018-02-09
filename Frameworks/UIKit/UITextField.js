// #import "UIKit/UIView.js"
// #import "UIKit/UITextLayer.js"
// #import "UIKit/UITextEditor.js"
/* global JSClass, JSProtocol, UIView, UITextField, UITextLayer, UITextEditor, UIViewLayerProperty, JSDynamicProperty, JSReadOnlyProperty, JSLazyInitProperty, UILayer, JSColor, JSConstraintBox, JSFont, JSRange, JSTextAlignment, JSLineBreakMode, JSTimer */

'use strict';

JSProtocol("UITextFieldDelegate", JSProtocol, {
    textFieldDidRecieveEnter: ['textField']
});

JSClass("UITextField", UIView, {

    enabled: JSDynamicProperty('_enabled', true, 'isEnabled'),
    text: UIViewLayerProperty(),
    attributedText: UIViewLayerProperty(),
    textColor: UIViewLayerProperty(),
    font: UIViewLayerProperty(),
    delegate: null,
    _respondingIndicatorLayer: JSLazyInitProperty('_createRespondingIndicatorLayer'),
    _localEditor: null,

    // TODO: placeholder

    initWithSpec: function(spec, values){
        UITextField.$super.initWithSpec.call(this, spec, values);
        if ("font" in values){
            var font = spec.resolvedValue(values.font);
            var descriptor = spec.resolvedValue(font.descriptor);
            this.font = JSFont.fontWithDescriptor(descriptor, font.pointSize);
        }
        if ("text" in values){
            this.text = values.text;
        }
    },

    _commonViewInit: function(){
        UITextField.$super._commonViewInit.call(this);
        this.layer.textAlignment = JSTextAlignment.Left;
        this.layer.lineBreakMode = JSLineBreakMode.Clip;
        this._localEditor = UITextEditor.initWithTextLayer(this.layer);
    },

    layoutSublayersOfLayer: function(layer){
        layer.layoutSublayers();
        this._localEditor.layout();
    },

    canBecomeFirstResponder: function(){
        return this._enabled;
    },

    canResignFirstResponder: function(){
        return true;
    },

    becomeFirstResponder: function(){
        // show cursor at insertion point
        this._respondingIndicatorLayer.backgroundColor = JSColor.blackColor();
        this._localEditor.didBecomeFirstResponder();
    },

    resignFirstResponder: function(){
        this._respondingIndicatorLayer.backgroundColor = JSColor.initWithWhite(0.8);
        this._localEditor.didResignFirstResponder();
    },

    mouseDown: function(event){
        if (!this._enabled){
            return UITextField.$super.mouseDown.call(this, event);
        }
        if (!this.isFirstResponder()){
            this.window.setFirstResponder(this);
        }
        var location = event.locationInView(this);
        this._localEditor.handleMouseDownAtLocation(location);
    },

    mouseDragged: function(event){
        if (!this._enabled){
            return UITextField.$super.mouseDragged.call(this, event);
        }
        var location = event.locationInView(this);
        this._localEditor.handleMouseDraggedAtLocation(location);
    },

    mouseUp: function(event){
        if (!this._enabled){
            return UITextField.$super.mouseUp.call(this, event);
        }
        var location = event.locationInView(this);
        this._localEditor.handleMouseUpAtLocation(location);
    },

    _createRespondingIndicatorLayer: function(){
        var layer = UILayer.init();
        layer.backgroundColor = JSColor.blackColor();
        layer.constraintBox = JSConstraintBox({left: 0, bottom: 0, right: 0, height: 1});
        this.layer.addSublayer(layer);
        return layer;
    },

    _sanitizedText: function(text){
        return text.replace('\r\n', ' ').replace('\r', ' ').replace('\n', ' ');
    },

    // MARK: - UITextInput protocol

    insertText: function(text){
        text = this._sanitizedText(text);
        this._localEditor.insertText(text);
    },

    insertNewline: function(){
        this._localEditor.insertNewline();
        // if (this.delegate && this.delegate.textFieldDidRecieveEnter){
        //     this.delegate.textFieldDidRecieveEnter(this);
        // }
    },

    insertTab: function(){
        this.window.setFirstReponderToKeyViewAfterView(this);
    },

    insertBacktab: function(){
        this.window.setFirstReponderToKeyViewBeforeView(this);
    },

    deleteBackward: function(){
        this._localEditor.deleteBackward();
    },

    deleteWordBackward: function(){
        this._localEditor.deleteWordBackward();
    },

    deleteToBeginningOfLine: function(){
        this._localEditor.deleteToBeginningOfLine();
    },

    deleteToBeginningOfDocument: function(){
        this._localEditor.deleteToBeginningOfDocument();
    },

    deleteForward: function(){
        this._localEditor.deleteForward();
    },

    deleteWordForward: function(){
        this._localEditor.deleteForward();
    },

    deleteToEndOfLine: function(){
        this._localEditor.deleteToEndOfLine();
    },

    deleteToEndOfDocument: function(){
        this._localEditor.deleteToEndOfDocument();
    },

    
    moveBackward: function(){
        this._localEditor.moveBackward();
    },

    moveWordBackward: function(){
        this._localEditor.moveWordBackward();
    },

    moveToBeginningOfLine: function(){
        this._localEditor.moveToBeginningOfLine();
    },

    moveUp: function(){
        this.moveToBeginningOfDocument();
    },

    moveToBeginningOfDocument: function(){
        this._localEditor.moveToBeginningOfDocument();
    },

    moveForward: function(){
        this._localEditor.moveForward();
    },

    moveWordForward: function(){
        this._localEditor.moveWordForward();
    },

    moveToEndOfLine: function(){
        this._localEditor.moveToEndOfLine();
    },

    moveDown: function(){
        this.moveToEndOfDocument();
    },

    moveToEndOfDocument: function(){
        this._localEditor.moveToEndOfDocument();
    },

    
    moveBackwardAndExtendSelection: function(){
        this._localEditor.moveBackwardAndExtendSelection();
    },

    moveWordBackwardAndExtendSelection: function(){
        this._localEditor.moveWordBackwardAndExtendSelection();
    },

    moveToBeginningOfLineAndExtendSelection: function(){
        this._localEditor.moveToBeginningOfLineAndExtendSelection();
    },

    moveUpAndExtendSelection: function(){
        this.moveToBeginningOfDocumentAndExtendSelection();
    },

    moveToBeginningOfDocumentAndExtendSelection: function(){
        this._localEditor.moveToBeginningOfDocumentAndExtendSelection();
    },

    moveForwardAndExtendSelection: function(){
        this._localEditor.moveForwardAndExtendSelection();
    },

    moveWordForwardAndExtendSelection: function(){
        this._localEditor.moveWordForwardAndExtendSelection();
    },

    moveToEndOfLineAndExtendSelection: function(){
        this._localEditor.moveToEndOfLineAndExtendSelection();
    },

    moveDownAndExtendSelection: function(){
        this.moveToEndOfDocumentAndExtendSelection();
    },

    moveToEndOfDocumentAndExtendSelection: function(){
        this._localEditor.moveToEndOfDocumentAndExtendSelection();
    },

    selectAll: function(){
        this._localEditor.selectAll();
    }

});

UITextField.layerClass = UITextLayer;