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
            var font = spec.resolvedValue(values.font);
            var descriptor = spec.resolvedValue(font.descriptor);
            this.font = JSFont.fontWithDescriptor(descriptor, font.pointSize);
        }
        if ("text" in values){
            this.text = values.text;
        }
    }

});

UILabel.layerClass = UITextLayer;