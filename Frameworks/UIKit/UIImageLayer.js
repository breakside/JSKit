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
        if (image === this._image){
            return;
        }
        this._image = image;
        this.setNeedsDisplay();
    },

    setImageFrame: function(imageFrame){
        this._imageFrame = imageFrame;
        this.setNeedsDisplay();
    },

    drawInContext: function(context){
        if (this._image !== null && this._imageFrame.size.width > 0 && this._imageFrame.size.height > 0){
            if (this.renderMode == UIImageLayer.RenderMode.template){
                context.setFillColor(this._templateColor);
                context.fillMaskedRect(this._imageFrame, this._image);
            }else{
                context.drawImage(this._image, this._imageFrame);
            }
        }
    },

    setRenderMode: function(renderMode){
        if (renderMode === this._renderMode){
            return;
        }
        this._renderMode = renderMode;
        this.setNeedsDisplay();
    },

    setTemplateColor: function(templateColor){
        if (templateColor === null && this._templateColor === null){
            return;
        }
        if (templateColor !== null && this._templateColor !== null && templateColor.isEqual(this._templateColor)){
            return;
        }
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