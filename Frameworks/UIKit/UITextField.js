// #import "UIKit/UIView.js"
// #import "UIKit/UITextLayer.js"
/* global JSClass, UIView, UITextField, UITextLayer, UIViewLayerProperty */

'use strict';

JSClass("UITextField", UIView, {

    text: UIViewLayerProperty(),
    attributedText: UIViewLayerProperty(),
    textColor: UIViewLayerProperty(),
    font: UIViewLayerProperty()

});

UITextField.layerClass = UITextLayer;