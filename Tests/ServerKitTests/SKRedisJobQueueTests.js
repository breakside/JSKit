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
/* global SKRedisJobQueue, SKJob */
"use strict";

(function(){

var MockRedis = TKMock({
    createClient: ["options"]
});

var MockRedisClient = TKMock({
    on: ["eventType", "handler"],
    off: ["eventType", "handler"],
    set: ["key", "value", "cb"],
    get: ["key", "cb"],
    rpush: ["key", "value", "cb"],
    blpop: ["args", "cb"],
    lrem: ["key", "count", "value", "cb"],
    del: ["key", "cb"],
    multi: [],
    exec: []
});

JSClass("SKRedisJobQueueTests", TKTestSuite, {

    requiredEnvironment: "node",

    queue: null,

    setup: async function(){
    },

    teardown: async function(){
        if (this.queue !== null){
            await this.queue.close();
            this.queue = null;
        }
    },

    testOpen: async function(){
        var redis = new MockRedis();
        var client = new MockRedisClient();
        redis.mock.createClient.results.push({value: client});
        client.mock.on.results.push({});
        client.mock.on.results.push({});
        client.mock.on.results.push({});
        client.mock.off.results.push({});
        client.mock.off.results.push({});
        this.queue = SKRedisJobQueue.initWithURL(JSURL.initWithString("redis://redis.breakside.io:1234/queue1"), redis);
        var openPromise = this.queue.open();
        TKAssertEquals(redis.mock.createClient.calls.length, 1);
        TKAssertType(redis.mock.createClient.calls[0].options.url, "string");
        TKAssertEquals(redis.mock.createClient.calls[0].options.url, "redis://redis.breakside.io:1234/");
        TKAssertEquals(client.mock.on.calls.length, 2);
        TKAssertEquals(client.mock.on.calls[0].eventType, "error");
        TKAssertEquals(client.mock.on.calls[1].eventType, "ready");
        client.mock.on.calls[1].handler();
        await openPromise;
        TKAssertEquals(client.mock.off.calls.length, 2);
        TKAssertEquals(client.mock.off.calls[0].eventType, "error");
        TKAssertEquals(client.mock.off.calls[1].eventType, "ready");
        TKAssertEquals(client.mock.on.calls.length, 3);
        TKAssertEquals(client.mock.on.calls[2].eventType, "error");
    },

    testEnqueue: async function(){
        var redis = new MockRedis();
        var client = new MockRedisClient();
        var multi = new MockRedisClient();
        redis.mock.createClient.results.push({value: client});
        client.mock.on.results.push({});
        client.mock.on.results.push({});
        client.mock.on.results.push({});
        client.mock.off.results.push({});
        client.mock.off.results.push({});
        this.queue = SKRedisJobQueue.initWithURL(JSURL.initWithString("redis://redis.breakside.io:1234/queue1"), redis);
        var openPromise = this.queue.open();
        client.mock.on.calls[1].handler();
        await openPromise;

        client.mock.multi.results.push({value: multi});
        multi.mock.set.results.push({value: multi});
        multi.mock.rpush.results.push({value: multi});
        multi.mock.rpush.results.push({value: multi});
        multi.mock.exec.results.push({callback: {error: null, result: [1,1,1]}});
        var job = SKRedisJobQueueTestsJob.initWithFields("one", 2);
        TKAssertNull(job.id);
        await this.queue.enqueue(job);
        TKAssertType(job.id, "string");
        TKAssertEquals(job.id.substr(0, 4), "job_");
        TKAssertEquals(job.id.length, 44);
        TKAssertEquals(client.mock.multi.calls.length, 1);
        TKAssertEquals(multi.mock.set.calls.length, 1);
        TKAssertEquals(multi.mock.set.calls[0].key, job.id);
        TKAssertType(multi.mock.set.calls[0].value, "string");
        var json = JSON.parse(multi.mock.set.calls[0].value);
        TKAssertEquals(multi.mock.rpush.calls.length, 2);
        TKAssertEquals(multi.mock.rpush.calls[0].key, "queue1");
        TKAssertEquals(multi.mock.rpush.calls[0].value, job.id);
        TKAssertEquals(multi.mock.rpush.calls[1].key, "queue1:3");
        TKAssertEquals(multi.mock.rpush.calls[1].value, job.id);
        TKAssertEquals(multi.mock.exec.calls.length, 1);
        
        multi = new MockRedisClient();
        client.mock.multi.results.push({value: multi});
        multi.mock.set.results.push({value: multi});
        multi.mock.rpush.results.push({value: multi});
        multi.mock.rpush.results.push({value: multi});
        multi.mock.exec.results.push({callback: {error: new Error("testing"), result: null}});
        job = SKRedisJobQueueTestsJob.initWithFields("one", 2);
        await TKAssertPromiseRejected(this.queue.enqueue(job));
        TKAssertEquals(client.mock.multi.calls.length, 2);
        TKAssertEquals(multi.mock.set.calls.length, 1);
        TKAssertEquals(multi.mock.set.calls[0].key, job.id);
        TKAssertType(multi.mock.set.calls[0].value, "string");
        TKAssertEquals(multi.mock.rpush.calls.length, 2);
        TKAssertEquals(multi.mock.rpush.calls[0].key, "queue1");
        TKAssertEquals(multi.mock.rpush.calls[0].value, job.id);
        TKAssertEquals(multi.mock.rpush.calls[1].key, "queue1:3");
        TKAssertEquals(multi.mock.rpush.calls[1].value, job.id);
        TKAssertEquals(multi.mock.exec.calls.length, 1);

        client.mock.multi.results.push({exception: new Error("testing")});
        job = SKRedisJobQueueTestsJob.initWithFields("one", 2);
        await TKAssertPromiseRejected(this.queue.enqueue(job));
        TKAssertEquals(client.mock.multi.calls.length, 3);
    },

    testConsume: async function(){
        var redis = new MockRedis();
        var client = new MockRedisClient();
        var multi = new MockRedisClient();
        redis.mock.createClient.results.push({value: client});
        client.mock.on.results.push({});
        client.mock.on.results.push({});
        client.mock.on.results.push({});
        client.mock.off.results.push({});
        client.mock.off.results.push({});
        this.queue = SKRedisJobQueue.initWithURL(JSURL.initWithString("redis://redis.breakside.io:1234/queue1"), redis);
        var openPromise = this.queue.open();
        client.mock.on.calls[1].handler();
        await openPromise;

        var queue = this.queue;
        client.mock.multi.results.push({value: multi});
        multi.mock.set.results.push({value: multi});
        multi.mock.rpush.results.push({value: multi});
        multi.mock.rpush.results.push({value: multi});
        multi.mock.exec.results.push({callback: {error: null, result: [1,1,1]}});
        var job = SKRedisJobQueueTestsJob.initWithFields("one", 2);
        job.priority = SKJob.Priority.low;
        TKAssertNull(job.id);
        await this.queue.enqueue(job);
        var json = multi.mock.set.calls[0].value;

        var consume;
        var consumer = {
            jobQueueCanDequeue: function(queue2){
                TKAssertExactEquals(queue2, queue);
                consume();
            }
        };

        client.mock.blpop.results.push({callback: {error: null, result: ["queue1:2", job.id]}});
        multi = new MockRedisClient();
        await queue.consume(consumer);
        TKAssertEquals(client.mock.blpop.calls.length, 1);
        TKAssertEquals(client.mock.blpop.calls[0].args.length, 6);
        TKAssertEquals(client.mock.blpop.calls[0].args[0], "queue1:5");
        TKAssertEquals(client.mock.blpop.calls[0].args[1], "queue1:4");
        TKAssertEquals(client.mock.blpop.calls[0].args[2], "queue1:3");
        TKAssertEquals(client.mock.blpop.calls[0].args[3], "queue1:2");
        TKAssertEquals(client.mock.blpop.calls[0].args[4], "queue1:1");
        TKAssertExactEquals(client.mock.blpop.calls[0].args[5], 0);

        client.mock.get.results.push({callback: {error: null, result: json}});

        var ready = new Promise(function(resolve, reject){ consume = resolve; });
        var consumed = ready.then(function(){
            return queue.dequeue();
        }).then(function(job2){
            TKAssertEquals(client.mock.get.calls.length, 1);
            TKAssertEquals(client.mock.get.calls[0].key, job.id);
            TKAssertNotNull(job2);
            TKAssertInstance(job2, SKRedisJobQueueTestsJob);
            TKAssertNotExactEquals(job2, job);
            TKAssertEquals(job2.id, job.id);
            TKAssertEquals(job2.priority, SKJob.Priority.low);
            TKAssertExactEquals(job2.field1, "one");
            TKAssertExactEquals(job2.field2, 2);
            client.mock.multi.results.push({value: multi});
            multi.mock.lrem.results.push({value: multi});
            multi.mock.del.results.push({value: multi});
            multi.mock.exec.results.push({callback: {error: null, result: [1, 1]}});
            client.mock.blpop.results.push({});
            return queue.complete(job2, null);
        }).then(function(){
            TKAssertEquals(client.mock.blpop.calls.length, 2);
            TKAssertEquals(client.mock.blpop.calls[1].args.length, 6);
            TKAssertEquals(client.mock.blpop.calls[1].args[0], "queue1:5");
            TKAssertEquals(client.mock.blpop.calls[1].args[1], "queue1:4");
            TKAssertEquals(client.mock.blpop.calls[1].args[2], "queue1:3");
            TKAssertEquals(client.mock.blpop.calls[1].args[3], "queue1:2");
            TKAssertEquals(client.mock.blpop.calls[1].args[4], "queue1:1");
            TKAssertExactEquals(client.mock.blpop.calls[0].args[5], 0);
            TKAssertEquals(client.mock.multi.calls.length, 2);
            TKAssertEquals(multi.mock.lrem.calls.length, 1);
            TKAssertEquals(multi.mock.lrem.calls[0].key, "queue1");
            TKAssertExactEquals(multi.mock.lrem.calls[0].count, 0);
            TKAssertEquals(multi.mock.lrem.calls[0].value, job.id);
            TKAssertEquals(multi.mock.del.calls.length, 1);
            TKAssertEquals(multi.mock.del.calls[0].key, job.id);
            TKAssertEquals(multi.mock.exec.calls.length, 1);
            return queue.dequeue();
        }).then(function(job3){
            TKAssertNull(job3);
        });

        await consumed;
    }

});

JSClass("SKRedisJobQueueTestsJob", SKJob, {

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

})();