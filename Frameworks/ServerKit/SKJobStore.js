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
/* global SKRedisJobStore, SKAMQPJobStore */
"use strict";

JSClass("SKJobStore", JSObject, {

    initWithURL: function(url){
        var store;
        if (url.scheme == "redis"){
            if (JSGlobalObject.SKRedisJobStore){
                store = SKRedisJobStore.initWithURL(url);
            }else{
                throw new Error("Redis job store not supported for this environment");
            }
        }else if (url.scheme == "amqp"){
            if (JSGlobalObject.SKAMQPJobStore){
                store = SKAMQPJobStore.initWithURL(url);
            }else{
                throw new Error("AMQP job store not supported for this environment");
            }
        }else{
            throw new Error("%s job store not supported".sprintf(url.scheme));
        }
        this.initWithJobStore(store);
    },

    open: function(completion){
    },

    close: function(completion){
    },

    enqueue: function(queueID, jobDictionary, completion){
    },

    dequeue: function(queueID, completion){
    }

});