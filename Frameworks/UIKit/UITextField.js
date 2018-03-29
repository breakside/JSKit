// #import "UIKit/UIView.js"
// #import "UIKit/UITextLayer.js"
// #import "UIKit/UITextEditor.js"
// #import "UIKit/UICursor.js"
// #import "UIKit/UITextAttachmentView.js"
/* global JSClass, JSProtocol, UIView, UICursor, JSRect, JSSize, JSPoint, UITextField, UITextLayer, UITextEditor, UIViewLayerProperty, JSDynamicProperty, JSReadOnlyProperty, JSLazyInitProperty, UILayer, JSColor, JSConstraintBox, JSFont, JSRange, JSTextAlignment, JSLineBreakMode, JSTimer, UIPasteboard, JSTimer, JSTextRun, JSAttributedString, UITextAttachmentView */

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
    selections: JSReadOnlyProperty(),
    delegate: null,
    _textLayer: null,
    _respondingIndicatorLayer: JSLazyInitProperty('_createRespondingIndicatorLayer'),
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
        this._textLayer.textAlignment = JSTextAlignment.left;
        this._textLayer.lineBreakMode = JSLineBreakMode.wordWrap;
        this._textLayer.sizeTracksText = true;
        this._textLayer.maximumNumberOfLines = 1;
        this._localEditor = UITextEditor.initWithTextLayer(this._textLayer);
        this._localEditor.delegate = this;
        this.layer.addSublayer(this._textLayer);
        this.cursor = UICursor.iBeam;
    },

    setEnabled: function(enabled){
        this._enabled = enabled;
        this.cursor = this._enabled ? UICursor.iBeam : null;
    },

    setMultiline: function(multiline){
        this._multiline = multiline;
        this._textLayer.textLayoutManager.includeEmptyFinalLine = multiline;
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
        if (!this._isDragging){
            this._adjustCursorPositionToCenterIfNeeded();
        }
    },

    _adjustCursorPositionToCenterIfNeeded: function(){
        var cursorRect = this.layer.convertRectFromLayer(this._localEditor.insertionRect(), this._textLayer);
        var adjustment = 0;
        if ((cursorRect.origin.x < 0) || ((cursorRect.origin.x + cursorRect.size.width) > this.bounds.size.width)){
            adjustment = this.bounds.size.width / 2.0 - cursorRect.origin.x;
        }
        var origin = JSPoint(this._textLayer.frame.origin.x + adjustment, this._textLayer.frame.origin.y);
        this._adjustTextPositionToOrigin(origin);
    },

    _adjustCursorPositionToVisibleIfNeeded: function(){
        var cursorRect = this.layer.convertRectFromLayer(this._localEditor.insertionRect(), this._textLayer);
        var adjustment = 0;
        if (cursorRect.origin.x < 0){
            adjustment = -cursorRect.origin.x;
        }else if ((cursorRect.origin.x + cursorRect.size.width) > this.bounds.size.width){
            adjustment = this.bounds.size.width - cursorRect.origin.x;
        }
        var origin = JSPoint(this._textLayer.frame.origin.x + adjustment, this._textLayer.frame.origin.y);
        this._adjustTextPositionToOrigin(origin);
    },

    _adjustTextPositionToOrigin: function(origin){
        var size = this._textLayer.frame.size;
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

    hitTest: function(location){
        var locationInTextLayer = this.layer.convertPointToLayer(location, this._textLayer);
        var locationInTextContainer = this._textLayer.convertPointToTextContainer(locationInTextLayer);
        var textObject = this._textLayer.textContainer.hitTest(locationInTextContainer);
        if (textObject !== null && textObject.isKindOfClass(JSTextRun)){
            var attachment = textObject.attributes[JSAttributedString.Attribute.attachment];
            if (attachment !== undefined){
                if (attachment.isKindOfClass(UITextAttachmentView)){
                    return attachment.view;
                }
            }
        }
        return UITextField.$super.hitTest.call(this, location);
    },

    mouseDown: function(event){
        if (!this._enabled){
            return UITextField.$super.mouseDown.call(this, event);
        }
        if (!this.isFirstResponder()){
            this.window.setFirstResponder(this);
        }
        var location = event.locationInView(this);
        this._localEditor.handleMouseDownAtLocation(this.layer.convertPointToLayer(location, this._textLayer), event);
    },

    mouseDragged: function(event){
        if (!this._enabled){
            return UITextField.$super.mouseDragged.call(this, event);
        }
        this._isDragging = true;
        var location = event.locationInView(this);
        this._lastDragLocation = location;
        this._lastDragEvent = event;
        var distanceFromRightEdge = Math.max(0, this.bounds.size.width - location.x);
        if (distanceFromRightEdge < this._boundsScrollThreshold){
            this._boundsScrollDistance = distanceFromRightEdge - this._boundsScrollThreshold;
        }else if (location.x <= this._boundsScrollThreshold){
            this._boundsScrollDistance = this._boundsScrollThreshold - Math.max(location.x, 0);
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
                this._boundsScrollTimer = JSTimer.initWithInterval(this._boundsScrollInterval, true, function(){
                    this._adjustTextPositionToOrigin(JSPoint(this._textLayer.frame.origin.x + this._boundsScrollDistance, this._textLayer.frame.origin.y));
                    this._localEditor.handleMouseDraggedAtLocation(this.layer.convertPointToLayer(this._lastDragLocation, this._textLayer), this._lastDragEvent);
                    this._adjustCursorPositionToVisibleIfNeeded();
                }, this);
                this._boundsScrollTimer.schedule();
            }
        }
        this._localEditor.handleMouseDraggedAtLocation(this.layer.convertPointToLayer(location, this._textLayer), event);
    },

    mouseUp: function(event){
        this._isDragging = false;
        this._lastDragEvent = null;
        this._lastDragLocation = null;
        if (this._boundsScrollTimer !== null){
            this._boundsScrollTimer.invalidate();
            this._boundsScrollTimer = null;
        }
        if (!this._enabled){
            return UITextField.$super.mouseUp.call(this, event);
        }
        var location = event.locationInView(this);
        this._localEditor.handleMouseUpAtLocation(this.layer.convertPointToLayer(location, this._textLayer), event);
    },

    _createRespondingIndicatorLayer: function(){
        var layer = UILayer.init();
        layer.backgroundColor = JSColor.blackColor();
        layer.constraintBox = JSConstraintBox({left: 0, bottom: 0, right: 0, height: 1});
        this.layer.addSublayer(layer);
        return layer;
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