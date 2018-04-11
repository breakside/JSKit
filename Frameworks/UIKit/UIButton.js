// #import "UIKit/UIControl.js"
// #import "UIKit/UILabel.js"
/* global JSClass, UIControl, JSReadOnlyProperty, JSDynamicProperty, UILabel, JSConstraintBox, JSColor, UIButton, JSTextAlignment, JSPoint */
'use strict';

JSClass("UIButton", UIControl, {

    titleLabel: JSReadOnlyProperty('_titleLabel', null),
    state: JSReadOnlyProperty('_state', null),
    enabled: JSDynamicProperty(null, null, 'isEnabled'),
    _backgroundColorsByState: null,
    _borderColorsByState: null,
    _titleColorsByState: null,

    init: function(){
        UIButton.$super.init.call(this);
        this.commonUIButtonInit();
    },

    initWithFrame: function(frame){
        UIButton.$super.initWithFrame.call(this, frame);
        this.commonUIButtonInit();
    },

    initWithSpec: function(spec){
        UIButton.$super.initWithSpec.call(this, spec);
        this.commonUIButtonInit();
    },

    initWithConstraintBox: function(box){
        UIButton.$super.initWithConstraintBox.call(this, box);
        this.commonUIButtonInit();
    },

    commonUIButtonInit: function(){
        this._titleLabel = UILabel.initWithConstraintBox(JSConstraintBox.Margin(3));
        this._titleLabel.textAlignment = JSTextAlignment.center;
        this._titleLabel.backgroundColor = JSColor.clearColor();
        this.addSubview(this._titleLabel);
        this.layer.borderWidth = 1;
        this.layer.cornerRadius = 3;
        this.layer.shadowColor = JSColor.initWithRGBA(0, 0, 0, 0.1);
        this.layer.shadowOffset = JSPoint(0, 1);
        this.layer.shadowRadius = 1;
        this._state = UIButton.State.Normal;
        this._backgroundColorsByState = {};
        this._backgroundColorsByState[UIButton.State.Normal] = UIButton.DefaultNormalBackgroundColor;
        this._backgroundColorsByState[UIButton.State.Active] = UIButton.DefaultActiveBackgroundColor;
        this._backgroundColorsByState[UIButton.State.Disabled] = UIButton.DefaultDisabledBackgroundColor;
        this._titleColorsByState = {};
        this._titleColorsByState[UIButton.State.Normal] = UIButton.DefaultNormalTitleColor;
        this._titleColorsByState[UIButton.State.Active] = UIButton.DefaultActiveTitleColor;
        this._titleColorsByState[UIButton.State.Disabled] = UIButton.DefaultDisabledTitleColor;
        this._borderColorsByState = {};
        this._borderColorsByState[UIButton.State.Normal] = UIButton.DefaultNormalBorderColor;
        this._borderColorsByState[UIButton.State.Active] = UIButton.DefaultActiveBorderColor;
        this._borderColorsByState[UIButton.State.Disabled] = UIButton.DefaultDisabledBorderColor;
        this._update();
    },

    getTitleLabel: function(){
        return this._titleLabel;
    },

    setEnabled: function(enabled){
        this._setState(enabled ? UIButton.State.Normal : UIButton.State.Disabled);
    },

    isEnabled: function(enabled){
        return this._state != UIButton.State.Disabled;
    },

    getState: function(){
        return this._state;
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

    mouseDown: function(event){
        if (this.enabled){
            this._setState(UIButton.State.Active);
        }else{
            UIButton.$super.mouseDown.call(this, event);
        }
    },

    mouseUp: function(event){
        if (this.enabled){
            if (this.state == UIButton.State.Active){
                this.sendActionsForEvent(UIControl.Event.PrimaryAction);
            }
            this._setState(UIButton.State.Normal);
        }
    },

    mouseDragged: function(event){
        if (this.enabled){
            var location = event.locationInView(this);
            var selected = this.containsPoint(location);
            this._setState(selected ? UIButton.State.Active : UIButton.State.Normal);
        }
    },

    _update: function(){
        this.layer.backgroundColor = this._backgroundColorsByState[this._state];
        this.layer.borderColor = this._borderColorsByState[this._state];
        this.titleLabel.textColor = this._titleColorsByState[this._state];
    },

    _setState: function(state){
        if (state === this._state){
            return;
        }
        this._state = state;
        this._update();
    },

});

UIButton.Style = {
    Default: 0,
    Custom: 1,
};

UIButton.State = {
    Normal: 0,
    Active: 1,
    Disabled: 2
};

UIButton.DefaultNormalBackgroundColor = JSColor.initWithRGBA(250/255,250/255,250/255);
UIButton.DefaultActiveBackgroundColor = JSColor.initWithRGBA(224/255,224/255,224/255);
UIButton.DefaultDisabledBackgroundColor = JSColor.initWithRGBA(240/255,240/255,240/255);

UIButton.DefaultNormalBorderColor = JSColor.initWithRGBA(204/255,204/255,204/255);
UIButton.DefaultActiveBorderColor = JSColor.initWithRGBA(192/255,192/255,192/255);
UIButton.DefaultDisabledBorderColor = JSColor.initWithRGBA(224/255,224/255,224/255);

UIButton.DefaultNormalTitleColor = JSColor.initWithRGBA(51/255,51/255,51/255);
UIButton.DefaultActiveTitleColor = JSColor.initWithRGBA(51/255,51/255,51/255);
UIButton.DefaultDisabledTitleColor = JSColor.initWithRGBA(152/255,152/255,152/255);
