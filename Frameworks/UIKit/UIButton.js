// #import "UIKit/UIControl.js"
// #import "UIKit/UILabel.js"
/* global JSClass, JSObject, UIControl, JSReadOnlyProperty, JSDynamicProperty, UILabel, JSConstraintBox, JSColor, UIButton, JSTextAlignment, JSPoint, UIView, JSFont, UIButtonStyler, UIButtonDefaultStyler, JSRect */
'use strict';

JSClass("UIButton", UIControl, {

    titleLabel: JSReadOnlyProperty('_titleLabel', null),
    state: JSReadOnlyProperty('_state', null),
    enabled: JSDynamicProperty(null, null, 'isEnabled'),
    styler: JSReadOnlyProperty('_styler', null),
    _stylerProperties: null,

    init: function(){
        this.initWithStyler(UIButton.defaultStyler);
    },

    initWithStyler: function(styler){
        this._styler = styler;
        this.initWithFrame(JSRect(0, 0, 100, 100));
    },

    initWithFrame: function(frame){
        UIButton.$super.initWithFrame.call(this, frame);
        if (this._styler === null){
            this._styler = UIButton.defaultStyler;
        }
        this.commonUIButtonInit();
    },

    initWithSpec: function(spec, values){
        UIButton.$super.initWithSpec.call(this, spec, values);
        if ('styler' in values){
            this._styler = spec.resolvedValue(values.styler);
        }else{
            this._styler = UIButton.defaultStyler;
        }
        this.commonUIButtonInit();
        if ('title' in values){
            this._titleLabel.text = spec.resolvedValue(values.title);
        }
    },

    initWithConstraintBox: function(box){
        UIButton.$super.initWithConstraintBox.call(this, box);
        this._styler = UIButton.defaultStyler;
        this.commonUIButtonInit();
    },

    commonUIButtonInit: function(){
        this._titleLabel = UILabel.init();
        this._titleLabel.textAlignment = JSTextAlignment.center;
        this._titleLabel.backgroundColor = JSColor.clearColor();
        this._titleLabel.font = JSFont.systemFontOfSize(JSFont.systemFontSize).fontWithWeight(JSFont.Weight.regular);
        this.addSubview(this._titleLabel);
        this._state = UIButton.State.normal;
        this._stylerProperties = {};
        this._styler.initializeButton(this);
        if (this._styler.hasHoverState){
            this.startMouseTracking(UIView.MouseTracking.enterAndExit);
        }
    },

    layoutSubviews: function(){
        UIButton.$super.layoutSubviews.call(this);
        this._styler.layoutButton(this);
    },

    drawLayerInContext: function(layer, context){
        this._styler.drawButtonLayerInContext(this, layer, context);
    },

    getTitleLabel: function(){
        return this._titleLabel;
    },

    setEnabled: function(enabled){
        if (this._state != UIButton.state.disabled){
            this.stopMouseTracking();
        }else if (enabled){
            this.startMouseTracking(UIView.MouseTracking.enterAndExit);
        }
        this._setState(enabled ? UIButton.State.normal : UIButton.State.disabled);
    },

    isEnabled: function(enabled){
        return this._state != UIButton.State.disabled;
    },

    getState: function(){
        return this._state;
    },

    mouseDown: function(event){
        if (this.enabled){
            this._setState(UIButton.State.active);
        }else{
            UIButton.$super.mouseDown.call(this, event);
        }
    },

    mouseUp: function(event){
        if (this.enabled){
            if (this.state == UIButton.State.active){
                this.sendActionsForEvent(UIControl.Event.PrimaryAction);
                if (this.state === UIButton.State.active){
                    this._setState(UIButton.State.over);
                }
            }
        }
    },

    mouseDragged: function(event){
        if (this.enabled){
            var location = event.locationInView(this);
            var selected = this.containsPoint(location);
            this._setState(selected ? UIButton.State.active : UIButton.State.normal);
        }
    },

    mouseEntered: function(event){
        this._setState(UIButton.State.over);
    },

    mouseExited: function(event){
        this._setState(UIButton.State.normal);
    },

    _setState: function(state){
        if (state === this._state){
            return;
        }
        this._state = state;
        this._styler.updateButton(this);
    }

});

UIButton.State = {
    normal: 0,
    active: 1,
    disabled: 2,
    over: 3
};

JSClass("UIButtonStyler", JSObject, {

    hasHoverState: false,

    initializeButton: function(button){
    },

    updateButton: function(button){
    },

    layoutButton: function(button){
    },

    drawButtonLayerInContext: function(button, layer, context){
    }

});

JSClass("UIButtonDefaultStyler", UIButtonStyler, {

    hasHoverState: true,
    _backgroundColorsByState: null,
    _titleColorsByState: null,
    _borderColorsByState: null,

    init: function(){
        this._backgroundColorsByState = {};
        this._backgroundColorsByState[UIButton.State.normal] = UIButtonDefaultStyler.DefaultNormalBackgroundColor;
        this._backgroundColorsByState[UIButton.State.active] = UIButtonDefaultStyler.DefaultActiveBackgroundColor;
        this._backgroundColorsByState[UIButton.State.disabled] = UIButtonDefaultStyler.DefaultDisabledBackgroundColor;
        this._backgroundColorsByState[UIButton.State.over] = UIButtonDefaultStyler.DefaultOverBackgroundColor;
        this._titleColorsByState = {};
        this._titleColorsByState[UIButton.State.normal] = UIButtonDefaultStyler.DefaultNormalTitleColor;
        this._titleColorsByState[UIButton.State.active] = UIButtonDefaultStyler.DefaultActiveTitleColor;
        this._titleColorsByState[UIButton.State.disabled] = UIButtonDefaultStyler.DefaultDisabledTitleColor;
        this._titleColorsByState[UIButton.State.over] = UIButtonDefaultStyler.DefaultOverTitleColor;
        this._borderColorsByState = {};
        this._borderColorsByState[UIButton.State.normal] = UIButtonDefaultStyler.DefaultNormalBorderColor;
        this._borderColorsByState[UIButton.State.active] = UIButtonDefaultStyler.DefaultActiveBorderColor;
        this._borderColorsByState[UIButton.State.disabled] = UIButtonDefaultStyler.DefaultDisabledBorderColor;
        this._borderColorsByState[UIButton.State.over] = UIButtonDefaultStyler.DefaultOverBorderColor;
    },

    setBackgroundColorForState: function(color, state){
        this._backgroundColorsByState[state] = color;
    },

    setBorderColorForState: function(color, state){
        this._borderColorsByState[state] = color;
    },

    setTitleColorForState: function(color, state){
        this._titleColorsByState[state] = color;
    },

    initializeButton: function(button){
        button.titleLabel.constraintBox = JSConstraintBox.Margin(3);
        button.layer.borderWidth = 1;
        button.layer.cornerRadius = 3;
        button.layer.shadowColor = JSColor.initWithRGBA(0, 0, 0, 0.1);
        button.layer.shadowOffset = JSPoint(0, 1);
        button.layer.shadowRadius = 1;
        this.updateButton(button);
    },

    updateButton: function(button){
        button.layer.backgroundColor = this._backgroundColorsByState[button._state];
        button.layer.borderColor = this._borderColorsByState[button._state];
        button.titleLabel.textColor = this._titleColorsByState[button._state];
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

UIButtonDefaultStyler.DefaultNormalBackgroundColor = JSColor.initWithRGBA(250/255,250/255,250/255);
UIButtonDefaultStyler.DefaultActiveBackgroundColor = JSColor.initWithRGBA(224/255,224/255,224/255);
UIButtonDefaultStyler.DefaultDisabledBackgroundColor = JSColor.initWithRGBA(240/255,240/255,240/255);
UIButtonDefaultStyler.DefaultOverBackgroundColor = JSColor.initWithRGBA(240/255,240/255,255/255);

UIButtonDefaultStyler.DefaultNormalBorderColor = JSColor.initWithRGBA(204/255,204/255,204/255);
UIButtonDefaultStyler.DefaultActiveBorderColor = JSColor.initWithRGBA(192/255,192/255,192/255);
UIButtonDefaultStyler.DefaultDisabledBorderColor = JSColor.initWithRGBA(224/255,224/255,224/255);
UIButtonDefaultStyler.DefaultOverBorderColor = JSColor.initWithRGBA(192/255,192/255,192/255);

UIButtonDefaultStyler.DefaultNormalTitleColor = JSColor.initWithRGBA(51/255,51/255,51/255);
UIButtonDefaultStyler.DefaultActiveTitleColor = JSColor.initWithRGBA(51/255,51/255,51/255);
UIButtonDefaultStyler.DefaultDisabledTitleColor = JSColor.initWithRGBA(152/255,152/255,152/255);
UIButtonDefaultStyler.DefaultOverTitleColor = JSColor.initWithRGBA(51/255,51/255,51/255);

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