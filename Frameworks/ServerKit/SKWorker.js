// Copyright 2021 Breakside Inc.
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

// #import Foundation
// #feature esversion 8
// jshint esversion: 8
"use strict";

(function(){

var logger = JSLog("serverkit", "jobworker");

JSProtocol("SKWorkerDelegate", JSProtocol, {

    workerWillStartJob: function(worker, job){},
    workerDidCompleteJob: function(worker, job){},
    workerDidCreateContextForJob: function(worker, context, job){}

});

JSClass("SKWorker", JSObject, {

    initWithJobQueue: function(jobQueue){
        this.initWithJobQueues([jobQueue]);
    },

    initWithJobQueues: function(jobQueues){
        this._jobQueues = [];
        this._workQueues = [];
        for (var i = 0, l = jobQueues.length; i < l; ++i){
            this.addJobQueue(jobQueues[i]);
        }
    },

    jobQueues: JSReadOnlyProperty("_jobQueues", null),

    addJobQueue: function(jobQueue){
        this._jobQueues.push(jobQueue);
    },

    delegate: null,

    state: JSReadOnlyProperty("_state", 0),

    start: async function(){
        if (this._state !== SKWorker.State.stopped){
            throw new Error("SKWorker.start() called on worker that is already started");
        }
        this._state = SKWorker.State.starting;
        for (let jobQueue of this._jobQueues){
            await jobQueue.open();
            await jobQueue.consume(this);
        }
        this._state = SKWorker.State.idle;
        if (this._workQueues.length > 0){
            this._scheduleWork();
        }
    },

    stop: async function(){
        if (this._state === SKWorker.State.stopping){
            throw new Error("SKWorker.stop() called on worker this is already stopping");
        }
        if (this._state !== SKWorker.State.stopped){
            this._state = SKWorker.State.stopping;
            this._workQueues = [];
            for (let jobQueue of this._jobQueues){
                await jobQueue.close();
            }
            if (this._isWorkScheduled){
                var worker = this;
                await new Promise(function(resolve){
                    worker._workCompletion = resolve;
                });
            }
            this._state = SKWorker.State.stopped;
        }
    },

    jobQueueCanDequeue: function(jobQueue){
        if (this._state === SKWorker.State.stopping){
            return;
        }
        this._workQueues.push(jobQueue);
        if (this._state === SKWorker.State.idle || this._state === SKWorker.State.working){
            this._scheduleWork();
        }
    },

    _isWorkScheduled: false,

    _scheduleWork: function(){
        if (!this._isWorkScheduled){
            this._isWorkScheduled = true;
            JSRunLoop.main.schedule(this._work, this);
        }
    },

    _workQueues: null,
    _workCompletion: null,

    _work: async function(){
        this._state = SKWorker.State.working;
        while (this._workQueues.length > 0){
            let jobQueue = this._workQueues.shift();
            try{
                let job = await jobQueue.dequeue();
                let error = null;
                if (job !== null){
                    try{
                        if (job.contextClass !== null){
                            job.context = job.contextClass.init();
                            if (this.delegate && this.delegate.workerDidCreateContextForJob){
                                this.delegate.workerDidCreateContextForJob(this, job.context, job);
                            }
                        }
                        if (this.delegate && this.delegate.workerWillStartJob){
                            this.delegate.workerWillStartJob(this, job);
                        }
                        await job.run();
                    }catch (e){
                        error = e;
                        logger.error("Failed to run job %{public}: %{error}", job.id, e);
                    }
                    try{
                        await jobQueue.complete(job, error);
                        if (this.delegate && this.delegate.workerDidCompleteJob){
                            this.delegate.workerDidCompleteJob(this, job);
                        }
                    }catch (e){
                        logger.error("Failed to complete job: %{error}", e);
                    }
                }
            }catch (e){
                logger.error("SKWorker.work() failed: %{error}", e);
            }
        }
        this._isWorkScheduled = false;
        this._state = SKWorker.State.idle;
        if (this._workCompletion !== null){
            this._workCompletion();
        }
    }

});

SKWorker.State = {
    stopped: 0,
    starting: 1,
    idle: 2,
    working: 3,
    stopping: 4
};

})();