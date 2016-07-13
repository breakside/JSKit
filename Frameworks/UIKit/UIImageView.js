// #include "UIKit/UIView.js"
/* global JSClass, UIView, UIImageView */

JSClass("UIImageView", UIView, {
    image: null,

    initWithImage: function(image){
        UIImageView.$super.initWithFrame(0, 0, image.width, image.height);
        this.image = image;
    }
});

UIImageView.layerClass = UIImageLayer;