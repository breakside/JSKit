// #import Foundation
// #import "IKBitmap.js"
/* global JSImage, IKBitmap, JSSize */
'use strict';

JSImage.definePropertiesFromExtensions({

    getBitmap: function(callback){
        this.getData(function(data){
            var bitmap = IKBitmap.initWithEncodedData(data);
            callback(bitmap);
        });
    }
});