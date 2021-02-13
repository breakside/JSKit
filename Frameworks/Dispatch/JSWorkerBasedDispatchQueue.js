// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #import "JSDispatchQueue.js"
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

    enqueue: function(jobClass, args, completion, target){
        if (!completion){
            completion = Promise.completion(function(args){
                if (args instanceof Error){
                    throw args;
                }
                if (args === null){
                    return;
                }
                args.shift();
                return args;
            });
        }
        var jobID = this.nextJobID++;
        this.callbacksByJobID[jobID] = {fn: completion, target: target};
        this.sendWorkerMessage([MessageTypes.enqueue, jobID, jobClass.className, args]);
        return completion.promise;
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
                        callbackArgs.unshift(null);
                        callback.fn.apply(callback.target, callbackArgs);
                    }else{
                        callback.fn.call(callback.target, new Error(callbackArgs[0]));
                    }
                }
                break;
        }
    },

    destroy: function(completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        this.close();
        completion.call(target);
        return completion.promise;
    }

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