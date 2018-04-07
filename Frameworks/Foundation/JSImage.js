// #import "Foundation/CoreTypes.js"
// #import "Foundation/JSObject.js"
// #import "Foundation/JSData.js"
// #import "Foundation/JSBundle.js"
// #import "Foundation/JSURLSession.js"
/* global JSClass, JSReadOnlyProperty, JSSize, JSObject, JSBundle, JSImage, JSData, JSConstraintBox, _JSResourceImage, _JSDataImage, _JSURLImage, JSURLSession, JSURLResponse */
'use strict';

(function(){

JSClass('JSImage', JSObject, {

    size: JSReadOnlyProperty('_size', null),
    scale: JSReadOnlyProperty('_scale', 1),
    stretchBox: JSReadOnlyProperty('_stretchBox', null),
    dataFormat: JSReadOnlyProperty('_dataFormat', 0),

    init: function(){
        this._initWithPixelSize(JSSize.Zero, 1);
    },

    initWithResourceName: function(name){
        return _JSResourceImage.initWithResourceName(name);
    },

    initWithData: function(data, scale){
        return _JSDataImage.initWithData(data, scale);
    },

    initWithURL: function(url, size, scale){
        return _JSURLImage.initWithURL(url, size, scale);
    },

    _initWithPixelSize: function(size, scale){
        this._size = JSSize(size.width / scale, size.height / scale);
        this._scale = scale;
    },

    copy: function(image){
        if (image === undefined){
            image = JSImage.init();
        }
        image._size = JSSize(this._size);
        image._scale = this._scale;
        image._dataFormat = this._dataFormat;
        return image;
    },

    stretchableImageWithCapSizes: function(leftCapWidth, topCapHeight, rightCapWidth, bottomCapHeight){
        var image = this.copy();
        image._stretchBox = JSConstraintBox.Margin(topCapHeight, rightCapWidth, bottomCapHeight, leftCapWidth);
        return image;
    },

    preferredScale: function(){
        return 1;
    },

    getData: function(callback){
        callback(null);
    }

});

JSImage.DataFormat = {
    unknown: 0,
    png: 1,
    jpeg: 2
};

JSClass("_JSResourceImage", JSImage, {

    bundle: null,
    resourceName: null,
    resource: null,

    initWithResourceName: function(name, bundle){
        var idealScale = this.preferredScale();
        this.bundle = bundle || JSBundle.mainBundle;
        this.resourceName = name;
        var resources = this.bundle.resourcesNamed(this.resourceName);
        var resource;
        for (var i = 0; i < resources.length; ++i){
            resource = resources[i];
            if (resource.kind == "image"){
                if (this.resource === null){
                    this.resource = resource;
                }else{
                    if (resource.image.vector){
                        this.resource = resource;
                        return;
                    }
                    if (resource.image.scale == idealScale){
                        this.resource = resource;
                    }else if (this.resource.image.scale < idealScale && resource.image.scale > this.resource.image.scale){
                        this.resource = resource;
                    }else if (this.resource.image.scale > idealScale && resource.image.scale > idealScale && resource.image.scale < this.resource.image.scale){
                        this.resource = resource;
                    }
                }
            }
        }
        if (this.resource === null){
            return null;
        }
        _JSResourceImage.$super._initWithPixelSize.call(this, JSSize(this.resource.image.width, this.resource.image.height), this.resource.image.scale || 1);
    },

    copy: function(){
        var image = _JSResourceImage.init();
        _JSResourceImage.$super.copy.call(this, image);
        image.bundle = this.bundle;
        image.resourceName = this.resourceName;
        image.resource = this.resource;
        return image;
    }

});

JSClass("_JSDataImage", JSImage, {

    data: null,

    initWithData: function(data, scale){
        this.data = data;
        var size = JSSize.Zero;
        _JSDataImage.$super._initWithPixelSize.call(this, size, scale);
    },

    copy: function(){
        var image = _JSDataImage.init();
        _JSDataImage.$super.copy.call(this, image);
        image.data = this.data;
        return image;
    },

    getData: function(callback){
        callback(this.data);
    }

});

JSClass("_JSURLImage", JSImage, {

    url: null,

    initWithURL: function(url, size, scale){
        _JSURLImage.$super._initWithPixelSize.call(this, size, scale);
        this.url = url;
    },

    copy: function(){
        var image = _JSURLImage.init();
        _JSURLImage.$super.copy.call(this, image);
        image.url = this.url;
        return image;
    },

    getData: function(callback){
        var session = JSURLSession.sharedSession;
        var task = session.dataTaskWithURL(this.url, function(error){
            if (error !== null){
                callback(null);
            }
            var response = task.response;
            if (response.statusClass != JSURLResponse.StatusClass.success){
                callback(null);
            }
            callback(response.data);
        });
        task.resume();
    }

});


})();