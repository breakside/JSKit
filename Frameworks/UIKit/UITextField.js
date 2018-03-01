// #import "UIKit/UIView.js"
// #import "UIKit/UITextLayer.js"
// #import "UIKit/UITextEditor.js"
/* global JSClass, JSProtocol, UIView, JSRect, JSPoint, UITextField, UITextLayer, UITextEditor, UIViewLayerProperty, JSDynamicProperty, JSReadOnlyProperty, JSLazyInitProperty, UILayer, JSColor, JSConstraintBox, JSFont, JSRange, JSTextAlignment, JSLineBreakMode, JSTimer, UIPasteboard */

'use strict';

JSProtocol("UITextFieldDelegate", JSProtocol, {
    textFieldDidRecieveEnter: ['textField']
});

JSClass("UITextField", UIView, {

    enabled: JSDynamicProperty('_enabled', true, 'isEnabled'),
    text: JSDynamicProperty(),
    attributedText: JSDynamicProperty(),
    textColor: JSDynamicProperty(),
    font: JSDynamicProperty(),
    multiline: JSDynamicProperty('_multiline', false, 'isMultiline'),
    delegate: null,
    _textLayer: null,
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
        this.clipsToBounds = true;
        this._textLayer = UITextLayer.init();
        this._textLayer.delegate = this;
        this._textLayer.textAlignment = JSTextAlignment.Left;
        this._textLayer.lineBreakMode = JSLineBreakMode.WordWrap;
        this._textLayer.sizeTracksText = true;
        this._textLayer.maximumNumberOfLines = 1;
        this._localEditor = UITextEditor.initWithTextLayer(this._textLayer);
        this._localEditor.delegate = this;
        this.layer.addSublayer(this._textLayer);
    },

    setMultiline: function(multiline){
        this._multiline = multiline;
        if (this._multiline){
            this._textLayer.maximumNumberOfLines = 0;
        }else{
            this._textLayer.maximumNumberOfLines = 1;
        }
    },

    setText: function(text){
        this._textLayer.text = text;
    },

    getText: function(){
        return this._textLayer.text;
    },

    setAttributedText: function(attributedText){
        this._textLayer.attributedText = attributedText;
    },

    getAttributedText: function(){
        return this._textLayer.attributedText;
    },

    setTextColor: function(textColor){
        this._textLayer.textColor = textColor;
    },

    getTextColor: function(){
        return this._textLayer.textColor;
    },

    setFont: function(font){
        this._textLayer.font = font;
    },

    getFont: function(){
        return this._textLayer.font;
    },

    paste: function(){
        if (UIPasteboard.general.containsType(UIPasteboard.ContentType.plainText)){
            var text = UIPasteboard.general.valueForType(UIPasteboard.ContentType.plainText);
            this._localEditor.insertText(text);
        }
    },

    layoutSublayersOfLayer: function(layer){
        if (layer === this.layer){
            layer.layoutSublayers();
            this._textLayer.frame = layer.bounds;
        }else if (layer === this._textLayer){
            this._textLayer.layoutSublayers();
            this._localEditor.layout();
        }
    },

    textEditorDidPositionCursors: function(){
        this._adjustTextPositionIfNeeded();
    },

    _adjustTextPositionIfNeeded: function(){
        var cursorRect = this.layer.convertRectFromLayer(this._localEditor.insertionRect(), this._textLayer);
        var adjustment = 0;
        if ((cursorRect.origin.x < 0) || ((cursorRect.origin.x + cursorRect.size.width) > this.bounds.size.width)){
            adjustment = this.bounds.size.width / 2.0 - cursorRect.origin.x;
        }
        var size = this._textLayer.frame.size;
        var origin = JSPoint(this._textLayer.frame.origin.x + adjustment, this._textLayer.frame.origin.y);
        if (origin.x + size.width < this.bounds.size.width){
            origin.x = this.bounds.size.width - size.width;
        }
        if (origin.x > 0){
            origin.x = 0;
        }
        var newFrame = JSRect(origin, size);
        if (!this._textLayer.frame.isEqual(newFrame)){
            this._textLayer.frame = newFrame;
        }
    },

    layerDidChangeSize: function(layer){
        if (layer === this._textLayer && this._multiline){
            this.layer.bounds = JSRect(this.layer.bounds.origin, this._textLayer.bounds.size);
            this.setNeedsLayout();
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
        this._localEditor.handleMouseDownAtLocation(this.layer.convertPointToLayer(location, this._textLayer));
    },

    mouseDragged: function(event){
        if (!this._enabled){
            return UITextField.$super.mouseDragged.call(this, event);
        }
        var location = event.locationInView(this);
        this._localEditor.handleMouseDraggedAtLocation(this.layer.convertPointToLayer(location, this._textLayer));
    },

    mouseUp: function(event){
        if (!this._enabled){
            return UITextField.$super.mouseUp.call(this, event);
        }
        var location = event.locationInView(this);
        this._localEditor.handleMouseUpAtLocation(this.layer.convertPointToLayer(location, this._textLayer));
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
        if (this.multiline){
            this._localEditor.insertNewline();
        }else{
            if (this.delegate && this.delegate.textFieldDidRecieveEnter){
                this.delegate.textFieldDidRecieveEnter(this);
            }
        }
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