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

// #import ServerKit
// #import TestKit
/* global SKJobQueue */
"use strict";

JSClass("SKJobQueueTests", TKTestSuite, {

    requiredEnvironment: "node",

    testInitWithURL: function(){
        var url = JSURL.initWithString("memory:");
        var queue = SKJobQueue.initWithURL(url);
        TKAssertNotNull(queue);

        url = JSURL.initWithString("memory://");
        queue = SKJobQueue.initWithURL(url);
        TKAssertNotNull(queue);

        url = JSURL.initWithString("redis://host/queueName");
        var redis = {};
        queue = SKJobQueue.initWithURL(url, null, redis);
        TKAssertNotNull(queue);

        url = JSURL.initWithString("amqp://host/queueName");
        var amqp = {};
        queue = SKJobQueue.initWithURL(url, null, amqp);
        TKAssertNotNull(queue);

        url = JSURL.initWithString("mongodb://host/queueName");
        var mongodb = {};
        TKAssertThrows(function(){
            queue = SKJobQueue.initWithURL(url, null, mongodb);  
        });

        var fileManager = JSFileManager.initWithIdentifier("io.breakside.JSKit.ServerKit.SKJobQueueTests");
        var expectation = TKExpectation.init();
        expectation.call(fileManager.open, fileManager, function(status){
            TKAssertExactEquals(status, JSFileManager.State.success);
            var url = fileManager.temporaryDirectoryURL.appendingPathComponent("queue1");
            var queue = SKJobQueue.initWithURL(url, fileManager);
            TKAssertNotNull(queue);
        });
        this.wait(expectation, 1.0);
    }

});