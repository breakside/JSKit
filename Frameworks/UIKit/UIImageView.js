// #import "UIView.js"
// #import "UIImageLayer.js"
'use strict';

JSClass("UIImageView", UIView, {

    scaleMode: JSDynamicProperty('_scaleMode', 0),
    templateColor: UIViewLayerProperty(),
    automaticRenderMode: UIViewLayerProperty(),
    image: JSDynamicProperty(),
    contentInsets: JSDynamicProperty('_contentInsets', null),

    _previousSize: null,

    initWithFrame: function(frame){
        UIImageView.$super.initWithFrame.call(this, frame);
        this._contentInsets = JSInsets.Zero;
        this._commonImageViewInit();
    },

    initWithSpec: function(spec){
        UIImageView.$super.initWithSpec.call(this, spec);
        if (spec.containsKey('templateColor')){
            this.templateColor = spec.valueForKey("templateColor", JSColor);
        }
        if (spec.containsKey("contentInsets")){
            this._contentInsets = spec.valueForKey("contentInsets", JSInsets);
        }
        if (spec.containsKey('image')){
            this.image = spec.valueForKey("image", JSImage);
        }
        if (spec.containsKey('scaleMode')){
            this.scaleMode = spec.valueForKey("scaleMode", UIImageView.ScaleMode);
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

    initWithImage: function(image){
        var frameThatFits = JSRect(0, 0, image.size.width, image.size.height);
        UIImageView.$super.initWithFrame.call(this, frameThatFits);
        this._contentInsets = JSInsets.Zero;
        this.image = image;
        this._scaleImage();
    },

    getImage: function(){
        return this.layer.image;
    },

    setImage: function(image){
        if (image !== this.layer.image){
            this.layer.image = image;
            this._previousSize = JSSize.Zero;
            this._scaleImage();
        }
    },

    _scaleImage: function(){
        if (!this.image){
            return null;
        }
        var imageFrame = this.layer.bounds.rectWithInsets(this._contentInsets);
        var size = JSSize(imageFrame.size);
        var rw, rh, r, w, h;
        if (!this._previousSize.isEqual(size)){
            switch (this._scaleMode){
                case UIImageView.ScaleMode.fit:
                    break;
                case UIImageView.ScaleMode.aspectFit:
                    rw = size.width / this.image.size.width;
                    rh = size.height / this.image.size.height;
                    r = Math.min(rw, rh);
                    imageFrame.size.width = this.image.size.width * r;
                    imageFrame.size.height = this.image.size.height * r;
                    break;
                case UIImageView.ScaleMode.aspectFill:
                    rw = size.width / this.image.size.width;
                    rh = size.height / this.image.size.height;
                    r = Math.max(rw, rh);
                    imageFrame.size.width = this.image.size.width * r;
                    imageFrame.size.height = this.image.size.height * r;
                    break;
                case UIImageView.ScaleMode.center:
                    imageFrame.size.width = this.image.size.width;
                    imageFrame.size.height = this.image.size.height;
                    break;
            }
            imageFrame.origin.x += (size.width - imageFrame.size.width) / 2.0;
            imageFrame.origin.y += (size.height - imageFrame.size.height) / 2.0;
            this.layer.imageFrame = imageFrame;
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

    setContentInsets: function(contentInsets){
        this._contentInsets = JSInsets(contentInsets);
        this._scaleImage();
    },

    getIntrinsicSize: function(){
        var image = this.layer._image;
        if (image !== null){
            var size = JSSize(image.size);
            size.width += this._contentInsets.width;
            size.height += this._contentInsets.height;
            return size;
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
