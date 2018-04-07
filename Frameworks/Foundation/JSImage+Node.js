// #import "Foundation/JSImage.js"
/* global JSImage, _JSResourceImage, require, JSData */
'use strict';

_JSResourceImage.definePropertiesFromExtensions({

    getData: function(callback){
        var fs = require('fs');
        fs.readFile(this.resource.image.path, function(error, data){
            if (error){
                callback(null);
                return;
            }
            callback(JSData.initWithBytes(data));
        });
    }

});