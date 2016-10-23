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
        // TODO: adjust contentOffset if it's too big for the new size
        this.didChangeProperty('contentSize');
    }

});

UIScrollLayer.Properties = Object.create(UILayer.Properties);
UIScrollLayer.Properties.contentOffset = JSPoint.Zero;
UIScrollLayer.Properties.contentSize = JSSize.Zero;