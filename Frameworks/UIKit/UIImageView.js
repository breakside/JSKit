// #include "UIKit/UIView.js"
// #include "UIKIt/UIImageLayer.js"
/* global JSClass, UIView, UIImageView, UIImageLayer, JSRect, UIViewLayerProperty, JSDynamicProperty, JSSize */
'use strict';

JSClass("UIImageView", UIView, {

    scaleMode: JSDynamicProperty('_scaleMode', 0),
    image: UIViewLayerProperty(),

    _previousSize: null,

    initWithImage: function(image){
        var frameThatFits = JSRect(0, 0, image.width, image.height);
        UIImageView.$super.initWithFrame.call(this, frameThatFits);
        this.image = image;
        this._previousSize = JSSize.Zero;
        this._scaleImage();
    },

    _scaleImage: function(){
        var size = JSSize(this.layer.bounds.size);
        if (!this._previousSize.isEqual(size)){
            switch (this._scaleMode){
                case UIImageView.ScaleMode.Fit:
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

    getScaleMode: function(){
        return this._scaleMode;
    },

    setScaleMode: function(scaleMode){
        this._scaleMode = scaleMode;
        this._previousSize = JSSize.Zero;
        this._scaleImage();
    }

});

UIImageView.layerClass = UIImageLayer;

UIImageView.ScaleMode = {
    Fit: 0,
    AspectFit: 1,
    AspectFill: 2,
    Center: 3
};