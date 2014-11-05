// #import "UIKit/UILayer.js"
/* global JSClass, UILayer, UILayerAnimatedProperty, UITextLayer */
'use strict';

JSClass("UITextLayer", UILayer, {
    text: null,
    textColor: UILayerAnimatedProperty(),
    font: null
});

UITextLayer.Properties = Object.create(UILayer.Properties);
UITextLayer.Properties.textColor = null;