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

// #import "SKJobStore.js"
// jshint node: true
'use strict';

var logger = JSLog("serverkit", "redis");

JSClass("SKRedisJobStore", SKJobStore, {

    url: null,
    redis: null,

    initWithURL: function(url, redis){
        if (redis === undefined){
            try{
                redis = require('redis');
            }catch (e){
                throw new Error("Cannot create a redis job store because redis is not installed.  Add 'redis' as a package dependency.");
            }
        }
        SKRedisJobStore.$super.init.call(this);
        this.url = url;
        this.redis = redis;
    },

    connected: false,

    open: function(completion){
        logger.info("Redis client connecting to %{public}:%d...", this.url.host, this.url.port || 6379);
        this.client = this.redis.createClient({url: this.url.encodedString});
        var queue = this;
        var errorHandler = function(error){
            logger.info("Failed to open Redis connection: %{error}", error);
            completion(false);
            if (queue.closeCallback){
                var fn = queue.closeCallback;
                queue.closeCallback = null;
                queue.close(fn);
            }else{
                queue.client.quit();
            }
            queue.client = null;
        };
        var readyHandler = function(){
            logger.info("Redis client connected");
            queue.connected = true;
            queue.client.off("error", errorHandler);
            queue.client.on("error", queue.handleError.bind(queue));
            completion.call(true);
            if (queue.closeCallback){
                var fn = queue.closeCallback;
                queue.closeCallback = null;
                queue.close(fn);
            }
        };
        this.client.on("error", errorHandler);
        this.client.on("ready", readyHandler);
    },

    closeCallback: null,

    close: function(completion){
        this.cleanupWatchClientQueue();
        if (this.client !== null){
            if (this.connected){
                logger.info("Redis client closing");
                this.client.quit(function(){
                    logger.info("Redis client closed");
                    completion();
                });
            }else{
                this.closeCallback = completion;
            }
        }else{
            completion();
        }
    },

    handleError: function(e){
        logger.error(e);
    },

    client: null,

    enqueue: function(queueID, job, completion){
        var client = this.client;
        var json = null;
        try{
            json = JSON.stringify(job);
        }catch (e){
            logger.error("Failed to serialize job: %{error}", e);
            JSRunLoop.main.schedule(completion, undefined, false);
            return;
        }
        try{
            client.set(job.id, json, function(error, result){
                if (error !== null){
                    logger.error("Failed to call set: %{error}", error);
                    completion(false);
                    return;
                }
                try{
                    // TODO: priority
                    client.lpush(queueID, job.id, function(error, result){
                        if (error !== null){
                            logger.error("Failed to queue job: %{error}", error);
                            completion(false);
                            return;
                        }
                        completion(true);
                    });
                }catch (e){
                    logger.error("Failed to call lpush: %{error}", e);
                    completion(false);
                }
            });
        }catch (e){
            logger.error("Failed to call set: %{error}", e);
            JSRunLoop.main.schedule(completion, undefined, false);
            return;
        }
    },

    dequeue: function(queueID, completion){
        var client = this.client;
        try{
            client.lmove(queueID, queueID + "/running", "LEFT", "RIGHT", function(error, result){
                if (error !== null){
                    logger.error("Failed to dequeue job: %{error}", error);
                    completion(null);
                    return;
                }
                var id = result;
                try{
                    client.get(id, function(error, json){
                        if (error !== null){
                            logger.log("Failed to get job: %{error}", error);
                            completion(null);
                            return;
                        }
                        var dictionary = null;
                        try{
                            dictionary = JSON.parse(json);
                        }catch (e){
                            logger.log("Failed to parse json: %{error}", error);
                            completion(null);
                            return;
                        }
                        completion(dictionary);
                    });
                }catch (e){
                    logger.error("Failed to call get: %{error}", e);
                    completion(null);
                }
            });
        }catch (e){
            logger.error("Failed to call lmove: %{error}", e);
            JSRunLoop.main.schedule(completion, undefined, null);
            return;
        }
    },

    complete: function(queueID, job, completion){
        var client = this.client;
        try{
            client.lrem(queueID + "/running", 0, job.id, function(error, result){
                if (error !== null){
                    logger.error("Failed to to remove running job: %{error}", error);
                    completion(false);
                    return;
                }
                try{
                    client.del(job.id, function(error, result){
                        if (error !== null){
                            logger.error("Failed to to delete job: %{error}", error);
                            completion(true); // go ahead and report success
                            return;
                        }
                        completion(true);
                    });
                }catch (e){
                    logger.error("Failed to call del: %{error}", e);
                    JSRunLoop.main.schedule(completion, undefined, false);
                }
            });
        }catch (e){
            logger.error("Failed to call lrem: %{error}", e);
            JSRunLoop.main.schedule(completion, undefined, false);
        }
    }

});