// #import Foundation
// #import TestKit
'use strict';

JSClass("JSRunLoopTests", TKTestSuite, {

    testInit: function(){
        TKAssertThrows(function(){
            var loop = JSRunLoop.init();
        });
    },

    testSchedule: function(){
        var expectation = TKExpectation.init();
        var called = false;
        var action = function(x){
            TKAssertUndefined(this);
            TKAssertEquals(x, 12);
            called = true;
        };
        expectation.call(JSRunLoop.main.schedule, JSRunLoop.main, action, undefined, 12);
        TKAssert(!called);
        this.wait(expectation, 1.0);
    },

    testMultipleSchedule: function(){
        var expectation = TKExpectation.init();
        var count1 = 0;
        var count2 = 0;
        var action1 = function(){
            ++count1;
            TKAssertEquals(count1, 1);
            TKAssertEquals(count2, 0);
        };
        var action2 = function(){
            ++count2;
            TKAssertEquals(count1, 1);
            TKAssertEquals(count2, 1);
        };
        JSRunLoop.main.schedule(action1);
        expectation.call(JSRunLoop.main.schedule, JSRunLoop.main, action2);
        TKAssertEquals(count1, 0);
        TKAssertEquals(count2, 0);
        this.wait(expectation, 1.0);
    },

});