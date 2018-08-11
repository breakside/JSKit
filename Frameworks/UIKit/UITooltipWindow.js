// #import "UIKit/UIWindow.js"
// #import "UIKit/UILabel.js"
/* global JSClass, UIWindow, UILabel, UIView, JSFont, JSRect, JSPoint, JSSize, JSInsets, JSColor, JSAttributedString, UITooltipWindow, UIWindowCustomStyler */
'use strict';

JSClass("UITooltipWindow", UIWindow, {

    initWithString: function(str, maxSize){
        var font = JSFont.systemFontOfSize(12.0);
        var color = JSColor.initWithRGBA(0.2, 0.2, 0.2, 1.0);
        var labelInsets = JSInsets(4, 6);
        this.initWithProperties(str, font, color, labelInsets, maxSize);
    },

    initWithProperties: function(str, font, textColor, labelInsets, maxSize){
        this._styler = UIWindowCustomStyler.shared;
        UITooltipWindow.$super.init.call(this);
        var label = UILabel.init();
        label.font = font;
        label.textInsets = labelInsets;
        if (str.isKindOfClass && str.isKindOfClass(JSAttributedString)){
            label.attributedText = str;
        }else{
            label.text = str;
        }
        label.maximumNumberOfLines = 0;
        label.sizeToFitSize(maxSize);
        this.contentView = UIView.init();
        this.contentView.addSubview(label);
        this.frame = JSRect(JSPoint.Zero, label.frame.size);
        this.backgroundColor = JSColor.initWithRGBA(240/255, 240/255, 240/255, 1.0);
        this.borderColor = JSColor.initWithRGBA(0.7, 0.7, 0.7, 1.0);
        this.shadowColor = JSColor.initWithRGBA(0.0, 0.0, 0.0, 0.2);
        this.borderWidth = 0.5;
        this.shadowRadius = 15;
    },

    canBecomeKey: function(){
        return false;
    },

    canBecomeMain: function(){
        return false;
    },

    containsPoint: function(location){
        // We don't want to interact with anything, so we'll claim to not
        // contain any point.  That way, the window server won't ever consider
        // us a target
        return false;
    }

});