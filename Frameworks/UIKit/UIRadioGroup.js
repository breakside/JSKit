// #import "UIKit/UIControl.js"
// #import "UIKit/UILabel.js"
// #import "UIKit/UIImageView.js"
/* global JSClass, JSObject, UILayer, JSSize, UIControl, UIControlStyler, JSReadOnlyProperty, JSDynamicProperty, UILabel, JSConstraintBox, JSColor, UIRadioGroup, UIRadioButton, JSTextAlignment, JSPoint, UIView, JSFont, UIRadioButtonStyler, UIRadioButtonDefaultStyler, JSRect, UIImageView, JSBundle, JSImage */
'use strict';

(function(){

JSClass("UIRadioGroup", UIControl, {

    buttons: null,
    selectedButton: null,
    selectedIndex: JSDynamicProperty('_selectedIndex', -1),

    initWithSpec: function(spec, values){
        UIRadioGroup.$super.initWithSpec.call(this, spec, values);
        if ('options' in values){
            for (var i = 0, l = values.options.length; i < l; ++i){
                this.addItemWithTitle(spec.resolvedValue(values.options[i]));
            }
        }
    },

    commonUIControlInit: function(){
        UIRadioGroup.$super.commonUIControlInit.call(this);
        this.buttons = [];
    },

    addItemWithTitle: function(title){
        var button = UIRadioButton.initWithTitle(title);
        button._index = this.buttons.length;
        button._group = this;
        this.buttons.push(button);
        this.addSubview(button);
        this.setNeedsLayout();
    },

    setSelectedIndex: function(selectedIndex){
        if (this.selectedIndex != selectedIndex){
            if (this._selectedIndex >= 0){
                this.buttons[this._selectedIndex].on = false;
            }
            this._selectedIndex = selectedIndex;
            if (this._selectedIndex >= 0){
                this.buttons[this._selectedIndex].on = true;
            }
            this.sendActionsForEvent(UIControl.Event.valueChanged);
        }
    },

    setEnabled: function(isEnabled){
        if (isEnabled !== this.enabled){
            this.enabled = isEnabled;
            for (var i = 0, l = this.buttons.length; i < l; ++i){
                this.buttons[i].enabled = isEnabled;
            }
        }
    },

    layoutSubviews: function(){
        UIRadioGroup.$super.layoutSubviews.call(this);
        var y = 0;
        var button;
        for (var i = 0, l = this.buttons.length; i < l; ++i){
            button = this.buttons[i];
            button.frame = JSRect(0, y, this.bounds.size.width, button.titleLabel.font.displayLineHeight);
            y += Math.floor(button.frame.size.height * 1.2);
        }
    }

});

JSClass("UIRadioButton", UIControl, {

    _group: null,
    _index: null,
    titleLabel: JSReadOnlyProperty('_titleLabel', null),
    on: JSDynamicProperty('_isOn', false, 'isOn'),

    initWithTitle: function(title){
        UIRadioButton.$super.init.call(this);
        this.titleLabel.text = title;
    },

    initWithSpec: function(spec, values){
        UIRadioButton.$super.initWithSpec.call(this, spec, values);
        if ('font' in values){
            this._titleLabel.font = JSFont.initWithSpec(spec, values.font);
        }
        if ('title' in values){
            this._titleLabel.text = spec.resolvedValue(values.title);
        }
    },

    commonUIControlInit: function(){
        UIRadioButton.$super.commonUIControlInit.call(this);
        this._titleLabel = UILabel.init();
        this._titleLabel.textAlignment = JSTextAlignment.left;
        this._titleLabel.backgroundColor = JSColor.clearColor();
        this._titleLabel.font = JSFont.systemFontOfSize(JSFont.systemFontSize).fontWithWeight(JSFont.Weight.regular);
        this.addSubview(this._titleLabel);
        if (this._styler === null){
            this._styler = UIRadioButton.defaultStyler;
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
            UIRadioButton.$super.mouseDown.call(this, event);
        }
    },

    mouseUp: function(event){
        if (!this.enabled){
            return;
        }
        if (this.active){
            this._group.selectedIndex = this._index;
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
        this._isOn = isOn;
        this._styler.updateControl(this);
    },

    _didChangeState: function(){
        this._styler.updateControl(this);
    }

});

JSClass("UIRadioButtonStyler", UIControlStyler, {

});

JSClass("UIRadioButtonDefaultStyler", UIRadioButtonStyler, {

    showsOverState: false,
    labelPadding: 3,

    initializeControl: function(checkbox){
        checkbox.stylerProperties.boxLayer = UILayer.init();
        checkbox.stylerProperties.boxLayer.borderWidth = 1;
        checkbox.stylerProperties.boxLayer.shadowColor = JSColor.initWithRGBA(0, 0, 0, 0.1);
        checkbox.stylerProperties.boxLayer.shadowOffset = JSPoint(0, 1);
        checkbox.stylerProperties.boxLayer.shadowRadius = 1;
        checkbox.stylerProperties.indicatorView = UIImageView.initWithImage(images.radioOn);
        checkbox.insertSubviewAtIndex(checkbox.stylerProperties.indicatorView, 0);
        checkbox.layer.insertSublayerAtIndex(checkbox.stylerProperties.boxLayer, 0);
        checkbox.setNeedsLayout();
        this.updateControl(checkbox);
    },

    updateControl: function(checkbox){
        if (!checkbox.enabled){
            checkbox.stylerProperties.boxLayer.backgroundColor    = UIRadioButtonDefaultStyler.DisabledBackgroundColor;
            checkbox.stylerProperties.boxLayer.borderColor        = UIRadioButtonDefaultStyler.DisabledBorderColor;
            checkbox.titleLabel.textColor                         = UIRadioButtonDefaultStyler.DisabledTitleColor;
        }else if (checkbox.active){
            checkbox.stylerProperties.boxLayer.backgroundColor    = UIRadioButtonDefaultStyler.ActiveBackgroundColor;
            checkbox.stylerProperties.boxLayer.borderColor        = UIRadioButtonDefaultStyler.ActiveBorderColor;
            checkbox.titleLabel.textColor                         = UIRadioButtonDefaultStyler.ActiveTitleColor;
        }else{
            checkbox.stylerProperties.boxLayer.backgroundColor    = UIRadioButtonDefaultStyler.NormalBackgroundColor;
            checkbox.stylerProperties.boxLayer.borderColor        = UIRadioButtonDefaultStyler.NormalBorderColor;
            checkbox.titleLabel.textColor                         = UIRadioButtonDefaultStyler.NormalTitleColor;
        }
        checkbox.stylerProperties.indicatorView.hidden = !checkbox.on;
    },

    layoutControl: function(checkbox){
        var height = checkbox.titleLabel.font.displayLineHeight;
        var boxSize = JSSize(height, height);
        checkbox.stylerProperties.boxLayer.cornerRadius = boxSize.width / 2;
        checkbox.stylerProperties.boxLayer.frame = JSRect(JSPoint.Zero, boxSize);
        checkbox.stylerProperties.indicatorView.frame = checkbox.stylerProperties.boxLayer.frame;
        var x = boxSize.width + this.labelPadding;
        checkbox.titleLabel.frame = JSRect(x, 0, checkbox.bounds.size.width - x, height);
    }

});

Object.defineProperties(UIRadioButtonDefaultStyler, {
    shared: {
        configurable: true,
        get: function UIRadioButtonDefaultStyler_getShared(){
            var shared = UIRadioButtonDefaultStyler.init();
            Object.defineProperty(this, 'shared', {value: shared});
            return shared;
        }
    }
});

UIRadioButtonDefaultStyler.NormalBackgroundColor = JSColor.initWithRGBA(250/255,250/255,250/255);
UIRadioButtonDefaultStyler.ActiveBackgroundColor = JSColor.initWithRGBA(224/255,224/255,224/255);
UIRadioButtonDefaultStyler.DisabledBackgroundColor = JSColor.initWithRGBA(240/255,240/255,240/255);

UIRadioButtonDefaultStyler.NormalBorderColor = JSColor.initWithRGBA(204/255,204/255,204/255);
UIRadioButtonDefaultStyler.ActiveBorderColor = JSColor.initWithRGBA(192/255,192/255,192/255);
UIRadioButtonDefaultStyler.DisabledBorderColor = JSColor.initWithRGBA(224/255,224/255,224/255);

UIRadioButtonDefaultStyler.NormalTitleColor = JSColor.initWithRGBA(51/255,51/255,51/255);
UIRadioButtonDefaultStyler.ActiveTitleColor = JSColor.initWithRGBA(51/255,51/255,51/255);
UIRadioButtonDefaultStyler.DisabledTitleColor = JSColor.initWithRGBA(152/255,152/255,152/255);

var images = Object.create({}, {

    bundle: {
        configurable: true,
        get: function(){
            Object.defineProperty(this, 'bundle', {value: JSBundle.initWithIdentifier("com.owenshaw.JSKit.UIKit") });
            return this.bundle;
        }
    },

    radioOn: {
        configurable: true,
        get: function(){
            Object.defineProperty(this, 'radioOn', {value: JSImage.initWithResourceName("UIRadioButtonOn", this.bundle) });
            return this.radioOn;
        }
    },

});

Object.defineProperties(UIRadioButton, {
    defaultStyler: {
        configurable: true,
        get: function UIRadioButton_getDefaultStyler(){
            Object.defineProperty(UIRadioButton, 'defaultStyler', {writable: true, value: UIRadioButtonDefaultStyler.shared});
            return UIRadioButton.defaultStyler;
        },
        set: function UIRadioButton_setDefaultStyler(defaultStyler){
            Object.defineProperty(UIRadioButton, 'defaultStyler', {writable: true, value: defaultStyler});
        }
    }
});

})();