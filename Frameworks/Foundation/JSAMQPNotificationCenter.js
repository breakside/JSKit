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

// #import "JSLog.js"
// #import "JSDistributedNotificationCenter.js"
// #import "JSTimer.js"
// jshint node: true
"use strict";

(function(){

var crypto = require("crypto");
var logger = JSLog("foundation", "amqp-nc");

JSClass("JSAMQPNotificationCenter", JSDistributedNotificationCenter, {

    url: null,
    amqp: null,
    uniqueID: null,
    connection: null,
    channel: null,
    exchangeName: null,
    queueName: null,

    initWithURL: function(url, identifier, amqp){
        if (amqp === undefined){
            try{
                amqp = require('amqplib/callback_api');
            }catch (e){
                throw new Error("amqplib not installed");
            }
        }
        JSAMQPNotificationCenter.$super.init.call(this);
        this.url = url;
        this.identifier = identifier;
        this.amqp = amqp;
        this.uniqueID = JSData.initWithNodeBuffer(crypto.randomBytes(8)).base64URLStringRepresentation();
        this.exchangeName = "JSNC.%s".sprintf(this.identifier);
        this.queueName = "%s.%s".sprintf(this.exchangeName, this.uniqueID);
        this._observersByID = {};
        this._observersByRoutingKey = {};
        this.connectionCloseHandler = this.handleConnectionClose.bind(this);
        this.connectionErrorHandler = this.handleConnectionError.bind(this);
        this.channelCloseHandler = this.handleChannelClose.bind(this);
        this.channelErrorHandler = this.handleChannelError.bind(this);
    },

    open: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        var notificationCenter = this;
        logger.info("Opening AMQP connection to %{public}:%d...", this.url.host, this.url.port || 5672);
        this.amqp.connect(this.url.encodedString, function(error, connection){
            if (error){
                logger.error("Error connecting to AMQP: %{error}", error);
                completion.call(target, false);
                return;
            }
            logger.info("AMQP connection open");
            var close = function(){
                connection.close(function(error){
                    if (error){
                        logger.error("Error closing AMQP connection: %{error}", error);
                    }
                    completion.call(target, false);
                });
            };
            connection.createChannel(function(error, channel){
                if (error){
                    logger.error("Error creating AMQP channel: %{error}", error);
                    close();
                    return;
                }
                logger.info("AMQP channel created");
                channel.assertExchange(notificationCenter.exchangeName, "topic", {durable: false, autoDelete: false}, function(error){
                    if (error){
                        logger.error("Error asserting AMQP exchange: %{error}", error);
                        close();
                        return;
                    }
                    logger.info("AMQP exchange ready");
                    channel.assertQueue(notificationCenter.queueName, {exclusive: true}, function(error){
                        if (error){
                            logger.error("Error asserting AMQP queue: %{error}", error);
                            close();
                            return;
                        }
                        logger.info("AMQP queue ready");
                        channel.consume(notificationCenter.queueName, notificationCenter.receiveMessage.bind(notificationCenter), {}, function(error){
                            if (error){
                                logger.error("Error creating AMQP consumer: %{error}", error);
                                close();
                                return;
                            }
                            logger.info("AMQP consumer ready");
                            notificationCenter.connection = connection;
                            notificationCenter.channel = channel;
                            notificationCenter.addEventListeners();
                            completion.call(target, true); 
                        });
                    });
                });
            });
        });
        return completion.promise;
    },

    close: function(completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        if (this.connection){
            this.removeEventListeners();
            var connection = this.connection;
            this.connection = null;
            this.channel = null;
            connection.close(function(error){
                if (error){
                    logger.error("Error closing AMQP connection: %{error}", error);
                }
                completion.call(target);
            });
        }else{
            completion.call(target);
        }
        return completion.promise;
    },

    addEventListeners: function(){
        this.connection.on("error", this.connectionErrorHandler);
        this.connection.on("close", this.connectionCloseHandler);
        this.channel.on("error", this.channelErrorHandler);
        this.channel.on("close", this.channelCloseHandler);
    },

    removeEventListeners: function(){
        this.connection.off("error", this.connectionErrorHandler);
        this.connection.off("close", this.connectionCloseHandler);
        this.channel.off("error", this.channelErrorHandler);
        this.channel.off("close", this.channelCloseHandler);
    },

    handleConnectionError: function(error){
        logger.error("AMQP onnection error: %{error}", error);
    },

    handleChannelError: function(error){
        logger.error("AMQP channel error: %{error}", error);
    },

    handleConnectionClose: function(){
        logger.warn("AMQP connection closed");
    },

    handleChannelClose: function(){
        logger.warn("AMQP channel closed, crashing...");
        this.removeEventListeners();
        this.channel = null;
        this.connection = null;
        throw new Error("AMQP channel closed");
    },

    // reconnectAttempts: 0,
    // maximumReconnectAttempts: 3,
    // reconnectInterval: 0.1,
    //
    // reconnect: function(){
    //     var interval = this.reconnectInterval;
    //     var attempt = function(){
    //         if (this.reconnectAttempts < this.maximumReconnectAttempts){
    //             ++this.reconnectAttempts;
    //             logger.info("AMQP reconnect attempt %d", this.reconnectAttempts);
    //             this.open(function(success){
    //                 if (success){
    //                     // TODO: re-bind listeners
    //                     // TODO: post queued notifications
    //                 }else{
    //                     JSTimer.scheduledTimerWithInterval(interval, attempt, this);
    //                     interval *= 2;
    //                 }
    //             }, this);
    //         }else{
    //             logger.error("AMQP reconnect attempts exhausted");
    //             throw new Error("AMQP connection failed");
    //         }
    //     };
    //     attempt.call(this);
    // },

    postNotification: function(notification){
        var obj = {name: notification.name, userInfo: notification.userInfo};
        var json = JSON.stringify(obj);
        var data = json.utf8();
        var message = data.nodeBuffer();
        var routingKey = notification.sender || nullRoutingKey;
        this.channel.publish(this.exchangeName, routingKey, message);
    },

    _observersByRoutingKey: null,
    _observersByID: null,

    addObserver: function(name, sender, callback, target){
        var observerID = this.generateObserverID();
        var routingKey = sender || nullRoutingKey;
        this._observersByID[observerID] = {
            id: observerID,
            sender: sender,
            callback: callback,
            target: target
        };
        if (!this._observersByRoutingKey[routingKey]){
            this._observersByRoutingKey[routingKey] = {};
            this.channel.bindQueue(this.queueName, this.exchangeName, routingKey, {}, function(error){
                if (error){
                    logger.error("AMQP bindQueue failed: %{error}", error);
                }
            });
        }
        if (!this._observersByRoutingKey[routingKey][name]){
            this._observersByRoutingKey[routingKey][name] = [];
        }
        this._observersByRoutingKey[routingKey][name].push(observerID);
        return observerID;
    },

    removeObserver: function(name, observerID){
        var observer = this._observersByID[observerID];
        if (observer){
            delete this._observersByID[observerID];
            var routingKey = observer.sender || nullRoutingKey;
            var observersByName = this._observersByRoutingKey[routingKey];
            var observers = observersByName[name];
            for (var i = observers.length - 1; i >= 0; --i){
                if (observers[i] === observerID){
                    observers.splice(i, 1);
                    break;
                }
            }
            if (observers.length === 0){
                delete observersByName[name];
            }
            var isEmpty = true;
            for (var n in observersByName){
                isEmpty = false;
                break;
            }
            if (isEmpty){
                delete this._observersByRoutingKey[routingKey];
                this.channel.unbindQueue(this.queueName, this.exchangeName, routingKey, {}, function(error){
                    if (error){
                        logger.error("AMQP unbindQueue failed: %{error}", error);
                    }
                });
            }
        }
    },

    receiveMessage: function(message){
        if (message === null){
            // we've been canceled by the sever
            logger.info("AMQP server canceled consumer");
            return;
        }
        var data = JSData.initWithNodeBuffer(message.content);
        var json = data.stringByDecodingUTF8();
        var obj = JSON.parse(json);
        var sender;
        if (message.fields.routingKey === nullRoutingKey){
            sender = null;
        }else{
            sender = message.fields.routingKey;
        }
        var observersByName = this._observersByRoutingKey[message.fields.routingKey];
        var notification = JSNotification.initWithName(obj.name, sender, obj.userInfo);
        var observer;
        var i, l;
        var observerIDs;
        var observers = [];
        var name;
        if (observersByName){
            for (name in observersByName){
                if (name === notification.name){
                    observerIDs = observersByName[name];
                    for (i = 0, l = observerIDs.length; i < l; ++i){
                        observers.push(this._observersByID[observerIDs[i]]);
                    }
                }
            }
        }
        if (sender !== null){
            observersByName = this._observersByRoutingKey[nullRoutingKey];
            if (observersByName){
                for (name in observersByName){
                    if (name === notification.name){
                        observerIDs = observersByName[name];
                        for (i = 0, l = observerIDs.length; i < l; ++i){
                            observers.push(this._observersByID[observerIDs[i]]);
                        }
                    }
                }
            }
        }
        observers.sort(compareObserversByID);
        for (i = 0, l = observers.length; i < l; ++i){
            observer = observers[i];
            observer.callback.call(observer.target, notification);
        }
    },

});

var compareObserversByID = function(a, b){
    return a.id - b.id;
};

var nullRoutingKey = "__null__";

})();