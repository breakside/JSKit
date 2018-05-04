// #import "Dispatch/JSWorkerBasedDispatchQueue.js"
// #feature window.Worker
/* global self, Worker, JSClass, JSObject, JSDispatchQueue, JSWorkerBasedDispatchQueue, JSWorkerBasedDispatchQueueWorker, JSHTMLDispatchQueue, JSBundle */
'use strict';

(function(){

JSClass("JSHTMLDispatchQueue", JSWorkerBasedDispatchQueue, {

    worker: null,

    startWorker: function(){
        this.worker = new Worker(JSBundle.mainBundle.info()[JSHTMLDispatchQueueWorkerScriptBundleKey]);
        this.worker.addEventListener('message', this);
    },

    sendWorkerMessage: function(message){
        this.worker.postMessage(message);
    },

    handleEvent: function(e){
        this[e.type](e);
    },

    message: function(e){
        this.receiveWorkerMessage(e.data);
    },

    close: function(){
        this.worker.terminate();
        this.worker = null;
    }

});

JSClass("JSHTMLDispatchQueueWorker", JSWorkerBasedDispatchQueueWorker, {

    environmentInit: function(){
        self.addEventListener('message', this);
    },

    handleEvent: function(e){
        this[e.type](e);
    },

    message: function(e){
        this.receiveQueueMessage(e.data);
    },

    sendQueueMessage: function(message){
        self.postMessage(message);
    },

    close: function(){
        self.close();
    }

});

JSDispatchQueue.EnvironmentImplemenationClass = JSHTMLDispatchQueue;

var JSHTMLDispatchQueueWorkerScriptBundleKey = 'JSHTMLDispatchQueueWorkerScript';

})();