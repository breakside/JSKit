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
    maximumNumberOfLines: UIViewLayerProperty(),
    textInsets: UIViewLayerProperty(),

    initWithSpec: function(spec, values){
        UILabel.$super.initWithSpec.call(this, spec, values);
        if ("font" in values){
            this.font = JSFont.initWithSpec(spec, values.font);
        }
        if ("text" in values){
            this.text = spec.resolvedValue(values.text);
        }
        if ("lines" in values){
            this.maximumNumberOfLines = spec.resolvedValue(values.lines);
        }
        if ("lineBreakMode" in values){
            this.lineBreakMode = spec.resolvedValue(values.lineBreakMode);
        }
    },

    sizeToFitConstraints: function(maxSize){
        this.layer.sizeToFitConstraints(maxSize);
    }

});

UILabel.layerClass = UITextLayer;