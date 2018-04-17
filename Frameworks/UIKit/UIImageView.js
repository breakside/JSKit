// #import "UIKit/UIView.js"
// #import "UIKit/UIImageLayer.js"
/* global JSClass, UIView, UIImageView, UIImageLayer, JSRect, UIViewLayerProperty, JSDynamicProperty, JSSize */
'use strict';

JSClass("UIImageView", UIView, {

    scaleMode: JSDynamicProperty('_scaleMode', 0),
    renderMode: UIViewLayerProperty(),
    templateColor: UIViewLayerProperty(),
    image: UIViewLayerProperty(),

    _previousSize: null,

    _commonViewInit: function(){
        UIImageView.$super._commonViewInit.call(this);
        this.backgroundColor = null;
        this._previousSize = JSSize.Zero;
    },

    initWithRenderMode: function(renderMode){
        UIImageView.$super.init.call(this);
        this.renderMode = renderMode || UIImageView.RenderMode.original;
    },

    initWithImage: function(image, renderMode){
        var frameThatFits = JSRect(0, 0, image.size.width, image.size.height);
        UIImageView.$super.initWithFrame.call(this, frameThatFits);
        this.image = image;
        this.renderMode = renderMode || UIImageView.RenderMode.original;
        this._scaleImage();
    },

    _scaleImage: function(){
        var size = JSSize(this.layer.bounds.size);
        if (!this._previousSize.isEqual(size)){
            switch (this._scaleMode){
                case UIImageView.ScaleMode.fit:
                    this.layer.imageFrame = JSRect(0, 0, size.width, size.height);
                    break;
                // TODO: support other scales
            }
            this._previousSize = size;
        }
    },

    layerDidChangeSize: function(layer){
        if (layer === this.layer){
            this._scaleImage();
        }
    },

    setScaleMode: function(scaleMode){
        this._scaleMode = scaleMode;
        this._previousSize = JSSize.Zero;
        this._scaleImage();
    },

    setTintColor: function(tintColor){
        this._tintColor = tintColor;
        this.setNeedsDisplay();
    }
});

UIImageView.layerClass = UIImageLayer;

UIImageView.ScaleMode = {
    fit: 0,
    aspectFit: 1,
    aspectFill: 2,
    center: 3
};

UIImageView.RenderMode = UIImageLayer.RenderMode;
