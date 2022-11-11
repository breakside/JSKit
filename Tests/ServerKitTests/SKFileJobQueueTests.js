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

// #import ServerKit
// #import TestKit
// jshint esversion: 8
/* global SKFileJobQueue, SKJob */
"use strict";

JSClass("SKFileJobQueueTests", TKTestSuite, {

    requiredEnvironment: "node",

    fileManager: null,
    queue: null,

    implicitWaitInterval: JSTimeInterval.hours(1),

    setup: async function(){
        this.fileManager = JSFileManager.initWithIdentifier("io.breakside.JSKit.ServerKit.SKFileJobQueueTests");
        await this.fileManager.open();
        this.queue = SKFileJobQueue.initWithURL(this.fileManager.temporaryDirectoryURL.appendingPathComponent("queue1"), this.fileManager);
        await this.queue.open();
    },

    teardown: async function(){
        if (this.queue !== null){
            await this.queue.close();
        }
        this.queue = null;
        await this.fileManager.destroy();
        this.fileManager = null;
    },

    testEnqueue: async function(){
        var job = SKFileJobQueueTestsJob.initWithFields("one", 2);
        TKAssertNull(job.id);
        await this.queue.enqueue(job);
        TKAssertType(job.id, "string");
        TKAssertEquals(job.id.substr(0, 4), "job_");
        TKAssertEquals(job.id.length, 44);
    },

    // Test disabled because linux no longer supports recursive fs.watch
    // file queue is only itended for local dev work anyway
    _testConsume: async function(){
        var queue = this.queue;
        var job = SKFileJobQueueTestsJob.initWithFields("one", 2);
        job.priority = SKJob.Priority.low;
        await queue.enqueue(job);

        var consume;
        var ready = new Promise(function(resolve, reject){ consume = resolve; });
        var consumed = ready.then(function(){
            return queue.dequeue();
        }).then(function(job2){
            TKAssertNotNull(job2);
            TKAssertInstance(job2, SKFileJobQueueTestsJob);
            TKAssertNotExactEquals(job, job2);
            TKAssertEquals(job2.id, job.id);
            TKAssertEquals(job2.priority, SKJob.Priority.low);
            TKAssertExactEquals(job2.field1, "one");
            TKAssertExactEquals(job2.field2, 2);
            return queue.complete(job2, null);
        }).then(function(){
            return queue.dequeue();
        }).then(function(job3){
            TKAssertNull(job3);
        });

        var consumer = {
            jobQueueCanDequeue: function(queue2){
                TKAssertExactEquals(queue2, queue);
                consume();
            }
        };

        try{
            await queue.consume(consumer);
            await consumed;
        }finally{
            await queue.close();
        }
    }

});

JSClass("SKFileJobQueueTestsJob", SKJob, {

    field1: null,
    field2: null,

    initWithFields: function(field1, field2){
        this.field1 = field1;
        this.field2 = field2;
    },

    initFromDictionary: function(dictionary){
        this.field1 = dictionary.field1;
        this.field2 = dictionary.field2;
    },

    encodeToDictionary: function(dictionary){
        dictionary.field1 = this.field1;
        dictionary.field2 = this.field2;
    }
});