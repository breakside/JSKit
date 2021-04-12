// Copyright 2020 Breakside Inc.
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

// #import "DBObjectStore.js"
// jshint node: true
'use strict';

var logger = JSLog("service", "redis");

JSClass("DBRedisStore", DBObjectStore, {

    url: null,
    redis: null,

    initWithURL: function(url, redis){
        if (redis === undefined){
            try{
                redis = require('redis');
            }catch (e){
                throw new Error("Cannot create a redis object store because redis is not installed.  Add 'redis' as a package dependency.");
            }
        }
        this.url = url;
        this.redis = redis;
    },

    connected: false,

    open: function(completion){
        logger.info("Redis client connecting to %{public}:%d...", this.url.host, this.url.port);
        this.client = this.redis.createClient({url: this.url.encodedString});
        var store = this;
        var errorHandler = function(error){
            logger.info("Failed to open Redis connection: %{error}", error);
            completion(false);
            if (store.closeCallback){
                var fn = store.closeCallback;
                store.closeCallback = null;
                store.close(fn);
            }else{
                store.client.quit();
            }
            store.client = null;
        };
        var readyHandler = function(){
            logger.info("Redis client connected");
            store.connected = true;
            store.client.off("error", errorHandler);
            store.client.on("error", store.handleError.bind(store));
            completion(true);
            if (store.closeCallback){
                var fn = store.closeCallback;
                store.closeCallback = null;
                store.close(fn);
            }
        };
        this.client.on("error", errorHandler);
        this.client.on("ready", readyHandler);
    },

    closeCallback: null,

    close: function(completion){
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

    initWithClient: function(client){
        this.client = client;
    },

    handleError: function(e){
        logger.error(e);
    },

    client: null,

    object: function(id, completion){
        var client = this.client;
        try{
            client.get(id, function(error, json){
                if (error !== null){
                    logger.log("Failed to get redis object: %{error}", error);
                    completion(null);
                    return;
                }
                var object = null;
                try{
                    object = JSON.parse(json);
                }catch (e){
                    logger.log("Failed to parse json from redis: %{error}", error);
                    completion(null);
                    return;
                }
                completion(object);
            });
        }catch (e){
            logger.error("Failure calling redis get: %{error}", e);
            JSRunLoop.main.schedule(completion, undefined, null);
        }
    },

    save: function(object, completion){
        this.saveExpiring(object, 0, completion);
    },

    saveExpiring: function(object, lifetimeInterval, completion){
        try{
            var json = null;
            try{
                json = JSON.stringify(object);
            }catch (e){
                logger.error("Failed to serialize object for redis: %{error}", e);
                JSRunLoop.main.schedule(completion, undefined, false);
                return;
            }
            var args = [object.id, json];
            if (lifetimeInterval > 0){
                args.push("EX");
                args.push(lifetimeInterval);
            }
            this.client.set(args, function(error, result){
                if (error !== null){
                    logger.log("Failed to save to redis: %{error}", error);
                    completion(false);
                    return;
                }
                completion(true);
            });
        }catch (e){
            logger.error("Failure calling redis set: %{error}", e);
            JSRunLoop.main.schedule(completion, undefined, false);
        }
    },

    delete: function(id, completion){
        this._delete(id, completion);
    },

    _delete: function(key, completion){
        try{
            this.client.del(key, function(error, result){
                if (error !== null){
                    completion(false);
                    return;
                }
                completion(true);
            });
        }catch (e){
            logger.error("Failure calling redis del: %{error}", e);
            JSRunLoop.main.schedule(completion, undefined, false);
        }
    },

    incrementExpiring: function(id, lifetimeInterval, completion){
        try{
            var client = this.client;
            client.incr(id, function(error, result){
                if (error !== null){
                    logger.error("Error calling redis incr on key: %{error}", error);
                    completion(null);
                    return;
                }
                try{
                    var incrResult = result;
                    client.expire(id, lifetimeInterval, function(error, result){
                        if (error !== null){
                            logger.error("Error calling redis expire on increment key: %{error}", error);
                            try{
                                client.del(id, function(error, result){
                                    if (error !== null){
                                        logger.error("Error calling redis del on key: %{error}", error);
                                    }
                                    completion(null);
                                });
                            }catch (e){
                                logger.error("Failure calling redis del on increment key: %{error}", error);
                                completion(null);
                            }
                        }else{
                            completion(incrResult);
                        }
                    });
                }catch (e){
                    logger.error("Failure calling redis expire: %{error}", e);
                    try{
                        client.del(id, function(error, result){
                            if (error !== null){
                                logger.error("Error calling redis del on key: %{error}", error);
                            }
                            completion(null);
                        });
                    }catch (e){
                        logger.error("Failure calling redis del on increment key: %{error}", error);
                        completion(null);
                    }
                }
            });
        }catch (e){
            logger.error("Failure calling redis incr: %{error}", e);
            JSRunLoop.main.schedule(completion, undefined, null);
        }
    },

    saveChange: function(id, change, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var maxRetires = 30;
        var waitInterval = JSTimeInterval.milliseconds(20);
        var retires = 0;
        var store = this;
        var client = this.client;
        var trySave = function(){
            client.watch(id, function(error){
                if (error !== null){
                    logger.error("Failure calling redis watch: %{error}", error);
                    completion.call(target, null);
                    return;
                }
                store.object(id, function(obj){
                    obj = change(obj);
                    var multi = client.multi();
                    var transactionStore = DBRedisStore.initWithClient(multi);
                    transactionStore.save(obj, function(success){});
                    multi.exec(function(error, results){
                        if (error !== null){
                            completion.call(target, null);
                            return;
                        }
                        if (results === null){
                            ++retires;
                            if (retires > maxRetires){
                                completion.call(target, null);
                                return;
                            }
                            JSTimeInterval.scheduedTimerWithInterval(waitInterval, trySave);
                            waitInterval = Math.min(1, waitInterval * 2);
                            return;
                        }
                        completion.call(target, obj);
                    });
                });
            });
        };
        trySave();
        return completion.proimise;
    }

});