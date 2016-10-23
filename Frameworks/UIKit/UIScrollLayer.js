// #import "UIKit/UILayer.js"
/* global JSClass, UILayer, UIScrollLayer, UILayerAnimatedProperty, JSPoint, JSSize, JSRect */
'use strict';

JSClass("UIScrollLayer", UILayer, {

    contentOffset: UILayerAnimatedProperty(),
    contentSize: UILayerAnimatedProperty(),
    scrollVertically: true,
    scrollHorizontally: true,

    setContentOffset: function(offset){
        this._addImplicitAnimationForKey('contentOffset');
        this.model.contentOffset = JSPoint(offset);
        this.bounds = JSRect(offset, this.model.bounds.size);
        this.didChangeProperty('contentOffset');
    },

    setContentSize: function(size){
        this._addImplicitAnimationForKey('contentSize');
        this.model.contentSize = JSSize(size);
        var maxOffset = JSPoint(
            Math.max(0, this.model.contentSize.width - this.model.bounds.size.width),
            Math.max(0, this.model.contentSize.height - this.model.bounds.size.height)
        );
        if (maxOffset.x > this.model.contentOffset.x || maxOffset.y > this.model.contentOffset.y){
            this.contentOffset = JSPoint(Math.min(maxOffset.x, this.model.contentOffset.x), Math.min(maxOffset.y, this.model.contentOffset.y));
        }
        this.didChangeProperty('contentSize');
    }

});

UIScrollLayer.Properties = Object.create(UILayer.Properties);
UIScrollLayer.Properties.contentOffset = JSPoint.Zero;
UIScrollLayer.Properties.contentSize = JSSize.Zero;