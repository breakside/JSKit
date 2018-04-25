// #import "UIKit/UIControl.js"
// #import "UIKit/UILabel.js"
// #import "UIKit/UIImageView.js"
/* global JSClass, JSObject, UILayer, JSSize, UIControl, UIControlStyler, JSReadOnlyProperty, JSDynamicProperty, UILabel, JSConstraintBox, JSColor, UICheckbox, JSTextAlignment, JSPoint, UIView, JSFont, UICheckboxStyler, UICheckboxDefaultStyler, JSRect, UIImageView, JSBundle, JSImage */
'use strict';

JSClass("UICheckbox", UIControl, {

    titleLabel: JSReadOnlyProperty('_titleLabel', null),
    on: JSDynamicProperty('_isOn', false, 'isOn'),
    mixed: JSDynamicProperty('_isMixed', false, 'isMixed'),

    initWithSpec: function(spec, values){
        UICheckbox.$super.initWithSpec.call(this, spec, values);
        if ('font' in values){
            this._titleLabel.font = JSFont.initWithSpec(spec, values.font);
        }
        if ('title' in values){
            this._titleLabel.text = spec.resolvedValue(values.title);
        }
    },

    commonUIControlInit: function(){
        UICheckbox.$super.commonUIControlInit.call(this);
        this._titleLabel = UILabel.init();
        this._titleLabel.textAlignment = JSTextAlignment.left;
        this._titleLabel.backgroundColor = JSColor.clearColor();
        this._titleLabel.font = JSFont.systemFontOfSize(JSFont.systemFontSize).fontWithWeight(JSFont.Weight.regular);
        this.addSubview(this._titleLabel);
        if (this._styler === null){
            this._styler = UICheckbox.defaultStyler;
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
            UICheckbox.$super.mouseDown.call(this, event);
        }
    },

    mouseUp: function(event){
        if (!this.enabled){
            return;
        }
        if (this.active){
            this.on = !this.on;
            this.sendActionsForEvent(UIControl.Event.valueChanged);
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

    setOn: function(isOn){
        this._isMixed = false;
        this._isOn = isOn;
        this._styler.updateControl(this);
    },

    setMixed: function(isMixed){
        this._isMixed = isMixed;
        this._isOn = false;
        this._styler.updateControl(this);
    },

    _didChangeState: function(){
        this._styler.updateControl(this);
    }

});

JSClass("UICheckboxStyler", UIControlStyler, {

});

JSClass("UICheckboxDefaultStyler", UICheckboxStyler, {

    showsOverState: false,
    labelPadding: 3,

    initializeControl: function(checkbox){
        checkbox.stylerProperties.boxLayer = UILayer.init();
        checkbox.stylerProperties.boxLayer.borderWidth = 1;
        checkbox.stylerProperties.boxLayer.cornerRadius = 3;
        checkbox.stylerProperties.boxLayer.shadowColor = JSColor.initWithRGBA(0, 0, 0, 0.1);
        checkbox.stylerProperties.boxLayer.shadowOffset = JSPoint(0, 1);
        checkbox.stylerProperties.boxLayer.shadowRadius = 1;
        checkbox.stylerProperties.indicatorView = UIImageView.init();
        checkbox.insertSubviewAtIndex(checkbox.stylerProperties.indicatorView, 0);
        checkbox.layer.insertSublayerAtIndex(checkbox.stylerProperties.boxLayer, 0);
        checkbox.setNeedsLayout();
        this.updateControl(checkbox);
    },

    updateControl: function(checkbox){
        if (!checkbox.enabled){
            checkbox.stylerProperties.boxLayer.backgroundColor    = UICheckboxDefaultStyler.DisabledBackgroundColor;
            checkbox.stylerProperties.boxLayer.borderColor        = UICheckboxDefaultStyler.DisabledBorderColor;
            checkbox.titleLabel.textColor                         = UICheckboxDefaultStyler.DisabledTitleColor;
        }else if (checkbox.active){
            checkbox.stylerProperties.boxLayer.backgroundColor    = UICheckboxDefaultStyler.ActiveBackgroundColor;
            checkbox.stylerProperties.boxLayer.borderColor        = UICheckboxDefaultStyler.ActiveBorderColor;
            checkbox.titleLabel.textColor                         = UICheckboxDefaultStyler.ActiveTitleColor;
        }else{
            checkbox.stylerProperties.boxLayer.backgroundColor    = UICheckboxDefaultStyler.NormalBackgroundColor;
            checkbox.stylerProperties.boxLayer.borderColor        = UICheckboxDefaultStyler.NormalBorderColor;
            checkbox.titleLabel.textColor                         = UICheckboxDefaultStyler.NormalTitleColor;
        }
        if (checkbox.on){
            checkbox.stylerProperties.indicatorView.hidden = false;
            checkbox.stylerProperties.indicatorView.image = images.checkboxOn;
        }else if (checkbox.mixed){
            checkbox.stylerProperties.indicatorView.hidden = false;
            checkbox.stylerProperties.indicatorView.image = images.checkboxMixed;
        }else{
            checkbox.stylerProperties.indicatorView.hidden = true;
        }
    },

    layoutControl: function(checkbox){
        var height = checkbox.titleLabel.font.displayLineHeight;
        var boxSize = JSSize(height, height);
        checkbox.stylerProperties.boxLayer.frame = JSRect(JSPoint.Zero, boxSize);
        checkbox.stylerProperties.indicatorView.frame = checkbox.stylerProperties.boxLayer.frame;
        var x = boxSize.width + this.labelPadding;
        checkbox.titleLabel.frame = JSRect(x, 0, checkbox.bounds.size.width - x, height);
    }

});

Object.defineProperties(UICheckboxDefaultStyler, {
    shared: {
        configurable: true,
        get: function UICheckboxDefaultStyler_getShared(){
            var shared = UICheckboxDefaultStyler.init();
            Object.defineProperty(this, 'shared', {value: shared});
            return shared;
        }
    }
});

UICheckboxDefaultStyler.NormalBackgroundColor = JSColor.initWithRGBA(250/255,250/255,250/255);
UICheckboxDefaultStyler.ActiveBackgroundColor = JSColor.initWithRGBA(224/255,224/255,224/255);
UICheckboxDefaultStyler.DisabledBackgroundColor = JSColor.initWithRGBA(240/255,240/255,240/255);

UICheckboxDefaultStyler.NormalBorderColor = JSColor.initWithRGBA(204/255,204/255,204/255);
UICheckboxDefaultStyler.ActiveBorderColor = JSColor.initWithRGBA(192/255,192/255,192/255);
UICheckboxDefaultStyler.DisabledBorderColor = JSColor.initWithRGBA(224/255,224/255,224/255);

UICheckboxDefaultStyler.NormalTitleColor = JSColor.initWithRGBA(51/255,51/255,51/255);
UICheckboxDefaultStyler.ActiveTitleColor = JSColor.initWithRGBA(51/255,51/255,51/255);
UICheckboxDefaultStyler.DisabledTitleColor = JSColor.initWithRGBA(152/255,152/255,152/255);

var images = Object.create({}, {

    bundle: {
        configurable: true,
        get: function(){
            Object.defineProperty(this, 'bundle', {value: JSBundle.initWithIdentifier("com.owenshaw.JSKit.UIKit") });
            return this.bundle;
        }
    },

    checkboxOn: {
        configurable: true,
        get: function(){
            Object.defineProperty(this, 'checkboxOn', {value: JSImage.initWithResourceName("UIMenuItemOn", this.bundle) });
            return this.checkboxOn;
        }
    },

    checkboxMixed: {
        configurable: true,
        get: function(){
            Object.defineProperty(this, 'checkboxMixed', {value: JSImage.initWithResourceName("UIMenuItemMixed", this.bundle) });
            return this.checkboxMixed;
        }
    },

});

Object.defineProperties(UICheckbox, {
    defaultStyler: {
        configurable: true,
        get: function UICheckbox_getDefaultStyler(){
            Object.defineProperty(UICheckbox, 'defaultStyler', {writable: true, value: UICheckboxDefaultStyler.shared});
            return UICheckbox.defaultStyler;
        },
        set: function UICheckbox_setDefaultStyler(defaultStyler){
            Object.defineProperty(UICheckbox, 'defaultStyler', {writable: true, value: defaultStyler});
        }
    }
});