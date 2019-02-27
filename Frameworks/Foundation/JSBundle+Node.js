// #import "Foundation/JSBundle.js"
/* global JSBundle, require, JSData */
'use strict';

var fs = require('fs');
var path = require('path');

JSBundle.definePropertiesFromExtensions({

    getResourceData: function(metadata, callback, target){
        var resourcePath = this.getNodePath(metadata);
        fs.readFile(resourcePath, function(error, buffer){
            if (error){
                callback.call(target, null);
                return;
            }
            callback.call(target, JSData.initWithNodeBuffer(buffer));
        });
    },

    getNodePath: function(metadata){
        var resourcePath = metadata.nodeBundlePath;
        if (!path.isAbsolute(resourcePath)){
            resourcePath = path.join(this._dict.nodeRootPath, metadata.nodeBundlePath);
        }
        return resourcePath;
    }

});