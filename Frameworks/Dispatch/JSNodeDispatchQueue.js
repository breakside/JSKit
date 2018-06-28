// #import "Dispatch/JSWorkerBasedDispatchQueue.js"
/* global require, process, JSClass, JSObject, JSDispatchQueue, JSWorkerBasedDispatchQueue, JSWorkerBasedDispatchQueueWorker, JSNodeDispatchQueue, JSBundle */
'use strict';

var child_process = require('child_process');
var path = require('path');

JSClass("JSNodeDispatchQueue", JSWorkerBasedDispatchQueue, {

    child: null,

    startWorker: function(){
        var workerModule = JSBundle.mainBundle.info[JSNodeDispatchQueueWorkerModuleBundleKey];
        var mainDir = path.dirname(require.main.filename);
        this.child = child_process.fork(path.join(mainDir, workerModule));
        this.child.on('message', this.receiveWorkerMessage.bind(this));
    },

    sendWorkerMessage: function(message){
        this.child.send(message);
    },

    close: function(){
        this.child.kill();
        this.child = null;
    }

});

JSClass("JSNodeDispatchQueueWorker", JSWorkerBasedDispatchQueueWorker, {

    environmentInit: function(){
        process.on('message', this.receiveQueueMessage.bind(this));
    },

    sendQueueMessage: function(message){
        process.send(message);
    },

    close: function(){
        process.kill();
    }

});

JSDispatchQueue.EnvironmentImplemenationClass = JSNodeDispatchQueue;

var JSNodeDispatchQueueWorkerModuleBundleKey = 'JSNodeDispatchQueueWorkerModule';