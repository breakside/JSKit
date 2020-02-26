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

// #import TestKit
// #import Foundation
'use strict';

JSClass("JSNotificationCenterTests", TKTestSuite, {

    testNamedNotification: function(){
        var center = JSNotificationCenter.init();
        var calledCount = 0;
        center.addObserver("test", null, function(notification){
            ++calledCount;
        });
        TKAssertExactEquals(calledCount, 0);
        center.post("test", center);
        TKAssertExactEquals(calledCount, 1);
        center.post("test", center);
        TKAssertExactEquals(calledCount, 2);
    },

    testUserInfo: function(){
        var center = JSNotificationCenter.init();
        var calledCount = 0;
        var userInfo = {a: 1};
        center.addObserver("test", null, function(notification){
            ++calledCount;
            TKAssertExactEquals(notification.userInfo, userInfo);
        });
        TKAssertExactEquals(calledCount, 0);
        center.post("test", center, userInfo);
        TKAssertExactEquals(calledCount, 1);
    },

    testNamedNotificationSpecficSender: function(){
        var center = JSNotificationCenter.init();
        var calledCounts = {any: 0, suite: 0, center: 0};
        center.addObserver("test", null, function(notification){
            ++calledCounts.any;
        });
        center.addObserver("test", this, function(notification){
            ++calledCounts.suite;
        });
        center.addObserver("test", center, function(notification){
            ++calledCounts.center;
        });
        TKAssertExactEquals(calledCounts.any, 0);
        TKAssertExactEquals(calledCounts.suite, 0);
        TKAssertExactEquals(calledCounts.center, 0);
        center.post("test", center);
        TKAssertExactEquals(calledCounts.any, 1);
        TKAssertExactEquals(calledCounts.suite, 0);
        TKAssertExactEquals(calledCounts.center, 1);
        center.post("test", center);
        TKAssertExactEquals(calledCounts.any, 2);
        TKAssertExactEquals(calledCounts.suite, 0);
        TKAssertExactEquals(calledCounts.center, 2);
        center.post("test", this);
        TKAssertExactEquals(calledCounts.any, 3);
        TKAssertExactEquals(calledCounts.suite, 1);
        TKAssertExactEquals(calledCounts.center, 2);
        center.post("test", {});
        TKAssertExactEquals(calledCounts.any, 4);
        TKAssertExactEquals(calledCounts.suite, 1);
        TKAssertExactEquals(calledCounts.center, 2);
    },

    testRemoveObserver: function(){
        var center = JSNotificationCenter.init();
        var calledCounts = {any: 0, suite: 0, center: 0};
        center.addObserver("test", null, function(notification){
            ++calledCounts.any;
        });
        center.addObserver("test", this, function(notification){
            ++calledCounts.suite;
        });
        var id = center.addObserver("test", center, function(notification){
            ++calledCounts.center;
        });
        TKAssertExactEquals(calledCounts.any, 0);
        TKAssertExactEquals(calledCounts.suite, 0);
        TKAssertExactEquals(calledCounts.center, 0);
        center.post("test", center);
        TKAssertExactEquals(calledCounts.any, 1);
        TKAssertExactEquals(calledCounts.suite, 0);
        TKAssertExactEquals(calledCounts.center, 1);
        center.removeObserver("test", id);
        center.post("test", center);
        TKAssertExactEquals(calledCounts.any, 2);
        TKAssertExactEquals(calledCounts.suite, 0);
        TKAssertExactEquals(calledCounts.center, 1);
        center.post("test", this);
        TKAssertExactEquals(calledCounts.any, 3);
        TKAssertExactEquals(calledCounts.suite, 1);
        TKAssertExactEquals(calledCounts.center, 1);
        center.post("test", {});
        TKAssertExactEquals(calledCounts.any, 4);
        TKAssertExactEquals(calledCounts.suite, 1);
        TKAssertExactEquals(calledCounts.center, 1);
    }

});