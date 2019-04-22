// #import "JSObject.js"
// #import "JSBundle.js"
/* global JSClass, JSObject, JSPropertyList, JSBundle */
'use strict';

JSClass('JSPropertyList', JSObject, {

    initWithResource: function(name, bundle){
        bundle = bundle || JSBundle.mainBundle;
        var ext = name.fileExtension;
        var name = name.substr(0, name.length - ext.length);
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
