// #import "UIKit/UIControl.js"
// #import "UIKit/UILabel.js"
/* global JSClass, UIControl, JSReadOnlyProperty, UILabel, JSConstraintBox, JSColor, UIButton, UITextAlignment */
'use strict';

JSClass("UIButton", UIControl, {

    titleLabel: JSReadOnlyProperty('_titleLabel', null),
    _isSelected: false,

    init: function(){
        this.$class.$super.init.call(this);
        this.commonUIButtonInit();
    },

    initWithFrame: function(frame){
        this.$class.$super.initWithFrame.call(this, frame);
        this.commonUIButtonInit();
    },

    initWithSpec: function(spec){
        this.$class.$super.initWithSpec.call(this, spec);
        this.commonUIButtonInit();
    },

    initWithConstraintBox: function(box){
        this.$class.$super.initWithConstraintBox.call(this, box);
        this.commonUIButtonInit();
    },

    commonUIButtonInit: function(){
        this._titleLabel = UILabel.initWithConstraintBox(JSConstraintBox.Margin(0));
        this._titleLabel.textAlignment = UITextAlignment.Center;
        this._titleLabel.backgroundColor = JSColor.clearColor();
        this.addSubview(this._titleLabel);
        this.layer.borderColor = JSColor.initWithRGBA(204,204,204);
        this.layer.borderWidth = 1;
        this.layer.cornerRadius = 3;
        this.layer.backgroundColor = JSColor.initWithRGBA(240,240,240);
    },

    getTitleLabel: function(){
        return this._titleLabel;
    },

    mouseDown: function(event){
        this.setSelected(true);
    },

    mouseUp: function(event){
        this.setSelected(false);
    },

    mouseDragged: function(event){
        var location = event.locationInView(this);
        var selected = this.containsPoint(location);
        this.setSelected(selected);
    },

    setSelected: function(isSelected){
        if (isSelected === this._isSelected){
            return;
        }
        this._isSelected = isSelected;
        if (this._isSelected){
            this.layer.backgroundColor = JSColor.initWithRGBA(224,224,224);
        }else{
            this.layer.backgroundColor = JSColor.initWithRGBA(240,240,240);
        }
    }

});

UIButton.Style = {
    Default: 0,
    Custom: 1,
};