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
    templateColor: JSReadOnlyProperty('_templateColor', null),

    init: function(){
        this._initWithPixelSize(JSSize.Zero, 1);
    },

    initWithResourceName: function(name, bundle){
        return _JSResourceImage.initWithResourceName(name, bundle);
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
        image._stretchBox = this._stretchBox;
        image._templateColor = this._templateColor;
        return image;
    },

    stretchableImageWithCapSizes: function(leftCapWidth, topCapHeight, rightCapWidth, bottomCapHeight){
        var image = this.copy();
        image._stretchBox = JSConstraintBox.Margin(topCapHeight, rightCapWidth, bottomCapHeight, leftCapWidth);
        return image;
    },

    templateImageWithColor: function(color){
        var image = this.copy();
        image._templateColor = color;
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
    metadata: null,

    initWithResourceName: function(name, bundle){
        this.bundle = bundle || JSBundle.mainBundle;
        var ext;
        var extIndex = name.lastIndexOf('.');
        var idealScale = this.preferredScale();
        var i, l;
        var scale = 1;
        if (extIndex > 0 && extIndex < name.length - 1){
            // If the name includes an extension, we're going to look in the bundle for that file
            ext = name.substr(extIndex + 1);
            name = name.substr(0, extIndex);
        }else{
            // If the name doesn't include an extension, we're going to assume its an image set,
            // falling back to a png if no imageset is found
            var set = this.bundle.metadataForResourceName('Contents', 'json', name + '.imageset');
            if (set !== null){
                set = set.value;
                var match = -1;
                // If we have an image set, search through its images to find the best match for our ideal scale
                for (i = 0, l = set.images.length; i < l; ++i){
                    if (!set.images[i].scale){
                        match = i;
                        scale = 1;
                        break;
                    }
                    if (set.images[i].scale == idealScale){
                        match = i;
                        scale = idealScale;
                        break;
                    }
                    if (match < 0){
                        match = i;
                        scale = set.images[match].scale;
                    }else if (set.images[match].scale < idealScale && set.images[i].scale < set.images[match].scale){
                        match = i;
                        scale = set.images[match].scale;
                    }
                }
                if (match >= 0){
                    this.metadata = this.bundle.metadataForResourceName(set.images[match].filename, null, name + '.imageset');
                }
            }else{
                // If an imageset wasn't found, assume png for the extension
                ext = 'png';
            }
        }

        if (this.metadata === null){
            // If we haven't found our resource yet, search by name
            var scaleMatches = name.match(/@(\d)x$/);
            if (scaleMatches !== null){
                // If the name already includes a scale, assume it's an exact resource name
                this.metadata = this.bundle.metadataForResourceName(name, ext);
                scale = parseInt(scaleMatches[1]);
            }else{
                // If there's no scale specified, search for the best scale match
                var scales = [];
                switch (idealScale){
                    case 1:
                        scales = [{name: name, scale: 1}, {name: name + '@2x', scale: 2}, {name: name + '@3x', scale: 3}];
                        break;
                    case 2:
                        scales = [{name: name + '@2x', scale: 2}, {name: name + '@3x', scale: 3}, {name: name, scale: 1}];
                        break;
                    case 3:
                        scales = [{name: name + '@3x', scale: 3}, {name: name + '@2x', scale: 2}, {name: name, scale: 1}];
                        break;
                }
                for (i = 0, l = scales.length; i < l && this.metadata === null; ++i){
                    this.metadata = this.bundle.metadataForResourceName(scales[i].name, ext);
                    scale = scales[i].scale;
                }
            }
        }
        if (this.metadata === null){
            return null;
        }
        _JSResourceImage.$super._initWithPixelSize.call(this, JSSize(this.metadata.image.width, this.metadata.image.height), scale);
    },

    copy: function(){
        var image = _JSResourceImage.init();
        _JSResourceImage.$super.copy.call(this, image);
        image.bundle = this.bundle;
        image.metadata = this.metadata;
        return image;
    },

    getData: function(callback){
        this.bundle.getResourceData(this.metadata, callback);
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
            if (error !== null || task.response.statusClass != JSURLResponse.StatusClass.success){
                callback(null);
            }
            callback(task.response.data);
        });
        task.resume();
    }

});


})();