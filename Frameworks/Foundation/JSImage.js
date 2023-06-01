// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #import "Promise+JS.js"
// #import "CoreTypes.js"
// #import "JSObject.js"
// #import "JSData.js"
// #import "JSBundle.js"
// #import "JSURLSession.js"
// #import "JSURLResponse.js"
// #import "JSXMLParser.js"
'use strict';

(function(){

JSClass('JSImage', JSObject, {

    size: JSReadOnlyProperty('_size', null),
    scale: JSReadOnlyProperty('_scale', 1),
    capInsets: JSReadOnlyProperty('_capInsets', null),
    renderMode: JSReadOnlyProperty('_renderMode', 0),

    init: function(){
        this._initWithPixelSize(JSSize.Zero, 1);
    },

    initWithResourceName: function(name, bundle){
        return _JSResourceImage.initWithResourceName(name, bundle);
    },

    initWithResourceMetadata: function(metadata, bundle){
        return _JSResourceImage.initWithResourceMetadata(metadata, bundle);
    },

    initWithData: function(data, size, scale){
        return _JSDataImage.initWithData(data, size, scale);
    },

    initWithURL: function(url, size, scale){
        return _JSURLImage.initWithURL(url, size, scale);
    },

    initWithSpec: function(spec){
        if (spec.stringValue !== null){
            return this.initWithResourceName(spec.stringValue, spec.bundle);
        }
        var image = null;
        if (spec.containsKey('name')){
            image = this.initWithResourceName(spec.valueForKey("name"), spec.bundle);
        }
        if (image !== null && spec.containsKey("renderMode")){
            image = image.imageWithRenderMode(spec.valueForKey("renderMode", JSImage.RenderMode));
        }
        return image;
    },

    _initWithPixelSize: function(size, scale, renderMode){
        if (scale === undefined){
            scale = 1;
        }
        this._size = JSSize(size.width / scale, size.height / scale);
        this._scale = scale;
        this._renderMode = renderMode || JSImage.RenderMode.automatic;
    },

    copy: function(image){
        if (image === undefined){
            image = JSImage.init();
        }
        image._size = JSSize(this._size);
        image._scale = this._scale;
        image._capInsets = JSInsets(this._capInsets);
        image._renderMode = this._renderMode;
        return image;
    },

    imageWithRenderMode: function(renderMode){
        var image = this.copy();
        image._renderMode = renderMode;
        return image;
    },

    stretchableImageWithCapSizes: function(leftCapWidth, topCapHeight, rightCapWidth, bottomCapHeight){
        var image = this.copy();
        image._capInsets = JSInsets(topCapHeight, leftCapWidth, bottomCapHeight, rightCapWidth);
        return image;
    },

    preferredScale: function(){
        return 1;
    },

    getData: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        completion.call(target, null);
        return completion.promise;
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

    _renderModeFromMetadata: function(metadata){
        if (metadata.properties){
            if (metadata.properties['template-rendering-intent'] == 'template'){
                return JSImage.RenderMode.template;
            }
            if (metadata.properties['template-rendering-intent'] == 'original'){
                return JSImage.RenderMode.original;
            }
        }
        return JSImage.RenderMode.automatic;
    },

    initWithResourceMetadata: function(metadata, bundle){
        this.metadata = metadata;
        this.bundle = bundle;
        var renderMode = this._renderModeFromMetadata(metadata);
        _JSResourceImage.$super._initWithPixelSize.call(this, JSSize(this.metadata.image.width, this.metadata.image.height), metadata.scale || 1, renderMode);
    },

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
                // If an imageset wasn't found, first assume svg for the extension
                this.metadata = this.bundle.metadataForResourceName(name, 'svg');

                // If we there's no matching svg, assume png for the extension
                if (this.metadata === null){
                    ext = 'png';
                }
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
        var renderMode = this._renderModeFromMetadata(this.metadata);
        _JSResourceImage.$super._initWithPixelSize.call(this, JSSize(this.metadata.image.width, this.metadata.image.height), scale, renderMode);
    },

    copy: function(){
        var image = _JSResourceImage.init();
        _JSResourceImage.$super.copy.call(this, image);
        image.bundle = this.bundle;
        image.metadata = this.metadata;
        image.contentType = this.contentType;
        return image;
    },

    getData: function(completion, target){
        this.bundle.getResourceData(this.metadata, completion, target);
    }

});

JSClass("_JSDataImage", JSImage, {

    data: null,
    contentType: null,

    initWithData: function(data, size, scale){
        if (data === null){
            return null;
        }
        this.data = data;
        this.contentType = JSImage.contentTypeOfData(data);
        if (size === undefined){
            if (this.contentType === null){
                return null;
            }
            switch (this.contentType.subtype){
                case "png":
                    size = _JSDataImage.sizeFromPNGData(data);
                    break;
                case "jpeg":
                    size = _JSDataImage.sizeFromJPEGData(data);
                    break;
                case "svg+xml":
                    size = _JSDataImage.sizeFromSVGData(data);
                    break;
                default:
                    return null;
            }
        }
        _JSDataImage.$super._initWithPixelSize.call(this, size, scale);
    },

    copy: function(){
        var image = _JSDataImage.init();
        _JSDataImage.$super.copy.call(this, image);
        image.data = this.data;
        image.contentType = this.contentType;
        return image;
    },

    getData: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        completion.call(target, this.data);
        return completion.promise;
    }

});

JSImage.contentTypeOfData = function(data){
    if (data.length >= 24 &&
        // magic
        data[0] == 0x89 &&
        data[1] == 0x50 &&
        data[2] == 0x4E &&
        data[3] == 0x47 &&
        data[4] == 0x0D &&
        data[5] == 0x0A &&
        data[6] == 0x1A &&
        data[7] == 0x0A && 

        // IHDR
        data[12] == 0x49 &&
        data[13] == 0x48 &&
        data[14] == 0x44 &&
        data[15] == 0x52)
    {
        return JSMediaType("image/png");
    }else if (data.length > 2 && data[0] == 0xFF && data[1] == 0xD8){
        return JSMediaType("image/jpeg");
    }else if (data.length > 0 && data[0] == 0x3C){
        var parser = JSXMLParser.initWithData(data);
        var contentType = null;
        parser.delegate = {
            xmlParserDidBeginElement: function(parser, name, prefix, namespace, attributes){
                if (namespace == 'http://www.w3.org/2000/svg' && name.toLowerCase() == 'svg'){
                    contentType = JSMediaType("image/svg+xml");
                }
                parser.stop();
            }
        };
        parser.parse();
        return contentType;
    }
    return null;
};

_JSDataImage.sizeFromPNGData = function(data){
    var dataView = data.dataView();
    return JSSize(dataView.getUint32(16), dataView.getUint32(20));
};

_JSDataImage.sizeFromJPEGData = function(data){
    var dataView = data.dataView();
    var i = 0;
    var b;
    var l = data.length;
    var blockLength;
    var blockdata;
    while (i < l){
        b = data[i++];
        if (b != 0xFF){
            // TODO: Error, not at a maker
            return JSSize.Zero;
        }
        if (i == l){
            // TODO: Error, not enough room for marker
            return JSSize.Zero;
        }
        b = data[i++];
        if (b == 0x00){
            // TODO: Error, invalid marker
            return JSSize.Zero;
        }
        // D0-D9 are standalone markers...make sure not to look for a length
        if (b < 0xD0 || b > 0xD9){
            if (i >= l - 2){
                // TODO: Error, not enough room for block header
                return JSSize.Zero;
            }
            blockLength = dataView.getUint16(i);
            if (i + blockLength > l){
                // TODO: Error, not enough room for block data
                return JSSize.Zero;
            }
            // C0-CF are start of frame blocks, expect for C4 and CC
            // start of frame blocks have image sizes
            if (b >= 0xC0 && b <= 0xCF && b != 0xC4 && b != 0xCC){
                if (blockLength >= 7){
                    return JSSize(dataView.getUint16(i + 5), dataView.getUint16(i + 3));
                }
                return JSSize.Zero;
            }
            i += blockLength;
        }
    }
    return JSSize.Zero;
};

_JSDataImage.sizeFromSVGData = function(data){
    var parser = JSXMLParser.initWithData(data);
    var size = JSSize(1, 1);
    parser.delegate = {
        xmlParserDidBeginElement: function(parser, name, prefix, namespace, attributes){
            var multiple = {
                'em': 12,
                'ex': 24,
                'px': 1,
                'in': 72,
                'cm': 72/2.54,
                'mm': 72/25.4,
                'pt': 1,
                'pc': 12
            };
            var px = function(length){
                if (length === undefined || length === null){
                    return undefined;
                }
                var matches = length.match(/^\s*(\d+)\s*(em|ex|px|in|cm|mm|pt|pc|%)?\s*$/);
                if (!matches){
                    return undefined;
                }
                var n = parseInt(matches[1]);
                if (!matches[2]){
                    return n;
                }
                var unit = matches[2];
                if (unit == '%'){
                    return undefined;
                }
                return multiple[unit] * n;
            };
            if (namespace == 'http://www.w3.org/2000/svg' && name.toLowerCase() == 'svg'){
                var width = px(attributes.get("width"));
                var height = px(attributes.get("height"));
                var viewBox = attributes.get("viewBox");
                if (width !== undefined && height !== undefined){
                    size.width = width;
                    size.height = height;
                }else if (viewBox){
                    var box = viewBox.split(/\s+/).map(function(n){ return parseInt(n); });
                    if (!isNaN(box[2]) && !isNaN(box[3])){
                        size.width = box[2];
                        size.height = box[3];
                    }
                }
            }
            parser.stop();
        }
    };
    parser.parse();
    return size;
};

JSClass("_JSURLImage", JSImage, {

    url: null,

    initWithURL: function(url, size, scale){
        if (url === null){
            return null;
        }
        _JSURLImage.$super._initWithPixelSize.call(this, size, scale);
        this.url = url;
    },

    copy: function(){
        var image = _JSURLImage.init();
        _JSURLImage.$super.copy.call(this, image);
        image.url = this.url;
        return image;
    },

    getData: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.rejectNonNullSecondArgument);
        }
        var session = JSURLSession.shared;
        var task = session.dataTaskWithURL(this.url, function(error){
            if (error !== null){
                completion.call(target, null, error);
                return;
            }
            try{
                task.response.assertSuccess();
            }catch (e){
                completion.call(target, null, e);
                return;
            }
            completion.call(target, task.response.data, null);
        });
        task.resume();
        return completion.promise;
    }

});

JSImage.resourceCache = function(names, bundle){
    var cache = {};
    var definePropertyFromName = function(name){
        Object.defineProperty(cache, name, {
            configurable: true,
            get: function(){
                var img = JSImage.initWithResourceName(name, bundle);
                Object.defineProperty(this, name, {value: img});
                return img;
            }
        });
    };
    for (var i = 0, l = names.length; i < l; ++i){
        definePropertyFromName(names[i]);
    }
    return cache;
};

JSImage.RenderMode = {
    automatic: 0,
    original: 1,
    template: 2
};

})();