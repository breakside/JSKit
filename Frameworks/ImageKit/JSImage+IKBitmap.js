// #import "Foundation/Foundation.js"
// #import "ImageKit/IKBitmap.js"
/* global JSImage, IKBitmap */
'use strict';

JSImage.definePropertiesFromExtensions({
    getBitmap: function(callback){
        this.getData(function(data){
            var bitmap = IKBitmap.initWithEncodedData(data);
            callback(bitmap);
        });
    }
});