// #import "UIKit/UIControl.js"
// #import "UIKit/UILabel.js"
/* global JSClass, JSObject, UIControl, UIControlStyler, JSReadOnlyProperty, JSDynamicProperty, UILabel, JSConstraintBox, JSColor, UIButton, JSTextAlignment, JSPoint, UIView, JSFont, UIButtonStyler, UIButtonDefaultStyler, UIButtonCustomStyler, JSRect */
'use strict';

JSClass("UIButton", UIControl, {

    titleLabel: JSReadOnlyProperty('_titleLabel', null),

    initWithSpec: function(spec, values){
        UIButton.$super.initWithSpec.call(this, spec, values);
        if ('font' in values){
            this._titleLabel.font = JSFont.initWithSpec(spec, values.font);
        }
        if ('title' in values){
            this._titleLabel.text = spec.resolvedValue(values.title);
        }
    },

    commonUIControlInit: function(){
        UIButton.$super.commonUIControlInit.call(this);
        this._titleLabel = UILabel.init();
        this._titleLabel.textAlignment = JSTextAlignment.center;
        this._titleLabel.backgroundColor = JSColor.clearColor;
        this._titleLabel.font = JSFont.systemFontOfSize(JSFont.systemFontSize).fontWithWeight(JSFont.Weight.regular);
        this.addSubview(this._titleLabel);
        if (this._styler === null){
            this._styler = UIButton.defaultStyler;
        }
        this.hasOverState = this._styler.showsOverState;
        this._styler.initializeControl(this);
    },

    getTitleLabel: function(){
        return this._titleLabel;
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
    }

});

JSClass("UIButtonStyler", UIControlStyler, {

});

JSClass("UIButtonDefaultStyler", UIButtonStyler, {

    showsOverState: false,

    initializeControl: function(button){
        button.titleLabel.constraintBox = JSConstraintBox({left: 3, right: 3, height: button.titleLabel.font.displayLineHeight});
        button.layer.borderWidth = 1;
        button.layer.cornerRadius = 3;
        button.layer.shadowColor = JSColor.initWithRGBA(0, 0, 0, 0.1);
        button.layer.shadowOffset = JSPoint(0, 1);
        button.layer.shadowRadius = 1;
        this.updateControl(button);
    },

    updateControl: function(button){
        if (!button.enabled){
            button.layer.backgroundColor    = UIButtonDefaultStyler.DisabledBackgroundColor;
            button.layer.borderColor        = UIButtonDefaultStyler.DisabledBorderColor;
            button.titleLabel.textColor     = UIButtonDefaultStyler.DisabledTitleColor;
        }else if (button.active){
            button.layer.backgroundColor    = UIButtonDefaultStyler.ActiveBackgroundColor;
            button.layer.borderColor        = UIButtonDefaultStyler.ActiveBorderColor;
            button.titleLabel.textColor     = UIButtonDefaultStyler.ActiveTitleColor;
        }else{
            button.layer.backgroundColor    = UIButtonDefaultStyler.NormalBackgroundColor;
            button.layer.borderColor        = UIButtonDefaultStyler.NormalBorderColor;
            button.titleLabel.textColor     = UIButtonDefaultStyler.NormalTitleColor;
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
        if (this.activeBackgroundColor === null){
            this.activeBackgroundColor = this.normalBackgroundColor.colorDarkenedByPercentage(0.2);
        }
        if (this.disabledBackgroundColor === null){
            this.disabledBackgroundColor = this.normalBackgroundColor.colorWithAlpha(0.5);
        }
        if (this.disabledTitleColor === null){
            this.disabledTitleColor = this.normalTitleColor.colorWithAlpha(0.5);
        }
    },

    initializeControl: function(button){
        button.titleLabel.constraintBox = JSConstraintBox({left: 3, right: 3, height: button.titleLabel.font.displayLineHeight});
        button.cornerRadius = this.cornerRadius;
        this.updateControl(button);
    },

    updateControl: function(button){
        if (!button.enabled){
            button.layer.backgroundColor    = this.disabledBackgroundColor;
            button.titleLabel.textColor     = this.disabledTitleColor;
        }else if (button.active){
            button.layer.backgroundColor    = this.activeBackgroundColor;
            button.titleLabel.textColor     = this.activeTitleColor;
        }else{
            button.layer.backgroundColor    = this.normalBackgroundColor;
            button.titleLabel.textColor     = this.normalTitleColor;
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
    }
});