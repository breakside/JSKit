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

// #import "SKJobQueue.js"
// jshint node: true, esversion: 8
'use strict';

var logger = JSLog("serverkit", "redis");

JSClass("SKRedisJobQueue", SKJobQueue, {

    identifier: null,
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
        SKRedisJobQueue.$super.init.call(this);
        this.identifier = url.lastPathComponent;
        this.url = url.removingLastPathComponent();
        this.redis = redis;
    },

    openPromise: null,

    open: function(){
        var queue = this;
        if (this.openPromise === null){
            this.openPromise = new Promise(function(resolve, reject){
                logger.info("Redis client connecting to %{public}:%d...", queue.url.host, queue.url.port || 6379);
                var client = queue.redis.createClient({url: queue.url.encodedString});
                var errorHandler = function(error){
                    logger.info("Failed to open Redis connection: %{error}", error);
                    queue.openPromise = null;
                    client.quit();
                    reject(error);
                };
                var readyHandler = function(){
                    logger.info("Redis client connected");
                    client.off("error", errorHandler);
                    client.off("ready", readyHandler);
                    client.on("error", queue.handleError.bind(queue));
                    queue.client = client;
                    resolve();
                };
                client.on("error", errorHandler);
                client.on("ready", readyHandler);
            });
        }
        return this.openPromise;
    },

    close: async function(completion){
        var queue = this;
        if (this.openPromise !== null){
            try{
                await this.openPromise;
                await new Promise(function(resolve){
                    logger.info("Redis client closing");
                    queue.client.quit(function(){
                        logger.info("Redis client closed");
                        resolve();
                    });
                });
            }catch (e){
                // problem opening, nothing to close
            }
            this.openPromise = null;
            this.client = null;
        }
        await SKRedisJobQueue.$super.close.call(this);
    },

    consume: async function(consumer){
        await SKRedisJobQueue.$super.consume.call(this, consumer);
        this.waitForJob();
    },

    handleError: function(e){
        logger.error("SKRedisJobQueue error: %{error}", e);
    },

    client: null,

    waitForJob: function(){
        if (this.client === null){
            return;
        }
        var queue = this;
        var args = [];
        for (let priority = SKJob.Priority.highest; priority >= SKJob.Priority.lowest; --priority){
            args.push("%s:%d".sprintf(this.identifier, priority));
        }
        args.push(0);
        this.client.blpop(args, function(error, result){
            if (error !== null){
                logger.error("Error waiting for job: %{error}", error);
                queue.waitForJob();
                return;
            }
            if (result === null){
                queue.waitForJob();
                return;
            }
            queue._nextJobID = result[1];
            queue.notifyConsumer();
        });
    },

    enqueueDictionary: async function(dictionary){
        var client = this.client;
        var identifier = this.identifier;
        var queueKey = "%s:%d".sprintf(identifier, dictionary.priority);
        await new Promise(function(resolve, reject){
            var json = JSON.stringify(dictionary);
            client.multi().set(dictionary.id, json).rpush(identifier, dictionary.id).rpush(queueKey, dictionary.id).exec(function(error, results){
                if (error !== null){
                    logger.error("Failed to set+rpush: %{error}", error);
                    reject(error);
                    return;
                }
                resolve();
            });
        });
    },

    _nextJobID: null,

    dequeueDictionary: async function(){
        if (this._nextJobID === null){
            return null;
        }
        var client = this.client;
        var id = this._nextJobID;
        this._nextJobID = null;
        return new Promise(function(resolve, reject){
            client.get(id, function(error, json){
                if (error !== null){
                    logger.log("Failed to get job: %{error}", error);
                    reject(error);
                    return;
                }
                var dictionary = null;
                try{
                    dictionary = JSON.parse(json);
                }catch (e){
                    logger.log("Failed to parse json: %{error}", error);
                    reject(e);
                    return;
                }
                resolve(dictionary);
            });
        });
    },

    complete: async function(job, error){
        var client = this.client;
        var identifier = this.identifier;
        await new Promise(function(resolve, reject){
            var multi = client.multi();
            if (error !== null){
                multi = multi.rpush(identifier + ":failed", job.id);
            }
            multi.lrem(identifier, 0, job.id).del(job.id).exec(function(error, results){
                if (error !== null){
                    logger.error("Failed to to remove running job: %{error}", error);
                    reject(error);
                    return;
                }
                resolve();
            });
        });
        this.waitForJob();
    },

    toString: function(){
        return "redis queue %s".sprintf(this.identifier);
    }

});