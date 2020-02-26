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