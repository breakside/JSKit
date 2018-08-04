// #import "UIKit/UILayer.js"
/* global JSClass, UILayer, UIImageLayer, UILayerAnimatedProperty, JSPoint, JSRect, JSSize, JSDynamicProperty */
'use strict';

JSClass("UIImageLayer", UILayer, {

    image: JSDynamicProperty('_image', null),
    imageFrame: JSDynamicProperty('_imageFrame', null),
    renderMode: JSDynamicProperty('_renderMode', 0),
    templateColor: JSDynamicProperty('_templateColor', null),

    init: function(){
        UIImageLayer.$super.init.call(this);
        this._imageFrame = JSRect.Zero;
    },

    getImage: function(){
        return this._image;
    },

    setImage: function(image){
        this._image = image;
        this.setNeedsDisplay();
    },

    setImageFrame: function(imageFrame){
        this._imageFrame = imageFrame;
        this.setNeedsDisplay();
    },

    boundsOriginDidChange: function(){
        UIImageLayer.$super.boundsOriginDidChange.call(this);
        this.setNeedsDisplay();
    },

    drawInContext: function(context){
        if (this._image !== null && this._imageFrame.size.width > 0 && this._imageFrame.size.height > 0){
            var image = this._image;
            if (this._renderMode == UIImageLayer.RenderMode.template){
                image = image.templateImageWithColor(this.templateColor);
            }
            var imageFrame = JSRect(this._imageFrame);
            imageFrame.origin.x -= this.bounds.origin.x;
            imageFrame.origin.y -= this.bounds.origin.y;
            context.drawImage(image, imageFrame);
        }
    },

    setRenderMode: function(renderMode){
        this._renderMode = renderMode;
        this.setNeedsDisplay();
    },

    setTemplateColor: function(templateColor){
        this._templateColor = templateColor;
        this.setNeedsDisplay();
    },

    sizeToFit: function(){
        if (this._image !== null){
            this.bounds = JSRect(JSPoint.Zero, this._image.size);
        }
    }

});

UIImageLayer.RenderMode = {
    original: 0,
    template: 1
};