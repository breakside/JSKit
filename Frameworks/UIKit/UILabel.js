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
        if ("textColor" in values){
            this.textColor = spec.resolvedValue(values.textColor, "JSColor");
        }
        if ("textAlignment" in values){
            this.textAlignment = spec.resolvedValue(values.textAlignment);
        }
        if ("lines" in values){
            this.maximumNumberOfLines = spec.resolvedValue(values.lines);
        }
        if ("lineBreakMode" in values){
            this.lineBreakMode = spec.resolvedValue(values.lineBreakMode);
        }
    },

    getIntrinsicSize: function(){
        this.sizeToFit();
        // FIXME: can we do this without sizing first?
        // (probably not a real big issue since the intrinsic size will be used to size the view)
        return this.bounds.size;
    },

    getFirstBaselineOffsetFromTop: function(){
        return this.layer.firstBaselineOffsetFromTop;
    },

    getLastBaselineOffsetFromBottom: function(){
        return this.layer.lastBaselineOffsetFromBottom;
    }

});

UILabel.layerClass = UITextLayer;