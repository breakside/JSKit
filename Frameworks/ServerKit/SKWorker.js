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
"use strict";

JSClass("SKWorker", JSObject, {

    initWithJobQueue: function(jobQueue){
        this.jobQueue = jobQueue;
        this.jobQueue.worker = this;
    },

    jobQueue: null,

    start: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        if (this.jobQueue === null){
            JSRunLoop.main.schedule(completion, target, false);
        }else{
            this.jobQueue.open(function(success){
                completion.call(target, success);
            }, this);
        }
        return completion.promise;
    },

    stop: function(completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        if (this.jobQueue === null){
            JSRunLoop.main.schedule(completion, target);
        }else{
            this.jobQueue.close(function(){
                completion.call(target);
            }, this);
        }
        return completion.promise;
    },

    _needsWork: false,

    setNeedsWork: function(){
        if (!this._needsWork){
            this._needsWork = true;
            this.scheduleWork();
        }
    },

    _isWorking: false,
    _isWorkScheduled: false,

    scheduleWork: function(){
        if (this._isWorking){
            return;
        }
        if (!this._isWorkScheduled){
            this._isWorkScheduled = true;
            JSRunLoop.main.schedule(this.work, this);
        }
    },

    work: function(){
        this._isWorkScheduled = false;
        if (this._isWorking){
            return;
        }
        if (this.jobQueue === null){
            return;
        }
        this._needsWork = false;
        this._isWorking = true;
        this.jobQueue.dequeue(function(job){
            if (job === null){
                this.completeJob(job, null);
            }else{
                try{
                    var worker = this;
                    var promise = job.run(function(error){
                        worker.completeJob(job, error || null);
                    });
                    if (promise instanceof Promise){
                        promise.then(function(){
                            worker.completeJob(job, null);
                        }, function(error){
                            worker.completeJob(job, error);
                        });
                    }
                }catch (e){
                    this.completeJob(job, e);
                }
            }
        }, this);
    },

    completeJob: function(job, error){
        this._isWorking = false;
        if (this._needsWork){
            this.scheduleWork();
        }
        if (job !== null){
            if (error !== null){
                if (job.errors === null){
                    job.errors = [];
                }
                job.errors.push({
                    message: error.toString(),
                    stack: error.stack
                });
                this.jobQueue.enqueue(job, function(success){
                    if (!success){
                        // job run failed, re-enqueue failed
                        // what can we do to save this job?
                    }
                }, this);
            }
        }
    }

});