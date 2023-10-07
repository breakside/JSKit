// #import "UIControl.js"
"use strict";

(function(){

JSClass("UISlider", UIControl, {

    initWithSpec: function(spec){
        UISlider.$super.initWithSpec.call(this, spec);
        if (spec.containsKey("minimumValue")){
            this._minimumValue = spec.valueForKey("minimumValue");
        }
        if (spec.containsKey("maximumValue")){
            this._maximumValue = spec.valueForKey("maximumValue");
        }
        if (spec.containsKey("value")){
            this.value = spec.valueForKey("value");
        }
    },

    commonUIControlInit: function(){
        UISlider.$super.commonUIControlInit.call(this);
        if (this._styler === null){
            this._styler = UISlider.Styler.default;
        }
        this._styler.initializeControl(this);
    },

    minimumValue: JSDynamicProperty("_minimumValue", 0),
    maximumValue: JSDynamicProperty("_maximumValue", 1),
    value: JSDynamicProperty("_value", 0),
    integerValue: JSDynamicProperty(),

    setMinimumValue: function(minimumValue){
        this._minimumValue = minimumValue;
        if (this._value < this._minimumValue){
            this._value = this._minimumValue;
            this.didChangeValueForBinding('value');
        }
        this.setNeedsLayout();
    },

    setMaximumValue: function(maximumValue){
        this._maximumValue = maximumValue;
        if (this._value > this._maximumValue){
            this._value = this._maximumValue;
            this.didChangeValueForBinding('value');
        }
        this.setNeedsLayout();
    },

    setValue: function(value){
        this._value = Math.min(this._maximumValue, Math.max(this._minimumValue, value));
        this.setNeedsLayout();
    },

    getIntegerValue: function(){
        return Math.round(this._value);
    },

    setIntegerValue: function(value){
        this.value = value;
    },

    minimumPoint: JSReadOnlyProperty(),
    maximumPoint: JSReadOnlyProperty(),

    getMinimumPoint: function(){
        return this._styler.minimumPointForSlider(this);
    },

    getMaximumPoint: function(){
        return this._styler.maximumPointForSlider(this);
    },

    knobContainsPoint: function(point){
        return this._styler.sliderKnobContainsPoint(this, point);
    },

    _drag: null,

    _beginSlideAtLocation: function(location, event){
        var isOnKnob = this.knobContainsPoint(location);
        this._drag = {
            initialLocation: JSPoint(location),
            initialValue: this._value,
            initialOffset: JSPoint.Zero,
        };
        this.active = true;
        this.sendActionsForEvents(UIControl.Event.editingDidBegin, event);
        if (!isOnKnob){
            this.value = this.valueForPoint(location);
            this.didChangeValueForBinding('value');
            this.sendActionsForEvents(UIControl.Event.valueChanged | UIControl.Event.primaryAction | UIControl.Event.editingChanged, event);
        }else{
            var valueLocation = this.pointForValue(this._value);
            this._drag.initialOffset = location.subtracting(valueLocation);
        }
    },

    _continueSlideAtLocation: function(location, event){
        location = location.subtracting(this._drag.initialOffset);
        var value = this.valueForPoint(location);
        if (value !== this._value){
            this.value = value;
            this.didChangeValueForBinding('value');
            this.sendActionsForEvents(UIControl.Event.valueChanged | UIControl.Event.editingChanged | UIControl.Event.primaryAction, event);
        }
    },

    _endSlide: function(event){
        if (this.active){
            this.active = false;
            this.sendActionsForEvents(UIControl.Event.editingDidEnd, event);
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
        var length = p1.x - p0.x;
        var dx = location.x - p0.x;
        return Math.min(this._maximumValue, Math.max(this._minimumValue, this._minimumValue + (this._maximumValue - this._minimumValue) * dx / length));
    },

    pointForValue: function(value){
        value = Math.min(this._maximumValue, Math.max(this._minimumValue, value));
        var p0 = this._cachedMinimumPoint;
        var p1 = this._cachedMaximumPoint;
        var length = p1.x - p0.x;
        var dx = (value - this._minimumValue) / (this._maximumValue - this._minimumValue) * length;
        return JSPoint(p0.x + dx, p0.y);
    },

    layoutSubviews: function(){
        UISlider.$super.layoutSubviews.call(this);
        this._cachedMinimumPoint = this.minimumPoint;
        this._cachedMaximumPoint = this.maximumPoint;
    }

});

UISlider.Direction = {
    horizontal: 0,
    vertical: 0
};

UISlider.Styler = Object.create({}, {
    default: {
        configurable: true,
        get: function(){
            var styler = UISliderDefaultStyler.init();
            Object.defineProperty(this, "default", {configurable: true, writable: true, value: styler});
            return styler;
        },
        set: function(styler){
            Object.defineProperty(this, "default", {configurable: true, writable: true, value: styler});
        }
    }
});

JSClass("UISliderStyler", UIControlStyler, {

    minimumPointForSlider: function(slider){
        return JSPoint(0, slider.bounds.size.height / 2);
    },

    maximumPointForSlider: function(slider){
        return JSPoint(slider.bounds.size.width, slider.bounds.size.height / 2);
    },

    sliderKnobContainsPoint: function(slider, point){
        return false;
    }

});

JSClass("UISliderLayerBasedStyler", UIControlStyler, {

    knobSize: null,
    trackWidth: 6,
    trackRadius: 3,

    init: function(){
        UISliderLayerBasedStyler.$super.init.call(this);
    },

    initWithSpec: function(spec){
        UISliderLayerBasedStyler.$super.initWithSpec.call(this, spec);
        if (spec.containsKey("knobSize")){
            this.knobSize = spec.valueForKey("knobSize", JSSize);
        }
        if (spec.containsKey("trackWidth")){
            this.trackWidth = spec.valueForKey("trackWidth", Number);
        }
        if (spec.containsKey("trackRadius")){
            this.trackRadius = spec.valueForKey("trackRadius", Number);
        }
    },

    initializeControl: function(slider){
        var trackLayer = UILayer.init();
        var knobLayer = UILayer.init();
        knobLayer.bounds = JSRect(JSPoint.Zero, this.knobSize);
        trackLayer.cornerRadius = this.trackRadius;
        slider.layer.addSublayer(trackLayer);
        slider.layer.addSublayer(knobLayer);
        slider.stylerProperties.trackLayer = trackLayer;
        slider.stylerProperties.knobLayer = knobLayer;
    },

    layoutControl: function(slider){
        var trackLayer = slider.stylerProperties.trackLayer;
        var knobLayer = slider.stylerProperties.knobLayer;
        var center = slider.bounds.center;
        var minPoint = this.minimumPointForSlider(slider);
        var maxPoint = this.maximumPointForSlider(slider);
        trackLayer.bounds = JSRect(0, 0, maxPoint.x - minPoint.x + this.trackRadius + this.trackRadius, this.trackWidth);
        trackLayer.position = center;
        var percentage = (slider.value - slider.minimumValue) / (slider.maximumValue - slider.minimumValue);
        knobLayer.position = JSPoint(minPoint.x + (maxPoint.x - minPoint.x) * percentage, center.y);
    },

    minimumPointForSlider: function(slider){
        return JSPoint(Math.max(this.knobSize.width / 2, this.trackRadius), slider.bounds.size.height / 2);
    },

    maximumPointForSlider: function(slider){
        return JSPoint(slider.bounds.size.width - Math.max(this.knobSize.width / 2, this.trackRadius), slider.bounds.size.height / 2);
    },

    sliderKnobContainsPoint: function(slider, point){
        var knobLayer = slider.stylerProperties.knobLayer;
        point = slider.layer.convertPointToLayer(point, knobLayer);
        return knobLayer.containsPoint(point);
    },

    sizeControlToFitSize: function(slider, maxSize){
        var size = JSSize(slider.bounds.size.width, this.intrinsicSizeOfControl(slider).height);
        if (size.width > maxSize.width){
            size.width = maxSize.width;
        }
        slider.bounds = JSRect(JSPoint.Zero, size);
    },

    intrinsicSizeOfControl: function(slider){
        return JSSize(UIView.noIntrinsicSize, Math.max(this.trackWidth, this.knobSize.height));
    }

});

JSClass("UISliderDefaultStyler", UISliderLayerBasedStyler, {

    normalTrackColor: null,
    activeTrackColor: null,
    disabledTrackColor: null,
    normalTrackGradient: null,
    activeTrackGradient: null,
    disabledTrackGradient: null,
    trackBorderWidth: 0,
    normalTrackBorderColor: null,
    activeTrackBorderColor: null,
    disabledTrackBorderColor: null,
    trackInnerShadowColor: null,
    trackInnerShadowRadius: 1.5,
    trackInnerShadowOffset: null,
    trackFillColor: null,

    normalKnobBackgroundColor: null,
    disabledKnobBackgroundColor: null,
    activeKnobBackgroundColor: null,
    normalKnobBackgroundGradient: null,
    disabledKnobBackgroundGradient: null,
    activeKnobBackgroundGradient: null,
    normalKnobBorderColor: null,
    disabledKnobBorderColor: null,
    activeKnobBorderColor: null,
    knobBorderWidth: 1,
    knobShadowColor: null,
    knobShadowRadius: 1,
    knobShadowOffset: null,

    init: function(){
        UISliderDefaultStyler.$super.init.call(this);
        this.knobSize = JSSize(16, 16);
        this.normalTrackColor = JSColor.initWithUIStyles(JSColor.controlBackground.colorDarkenedByPercentage(0.02), JSColor.controlBackground.colorDarkenedByPercentage(0.3), JSColor.controlBackground, JSColor.controlBackground);
        this.activeTrackColor = this.normalTrackColor;
        this.disabledTrackColor = JSColor.disabledControlBackground;
        this.normalTrackBorderColor = JSColor.controlBorder;
        this.activeTrackBorderColor = JSColor.controlBorder;
        this.disabledTrackBorderColor = JSColor.disabledControlBorder;
        this.trackInnerShadowColor = JSColor.black.colorWithAlpha(0.4);
        this.trackInnerShadowOffset = JSPoint(0, 1);
        this.normalKnobBackgroundColor = JSColor.controlBackground;
        this.disabledKnobBackgroundColor = JSColor.disabledControlBackground;
        this.activeKnobBackgroundColor = JSColor.activeControlBackground;
        this.normalKnobBorderColor = JSColor.controlBorder;
        this.disabledKnobBorderColor = JSColor.disabledControlBorder;
        this.activeKnobBorderColor = JSColor.activeControlBorder;
        this.knobShadowColor = JSColor.controlShadow;
        this.knobShadowOffset = JSPoint(0, 1);
    },

    initWithSpec: function(spec){
        UISliderDefaultStyler.$super.initWithSpec.call(this, spec);
        if (spec.containsKey("normalTrackColor")){
            this.normalTrackColor = spec.valueForKey("normalTrackColor", JSColor);
        }
        if (spec.containsKey("activeTrackColor")){
            this.activeTrackColor = spec.valueForKey("activeTrackColor", JSColor);
        }else{
            this.activeTrackColor = this.normalTrackColor;
        }
        if (spec.containsKey("disabledTrackColor")){
            this.disabledTrackColor = spec.valueForKey("disabledTrackColor", JSColor);
        }else{
            this.disabledTrackColor = this.normalTrackColor;
        }
        if (spec.containsKey("normalTrackGradient")){
            this.normalTrackGradient = spec.valueForKey("normalTrackGradient", JSGradient);
        }
        if (spec.containsKey("activeTrackGradient")){
            this.activeTrackGradient = spec.valueForKey("activeTrackGradient", JSGradient);
        }else{
            this.activeTrackGradient = this.normalTrackGradient;
        }
        if (spec.containsKey("disabledTrackGradient")){
            this.disabledTrackGradient = spec.valueForKey("disabledTrackGradient", JSGradient);
        }else{
            this.disabledTrackGradient = this.normalTrackGradient;
        }
        if (spec.containsKey("normalTrackBorderColor")){
            this.normalTrackBorderColor = spec.valueForKey("normalTrackBorderColor", JSColor);
        }
        if (spec.containsKey("activeTrackBorderColor")){
            this.activeTrackBorderColor = spec.valueForKey("activeTrackBorderColor", JSColor);
        }else{
            this.activeTrackBorderColor = this.normalTrackBorderColor;
        }
        if (spec.containsKey("disabledTrackBorderColor")){
            this.disabledTrackBorderColor = spec.valueForKey("disabledTrackBorderColor", JSColor);
        }else{
            this.disabledTrackBorderColor = this.normalTrackBorderColor;
        }
        if (spec.containsKey("trackBorderWidth")){
            this.trackBorderWidth = spec.valueForKey("trackBorderWidth", Number);
        }
        if (spec.containsKey("trackInnerShadowColor")){
            this.trackInnerShadowColor = spec.valueForKey("trackInnerShadowColor", JSColor);
        }
        if (spec.containsKey("trackInnerShadowOffset")){
            this.trackInnerShadowOffset = spec.valueForKey("trackInnerShadowOffset", JSPoint);
        }
        if (spec.containsKey("trackInnerShadowRadius")){
            this.trackInnerShadowRadius = spec.valueForKey("trackInnerShadowRadius", Number);
        }
        if (spec.containsKey("normalKnobBackgroundColor")){
            this.normalKnobBackgroundColor = spec.valueForKey("normalKnobBackgroundColor", JSColor);
        }
        if (spec.containsKey("activeKnobBackgroundColor")){
            this.activeKnobBackgroundColor = spec.valueForKey("activeKnobBackgroundColor", JSColor);
        }else if (this.normalKnobBackgroundColor !== null){
            this.activeKnobBackgroundColor = this.normalKnobBackgroundColor.colorDarkenedByPercentage(0.2);
        }
        if (spec.containsKey("disabledKnobBackgroundColor")){
            this.disabledKnobBackgroundColor = spec.valueForKey("disabledKnobBackgroundColor", JSColor);
        }else if (this.normalKnobBackgroundColor !== null){
            this.disabledKnobBackgroundColor = this.normalKnobBackgroundColor.colorWithAlpha(0.5);
        }
        if (spec.containsKey("normalKnobBackgroundGradient")){
            this.normalKnobBackgroundGradient = spec.valueForKey("normalKnobBackgroundGradient", JSColor);
        }
        if (spec.containsKey("activeKnobBackgroundGradient")){
            this.activeKnobBackgroundGradient = spec.valueForKey("activeKnobBackgroundGradient", JSColor);
        }
        if (spec.containsKey("disabledKnobBackgroundGradient")){
            this.disabledKnobBackgroundGradient = spec.valueForKey("disabledKnobBackgroundGradient", JSColor);
        }
        if (spec.containsKey("normalKnobBorderColor")){
            this.normalKnobBorderColor = spec.valueForKey("normalKnobBorderColor", JSColor);
        }
        if (spec.containsKey("activeKnobBorderColor")){
            this.activeKnobBorderColor = spec.valueForKey("activeKnobBorderColor", JSColor);
        }else if (this.normalKnobBorderColor !== null){
            this.activeKnobBorderColor = this.normalKnobBorderColor.colorDarkenedByPercentage(0.2);
        }
        if (spec.containsKey("disabledKnobBorderColor")){
            this.disabledKnobBorderColor = spec.valueForKey("disabledKnobBorderColor", JSColor);
        }else if (this.normalKnobBorderColor !== null){
            this.disabledKnobBorderColor = this.normalKnobBorderColor.colorWithAlpha(0.5);
        }
        if (spec.containsKey("knobShadowColor")){
            this.knobShadowColor = spec.valueForKey("knobShadowColor", JSColor);
        }
        if (spec.containsKey("knobShadowOffset")){
            this.knobShadowOffset = spec.valueForKey("knobShadowOffset", JSPoint);
        }
        if (spec.containsKey("knobShadowRadius")){
            this.knobShadowRadius = spec.valueForKey("knobShadowRadius", Number);
        }
        if (spec.containsKey("knobBorderWidth")){
            this.knobBorderWidth = spec.valueForKey("knobBorderWidth", Number);
        }
        if (this.knobSize === null){
            this.knobSize = JSSize(16, 16);
        }
    },

    initializeControl: function(slider){
        UISliderDefaultStyler.$super.initializeControl.call(this, slider);
        var knobLayer = slider.stylerProperties.knobLayer;
        var trackLayer = slider.stylerProperties.trackLayer;
        knobLayer.cornerRadius = Math.min(this.knobSize.width, this.knobSize.height) / 2;
        knobLayer.borderWidth = this.knobBorderWidth;
        knobLayer.shadowColor = this.knobShadowColor;
        knobLayer.shadowOffset = this.knobShadowOffset;
        knobLayer.shadowRadius = this.knobShadowRadius;
        trackLayer.delegate = this;
        trackLayer.needsDisplayOnBoundsChange = true;
        trackLayer.borderWidth = this.trackBorderWidth;
        this.updateControl(slider);
    },

    updateControl: function(slider){
        var knobLayer = slider.stylerProperties.knobLayer;
        var trackLayer = slider.stylerProperties.trackLayer;
        if (slider.enabled){
            if (slider.active){
                trackLayer.backgroundColor = this.activeTrackColor;
                trackLayer.backgroundGradient = this.activeTrackBackgroundGradient;
                trackLayer.borderColor = this.activeTrackBorderColor;
                knobLayer.backgroundColor = this.activeKnobBackgroundColor;
                knobLayer.backgroundGradient = this.activeKnobBackgroundGradient;
                knobLayer.borderColor = this.activeKnobBorderColor;
            }else{
                trackLayer.backgroundColor = this.normalTrackColor;
                trackLayer.backgroundGradient = this.normalTrackBackgroundGradient;
                trackLayer.borderColor = this.normalTrackBorderColor;
                knobLayer.backgroundColor = this.normalKnobBackgroundColor;
                knobLayer.backgroundGradient = this.normalKnobBackgroundGradient;
                knobLayer.borderColor = this.normalKnobBorderColor;
            }
        }else{
            trackLayer.backgroundColor = this.disabledTrackColor;
            trackLayer.backgroundGradient = this.disabledTrackBackgroundGradient;
            trackLayer.borderColor = this.disabledTrackBorderColor;
            knobLayer.backgroundColor = this.disabledKnobBackgroundColor;
            knobLayer.backgroundGradient = this.disabledKnobBackgroundGradient;
            knobLayer.borderColor = this.disabledKnobBorderColor;
        }
    },

    layoutControl: function(slider){
        UISliderDefaultStyler.$super.layoutControl.call(this, slider);
        if (this.trackFillColor){
            slider.stylerProperties.trackLayer.setNeedsDisplay();
        }
    },

    drawLayerInContext: function(layer, context){
        if (layer === layer.superlayer.delegate.stylerProperties.trackLayer){
            var path = layer.backgroundPath();
            context.save();
            context.addPath(path);
            context.clip();
            if (this.trackFillColor !== null){
                context.save();
                var point = layer.superlayer.convertPointToLayer(layer.superlayer.delegate.stylerProperties.knobLayer.position, layer);
                var rect = JSRect(0, 0, point.x, layer.bounds.size.height);
                context.setFillColor(this.trackFillColor);
                context.fillRect(rect);
                context.restore();
            }
            if (this.trackInnerShadowColor !== null){
                context.save();
                context.beginPath();
                context.addRect(layer.bounds.rectWithInsets(-100));
                context.addPath(path);
                context.setShadow(this.trackInnerShadowOffset, this.trackInnerShadowRadius, this.trackInnerShadowColor.colorWithAlpha(1));
                context.setFillColor(this.trackInnerShadowColor);
                context.fillPath(JSContext.FillRule.evenOdd);
                context.restore();
            }
            context.restore();
        }
    }

});

JSClass("UISliderColorStyler", UISliderLayerBasedStyler, {

    gradient: null,
    checkersPerTrackWidth: 2,
    checkerColor: null,
    knobBorderWidth: 1,
    normalKnobBackgroundColor: null,
    activeKnobBackgroundColor: null,
    disabledKnobBackgroundColor: null,
    normalKnobBorderColor: null,
    activeKnobBorderColor: null,
    disabledKnobBorderColor: null,

    init: function(){
        this.initWithColors([
            JSColor.initWithHSVA(0, 1, 1),
            JSColor.initWithHSVA(1/6, 1, 1),
            JSColor.initWithHSVA(2/6, 1, 1),
            JSColor.initWithHSVA(3/6, 1, 1),
            JSColor.initWithHSVA(4/6, 1, 1),
            JSColor.initWithHSVA(5/6, 1, 1),
            JSColor.initWithHSVA(1, 1, 1)
        ]);
    },

    initWithColors: function(colors){
        UISliderColorStyler.$super.init.call(this);
        this.trackWidth = 10;
        this._commonColorStylerInit();
        this.gradient = JSGradient.initWithColors(colors, JSPoint(0, 0), JSPoint(1, 0));
    },

    initWithSpec: function(spec){
        UISliderColorStyler.$super.initWithSpec.call(this, spec);
        this._commonColorStylerInit();
        if (spec.containsKey("gradient")){
            this.gradient = spec.valueForKey("gradient", JSGradient);
        }
    },

    _commonColorStylerInit: function(){
        if (this.knobSize === null){
            this.knobSize = JSSize(this.trackWidth + 6, this.trackWidth + 6);
        }
        this.trackRadius = this.trackWidth / 2;
        this.normalKnobBackgroundColor = JSColor.controlBackground;
        this.activeKnobBackgroundColor = JSColor.activeControlBackground;
        this.disabledKnobBackgroundColor = JSColor.disabledControlBackground;
        this.normalKnobBorderColor = JSColor.controlBorder;
        this.activeKnobBorderColor = JSColor.activeControlBorder;
        this.disabledKnobBorderColor = JSColor.disabledControlBorder;
        this.checkerColor = JSColor.initWithUIStyles(JSColor.initWithWhite(0.9), JSColor.initWithWhite(0.1));
    },

    setColors: function(colors){
        this.gradient = JSGradient.initWithColors(colors, JSPoint(0, 0), JSPoint(1, 0));
    },

    initializeControl: function(slider){
        UISliderColorStyler.$super.initializeControl.call(this, slider);
        var knobLayer = slider.stylerProperties.knobLayer;
        var trackLayer = slider.stylerProperties.trackLayer;
        var checkerboardLayer = UILayer.init();
        checkerboardLayer.cornerRadius = trackLayer.cornerRadius;
        checkerboardLayer.delegate = this;
        checkerboardLayer.setNeedsDisplay();
        slider.stylerProperties.checkerboardLayer = checkerboardLayer;
        slider.layer.insertSublayerBelowSibling(checkerboardLayer, trackLayer);
        trackLayer.borderColor = JSColor.black.colorWithAlpha(0.2);
        trackLayer.borderWidth = 1;
        knobLayer.delegate = this;
        knobLayer.setNeedsDisplay();
        this.updateControl(slider);
    },

    updateControl: function(slider){
        var knobLayer = slider.stylerProperties.knobLayer;
        var trackLayer = slider.stylerProperties.trackLayer;
        if (trackLayer.backgroundGradient !== this.gradient){
            trackLayer.backgroundGradient = this.gradient;
        }
        knobLayer.setNeedsDisplay();
        if (!slider.enabled){
            trackLayer.alpha = 0.5;
        }
    },

    layoutControl: function(slider){
        UISliderColorStyler.$super.layoutControl.call(this, slider);
        var checkerboardLayer = slider.stylerProperties.checkerboardLayer;
        var trackLayer = slider.stylerProperties.trackLayer;
        checkerboardLayer.bounds = trackLayer.bounds;
        checkerboardLayer.position = trackLayer.position;
        checkerboardLayer.transform = trackLayer.transform;
    },

    drawLayerInContext: function(layer, context){
        var slider = layer.superlayer.delegate;
        if (layer === slider.stylerProperties.knobLayer){
            var outerBorderRect = layer.bounds.rectWithInsets(this.knobBorderWidth / 2);
            var innerBorderRect = layer.bounds.rectWithInsets(4 - this.knobBorderWidth / 2);
            context.save();
            context.addEllipseInRect(outerBorderRect);
            context.addEllipseInRect(innerBorderRect);
            if (slider.enabled){
                if (slider.active){
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
        }else if (layer === slider.stylerProperties.checkerboardLayer){
            context.save();
            context.setFillColor(this.checkerColor);
            context.addPath(layer.backgroundPath());
            context.clip();
            var step = this.trackWidth / this.checkersPerTrackWidth;
            var size = layer.bounds.size;
            var on;
            for (var y = 0, row = 0; row < this.checkersPerTrackWidth; y += step, ++row){
                on = row % 2 === 0;
                for (var x = 0; x < size.width; x += step, on = !on){
                    if (on){
                        context.addRect(JSRect(x, y, step, step));
                    }
                }
            }
            context.fillPath();
            context.restore();
        }
    }

});

})();