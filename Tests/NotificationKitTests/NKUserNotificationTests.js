// #import NotificationKit
// #import TestKit
"use strict";

JSClass("NKUserNotificationTests", TKTestSuite, {

    testInitWithTitle: function(){
        var notification = NKUserNotification.initWithTitle("testing");
        TKAssertEquals(notification.title, "testing");
        TKAssertNull(notification.body);
        TKAssertType(notification.identifier, "string");
    }

});