// #import Foundation
'use strict';

JSClass("JSDispatchQueue", JSObject, {

    init: function(){
        return JSDispatchQueue.EnvironmentImplemenationClass.init();
    },

    enqueue: function(jobClass, args, completion, target){
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