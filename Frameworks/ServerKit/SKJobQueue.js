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
/* global SKRedisJobQueue, SKAMQPJobQueue, SKMemoryJobQueue, SKFileJobQueue */
// jshint esversion: 8
"use strict";

(function(){

var logger = JSLog("serverkit", "jobqueue");

JSProtocol("SKJobQueueConsumer", JSProtocol, {
    jobQueueCanDequeue: function(jobQueue){}
});

JSClass("SKJobQueue", JSObject, {

    initWithURL: function(url, fileManager, service){
        fileManager = fileManager || JSFileManager.shared;
        if (fileManager.isFileURL(url)){
            return SKFileJobQueue.initWithURL(url, fileManager);
        }else if (url.scheme === "redis"){
            return SKRedisJobQueue.initWithURL(url, service);
        }else if (url.scheme === "amqp" || url.scheme === "amqps"){
            return SKAMQPJobQueue.initWithURL(url, service);
        }else if (url.scheme === "memory"){
            return SKMemoryJobQueue.init();
        }
        throw new Error("SKJobQueue.initWithURL() unknown scheme: %s".sprintf(url.scheme));
    },

    initInMemory: function(){
        return SKMemoryJobQueue.init();
    },

    open: async function(){
    },

    close: async function(){
        this._consumer = null;
    },

    consumer: JSDynamicProperty("_consumer", null),

    consume: async function(consumer){
        this._consumer = consumer;
    },

    notifyConsumer: function(){
        if (this._consumer !== null && this._consumer.jobQueueCanDequeue){
            this._consumer.jobQueueCanDequeue(this);
        }
    },

    enqueueDictionary: async function(dictionary){
    },

    dequeueDictionary: async function(){
    },

    dictionaryForJob: function(job){
        var dictionary = {
            id: job.id,
            priority: job.priority,
            className: job.$class.className,
        };
        job.encodeToDictionary(dictionary);
        return dictionary;
    },

    enqueue: async function(job){
        if (job.id === null){
            job.id = "job_" + JSSHA1Hash((new UUID()).bytes).hexStringRepresentation();
        }
        var dictionary = this.dictionaryForJob(job);
        await this.enqueueDictionary(dictionary);
        logger.log("%{public} enqueued to %{public}", job.toString(), this.toString());
    },

    dequeue: async function(){
        var dictionary = await this.dequeueDictionary();
        if (dictionary === null){
            return null;
        }
        var jobClass = SKJob.subclassesByName[dictionary.className];
        var job = null;
        if (!jobClass){
            logger.warn("Unable to create job %{public}.  Class not found: %{public}", dictionary.id, dictionary.className);
            return null;
        }
        job = jobClass.initFromDictionary(dictionary);
        job.id = dictionary.id;
        job.priority = dictionary.priority;
        logger.log("%{public} dequeued from %{public}", job.toString(), this.toString());
        return job;
    },

    complete: async function(job, error){
    }

});

})();