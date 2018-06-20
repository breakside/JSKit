// #import "UIKit/UIControl.js"
// #import "UIKit/UITextLayer.js"
// #import "UIKit/UITextEditor.js"
// #import "UIKit/UICursor.js"
// #import "UIKit/UITextAttachmentView.js"
/* global JSClass, JSProtocol, UIControl, UIView, UICursor, JSInsets, JSRect, JSSize, JSPoint, UITextField, UITextLayer, UITextEditor, UIViewLayerProperty, JSDynamicProperty, JSReadOnlyProperty, JSLazyInitProperty, UILayer, JSColor, JSConstraintBox, JSFont, JSRange, JSTextAlignment, JSLineBreakMode, JSTimer, UIPasteboard, JSTimer, JSTextRun, JSAttributedString, UITextAttachmentView, UIControlStyler, UITextFieldStyler, UITextFieldDefaultStyler */

'use strict';

(function(){

JSProtocol("UITextFieldDelegate", JSProtocol, {
    textFieldDidRecieveEnter: ['textField']
});

JSClass("UITextField", UIControl, {

    text: JSDynamicProperty(),
    attributedText: JSDynamicProperty(),
    textColor: JSDynamicProperty(),
    font: JSDynamicProperty(),
    multiline: JSDynamicProperty('_multiline', false, 'isMultiline'),
    minimumHeight: JSDynamicProperty('_minimumHeight', 0),
    selections: JSReadOnlyProperty(),
    textInsets: JSDynamicProperty('_textInsets', null),
    delegate: null,
    _clipView: null,
    _textLayer: null,
    _localEditor: null,
    _boundsScrollThreshold: 7,
    _boundsScrollDistance: 0,
    _boundsScrollInterval: 0.03,
    _boundsScrollTimer: null,
    _lastDragLocation: null,
    _lastDragEvent: null,
    _isDragging: false,

    // TODO: placeholder

    initWithSpec: function(spec, values){
        UITextField.$super.initWithSpec.call(this, spec, values);
        if ("textInsets" in values){
            this.textInsets = JSInsets.apply(undefined, values.textInsets.parseNumberArray());
        }
        if ("font" in values){
            var font = spec.resolvedValue(values.font, "JSFont");
            var descriptor = spec.resolvedValue(font.descriptor, "JSFontDescriptor");
            this.font = JSFont.fontWithDescriptor(descriptor, font.pointSize);
        }
        if ("textColor" in values){
            this.textColor = spec.resolvedValue(values.textColor, "JSColor");
        }
        if ("text" in values){
            this.text = spec.resolvedValue(values.text);
        }
        if ("multiline" in values){
            this.multiline = values.multiline;
        }
        this._minimumHeight = this.bounds.size.height;
    },

    commonUIControlInit: function(){
        UITextField.$super.commonUIControlInit.call(this);
        this._textInsets = JSInsets.Zero;
        this._clipView = UIView.init(this.bounds);
        this._clipView.backgroundColor = null;
        this._clipView.clipsToBounds = true;
        this._textLayer = UITextLayer.init();
        this._textLayer.delegate = this;
        this._textLayer.textAlignment = JSTextAlignment.left;
        this._textLayer.lineBreakMode = JSLineBreakMode.wordWrap;
        this._textLayer.widthTracksText = true;
        this._textLayer.heightTracksText = true;
        this._textLayer.maximumNumberOfLines = 1;
        this._localEditor = UITextEditor.initWithTextLayer(this._textLayer);
        this._localEditor.delegate = this;
        this._clipView.layer.addSublayer(this._textLayer);
        this.addSubview(this._clipView);
        this.cursor = UICursor.iBeam;
        if (this._styler === null){
            this._styler = UITextField.defaultStyler;
        }
        this._styler.initializeControl(this);
    },

    setMultiline: function(multiline){
        this._multiline = multiline;
        this._textLayer.textLayoutManager.includeEmptyFinalLine = multiline;
        this._textLayer.widthTracksText = !multiline;
        this._textLayer.maximumNumberOfLines = multiline ? 0 : 1;
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

    setTextInsets: function(textInsets){
        this._textInsets = textInsets;
        this.setNeedsLayout();
    },

    getTextInsets: function(){
        return this._textInsets;
    },

    getSelections: function(){
        return this._localEditor.selections;
    },

    setSelectionRange: function(range, insertionPoint, affinity){
        this._localEditor.setSelectionRange(range, insertionPoint, affinity);
    },

    setSelectionRanges: function(selectionRanges, insertionPoint, affinity){
        this._localEditor.setSelectionRanges(selectionRanges, insertionPoint, affinity);
    },

    cut: function(){
        this.copy();
        this._localEditor.deleteSelections();
    },

    copy: function(){
        var selection;
        var lines = [];
        for (var i = 0, l = this._localEditor.selections.length; i < l; ++i){
            selection = this._localEditor.selections[i];
            if (selection.range.length > 0){
                lines.push(this.attributedText.string.substringInRange(selection.range));
            }
        }
        if (lines.length > 0){
            var text = lines.join('\n');
            UIPasteboard.general.setValueForType(text, UIPasteboard.ContentType.plainText);
        }
        // TODO: attributed text
    },

    paste: function(){
        // TODO: attributed text
        if (UIPasteboard.general.containsType(UIPasteboard.ContentType.plainText)){
            var text = UIPasteboard.general.valueForType(UIPasteboard.ContentType.plainText);
            this._localEditor.insertText(text);
        }
    },

    layoutSublayersOfLayer: function(layer){
        if (layer === this.layer){
            this.layoutSubviews();
            if (this._multiline){
                this._textLayer.frame = JSRect(this._textLayer.bounds.origin, JSSize(
                    this._clipView.bounds.size.width,
                    this._textLayer.frame.size.height
                ));
            }
        }else if (layer === this._textLayer){
            this._textLayer.layoutSublayers();
            this._localEditor.layout();
        }
    },

    layoutSubviews: function(){
        UITextField.$super.layoutSubviews.call(this);
        this._clipView.frame = this.bounds.rectWithInsets(this._textInsets);
    },

    drawLayerInContext: function(layer, context){
        if (layer === this.layer){
            if (this._styler !== null){
                this._styler.drawControlLayerInContext(this, layer, context);
            }
        }else if (layer === this._textLayer){
            layer.drawInContext(context);
        }
    },

    textEditorDidPositionCursors: function(textEditor){
        if (!this._isDragging){
            this._adjustCursorPositionToCenterIfNeeded();
        }
    },

    _adjustCursorPositionToCenterIfNeeded: function(){
        var clipBounds = this._clipView.bounds;
        var cursorRectInTextLayer = this._localEditor.insertionRect();
        var cursorRect = this._clipView.layer.convertRectFromLayer(cursorRectInTextLayer, this._textLayer);
        if ((cursorRect.origin.x < clipBounds.origin.x) || (cursorRect.origin.x + cursorRect.size.width > clipBounds.origin.x + clipBounds.size.width)){
            this._adjustClipViewOrigin(JSPoint(cursorRect.origin.x - clipBounds.size.width / 2.0, clipBounds.origin.y));
        }
    },

    _adjustCursorPositionToVisibleIfNeeded: function(){
        var clipBounds = this._clipView.bounds;
        var cursorRect = this._clipView.layer.convertRectFromLayer(this._localEditor.insertionRect(), this._textLayer);
        var adjustment = 0;
        if (cursorRect.origin.x < clipBounds.origin.x){
            this._adjustClipViewOrigin(JSPoint(cursorRect.origin.x, clipBounds.origin.y));
        }else if (cursorRect.origin.x + cursorRect.size.width > clipBounds.origin.x + clipBounds.size.width){
            this._adjustClipViewOrigin(JSPoint(cursorRect.origin.x + cursorRect.size.width - clipBounds.size.width, clipBounds.origin.y));
        }
    },

    _adjustClipViewOrigin: function(origin){
        var size = this._textLayer.frame.size;
        if (origin.x > size.width - this._clipView.bounds.size.width){
            origin.x = size.width - this._clipView.bounds.size.width;
        }
        if (origin.x < 0){
            origin.x = 0;
        }
        var newBounds = JSRect(origin, this._clipView.bounds.size);
        if (!this._clipView.bounds.isEqual(newBounds)){
            this._clipView.bounds = newBounds;
        }
    },

    layerDidChangeSize: function(layer){
        if (layer === this._textLayer && this._multiline && ! this.constraintBox){
            this.layer.bounds = JSRect(this.layer.bounds.origin, JSSize(
                this.layer.bounds.size.width,
                Math.max(this._minimumHeight, this._textLayer.bounds.size.height + this._textInsets.top + this._textInsets.bottom)
            ));
            this.setNeedsLayout();
        }
    },

    canBecomeFirstResponder: function(){
        return this.enabled;
    },

    canResignFirstResponder: function(){
        return true;
    },

    becomeFirstResponder: function(){
        this.active = true;
        this._localEditor.didBecomeFirstResponder();
    },

    resignFirstResponder: function(){
        this.active = false;
        this._localEditor.didResignFirstResponder();
    },

    mouseDown: function(event){
        if (!this.enabled){
            return UITextField.$super.mouseDown.call(this, event);
        }
        if (!this.isFirstResponder()){
            this.window.setFirstResponder(this);
        }
        var location = event.locationInView(this);
        this._localEditor.handleMouseDownAtLocation(this.layer.convertPointToLayer(location, this._textLayer), event);
    },

    mouseDragged: function(event){
        if (!this.enabled){
            return UITextField.$super.mouseDragged.call(this, event);
        }
        if (!this._isDragging){
            this.cursor.push();
        }
        this._isDragging = true;
        var location = event.locationInView(this);
        this._lastDragLocation = location;
        this._lastDragEvent = event;
        var distanceFromRightEdge = Math.max(0, this.bounds.size.width - location.x - this._textInsets.right);
        if (distanceFromRightEdge < this._boundsScrollThreshold){
            this._boundsScrollDistance = this._boundsScrollThreshold - distanceFromRightEdge;
        }else if (location.x - this.textInsets.left <= this._boundsScrollThreshold){
            this._boundsScrollDistance = Math.max(location.x - this.textInsets.left, 0) - this._boundsScrollThreshold;
        }else{
            this._boundsScrollDistance = 0;
        }
        if (this._boundsScrollDistance === 0){
            if (this._boundsScrollTimer !== null){
                this._boundsScrollTimer.invalidate();
                this._boundsScrollTimer = null;
            }
        }else{
            if (this._boundsScrollTimer === null){
                this._boundsScrollTimer = JSTimer.scheduledRepeatingTimerWithInterval(this._boundsScrollInterval, function(){
                    this._adjustClipViewOrigin(JSPoint(this._clipView.bounds.origin.x + this._boundsScrollDistance, this._clipView.bounds.origin.y));
                    this._localEditor.handleMouseDraggedAtLocation(this.layer.convertPointToLayer(this._lastDragLocation, this._textLayer), this._lastDragEvent);
                    this._adjustCursorPositionToVisibleIfNeeded();
                }, this);
            }
        }
        this._localEditor.handleMouseDraggedAtLocation(this.layer.convertPointToLayer(location, this._textLayer), event);
    },

    mouseUp: function(event){
        if (this._isDragging){
            this.cursor.pop();
        }
        this._isDragging = false;
        this._lastDragEvent = null;
        this._lastDragLocation = null;
        if (this._boundsScrollTimer !== null){
            this._boundsScrollTimer.invalidate();
            this._boundsScrollTimer = null;
        }
        if (!this.enabled){
            return UITextField.$super.mouseUp.call(this, event);
        }
        var location = event.locationInView(this);
        this._localEditor.handleMouseUpAtLocation(this.layer.convertPointToLayer(location, this._textLayer), event);
    },

    _sanitizedText: function(text){
        if (this._multiline){
            return text.replace('\r\n', ' ').replace(/[\t\r\n\u000B\u000C\u0085\u2028\u2029]/, ' ');
        }
        return text;
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
        this.window.setFirstResponderToKeyViewAfterView(this);
    },

    insertBacktab: function(){
        this.window.setFirstResponderToKeyViewBeforeView(this);
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
        this._localEditor.moveUp();
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
        this._localEditor.moveDown();
    },

    moveToEndOfDocument: function(){
        this._localEditor.moveToEndOfDocument();
    },
    
    moveBackwardAndModifySelection: function(){
        this._localEditor.moveBackwardAndModifySelection();
    },

    moveWordBackwardAndModifySelection: function(){
        this._localEditor.moveWordBackwardAndModifySelection();
    },

    moveToBeginningOfLineAndModifySelection: function(){
        this._localEditor.moveToBeginningOfLineAndModifySelection();
    },

    moveUpAndModifySelection: function(){
        this._localEditor.moveUpAndModifySelection();
    },

    moveToBeginningOfDocumentAndModifySelection: function(){
        this._localEditor.moveToBeginningOfDocumentAndModifySelection();
    },

    moveForwardAndModifySelection: function(){
        this._localEditor.moveForwardAndModifySelection();
    },

    moveWordForwardAndModifySelection: function(){
        this._localEditor.moveWordForwardAndModifySelection();
    },

    moveToEndOfLineAndModifySelection: function(){
        this._localEditor.moveToEndOfLineAndModifySelection();
    },

    moveDownAndModifySelection: function(){
        this._localEditor.moveDownAndModifySelection();
    },

    moveToEndOfDocumentAndModifySelection: function(){
        this._localEditor.moveToEndOfDocumentAndModifySelection();
    },

    selectAll: function(){
        this._localEditor.selectAll();
    }

});

JSClass("UITextFieldStyler", UIControlStyler, {

    localCursorColor: null,

    init: function(){
        this._commonStylerInit();
    },

    initWithSpec: function(spec, values){
        UITextFieldStyler.$super.initWithSpec.call(this, spec, values);
        if ('localCursorColor' in values){
            this.localCursorColor = spec.resolvedValue(values.localCursorColor, "JSColor");
        }
        this._commonStylerInit();
    },

    _commonStylerInit: function(){
        if (this.localCursorColor === null){
            this.localCursorColor = JSColor.initWithRGBA(0, 128/255.0, 255/255.0, 1.0);
        }
    },

    initializeControl: function(textField){
        textField._localEditor.cursorColor = this.localCursorColor;
    }

});

JSClass("UITextFieldDefaultStyler", UITextFieldStyler, {

    showsOverState: false,

    initializeControl: function(textField){
        UITextFieldDefaultStyler.$super.initializeControl.call(this, textField);
        textField.stylerProperties.respondingIndicatorLayer = UILayer.init();
        textField.stylerProperties.respondingIndicatorLayer.backgroundColor = JSColor.blackColor;
        textField.stylerProperties.respondingIndicatorLayer.constraintBox = JSConstraintBox({left: 0, bottom: 0, right: 0, height: 1});
        textField.layer.addSublayer(textField.stylerProperties.respondingIndicatorLayer);
    },

    updateControl: function(textField){
        if (textField.active){
            textField.stylerProperties.respondingIndicatorLayer.backgroundColor = JSColor.blackColor;
        }else{
            textField.stylerProperties.respondingIndicatorLayer.backgroundColor = JSColor.initWithWhite(0.8);
        }
    }

});

JSClass("UITextFieldCustomStyler", UITextFieldStyler, {

});

Object.defineProperties(UITextFieldDefaultStyler, {
    shared: {
        configurable: true,
        get: function UITextFieldDefaultStyler_getShared(){
            var shared = UITextFieldDefaultStyler.init();
            Object.defineProperty(this, 'shared', {value: shared});
            return shared;
        }
    }
});

Object.defineProperties(UITextField, {
    defaultStyler: {
        configurable: true,
        get: function UITextField_getDefaultStyler(){
            Object.defineProperty(UITextField, 'defaultStyler', {writable: true, value: UITextFieldDefaultStyler.shared});
            return UITextField.defaultStyler;
        },
        set: function UITextField_setDefaultStyler(defaultStyler){
            Object.defineProperty(UITextField, 'defaultStyler', {writable: true, value: defaultStyler});
        }
    }
});

})();