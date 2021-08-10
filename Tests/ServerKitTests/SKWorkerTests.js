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
/* global SKJobQueue, SKWorker, SKJob */
"use strict";

JSClass("SKWorkerTests", TKTestSuite, {

    testInitWithJobQueue: function(){
        var queue = SKJobQueue.initInMemory();
        var worker = SKWorker.initWithJobQueue(queue);
        TKAssertEquals(worker.jobQueues.length, 1);
        TKAssertExactEquals(worker.jobQueues[0], queue);
        TKAssertExactEquals(worker.state, SKWorker.State.stopped);
    },

    testInitWithJobQueues: function(){
        var queue1 = SKJobQueue.initInMemory();
        var queue2 = SKJobQueue.initInMemory();
        var queues = [queue1, queue2];
        var worker = SKWorker.initWithJobQueues(queues);
        TKAssertEquals(worker.jobQueues.length, 2);
        TKAssertExactEquals(worker.jobQueues[0], queue1);
        TKAssertExactEquals(worker.jobQueues[1], queue2);
        TKAssertNotExactEquals(worker.jobQueues, queues);
        TKAssertExactEquals(worker.state, SKWorker.State.stopped);
    },

    testAddJobQueue: function(){
        var queue1 = SKJobQueue.initInMemory();
        var queue2 = SKJobQueue.initInMemory();
        var worker = SKWorker.initWithJobQueue(queue1);
        TKAssertEquals(worker.jobQueues.length, 1);
        TKAssertExactEquals(worker.jobQueues[0], queue1);
        worker.addJobQueue(queue2);
        TKAssertEquals(worker.jobQueues.length, 2);
        TKAssertExactEquals(worker.jobQueues[0], queue1);
        TKAssertExactEquals(worker.jobQueues[1], queue2);
    },

    testStart: async function(){
        var queue1 = SKJobQueue.initInMemory();
        var queue2 = SKJobQueue.initInMemory();
        var queues = [queue1, queue2];
        var worker = SKWorker.initWithJobQueues(queues);
        TKAssertExactEquals(worker.state, SKWorker.State.stopped);
        TKAssertExactEquals(queue1.isOpen, false);
        TKAssertExactEquals(queue2.isOpen, false);
        await worker.start();
        TKAssertExactEquals(queue1.isOpen, true);
        TKAssertExactEquals(queue2.isOpen, true);
        TKAssertExactEquals(queue1.consumer, worker);
        TKAssertExactEquals(queue2.consumer, worker);
        TKAssertExactEquals(worker.state, SKWorker.State.idle);
    },

    testStop: async function(){
        var queue1 = SKJobQueue.initInMemory();
        var queue2 = SKJobQueue.initInMemory();
        var queues = [queue1, queue2];
        var worker = SKWorker.initWithJobQueues(queues);
        TKAssertExactEquals(worker.state, SKWorker.State.stopped);
        TKAssertExactEquals(queue1.isOpen, false);
        TKAssertExactEquals(queue2.isOpen, false);
        await worker.start();
        TKAssertExactEquals(queue1.isOpen, true);
        TKAssertExactEquals(queue2.isOpen, true);
        TKAssertExactEquals(queue1.consumer, worker);
        TKAssertExactEquals(queue2.consumer, worker);
        TKAssertExactEquals(worker.state, SKWorker.State.idle);
        await worker.stop();
        TKAssertExactEquals(queue1.isOpen, false);
        TKAssertExactEquals(queue2.isOpen, false);
        TKAssertNull(queue1.consumer);
        TKAssertNull(queue2.consumer);
    },

    testWork: async function(){
        var queue1 = SKJobQueue.initInMemory();
        var queue2 = SKJobQueue.initInMemory();
        var queues = [queue1, queue2];
        var worker = SKWorker.initWithJobQueues(queues);
        worker.delegate = {
            workerWillStartJob: function(worker2, job){
                TKAssertExactEquals(worker2, worker);
                TKAssertExactEquals(history.started.length, history.completed.length);
                history.started.push(job);
            },
            workerDidCompleteJob: function(worker2, job){
                TKAssertExactEquals(worker2, worker);
                history.completed.push(job);
                TKAssertExactEquals(history.started.length, history.completed.length);
            },
            workerDidCreateContextForJob: function(worker2, context, job){
                TKAssertExactEquals(worker2, worker);
                TKAssertNotNull(context);
                TKAssertExactEquals(context, job.context);
                TKAssertExactEquals(history.contexts.length, history.started.length);
                history.contexts.push(job);
            }
        };
        TKAssertExactEquals(worker.state, SKWorker.State.stopped);
        await worker.start();
        TKAssertExactEquals(worker.state, SKWorker.State.idle);
        var history = {contexts: [], started: [], completed: []};
        var job1 = SKWorkerTestsJob.init();
        var job2 = SKWorkerTestsJob.init();
        job2.priority = SKJob.Priority.high;
        var job3 = SKWorkerTestsJob.init();
        var job4 = SKWorkerTestsJob.init();
        await queue1.enqueue(job1);
        await queue1.enqueue(job2);
        TKAssertExactEquals(worker.state, SKWorker.State.idle);
        await this.interval(0.08);
        TKAssertExactEquals(worker.state, SKWorker.State.working);
        TKAssertExactEquals(history.contexts.length, 1);
        TKAssertExactEquals(history.contexts[0].id, job2.id);
        TKAssertExactEquals(history.started.length, 1);
        TKAssertExactEquals(history.started[0].id, job2.id);
        TKAssertExactEquals(history.completed.length, 0);
        await this.interval(0.08);
        TKAssertExactEquals(worker.state, SKWorker.State.working);
        TKAssertExactEquals(history.contexts.length, 2);
        TKAssertExactEquals(history.contexts[0].id, job2.id);
        TKAssertExactEquals(history.contexts[1].id, job1.id);
        TKAssertExactEquals(history.started.length, 2);
        TKAssertExactEquals(history.started[0].id, job2.id);
        TKAssertExactEquals(history.started[1].id, job1.id);
        TKAssertExactEquals(history.completed.length, 1);
        TKAssertExactEquals(history.completed[0].id, job2.id);
        await this.interval(0.08);
        TKAssertExactEquals(worker.state, SKWorker.State.idle);
        TKAssertExactEquals(history.contexts.length, 2);
        TKAssertExactEquals(history.contexts[0].id, job2.id);
        TKAssertExactEquals(history.contexts[1].id, job1.id);
        TKAssertExactEquals(history.started.length, 2);
        TKAssertExactEquals(history.started[0].id, job2.id);
        TKAssertExactEquals(history.started[1].id, job1.id);
        TKAssertExactEquals(history.completed.length, 2);
        TKAssertExactEquals(history.completed[0].id, job2.id);
        TKAssertExactEquals(history.completed[1].id, job1.id);
        await queue2.enqueue(job3);
        await queue1.enqueue(job4);
        TKAssertExactEquals(worker.state, SKWorker.State.idle);
        await this.interval(0.08);
        TKAssertExactEquals(worker.state, SKWorker.State.working);
        TKAssertExactEquals(history.contexts.length, 3);
        TKAssertExactEquals(history.contexts[2].id, job3.id);
        TKAssertExactEquals(history.started.length, 3);
        TKAssertExactEquals(history.started[2].id, job3.id);
        TKAssertExactEquals(history.completed.length, 2);
        await this.interval(0.08);
        TKAssertExactEquals(worker.state, SKWorker.State.working);
        TKAssertExactEquals(history.contexts.length, 4);
        TKAssertExactEquals(history.contexts[2].id, job3.id);
        TKAssertExactEquals(history.contexts[3].id, job4.id);
        TKAssertExactEquals(history.started.length, 4);
        TKAssertExactEquals(history.started[2].id, job3.id);
        TKAssertExactEquals(history.started[3].id, job4.id);
        TKAssertExactEquals(history.completed.length, 3);
        TKAssertExactEquals(history.completed[2].id, job3.id);
        await worker.stop();
        TKAssertExactEquals(worker.state, SKWorker.State.stopped);
        TKAssertExactEquals(history.contexts.length, 4);
        TKAssertExactEquals(history.contexts[2].id, job3.id);
        TKAssertExactEquals(history.contexts[3].id, job4.id);
        TKAssertExactEquals(history.started.length, 4);
        TKAssertExactEquals(history.started[2].id, job3.id);
        TKAssertExactEquals(history.started[3].id, job4.id);
        TKAssertExactEquals(history.completed.length, 4);
        TKAssertExactEquals(history.completed[2].id, job3.id);
        TKAssertExactEquals(history.completed[3].id, job4.id);
    },

    interval: async function(t){
        await new Promise(function(resolve, reject){
            JSTimer.scheduledTimerWithInterval(t, resolve);
        });
    }

});

JSClass("SKWorkerTestsJob", SKJob, {

    run: function(){
        return new Promise(function(resolve, reject){
            JSTimer.scheduledTimerWithInterval(0.1, resolve);
        });
    }

});