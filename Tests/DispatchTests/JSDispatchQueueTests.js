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

// #import Dispatch
// #import TestKit
'use strict';

if (!JSGlobalObject.performance){
    var hooks = require('perf_hooks');
    JSGlobalObject.performance = hooks.performance;
}

JSClass('JSDispatchQueueTests', TKTestSuite, {

    createdQueues: null,

    setup: function(){
        this.createdQueues = [];
    },

    teardown: function(){
        var queue;
        while (this.createdQueues.length > 0){
            queue = this.createdQueues.pop();
            queue.close();
        }
    },

    createQueue: function(){
        var queue = JSDispatchQueue.init();
        this.createdQueues.push(queue);
        return queue;    
    },

    testEnqueue: function(){
        var queue = this.createQueue();
        var expectation = TKExpectation.init();
        var args = {x: 2, y: 3};
        var called = false;
        expectation.call(queue.enqueue, queue, JSDispatchQueueTestsJob, args, function(error, sum){
            TKAssertNull(error);
            called = true;
            TKAssertEquals(sum, 5);
        });
        TKAssert(!called);
        this.wait(expectation, 2.0);
    },

    testEnqueueMultipleReturn: function(){
        var queue = this.createQueue();
        var expectation = TKExpectation.init();
        var args = {x: 2, y: 3};
        var called = false;
        expectation.call(queue.enqueue, queue, JSDispatchQueueTestsJobMultipleReturn, args, function(error, a, b){
            TKAssertNull(error);
            called = true;
            TKAssertEquals(a, 3);
            TKAssertEquals(b, 2);
        });
        TKAssert(!called);
        this.wait(expectation, 2.0);
    },

    testErrorCallback: function(){
        var queue = this.createQueue();
        var expectation = TKExpectation.init();
        var args = {x: 2};
        var called = false;
        expectation.call(queue.enqueue, queue, JSDispatchQueueTestsJob, args, function(error, sum){
            TKAssertNotNull(error);
            called = true;
        });
        TKAssert(!called);
        this.wait(expectation, 2.0);
    },

    testEnqueuePromise: function(){
        var queue = this.createQueue();
        var expectation = TKExpectation.init();
        var args = {x: 2, y: 3};
        var called = false;
        var promise = queue.enqueue(JSDispatchQueueTestsJob, args);
        expectation.call(promise.then, promise, function(sum){
            called = true;
            TKAssertEquals(sum, 5);
        }, function(error){
            TKAssert(true, "Not expecting error");
        });
        TKAssert(!called);
        this.wait(expectation, 2.0);
    },

    testEnqueuePromiseMultipleReturn: function(){
        var queue = this.createQueue();
        var expectation = TKExpectation.init();
        var args = {x: 2, y: 3};
        var called = false;
        var promise = queue.enqueue(JSDispatchQueueTestsJobMultipleReturn, args);
        expectation.call(promise.then, promise, function(values){
            called = true;
            TKAssertEquals(values.length, 2);
            TKAssertEquals(values[0], 3);
            TKAssertEquals(values[1], 2);
        }, function(error){
            TKAssert(true, "Not expecting error");
        });
        TKAssert(!called);
        this.wait(expectation, 2.0);
    },

    testErrorPromise: function(){
        var queue = this.createQueue();
        var expectation = TKExpectation.init();
        var args = {x: 2};
        var called = false;
        var promise = queue.enqueue(JSDispatchQueueTestsJob, args);
        expectation.call(promise.then, promise, function(sum){
            TKAssert(true, "Not expecting success");
        }, function(error){
            called = true;
        });
        TKAssert(!called);
        this.wait(expectation, 2.0);
    },

    testBackground: function(){
        var background = JSDispatchQueue.background;
        TKAssertNotNull(background);
        var background2 = JSDispatchQueue.background;
        TKAssertExactEquals(background, background2);
        var queue = this.createQueue();
        TKAssertThrows(function(){
            JSDispatchQueue.background = queue;
        });
    },

    testSerial: function(){
        var queue = this.createQueue();
        var expectation = TKExpectation.init();
        var args = {x: 2};
        var called1 = false;
        var called2 = false;
        var t0 = this.now();
        var t1start;
        var t2start;
        var t1done;
        var t2done;
        expectation.call(queue.enqueue, queue, JSDispatchQueueTestsJobAsync, args, function(error, t){
            TKAssertNull(error);
            t1start = t;
            t1done = this.now();
            TKAssert(!called2);
            TKAssertGreaterThanOrEquals(t1done - t0, 490); // sometimes the github test timer fires slightly early
            called1 = true;
        }, this);
        expectation.call(queue.enqueue, queue, JSDispatchQueueTestsJobAsync, args, function(error, t){
            TKAssertNull(error);
            t2start = t;
            t2done = this.now();
            TKAssert(called1);
            TKAssertGreaterThanOrEquals(t2start - t1start, 490); // sometimes the github test timer fires slightly early
            TKAssertGreaterThanOrEquals(t2done - t1done, 490); // sometimes the github test timer fires slightly early
            called2 = true;
        }, this);
        TKAssert(!called1);
        TKAssert(!called2);
        this.wait(expectation, 3);
    },

});

JSClass("JSDispatchQueueTestsJob", JSDispatchJob, {

    run: function(complete){
        if (this.args.x === undefined || this.args.y === undefined){
            throw new Error("Arguments not valid");
        }
        complete(this.args.x + this.args.y);
    }

});

JSClass("JSDispatchQueueTestsJobMultipleReturn", JSDispatchJob, {

    run: function(complete){
        if (this.args.x === undefined || this.args.y === undefined){
            throw new Error("Arguments not valid");
        }
        complete(this.args.y, this.args.x);
    }

});

JSClass("JSDispatchQueueTestsJobAsync", JSDispatchJob, {

    run: function(complete){
        var t = performance.now();
        setTimeout(function(){
            complete(t);
        }, 500);
    }

});