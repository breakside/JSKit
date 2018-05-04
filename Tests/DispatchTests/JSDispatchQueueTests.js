// #import "Dispatch/Dispatch.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, TKExpectation, JSDispatchQueue, JSDispatchJob, JSDispatchQueueTestsJob, JSDispatchQueueTestsJobAsync, setTimeout, performance */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
'use strict';

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
        expectation.call(queue.enqueue, queue, JSDispatchQueueTestsJob, args, function(sum){
            called = true;
            TKAssertEquals(sum, 5);
        }, function(error){
            TKAssert(true, "Not expecting error");
        });
        TKAssert(!called);
        this.wait(expectation, 2.0);
    },

    testErrorCallback: function(){
        var queue = this.createQueue();
        var expectation = TKExpectation.init();
        var args = {x: 2};
        var called = false;
        expectation.call(queue.enqueue, queue, JSDispatchQueueTestsJob, args, function(sum){
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
        expectation.call(queue.enqueue, queue, JSDispatchQueueTestsJobAsync, args, function(t){
            t1start = t;
            t1done = this.now();
            TKAssert(!called2);
            TKAssertGreaterThanOrEquals(t1done - t0, 500);
            called1 = true;
        }, function(error){
            TKAssert(true, "Not expecting error");
        }, this);
        expectation.call(queue.enqueue, queue, JSDispatchQueueTestsJobAsync, args, function(t){
            t2start = t;
            t2done = this.now();
            TKAssert(called1);
            TKAssertGreaterThanOrEquals(t2start - t1start, 500);
            TKAssertGreaterThanOrEquals(t2done - t1done, 500);
            called2 = true;
        }, function(error){
            TKAssert(true, "Not expecting error");
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

JSClass("JSDispatchQueueTestsJobAsync", JSDispatchJob, {

    run: function(complete){
        var t = performance.now();
        setTimeout(function(){
            complete(t);
        }, 500);
    }

});