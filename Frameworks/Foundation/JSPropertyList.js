// #import "Foundation/JSObject.js"
// #import "Foundation/JSBundle.js"
/* global JSClass, JSObject, JSPropertyList, JSBundle */
'use strict';

JSClass('JSPropertyList', JSObject, {

    initWithResource: function(name, bundle){
        bundle = bundle || JSBundle.mainBundle;
        var ext;
        var extIndex = name.lastIndexOf('.');
        var extentions = [];
        if (extIndex > 0 && extIndex < name.length - 1){
            ext = name.substr(extIndex + 1);
            name = name.substr(0, extIndex);
        }else{
            ext = 'json';
        }
        var metadata = bundle.metadataForResourceName(name, ext);
        this.initWithObject(metadata.value);
    },

    initWithObject: function(obj){
        if (obj){
            for (var i in obj){
                this[i] = obj[i];
            }
        }
    }
});
