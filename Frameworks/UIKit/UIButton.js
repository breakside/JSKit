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
// #import "UIImageView.js"
// #import "UIEvent.js"
'use strict';

JSClass("UIButton", UIControl, {

    image: JSReadOnlyProperty(),
    backgroundImage: JSReadOnlyProperty(),
    titleLabel: JSLazyInitProperty('_createTitleLabel', '_titleLabel'),
    titleInsets: JSDynamicProperty('_titleInsets', null),

    _imagesByState: null,
    _backgroundImagesByState: null,

    _imageView: null,
    _backgroundImageView: null,

    initWithSpec: function(spec){
        UIButton.$super.initWithSpec.call(this, spec);
        if (spec.containsKey('font')){
            this.titleLabel.font = spec.valueForKey("font", JSFont);
        }
        if (spec.containsKey('title')){
            this.titleLabel.text = spec.valueForKey("title");
        }
        if (spec.containsKey('titleInsets')){
            this._titleInsets = spec.valueForKey("titleInsets", JSInsets);
        }
        if (spec.containsKey('image')){
            var image = spec.valueForKey("image");
            if (typeof(image) === 'string'){
                image = JSImage.initWithResourceName(image, spec.bundle);
                this.setImageForState(image, UIControl.State.normal);
            }else{
                if (image.containsKey('normal')){
                    this.setImageForState(image.valueForKey("normal", JSImage), UIControl.State.normal);
                }
                if (image.containsKey('over')){
                    this.setImageForState(image.valueForKey("over", JSImage), UIControl.State.over);
                }
                if (image.containsKey('active')){
                    this.setImageForState(image.valueForKey("active", JSImage), UIControl.State.active);
                }
                if (image.containsKey('disabled')){
                    this.setImageForState(image.valueForKey("disabled", JSImage), UIControl.State.disabled);
                }
            }
        }
    },

    commonUIControlInit: function(){
        UIButton.$super.commonUIControlInit.call(this);
        this._imagesByState = [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined];
        this._backgroundImagesByState = [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined];
        this._titleInsets = JSInsets.Zero;
        if (this._styler === null){
            this._styler = UIButton.Styler.default;
        }
        this.hasOverState = this._styler.showsOverState;
        this._styler.initializeControl(this);
    },

    _createTitleLabel: function(){
        var titleLabel = UILabel.init();
        titleLabel.textAlignment = JSTextAlignment.center;
        titleLabel.backgroundColor = JSColor.clear;
        titleLabel.font = this.styler.font;
        this.addSubview(titleLabel);
        this.setNeedsLayout();
        this._titleLabel = titleLabel;
        this._styler.updateControl(this);
        return titleLabel;
    },

    setTitleInsets: function(titleInsets){
        this._titleInsets = JSInsets(titleInsets);
        this.setNeedsLayout();
    },

    getImage: function(){
        return this._getImageForState(this.state, this._imagesByState);
    },

    getBackgroundImage: function(){
        return this._getImageForState(this.state, this._backgroundImagesByState);
    },

    _getImageForState: function(state, images){
        var image = images[state];
        if (image !== undefined){
            return image;
        }
        if (state & UIControl.State.disabled){
            image = images[UIControl.State.disabled];
            if (image !== undefined){
                return image;
            }
        }
        if (state & UIControl.State.active){
            image = images[UIControl.State.active];
            if (image !== undefined){
                return image;
            }
        }
        if (state & UIControl.State.over){
            image = images[UIControl.State.over];
            if (image !== undefined){
                return image;
            }
        }
        image = images[UIControl.State.normal];
        if (image !== undefined){
            return image;
        }
        return null;
    },

    _createImageView: function(){
        var imageView = UIImageView.init();
        this.addSubview(imageView);
        this.setNeedsLayout();
        return imageView;
    },

    getImageForState: function(state){
        return this._imagesByState[state] || null;
    },

    setImageForState: function(image, state){
        this._imagesByState[state] = image;
        if (this._imageView === null){
            this._imageView = this._createImageView();
        }
        this._styler.updateControl(this);
        if (state & UIControl.State.over){
            this.hasOverState = true;
        }
    },

    _createBackgroundImageView: function(){
        var imageView = UIImageView.init();
        this.insertSubviewAtIndex(imageView, 0);
        this.setNeedsLayout();
        return imageView;
    },

    getBackgroundImageForState: function(state){
        return this._backgroundImagesByState || null;
    },

    setBackgroundImageForState: function(image, state){
        this._backgroundImagesByState[state] = image;
        if (this._backgroundImageView === null){
            this._backgroundImageView = this._createBackgroundImageView();
        }
        this._styler.updateControl(this);
        if (state & UIControl.State.over){
            this.hasOverState = true;
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Responder

    canBecomeFirstResponder: function(){
        return this.enabled && this.fullKeyboardAccessEnabled;
    },

    becomeFirstResponder: function(){
    },

    resignFirstResponder: function(){
    },

    mouseDown: function(event){
        if (this.enabled){
            this.active = true;
            return;
        }
        UIButton.$super.mouseDown.call(this, event);
    },

    mouseDragged: function(event){
        if (this.enabled){
            var location = event.locationInView(this);
            this.active = this.containsPoint(location);
            return;
        }
        UIButton.$super.mouseDragged.call(this, event);
    },

    mouseUp: function(event){
        if (this.enabled){
            if (this.active){
                this.sendActionsForEvents(UIControl.Event.primaryAction, event);
                this.active = false;
            }
            var location = event.locationInView(this);
            this.over = this.window !== null && this.containsPoint(location);
            return;
        }
        UIButton.$super.mouseUp.call(this, event);
    },

    touchesBegan: function(touches, event){
        if (this.enabled){
            this.active = true;
            return;
        }
        UIButton.$super.touchesBegan.call(this, touches, event);
    },

    touchesMoved: function(touches, event){
        if (this.enabled){
            var touch = touches[0];
            var location = touch.locationInView(this);
            this.active = this.containsPoint(location);
            return;
        }
        UIButton.$super.touchesMoved.call(this, touches, event);
    },

    touchesEnded: function(touches, event){
        if (this.enabled){
            if (this.active){
                this.sendActionsForEvents(UIControl.Event.primaryAction, event);
                this.active = false;
            }
            return;
        }
        UIButton.$super.touchesEnded.call(this, touches, event);
    },

    touchesCanceled: function(touches, event){
        if (this.enabled){
            this.active = false;
            return;
        }
        UIButton.$super.touchesCanceled.call(this, touches, event);
    },

    keyDown: function(event){
        if (event.key === UIEvent.Key.space){
            this.active = true;
            return;
        }
        UIButton.$super.keyDown.call(this, event);
    },

    keyUp: function(event){
        if (event.key === UIEvent.Key.space){
            if (this.active){
                this.sendActionsForEvents(UIControl.Event.primaryAction, event);
                this.active = false;
                return;
            }
        }
        UIButton.$super.keyUp.call(this, event);
    },

    // -------------------------------------------------------------------------
    // MARK: - Layout

    getFirstBaselineOffsetFromTop: function(){
        if (this._titleLabel !== null){
            this.layoutIfNeeded();
            return this.convertPointFromView(JSPoint(0, this._titleLabel.firstBaselineOffsetFromTop), this._titleLabel).y;
        }
        return this._titleInsets.top;
    },

    getLastBaselineOffsetFromBottom: function(){
        if (this._titleLabel !==  null){
            this.layoutIfNeeded();
            return this.convertPointFromView(JSPoint(0, this._titleLabel.lastBaselineOffsetFromBottom), this._titleLabel).y;
        }
        return this._titleInsets.bottom;
    },

    // -------------------------------------------------------------------------
    // MARK: - Accessibility

    isAccessibilityElement: true,
    accessibilityRole: UIAccessibility.Role.button,

    getAccessibilityLabel: function(){
        var label = UIButton.$super.getAccessibilityLabel.call(this);
        if (label !== null){
            return label;
        }
        if (this._titleLabel !== null){
            return this._titleLabel.text;
        }
        return null;
    },

});

UIButton.Styler = Object.create({}, {
    default: {
        configurable: true,
        get: function UIButton_getDefaultStyler(){
            var styler = UIButtonDefaultStyler.init();
            Object.defineProperty(this, 'default', {writable: true, value: styler});
            return styler;
        },
        set: function UIButton_setDefaultStyler(defaultStyler){
            Object.defineProperty(this, 'default', {writable: true, value: defaultStyler});
        }
    },
    custom: {
        configurable: true,
        get: function UIButton_getCustomStyler(){
            var styler = UIButtonCustomStyler.init();
            Object.defineProperty(this, 'custom', {writable: true, value: styler});
            return styler;
        }
    },
    toolbar: {
        configurable: true,
        get: function UIButton_getToolbarStyler(){
            var styler = UIButtonDefaultStyler.init();
            styler.borderWidth = 0.5;
            styler.shadowColor = null;
            styler.titleInsets = JSInsets(4, 10);
            Object.defineProperty(this, 'toolbar', {writable: true, value: styler});
            return styler;
        },
        set: function UIButton_setToolbarStyler(styler){
            Object.defineProperty(this, 'toolbar', {writable: true, value: styler});
        }
    }
});

JSClass("UIButtonStyler", UIControlStyler, {

    titleInsets: null,
    titleImageSpacing: 4,
    font: null,

    init: function(){
        UIButtonStyler.$super.init.call(this);
        this.font = JSFont.systemFontOfSize(JSFont.Size.normal).fontWithWeight(JSFont.Weight.regular);
    },

    initWithSpec: function(spec){
        UIButtonStyler.$super.initWithSpec.call(this, spec);
        if (spec.containsKey('titleInsets')){
            this.titleInsets = spec.valueForKey("titleInsets", JSInsets);
        }
        if (spec.containsKey('titleImageSpacing')){
            this.titleImageSpacing = spec.valueForKey("titleImageSpacing");
        }
        if (spec.containsKey('font')){
            this.font = spec.valueForKey("font", JSFont);
        }else{
            this.font = JSFont.systemFontOfSize(JSFont.Size.normal).fontWithWeight(JSFont.Weight.regular);
        }
    },

    initializeControl: function(button){
        UIButtonStyler.$super.initializeControl.call(this, button);
        if (this.titleInsets !== null){
            button.titleInsets = this.titleInsets;
        }
    },

    intrinsicSizeOfControl: function(button){
        return this._intrinsicSizeOfControlGivenHeight(button, Number.MAX_VALUE);
    },

    _intrinsicSizeOfControlGivenHeight: function(button, height){
        var size = JSSize(button._titleInsets.width, button._titleInsets.height);
        var titleSize;
        var image = button.getImageForState(UIControl.State.normal);
        var imageScale;
        var contentHeight;
        if (height < Number.MAX_VALUE){
            contentHeight = height - size.height;
            size.height = height;
            if (button._titleLabel !== null){
                titleSize = button._titleLabel.intrinsicSize;
                if (image !== null){
                    imageScale = contentHeight / image.size.height;
                    size.width += Math.ceil(image.size.width * imageScale) + this.titleImageSpacing + titleSize.width;
                }else{
                    size.width += titleSize.width;
                }
            }else if (image !== null){
                size.width += image.size.width;
            }
            return size;
        }
        if (button._titleLabel !== null){
            titleSize = button._titleLabel.intrinsicSize;
            if (image !== null){
                contentHeight = Math.max(image.size.height, titleSize.height);
                imageScale = contentHeight / image.size.height;
                size.width += Math.ceil(image.size.width * imageScale) + this.titleImageSpacing + titleSize.width;
                size.height += contentHeight;
            }else{
                size.width += titleSize.width;
                size.height += titleSize.height;
            }
        }else if (image !== null){
            size.width += image.size.width;
            size.height += image.size.height;
        }
        return size;
    },

    sizeControlToFitSize: function(button, size){
        var intrinsicSize = this._intrinsicSizeOfControlGivenHeight(button, size.height);
        var buttonSize = JSSize(Math.min(size.width, intrinsicSize.width), intrinsicSize.height);
        button.bounds = JSRect(JSPoint.Zero, buttonSize);
    },

    layoutControl: function(button){
        var image = button.getImageForState(UIControl.State.normal);
        var contentRect = button.bounds.rectWithInsets(button._titleInsets);
        if (button._titleLabel !== null){
            if (image !== null){
                var imageScale = contentRect.size.height / image.size.height;
                var imageSize = JSSize(image.size.width * imageScale, contentRect.size.height);
                button._imageView.frame = JSRect(contentRect.origin, imageSize);
                var x = contentRect.origin.x + imageSize.width + this.titleImageSpacing;
                var w = Math.max(0, contentRect.origin.x + contentRect.size.width - x);
                var titleSize = button._titleLabel.intrinsicSize;
                var y = (contentRect.size.height - titleSize.height) / 2;
                button._titleLabel.frame = JSRect(x, contentRect.origin.y + y, w, titleSize.height);
            }else{
                button._titleLabel.frame = contentRect;
            }
        }else if (image !== null){
            button._imageView.frame = contentRect;
        }
        if (button._backgroundImageView !== null){
            button._backgroundImageView.frame = button.bounds;
        }
    },

    updateControl: function(button){
        UIButtonStyler.$super.updateControl.call(this, button);
        if (button._imageView !== null){
            button._imageView.image = button.image;
        }
        if (button._backgroundImageView !== null){
            button._backgroundImageView.image = button.backgroundImage;
        }
    }

});

JSClass("UIButtonCustomStyler", UIButtonStyler, {

    normalBackgroundColor: null,
    disabledBackgroundColor: null,
    overBackgroundColor: null,
    activeBackgroundColor: null,
    normalTitleColor: null,
    disabledTitleColor: null,
    overTitleColor: null,
    activeTitleColor: null,
    cornerRadius: 0,

    initWithBackgroundColor: function(normalBackgroundColor, normalTitleColor){
        UIButtonCustomStyler.$super.init.call(this);
        this.normalBackgroundColor = normalBackgroundColor;
        this.normalTitleColor = normalTitleColor;
        this._commonInit();
    },

    initWithColor: function(color){
        UIButtonCustomStyler.$super.init.call(this);
        this.normalTitleColor = color;
        this._commonInit();
    },

    init: function(){
        UIButtonCustomStyler.$super.init.call(this);
        this.initWithColor(JSColor.black);
    },

    initWithSpec: function(spec){
        UIButtonCustomStyler.$super.initWithSpec.call(this, spec);
        if (spec.containsKey('normalBackgroundColor')){
            this.normalBackgroundColor = spec.valueForKey("normalBackgroundColor", JSColor);
        }
        if (spec.containsKey('activeBackgroundColor')){
            this.activeBackgroundColor = spec.valueForKey("activeBackgroundColor", JSColor);
        }
        if (spec.containsKey('disabledBackgroundColor')){
            this.disabledBackgroundColor = spec.valueForKey("disabledBackgroundColor", JSColor);
        }
        if (spec.containsKey('overBackgroundColor')){
            this.overBackgroundColor = spec.valueForKey("overBackgroundColor", JSColor);
        }
        if (spec.containsKey('normalTitleColor')){
            this.normalTitleColor = spec.valueForKey("normalTitleColor", JSColor);
        }
        if (spec.containsKey('activeTitleColor')){
            this.activeTitleColor = spec.valueForKey("activeTitleColor", JSColor);
        }
        if (spec.containsKey('disabledTitleColor')){
            this.disabledTitleColor = spec.valueForKey("disabledTitleColor", JSColor);
        }
        if (spec.containsKey('overTitleColor')){
            this.overTitleColor = spec.valueForKey("overTitleColor", JSColor);
        }
        if (spec.containsKey('cornerRadius')){
            this.cornerRadius = spec.valueForKey("cornerRadius");
        }
        this._commonInit();
    },

    _commonInit: function(){
        if (this.activeTitleColor === null){
            this.activeTitleColor = this.normalTitleColor.colorDarkenedByPercentage(0.2);
        }
        if (this.disabledTitleColor === null){
            this.disabledTitleColor = this.normalTitleColor.colorWithAlpha(0.5);
        }
        if (this.overTitleColor === null){
            this.overTitleColor = this.normalTitleColor;
        }
        if (this.normalBackgroundColor !== null){
            if (this.activeBackgroundColor === null){
                this.activeBackgroundColor = this.normalBackgroundColor.colorDarkenedByPercentage(0.2);
            }
            if (this.disabledBackgroundColor === null){
                this.disabledBackgroundColor = this.normalBackgroundColor.colorWithAlpha(0.5);
            }
        }
    },

    initializeControl: function(button){
        UIButtonCustomStyler.$super.initializeControl.call(this, button);
        button.cornerRadius = this.cornerRadius;
        this.updateControl(button);
    },

    updateControl: function(button){
        UIButtonCustomStyler.$super.updateControl.call(this, button);
        if (!button.enabled){
            button.layer.backgroundColor = this.disabledBackgroundColor;
            if (button._titleLabel !== null){
                button._titleLabel.textColor = this.disabledTitleColor;
            }
            if (button._imageView !== null){
                button._imageView.templateColor = this.disabledTitleColor;
            }
        }else if (button.active){
            button.layer.backgroundColor = this.activeBackgroundColor;
            if (button._titleLabel !== null){
                button._titleLabel.textColor = this.activeTitleColor;
            }
            if (button._imageView !== null){
                button._imageView.templateColor = this.activeTitleColor;
            }
        }else if (button.over){
            button.layer.backgroundColor = this.overBackgroundColor;
            if (button._titleLabel !== null){
                button._titleLabel.textColor = this.overTitleColor;
            }
            if (button._imageView !== null){
                button._imageView.templateColor = this.overTitleColor;
            }
        }else{
            button.layer.backgroundColor = this.normalBackgroundColor;
            if (button._titleLabel !== null){
                button._titleLabel.textColor = this.normalTitleColor;
            }
            if (button._imageView !== null){
                button._imageView.templateColor = this.normalTitleColor;
            }
        }
    }

});

JSClass("UIButtonDefaultStyler", UIButtonStyler, {

    showsOverState: false,
    normalBackgroundColor: null,
    disabledBackgroundColor: null,
    activeBackgroundColor: null,
    normalBackgroundGradient: null,
    disabledBackgroundGradient: null,
    activeBackgroundGradient: null,
    normalBorderColor: null,
    disabledBorderColor: null,
    activeBorderColor: null,
    normalTitleColor: null,
    disabledTitleColor: null,
    activeTitleColor: null,
    borderWidth: 1,
    shadowColor: null,
    shadowRadius: 1,
    shadowOffset: null,
    font: null,

    init: function(){
        UIButtonDefaultStyler.$super.init.call(this);
        this.normalBackgroundColor = JSColor.controlBackground;
        this.disabledBackgroundColor = JSColor.disabledControlBackground;
        this.activeBackgroundColor = JSColor.activeControlBackground;
        this.normalBorderColor = JSColor.controlBorder;
        this.disabledBorderColor = JSColor.disabledControlBorder;
        this.activeBorderColor = JSColor.activeControlBorder;
        this.normalTitleColor = JSColor.controlTitle;
        this.disabledTitleColor = JSColor.disabledControlTitle;
        this.activeTitleColor = JSColor.activeControlTitle;
        this.shadowColor = JSColor.controlShadow;
        this.shadowOffset = JSPoint(0, 1);
        this.titleInsets = JSInsets(3, 7);
    },

    initializeControl: function(button){
        UIButtonDefaultStyler.$super.initializeControl.call(this, button);
        button.layer.cornerRadius = 3;
        button.layer.shadowColor = this.shadowColor;
        button.layer.shadowOffset = this.shadowOffset;
        button.layer.shadowRadius = this.shadowRadius;
        button.layer.borderWidth = this.borderWidth;
        this.updateControl(button);
    },

    updateControl: function(button){
        UIButtonDefaultStyler.$super.updateControl.call(this, button);
        if (!button.enabled){
            button.layer.backgroundColor = this.disabledBackgroundColor;
            button.layer.backgroundGradient = this.disabledBackgroundGradient;
            button.layer.borderColor = this.disabledBorderColor;
            if (button._titleLabel !== null){
                button._titleLabel.textColor = this.disabledTitleColor;
            }
            if (button._imageView !== null){
                button._imageView.templateColor = this.disabledTitleColor;
            }
        }else if (button.active){
            button.layer.backgroundColor = this.activeBackgroundColor;
            button.layer.backgroundGradient = this.activeBackgroundGradient;
            button.layer.borderColor = this.activeBorderColor;
            if (button._titleLabel !== null){
                button._titleLabel.textColor = this.activeTitleColor;
            }
            if (button._imageView !== null){
                button._imageView.templateColor = this.activeTitleColor;
            }
        }else{
            button.layer.backgroundColor = this.normalBackgroundColor;
            button.layer.backgroundGradient = this.normalBackgroundGradient;
            button.layer.borderColor = this.normalBorderColor;
            if (button._titleLabel !== null){
                button._titleLabel.textColor = this.normalTitleColor;
            }
            if (button._imageView !== null){
                button._imageView.templateColor = this.normalTitleColor;
            }
        }
    }

});

JSClass("UIButtonImageStyler", UIButtonStyler, {

    color: JSDynamicProperty('_color', null),
    activeColor: null,
    disabledColor: null,

    initWithColor: function(color){
        this.color = color;
    },

    initWithSpec: function(spec){
        UIButtonImageStyler.$super.initWithSpec.call(this, spec);
        if (spec.containsKey("color")){
            this.color = spec.valueForKey("color", JSColor);
        }
        if (spec.containsKey("activeColor")){
            this.activeColor = spec.valueForKey("activeColor", JSColor);
        }
        if (spec.containsKey("disabledColor")){
            this.disabledColor = spec.valueForKey("disabledColor", JSColor);
        }
    },

    setColor: function(color){
        if (color === this._color){
            return;
        }
        this._color = color;
        this.activeColor = this._color.colorDarkenedByPercentage(0.2);
        this.disabledColor = this._color.colorWithAlpha(0.5);
    },

    initializeControl: function(button){
        UIButtonImageStyler.$super.initializeControl.call(this, button);
        this.updateControl(button);
    },

    updateControl: function(button){
        UIButtonImageStyler.$super.updateControl.call(this, button);
        if (button._imageView === null){
            return;
        }
        button._imageView.automaticRenderMode = JSImage.RenderMode.template;
        if (!button.enabled){
            button._imageView.templateColor = this.disabledColor;
        }else if (button.active){
            button._imageView.templateColor = this.activeColor;
        }else{
            button._imageView.templateColor = this.color;
        }
    }

});