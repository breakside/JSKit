// #import "UIPopupWindow.js"
// #import "UISlider.js"
// #import "UITextField.js"
/* global UIColorWell, UIColorWellDefaultStyler */
"use strict";

JSProtocol("UIColorPanelDelegate", JSProtocol, {

    colorPanelDidChangeColor: function(panel, color){},
    colorPanelDidClose: function(panel){}

});

JSClass("UIColorPanel", UIPopupWindow, {

    init: function(){
        UIColorPanel.$super.init.call(this);
        this.contentViewController = UIColorPanelViewController.init();
    },

    delegate: JSDynamicProperty(),

    getDelegate: function(){
        return this.contentViewController.delegate;
    },

    setDelegate: function(delegate){
        this.contentViewController.delegate = delegate;
    },

    color: JSDynamicProperty(),

    getColor: function(){
        return this.contentViewController.color;
    },

    setColor: function(color){
        this.contentViewController.color = color;
    },

    showsAlpha: JSDynamicProperty(),

    getShowsAlpha: function(){
        return this.contentViewController.showsAlpha;
    },

    setShowsAlpha: function(showsAlpha){
        this.contentViewController.showsAlpha = showsAlpha;
    },

    componentModel: JSDynamicProperty(),

    getComponentModel: function(){
        return this.contentViewController.componentModel;
    },

    setComponentModel: function(componentModel){
        this.contentViewController.componentModel = componentModel;
    },

    indicateModalStatus: function(){
        this.close();
    }

});

UIColorPanel.Model = {
    rgb: "rgb",
    hsl: "hsl",
    hsv: "hsv"
};

JSClass("UIColorPanelViewController", UIViewController, {

    delegate: null,
    color: JSDynamicProperty("_color", null),
    showsAlpha: JSDynamicProperty("_showsAlpha", true),
    componentModel: JSDynamicProperty("_componentModel", UIColorPanel.Model.hsv),

    init: function(){
        this.color = JSColor.black;
        this.contentInsets = JSInsets(0);
    },

    initWithSpec: function(spec){
        UIColorPanelViewController.$super.initWithSpec.call(this, spec);
        if (spec.containsKey("delegate")){
            this.delegate = spec.valueForKey("delegate");
        }
        // before color because setColor checks this._showsAlpha
        if (spec.containsKey("showsAlpha")){
            this._showsAlpha = spec.valueForKey("showsAlpha");
        }
        if (spec.containsKey("color")){
            // use setter so we set _hsvComponents and adjust color according
            // to _showsAlpha.
            this.color = spec.valueForKey("color", JSColor);
        }
        if (spec.containsKey("componentModel")){
            this._componentModel = spec.valueForKey("componentModel", UIColorPanel.Model);
        }
        if (spec.containsKey("contentInsets")){
            this.contentInsets = spec.valueForKey("contentInsets", JSInsets);
        }
    },

    setColor: function(color){
        this._color = color.rgbaColor();
        this._hsvComponents = JSColorSpace.rgb.hsvFromComponents(this._color.components);
        if (!this._showsAlpha){
            this._color = this._color.colorWithAlpha(1);
        }
        if (this.isViewLoaded){
            this._hueChanged();
            this._saturationBrightnessChanged();
            this._alphaChanged();
        }
    },

    setShowsAlpha: function(showsAlpha){
        this._showsAlpha = showsAlpha;
        if (this.isViewLoaded){
            this.view.setNeedsLayout();
        }
    },

    setComponentModel: function(componentModel){
        this._componentModel = componentModel;
        this._updateComponentLabels();
        this._updateComponent1Field();
        this._updateComponent2Field();
        this._updateComponent3Field();
    },

    // MARK: - View Lifecycle

    viewDidLoad: function(){
        UIColorPanelViewController.$super.viewDidLoad.call(this);
        var hueStyler = UISliderColorStyler.initWithColors([
            JSColor.initWithHSVA(0, 1, 1),
            JSColor.initWithHSVA(1/6, 1, 1),
            JSColor.initWithHSVA(2/6, 1, 1),
            JSColor.initWithHSVA(3/6, 1, 1),
            JSColor.initWithHSVA(4/6, 1, 1),
            JSColor.initWithHSVA(5/6, 1, 1),
            JSColor.initWithHSVA(1, 1, 1)
        ]);
        var alphaStyler = UISliderColorStyler.initWithColors([
            JSColor.initWithHSVA(0, 0, 0, 0),
            JSColor.initWithHSVA(0, 0, 0, 1)
        ]);
        var wellStyler = UIColorWellDefaultStyler.init();
        wellStyler.disabledBorderWidth = 0;
        wellStyler.cornerRadius = 3;
        var componentStyler = UITextFieldCustomStyler.init();
        componentStyler.backgroundColor = JSColor.white.colorWithAlpha(0.4);
        componentStyler.activeBackgroundColor = JSColor.white.colorWithAlpha(0.8);
        componentStyler.cornerRadius = 3;
        componentStyler.textInsets = JSInsets(3, 4);
        componentStyler.textColor = JSColor.black;
        componentStyler.placeholderColor = JSColor.black.colorWithAlpha(0.4);
        componentStyler.borderWidth = 1;
        componentStyler.borderColor = JSColor.black.colorWithAlpha(0.2);
        componentStyler.activeBorderColor = JSColor.black.colorWithAlpha(0.4);
        componentStyler.disabledBorderColor = JSColor.black.colorWithAlpha(0.2);
        this.saturationBrightnessControl = UIColorPanelTwoAxisSlider.init();
        this.hueSlider = UISlider.initWithStyler(hueStyler);
        this.alphaSlider = UISlider.initWithStyler(alphaStyler);
        this.previewWell = UIColorWell.initWithStyler(wellStyler);
        this.previewWell.enabled = false;
        this.hexField = UITextField.initWithStyler(componentStyler);
        this.component1Field = UITextField.initWithStyler(componentStyler);
        this.component2Field = UITextField.initWithStyler(componentStyler);
        this.component3Field = UITextField.initWithStyler(componentStyler);
        this.component4Field = UITextField.initWithStyler(componentStyler);
        this.hexLabel = UILabel.init();
        this.component1Label = UILabel.init();
        this.component2Label = UILabel.init();
        this.component3Label = UILabel.init();
        this.component4Label = UILabel.init();

        this.view.addSubview(this.saturationBrightnessControl);
        this.view.addSubview(this.hueSlider);
        this.view.addSubview(this.alphaSlider);
        this.view.addSubview(this.previewWell);
        this.view.addSubview(this.hexField);
        this.view.addSubview(this.component1Field);
        this.view.addSubview(this.component2Field);
        this.view.addSubview(this.component3Field);
        this.view.addSubview(this.component4Field);
        this.view.addSubview(this.hexLabel);
        this.view.addSubview(this.component1Label);
        this.view.addSubview(this.component2Label);
        this.view.addSubview(this.component3Label);
        this.view.addSubview(this.component4Label);

        this.hexField.nextKeyView = this.component1Field;
        this.component1Field.nextKeyView = this.component2Field;
        this.component2Field.nextKeyView = this.component3Field;
        this.component3Field.nextKeyView = this.component4Field;
        this.component4Field.nextKeyView = this.hexField;

        this.hexLabel.text = "Hex";
        this._updateComponentLabels();
        this.component4Label.text = "Alpha";
        this.hexLabel.textColor = JSColor.initWithWhite(0.5);
        this.component1Label.textColor = this.hexLabel.textColor;
        this.component2Label.textColor = this.hexLabel.textColor;
        this.component3Label.textColor = this.hexLabel.textColor;
        this.component4Label.textColor = this.hexLabel.textColor;
        this.hexLabel.font = this.hexLabel.font.fontWithPointSize(JSFont.Size.detail);
        this.component1Label.font = this.hexLabel.font;
        this.component2Label.font = this.hexLabel.font;
        this.component3Label.font = this.hexLabel.font;
        this.component4Label.font = this.hexLabel.font;

        var hashLabel = UILabel.init();
        hashLabel.font = this.hexField.font;
        hashLabel.textColor = JSColor.initWithWhite(0.6);
        hashLabel.text = "#";
        hashLabel.sizeToFit();
        this.hexField.leftAccessoryView = hashLabel;
        this.hexField.leftAccessorySize = hashLabel.bounds.size;
        this.hexField.leftAccessoryVisibility = UITextField.AccessoryVisibility.always;

        this.saturationBrightnessControl.addAction(this.saturationBrightnessChanged, this);
        this.hueSlider.addAction(this.hueSliderChanged, this);
        this.alphaSlider.addAction(this.alphaSliderChanged, this);
        this.hexField.addAction(this.hexFieldChanged, this);
        this.component1Field.addAction(this.component1FieldChanged, this);
        this.component2Field.addAction(this.component2FieldChanged, this);
        this.component3Field.addAction(this.component3FieldChanged, this);
        this.component4Field.addAction(this.component4FieldChanged, this);

        this._hueChanged();
        this._saturationBrightnessChanged();
        this._alphaChanged();
    },

    viewWillAppear: function(animated){
        UIColorPanelViewController.$super.viewWillAppear.call(this, animated);
    },

    viewDidAppear: function(animated){
        UIColorPanelViewController.$super.viewDidAppear.call(this, animated);
        this.view.window.firstResponder = this.hexField;
    },

    viewWillDisappear: function(animated){
        UIColorPanelViewController.$super.viewWillDisappear.call(this, animated);
    },

    viewDidDisappear: function(animated){
        UIColorPanelViewController.$super.viewDidDisappear.call(this, animated);
        if (this.delegate && this.delegate.colorPanelDidClose){
            this.delegate.colorPanelDidClose(this);
        }
    },

    // MARK: - Views

    saturationBrightnessControl: null,
    hueSlider: null,
    alphaSlider: null,
    previewWell: null,
    hexField: null,
    component1Field: null,
    component2Field: null,
    component3Field: null,
    component4Field: null,
    hexLabel: null,
    component1Label: null,
    component2Label: null,
    component3Label: null,
    component4Label: null,

    // MARK: - Actions

    _hsvComponents: null,

    saturationBrightnessChanged: function(slider){
        this._hsvComponents[1] = slider.value.x;
        this._hsvComponents[2] = slider.value.y;
        this._color = JSColor.initWithHSVA(
            this._hsvComponents[0],
            this._hsvComponents[1],
            this._hsvComponents[2],
            this._color.alpha
        );
        this._saturationBrightnessChanged(slider);
        this.notifyDelegateOfColor();
    },

    hueSliderChanged: function(slider){
        this._hsvComponents[0] = slider.value;
        this._recalculateColorFromHSV();
        this._hueChanged(slider);
        this.notifyDelegateOfColor();
    },

    alphaSliderChanged: function(slider){
        this._color = this._color.colorWithAlpha(slider.value);
        this._alphaChanged(slider);
        this.notifyDelegateOfColor();
    },

    component1FieldChanged: function(textField){
        var value = textField.integerValue;
        if (isNaN(value)){
            this._updateComponent1Field();
        }else{
            switch (this._componentModel){
                case UIColorPanel.Model.rgb:
                    this._color = JSColor.initWithRGBA(
                        Math.max(0, Math.min(1, value / 255.0)),
                        this._color.green,
                        this._color.blue,
                        this._color.alpha
                    );
                    this._recalculateHSVFromColor();
                    break;
                case UIColorPanel.Model.hsl:
                case UIColorPanel.Model.hsv:
                    this._hsvComponents[0] = Math.max(0, Math.min(1, value / 360.0));
                    this._recalculateColorFromHSV();
                    this._hueChanged(textField);
                    break;
            }
            this.notifyDelegateOfColor();
        }
    },

    component2FieldChanged: function(textField){
        var value = textField.integerValue;
        if (isNaN(value)){
            this._updateComponent2Field();
        }else{
            switch (this._componentModel){
                case UIColorPanel.Model.rgb:
                    this._color = JSColor.initWithRGBA(
                        this._color.red,
                        Math.max(0, Math.min(1, value / 255.0)),
                        this._color.blue,
                        this._color.alpha
                    );
                    this._recalculateHSVFromColor();
                    break;
                case UIColorPanel.Model.hsl:
                    this._hsvComponents = JSColorSpace.rgb.hsvFromHSL(
                        this._hsvComponents[0],
                        Math.max(0, Math.min(1, value / 100.0)),
                        JSColorSpace.rgb.hslFromHSV(this._hsvComponents)[2]
                    );
                    this._recalculateColorFromHSV();
                    this._saturationBrightnessChanged(textField);
                    break;
                case UIColorPanel.Model.hsv:
                    this._hsvComponents[1] = Math.max(0, Math.min(1, value / 100.0));
                    this._recalculateColorFromHSV();
                    this._saturationBrightnessChanged(textField);
                    break;
            }
            this.notifyDelegateOfColor();
        }
    },

    component3FieldChanged: function(textField){
        var value = textField.integerValue;
        if (isNaN(value)){
            this._updateComponent2Field();
        }else{
            switch (this._componentModel){
                case UIColorPanel.Model.rgb:
                    this._color = JSColor.initWithRGBA(
                        this._color.red,
                        this._color.green,
                        Math.max(0, Math.min(1, value / 255.0)),
                        this._color.alpha
                    );
                    this._recalculateHSVFromColor();
                    break;
                case UIColorPanel.Model.hsl:
                    this._hsvComponents = JSColorSpace.rgb.hsvFromHSL(
                        this._hsvComponents[0],
                        JSColorSpace.rgb.hslFromHSV(this._hsvComponents)[1],
                        Math.max(0, Math.min(1, value / 100.0))
                    );
                    this._recalculateColorFromHSV();
                    this._saturationBrightnessChanged(textField);
                    break;
                case UIColorPanel.Model.hsv:
                    this._hsvComponents[2] = Math.max(0, Math.min(1, value / 100.0));
                    this._recalculateColorFromHSV();
                    this._saturationBrightnessChanged(textField);
                    break;
            }
            this.notifyDelegateOfColor();
        }
    },

    component4FieldChanged: function(textField){
        var alpha = textField.integerValue;
        if (isNaN(alpha)){
            this._updateComponent4Field();
        }else{
            this._color = this._color.colorWithAlpha(Math.max(0, Math.min(1, alpha / 100.0)));
            this._alphaChanged(textField);
            this.notifyDelegateOfColor();
        }
    },

    _recalculateHSVFromColor: function(){
        var originalComponents = this._hsvComponents;
        this._hsvComponents = JSColorSpace.rgb.hsvFromComponents(this._color.components);
        if (this._hsvComponents[1] === 0 || this._hsvComponents[2] === 0){
            this._hsvComponents[0] = originalComponents[0];
        }
        if (this._hsvComponents[0] !== originalComponents[0]){
            this._hueChanged();
        }
        if (this._hsvComponents[1] !== originalComponents[1] || this._hsvComponents[2] !== originalComponents[2]){
            this._saturationBrightnessChanged();
        }
    },

    _recalculateColorFromHSV: function(){
        this._color = JSColor.initWithHSVA(
            this._hsvComponents[0],
            this._hsvComponents[1],
            this._hsvComponents[2],
            this._color.alpha
        );
    },

    _updateComponent1Field: function(){
        switch (this._componentModel){
            case UIColorPanel.Model.rgb:
                this.component1Field.integerValue = Math.round(this._color.red * 255);
                break;
            case UIColorPanel.Model.hsl:
            case UIColorPanel.Model.hsv:
                this.component1Field.integerValue = Math.round(this._hsvComponents[0] * 360);
                break;
        }
    },

    _updateComponent2Field: function(){
        switch (this._componentModel){
            case UIColorPanel.Model.rgb:
                this.component2Field.integerValue = Math.round(this._color.green * 255);
                break;
            case UIColorPanel.Model.hsl:
                this.component2Field.integerValue = Math.round(JSColorSpace.rgb.hslFromHSV(this._hsvComponents)[1] * 100);
                break;
            case UIColorPanel.Model.hsv:
                this.component2Field.integerValue = Math.round(this._hsvComponents[1] * 100);
                break;
        }
    },

    _updateComponent3Field: function(){
        switch (this._componentModel){
            case UIColorPanel.Model.rgb:
                this.component3Field.integerValue = Math.round(this._color.blue * 255);
                break;
            case UIColorPanel.Model.hsl:
                this.component3Field.integerValue = Math.round(JSColorSpace.rgb.hslFromHSV(this._hsvComponents)[2] * 100);
                break;
            case UIColorPanel.Model.hsv:
                this.component3Field.integerValue = Math.round(this._hsvComponents[2] * 100);
                break;
        }
    },

    _updateComponent4Field: function(){
        this.component4Field.integerValue = Math.round(this._color.alpha * 100);
    },

    hexFieldChanged: function(textField){
        var color = JSColor.initWithRGBAHexString(textField.text);
        if (color === null){
            color = JSColor.black;
        }
        this.color = color;
        this.notifyDelegateOfColor();
    },

    _hueChanged: function(sender){
        if (sender !== this.hueSlider){
            this.hueSlider.value = this._hsvComponents[0];
        }

        this._updateSaturationBrightnessColor();
        this._updateAlphaSliderColor();
        this._updateHexField();
        this._updatePreview();

        switch (this._componentModel){
            case UIColorPanel.Model.rgb:
                this._updateComponent1Field();
                this._updateComponent2Field();
                this._updateComponent3Field();
                break;
            case UIColorPanel.Model.hsl:
            case UIColorPanel.Model.hsv:
                this._updateComponent1Field();
                break;
        }
    },

    _saturationBrightnessChanged: function(sender){
        if (sender !== this.saturationBrightnessControl){
            this.saturationBrightnessControl.value = JSPoint(
                this._hsvComponents[1],
                this._hsvComponents[2]
            );
        }
        this._updateAlphaSliderColor();
        this._updateHexField();
        this._updatePreview();

        switch (this._componentModel){
            case UIColorPanel.Model.rgb:
                this._updateComponent1Field();
                this._updateComponent2Field();
                this._updateComponent3Field();
                break;
            case UIColorPanel.Model.hsl:
            case UIColorPanel.Model.hsv:
                this._updateComponent2Field();
                this._updateComponent3Field();
                break;
        }
    },

    _alphaChanged: function(sender){
        if (sender !== this.alphaSlider){
            this.alphaSlider.value = this._color.alpha;
        }
        this._updateComponent4Field();
        this._updatePreview();
    },

    _updateAlphaSliderColor: function(){
        this.alphaSlider.styler.setColors([
            this._color.colorWithAlpha(0),
            this._color.colorWithAlpha(1),
        ]);
        this.alphaSlider.styler.updateControl(this.alphaSlider);
    },

    _updateSaturationBrightnessColor: function(){
        var xLayer = this.saturationBrightnessControl.xLayer;
        var pureColor = JSColor.initWithHSVA(this._hsvComponents[0], 1, 1, 1);
        var gradient = JSGradient.initWithColors([JSColor.white, pureColor]);
        gradient.start = JSPoint(0, 0);
        gradient.end = JSPoint(1, 0);
        this.saturationBrightnessControl.xLayer.backgroundGradient = gradient;
    },

    _updateHexField: function(){
        this.hexField.text = this._color.rgbaHexStringRepresentation().substr(0, 6);
    },

    _updatePreview: function(){
        this.previewWell.color = this._color;
    },

    _updateComponentLabels: function(){
        switch (this._componentModel){
            case UIColorPanel.Model.rgb:
                this.component1Label.text = "R";
                this.component2Label.text = "G";
                this.component3Label.text = "B";
                break;
            case UIColorPanel.Model.hsl:
                this.component1Label.text = "H";
                this.component2Label.text = "S";
                this.component3Label.text = "L";
                break;
            case UIColorPanel.Model.hsv:
                this.component1Label.text = "H";
                this.component2Label.text = "S";
                this.component3Label.text = "B";
                break;
        }
    },

    notifyDelegateOfColor: function(){
        if (this.delegate && this.delegate.colorPanelDidChangeColor){
            this.delegate.colorPanelDidChangeColor(this, this._color);
        }
    },

    keyDown: function(event){
        if (event.key === UIEvent.Key.down){
            this.decrementComponent(event.hasModifier(UIEvent.Modifier.shift) ? 10 : 1);
        }else if (event.key === UIEvent.Key.up){
            this.incrementComponent(event.hasModifier(UIEvent.Modifier.shift) ? 10 : 1);
        }else{
            UIColorPanelViewController.$super.keyDown.call(this, event);
        }
    },

    decrementComponent: function(amount){
        if (this.component1Field.isFirstResponder()){
            this.component1Field.integerValue = this.component1Field.integerValue - amount;
            this.component1FieldChanged(this.component1Field);
        }else if (this.component2Field.isFirstResponder()){
            this.component2Field.integerValue = this.component2Field.integerValue - amount;
            this.component2FieldChanged(this.component2Field);
        }else if (this.component3Field.isFirstResponder()){
            this.component3Field.integerValue = this.component3Field.integerValue - amount;
            this.component3FieldChanged(this.component3Field);
        }else if (this.component4Field.isFirstResponder()){
            this.component4Field.integerValue = this.component4Field.integerValue - amount;
            this.component4FieldChanged(this.component4Field);
        }
    },

    incrementComponent: function(amount){
        if (this.component1Field.isFirstResponder()){
            this.component1Field.integerValue = this.component1Field.integerValue + amount;
            this.component1FieldChanged(this.component1Field);
        }else if (this.component2Field.isFirstResponder()){
            this.component2Field.integerValue = this.component2Field.integerValue + amount;
            this.component2FieldChanged(this.component2Field);
        }else if (this.component3Field.isFirstResponder()){
            this.component3Field.integerValue = this.component3Field.integerValue + amount;
            this.component3FieldChanged(this.component3Field);
        }else if (this.component4Field.isFirstResponder()){
            this.component4Field.integerValue = this.component4Field.integerValue + amount;
            this.component4FieldChanged(this.component4Field);
        }
    },

    // MARK: - Layout

    contentInsets: null,
    viewSpacing: 10,
    sliderSpacing: 2,
    componentFieldSpacing: 4,

    contentSizeThatFitsSize: function(maxSize){
        var size = JSSize(this.contentInsets.width + 220, this.contentInsets.height);
        if (size.width > maxSize.width){
            size.width = maxSize.width;
        }
        size.height += size.width - this.contentInsets.width;
        size.height += this.viewSpacing;
        size.height += this.hueSlider.intrinsicSize.height;
        size.height += this.sliderSpacing;
        size.height += this.alphaSlider.intrinsicSize.height;
        size.height += this.viewSpacing;
        size.height += this.hexField.intrinsicSize.height;
        size.height += this.componentFieldSpacing;
        size.height += this.hexLabel.intrinsicSize.height;
        if (size.height > maxSize.height){
            size.height = maxSize.height;
        }
        return size;
    },

    viewDidLayoutSubviews: function(){
        this.alphaSlider.hidden = !this._showsAlpha;
        this.component4Field.hidden = !this._showsAlpha;
        this.component4Label.hidden = this.component4Field.hidden;
        var rect = this.view.bounds.rectWithInsets(this.contentInsets);
        this.saturationBrightnessControl.bounds = JSRect(JSPoint.Zero, JSSize(rect.size.width + 16, rect.size.width + 16));
        this.saturationBrightnessControl.position = rect.origin.adding(JSPoint(rect.size.width / 2, rect.size.width / 2));
        this.saturationBrightnessControl.transform = JSAffineTransform.Scaled(1, -1);
        rect.origin.y += rect.size.width;
        rect.origin.y += this.viewSpacing;
        var slidersHeight = this.hueSlider.intrinsicSize.height + this.sliderSpacing + this.alphaSlider.intrinsicSize.height;
        this.previewWell.frame = JSRect(rect.origin.x + rect.size.width - slidersHeight, rect.origin.y, slidersHeight, slidersHeight);
        this.hueSlider.frame = JSRect(rect.origin, JSSize(rect.size.width - this.previewWell.frame.size.width - this.viewSpacing, this.hueSlider.intrinsicSize.height));
        rect.origin.y += this.hueSlider.frame.size.height;
        rect.origin.y += this.sliderSpacing;
        this.alphaSlider.frame = JSRect(rect.origin, JSSize(this.hueSlider.frame.size.width, this.alphaSlider.intrinsicSize.height));
        rect.origin.y += this.alphaSlider.frame.size.height;
        rect.origin.y += this.viewSpacing;
        if (this.alphaSlider.hidden){
            this.hueSlider.position = this.hueSlider.position.adding(JSPoint(0, (this.hueSlider.bounds.size.height + this.sliderSpacing) / 2));
        }
        var fieldCount = 4;
        if (this._showsAlpha){
            fieldCount += 1;
        }
        var availableWidth = rect.size.width - (fieldCount - 1) * this.componentFieldSpacing;
        var fieldWidth = Math.floor(availableWidth / (fieldCount + 1));
        this.hexField.frame = JSRect(rect.origin, JSSize(fieldWidth + fieldWidth, this.hexField.intrinsicSize.height));
        rect.origin.x += this.hexField.frame.size.width + this.componentFieldSpacing;
        this.component1Field.frame = JSRect(rect.origin, JSSize(fieldWidth, this.component1Field.intrinsicSize.height));
        rect.origin.x += this.component1Field.frame.size.width + this.componentFieldSpacing;
        this.component2Field.frame = JSRect(rect.origin, JSSize(fieldWidth, this.component2Field.intrinsicSize.height));
        rect.origin.x += this.component2Field.frame.size.width + this.componentFieldSpacing;
        this.component3Field.frame = JSRect(rect.origin, JSSize(fieldWidth, this.component3Field.intrinsicSize.height));
        rect.origin.x += this.component3Field.frame.size.width + this.componentFieldSpacing;
        this.component4Field.frame = JSRect(rect.origin, JSSize(fieldWidth, this.component4Field.intrinsicSize.height));
        rect.origin.x += this.component4Field.frame.size.width + this.componentFieldSpacing;
        this.hexLabel.sizeToFit();
        this.component1Label.sizeToFit();
        this.component2Label.sizeToFit();
        this.component3Label.sizeToFit();
        this.component4Label.sizeToFit();
        var labelOffset = JSPoint(0, (this.hexField.bounds.size.height + this.hexLabel.bounds.size.height) / 2 + this.componentFieldSpacing);
        this.hexLabel.position = this.hexField.position.adding(labelOffset);
        this.component1Label.position = this.component1Field.position.adding(labelOffset);
        this.component2Label.position = this.component2Field.position.adding(labelOffset);
        this.component3Label.position = this.component3Field.position.adding(labelOffset);
        this.component4Label.position = this.component4Field.position.adding(labelOffset);
    },

});

JSClass("UIColorPanelTwoAxisSlider", UIControl, {

    xLayer: null,
    yLayer: null,
    knobLayer: null,
    knobSize: null,
    knobBorderWidth: 1,
    normalKnobBackgroundColor: null,
    activeKnobBackgroundColor: null,
    disabledKnobBackgroundColor: null,
    normalKnobBorderColor: null,
    activeKnobBorderColor: null,
    disabledKnobBorderColor: null,

    commonUIControlInit: function(){
        UIColorPanelTwoAxisSlider.$super.commonUIControlInit.call(this);
        this._minimumValue = JSPoint(0, 0);
        this._maximumValue = JSPoint(1, 1);
        this.knobSize = JSSize(16, 16);
        this._value = JSPoint(0, 0);
        this.normalKnobBackgroundColor = JSColor.white;
        this.activeKnobBackgroundColor = JSColor.white;
        this.disabledKnobBackgroundColor = this.normalKnobBackgroundColor.colorWithAlpha(0.5);
        this.normalKnobBorderColor = JSColor.black.colorWithAlpha(0.2);
        this.activeKnobBorderColor = JSColor.black.colorWithAlpha(0.3);
        this.disabledKnobBorderColor = JSColor.black.colorWithAlpha(0.1);
        this.xLayer = UILayer.init();
        this.yLayer = UILayer.init();
        this.yLayer.backgroundGradient = JSGradient.initWithColors([JSColor.black, JSColor.black.colorWithAlpha(0)]);
        this.yLayer.borderWidth = 1;
        this.yLayer.borderColor = JSColor.black.colorWithAlpha(0.2);
        this.yLayer.cornerRadius = 3;
        this.xLayer.cornerRadius = 3;
        this.knobLayer = UILayer.init();
        this.knobLayer.bounds = JSRect(JSPoint.Zero, this.knobSize);
        this.layer.addSublayer(this.xLayer);
        this.layer.addSublayer(this.yLayer);
        this.layer.addSublayer(this.knobLayer);
        this.knobLayer.delegate = this;
        this.knobLayer.setNeedsDisplay();
    },

    minimumValue: JSDynamicProperty("_minimumValue", null),
    maximumValue: JSDynamicProperty("_maximumValue", null),
    value: JSDynamicProperty("_value", null),

    setMinimumValue: function(minimumValue){
        this._minimumValue = JSPoint(minimumValue);
        if (this._value.x < this._minimumValue.x || this._value.y < this._minimumValue.y){
            this._value = JSPoint(Math.max(this._minimumValue.x, this._value.x), Math.max(this._minimumValue.y, this._value.y));
            this.didChangeValueForBinding('value');
        }
        this.setNeedsLayout();
    },

    setMaximumValue: function(maximumValue){
        this._maximumValue = JSPoint(maximumValue);
        if (this._value.x > this._maximumValue.x || this._value.y > this._maximumValue.y){
            this._value = JSPoint(Math.min(this._maximumValue.x, this._value.x), Math.min(this._maximumValue.y, this._value.y));
            this.didChangeValueForBinding('value');
        }
        this.setNeedsLayout();
    },

    setValue: function(value){
        this._value = JSPoint(
            Math.min(this._maximumValue.x, Math.max(this._minimumValue.x, value.x)),
            Math.min(this._maximumValue.y, Math.max(this._minimumValue.y, value.y))
        );
        this.setNeedsLayout();
    },

    minimumPoint: JSReadOnlyProperty(),
    maximumPoint: JSReadOnlyProperty(),

    getMinimumPoint: function(){
        return JSPoint(this.knobSize.width / 2, this.knobSize.height / 2);
    },

    getMaximumPoint: function(){
        return JSPoint(this.bounds.size.width - this.knobSize.width / 2, this.bounds.size.height - this.knobSize.height / 2);
    },

    knobContainsPoint: function(point){
        point = this.layer.convertPointToLayer(point, this.knobLayer);
        return this.knobLayer.containsPoint(point);
    },

    _drag: null,

    _beginSlideAtLocation: function(location, event){
        var isOnKnob = this.knobContainsPoint(location);
        this._drag = {
            initialLocation: JSPoint(location),
            initialValue: JSPoint(this._value),
            initialOffset: JSPoint.Zero,
        };
        this.active = true;
        if (!isOnKnob){
            this.value = this.valueForPoint(location);
            this.didChangeValueForBinding('value');
            this.sendActionsForEvents(UIControl.Event.valueChanged | UIControl.Event.primaryAction, event);
        }else{
            var valueLocation = this.pointForValue(this._value);
            this._drag.initialOffset = location.subtracting(valueLocation);
        }
    },

    _continueSlideAtLocation: function(location, event){
        location = location.subtracting(this._drag.initialOffset);
        var value = this.valueForPoint(location);
        if (!value.isEqual(this._value)){
            this.value = value;
            this.didChangeValueForBinding('value');
            this.sendActionsForEvents(UIControl.Event.valueChanged | UIControl.Event.primaryAction, event);
        }
    },

    _endSlide: function(event){
        if (this.active){
            this.active = false;
        }
        this._drag = null;
    },

    mouseDown: function(event){
        if (this.enabled){
            var location = event.locationInView(this);
            this._beginSlideAtLocation(location, event);
            return;
        }
        UISlider.$super.mouseDown.call(this, event);
    },

    mouseDragged: function(event){
        if (this._drag !== null){
            var location = event.locationInView(this);
            this._continueSlideAtLocation(location);
            return;
        }
        UISlider.$super.mouseDragged.call(this, event);
    },

    mouseUp: function(event){
        if (this._drag !== null){
            this._endSlide(event);
            return;
        }
        UISlider.$super.mouseUp.call(this, event);
    },

    touchesBegan: function(touches, event){
        if (this.enabled){
            var touch = touches[0];
            var location = touch.locationInView(this);
            this._beginSlideAtLocation(location, event);
            return;
        }
        UISlider.$super.touchesBegan.call(this, touches, event);
    },

    touchesMoved: function(touches, event){
        if (this._drag !== null){
            var touch = touches[0];
            var location = touch.locationInView(this);
            this._continueSlideAtLocation(location, event);
            return;
        }
        UISlider.$super.touchesMoved.call(this, touches, event);
    },

    touchesCanceled: function(touches, event){
        if (this._drag !== null){
            this._endSlide(event);
            return;
        }
        UISlider.$super.touchesCanceled.call(this, touches, event);
    },

    touchesEnded: function(touches, event){
        if (this._drag !== null){
            this._endSlide(event);
            return;
        }
        UISlider.$super.touchesEnded.call(this, touches, event);
    },

    _cachedMinimumPoint: null,
    _cachedMaximumPoint: null,

    valueForPoint: function(location){
        var p0 = this._cachedMinimumPoint;
        var p1 = this._cachedMaximumPoint;
        var dx = location.x - p0.x;
        var dy = location.y - p0.y;
        return JSPoint(
            Math.min(this._maximumValue.x, Math.max(this._minimumValue.x, this._minimumValue.x + (this._maximumValue.x - this._minimumValue.x) * dx / (p1.x - p0.x))),
            Math.min(this._maximumValue.y, Math.max(this._minimumValue.y, this._minimumValue.y + (this._maximumValue.y - this._minimumValue.y) * dy / (p1.y - p0.y)))
        );
    },

    pointForValue: function(value){
        value = JSPoint(
            Math.min(this._maximumValue.x, Math.max(this._minimumValue.x, value.x)),
            Math.min(this._maximumValue.y, Math.max(this._minimumValue.y, value.y))
        );
        var p0 = this._cachedMinimumPoint;
        var p1 = this._cachedMaximumPoint;
        var dx = (value.x - this._minimumValue.x) / (this._maximumValue.x - this._minimumValue.x) * (p1.x - p0.x);
        var dy = (value.y - this._minimumValue.y) / (this._maximumValue.y - this._minimumValue.y) * (p1.y - p0.y);
        return JSPoint(p0.x + dx, p0.y + dy);
    },

    layoutSubviews: function(){
        UISlider.$super.layoutSubviews.call(this);
        this._cachedMinimumPoint = this.minimumPoint;
        this._cachedMaximumPoint = this.maximumPoint;
        var center = this.bounds.center;
        var minPoint = this._cachedMinimumPoint;
        var maxPoint = this._cachedMaximumPoint;
        this.xLayer.bounds = JSRect(0, 0, maxPoint.x - minPoint.x, maxPoint.y - minPoint.y);
        this.xLayer.position = center;
        this.yLayer.bounds = this.xLayer.bounds;
        this.yLayer.position = this.xLayer.position;
        this.knobLayer.position = this.pointForValue(this._value);
    },

    update: function(){
        var knobLayer = this.knobLayer;
        knobLayer.setNeedsDisplay();
    },

    drawLayerInContext: function(layer, context){
        if (layer === this.knobLayer){
            var outerBorderRect = layer.bounds.rectWithInsets(this.knobBorderWidth / 2);
            var innerBorderRect = layer.bounds.rectWithInsets(4 - this.knobBorderWidth / 2);
            context.save();
            context.addEllipseInRect(outerBorderRect);
            context.addEllipseInRect(innerBorderRect);
            if (this.enabled){
                if (this.active){
                    context.setFillColor(this.activeKnobBackgroundColor);
                    context.setStrokeColor(this.activeKnobBorderColor);
                }else{
                    context.setFillColor(this.normalKnobBackgroundColor);
                    context.setStrokeColor(this.normalKnobBorderColor);
                }
            }else{
                context.setFillColor(this.disabledKnobBackgroundColor);
                context.setStrokeColor(this.disabledKnobBorderColor);
            }
            context.setLineWidth(this.knobBorderWidth);
            context.setShadow(JSPoint(0, 1), 1, JSColor.black.colorWithAlpha(0.1));
            context.drawPath(JSContext.DrawingMode.evenOddFillStroke);
            context.restore();
        }
    }
});