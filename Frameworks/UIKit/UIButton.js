// #import "UIControl.js"
// #import "UILabel.js"
// #import "UIImageView.js"
/* global JSClass, JSObject, JSLazyInitProperty, UIControl, JSSize, JSImage, UIImageView, JSInsets, UIControlStyler, JSReadOnlyProperty, JSDynamicProperty, UILabel, JSColor, UIButton, JSTextAlignment, JSPoint, UIView, JSFont, UIButtonStyler, UIButtonDefaultStyler, UIButtonCustomStyler, JSRect */
'use strict';

JSClass("UIButton", UIControl, {

    image: JSReadOnlyProperty(),
    imageRenderMode: JSDynamicProperty(),
    backgroundImage: JSReadOnlyProperty(),
    titleLabel: JSLazyInitProperty('_createTitleLabel', '_titleLabel'),
    titleInsets: JSDynamicProperty('_titleInsets', null),

    _imagesByState: null,
    _backgroundImagesByState: null,

    _imageView: null,
    _backgroundImageView: null,

    initWithSpec: function(spec, values){
        UIButton.$super.initWithSpec.call(this, spec, values);
        if ('font' in values){
            this.titleLabel.font = JSFont.initWithSpec(spec, values.font);
        }
        if ('title' in values){
            this.titleLabel.text = spec.resolvedValue(values.title);
        }
        if ('titleInsets' in values){
            this._titleInsets = JSInsets.apply(undefined, values.titleInsets.parseNumberArray());
        }
        if ('image' in values){
            var image;
            if (typeof(values.image) == "string"){
                image = JSImage.initWithResourceName(values.image, spec.bundle);
                this.setImageForState(image, UIControl.State.normal);
            }else{
                if ('normal' in values.image){
                    image = JSImage.initWithResourceName(values.image.normal, spec.bundle);
                    this.setImageForState(image, UIControl.State.normal);
                }
                if ('over' in values.image){
                    image = JSImage.initWithResourceName(values.image.over, spec.bundle);
                    this.setImageForState(image, UIControl.State.over);
                }
                if ('active' in values.image){
                    image = JSImage.initWithResourceName(values.image.active, spec.bundle);
                    this.setImageForState(image, UIControl.State.active);
                }
                if ('disabled' in values.image){
                    image = JSImage.initWithResourceName(values.image.disabled, spec.bundle);
                    this.setImageForState(image, UIControl.State.disabled);
                }
            }
        }
        if ('imageRenderMode' in values){
            this.imageRenderMode = spec.resolvedValue(values.imageRenderMode);
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
        titleLabel.backgroundColor = JSColor.clearColor;
        titleLabel.font = JSFont.systemFontOfSize(JSFont.Size.normal).fontWithWeight(JSFont.Weight.regular);
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
        var imageView = UIImageView.initWithRenderMode(UIImageView.RenderMode.template);
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

    setImageRenderMode: function(renderMode){
        if (this._imageView === null){
            this._imageView = this._createImageView();
        }
        this._imageView.renderMode = renderMode;
    },

    getImageRenderMode: function(){
        if (this._imageView === null){
            return UIImageView.RenderMode.template;
        }
        return this._imageView.renderMode;
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

    mouseDown: function(event){
        if (this.enabled){
            this.active = true;
        }else{
            UIButton.$super.mouseDown.call(this, event);
        }
    },

    mouseUp: function(event){
        if (this.enabled){
            if (this.active){
                this.sendActionsForEvent(UIControl.Event.primaryAction);
                this.active = false;
            }
            var location = event.locationInView(this);
            this.over = this.window !== null && this.containsPoint(location);
        }else{
            UIButton.$super.mouseUp.call(this, event);
        }
    },

    mouseDragged: function(event){
        if (this.enabled){
            var location = event.locationInView(this);
            this.active = this.containsPoint(location);
        }else{
            UIButton.$super.mouseDragged.call(this, event);
        }
    },

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
    }

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
            Object.defineProperty(UIButton, 'defaultStyler', {writable: true, value: defaultStyler});
        }
    },
    custom: {
        configurable: true,
        get: function UIButton_getDefaultStyler(){
            var styler = UIButtonCustomStyler.init();
            Object.defineProperty(UIButton, 'custom', {writable: true, value: styler});
            return styler;
        }
    }
});

JSClass("UIButtonStyler", UIControlStyler, {

    titleInsets: null,

    initWithSpec: function(spec, values){
        UIButtonStyler.$super.initWithSpec.call(this, spec, values);
        if ('titleInsets' in values){
            this.titleInsets = JSInsets.apply(undefined, values.titleInsets.parseNumberArray());
        }
    },

    initializeControl: function(button){
        UIButtonStyler.$super.initializeControl.call(this, button);
        if (this.titleInsets !== null){
            button.titleInsets = this.titleInsets;
        }
    },

    intrinsicSizeOfControl: function(button){
        var size = JSSize(button._titleInsets.left + button._titleInsets.right, button._titleInsets.top + button._titleInsets.bottom);
        var titleSize;
        var imageSize;
        var image = button.getImageForState(UIControl.State.normal);
        if (button._titleLabel !== null){
            titleSize = button._titleLabel.intrinsicSize;
            if (image !== null){
                size.width += image.size.width + button._titleInsets.left + titleSize.width;
                size.height += Math.max(image.size.height, titleSize.height);
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
        button.bounds = JSRect(JSPoint.Zero, this.intrinsicSizeOfControl(button));
    },

    layoutControl: function(button){
        if (button._titleLabel !== null){
            if (button._imageView !== null){
                var contentRect = button.bounds.rectWithInsets(button._titleInsets);
                var imageSize = Math.min(contentRect.size.width, contentRect.size.height);
                button._imageView.frame = JSRect(contentRect.origin, JSSize(imageSize, imageSize));
                var x = contentRect.origin.x + imageSize + button._titleInsets.left;
                var w = Math.max(0, contentRect.origin.x + contentRect.size.width - x);
                var titleSize = button._titleLabel.intrinsicSize;
                var y = (contentRect.size.height - titleSize.height) / 2;
                button._titleLabel.frame = JSRect(x, contentRect.origin.y + y, w, titleSize.height);
            }else{
                button._titleLabel.frame = button.bounds.rectWithInsets(button._titleInsets);
            }
        }else if (button._imageView !== null){
            button._imageView.frame = button.bounds.rectWithInsets(button._titleInsets);
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
    shadowColor: null,
    borderWidth: 1,

    init: function(){
        this.normalBackgroundColor = UIButtonDefaultStyler.NormalBackgroundColor;
        this.disabledBackgroundColor = UIButtonDefaultStyler.DisabledBackgroundColor;
        this.activeBackgroundColor = UIButtonDefaultStyler.ActiveBackgroundColor;
        this.normalBorderColor = UIButtonDefaultStyler.NormalBorderColor;
        this.disabledBorderColor = UIButtonDefaultStyler.DisabledBorderColor;
        this.activeBorderColor = UIButtonDefaultStyler.ActiveBorderColor;
        this.normalTitleColor = UIButtonDefaultStyler.NormalTitleColor;
        this.disabledTitleColor = UIButtonDefaultStyler.DisabledTitleColor;
        this.activeTitleColor = UIButtonDefaultStyler.ActiveTitleColor;
        this.shadowColor = JSColor.initWithRGBA(0, 0, 0, 0.1);
        this.titleInsets = JSInsets(3, 7);
    },

    initializeControl: function(button){
        UIButtonDefaultStyler.$super.initializeControl.call(this, button);
        button.layer.cornerRadius = 3;
        button.layer.shadowColor = this.shadowColor;
        button.layer.shadowOffset = JSPoint(0, 1);
        button.layer.shadowRadius = 1;
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

UIButtonDefaultStyler.NormalBackgroundColor = JSColor.initWithRGBA(250/255,250/255,250/255);
UIButtonDefaultStyler.ActiveBackgroundColor = JSColor.initWithRGBA(224/255,224/255,224/255);
UIButtonDefaultStyler.DisabledBackgroundColor = JSColor.initWithRGBA(240/255,240/255,240/255);

UIButtonDefaultStyler.NormalBorderColor = JSColor.initWithRGBA(204/255,204/255,204/255);
UIButtonDefaultStyler.ActiveBorderColor = JSColor.initWithRGBA(192/255,192/255,192/255);
UIButtonDefaultStyler.DisabledBorderColor = JSColor.initWithRGBA(224/255,224/255,224/255);

UIButtonDefaultStyler.NormalTitleColor = JSColor.initWithRGBA(51/255,51/255,51/255);
UIButtonDefaultStyler.ActiveTitleColor = JSColor.initWithRGBA(51/255,51/255,51/255);
UIButtonDefaultStyler.DisabledTitleColor = JSColor.initWithRGBA(152/255,152/255,152/255);

JSClass("UIButtonCustomStyler", UIButtonStyler, {

    normalBackgroundColor: null,
    disabledBackgroundColor: null,
    activeBackgroundColor: null,
    normalTitleColor: null,
    disabledTitleColor: null,
    activeTitleColor: null,
    cornerRadius: 0,

    initWithBackgroundColor: function(normalBackgroundColor, normalTitleColor){
        this.normalBackgroundColor = normalBackgroundColor;
        this.normalTitleColor = normalTitleColor;
        this._commonInit();
    },

    initWithColor: function(color){
        this.normalTitleColor = color;
        this._commonInit();
    },

    init: function(){
        this.initWithColor(JSColor.blackColor);
    },

    initWithSpec: function(spec, values){
        UIButtonCustomStyler.$super.initWithSpec.call(this, spec, values);
        if ('normalBackgroundColor' in values){
            this.normalBackgroundColor = spec.resolvedValue(values.normalBackgroundColor, "JSColor");
        }
        if ('normalTitleColor' in values){
            this.normalTitleColor = spec.resolvedValue(values.normalTitleColor, "JSColor");
        }
        if ('cornerRadius' in values){
            this.cornerRadius = spec.resolvedValue(values.cornerRadius);
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