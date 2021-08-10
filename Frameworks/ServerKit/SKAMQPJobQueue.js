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

// #import Foundation
// #import "SKJobQueue.js"
// jshint node: true, esversion: 8
"use strict";

(function(){

var logger = JSLog("serverkit", "amqp");

JSClass("SKAMQPJobQueue", SKJobQueue, {

    identifier: null,
    url: null,
    amqp: null,
    connection: null,
    channel: null,

    initWithURL: function(url, amqp){
        if (amqp === undefined){
            try{
                amqp = require('amqplib');
            }catch (e){
                throw new Error("amqplib not installed");
            }
        }
        SKAMQPJobQueue.$super.init.call(this);
        this.identifier = url.lastPathComponent;
        this.url = url.removingLastPathComponent();
        this.amqp = amqp;
        this.connectionCloseHandler = this.handleConnectionClose.bind(this);
        this.connectionErrorHandler = this.handleConnectionError.bind(this);
        this.channelCloseHandler = this.handleChannelClose.bind(this);
        this.channelErrorHandler = this.handleChannelError.bind(this);
    },

    openPromise: null,

    open: function(){
        var queue = this;
        if (this.openPromise === null){
            this.openPromise = this._open().catch(function(error){
                queue.openPromise = null;
                return Promise.reject(error);
            });
        }
        return this.openPromise;
    },

    _open: async function(){
        try{
            logger.info("Opening AMQP connection to %{public}:%d...", this.url.host, this.url.port || 5672);
            this.connection = await this.amqp.connect(this.url.encodedString);
            logger.info("AMQP connection open");
            this.channel = await this.connection.createChannel();
            await this.channel.prefetch(1);
            logger.info("AMQP channel created");
            let options = {
                durable: true,
                maxPriority: SKJob.Priority.highest,
                deadLetterExchange: "SKJobQueue.failed"
            };
            await this.channel.assertQueue(this.identifier, options);
            logger.info("AMQP queue ready");
            this.addEventListeners();
        }catch (e){
            logger.error("Error connecting to AMQP: %{error}", e);
            if (this.connection !== null){
                try{
                    await this.connection.close();
                }catch (e){
                    // don't care
                }
                this.connection = null;
                this.channel = null;
                this.queuesByPriority = {};
            }
            throw e;
        }
    },

    close: async function(){
        if (this.openPromise !== null){
            try{
                await this.openPromise;
                this.removeEventListeners();
                await this.connection.close();
            }catch (e){
                // problem opening, nothing to close
            }
            this.openPromise = null;
            this.connection = null;
            this.channel = null;
            this.queuesByPriority = {};
        }
    },

    consume: async function(consumer){
        await SKAMQPJobQueue.$super.consume.call(this, consumer);
        await this.channel.consume(this.identifier, this.receiveMessage.bind(this), {noAck: false});
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

    enqueueDictionary: async function(dictionary){
        var json = JSON.stringify(dictionary);
        var content = json.utf8();
        await this.channel.sendToQueue(this.identifier, content, {persistent: true, priority: dictionary.priority});
    },

    dequeueDictionary: async function(){
        if (this._receivedMessage === null){
            return null;
        }
        var data = JSData.initWithNodeBuffer(this._receivedMessage.content);
        var json = data.stringByDecodingUTF8();
        var dictionary = JSON.parse(json);
        return dictionary;
    },

    _receivedMessage: null,

    receiveMessage: function(message){
        if (message === null){
            // we've been canceled by the sever
            logger.info("AMQP server canceled consumer");
            return;
        }
        this._receivedMessage = message;
        this.consumer.jobQueueCanDequeue(this);
    },

    complete: async function(job, error){
        var message = this._receivedMessage;
        this._receivedMessage = null;
        if (error === null){
            await this.channel.ack(message);
        }else{
            // FIXME: how can we tell the number of retries?
            let requeue = false;
            await this.channel.nack(message, false, requeue);
        }
    },

    toString: function(){
        return "amqp queue %s".sprintf(this.identifier);
    }

});

})();