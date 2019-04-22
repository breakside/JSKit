// #import "UIView.js"
// #import "UIImageLayer.js"
/* global JSClass, UIView, UIImageView, UIImageLayer, JSImage, JSRect, JSColor, UIViewLayerProperty, JSDynamicProperty, JSSize */
'use strict';

JSClass("UIImageView", UIView, {

    scaleMode: JSDynamicProperty('_scaleMode', 0),
    renderMode: UIViewLayerProperty(),
    templateColor: UIViewLayerProperty(),
    image: JSDynamicProperty(),

    _previousSize: null,

    initWithFrame: function(frame){
        UIImageView.$super.initWithFrame.call(this, frame);
        this._commonImageViewInit();
    },

    initWithSpec: function(spec, values){
        UIImageView.$super.initWithSpec.call(this, spec, values);
        if ('renderMode' in values){
            this.renderMode = spec.resolvedValue(values.renderMode);
        }
        if ('templateColor' in values){
            this.templateColor = spec.resolvedValue(values.templateColor, "JSColor");
        }
        if ('image' in values){
            this.image = JSImage.initWithResourceName(values.image, spec.bundle);
        }
        if ('scaleMode' in values){
            this.scaleMode = spec.resolvedValue(values.scaleMode);
        }else{
            this._scaleImage();
        }
        this._commonImageViewInit();
    },

    _commonImageViewInit: function(){
        this.backgroundColor = null;
        this._previousSize = JSSize.Zero;
        this.clipsToBounds = true;
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

    getImage: function(){
        return this.layer.image;
    },

    setImage: function(image){
        this.layer.image = image;
        this._previousSize = JSSize.Zero;
        this._scaleImage();
    },

    _scaleImage: function(){
        if (!this.image){
            return null;
        }
        var size = JSSize(this.layer.bounds.size);
        var rw, rh, r, w, h;
        if (!this._previousSize.isEqual(size)){
            switch (this._scaleMode){
                case UIImageView.ScaleMode.fit:
                    w = size.width;
                    h = size.height;
                    this.layer.imageFrame = JSRect((size.width - w) / 2.0, (size.height - h) / 2.0, w, h);
                    break;
                case UIImageView.ScaleMode.aspectFit:
                    rw = size.width / this.image.size.width;
                    rh = size.height / this.image.size.height;
                    r = Math.min(rw, rh);
                    w = this.image.size.width * r;
                    h = this.image.size.height * r;
                    this.layer.imageFrame = JSRect((size.width - w) / 2.0, (size.height - h) / 2.0, w, h);
                    break;
                case UIImageView.ScaleMode.aspectFill:
                    rw = size.width / this.image.size.width;
                    rh = size.height / this.image.size.height;
                    r = Math.max(rw, rh);
                    w = this.image.size.width * r;
                    h = this.image.size.height * r;
                    this.layer.imageFrame = JSRect((size.width - w) / 2.0, (size.height - h) / 2.0, w, h);
                    break;
                case UIImageView.ScaleMode.center:
                    w = this.image.size.width;
                    h = this.image.size.height;
                    this.layer.imageFrame = JSRect((size.width - w) / 2.0, (size.height - h) / 2.0, w, h);
                    break;
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

    getIntrinsicSize: function(){
        var image = this.layer._image;
        if (image !== null){
            return JSSize(image.size);
        }
        return JSSize(UIView.noIntrinsicSize, UIView.noIntrinsicSize);
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
