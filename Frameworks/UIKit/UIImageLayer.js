// #import "UILayer.js"
/* global JSClass, UILayer, JSImage, JSColor, UIImageLayer, UILayerAnimatedProperty, JSPoint, JSRect, JSSize, JSDynamicProperty */
'use strict';

JSClass("UIImageLayer", UILayer, {

    image: JSDynamicProperty('_image', null),
    imageFrame: JSDynamicProperty('_imageFrame', null),
    templateColor: JSDynamicProperty('_templateColor', null),
    automaticRenderMode: JSDynamicProperty('_automaticRenderMode', JSImage.RenderMode.original),

    init: function(){
        UIImageLayer.$super.init.call(this);
        this._imageFrame = JSRect.Zero;
        this._templateColor = JSColor.blackColor;
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
            if (this._image.renderMode === JSImage.RenderMode.template || (this._image.renderMode === JSImage.RenderMode.automatic && this._automaticRenderMode === JSImage.RenderMode.template)){
                context.setFillColor(this._templateColor);
                context.fillMaskedRect(this._imageFrame, this._image);
            }else{
                context.drawImage(this._image, this._imageFrame);
            }
        }
    },

    setAutomaticRenderMode: function(renderMode){
        if (renderMode === this._automaticRenderMode){
            return;
        }
        this._automaticRenderMode = renderMode;
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