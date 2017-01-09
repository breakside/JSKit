// #import "UIKit/UILayer.js"
/* global JSClass, UILayer, UIImageLayer, UILayerAnimatedProperty, JSRect, JSSize, JSDynamicProperty */
'use strict';

JSClass("UIImageLayer", UILayer, {

    image: JSDynamicProperty('_image', null),
    imageFrame: UILayerAnimatedProperty(),

    getImage: function(){
        return this._image;
    },

    setImage: function(image){
        this._image = image;
        this.setNeedsDisplay();
    },

    setImageFrame: function(imageFrame){
        this._addImplicitAnimationForKey('imageFrame');
        this.model.imageFrame = imageFrame;
        this.setNeedsDisplay();
    },

    drawInContext: function(context){
        if (this._image !== null && this.presentation.imageFrame.size.width > 0 && this.presentation.imageFrame.size.height > 0){
            context.drawImage(this.presentation.imageFrame, this._image);
        }
    }

});

UIImageLayer.Properties = Object.create(UILayer.Properties);
UIImageLayer.Properties.imageFrame = JSRect.Zero;