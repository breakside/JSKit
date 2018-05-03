// #import "Dispatch/JSDispatchQueue.js"
// #feature window.Worker
/* global self, Worker, JSClass, JSObject, JSDispatchQueue, JSHTMLDispatchQueue, JSBundle */
'use strict';

(function(){

JSClass("JSHTMLDispatchQueue", JSDispatchQueue, {

    worker: null,
    nextJobID: 1,
    callbacksByJobID: null,

    init: function(){
        this.callbacksByJobID = {};
        this.worker = new Worker(JSBundle.mainBundle.info()[JSHTMLDispatchWorkerQueueScriptBundleKey]);
        this.worker.addEventListener('message', this);
    },

    enqueue: function(jobClass, args, successCallback, errorCallback, target){
        var jobID = this.nextJobID++;
        this.callbacksByJobID[jobID] = {success: successCallback, error: errorCallback, target: target};
        this.worker.postMessage([MessageTypes.enqueue, jobID, jobClass.className, args]);
    },

    handleEvent: function(e){
        this[e.type](e);
    },

    message: function(e){
        var type = e.data[0];
        switch (type){
            case MessageTypes.jobComplete:
                var jobID = e.data[1];
                var status = e.data[2];
                var callbackArgs = e.data[3] || [];
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

    close: function(){
        this.worker.terminate();
        this.worker = null;
    }

});

JSClass("JSHTMLDispatchQueueWorker", JSObject, {

    jobQueue: null,

    init: function(){
        this.jobQueue = [];
        this.completeJobBound = this.completeJob.bind(this);
        self.addEventListener('message', this);
    },

    handleEvent: function(e){
        this[e.type](e);
    },

    message: function(e){
        var type = e.data[0];
        switch (type){
            case MessageTypes.enqueue:
                this.jobQueue.push(e.data.slice(1));
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
        self.postMessage([MessageTypes.jobComplete, jobID, status, args]);
        this.jobQueue.shift();
        this.work();
    },

    close: function(){
        self.close();
    }

});

var JSHTMLDispatchWorkerQueueScriptBundleKey = 'JSHTMLDispatchQueueWorkerScript';

var MessageTypes = {
    enqueue: 0,
    jobComplete: 1
};

var JobStatus = {
    success: 0,
    error: 1
};

})();