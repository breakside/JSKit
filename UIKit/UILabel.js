// #import "UIKit/UIView.js"
// #import "UIKit/UITextLayer.js"
/* global JSClass, UIView, UIViewLayerProperty, UITextLayer, UILabel */
'use strict';

JSClass('UILabel', UIView, {

    text: UIViewLayerProperty(),
    textColor: UIViewLayerProperty(),
    font: UIViewLayerProperty()

});

UILabel.layerClass = UITextLayer;