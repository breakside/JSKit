// #import "UIKit/UIView.js"
// #import "UIKit/UIRenderer.js"
/* global JSClass, UIView, UIRenderer, JSConstraintBox, UIWindow */
'use strict';

JSClass('UIWindow', UIView, {

    contentView: null,
    firstResponder: null,

    init: function(){
        UIWindow.$super.initWithConstraintBox.call(this, JSConstraintBox.Margin(0));
        this.window = this;
        this.contentView = UIView.initWithConstraintBox(JSConstraintBox.Margin(0));
        this.addSubview(this.contentView);
    },

    makeKeyAndVisible: function(){
        UIRenderer.defaultRenderer.layerInserted(this.layer);
        UIRenderer.defaultRenderer.viewInserted(this);
        UIRenderer.defaultRenderer.makeKeyWindow(this);
    }

});