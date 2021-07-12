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

    indicateModalStatus: function(){
        this.close();
    }

});

JSClass("UIColorPanelViewController", UIViewController, {

    delegate: null,
    color: JSDynamicProperty("_color", null),
    showsAlpha: JSDynamicProperty("_showsAlpha", true),

    init: function(){
        this.color = JSColor.black;
        this.contentInsets = JSInsets(0);
    },

    setColor: function(color){
        this._color = color;
        if (this.isViewLoaded){
            this.updateSlidersWithHSLAColor(this.color.hslaColor());
            this.updateComponentFieldsWithRGBAColor(this.color.rgbaColor());
            this.updateColorDependentViews();
        }
    },

    setShowsAlpha: function(showsAlpha){
        this._showsAlpha = showsAlpha;
        if (this.isViewLoaded){
            this.view.setNeedsLayout();
        }
    },

    // MARK: - View Lifecycle

    viewDidLoad: function(){
        UIColorPanelViewController.$super.viewDidLoad.call(this);
        var hueStyler = UISliderColorStyler.initWithColors([
            JSColor.initWithHSLA(0, 1, 0.5),
            JSColor.initWithHSLA(1/6, 1, 0.5),
            JSColor.initWithHSLA(2/6, 1, 0.5),
            JSColor.initWithHSLA(3/6, 1, 0.5),
            JSColor.initWithHSLA(4/6, 1, 0.5),
            JSColor.initWithHSLA(5/6, 1, 0.5),
            JSColor.initWithHSLA(1, 1, 0.5)
        ]);
        var alphaStyler = UISliderColorStyler.initWithColors([
            JSColor.initWithHSLA(0, 0, 0, 0),
            JSColor.initWithHSLA(0, 0, 0, 1)
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
        this.component1Label.text = "R";
        this.component2Label.text = "G";
        this.component3Label.text = "B";
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
        this.alphaSlider.addAction(this.hueSliderChanged, this);
        this.hexField.addAction(this.hexFieldChanged, this);
        this.component1Field.addAction(this.component1FieldChanged, this);
        this.component2Field.addAction(this.component2FieldChanged, this);
        this.component3Field.addAction(this.component3FieldChanged, this);
        this.component4Field.addAction(this.component4FieldChanged, this);

        this.updateSlidersWithHSLAColor(this.color.hslaColor());
        this.updateComponentFieldsWithRGBAColor(this.color.rgbaColor());
    },

    viewWillAppear: function(animated){
        UIColorPanelViewController.$super.viewWillAppear.call(this, animated);
    },

    viewDidAppear: function(animated){
        UIColorPanelViewController.$super.viewDidAppear.call(this, animated);
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

    saturationBrightnessChanged: function(sender){
        this.updateColorFromSliders();
    },

    hueSliderChanged: function(sender){
        this.updateColorFromSliders();
    },

    alphaSliderChanged: function(slider){
        this.updateColorFromSliders();
    },

    component1FieldChanged: function(textField){
        this.updateColorFromComponentFields();
    },

    component2FieldChanged: function(textField){
        this.updateColorFromComponentFields();
    },

    component3FieldChanged: function(textField){
        this.updateColorFromComponentFields();
    },

    component4FieldChanged: function(textField){
        this.updateColorFromComponentFields();
    },

    hexFieldChanged: function(textField){
        var color = JSColor.initWithRGBAHexString(textField.text);
        if (color === null){
            color = JSColor.black;
        }
        this.color = color;
        this.notifyDelegateOfColor();
    },

    updateColorFromSliders: function(){
        var hsl = JSColor.HSBToHSL(
            this.hueSlider.value,
            this.saturationBrightnessControl.value.x,
            this.saturationBrightnessControl.value.y
        );
        var a = this.showsAlpha ? this.alphaSlider.value : 1;
        this._color = JSColor.initWithHSLA(hsl[0], hsl[1], hsl[2], a);
        this.updateComponentFieldsWithRGBAColor(this.color.rgbaColor());
        this.updateColorDependentViews();
        this.notifyDelegateOfColor();
    },

    updateColorFromComponentFields: function(){
        var currentRGBAColor = this._color.rgbaColor();
        var r = this.component1Field.integerValue / 255.0;
        var g = this.component2Field.integerValue / 255.0;
        var b = this.component3Field.integerValue / 255.0;
        var a = this.showsAlpha ? this.component4Field.integerValue / 100.0 : 1;
        if (isNaN(r)) r = currentRGBAColor.red;
        if (isNaN(g)) g = currentRGBAColor.green;
        if (isNaN(b)) b = currentRGBAColor.blue;
        if (isNaN(a)) a = currentRGBAColor.alpha;
        this._color = JSColor.initWithRGBA(r, g, b, a);
        this.updateComponentFieldsWithRGBAColor(this._color);
        this.updateSlidersWithHSLAColor(this.color.hslaColor());
        this.updateColorDependentViews();
        this.notifyDelegateOfColor();
    },

    updateSlidersWithHSLAColor: function(hslaColor){
        var hsb = JSColor.HSLToHSB(
            hslaColor.hue,
            hslaColor.saturation,
            hslaColor.lightness
        );
        this.hueSlider.value = hslaColor.hue;
        this.saturationBrightnessControl.value = JSPoint(hsb[1], hsb[2]);
        this.alphaSlider.value = hslaColor.alpha;
    },

    updateComponentFieldsWithRGBAColor: function(rgbaColor){
        this.component1Field.integerValue = Math.round(rgbaColor.red * 255);
        this.component2Field.integerValue = Math.round(rgbaColor.green * 255);
        this.component3Field.integerValue = Math.round(rgbaColor.blue * 255);
        this.component4Field.integerValue = Math.round(rgbaColor.alpha * 100);
    },

    updateColorDependentViews: function(){
        this.hexField.text = this._color.rgbaHexStringRepresentation();
        this.previewWell.color = this._color;
        this.alphaSlider.styler.setColors([
            this._color.colorWithAlpha(0),
            this._color.colorWithAlpha(1),
        ]);
        this.alphaSlider.styler.updateControl(this.alphaSlider);
        var xLayer = this.saturationBrightnessControl.xLayer;
        var hslaColor = this._color.hslaColor();
        if (xLayer.backgroundGradient === null || xLayer.backgroundGradient.stops[1].color.hue != hslaColor.hue){
            var gradient = JSGradient.initWithColors([JSColor.white, JSColor.initWithHSLA(hslaColor.hue, 1, 0.5, 1)]);
            gradient.start = JSPoint(0, 0);
            gradient.end = JSPoint(1, 0);
            this.saturationBrightnessControl.xLayer.backgroundGradient = gradient;
        }
    },

    notifyDelegateOfColor: function(){
        if (this.delegate && this.delegate.colorPanelDidChangeColor){
            this.delegate.colorPanelDidChangeColor(this, this._color);
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
        this.saturationBrightnessControl.frame = JSRect(rect.origin, JSSize(rect.size.width, rect.size.width));
        rect.origin.y += this.saturationBrightnessControl.frame.size.height;
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