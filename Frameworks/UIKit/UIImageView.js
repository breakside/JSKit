// #include "UIKit/UIView.js"
// #include "UIKIt/UIImageLayer.js"
/* global JSClass, UIView, UIImageView, UIImageLayer, JSRect, UIViewLayerProperty */
'use strict';

JSClass("UIImageView", UIView, {
    image: UIViewLayerProperty(),

    initWithImage: function(image){
        var frameThatFits = JSRect(0, 0, image.width, image.height);
        this.$class.$super.initWithFrame.call(this, frameThatFits);
        this.image = image;
    }

});

UIImageView.layerClass = UIImageLayer;