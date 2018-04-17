// #import "UIKit/UILayer.js"
/* global JSClass, UILayer, UIImageLayer, UILayerAnimatedProperty, JSRect, JSSize, JSDynamicProperty */
'use strict';

JSClass("UIImageLayer", UILayer, {

    image: JSDynamicProperty('_image', null),
    imageFrame: UILayerAnimatedProperty(),
    renderMode: JSDynamicProperty('_renderMode', 0),
    templateColor: JSDynamicProperty('_templateColor', null),

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
            var image = this._image;
            if (this._renderMode == UIImageLayer.RenderMode.template){
                image = image.templateImageWithColor(this.templateColor);
            }
            context.drawImage(image, this.presentation.imageFrame);
        }
    },

    setRenderMode: function(renderMode){
        this._renderMode = renderMode;
        this.setNeedsDisplay();
    }

});

UIImageLayer.Properties = Object.create(UILayer.Properties);
UIImageLayer.Properties.imageFrame = JSRect.Zero;

UIImageLayer.RenderMode = {
    original: 0,
    template: 1
};