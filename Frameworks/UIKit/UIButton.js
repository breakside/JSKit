// #import "UIKit/UIControl.js"
// #import "UIKit/UILabel.js"
// #import "UIKit/UIImageView.js"
/* global JSClass, JSObject, JSLazyInitProperty, UIControl, JSSize, JSImage, UIImageView, JSInsets, UIControlStyler, JSReadOnlyProperty, JSDynamicProperty, UILabel, JSColor, UIButton, JSTextAlignment, JSPoint, UIView, JSFont, UIButtonStyler, UIButtonDefaultStyler, UIButtonCustomStyler, JSRect */
'use strict';

JSClass("UIButton", UIControl, {

    image: JSDynamicProperty('_image'),
    titleLabel: JSLazyInitProperty('_createTitleLabel', '_titleLabel'),
    titleInsets: JSDynamicProperty('_titleInsets', null),
    imageView: JSLazyInitProperty('_createImageView', '_imageView'),
    imageRenderMode: JSDynamicProperty(),

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
            this.image = JSImage.initWithResourceName(values.image, spec.bundle);
        }
        if ('imageRenderMode' in values){
            this.imageRenderMode = spec.resolvedValue(values.imageRenderMode);
        }
    },

    commonUIControlInit: function(){
        UIButton.$super.commonUIControlInit.call(this);
        this._titleInsets = JSInsets.Zero;
        if (this._styler === null){
            this._styler = UIButton.defaultStyler;
        }
        this.hasOverState = this._styler.showsOverState;
        this._styler.initializeControl(this);
    },

    _createTitleLabel: function(){
        var titleLabel = UILabel.init();
        titleLabel.maximumNumberOfLines = 1;
        titleLabel.textAlignment = JSTextAlignment.center;
        titleLabel.backgroundColor = JSColor.clearColor;
        titleLabel.font = JSFont.systemFontOfSize(JSFont.systemFontSize).fontWithWeight(JSFont.Weight.regular);
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

    _createImageView: function(){
        var imageView = UIImageView.initWithRenderMode(UIImageView.RenderMode.template);
        this.addSubview(imageView);
        this.setNeedsLayout();
        this._imageView = imageView;
        this._styler.updateControl(this);
        return imageView;
    },

    getImage: function(){
        if (this._imageView !== null){
            return this._imageView.image;
        }
        return null;
    },

    setImage: function(image){
        this.imageView.image = image;
    },

    setImageRenderMode: function(renderMode){
        this.imageView.renderMode = renderMode;
    },

    getImageRenderMode: function(){
        if (this._imageView === null){
            return UIImageView.RenderMode.template;
        }
        return this._imageView.renderMode;
    },

    mouseDown: function(event){
        if (this.enabled){
            this.active = true;
        }else{
            UIButton.$super.mouseDown.call(this, event);
        }
    },

    mouseUp: function(event){
        if (!this.enabled){
            return;
        }
        if (this.active){
            this.sendActionsForEvent(UIControl.Event.primaryAction);
            this.active = false;
        }
    },

    mouseDragged: function(event){
        if (!this.enabled){
            return;
        }
        var location = event.locationInView(this);
        this.active = this.containsPoint(location);
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
        if (button._titleLabel !== null){
            titleSize = button._titleLabel.intrinsicSize;
            if (button.image !== null){
                imageSize = button.imageView.intrinsicSize;
                size.width += imageSize.width + button._titleInsets.left + titleSize.width;
                size.height = Math.max(imageSize.height, titleSize.height);
            }else{
                size.width += titleSize.width;
                size.height += titleSize.height;
            }
        }else if (button.image !== null){
            imageSize = button.imageView.intrinsicSize;
            if (imageSize.width != UIView.noIntrinsicSize){
                size.width += imageSize.width;
            }
            if (imageSize.height != UIView.noIntrinsicSize){
                size.height += imageSize.height;
            }
        }
        return size;
    },

    sizeControlToFitSize: function(button, size){
        button.bounds = JSRect(JSPoint.Zero, this.intrinsicSizeOfControl(button));
    },

    layoutControl: function(button){
        if (button._titleLabel !== null){
            if (button.image !== null){
                var contentRect = button.bounds.rectWithInsets(button._titleInsets);
                var imageSize = Math.min(contentRect.size.width, contentRect.size.height);
                button.imageView.frame = JSRect(contentRect.origin, JSSize(imageSize, imageSize));
                var x = contentRect.origin.x + imageSize + button._titleInsets.left;
                var w = Math.max(0, contentRect.size.width - x);
                var titleSize = button._titleLabel.intrinsicSize;
                var y = (contentRect.size.height - titleSize.height) / 2;
                button._titleLabel.frame = JSRect(x, y, w, titleSize.height);
            }else{
                button._titleLabel.frame = button.bounds.rectWithInsets(button._titleInsets);
            }
        }else if (button.image !== null){
            button.imageView.frame = button.bounds.rectWithInsets(button._titleInsets);
        }
    }

});

JSClass("UIButtonDefaultStyler", UIButtonStyler, {

    showsOverState: false,

    initializeControl: function(button){
        UIButtonDefaultStyler.$super.initializeControl.call(this, button);
        button.titleInsets = JSInsets(3, 7);
        button.layer.borderWidth = 1;
        button.layer.cornerRadius = 3;
        button.layer.shadowColor = JSColor.initWithRGBA(0, 0, 0, 0.1);
        button.layer.shadowOffset = JSPoint(0, 1);
        button.layer.shadowRadius = 1;
        this.updateControl(button);
    },

    updateControl: function(button){
        if (!button.enabled){
            button.layer.backgroundColor = UIButtonDefaultStyler.DisabledBackgroundColor;
            button.layer.borderColor = UIButtonDefaultStyler.DisabledBorderColor;
            if (button._titleLabel !== null){
                button._titleLabel.textColor = UIButtonDefaultStyler.DisabledTitleColor;
            }
            if (button._imageView !== null){
                button._imageView.templateColor = UIButtonDefaultStyler.DisabledTitleColor;
            }
        }else if (button.active){
            button.layer.backgroundColor = UIButtonDefaultStyler.ActiveBackgroundColor;
            button.layer.borderColor = UIButtonDefaultStyler.ActiveBorderColor;
            if (button._titleLabel !== null){
                button._titleLabel.textColor = UIButtonDefaultStyler.ActiveTitleColor;
            }
            if (button._imageView !== null){
                button._imageView.templateColor = UIButtonDefaultStyler.ActiveTitleColor;
            }
        }else{
            button.layer.backgroundColor = UIButtonDefaultStyler.NormalBackgroundColor;
            button.layer.borderColor = UIButtonDefaultStyler.NormalBorderColor;
            if (button._titleLabel !== null){
                button._titleLabel.textColor = UIButtonDefaultStyler.NormalTitleColor;
            }
            if (button._imageView !== null){
                button._imageView.templateColor = UIButtonDefaultStyler.NormalTitleColor;
            }
        }
    }

});

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

Object.defineProperties(UIButtonDefaultStyler, {
    shared: {
        configurable: true,
        get: function UIButtonDefaultStyler_getShared(){
            var shared = UIButtonDefaultStyler.init();
            Object.defineProperty(this, 'shared', {value: shared});
            return shared;
        }
    }
});

Object.defineProperties(UIButtonCustomStyler, {
    shared: {
        configurable: true,
        get: function UIButtonCustomStyler_getShared(){
            var color = JSColor.initWithWhite(51/255);
            var shared = UIButtonCustomStyler.initWithColor(color);
            Object.defineProperty(this, 'shared', {value: shared});
            return shared;
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

Object.defineProperties(UIButton, {
    defaultStyler: {
        configurable: true,
        get: function UIButton_getDefaultStyler(){
            Object.defineProperty(UIButton, 'defaultStyler', {writable: true, value: UIButtonDefaultStyler.shared});
            return UIButton.defaultStyler;
        },
        set: function UIButton_setDefaultStyler(defaultStyler){
            Object.defineProperty(UIButton, 'defaultStyler', {writable: true, value: defaultStyler});
        }
    },
    customStyler: {
        configurable: true,
        get: function UIButton_getDefaultStyler(){
            Object.defineProperty(UIButton, 'customStyler', {writable: true, value: UIButtonCustomStyler.shared});
            return UIButton.customStyler;
        }
    }
});