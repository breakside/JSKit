// #import "UIKit/UIControl.js"
// #import "UIKit/UILabel.js"
/* global JSClass, UIControl, JSReadOnlyProperty, UILabel, JSRect */
'use strict';

JSClass("UIButton", UIControl, {

    titleLabel: JSReadOnlyProperty('_titleLabel', null),

    init: function(){
        this._titleLabel = UILabel.initWithFrame(JSRect(0, 0, this.frame.size.width, this.frame.size.height));
        this.addSubview(this._titleLabel);
    },

    mouseDown: function(event){
    },

    mouseUp: function(event){
    }

});