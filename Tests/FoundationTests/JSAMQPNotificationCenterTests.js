// #import Foundation
// #import TestKit
/* global JSAMQPNotificationCenter, Buffer */
"use strict";

(function(){

var MockMethod = function(){
    this.calls = [];
    this.results = [];
};

var MockAMQP = function(){
    this.connectMethod = new MockMethod();
};

MockAMQP.prototype = {
    connect: function(url, callback){
        var result = this.connectMethod.results[this.connectMethod.calls.length];
        if (result.execption){
            throw result.execption;
        }
        this.connectMethod.calls.push({url: url});
        JSRunLoop.main.schedule(callback, undefined, result.error, result.connection);
    }
};

var MockAMQPConnection = function(){
    this.closeMethod = new MockMethod();
    this.createChannelMethod = new MockMethod();
};

MockAMQPConnection.prototype = {

    close: function(callback){
        var result = this.closeMethod.results[this.closeMethod.calls.length];
        if (result.execption){
            throw result.execption;
        }
        this.closeMethod.calls.push({});
        JSRunLoop.main.schedule(callback, undefined, result.error);
    },

    createChannel: function(callback){
        var result = this.createChannelMethod.results[this.createChannelMethod.calls.length];
        if (result.execption){
            throw result.execption;
        }
        this.createChannelMethod.calls.push({});
        JSRunLoop.main.schedule(callback, undefined, result.error, result.channel);
    }

};

var MockAMQPChannel = function(){
    this.assertExchangeMethod = new MockMethod();
    this.assertQueueMethod = new MockMethod();
    this.bindQueueMethod = new MockMethod();
    this.unbindQueueMethod = new MockMethod();
    this.publishMethod = new MockMethod();
    this.consumeMethod = new MockMethod();
};

MockAMQPChannel.prototype = {
    assertExchange: function(name, type, options, callback){
        var result = this.assertExchangeMethod.results[this.assertExchangeMethod.calls.length];
        if (result.execption){
            throw result.execption;
        }
        this.assertExchangeMethod.calls.push({name: name, type: type, options: options});
        JSRunLoop.main.schedule(callback, undefined, result.error, result.ok);
    },

    assertQueue: function(name, options, callback){
        var result = this.assertQueueMethod.results[this.assertQueueMethod.calls.length];
        if (result.execption){
            throw result.execption;
        }
        this.assertQueueMethod.calls.push({name: name, options: options});
        JSRunLoop.main.schedule(callback, undefined, result.error, result.ok);
    },

    bindQueue: function(name, exchange, routingKey, args, callback){
        var result = this.bindQueueMethod.results[this.bindQueueMethod.calls.length];
        if (result.execption){
            throw result.execption;
        }
        this.bindQueueMethod.calls.push({name: name, exchange: exchange, routingKey: routingKey, args: args});
        JSRunLoop.main.schedule(callback, undefined, result.error, result.ok);
    },

    unbindQueue: function(name, exchange, routingKey, args, callback){
        var result = this.unbindQueueMethod.results[this.unbindQueueMethod.calls.length];
        if (result.execption){
            throw result.execption;
        }
        this.unbindQueueMethod.calls.push({name: name, exchange: exchange, routingKey: routingKey, args: args});
        JSRunLoop.main.schedule(callback, undefined, result.error, result.ok);
    },

    consume: function(name, fn, options, callback){
        var result = this.consumeMethod.results[this.consumeMethod.calls.length];
        if (result.execption){
            throw result.execption;
        }
        this.consumeMethod.calls.push({name: name, fn: fn, options: options});
        JSRunLoop.main.schedule(callback, undefined, result.error, result.ok);
    },

    publish: function(exchange, routingKey, message){
        var result = this.publishMethod.results[this.publishMethod.calls.length];
        if (result.execption){
            throw result.execption;
        }
        this.publishMethod.calls.push({exchange: exchange, routingKey: routingKey, message: message});
        return result;
    }
};

JSClass("JSAMQPNotificationCenterTests", TKTestSuite, {

    requiredEnvironment: "node",

    testInitWithURL: function(){
        var amqp = new MockAMQP();
        var url = JSURL.initWithString("amqp://test");
        var center = JSAMQPNotificationCenter.initWithURL(url, "test", amqp);
        TKAssertExactEquals(center.url, url);
        TKAssertExactEquals(center.identifier, "test");
        TKAssertExactEquals(center.amqp, amqp);
        TKAssertType(center.uniqueID, "string");
    },

    testOpen: function(){
        var amqp = new MockAMQP();
        var connection = new MockAMQPConnection();
        var channel = new MockAMQPChannel();
        amqp.connectMethod.results.push({error: null, connection: connection});
        connection.createChannelMethod.results.push({error: null, channel: channel});
        channel.assertExchangeMethod.results.push({error: null});
        channel.assertQueueMethod.results.push({error: null});
        channel.consumeMethod.results.push({error: null});
        var url = JSURL.initWithString("amqp://test");
        var center = JSAMQPNotificationCenter.initWithURL(url, "test", amqp);
        var expectation = TKExpectation.init();
        expectation.call(center.open, center, function(success){
            TKAssert(success);
            TKAssertEquals(amqp.connectMethod.calls.length, 1);
            TKAssertType(amqp.connectMethod.calls[0].url, "string");
            TKAssertEquals(amqp.connectMethod.calls[0].url, "amqp://test");
            TKAssertEquals(connection.createChannelMethod.calls.length, 1);
            TKAssertEquals(channel.assertExchangeMethod.calls.length, 1);
            TKAssertEquals(channel.assertExchangeMethod.calls[0].name, "JSNC.test");
            TKAssertEquals(channel.assertExchangeMethod.calls[0].type, "topic");
            TKAssertExactEquals(channel.assertExchangeMethod.calls[0].options.durable, false);
            TKAssertExactEquals(channel.assertExchangeMethod.calls[0].options.autoDelete, false);
            TKAssertEquals(channel.assertQueueMethod.calls.length, 1);
            TKAssertEquals(channel.assertQueueMethod.calls[0].name, "JSNC.test." + center.uniqueID);
            TKAssertExactEquals(channel.assertQueueMethod.calls[0].options.exclusive, true);
            TKAssertEquals(channel.consumeMethod.calls.length, 1);
            TKAssertEquals(channel.consumeMethod.calls[0].name, "JSNC.test." + center.uniqueID);
            TKAssertEquals(channel.bindQueueMethod.calls.length, 0);
        });
        this.wait(expectation, 1.0);
    },

    testOpenConnectError: function(){
        var amqp = new MockAMQP();
        var connection = new MockAMQPConnection();
        var channel = new MockAMQPChannel();
        amqp.connectMethod.results.push({error: new Error("failed"), connection: connection});
        connection.createChannelMethod.results.push({error: null, channel: channel});
        channel.assertExchangeMethod.results.push({error: null});
        channel.assertQueueMethod.results.push({error: null});
        channel.consumeMethod.results.push({error: null});
        var url = JSURL.initWithString("amqp://test");
        var center = JSAMQPNotificationCenter.initWithURL(url, "test", amqp);
        var expectation = TKExpectation.init();
        expectation.call(center.open, center, function(success){
            TKAssertExactEquals(success, false);
            TKAssertEquals(amqp.connectMethod.calls.length, 1);
            TKAssertEquals(connection.createChannelMethod.calls.length, 0);
            TKAssertEquals(channel.assertExchangeMethod.calls.length, 0);
            TKAssertEquals(channel.assertQueueMethod.calls.length, 0);
            TKAssertEquals(channel.consumeMethod.calls.length, 0);
            TKAssertEquals(channel.bindQueueMethod.calls.length, 0);
        });
        this.wait(expectation, 1.0);
    },

    testOpenCreateChannelError: function(){
        var amqp = new MockAMQP();
        var connection = new MockAMQPConnection();
        var channel = new MockAMQPChannel();
        amqp.connectMethod.results.push({error: null, connection: connection});
        connection.createChannelMethod.results.push({error: new Error("failed"), channel: channel});
        connection.closeMethod.results.push({error: null});
        channel.assertExchangeMethod.results.push({error: null});
        channel.assertQueueMethod.results.push({error: null});
        channel.consumeMethod.results.push({error: null});
        var url = JSURL.initWithString("amqp://test");
        var center = JSAMQPNotificationCenter.initWithURL(url, "test", amqp);
        var expectation = TKExpectation.init();
        expectation.call(center.open, center, function(success){
            TKAssertExactEquals(success, false);
            TKAssertEquals(amqp.connectMethod.calls.length, 1);
            TKAssertEquals(connection.createChannelMethod.calls.length, 1);
            TKAssertEquals(connection.closeMethod.calls.length, 1);
            TKAssertEquals(channel.assertExchangeMethod.calls.length, 0);
            TKAssertEquals(channel.assertQueueMethod.calls.length, 0);
            TKAssertEquals(channel.consumeMethod.calls.length, 0);
            TKAssertEquals(channel.bindQueueMethod.calls.length, 0);
        });
        this.wait(expectation, 1.0);
    },

    testOpenAssertExchangeError: function(){
        var amqp = new MockAMQP();
        var connection = new MockAMQPConnection();
        var channel = new MockAMQPChannel();
        amqp.connectMethod.results.push({error: null, connection: connection});
        connection.createChannelMethod.results.push({error: null, channel: channel});
        connection.closeMethod.results.push({error: null});
        channel.assertExchangeMethod.results.push({error: new Error("failed")});
        channel.assertQueueMethod.results.push({error: null});
        channel.consumeMethod.results.push({error: null});
        var url = JSURL.initWithString("amqp://test");
        var center = JSAMQPNotificationCenter.initWithURL(url, "test", amqp);
        var expectation = TKExpectation.init();
        expectation.call(center.open, center, function(success){
            TKAssertExactEquals(success, false);
            TKAssertEquals(amqp.connectMethod.calls.length, 1);
            TKAssertEquals(connection.createChannelMethod.calls.length, 1);
            TKAssertEquals(connection.closeMethod.calls.length, 1);
            TKAssertEquals(channel.assertExchangeMethod.calls.length, 1);
            TKAssertEquals(channel.assertQueueMethod.calls.length, 0);
            TKAssertEquals(channel.consumeMethod.calls.length, 0);
            TKAssertEquals(channel.bindQueueMethod.calls.length, 0);
        });
        this.wait(expectation, 1.0);
    },

    testOpenAssertQueueError: function(){
        var amqp = new MockAMQP();
        var connection = new MockAMQPConnection();
        var channel = new MockAMQPChannel();
        amqp.connectMethod.results.push({error: null, connection: connection});
        connection.createChannelMethod.results.push({error: null, channel: channel});
        connection.closeMethod.results.push({error: null});
        channel.assertExchangeMethod.results.push({error: null});
        channel.assertQueueMethod.results.push({error: new Error("failed")});
        channel.consumeMethod.results.push({error: null});
        var url = JSURL.initWithString("amqp://test");
        var center = JSAMQPNotificationCenter.initWithURL(url, "test", amqp);
        var expectation = TKExpectation.init();
        expectation.call(center.open, center, function(success){
            TKAssertExactEquals(success, false);
            TKAssertEquals(amqp.connectMethod.calls.length, 1);
            TKAssertEquals(connection.createChannelMethod.calls.length, 1);
            TKAssertEquals(connection.closeMethod.calls.length, 1);
            TKAssertEquals(channel.assertExchangeMethod.calls.length, 1);
            TKAssertEquals(channel.assertQueueMethod.calls.length, 1);
            TKAssertEquals(channel.consumeMethod.calls.length, 0);
            TKAssertEquals(channel.bindQueueMethod.calls.length, 0);
        });
        this.wait(expectation, 1.0);
    },

    testOpenConsumeError: function(){
        var amqp = new MockAMQP();
        var connection = new MockAMQPConnection();
        var channel = new MockAMQPChannel();
        amqp.connectMethod.results.push({error: null, connection: connection});
        connection.createChannelMethod.results.push({error: null, channel: channel});
        connection.closeMethod.results.push({error: null});
        channel.assertExchangeMethod.results.push({error: null});
        channel.assertQueueMethod.results.push({error: null});
        channel.consumeMethod.results.push({error: new Error("failed")});
        var url = JSURL.initWithString("amqp://test");
        var center = JSAMQPNotificationCenter.initWithURL(url, "test", amqp);
        var expectation = TKExpectation.init();
        expectation.call(center.open, center, function(success){
            TKAssertExactEquals(success, false);
            TKAssertEquals(amqp.connectMethod.calls.length, 1);
            TKAssertEquals(connection.createChannelMethod.calls.length, 1);
            TKAssertEquals(connection.closeMethod.calls.length, 1);
            TKAssertEquals(channel.assertExchangeMethod.calls.length, 1);
            TKAssertEquals(channel.assertQueueMethod.calls.length, 1);
            TKAssertEquals(channel.consumeMethod.calls.length, 1);
            TKAssertEquals(channel.bindQueueMethod.calls.length, 0);
        });
        this.wait(expectation, 1.0);
    },

    testOpenConsumeErrorCloseError: function(){
        var amqp = new MockAMQP();
        var connection = new MockAMQPConnection();
        var channel = new MockAMQPChannel();
        amqp.connectMethod.results.push({error: null, connection: connection});
        connection.createChannelMethod.results.push({error: null, channel: channel});
        connection.closeMethod.results.push({error: new Error("failed")});
        channel.assertExchangeMethod.results.push({error: null});
        channel.assertQueueMethod.results.push({error: null});
        channel.consumeMethod.results.push({error: new Error("failed")});
        var url = JSURL.initWithString("amqp://test");
        var center = JSAMQPNotificationCenter.initWithURL(url, "test", amqp);
        var expectation = TKExpectation.init();
        expectation.call(center.open, center, function(success){
            TKAssertExactEquals(success, false);
            TKAssertEquals(amqp.connectMethod.calls.length, 1);
            TKAssertEquals(connection.createChannelMethod.calls.length, 1);
            TKAssertEquals(connection.closeMethod.calls.length, 1);
            TKAssertEquals(channel.assertExchangeMethod.calls.length, 1);
            TKAssertEquals(channel.assertQueueMethod.calls.length, 1);
            TKAssertEquals(channel.consumeMethod.calls.length, 1);
            TKAssertEquals(channel.bindQueueMethod.calls.length, 0);
        });
        this.wait(expectation, 1.0);
    },

    testAddObserver: function(){
        var amqp = new MockAMQP();
        var connection = new MockAMQPConnection();
        var channel = new MockAMQPChannel();
        amqp.connectMethod.results.push({error: null, connection: connection});
        connection.createChannelMethod.results.push({error: null, channel: channel});
        channel.assertExchangeMethod.results.push({error: null});
        channel.assertQueueMethod.results.push({error: null});
        channel.consumeMethod.results.push({error: null});
        channel.bindQueueMethod.results.push({error: null});
        channel.bindQueueMethod.results.push({error: null});
        channel.bindQueueMethod.results.push({error: null});
        var url = JSURL.initWithString("amqp://test");
        var center = JSAMQPNotificationCenter.initWithURL(url, "test", amqp);
        var expectation = TKExpectation.init();
        expectation.call(center.open, center, function(success){
            TKAssert(success);
            center.addObserver("notificationName", "senderName", function(){});
            TKAssertEquals(channel.bindQueueMethod.calls.length, 1);
            TKAssertEquals(channel.bindQueueMethod.calls[0].name, "JSNC.test." + center.uniqueID);
            TKAssertEquals(channel.bindQueueMethod.calls[0].exchange, "JSNC.test");
            TKAssertEquals(channel.bindQueueMethod.calls[0].routingKey, "senderName");
            center.addObserver("otherNotificationName", "senderName", function(){});
            TKAssertEquals(channel.bindQueueMethod.calls.length, 1);
            center.addObserver("notificationName", "otherSenderName", function(){});
            TKAssertEquals(channel.bindQueueMethod.calls.length, 2);
            TKAssertEquals(channel.bindQueueMethod.calls[1].name, "JSNC.test." + center.uniqueID);
            TKAssertEquals(channel.bindQueueMethod.calls[1].exchange, "JSNC.test");
            TKAssertEquals(channel.bindQueueMethod.calls[1].routingKey, "otherSenderName");
            center.addObserver("notificationName", null, function(){});
            TKAssertEquals(channel.bindQueueMethod.calls.length, 3);
            TKAssertEquals(channel.bindQueueMethod.calls[2].name, "JSNC.test." + center.uniqueID);
            TKAssertEquals(channel.bindQueueMethod.calls[2].exchange, "JSNC.test");
            TKAssertEquals(channel.bindQueueMethod.calls[2].routingKey, "__null__");
        });
        this.wait(expectation, 1.0);
    },

    testRemoveObserver: function(){
        var amqp = new MockAMQP();
        var connection = new MockAMQPConnection();
        var channel = new MockAMQPChannel();
        amqp.connectMethod.results.push({error: null, connection: connection});
        connection.createChannelMethod.results.push({error: null, channel: channel});
        channel.assertExchangeMethod.results.push({error: null});
        channel.assertQueueMethod.results.push({error: null});
        channel.consumeMethod.results.push({error: null});
        channel.bindQueueMethod.results.push({error: null});
        channel.bindQueueMethod.results.push({error: null});
        channel.bindQueueMethod.results.push({error: null});
        channel.unbindQueueMethod.results.push({error: null});
        channel.unbindQueueMethod.results.push({error: null});
        channel.unbindQueueMethod.results.push({error: null});
        channel.unbindQueueMethod.results.push({error: null});
        var url = JSURL.initWithString("amqp://test");
        var center = JSAMQPNotificationCenter.initWithURL(url, "test", amqp);
        var expectation = TKExpectation.init();
        expectation.call(center.open, center, function(success){
            TKAssert(success);
            var id1 = center.addObserver("notificationName", "senderName", function(){});
            var id2 = center.addObserver("otherNotificationName", "senderName", function(){});
            var id3 = center.addObserver("notificationName", "otherSenderName", function(){});
            var id4 = center.addObserver("notificationName", null, function(){});
            center.removeObserver("notificationName", id1);
            TKAssertEquals(channel.unbindQueueMethod.calls.length, 0);
            center.removeObserver("otherNotificationName", id2);
            TKAssertEquals(channel.unbindQueueMethod.calls.length, 1);
            TKAssertEquals(channel.bindQueueMethod.calls[0].name, "JSNC.test." + center.uniqueID);
            TKAssertEquals(channel.bindQueueMethod.calls[0].exchange, "JSNC.test");
            TKAssertEquals(channel.bindQueueMethod.calls[0].routingKey, "senderName");
            center.removeObserver("notificationName", id3);
            TKAssertEquals(channel.unbindQueueMethod.calls.length, 2);
            TKAssertEquals(channel.bindQueueMethod.calls[1].name, "JSNC.test." + center.uniqueID);
            TKAssertEquals(channel.bindQueueMethod.calls[1].exchange, "JSNC.test");
            TKAssertEquals(channel.bindQueueMethod.calls[1].routingKey, "otherSenderName");
            center.removeObserver("notificationName", id4);
            TKAssertEquals(channel.unbindQueueMethod.calls.length, 3);
            TKAssertEquals(channel.bindQueueMethod.calls[2].name, "JSNC.test." + center.uniqueID);
            TKAssertEquals(channel.bindQueueMethod.calls[2].exchange, "JSNC.test");
            TKAssertEquals(channel.bindQueueMethod.calls[2].routingKey, "__null__");
        });
        this.wait(expectation, 1.0);
    },

    testPostNotification: function(){
        var amqp = new MockAMQP();
        var connection = new MockAMQPConnection();
        var channel = new MockAMQPChannel();
        amqp.connectMethod.results.push({error: null, connection: connection});
        connection.createChannelMethod.results.push({error: null, channel: channel});
        channel.assertExchangeMethod.results.push({error: null});
        channel.assertQueueMethod.results.push({error: null});
        channel.consumeMethod.results.push({error: null});
        channel.bindQueueMethod.results.push({error: null});
        channel.bindQueueMethod.results.push({error: null});
        channel.bindQueueMethod.results.push({error: null});
        channel.publishMethod.results.push({error: null});
        channel.publishMethod.results.push({error: null});
        var url = JSURL.initWithString("amqp://test");
        var center = JSAMQPNotificationCenter.initWithURL(url, "test", amqp);
        var expectation = TKExpectation.init();
        expectation.call(center.open, center, function(success){
            TKAssert(success);
            center.addObserver("notificationName", "senderName", function(){});
            center.addObserver("otherNotificationName", "senderName", function(){});
            center.addObserver("notificationName", "otherSenderName", function(){});
            center.addObserver("notificationName", null, function(){});

            var notification = JSNotification.initWithName("notificationName", "senderName", null);
            center.postNotification(notification);
            TKAssertEquals(channel.publishMethod.calls.length, 1);
            TKAssertEquals(channel.publishMethod.calls[0].exchange, "JSNC.test");
            TKAssertEquals(channel.publishMethod.calls[0].routingKey, "senderName");
            TKAssertInstance(channel.publishMethod.calls[0].message, Buffer);
            var data = JSData.initWithNodeBuffer(channel.publishMethod.calls[0].message);
            var json = data.stringByDecodingUTF8();
            var message = JSON.parse(json);
            TKAssertEquals(message.name, "notificationName");
            TKAssertNull(message.userInfo);

            notification = JSNotification.initWithName("other", null, {one: 1, two: "2"});
            center.postNotification(notification);
            TKAssertEquals(channel.publishMethod.calls.length, 2);
            TKAssertEquals(channel.publishMethod.calls[1].exchange, "JSNC.test");
            TKAssertEquals(channel.publishMethod.calls[1].routingKey, "__null__");
            TKAssertInstance(channel.publishMethod.calls[1].message, Buffer);
            data = JSData.initWithNodeBuffer(channel.publishMethod.calls[1].message);
            json = data.stringByDecodingUTF8();
            message = JSON.parse(json);
            TKAssertEquals(message.name, "other");
            TKAssertExactEquals(message.userInfo.one, 1);
            TKAssertExactEquals(message.userInfo.two, "2");
        });
        this.wait(expectation, 1.0);
    },

    testReceiveMessage: function(){
        var amqp = new MockAMQP();
        var connection = new MockAMQPConnection();
        var channel = new MockAMQPChannel();
        amqp.connectMethod.results.push({error: null, connection: connection});
        connection.createChannelMethod.results.push({error: null, channel: channel});
        channel.assertExchangeMethod.results.push({error: null});
        channel.assertQueueMethod.results.push({error: null});
        channel.consumeMethod.results.push({error: null});
        channel.bindQueueMethod.results.push({error: null});
        channel.bindQueueMethod.results.push({error: null});
        channel.bindQueueMethod.results.push({error: null});
        channel.unbindQueueMethod.results.push({error: null});
        channel.unbindQueueMethod.results.push({error: null});
        channel.unbindQueueMethod.results.push({error: null});
        var url = JSURL.initWithString("amqp://test");
        var center = JSAMQPNotificationCenter.initWithURL(url, "test", amqp);
        var expectation = TKExpectation.init();
        expectation.call(center.open, center, function(success){
            TKAssert(success);
            var ids = [0,0,0,0];
            var calls = [0,0,0,0];
            ids[0] = center.addObserver("notificationName", "senderName", function(notification){
                calls[0]++;
                TKAssertEquals(notification.name, "notificationName");
                TKAssertEquals(notification.sender, "senderName");
            });
            ids[1] = center.addObserver("otherNotificationName", "senderName", function(notification){
                calls[1]++;
                TKAssertEquals(notification.name, "otherNotificationName");
                TKAssertEquals(notification.sender, "senderName");
                if (calls[1] == 2){
                    TKAssertExactEquals(notification.userInfo.one, 1);
                    TKAssertExactEquals(notification.userInfo.two, "2");
                }
            });
            ids[2] = center.addObserver("notificationName", "otherSenderName", function(notification){
                calls[2]++;
                TKAssertEquals(notification.name, "notificationName");
                TKAssertEquals(notification.sender, "otherSenderName");
            });
            ids[3] = center.addObserver("notificationName", null, function(){
                calls[3]++;
            });

            var message = {
                fields: {
                    routingKey: "senderName"
                },
                content: JSON.stringify({name: "notificationName", userInfo: null}).utf8().nodeBuffer()
            };
            center.receiveMessage(message);
            TKAssertEquals(calls[0], 1);
            TKAssertEquals(calls[1], 0);
            TKAssertEquals(calls[2], 0);
            TKAssertEquals(calls[3], 1);

            message = {
                fields: {
                    routingKey: "__null__"
                },
                content: JSON.stringify({name: "notificationName", userInfo: null}).utf8().nodeBuffer()
            };
            center.receiveMessage(message);
            TKAssertEquals(calls[0], 1);
            TKAssertEquals(calls[1], 0);
            TKAssertEquals(calls[2], 0);
            TKAssertEquals(calls[3], 2);

            center.removeObserver("notificationName", ids[3]);
            message = {
                fields: {
                    routingKey: "senderName"
                },
                content: JSON.stringify({name: "notificationName", userInfo: null}).utf8().nodeBuffer()
            };
            center.receiveMessage(message);
            TKAssertEquals(calls[0], 2);
            TKAssertEquals(calls[1], 0);
            TKAssertEquals(calls[2], 0);
            TKAssertEquals(calls[3], 2);

            message = {
                fields: {
                    routingKey: "otherSenderName"
                },
                content: JSON.stringify({name: "notificationName", userInfo: null}).utf8().nodeBuffer()
            };
            center.receiveMessage(message);
            TKAssertEquals(calls[0], 2);
            TKAssertEquals(calls[1], 0);
            TKAssertEquals(calls[2], 1);
            TKAssertEquals(calls[3], 2);

            message = {
                fields: {
                    routingKey: "senderName"
                },
                content: JSON.stringify({name: "otherNotificationName", userInfo: null}).utf8().nodeBuffer()
            };
            center.receiveMessage(message);
            TKAssertEquals(calls[0], 2);
            TKAssertEquals(calls[1], 1);
            TKAssertEquals(calls[2], 1);
            TKAssertEquals(calls[3], 2);

            center.removeObserver("notificationName", ids[0]);
            message = {
                fields: {
                    routingKey: "senderName"
                },
                content: JSON.stringify({name: "notificationName", userInfo: null}).utf8().nodeBuffer()
            };
            center.receiveMessage(message);
            TKAssertEquals(calls[0], 2);
            TKAssertEquals(calls[1], 1);
            TKAssertEquals(calls[2], 1);
            TKAssertEquals(calls[3], 2);

            message = {
                fields: {
                    routingKey: "senderName"
                },
                content: JSON.stringify({name: "otherNotificationName", userInfo: {one: 1, two: "2"}}).utf8().nodeBuffer()
            };
            center.receiveMessage(message);
            TKAssertEquals(calls[0], 2);
            TKAssertEquals(calls[1], 2);
            TKAssertEquals(calls[2], 1);
            TKAssertEquals(calls[3], 2);
        });
        this.wait(expectation, 1.0);
    },

});

})();