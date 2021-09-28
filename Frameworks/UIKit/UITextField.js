// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #import "UIControl.js"
// #import "UILabel.js"
// #import "UITextLayer.js"
// #import "UITextEditor.js"
// #import "UICursor.js"
// #import "UITextAttachmentView.js"
// #import "UIImageView.js"
// #import "UIPasteboard.js"
// #import "JSColor+UIKit.js"
'use strict';

(function(){

JSProtocol("UITextFieldDelegate", JSProtocol, {
    textFieldDidReceiveEnter: function(textField){},
    textFieldDidChange: function(textField){}
});

JSClass("UITextField", UIControl, {

    // --------------------------------------------------------------------
    // MARK: - Creating a Text Field
    
    _localEditor: null,
    _clipView: null,
    _textLayer: null,

    initWithSpec: function(spec){
        UITextField.$super.initWithSpec.call(this, spec);
        if (spec.containsKey("textInsets")){
            this.textInsets = spec.valueForKey("textInsets", JSInsets);
        }
        if (spec.containsKey("font")){
            this.font = spec.valueForKey("font", JSFont);
        }
        if (spec.containsKey("textColor")){
            this.textColor = spec.valueForKey("textColor", JSColor);
        }
        if (spec.containsKey("text")){
            this.text = spec.valueForKey("text");
        }
        if (spec.containsKey("multiline")){
            this.multiline = spec.valueForKey("multiline");
        }
        if (spec.containsKey("textAlignment")){
            this.textAlignment = spec.valueForKey("textAlignment", JSTextAlignment);
        }
        if (spec.containsKey('leftImage')){
            this.leftImage = spec.valueForKey("leftImage", JSImage);
        }else if (spec.containsKey('leftAccessoryView')){
            this.leftAccessoryView = spec.valueForKey("leftAccessoryView");
        }
        if (spec.containsKey('leftAccessorySize')){
            this.leftAccessorySize = spec.valueForKey("leftAccessorySize", JSSize);
        }
        if (spec.containsKey('leftAccessoryInsets')){
            this.leftAccessoryInsets = spec.valueForKey("leftAccessoryInsets", JSInsets);
        }
        if (spec.containsKey('leftAccessoryVisibility')){
            this.leftAccessoryVisibility = spec.valueForKey("leftAccessoryVisibility");
        }
        if (spec.containsKey('rightImage')){
            this.rightImage = spec.valueForKey("rightImage", JSImage);
        }else if (spec.containsKey('rightAccessoryView')){
            this.rightAccessoryView = spec.valueForKey("rightAccessoryView");
        }
        if (spec.containsKey('rightAccessorySize')){
            this.rightAccessorySize = spec.valueForKey("rightAccessorySize", JSSize);
        }
        if (spec.containsKey('rightAccessoryInsets')){
            this.rightAccessoryInsets = spec.valueForKey("rightAccessoryInsets", JSInsets);
        }
        if (spec.containsKey('rightAccessoryVisibility')){
            this.rightAccessoryVisibility = spec.valueForKey("rightAccessoryVisibility", UITextField.AccessoryVisibility);
        }
        if (spec.containsKey('placeholder')){
            this.placeholder = spec.valueForKey("placeholder");
        }
        if (spec.containsKey('placeholderColor')){
            this.placeholderColor = spec.valueForKey("placeholderColor", JSColor);
        }
        if (spec.containsKey('delegate')){
            this.delegate = spec.valueForKey("delegate");
        }
        if (spec.containsKey('secureEntry')){
            this.secureEntry = spec.valueForKey("secureEntry");
        }
        if (spec.containsKey('keyboardType')){
            this.keyboardType = spec.valueForKey("keyboardType", UITextInput.KeyboardType);
        }
        if (spec.containsKey('autocapitalizationType')){
            this.autocapitalizationType = spec.valueForKey("autocapitalizationType", UITextInput.AutocapitalizationType);
        }
        if (spec.containsKey('textContentType')){
            this.textContentType = spec.valueForKey("textContentType", UITextInput.TextContentType);
        }
        this._minimumHeight = this.bounds.size.height;
    },

    commonUIControlInit: function(){
        UITextField.$super.commonUIControlInit.call(this);
        this._textInsets = JSInsets.Zero;
        this._clipView = UIView.init(this.bounds);
        this._clipView.userInteractionEnabled = false;
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
            this._styler = UITextField.Styler.default;
        }
        this.hasOverState = this._styler.showsOverState;
        this.textColor = JSColor.text;
        this._placeholderColor = JSColor.placeholderText;
        this._styler.initializeControl(this);
    },

    // --------------------------------------------------------------------
    // MARK: - Delegate

    delegate: null,

    // --------------------------------------------------------------------
    // MARK: - Text Content

    text: JSDynamicProperty(),
    attributedText: JSDynamicProperty(),
    _didChange: false,
    _isEmpty: true,

    setText: function(text){
        if (this._secureEntry){
            this._textLayer.attributedText = JSAttributedString.initWithString(text, {"maskCharacter": this._secureEntryMaskCharacter});
        }else{
            this._textLayer.text = text;
        }
        this._updateIsEmpty(!this._textLayer.hasText());
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
        this._updateIsEmpty(!this._textLayer.hasText());
    },

    getAttributedText: function(){
        return this._textLayer.attributedText;
    },

    isEmpty: function(){
        return !this._textLayer.hasText();
    },

    // --------------------------------------------------------------------
    // MARK: - Number Content

    integerValue: JSDynamicProperty(),

    getIntegerValue: function(){
        var value = parseInt(this.text);
        if (!isNaN(value)){
            return value;
        }
        return null;
    },

    setIntegerValue: function(value){
        if (value === null){
            this.text = "";
        }else{
            this.text = "%d".sprintf(value);
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Placeholder

    placeholder: JSDynamicProperty('_placeholder', null),
    placeholderColor: JSDynamicProperty('_placeholderColor', null),

    setPlaceholder: function(placeholder){
        if (this._placeholderLabel === null){
            this._createPlaceholderLabel();
        }
        this._placeholderLabel.text = placeholder;
        this._updatePlaceholderHidden();
    },

    getPlaceholder: function(){
        if (!this._placeholderLabel){
            return null;
        }
        return this._placeholderLabel.text;
    },

    setPlaceholderColor: function(color){
        this._placeholderColor = color;
        if (this._placeholderLabel !== null){
            this._placeholderLabel.textColor = this._placeholderColor;
        }
    },

    _createPlaceholderLabel: function(){
        this._placeholderLabel = UILabel.init();
        this._placeholderLabel.textAlignment = this._textLayer.textAlignment;
        this._placeholderLabel.lineBreakMode = JSLineBreakMode.truncateTail;
        this._placeholderLabel.maximumNumberOfLines = 1;
        this._placeholderLabel.font = this._textLayer.font;
        this._placeholderLabel.hidden = true;
        this._placeholderLabel.layer.widthTracksText = this._textLayer.widthTracksText;
        this._placeholderLabel.layer.heightTracksText = true;
        this._placeholderLabel.textColor = this._placeholderColor;
        this._clipView.insertSubviewAtIndex(this._placeholderLabel, 0);
        this._clipView.layer.insertSublayerBelowSibling(this._placeholderLabel.layer, this._textLayer);
    },

    _placeholderLabel: null,

    _isShowingPlaceholder: false,

    _updatePlaceholderHidden: function(){
        if (this._isShowingPlaceholder && !this._shouldShowPlaceholder()){
            this._placeholderLabel.hidden = true;
            this._isShowingPlaceholder = false;
        }else if (!this._isShowingPlaceholder && this._shouldShowPlaceholder()){
            this._placeholderLabel.hidden = false;
            this._isShowingPlaceholder = true;
        }
    },

    _shouldShowPlaceholder: function(){
        return this._placeholderLabel !== null && !this._textLayer.hasText();
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

    textAlignment: JSDynamicProperty(),
    textColor: JSDynamicProperty(),
    localCursorColor: JSDynamicProperty(),
    font: JSDynamicProperty(),

    setTextAlignment: function(textAlignment){
        this._textLayer.textAlignment = textAlignment;
        if (this._placeholderLabel !== null){
            this._placeholderLabel.textAlignment = textAlignment;
        }
    },

    getTextAlignment: function(){
        return this._textLayer.textAlignment;
    },

    setTextColor: function(textColor){
        this._textLayer.textColor = textColor;
    },

    getTextColor: function(){
        return this._textLayer.textColor;
    },

    setFont: function(font){
        this._textLayer.font = font;
        if (this._placeholderLabel !== null){
            this._placeholderLabel.font = font;
        }
    },

    getFont: function(){
        return this._textLayer.font;
    },

    setLocalCursorColor: function(color){
        this._localEditor.cursorColor = color;
    },

    getLocalCursorColor: function(){
        return this._localEditor.cursorColor;
    },

    // --------------------------------------------------------------------
    // MARK: - Undo Manager

    getUndoManager: function(){
        return this._localEditor.undoManager;
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
        if (this._placeholderLabel !== null){
            this._placeholderLabel.layer.widthTracksText = this._textLayer.widthTracksText;
        }
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

    hitTest: function(location){
        var hit = UITextField.$super.hitTest.call(this, location);
        var index, attachment, attributes, rect, attachmentLocation;
        var attachmentHit = null;
        if (hit === this){
            var locationInText = this.layer.convertPointToLayer(location, this._textLayer);
            index = this._textLayer.textLayoutManager.characterIndexAtPoint(locationInText);
            if (index < this.attributedText.string.length){
                attributes = this.attributedText.attributesAtIndex(index);
                attachment = attributes[JSAttributedString.Attribute.attachment];
                if (attachment && attachment.isKindOfClass(UITextAttachmentView)){
                    rect = this._textLayer.textLayoutManager.rectForCharacterAtIndex(index);
                    attachmentLocation = locationInText.subtracting(rect.origin);
                    attachmentHit = attachment.view.hitTest(attachmentLocation);
                    if (attachmentHit !== null){
                        return attachmentHit;
                    }
                }
            }
            if (index > 0){
                index -= 1;
            }
            attributes = this.attributedText.attributesAtIndex(index);
            attachment = attributes[JSAttributedString.Attribute.attachment];
            if (attachment && attachment.isKindOfClass(UITextAttachmentView)){
                rect = this._textLayer.textLayoutManager.rectForCharacterAtIndex(index);
                attachmentLocation = locationInText.subtracting(rect.origin);
                attachmentHit = attachment.view.hitTest(attachmentLocation);
                if (attachmentHit !== null){
                    return attachmentHit;
                }
            }
        }
        return hit;
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
        if (image === null){
            this.leftAccessoryView = null;
        }else{
            var templateColor = this._styler.leftAccessoryColor;
            var imageView = UIImageView.initWithImage(image);
            imageView.automaticRenderMode = JSImage.RenderMode.template;
            imageView.templateColor = templateColor;
            this.leftAccessoryView = imageView;
        }
    },

    setRightImage: function(image){
        if (image === null){
            this.rightAccessoryView = null;
        }else{
            var templateColor = this._styler.rightAccessoryColor;
            var imageView = UIImageView.initWithImage(image);
            imageView.automaticRenderMode = JSImage.RenderMode.template;
            imageView.templateColor = templateColor;
            this.rightAccessoryView = imageView;
        }
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
        this._updateAccessoryViewHidden(this._leftAccessoryView, this._leftAccessoryVisibility);
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
        this._updateAccessoryViewHidden(this._rightAccessoryView, this._rightAccessoryVisibility);
    },

    setLeftAccessoryVisibility: function(visibility){
        this._leftAccessoryVisibility = visibility;
        this._updateAccessoryViewHidden(this._leftAccessoryView, this._leftAccessoryVisibility);
    },

    setRightAccessoryVisibility: function(visibility){
        this._rightAccessoryVisibility = visibility;
        this._updateAccessoryViewHidden(this._rightAccessoryView, this._rightAccessoryVisibility);
    },

    _updateAccessoryViewHidden: function(accessoryView, visibility){
        if (accessoryView === null){
            return;
        }
        switch (visibility){
            case UITextField.AccessoryVisibility.onlyWhenActive:
                accessoryView.hidden = !this.active;
                break;
            case UITextField.AccessoryVisibility.onlyWhenNotEmpty:
                accessoryView.hidden = !this._textLayer.hasText();
                break;
            default:
                accessoryView.hidden = false;
                break;
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

    canPerformAction: function(action, sender){
        if (action == 'copy' || action == 'cut'){
            if (this.secureEntry){
                return false;
            }
            for (var i = 0, l = this._localEditor.selections.length; i < l; ++i){
                if (this._localEditor.selections[i].range.length > 0){
                    return true;
                }
            }
            return false;
        }
        return UITextField.$super.canPerformAction.call(this, action, sender);
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
            UIPasteboard.general.setStringForType(text, UIPasteboard.ContentType.plainText);
        }
        // TODO: attributed text
    },

    paste: function(){
        // TODO: attributed text
        this.pasteAndMatchStyle();
    },

    pasteAndMatchStyle: function(){
        if (UIPasteboard.general.containsType(UIPasteboard.ContentType.plainText)){
            var text = UIPasteboard.general.stringForType(UIPasteboard.ContentType.plainText);
            this.insertText(text);
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Layout

    layoutSublayersOfLayer: function(layer){
        if (layer === this.layer){
            this.layoutSubviews();
            if (!this._multiline){
                this._textLayer.layoutIfNeeded();
            }
            var clipSize = this._clipView.bounds.size;
            var textSize = this._textLayer.bounds.size;
            if (this._multiline){
                this._textLayer.frame = JSRect(0, 0, clipSize.width, textSize.height);
            }else if (this._textLayer.textAlignment == JSTextAlignment.center){
                this._textLayer.frame = JSRect(Math.max(0, (clipSize.width - textSize.width) / 2), 0, textSize.width, textSize.height);
            }else if (this._textLayer.textAlignment == JSTextAlignment.right){
                this._textLayer.frame = JSRect(Math.max(0, clipSize.width - textSize.width), 0, textSize.width, textSize.height);
            }else{
                this._textLayer.frame = JSRect(JSPoint.Zero, textSize);
            }
        }else if (layer === this._textLayer){
            this._textLayer.layoutSublayers();
            this._localEditor.layout();
        }
    },

    layoutSubviews: function(){
        UITextField.$super.layoutSubviews.call(this);
        var textInsets = JSInsets(this._textInsets);
        if (this._placeholderLabel !== null){
            if (!this._multiline){
                this._placeholderLabel.layoutIfNeeded();
            }
            var clipSize = this._clipView.bounds.size;
            var placeholderSize = this._placeholderLabel.bounds.size;
            if (this._multiline){
                this._placeholderLabel.frame = JSRect(0, 0, clipSize.width, placeholderSize.height);
            }else if (this._placeholderLabel.textAlignment == JSTextAlignment.center){
                this._placeholderLabel.frame = JSRect((clipSize.width - placeholderSize.width) / 2, 0, placeholderSize.width, placeholderSize.height);
            }else if (this._placeholderLabel.textAlignment == JSTextAlignment.right){
                this._placeholderLabel.frame = JSRect(clipSize.width - placeholderSize.width, 0, placeholderSize.width, placeholderSize.height);
            }else{
                this._placeholderLabel.frame = JSRect(JSPoint.Zero, placeholderSize);
            }
        }
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
        UITextField.$super.layerDidChangeSize.call(this, layer);
        if (layer === this._textLayer && this._multiline){
            this.layer.bounds = JSRect(this.layer.bounds.origin, JSSize(
                this.layer.bounds.size.width,
                Math.max(this._minimumHeight, this._textLayer.bounds.size.height + this._textInsets.top + this._textInsets.bottom)
            ));
            this.setNeedsLayout();
        }
    },

    sizeToFitText: function(maxSize){
        this._textLayer.layoutIfNeeded();
        var size = JSSize(this._textLayer.bounds.size);
        if (this._isShowingPlaceholder){
            this._placeholderLabel.layoutIfNeeded();
            size = JSSize(this._placeholderLabel.bounds.size);
        }
        if (size.width > maxSize.width){
            size.width = maxSize.width;
        }
        if (size.height > maxSize.height){
            size.height = maxSize.height;
        }
        size.width += this._textInsets.width;
        size.height += this._textInsets.height;
        this.bounds = JSRect(JSPoint.Zero, size);
        this.layoutIfNeeded();
        this._adjustClipViewOrigin(this._clipView.bounds.origin);
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

    _updateIsEmpty: function(isEmpty){
        // This placeholder show/hide logic is a bit optimized compared to _updatePlaceholderHidden,
        // in order to perform the quickest checks while rapidly typing.
        // 1. Use insertedLength to tell if we have a non-empty field
        // 2. Only query the text storage if we might be empty
        if (this._placeholderLabel !== null){
            if (this._isShowingPlaceholder && !isEmpty){
                this._placeholderLabel.hidden = true;
                this._isShowingPlaceholder = false;
            }else if (!this._isShowingPlaceholder && isEmpty){
                this._placeholderLabel.hidden = false;
                this._isShowingPlaceholder = true;
            }
        }
        if (this._leftAccessoryVisibility == UITextField.AccessoryVisibility.onlyWhenNotEmpty){
            this._updateAccessoryViewHidden(this._leftAccessoryView, this._leftAccessoryVisibility);
        }
        if (this._rightAccessoryVisibility == UITextField.AccessoryVisibility.onlyWhenNotEmpty){
            this._updateAccessoryViewHidden(this._rightAccessoryView, this._rightAccessoryVisibility);
        }
        this._isEmpty = isEmpty;
    },

    textEditorDidReplaceCharactersInRange: function(textEditor, range, insertedLength){
        if (this._isEmpty && insertedLength > 0){
            this._updateIsEmpty(false);
        }else if (!this._isEmpty && insertedLength === 0 && !this._textLayer.hasText()){
            this._updateIsEmpty(true);
        }
        this.didChangeValueForBinding('text');
        this.didChangeValueForBinding('attributedText');
        this.didChangeValueForBinding('integerValue');
        this.postAccessibilityNotification(UIAccessibility.Notification.valueChanged);
        this.sendActionsForEvents(UIControl.Event.editingChanged);
        if (this.delegate && this.delegate.textFieldDidChange){
            this.delegate.textFieldDidChange(this);
        }
        this._didChange = true;
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
        var maxX = this._textLayer.frame.origin.x + this._textLayer.frame.size.width;
        if (origin.x > maxX - this._clipView.bounds.size.width){
            origin.x = maxX - this._clipView.bounds.size.width;
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
        this._updateAccessoryViewHidden(this._leftAccessoryView, this._leftAccessoryVisibility);
        this._updateAccessoryViewHidden(this._rightAccessoryView, this._rightAccessoryVisibility);
        this._localEditor.didBecomeFirstResponder(this.window && this.window.isKeyWindow, !this._isHandlingMouseDown);
        this._didChange = false;
        this.sendActionsForEvents(UIControl.Event.editingDidBegin);
    },

    resignFirstResponder: function(){
        this.active = false;
        this._updateAccessoryViewHidden(this._leftAccessoryView, this._leftAccessoryVisibility);
        this._updateAccessoryViewHidden(this._rightAccessoryView, this._rightAccessoryVisibility);
        this._localEditor.didResignFirstResponder();
        var events = UIControl.Event.editingDidEnd;
        if (this._didChange){
            events |= UIControl.Event.primaryAction | UIControl.Event.valueChanged;
        }
        this.sendActionsForEvents(events);
    },

    windowDidChangeKeyStatus: function(){
        this._localEditor.windowDidChangeKeyStatus(this.window);
    },

    _isHandlingMouseDown: false,

    mouseDown: function(event){
        if (this.enabled){
            this._isHandlingMouseDown = true;
            if (!this.isFirstResponder()){
                this.window.firstResponder = this;
            }
            this._isHandlingMouseDown = false;
            var location = event.locationInView(this);
            this._localEditor.handleMouseDownAtLocation(this.layer.convertPointToLayer(location, this._textLayer), event);
            return;
        }
        UITextField.$super.mouseDown.call(this, event);
    },

    mouseDragged: function(event){
        if (this.enabled){
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
            return;
        }
        UITextField.$super.mouseDragged.call(this, event);
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
        if (this.enabled){
            var location = event.locationInView(this);
            this._localEditor.handleMouseUpAtLocation(this.layer.convertPointToLayer(location, this._textLayer), event);
            return;
        }
        UITextField.$super.mouseUp.call(this, event);
    },

    touchesBegan: function(touches, event){
        if (this.enabled){
            // Always try to set window.firstResponder to force the keyboard
            // open if it didn't open when we became first responder.  Happens
            // when mobile safari ignores focus() calls that aren't tied to
            // user interaction
            this.window.firstResponder = this;
            var location = touches[0].locationInView(this);
            this._localEditor.handleTouchesBeganAtLocation(this.layer.convertPointToLayer(location, this._textLayer), touches, event);
            return;
        }
        UITextField.$super.touchesBegan.call(this, touches, event);
    },

    touchesMoved: function(touches, event){
        if (this.enabled){
            var location = touches[0].locationInView(this);
            this._localEditor.handleTouchesMovedAtLocation(this.layer.convertPointToLayer(location, this._textLayer), touches, event);
            return;
        }
        UITextField.$super.touchesMoved.call(this, touches, event);
    },

    touchesEnded: function(touches, event){
        if (this.enabled){
            var location = touches[0].locationInView(this);
            this._localEditor.handleTouchesEnded(touches, event);
            return;
        }
        UITextField.$super.touchesEnded.call(this, touches, event);
    },

    touchesCanceled: function(touches, event){
        if (this.enabled){
            var location = touches[0].locationInView(this);
            this._localEditor.handleTouchesCanceled(touches, event);
            return;
        }
        UITextField.$super.touchesCanceled.call(this, touches, event);
    },

    _sanitizedText: function(text){
        if (!this._multiline){
            return text.replace(/\r\n/g, ' ').replace(/[\t\r\n\u000B\u000C\u0085\u2028\u2029]/g, ' ');
        }
        return text;
    },

    // --------------------------------------------------------------------
    // MARK: - Accessibility

    isAccessibilityElement: true,

    accessibilityRole: UIAccessibility.Role.textField,

    accessibilityValue: JSReadOnlyProperty(),

    accessibilityMultiline: JSReadOnlyProperty(),

    getAccessibilityValue: function(){
        return this.text;
    },

    getAccessibilityLabel: function(){
        var label = UITextField.$super.getAccessibilityLabel.call(this);
        if (label !== null){
            return label;
        }
        if (this.placeholder !== null){
            return this.placeholder;
        }
        return null;
    },

    getAccessibilityMultiline: function(){
        return this._multiline;
    },

    // --------------------------------------------------------------------
    // MARK: - UITextInput Protocol

    keyboardType: JSDynamicProperty("_keyboardType", UITextInput.KeyboardType.default),
    autocapitalizationType: JSDynamicProperty("_autocapitalizationType", UITextInput.AutocapitalizationType.none),
    secureTextEntry: JSReadOnlyProperty(),
    textContentType: JSDynamicProperty("_textContentType", UITextInput.TextContentType.none),

    getSecureTextEntry: function(){
        return this.secureEntry;
    },

    insertText: function(text){
        text = this._sanitizedText(text);
        this._localEditor.insertText(text);
    },

    replaceText: function(selections, text){
        this._localEditor.setSelections(selections);
        this.insertText(text);
    },

    setMarkedText: function(text){
        this._localEditor.setMarkedText(text);
    },

    clearMarkedText: function(){
        this._localEditor.clearMarkedText();
    },

    markedTextRanges: JSReadOnlyProperty(),

    getMarkedTextRanges: function(){
        return this._localEditor.markedTextRanges;
    },

    insertNewline: function(){
        if (this.multiline){
            this._localEditor.insertNewline();
        }else{
            if (this.delegate && this.delegate.textFieldDidReceiveEnter){
                this.delegate.textFieldDidReceiveEnter(this);
            }
            if (this._didChange){
                this.sendActionsForEvents(UIControl.Event.primaryAction | UIControl.Event.valueChanged);
                this._didChange = false;
            }
        }
    },

    insertLineBreak: function(){
        if (this.multiline){
            this._localEditor.insertLineBreak();
        }
    },

    insertTab: function(){
        // this.window.setFirstResponderToKeyViewAfterView(this);
    },

    insertBacktab: function(){
        // this.window.setFirstResponderToKeyViewBeforeView(this);
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
        this._localEditor.deleteWordForward();
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
    },

    textInputLayer: function(){
        return this._textLayer;
    },

    textInputLayoutManager: function(){
        return this._textLayer.textLayoutManager;
    },

    textInputSelections: function(){
        return this.selections;
    },

});

UITextField.AccessoryVisibility = {
    always: 0,
    onlyWhenActive: 1,
    onlyWhenNotEmpty: 2
};

UITextField.Styler = Object.defineProperties({}, {
    default: {
        configurable: true,
        get: function UITextField_getDefaultStyler(){
            var styler = UITextFieldDefaultStyler.init();
            Object.defineProperty(this, 'default', {writable: true, value: styler});
            return styler;
        },
        set: function UITextField_setDefaultStyler(styler){
            Object.defineProperty(this, 'default', {writable: true, value: styler});
        }
    },

    custom: {
        configurable: true,
        get: function UITextField_getCustomStyler(){
            var styler = UITextFieldCustomStyler.init();
            Object.defineProperty(this, 'custom', {writable: true, value: styler});
            return styler;
        }
    }
});

JSClass("UITextFieldStyler", UIControlStyler, {

    localCursorColor: null,
    leftAccessoryColor: null,
    rightAccessoryColor: null,

    init: function(){
        this._commonStylerInit();
    },

    initWithSpec: function(spec){
        UITextFieldStyler.$super.initWithSpec.call(this, spec);
        if (spec.containsKey('localCursorColor')){
            this.localCursorColor = spec.valueForKey("localCursorColor", JSColor);
        }
        if (spec.containsKey('leftAccessoryColor')){
            this.leftAccessoryColor = spec.valueForKey("leftAccessoryColor", JSColor);
        }
        if (spec.containsKey('rightAccessoryColor')){
            this.rightAccessoryColor = spec.valueForKey("rightAccessoryColor", JSColor);
        }
        this._commonStylerInit();
    },

    _commonStylerInit: function(){
        if (this.localCursorColor === null){
            this.localCursorColor = JSColor.highlight;
        }
    },

    initializeControl: function(textField){
        textField.localCursorColor = this.localCursorColor;
    },

    sizeControlToFitSize: function(textField, maxSize){
        if (!textField.multiline){
            var size = JSSize(textField.bounds.size);
            if (maxSize.width < Number.MAX_VALUE){
                size.width = maxSize.width;
            }
            size.height = textField.intrinsicSize.height;
            textField.bounds = JSRect(JSPoint.Zero, size);
        }else{
            UITextFieldStyler.$super.sizeControlToFitSize(textField, maxSize);
        }
    }

});

JSClass("UITextFieldDefaultStyler", UITextFieldStyler, {

    showsOverState: false,
    activeColor: null,
    inactiveColor: null,
    textInsets: null,

    init: function(){
        UITextFieldDefaultStyler.$super.init.call(this);
        this._commonDefaultStylerInit();
    },

    initWithSpec: function(spec){
        UITextFieldDefaultStyler.$super.initWithSpec.call(this, spec);
        this._commonDefaultStylerInit();
        if (spec.containsKey("activeColor")){
            this.activeColor = spec.valueForKey("activeColor", JSColor);
        }
        if (spec.containsKey("inactiveColor")){
            this.inactiveColor = spec.valueForKey("inactiveColor", JSColor);
        }
        if (spec.containsKey("textInsets")){
            this.textInsets = spec.valueForKey("textInsets", JSInsets);
        }
    },

    _commonDefaultStylerInit: function(){
        this.activeColor = JSColor.highlight;
        this.inactiveColor = JSColor.text.colorWithAlpha(0.2);
        this.textInsets = JSInsets(3, 0);
    },

    initializeControl: function(textField){
        UITextFieldDefaultStyler.$super.initializeControl.call(this, textField);
        textField.stylerProperties.respondingIndicatorLayer = UILayer.init();
        textField.stylerProperties.respondingIndicatorLayer.backgroundColor = this.inactiveColor;
        textField.layer.addSublayer(textField.stylerProperties.respondingIndicatorLayer);
        textField.textInsets = this.textInsets;
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
    },

    focusRingPathForControl: function(textField){
        return null;
    }

});

JSClass("UITextFieldCustomStyler", UITextFieldStyler, {

    backgroundColor: null,
    activeBackgroundColor: null,
    disabledBackgroundColor: null,
    borderColor: null,
    overBackgroundColor: null,
    overBorderColor: null,
    activeBorderColor: null,
    disabledBorderColor: null,
    borderWidth: 0,
    textColor: null,
    placeholderColor: null,
    cornerRadius: 0,
    textInsets: null,
    showsFocusRing: true,

    init: function(){
        UITextFieldCustomStyler.$super.init.call(this);
        this.textColor = JSColor.text;
    },

    initWithSpec: function(spec){
        UITextFieldCustomStyler.$super.initWithSpec.call(this, spec);
        if (spec.containsKey("backgroundColor")){
            this.backgroundColor = spec.valueForKey("backgroundColor", JSColor);
        }
        if (spec.containsKey("activeBackgroundColor")){
            this.activeBackgroundColor = spec.valueForKey("activeBackgroundColor", JSColor);
        }
        if (spec.containsKey("disabledBackgroundColor")){
            this.disabledBackgroundColor = spec.valueForKey("disabledBackgroundColor", JSColor);
        }
        if (spec.containsKey("borderColor")){
            this.borderColor = spec.valueForKey("borderColor", JSColor);
        }
        if (spec.containsKey("activeBorderColor")){
            this.activeBorderColor = spec.valueForKey("activeBorderColor", JSColor);
        }
        if (spec.containsKey("disabledBorderColor")){
            this.disabledBorderColor = spec.valueForKey("disabledBorderColor", JSColor);
        }
        if (spec.containsKey("textColor")){
            this.textColor = spec.valueForKey("textColor", JSColor);
        }else{
            this.textColor = JSColor.text;
        }
        if (spec.containsKey("placeholderColor")){
            this.placeholderColor = spec.valueForKey("placeholderColor", JSColor);
        }
        if (spec.containsKey("cornerRadius")){
            this.cornerRadius = spec.valueForKey("cornerRadius");
        }
        if (spec.containsKey("borderWidth")){
            this.borderWidth = spec.valueForKey("borderWidth");
        }
        if (spec.containsKey("textInsets")){
            this.textInsets = spec.valueForKey("textInsets", JSInsets);
        }
        if (spec.containsKey("showsFocusRing")){
            this.showsFocusRing = spec.valueForKey("showsFocusRing");
        }
        if (spec.containsKey("overBackgroundColor")){
            this.overBackgroundColor = spec.valueForKey("overBackgroundColor", JSColor);
        }
        if (spec.containsKey("overBorderColor")){
            this.overBorderColor = spec.valueForKey("overBorderColor", JSColor);
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
        textField.borderWidth = this.borderWidth;
        this.updateControl(textField);
    },

    updateControl: function(textField){
        UITextFieldCustomStyler.$super.updateControl.call(this, textField);
        if (textField.active){
            textField.backgroundColor = this.activeBackgroundColor || this.backgroundColor;
            textField.borderColor = this.activeBorderColor || this.borderColor;
        }else if (textField.enabled){
            if (textField.over){
                textField.backgroundColor = this.overBackgroundColor || this.backgroundColor;
                textField.borderColor = this.overBorderColor || this.borderColor;
            }else{
                textField.backgroundColor = this.backgroundColor;
                textField.borderColor = this.borderColor;
            }
        }else{
            textField.backgroundColor = this.disabledBackgroundColor || this.backgroundColor;
            textField.borderColor = this.disabledBorderColor || this.borderColor;
        }
    },

    focusRingPathForControl: function(textField){
        if (this.showsFocusRing){
            return UITextFieldCustomStyler.$super.focusRingPathForControl.call(this, textField);
        }
        return null;
    }

});

})();