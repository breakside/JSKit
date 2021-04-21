// #import "JSNotificationCenter.js"
// #import "JSRunLoop.js"
"use strict";

JSClass("JSDistributedNotificationCenter", JSNotificationCenter, {

    initLocal: function(){
        JSDistributedNotificationCenter.$super.init.call(this);
    },

    initWithURL: function(url, identifier){
        if (url.scheme === "amqp"){
            if (JSGlobalObject.JSAMQPNotificationCenter){
                return JSGlobalObject.JSAMQPNotificationCenter.initWithURL(url, identifier);
            }else{
                throw new Error("AMQP notification center not supported for this environment");
            }
        }
        throw new Error("Unsupported notification center: %{public}".sprintf(url.scheme));
    },

    open: function(completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        JSRunLoop.main.schedule(completion, target);
        return completion.promise;
    },

    close: function(completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        JSRunLoop.main.schedule(completion, target);
        return completion.promise;
    }

});