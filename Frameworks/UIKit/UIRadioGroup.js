// #import "UIControl.js"
// #import "UILabel.js"
// #import "UIImageView.js"
/* global JSClass, JSObject, UILayer, JSSize, UIControl, UIControlStyler, JSReadOnlyProperty, JSDynamicProperty, UILabel, JSColor, UIRadioGroup, UIRadioButton, JSTextAlignment, JSPoint, UIView, JSFont, UIRadioButtonStyler, UIRadioButtonDefaultStyler, JSRect, UIImageView, JSBundle, JSImage */
'use strict';

(function(){

JSClass("UIRadioGroup", UIControl, {

    buttons: null,
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
            this.sendActionsForEvents(UIControl.Event.primaryAction | UIControl.Event.valueChanged);
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
        this._titleLabel.backgroundColor = JSColor.clearColor;
        this._titleLabel.font = JSFont.systemFontOfSize(JSFont.Size.normal).fontWithWeight(JSFont.Weight.regular);
        this.addSubview(this._titleLabel);
        if (this._styler === null){
            this._styler = UIRadioButton.Styler.default;
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
            this._group.didChangeValueForBinding('selectedIndex');
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
    }

});

UIRadioButton.Styler = Object.create({}, {
    default: {
        configurable: true,
        get: function UIRadioButton_getDefaultStyler(){
            var styler = UIRadioButtonDefaultStyler.init();
            Object.defineProperty(this, 'default', {writable: true, value: styler});
            return styler;
        },
        set: function UIRadioButton_setDefaultStyler(styler){
            Object.defineProperty(this, 'default', {writable: true, value: styler});
        }
    }
});

JSClass("UIRadioButtonStyler", UIControlStyler, {

});

JSClass("UIRadioButtonDefaultStyler", UIRadioButtonStyler, {

    showsOverState: false,
    labelPadding: 3,

    initializeControl: function(button){
        button.stylerProperties.boxLayer = UILayer.init();
        button.stylerProperties.boxLayer.borderWidth = 1;
        button.stylerProperties.boxLayer.shadowColor = JSColor.initWithRGBA(0, 0, 0, 0.1);
        button.stylerProperties.boxLayer.shadowOffset = JSPoint(0, 1);
        button.stylerProperties.boxLayer.shadowRadius = 1;
        button.stylerProperties.indicatorView = UIImageView.initWithImage(images.radioOn);
        button.insertSubviewAtIndex(button.stylerProperties.indicatorView, 0);
        button.layer.insertSublayerAtIndex(button.stylerProperties.boxLayer, 0);
        button.setNeedsLayout();
        this.updateControl(button);
    },

    updateControl: function(button){
        if (!button.enabled){
            button.stylerProperties.boxLayer.backgroundColor    = UIRadioButtonDefaultStyler.DisabledBackgroundColor;
            button.stylerProperties.boxLayer.borderColor        = UIRadioButtonDefaultStyler.DisabledBorderColor;
            button.titleLabel.textColor                         = UIRadioButtonDefaultStyler.DisabledTitleColor;
        }else if (button.active){
            button.stylerProperties.boxLayer.backgroundColor    = UIRadioButtonDefaultStyler.ActiveBackgroundColor;
            button.stylerProperties.boxLayer.borderColor        = UIRadioButtonDefaultStyler.ActiveBorderColor;
            button.titleLabel.textColor                         = UIRadioButtonDefaultStyler.ActiveTitleColor;
        }else{
            button.stylerProperties.boxLayer.backgroundColor    = UIRadioButtonDefaultStyler.NormalBackgroundColor;
            button.stylerProperties.boxLayer.borderColor        = UIRadioButtonDefaultStyler.NormalBorderColor;
            button.titleLabel.textColor                         = UIRadioButtonDefaultStyler.NormalTitleColor;
        }
        button.stylerProperties.indicatorView.templateColor = button.titleLabel.textColor;
        button.stylerProperties.indicatorView.hidden = !button.on;
    },

    layoutControl: function(button){
        var height = button.titleLabel.font.displayLineHeight;
        var boxSize = JSSize(height, height);
        button.stylerProperties.boxLayer.cornerRadius = boxSize.width / 2;
        button.stylerProperties.boxLayer.frame = JSRect(JSPoint.Zero, boxSize);
        button.stylerProperties.indicatorView.frame = button.stylerProperties.boxLayer.frame;
        var x = boxSize.width + this.labelPadding;
        button.titleLabel.frame = JSRect(x, 0, button.bounds.size.width - x, height);
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
            Object.defineProperty(this, 'bundle', {value: JSBundle.initWithIdentifier("io.breakside.JSKit.UIKit") });
            return this.bundle;
        }
    },

    radioOn: {
        configurable: true,
        get: function(){
            var image = JSImage.initWithResourceName("UIRadioButtonOn", this.bundle);
            Object.defineProperty(this, 'radioOn', {value: image.imageWithRenderMode(JSImage.RenderMode.template) });
            return this.radioOn;
        }
    },

});

})();