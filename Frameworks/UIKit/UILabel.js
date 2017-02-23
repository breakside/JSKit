// #import "UIKit/UIView.js"
// #import "UIKit/UITextLayer.js"
/* global JSClass, UIView, UIViewLayerProperty, UITextLayer, UILabel, JSFont */
'use strict';

JSClass('UILabel', UIView, {

    text: UIViewLayerProperty(),
    attributedText: UIViewLayerProperty(),
    textColor: UIViewLayerProperty(),
    font: UIViewLayerProperty(),
    lineBreakMode: UIViewLayerProperty(),
    textAlignment: UIViewLayerProperty(),

    initWithSpec: function(spec, values){
        UILabel.$super.initWithSpec.call(this, spec, values);
        if ("font" in values){
            var descriptor = spec.resolvedValue(values.font.descriptor);
            this.font = JSFont.fontWithDescriptor(descriptor, values.font.pointSize);
        }
        if ("text" in values){
            this.text = values.text;
        }
    }

});

UILabel.layerClass = UITextLayer;