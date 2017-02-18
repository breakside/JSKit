// #import "UIKit/UIView.js"
// #import "UIKit/UITextLayer.js"
/* global JSClass, UIView, UIViewLayerProperty, UITextLayer, UILabel, JSFont */
'use strict';

JSClass('UILabel', UIView, {

    text: UIViewLayerProperty(),
    attributedText: UIViewLayerProperty(),
    textColor: UIViewLayerProperty(),
    font: UIViewLayerProperty(),
    textAlignment: UIViewLayerProperty(),

    initWithSpec: function(spec, values){
        UILabel.$super.initWithSpec.call(this, spec, values);
        if ("fontDescriptor" in values){
            var pointSize = 14.0;
            if ("fontSize" in values){
                pointSize = values.fontSize;
            }
            var descriptor = spec.resolvedValue(values.fontDescriptor);
            this.font = JSFont.fontWithDescriptor(descriptor, pointSize);
        }
    }

});

UILabel.layerClass = UITextLayer;