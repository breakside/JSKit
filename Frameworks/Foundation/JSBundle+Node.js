// #import "Foundation/JSBundle.js"
/* global JSBundle, require, JSData */
'use strict';

var fs = require('fs');
var path = require('path');

JSBundle.definePropertiesFromExtensions({

    getResourceData: function(metadata, callback){
        var resourcePath = metadata.nodeBundlePath;
        if (!path.isAbsolute(resourcePath)){
            resourcePath = path.join(this._dict.nodeRootPath, metadata.nodeBundlePath);
        }
        fs.readFile(resourcePath, function(error, data){
            if (error){
                callback(null);
                return;
            }
            callback(JSData.initWithBytes(data));
        });
    }

});