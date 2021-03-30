// #import "UIHTMLElementLayer.js"
// #import "UIControl.js"
// #import "UIImageView.js"
// #import "UITextField.js"
"use strict";

(function(){

JSClass("UIHTMLTextField", UIControl, {

    initWithSpec: function(spec){
        UIHTMLTextField.$super.initWithSpec.call(this, spec);
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
        UIHTMLTextField.$super.commonUIControlInit.call(this);
        this.font = JSFont.systemFontOfSize(JSFont.Size.normal);
        this._textInsets = JSInsets.Zero;
        this._clipView = UIView.init(this.bounds);
        this._clipView.userInteractionEnabled = false;
        this._clipView.backgroundColor = null;
        this._clipView.clipsToBounds = true;
        this.cursor = UICursor.arrow;
        if (this._styler === null){
            this._styler = UITextField.Styler.default;
        }
        this._styler.initializeControl(this);
    },

    delegate: null,

    text: JSDynamicProperty("_text", ""),

    setText: function(text){
        if (text === null || text === undefined){
            text = "";
        }
        this._text = text;
        this.setNeedsDisplay();
    },

    isEmpty: function(){
        return this.inputElement.value !== "";
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

    placeholder: JSDynamicProperty("_placeholder", null),
    placeholderColor: JSDynamicProperty("_placeholderColor", null),

    setPlaceholder: function(placeholder){
        this._placeholder = placeholder;
        this.updateAriaLabel();
        this.setNeedsDisplay();
    },

    _needsPlaceholderColor: false,

    setPlaceholderColor: function(color){
        this._placeholderColor = color;
        this._needsPlaceholderColor = true;
        this.setNeedsDisplay();
    },

    _createPlaceholderColor: function(){
        var backgroundColor = this.backgroundColor;
        if (backgroundColor === null){
            backgroundColor = JSColor.white;
        }
        this._placeholderColor = backgroundColor.colorByBlendingColor(this.textColor, 0.3);
        this._needsPlaceholderColor = true;
    },

    // --------------------------------------------------------------------
    // MARK: - Secure Entry

    secureEntry: JSDynamicProperty("_secureEntry", false),

    setSecureEntry: function(secureEntry){
        this._secureEntry = secureEntry;
        this.updateElementType();
    },

    updateElementType: function(){
        if (this.inputElement === null){
            return;
        }
        if (this.inputElement.tagName.toLowerCase() == "input"){
            if (this._secureEntry){
                this.inputElement.type = "password";
            }else{
                this.inputElement.type = "text";
            }
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Styling

    textAlignment: JSDynamicProperty("_textAlignment", JSTextAlignment.left),
    textColor: JSDynamicProperty("_textColor", JSColor.black),
    localCursorColor: JSDynamicProperty("_localCursorColor", JSColor.black),
    font: JSDynamicProperty("_font", null),

    setTextAlignment: function(textAlignment){
        this._textAlignment = textAlignment;
        this.setNeedsDisplay();
    },

    setTextColor: function(textColor){
        this._textColor = textColor;
        this.setNeedsDisplay();
    },

    setFont: function(font){
        this._font = font;
        this.setNeedsDisplay();
    },

    _selectionColor: null,
    _needsSelectionColor: false,

    setLocalCursorColor: function(color){
        this._localCursorColor = color;
        this._selectionColor = color.colorWithAlpha(0.25);
        this._needsSelectionColor = true;
        this.setNeedsDisplay();
    },

    // --------------------------------------------------------------------
    // MARK: - Undo Manager

    undoManager: null,

    getUndoManager: function(){
        return this.undoManager;
    },

    _sendChangeNotificaions: function(){
        this._didChange = true;
        this.didChangeValueForBinding('text');
        this.didChangeValueForBinding('integerValue');
        this.postAccessibilityNotification(UIAccessibility.Notification.valueChanged);
        this.sendActionsForEvents(UIControl.Event.valueChanged);
        if (this.delegate && this.delegate.textFieldDidChange){
            this.delegate.textFieldDidChange(this);
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Drawing

    inputElement: null,

    layerDidCreateElement: function(layer){
        if (this._multiline && !this._secureEntry){
            this.inputElement = layer.element.ownerDocument.createElement("textarea");
        }else{
            this.inputElement = layer.element.ownerDocument.createElement("input");
        }
        this.updateElementType();
        this.inputElement.style.appearance = "none";
        this.inputElement.style.position = "absolute";
        this.inputElement.style.top = "0";
        this.inputElement.style.left = "0";
        this.inputElement.style.display = "block";
        this.inputElement.style.border = "none";
        this.inputElement.style.padding = "0";
        this.inputElement.style.margin = "0";
        this.inputElement.style.webkitAppearance = "none";
        this.inputElement.style.backgroundColor = "transparent";
        // this.inputElement.style.cursor = "text";
        this.inputElement.style.outline = "none";
        this.inputElement.setAttribute("role", "textbox");
        this.inputElement.setAttribute("tabindex", "0");
        this.inputElement.setAttribute("tabindex", "0");
        if (this._multiline){
            this.inputElement.setAttribute("aria-multiline", true);
        }
        this.updateAriaLabel();
        this.inputElement.id = "htmltextfield-" + this.objectID;
        if (UIHTMLTextField.sharedStyleElement === null){
            UIHTMLTextField.sharedStyleElement = layer.element.ownerDocument.createElement("style");
            UIHTMLTextField.sharedStyleElement.type = "text/css";
            layer.element.ownerDocument.head.appendChild(UIHTMLTextField.sharedStyleElement);
        }
        if (this._placeholderColor === null){
            this._createPlaceholderColor();
        }
        var stylesheet = UIHTMLTextField.sharedStyleElement.sheet;
        var index = stylesheet.insertRule("#%s::selection { }".sprintf(this.inputElement.id));
        this.selectionStyleRule = stylesheet.cssRules.item(index);
        index = stylesheet.insertRule("#%s::placeholder { }".sprintf(this.inputElement.id));
        this.placeholderStyleRule = stylesheet.cssRules.item(index);
        layer.element.appendChild(this.inputElement);
        this.addEventListeners();
    },

    layerWillDestroyElement: function(layer){
        this.removeEventListeners();
        var stylesheet = UIHTMLTextField.sharedStyleElement.sheet;
        var i, l;
        for (i = 0, l = stylesheet.cssRules.length; i < l; ++i){
            if (stylesheet.cssRules.item(i) === this.selectionStyleRule){
                this.selectionStyleRule = null;
                stylesheet.deleteRule(i);
                break;
            }
        }
        for (i = 0, l = stylesheet.cssRules.length; i < l; ++i){
            if (stylesheet.cssRules.item(i) === this.placeholderStyleRule){
                this.placeholderStyleRule = null;
                stylesheet.deleteRule(i);
                break;
            }
        }
    },

    addEventListeners: function(){
        this.inputElement.addEventListener("input", this);
        this.inputElement.addEventListener("keydown", this);
        this.inputElement.addEventListener("keup", this);
        this.inputElement.addEventListener("mousedown", this);
        this.inputElement.addEventListener("mouseup", this);
        this.inputElement.addEventListener("touchstart", this);
        this.inputElement.addEventListener("touchend", this);
        this.inputElement.addEventListener("touchcancel", this);
        this.inputElement.addEventListener("touchmove", this);
        this.inputElement.addEventListener("focus", this);
        this.inputElement.addEventListener("blur", this);
    },

    removeEventListeners: function(){
        this.inputElement.removeEventListener("input", this);
        this.inputElement.removeEventListener("keydown", this);
        this.inputElement.removeEventListener("keyup", this);
        this.inputElement.removeEventListener("mousedown", this);
        this.inputElement.removeEventListener("mouseup", this);
        this.inputElement.removeEventListener("touchstart", this);
        this.inputElement.removeEventListener("touchend", this);
        this.inputElement.removeEventListener("touchcancel", this);
        this.inputElement.removeEventListener("touchmove", this);
        this.inputElement.removeEventListener("focus", this);
        this.inputElement.removeEventListener("blur", this);
    },

    handleEvent: function(e){
        this["_event_" + e.type](e);
    },

    _event_input: function(e){
        this._text = this.inputElement.value;
        this._sendChangeNotificaions();
    },

    _event_keydown: function(e){
        // stop propagation so default behavior is NOT prevented by the window sever
        e.stopPropagation();
        switch (e.key){
            case "Enter":
                if (!this._multiline){
                    e.preventDefault();
                    if (this.delegate && this.delegate.textFieldDidReceiveEnter){
                        this.delegate.textFieldDidReceiveEnter(this);
                    }
                }
                break;
            case "Tab":
                e.preventDefault();
                if (e.shift){
                    this.window.setFirstResponderToKeyViewBeforeView(this);
                }else{
                    this.window.setFirstResponderToKeyViewAfterView(this);
                }
                break;
        }
    },

    _event_keyup: function(e){
        // stop propagation so default behavior is NOT prevented by the window sever
        e.stopPropagation();
    },

    _event_mousedown: function(e){
        // stop propagation so default behavior is NOT prevented by the window sever
        e.stopPropagation();
        if (!this.isFirstResponder()){
            this.window.firstResponder = this;
        }
    },

    _event_mouseup: function(e){
        // stop propagation so default behavior is NOT prevented by the window sever
        e.stopPropagation();
    },

    _event_touchstart: function(e){
        // stop propagation so default behavior is NOT prevented by the window sever
        e.stopPropagation();
    },

    _event_touchend: function(e){
        // stop propagation so default behavior is NOT prevented by the window sever
        e.stopPropagation();
    },

    _event_touchcancel: function(e){
        // stop propagation so default behavior is NOT prevented by the window sever
        e.stopPropagation();
    },

    _event_touchmove: function(e){
        // stop propagation so default behavior is NOT prevented by the window sever
        e.stopPropagation();
    },

    _event_focus: function(e){
        this._inputElementFocused = true;
        if (!this.isFirstResponder()){
            this.window.firstResponder = this;   
        }
    },

    _event_blur: function(e){
        this._inputElementFocused = false;
        this.updateInputElementFocus();
    },

    drawLayerInContext: function(layer, context){
        UIHTMLTextField.$super.drawLayerInContext.call(this, layer, context);
        layer.drawInContext(context);
        this.inputElement.style.width = layer.element.style.width;
        this.inputElement.style.height = layer.element.style.height;
        this.inputElement.text = this._text;
        this.inputElement.placeholder = this._placeholder;
        var autocomplete = htmlAutocompleteByTextContentType[this._textContentType];
        if (autocomplete === ""){
            if (this._secureEntry){
                autocomplete = "off";
            }else{
                autocomplete = "on";
            }
        }
        if (this.inputElement.autocomplete !== autocomplete){
            this.inputElement.autocomplete = autocomplete;
        }
        if (this.inputElement.inputMode !== htmlInputModeByKeyboardType[this._keyboardType]){
            this.inputElement.inputMode = htmlInputModeByKeyboardType[this._keyboardType];
        }
        if (this.inputElement.autocapitalize !== htmlInputModeByKeyboardType[this._autocapitalizationType]){
            this.inputElement.autocapitalize = htmlAutocapitalizeByType[this._autocapitalizationType];
        }
        var style = this.inputElement.style;
        style.color = this._textColor.cssString();
        style.font = this._font.cssString();
        style.textAlign = this._textAlignment;
        style.caretColor = this._localCursorColor.cssString();
        if (this._needsSelectionColor){
            this._needsSelectionColor = false;
            this.selectionStyleRule.style.backgroundColor = this._selectionColor.cssString();
        }
        if (this._needsPlaceholderColor){
            this._needsPlaceholderColor = false;
            this.placeholderStyleRule.style.color = this.placeholderColor.cssString();
        }
        this._inputElementFocused = false;
        this.updateInputElementFocus();
    },

    // --------------------------------------------------------------------
    // MARK: - Layout Configuration

    multiline: JSDynamicProperty('_multiline', false, 'isMultiline'),
    minimumHeight: JSDynamicProperty('_minimumHeight', 0),
    textInsets: JSDynamicProperty('_textInsets', null),

    setMultiline: function(multiline){
        if (multiline === this._multiline){
            return;
        }
        if (this.inputElement !== null){
            throw new Error("cannot change multiline after init");
        }
        this._multiline = multiline;
    },

    setTextInsets: function(textInsets){
        this._textInsets = textInsets;
        this.updateElementInsets();
    },

    updateElementInsets: function(){
        var insets = JSInsets(this._textInsets);
        if (this._leftAccessoryView !== null){
            insets.left += this._leftAccessoryInsets.width + this._leftAccessorySize.width;
        }
        if (this._rightAccessoryView !== null){
            insets.right += this._rightAccessoryInsets.width + this._rightAccessorySize.width;
        }
        this.layer.elementInsets = insets;
        this.setNeedsLayout();
    },

    getIntrinsicSize: function(){
        if (!this._multiline){
            return JSSize(UIView.noIntrinsicSize, this.font.displayLineHeight + this._textInsets.height);
        }
        // FIXME: could still get an intrinsic height if we know the width
        return JSSize(UIView.noIntrinsicSize, UIView.noIntrinsicSize);
    },

    getFirstBaselineOffsetFromTop: function(){
        return this._textInsets.top + this.font.displayAscender;
    },

    getLastBaselineOffsetFromBottom: function(){
        return this._textInsets.bottom - this.font.displayDescender;
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
        this.updateElementInsets();
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
        this.updateElementInsets();
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
                accessoryView.hidden = this._text !== "";
                break;
            default:
                accessoryView.hidden = false;
                break;
        }
    },

    setLeftAcessorySize: function(size){
        this._leftAccessorySize = JSSize(size);
        this.setNeedsLayout();
        this.updateElementInsets();
    },

    setRightAccessorySize: function(size){
        this._rightAccessorySize = JSSize(size);
        this.setNeedsLayout();
        this.updateElementInsets();
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
        if (this.inputElement === null){
            return [];
        }
        var start = this.inputElement.selectionStart;
        var end = this.inputElement.selectionEnd;
        if (start === null){
            return [];
        }
        return [UITextInputSelection(JSRange(start, end - start), this.inputElement.direction == "backward" ? UITextInput.SelectionInsertionPoint.start : UITextInput.SelectionInsertionPoint.end)];
    },

    setSelectionRange: function(range, insertionPoint, affinity){
        if (this.inputElement === null){
            return;
        }
        this.inputElement.setSelectionRange(range.location, range.end, insertionPoint === UITextInput.SelectionInsertionPoint.start ? "backward" : "forward");
    },

    setSelectionRanges: function(selectionRanges, insertionPoint, affinity){
        this.setSelectionRange(selectionRanges[0], insertionPoint, affinity);
    },

    // --------------------------------------------------------------------
    // MARK: - Editing Operations

    canPerformAction: function(action, sender){
        if (action == 'copy' || action == 'cut'){
            if (this._secureEntry){
                return false;
            }
            var selections = this.getSelections();
            for (var i = 0, l = selections.length; i < l; ++i){
                if (selections[i].range.length > 0){
                    return true;
                }
            }
            return false;
        }
        return UITextField.$super.canPerformAction.call(this, action, sender);
    },

    cut: function(){
        this.copy();
        this._replaceSelectedText("");
    },

    copy: function(){
        var selections = this.getSelections();
        var selection;
        var lines = [];
        for (var i = 0, l = selections.length; i < l; ++i){
            selection = selections[i];
            if (selection.range.length > 0){
                lines.push(this._text.substringInRange(selection.range));
            }
        }
        if (lines.length > 0){
            var text = lines.join('\n');
            UIPasteboard.general.setStringForType(text, UIPasteboard.ContentType.plainText);
        }
    },

    paste: function(){
        this.pasteAndMatchStyle();
    },

    pasteAndMatchStyle: function(){
        if (UIPasteboard.general.containsType(UIPasteboard.ContentType.plainText)){
            var text = UIPasteboard.general.stringForType(UIPasteboard.ContentType.plainText);
            this._replaceSelectedText(text);
        }
    },

    _replaceSelectedText: function(replacement){
        var selections = this.selections;
        var selection;
        for (var i = selections.length - 1; i >= 0; --i){
            selection = selections[i];
            this.inputElement.setRangeText("", selection.location, selection.end);
        }
        this._sendChangeNotificaions();
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
        this._didChange = false;
        this.sendActionsForEvents(UIControl.Event.editingDidBegin);
        this.updateInputElementFocus();
    },

    resignFirstResponder: function(){
        this.active = false;
        this._updateAccessoryViewHidden(this._leftAccessoryView, this._leftAccessoryVisibility);
        this._updateAccessoryViewHidden(this._rightAccessoryView, this._rightAccessoryVisibility);
        var events = UIControl.Event.editingDidEnd;
        if (this._didChange){
            events |= UIControl.Event.primaryAction | UIControl.Event.valueChanged;
        }
        this.sendActionsForEvents(events);
        this.updateInputElementFocus();
    },

    windowDidChangeKeyStatus: function(){
        this.updateInputElementFocus();
    },

    _inputElementFocused: false,

    updateInputElementFocus: function(){
        if (this.inputElement === null){
            return;
        }
        if (this.isFirstResponder() && this.window !== null && this.window.isKeyWindow){
            if (!this._inputElementFocused){
                this.inputElement.focus();
            }
        }else{
            if (this._inputElementFocused){
                this.inputElement.blur();
            }
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Layout

    layoutSubviews: function(){
        UITextField.$super.layoutSubviews.call(this);
        if (this._leftAccessoryView !== null){
            this._leftAccessoryView.frame = JSRect(
                this._leftAccessoryInsets.left,
                Math.floor((this.bounds.size.height - this._leftAccessorySize.height) / 2.0),
                this._leftAccessorySize.width,
                this._leftAccessorySize.height
            );
        }
        if (this._rightAccessoryView !== null){
            this._rightAccessoryView.frame = JSRect(
                this.bounds.size.width - this._rightAccessoryInsets.right - this._rightAccessorySize.width,
                Math.floor((this.bounds.size.height - this._rightAccessorySize.height) / 2.0),
                this._rightAccessorySize.width,
                this._rightAccessorySize.height
            );
        }
    },

    sizeToFitText: function(maxSize){
        // TODO: needs testing
        var size = JSSize.Zero;
        if (this._multiline){
            size.width = this.bounds.size.width;
            size.height = this._textInsets.height;
            size.height += this.inputElement.scrollHeight;
        }else{
            size.height = this.intrinsicSize.height;
            size.width = this._contentInsets.width;
            size.width += this.inputElement.scrollWidth;
        }
        if (size.width > maxSize.width){
            size.width = maxSize.width;
        }
        if (size.height > maxSize.height){
            size.height = maxSize.height;
        }
        this.bounds = JSRect(JSPoint.Zero, size);
        // TODO: update inputElement size immediately?
    },

    // --------------------------------------------------------------------
    // MARK: - Input Behaviors

    keyboardType: JSDynamicProperty("_keyboardType", UITextInput.KeyboardType.default),
    autocapitalizationType: JSDynamicProperty("_autocapitalizationType", UITextInput.AutocapitalizationType.none),
    textContentType: JSDynamicProperty("_textContentType", ""),

    setKeybordType: function(keyboardType){
        this._keyboardType = keyboardType;
        this.setNeedsDisplay();
    },

    setAutocapitalizationType: function(autocapitalizationType){
        this._autocapitalizationType = autocapitalizationType;
        this.setNeedsDisplay();
    },

    setTextContentType: function(textContentType){
        this._textContentType = textContentType;
        this.setNeedsDisplay();
    },

    // --------------------------------------------------------------------
    // MARK: - Accessibility

    // This view is not considered an accessibility element because we'll
    // directly configure this.inputElement with appropriate accessibility
    // properties
    isAccessibilityElement: false,

    accessibilityMultiline: JSReadOnlyProperty(),

    setAccessibilityLabel: function(accessibilityLabel){
        this._accessibilityLabel = accessibilityLabel;
        this.updateAriaLabel();
    },

    getAccessibilityMultiline: function(){
        return this._multiline;
    },

    updateAriaLabel: function(){
        if (this.inputElement === null){
            return;
        }
        var label = this._accessibilityLabel;
        if (label === null){
            label = this._placeholder;
        }
        if (label !== null && label !== undefined){
            this.inputElement.setAttribute("aria-label", label);
        }else{
            this.inputElement.removeAttribute("aria-label");
        }
    },

});

UIHTMLTextField.layerClass = UIHTMLElementLayer;

UIHTMLTextField.sharedStyleElement = null;

var htmlInputModeByKeyboardType = {};
htmlInputModeByKeyboardType[UITextInput.KeyboardType.default] = "";
htmlInputModeByKeyboardType[UITextInput.KeyboardType.url] = "url";
htmlInputModeByKeyboardType[UITextInput.KeyboardType.email] = "email";
htmlInputModeByKeyboardType[UITextInput.KeyboardType.phone] = "tel";
htmlInputModeByKeyboardType[UITextInput.KeyboardType.number] = "numeric";
htmlInputModeByKeyboardType[UITextInput.KeyboardType.decimal] = "decimal";
htmlInputModeByKeyboardType[UITextInput.KeyboardType.search] = "search";

var htmlAutocapitalizeByType = {};
htmlAutocapitalizeByType[UITextInput.AutocapitalizationType.none] = "none";
htmlAutocapitalizeByType[UITextInput.AutocapitalizationType.words] = "words";
htmlAutocapitalizeByType[UITextInput.AutocapitalizationType.sentences] = "sentences";
htmlAutocapitalizeByType[UITextInput.AutocapitalizationType.characters] = "characters";

var htmlAutocompleteByTextContentType = {};
htmlAutocompleteByTextContentType[UITextInput.TextContentType.none] = "";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.url] = "url";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.email] = "email";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.phone] = "tel";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.username] = "username";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.password] = "current-password";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.newPassword] = "new-password";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.oneTimeCode] = "one-time-code";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.name] = "name";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.namePrefix] = "honorific-prefix";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.givenName] = "given-name";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.middleName] = "additional-name";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.familyName] = "family-name";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.nameSuffix] = "honorific-suffix";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.nickname] = "nickname";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.organizationName] = "organization-title";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.streetAddress] = "street-address";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.streetAddressLine1] = "address-line1";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.streetAddressLine2] = "address-line2";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.city] = "address-level2";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.state] = "address-level1";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.locality] = "address-level3";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.country] = "country-name";
htmlAutocompleteByTextContentType[UITextInput.TextContentType.postalCode] = "postal-code";

})();