// #import Foundation
/* global JSClass, JSObject, JSDispatchQueue */
'use strict';

JSClass("JSDispatchQueue", JSObject, {

    init: function(){
        return JSDispatchQueue.EnvironmentImplemenationClass.init();
    },

    enqueue: function(jobClass, args, successCallback, errorCallback, target){
    }

});

JSDispatchQueue.EnvironmentImplemenationClass = null;

Object.defineProperties(JSDispatchQueue, {
    background: {
        configurable: true,
        get: function JSDispatchQueue_getBackground(){
            var background = JSDispatchQueue.init();
            Object.defineProperty(JSDispatchQueue, 'background', {value: background});
            return background;
        }
    }
});