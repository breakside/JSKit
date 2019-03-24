// #import "Foundation/JSBundle.js"
/* global JSBundle, require, JSData */
'use strict';

var fs = require('fs');
var path = require('path');

JSBundle.definePropertiesFromExtensions({

    getResourceData: function(metadata, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var resourcePath = this.getNodePath(metadata);
        fs.readFile(resourcePath, function(error, buffer){
            if (error){
                completion.call(target, null);
                return;
            }
            completion.call(target, JSData.initWithNodeBuffer(buffer));
        });
        return completion.promise;
    },

    getNodePath: function(metadata){
        var resourcePath = metadata.nodeBundlePath;
        if (!path.isAbsolute(resourcePath)){
            resourcePath = path.join(JSBundle.nodeRootPath, metadata.nodeBundlePath);
        }
        return resourcePath;
    }

});