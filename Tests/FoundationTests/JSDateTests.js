// #import Foundation
// #import TestKit
'use strict';

JSClass("JSDateTests", TKTestSuite, {

    testInitWithTimeIntervalSince1970: function(){
        var date = JSDate.initWithTimeIntervalSince1970(0);
        TKAssertEquals(date.timeIntervalSince1970, 0);

        date = JSDate.initWithTimeIntervalSince1970(123456);
        TKAssertEquals(date.timeIntervalSince1970, 123456);

        date = JSDate.initWithTimeIntervalSince1970(-123456);
        TKAssertEquals(date.timeIntervalSince1970, -123456);

        date = JSDate.initWithTimeIntervalSince1970(123456.789);
        TKAssertEquals(date.timeIntervalSince1970, 123456.789);

        date = JSDate.initWithTimeIntervalSince1970(-123456.789);
        TKAssertEquals(date.timeIntervalSince1970, -123456.789);
    },

    testInitWithTimeIntervalSinceNow: function(){
        var now = Date.now() / 1000;
        var date = JSDate.initWithTimeIntervalSinceNow(0);
        TKAssertFloatEquals(date.timeIntervalSince1970, now);

        now = Date.now() / 1000;
        date = JSDate.initWithTimeIntervalSinceNow(12345);
        TKAssertFloatEquals(date.timeIntervalSince1970, now + 12345);

        now = Date.now() / 1000;
        date = JSDate.initWithTimeIntervalSinceNow(-12345);
        TKAssertFloatEquals(date.timeIntervalSince1970, now - 12345);

        now = Date.now() / 1000;
        date = JSDate.initWithTimeIntervalSinceNow(12345.678);
        TKAssertFloatEquals(date.timeIntervalSince1970, now + 12345.678);

        now = Date.now() / 1000;
        date = JSDate.initWithTimeIntervalSinceNow(-12345.678);
        TKAssertFloatEquals(date.timeIntervalSince1970, now - 12345.678);
    },

    testIsEqual: function(){
        var d1 = JSDate.initWithTimeIntervalSince1970(123456);
        var d2 = JSDate.initWithTimeIntervalSince1970(123456);
        TKAssertObjectEquals(d1, d2);

        d1 = JSDate.initWithTimeIntervalSince1970(123456);
        d2 = JSDate.initWithTimeIntervalSince1970(123456.001);
        TKAssertObjectNotEquals(d1, d2);

        d1 = JSDate.initWithTimeIntervalSince1970(123456);
        d2 = JSDate.initWithTimeIntervalSince1970(123456.0009);
        TKAssertObjectEquals(d1, d2);
    },

    testCompare: function(){
        var d1 = JSDate.initWithTimeIntervalSince1970(123456);
        var d2 = JSDate.initWithTimeIntervalSince1970(123456);
        TKAssertEquals(d1.compare(d2), 0);

        d1 = JSDate.initWithTimeIntervalSince1970(123456);
        d2 = JSDate.initWithTimeIntervalSince1970(123456.001);
        TKAssertLessThan(d1.compare(d2), 0);
        TKAssertGreaterThan(d2.compare(d1), 0);
    },

    testAddingTimeInterval: function(){
        var date = JSDate.initWithTimeIntervalSince1970(123456);
        date = date.addingTimeInterval(123);
        TKAssertEquals(date.timeIntervalSince1970, 123579);
        date = JSDate.initWithTimeIntervalSince1970(123456);
        date = date.addingTimeInterval(-123);
        TKAssertEquals(date.timeIntervalSince1970, 123333);
    }

});