// #import "UIKit/UILayer.js"
/* global JSClass, UILayer, UIScrollLayer, UILayerAnimatedProperty, JSPoint, JSSize */
'use strict';

JSClass("UIScrollLayer", UILayer, {

    contentOffset: UILayerAnimatedProperty(),
    contentSize: UILayerAnimatedProperty(),
    scrollVertically: true,
    scrollHorizontally: true

});

UIScrollLayer.Properties = Object.create(UILayer.Properties);
UIScrollLayer.Properties.contentOffset = JSPoint.Zero;
UIScrollLayer.Properties.contentSize = JSSize.Zero;