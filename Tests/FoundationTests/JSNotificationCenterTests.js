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