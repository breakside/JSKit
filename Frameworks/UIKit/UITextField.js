// #import "UIKit/UIControl.js"
// #import "UIKit/UITextLayer.js"
// #import "UIKit/UITextEditor.js"
// #import "UIKit/UICursor.js"
// #import "UIKit/UITextAttachmentView.js"
// #import "UIKit/UIImageView.js"
/* global JSClass, JSProtocol, UIControl, UIView, UICursor, JSInsets, JSRect, JSSize, JSPoint, UITextField, UITextLayer, UITextEditor, UIViewLayerProperty, JSDynamicProperty, JSReadOnlyProperty, JSLazyInitProperty, UILayer, JSColor, JSFont, JSRange, JSTextAlignment, JSLineBreakMode, JSTimer, UIPasteboard, JSTimer, JSTextRun, JSAttributedString, UITextAttachmentView, UIControlStyler, UITextFieldStyler, UITextFieldDefaultStyler, UIImageView, JSImage, UITextFieldCustomStyler */

'use strict';

(function(){

JSProtocol("UITextFieldDelegate", JSProtocol, {
    textFieldDidReceiveEnter: ['textField'],
    textFieldDidChange: ['textField']
});

JSClass("UITextField", UIControl, {

    // --------------------------------------------------------------------
    // MARK: - Creating a Text Field
    
    _localEditor: null,
    _clipView: null,
    _textLayer: null,

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
        if ('leftImage' in values){
            this.leftImage = JSImage.initWithResourceName(values.leftImage, spec.bundle);
        }else if ('leftAccessoryView' in values){
            this.leftAccessoryView = spec.resolvedValue(values.leftAccessoryView);
        }
        if ('leftAccessorySize' in values){
            this.leftAccessorySize = JSSize.apply(undefined, values.leftAccessorySize.parseNumberArray());
        }
        if ('leftAccessoryInsets' in values){
            this.leftAccessoryInsets = JSInsets.apply(undefined, values.leftAccessoryInsets.parseNumberArray());
        }
        if ('leftAccessoryVisibility' in values){
            this.leftAccessoryVisibility = spec.resolvedValue(values.leftAccessoryVisibility);
        }
        if ('rightImage' in values){
            this.rightImage = JSImage.initWithResourceName(values.rightImage, spec.bundle);
        }else if ('rightAccessoryView' in values){
            this.rightAccessoryView = spec.resolvedValue(values.rightAccessoryView);
        }
        if ('rightAccessorySize' in values){
            this.rightAccessorySize = JSSize.apply(undefined, values.rightAccessorySize.parseNumberArray());
        }
        if ('rightAccessoryInsets' in values){
            this.rightAccessoryInsets = JSInsets.apply(undefined, values.rightAccessoryInsets.parseNumberArray());
        }
        if ('rightAccessoryVisibility' in values){
            this.rightAccessoryVisibility = spec.resolvedValue(values.rightAccessoryVisibility);
        }
        if ('placeholder' in values){
            this.placeholder = spec.resolvedValue(values.placeholder);
        }
        if ('placeholderColor' in values){
            this.placeholderColor = spec.resolvedValue(values.placeholderColor, "JSColor");
        }
        if ('delegate' in values){
            this.delegate = spec.resolvedValue(values.delegate);
        }
        if ('secureEntry' in values){
            this.secureEntry = spec.resolvedValue(values.secureEntry);
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
        this._clipView.cursor = UICursor.iBeam;
        if (this._styler === null){
            this._styler = UITextField.defaultStyler;
        }
        this._styler.initializeControl(this);
    },

    // --------------------------------------------------------------------
    // MARK: - Delegate

    delegate: null,

    // --------------------------------------------------------------------
    // MARK: - Text Content

    text: JSDynamicProperty(),
    attributedText: JSDynamicProperty(),

    setText: function(text){
        if (this._secureEntry){
            this._textLayer.attributedText = JSAttributedString.initWithString(text, {"maskCharacter": this._secureEntryMaskCharacter});
        }else{
            this._textLayer.text = text;
        }
        this._updatePlaceholderHidden();
    },

    getText: function(){
        return this._textLayer.text;
    },

    setAttributedText: function(attributedText){
        if (this._secureEntry){
            this.setText(attributedText.string);
            return;
        }
        this._textLayer.attributedText = attributedText;
        this._updatePlaceholderHidden();
    },

    getAttributedText: function(){
        return this._textLayer.attributedText;
    },

    isEmpty: function(){
        return !this._textLayer.hasText();
    },

    // --------------------------------------------------------------------
    // MARK: - Placeholder

    placeholder: JSDynamicProperty('_placeholder', null),
    placeholderColor: JSDynamicProperty('_placeholderColor', null),

    setPlaceholder: function(placeholder){
        if (this._placeholderTextLayer === null){
            this._createPlaceholderTextLayer();
        }
        this._placeholderTextLayer.text = placeholder;
        this._updatePlaceholderHidden();
    },

    getPlaceholder: function(){
        if (!this._placeholderTextLayer){
            return null;
        }
        return this._placeholderTextLayer.text;
    },

    setPlaceholderColor: function(color){
        this._placeholderColor = color;
        if (this._placeholderTextLayer !== null){
            this._placeholderTextLayer.textColor = this._placeholderColor;
        }
    },

    _createPlaceholderTextLayer: function(){
        this._placeholderTextLayer = UITextLayer.init();
        this._placeholderTextLayer.delegate = this;
        this._placeholderTextLayer.textAlignment = this._textLayer.textAlignment;
        this._placeholderTextLayer.lineBreakMode = JSLineBreakMode.truncateTail;
        this._placeholderTextLayer.maximumNumberOfLines = 1;
        this._placeholderTextLayer.font = this._textLayer.font;
        if (this._placeholderColor === null){
            this._createPlaceholderColor();
        }
        this._placeholderTextLayer.textColor = this._placeholderColor;
        this._clipView.layer.insertSublayerBeforeSibling(this._placeholderTextLayer, this._textLayer);
    },

    _createPlaceholderColor: function(){
        var backgroundColor = this.backgroundColor;
        if (backgroundColor === null){
            backgroundColor = JSColor.whiteColor;
        }
        this._placeholderColor = backgroundColor.colorByBlendingColor(this.textColor, 0.3);
    },

    _placeholderTextLayer: null,

    _isShowingPlaceholder: false,

    _updatePlaceholderHidden: function(){
        if (this._isShowingPlaceholder && !this._shouldShowPlaceholder()){
            this._placeholderTextLayer.hidden = true;
            this._isShowingPlaceholder = false;
        }else if (!this._isShowingPlaceholder && this._shouldShowPlaceholder()){
            this._placeholderTextLayer.hidden = false;
            this._isShowingPlaceholder = true;
        }
    },

    _shouldShowPlaceholder: function(){
        return this._placeholderTextLayer !== null && !this._textLayer.hasText();
    },

    // --------------------------------------------------------------------
    // MARK: - Secure Entry

    secureEntry: JSDynamicProperty('_secureEntry', false),
    _secureEntryMaskCharacter: "\u25CF",

    setSecureEntry: function(secureEntry){
        this._secureEntry = secureEntry;
        var attributedText = this._textLayer.attributedText;
        var range = JSRange(0, attributedText.string.length);
        var attr = JSAttributedString.Attribute.maskCharacter;
        if (secureEntry){
            attributedText.addAttributeInRange(attr, this._secureEntryMaskCharacter, range);
        }else{
            attributedText.removeAttributeInRange(attr, range);
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Styling

    textColor: JSDynamicProperty(),
    font: JSDynamicProperty(),

    setTextColor: function(textColor){
        this._textLayer.textColor = textColor;
    },

    getTextColor: function(){
        return this._textLayer.textColor;
    },

    setFont: function(font){
        this._textLayer.font = font;
        if (this._placeholderTextLayer !== null){
            this._placeholderTextLayer.font = font;
        }
    },

    getFont: function(){
        return this._textLayer.font;
    },

    // --------------------------------------------------------------------
    // MARK: - Layout Configuration

    multiline: JSDynamicProperty('_multiline', false, 'isMultiline'),
    minimumHeight: JSDynamicProperty('_minimumHeight', 0),
    textInsets: JSDynamicProperty('_textInsets', null),

    setMultiline: function(multiline){
        this._multiline = multiline;
        this._textLayer.textLayoutManager.includeEmptyFinalLine = multiline;
        this._textLayer.widthTracksText = !multiline;
        this._textLayer.maximumNumberOfLines = multiline ? 0 : 1;
    },

    setTextInsets: function(textInsets){
        this._textInsets = textInsets;
        this.setNeedsLayout();
    },

    getTextInsets: function(){
        return this._textInsets;
    },

    getIntrinsicSize: function(){
        if (!this._multiline){
            // FIXME: this only works if our attributed string has only one font size
            return JSSize(UIView.noIntrinsicSize, this.font.displayLineHeight + this._textInsets.top + this._textInsets.bottom);
        }
        // FIXME: could still get an intrinsic height if we know the width
        return JSSize(UIView.noIntrinsicSize, UIView.noIntrinsicSize);
    },

    getFirstBaselineOffsetFromTop: function(){
        this.layoutIfNeeded();
        return this.layer.convertPointFromLayer(JSPoint(0, this._textLayer.firstBaselineOffsetFromTop), this._textLayer).y;
    },

    getLastBaselineOffsetFromBottom: function(){
        this.layoutIfNeeded();
        return this.layer.convertPointFromLayer(JSPoint(0, this._textLayer.firstBaselineOffsetFromTop), this._textLayer).y;
    },

    // --------------------------------------------------------------------
    // MARK: - Accessory Views

    leftImage: JSDynamicProperty('_leftImage', null),
    rightImage: JSDynamicProperty('_rightImage', null),
    leftAccessoryView: JSDynamicProperty('_leftAccessoryView', null),
    rightAccessoryView: JSDynamicProperty('_rightAccessoryView', null),
    leftAccessorySize: JSDynamicProperty('_leftAccessorySize', null),
    rightAccessorySize: JSDynamicProperty('_rightAccessorySize', null),
    leftAccessoryInsets: JSDynamicProperty('_leftAccessoryInsets', null),
    rightAccessoryInsets: JSDynamicProperty('_rightAccessoryInsets', null),
    leftAccessoryVisibility: JSDynamicProperty('_leftAccessoryVisibility', 0),
    rightAccessoryVisibility: JSDynamicProperty('_rightAccessoryVisibility', 0),

    setLeftImage: function(image){
        var templateColor = this._styler.leftAccessoryColor;
        var imageView = UIImageView.initWithImage(image);
        if (templateColor !== null){
            imageView.renderMode = UIImageView.RenderMode.template;
            imageView.templateColor = templateColor;
        }
        this.leftAccessoryView = imageView;
    },

    setRightImage: function(image){
        var templateColor = this._styler.rightAccessoryColor;
        var imageView = UIImageView.initWithImage(image);
        if (templateColor !== null){
            imageView.renderMode = UIImageView.RenderMode.template;
            imageView.templateColor = templateColor;
        }
        this.rightAccessoryView = imageView;
    },

    setLeftAccessoryView: function(view){
        if (view === this._leftAccessoryView){
            return;
        }
        if (this._leftAccessoryView !== null){
            this._leftAccessoryView.removeFromSuperview();
            this._leftImage = null;
        }
        this._leftAccessoryView = view;
        if (this._leftAccessoryView){
            if (this._leftAccessorySize === null){
                var lineHeight = this.font.displayLineHeight;
                this._leftAccessorySize = JSSize(lineHeight, lineHeight);
            }
            if (this._leftAccessoryInsets === null){
                this._leftAccessoryInsets = JSInsets(0, 3, 0, 0);
            }
            if (view.isKindOfClass(UIImageView)){
                this._leftImage = view.image;
            }
            this.addSubview(this._leftAccessoryView);
        }
        this.setNeedsLayout();
        this._styler.updateControl(this);
        view.hidden = (this._leftAccessoryVisibility == UITextField.AccessoryVisibility.onlyWhenActive) && !this.active;
    },

    setRightAccessoryView: function(view){
        if (view === this._rightAccessoryView){
            return;
        }
        if (this._rightAccessoryView !== null){
            this._rightAccessoryView.removeFromSuperview();
            this._rightImage = null;
        }
        this._rightAccessoryView = view;
        if (this._rightAccessoryView){
            if (this._rightAccessorySize === null){
                var lineHeight = this.font.displayLineHeight;
                this._rightAccessorySize = JSSize(lineHeight, lineHeight);
            }
            if (this._rightAccessoryInsets === null){
                this._rightAccessoryInsets = JSInsets(0, 0, 0, 3);
            }
            if (view.isKindOfClass(UIImageView)){
                this._rightImage = view.image;
            }
            this.addSubview(this._rightAccessoryView);
        }
        this.setNeedsLayout();
        this._styler.updateControl(this);
        view.hidden = (this._rightAccessoryVisibility == UITextField.AccessoryVisibility.onlyWhenActive) && !this.active;
    },

    setLeftAccessoryVisibility: function(visibility){
        this._leftAccessoryVisibility = visibility;
        if (this._leftAccessoryView !== null){
            this._leftAccessoryView.hidden = (this._leftAccessoryVisibility == UITextField.AccessoryVisibility.onlyWhenActive) && !this.active;
        }
    },

    setRightAccessoryVisibility: function(visibility){
        this._rightAccessoryVisibility = visibility;
        if (this._rightAccessoryView !== null){
            this._rightAccessoryView.hidden = (this._rightAccessoryVisibility == UITextField.AccessoryVisibility.onlyWhenActive) && !this.active;
        }
    },

    setLeftAcessorySize: function(size){
        this._leftAccessorySize = JSSize(size);
        this.setNeedsLayout();
    },

    setRightAccessorySize: function(size){
        this._rightAccessorySize = JSSize(size);
        this.setNeedsLayout();
    },

    setLeftAccessoryInsets: function(insets){
        this._leftAccessoryInsets = JSInsets(insets);
        this.setNeedsLayout();
    },

    setRightAccessoryInsets: function(insets){
        this._rightAccessoryInsets = JSInsets(insets);
        this.setNeedsLayout();
    },

    // --------------------------------------------------------------------
    // MARK: - Managing Selections

    selections: JSReadOnlyProperty(),

    getSelections: function(){
        return this._localEditor.selections;
    },

    setSelectionRange: function(range, insertionPoint, affinity){
        this._localEditor.setSelectionRange(range, insertionPoint, affinity);
    },

    setSelectionRanges: function(selectionRanges, insertionPoint, affinity){
        this._localEditor.setSelectionRanges(selectionRanges, insertionPoint, affinity);
    },

    // --------------------------------------------------------------------
    // MARK: - Editing Operations

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
        this.pasteAndMatchStyle();
    },

    pasteAndMatchStyle: function(){
        if (UIPasteboard.general.containsType(UIPasteboard.ContentType.plainText)){
            var text = UIPasteboard.general.valueForType(UIPasteboard.ContentType.plainText);
            this._localEditor.insertText(text);
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Layout

    layoutSublayersOfLayer: function(layer){
        if (layer === this.layer){
            this.layoutSubviews();
            if (this._multiline){
                this._textLayer.frame = JSRect(this._textLayer.bounds.origin, JSSize(
                    this._clipView.bounds.size.width,
                    this._textLayer.frame.size.height
                ));
            }
            if (this._placeholderTextLayer !== null){
                this._placeholderTextLayer.frame = JSRect(this._textLayer.bounds.origin, JSSize(
                    this._clipView.bounds.size.width,
                    this._placeholderTextLayer.frame.size.height
                ));
            }
        }else if (layer === this._textLayer){
            this._textLayer.layoutSublayers();
            this._localEditor.layout();
        }else if (layer === this._placeholderTextLayer){
            this._placeholderTextLayer.layoutSublayers();
        }
    },

    layoutSubviews: function(){
        UITextField.$super.layoutSubviews.call(this);
        var textInsets = JSInsets(this._textInsets);
        if (this._leftAccessoryView !== null){
            textInsets.left += this._leftAccessoryInsets.width + this._leftAccessorySize.width;
            this._leftAccessoryView.frame = JSRect(
                this._leftAccessoryInsets.left,
                Math.floor((this.bounds.size.height - this._leftAccessorySize.height) / 2.0),
                this._leftAccessorySize.width,
                this._leftAccessorySize.height
            );
        }
        if (this._rightAccessoryView !== null){
            textInsets.right += this._rightAccessoryInsets.width + this._rightAccessorySize.width;
            this._rightAccessoryView.frame = JSRect(
                this.bounds.size.width - this._rightAccessoryInsets.right - this._rightAccessorySize.width,
                Math.floor((this.bounds.size.height - this._rightAccessorySize.height) / 2.0),
                this._rightAccessorySize.width,
                this._rightAccessorySize.height
            );
        }
        this._clipView.frame = this.bounds.rectWithInsets(textInsets);
    },

    layerDidChangeSize: function(layer){
        if (layer === this._textLayer && this._multiline){
            this.layer.bounds = JSRect(this.layer.bounds.origin, JSSize(
                this.layer.bounds.size.width,
                Math.max(this._minimumHeight, this._textLayer.bounds.size.height + this._textInsets.top + this._textInsets.bottom)
            ));
            this.setNeedsLayout();
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Drawing

    drawLayerInContext: function(layer, context){
        if (layer === this.layer){
            if (this._styler !== null){
                this._styler.drawControlLayerInContext(this, layer, context);
            }
        }else if (layer === this._textLayer){
            layer.drawInContext(context);
        }else if (layer === this._placeholderTextLayer){
            layer.drawInContext(context);
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Cursor Layout

    _boundsScrollThreshold: 7,
    _boundsScrollDistance: 0,
    _boundsScrollInterval: 0.03,
    _boundsScrollTimer: null,
    _lastDragLocation: null,
    _lastDragEvent: null,
    _isDragging: false,

    textEditorDidPositionCursors: function(textEditor){
        if (!this._isDragging){
            this._adjustCursorPositionToCenterIfNeeded();
        }
    },

    textEditorDidReplaceCharactersInRange: function(textEditor, range, insertedLength){
        // This placeholder show/hide logic is a bit optimized compared to _updatePlaceholderHidden,
        // in order to perform the quickest checks while rapidly typing.
        // 1. Use insertedLength to tell if we have a non-empty field
        // 2. Only query the text storage if we might be empty
        if (this._placeholderTextLayer !== null){
            if (this._isShowingPlaceholder && insertedLength > 0){
                this._placeholderTextLayer.hidden = true;
                this._isShowingPlaceholder = false;
            }else if (!this._isShowingPlaceholder && insertedLength === 0 && !this._textLayer.hasText()){
                this._placeholderTextLayer.hidden = false;
                this._isShowingPlaceholder = true;
            }
        }
        if (this.delegate && this.delegate.textFieldDidChange){
            this.delegate.textFieldDidChange(this);
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

    // --------------------------------------------------------------------
    // MARK: - Responder

    canBecomeFirstResponder: function(){
        return this.enabled;
    },

    canResignFirstResponder: function(){
        return true;
    },

    becomeFirstResponder: function(){
        this.active = true;
        if (this._leftAccessoryView !== null && this._leftAccessoryVisibility == UITextField.AccessoryVisibility.onlyWhenActive){
            this._leftAccessoryView.hidden = false;
        }
        if (this._rightAccessoryView !== null && this._rightAccessoryVisibility == UITextField.AccessoryVisibility.onlyWhenActive){
            this._rightAccessoryView.hidden = false;
        }
        this._localEditor.didBecomeFirstResponder();
    },

    resignFirstResponder: function(){
        this.active = false;
        if (this._leftAccessoryView !== null && this._leftAccessoryVisibility == UITextField.AccessoryVisibility.onlyWhenActive){
            this._leftAccessoryView.hidden = true;
        }
        if (this._rightAccessoryView !== null && this._rightAccessoryVisibility == UITextField.AccessoryVisibility.onlyWhenActive){
            this._rightAccessoryView.hidden = true;
        }
        this._localEditor.didResignFirstResponder();
    },

    windowDidChangeKeyStatus: function(){
        this._localEditor.windowDidChangeKeyStatus(this.window);
    },

    mouseDown: function(event){
        if (!this.enabled){
            return UITextField.$super.mouseDown.call(this, event);
        }
        if (!this.isFirstResponder()){
            this.window.firstResponder = this;
        }
        var location = event.locationInView(this);
        this._localEditor.handleMouseDownAtLocation(this.layer.convertPointToLayer(location, this._textLayer), event);
    },

    mouseDragged: function(event){
        if (!this.enabled){
            return UITextField.$super.mouseDragged.call(this, event);
        }
        if (!this._isDragging){
            this._clipView.cursor.push();
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
            this._clipView.cursor.pop();
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
            return text.replace(/\r\n/g, ' ').replace(/[\t\r\n\u000B\u000C\u0085\u2028\u2029]/g, ' ');
        }
        return text;
    },

    // --------------------------------------------------------------------
    // MARK: - UITextInput Protocol

    insertText: function(text){
        text = this._sanitizedText(text);
        this._localEditor.insertText(text);
    },

    insertNewline: function(){
        if (this.multiline){
            this._localEditor.insertNewline();
        }else{
            if (this.delegate && this.delegate.textFieldDidReceiveEnter){
                this.delegate.textFieldDidReceiveEnter(this);
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
    leftAccessoryColor: null,
    rightAccessoryColor: null,

    init: function(){
        this._commonStylerInit();
    },

    initWithSpec: function(spec, values){
        UITextFieldStyler.$super.initWithSpec.call(this, spec, values);
        if ('localCursorColor' in values){
            this.localCursorColor = spec.resolvedValue(values.localCursorColor, "JSColor");
        }
        if ('leftAccessoryColor' in values){
            this.leftAccessoryColor = spec.resolvedValue(values.leftAccessoryColor, "JSColor");
        }
        if ('rightAccessoryColor' in values){
            this.rightAccessoryColor = spec.resolvedValue(values.rightAccessoryColor, "JSColor");
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
    activeColor: null,
    inactiveColor: null,

    init: function(){
        UITextFieldDefaultStyler.$super.init.call(this);
        this.activeColor = JSColor.blackColor;
        this.inactiveColor = JSColor.initWithWhite(0.8);
    },

    initializeControl: function(textField){
        UITextFieldDefaultStyler.$super.initializeControl.call(this, textField);
        textField.stylerProperties.respondingIndicatorLayer = UILayer.init();
        textField.stylerProperties.respondingIndicatorLayer.backgroundColor = this.inactiveColor;
        textField.layer.addSublayer(textField.stylerProperties.respondingIndicatorLayer);
        textField.textInsets = JSInsets(3, 0);
    },

    layoutControl: function(textField){
        textField.stylerProperties.respondingIndicatorLayer.frame = JSRect(0, textField.bounds.size.height - 1, textField.bounds.size.width, 1);
    },

    updateControl: function(textField){
        UITextFieldDefaultStyler.$super.updateControl.call(this, textField);
        if (textField.active){
            textField.stylerProperties.respondingIndicatorLayer.backgroundColor = this.activeColor;
        }else{
            textField.stylerProperties.respondingIndicatorLayer.backgroundColor = this.inactiveColor;
        }
    }

});

JSClass("UITextFieldCustomStyler", UITextFieldStyler, {

    backgroundColor: null,
    activeBackgroundColor: null,
    textColor: null,
    placeholderColor: null,
    cornerRadius: 0,
    textInsets: null,

    initWithSpec: function(spec, values){
        UITextFieldCustomStyler.$super.initWithSpec.call(this, spec, values);
        if ('backgroundColor' in values){
            this.backgroundColor = spec.resolvedValue(values.backgroundColor, "JSColor");
        }
        if ('activeBackgroundColor' in values){
            this.activeBackgroundColor = spec.resolvedValue(values.activeBackgroundColor, "JSColor");
        }
        if ('textColor' in values){
            this.textColor = spec.resolvedValue(values.textColor, "JSColor");
        }
        if ('placeholderColor' in values){
            this.placeholderColor = spec.resolvedValue(values.placeholderColor, "JSColor");
        }
        if ('cornerRadius' in values){
            this.cornerRadius = spec.resolvedValue(values.cornerRadius);
        }
        if ('textInsets' in values){
            this.textInsets = JSInsets.apply(undefined, values.textInsets.parseNumberArray());
        }
    },

    initializeControl: function(textField){
        UITextFieldCustomStyler.$super.initializeControl.call(this, textField);
        textField.cornerRadius = this.cornerRadius;
        if (this.textColor !== null){
            textField.textColor = this.textColor;
        }
        if (this.placeholderColor !== null){
            textField.placeholderColor = this.placeholderColor;
        }
        if (this.textInsets !== null){
            textField.textInsets = this.textInsets;
        }
        this.updateControl(textField);
    },

    updateControl: function(textField){
        UITextFieldCustomStyler.$super.updateControl.call(this, textField);
        if (textField.active){
            if (this.activeBackgroundColor){
                textField.backgroundColor = this.activeBackgroundColor;
            }
        }else{
            textField.backgroundColor = this.backgroundColor;
        }
    }

});

UITextField.AccessoryVisibility = {
    always: 0,
    onlyWhenActive: 1
};

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