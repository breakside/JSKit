// #import "Foundation/JSObject.js"
// #import "Foundation/JSBundle.js"
/* global JSClass, JSObject, JSPropertyList, JSBundle */
'use strict';

JSClass('JSPropertyList', JSObject, {
    initWithResource: function(resourceName){
        var obj = JSBundle.mainBundle.resourceNamed(resourceName);
        this.initWithObject(obj);
    },
    initWithObject: function(obj){
        if (obj){
            for (var i in obj){
                this[i] = obj[i];
            }
        }
    }
});
