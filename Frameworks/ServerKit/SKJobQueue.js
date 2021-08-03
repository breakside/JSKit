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
// #import "SKJob.js"
// #import "SKJobStore.js"
"use strict";

(function(){

var logger = JSLog("serverkit", "jobqueue");

JSClass("SKJobQueue", JSObject, {

    initWithJobStore: function(store, name){
        this.store = store;
        this.name = name;
        this.id = "jobqueue_" + JSSHA1Hash(name.utf8());
    },

    name: null,
    worker: null,
    store: null,
    maximumFailureCount: 5,

    open: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        this.store.open(function(success){
            completion.call(target, success);
        });
        return completion.promise;
    },

    close: function(completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        this.store.close(function(){
            completion.call(target);
        });
        return completion.promise;
    },

    enqueue: function(job, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        if (job.id === null){
            job.id = "job_" + JSSHA1Hash((new UUID()).bytes);
        }
        var dictionary = {
            id: job.id,
            priority: job.priority,
            failureCount: job.failureCount,
            className: job.$class.className,
            errors: JSCopy(job.errors)
        };
        job.encodeToDictionary(dictionary);
        this.store.enqueue(this.id, dictionary, function(success){
            if (success){
                logger.log("%{pubic} enqueued to %{public} (%{public})", job.toString(), this.name, this.id);
            }else{
                logger.log("%{pubic} failed enqueue to %{public} (%{public})", job.toString(), this.name, this.id);
            }
            completion.call(target, success);
        });
        return completion.promise;
    },

    dequeue: function(completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        this.store.dequeue(this.id, function(dictionary){
            if (dictionary === null){
                completion.call(target, null);
                return;
            }
            var jobClass = SKJob.subclassesByName[dictionary.className];
            var job = null;
            if (jobClass){
                job = jobClass.initFromDictionary(dictionary);
                job.id = dictionary.id;
                job.priority = dictionary.priority;
                job.failureCount = dictionary.failureCount;
                job.errors = JSCopy(dictionary.errors);
                logger.log("%{public} dequeued from %{public} (%{public})", job.toString(), this.name, this.id);
                completion.call(target, job);
            }else{
                logger.warn("Unable to create job %{public}.  Class not found: %{public}", dictionary.id, dictionary.className);
            }
        });
        return completion.promise;
    },

    dequeueJobDictionary: function(completion){
        completion(null);
    },

    fail: function(job, completion, target){
    },

    notifyWorker: function(){
        if (this.worker !== null){
            this.worker.setNeedsWork();
        }
    }

});

})();