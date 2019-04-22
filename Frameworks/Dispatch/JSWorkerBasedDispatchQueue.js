// #import "JSDispatchQueue.js"
// #feature window.Worker
/* global self, Worker, JSClass, JSObject, JSDispatchQueue, JSWorkerBasedDispatchQueue, JSBundle */
'use strict';

(function(){

JSClass("JSWorkerBasedDispatchQueue", JSDispatchQueue, {

    nextJobID: 1,
    callbacksByJobID: null,

    init: function(){
        this.callbacksByJobID = {};
        this.startWorker();
    },

    startWorker: function(){
    },

    sendWorkerMessage: function(message){
    },

    close: function(){
    },

    enqueue: function(jobClass, args, successCallback, errorCallback, target){
        var jobID = this.nextJobID++;
        this.callbacksByJobID[jobID] = {success: successCallback, error: errorCallback, target: target};
        this.sendWorkerMessage([MessageTypes.enqueue, jobID, jobClass.className, args]);
    },

    receiveWorkerMessage: function(message){
        var type = message[0];
        switch (type){
            case MessageTypes.jobComplete:
                var jobID = message[1];
                var status = message[2];
                var callbackArgs = message[3] || [];
                var callback = this.callbacksByJobID[jobID];
                if (callback){
                    delete this.callbacksByJobID[jobID];
                    if (status === JobStatus.success){
                        callback.success.apply(callback.target, callbackArgs);
                    }else{
                        callback.error.apply(callback.target, callbackArgs);
                    }
                }
                break;
        }
    },

});

JSClass("JSWorkerBasedDispatchQueueWorker", JSObject, {

    jobQueue: null,

    init: function(){
        this.jobQueue = [];
        this.completeJobBound = this.completeJob.bind(this);
        this.environmentInit();
    },

    environmentInit: function(){
    },

    sendQueueMessage: function(message){
    },

    receiveQueueMessage: function(message){
        var type = message[0];
        switch (type){
            case MessageTypes.enqueue:
                this.jobQueue.push(message.slice(1));
                if (this.jobQueue.length === 1){
                    this.work();
                }
                break;
        }
    },

    work: function(){
        if (this.jobQueue.length === 0){
            return;
        }
        this.workJob.apply(this, this.jobQueue[0]);
    },

    workJob: function(jobID, jobClassName, jobArguments){
        try{
            var jobClass = JSClass.FromName(jobClassName);
            var job = jobClass.initWithArguments(jobArguments);
            job.run(this.completeJobBound);
        }catch (err){
            this.errorJob(err);
        }
    },

    errorJob: function(err){
        this._postJobCompleteMessage(JobStatus.error, [err.message]);
    },

    completeJob: function(){
        this._postJobCompleteMessage(JobStatus.success, Array.prototype.slice.call(arguments, 0));
    },

    _postJobCompleteMessage: function(status, args){
        var jobID = this.jobQueue[0][0];
        this.sendQueueMessage([MessageTypes.jobComplete, jobID, status, args]);
        this.jobQueue.shift();
        this.work();
    },

    close: function(){
    }

});

var MessageTypes = {
    enqueue: 0,
    jobComplete: 1
};

var JobStatus = {
    success: 0,
    error: 1
};

})();