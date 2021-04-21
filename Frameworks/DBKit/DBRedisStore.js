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
// #import "DBObjectChange.js"
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
        logger.info("Redis client connecting to %{public}:%d...", this.url.host, this.url.port || 6379);
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

    watchClientQueue: null,

    dequeueReusableWatchClient: function(){
        if (this.watchClientQueue === null){
            this.watchClientQueue = [];
        }
        if (this.watchClientQueue.length > 0){
            if (this.cleanupWatchClientQueueTimer !== null){
                this.cleanupWatchClientQueueTimer.invalidate();
                this.cleanupWatchClientQueueTimer = null;
            }
            return this.watchClientQueue.shift();
        }
        logger.info("opening watch client to %{public}:%d", this.url.host, this.url.port || 6379);
        return this.redis.createClient({url: this.url.encodedString});
    },

    enqueueReusableWatchClient: function(client){
        if (this.watchClientQueue.length > 0){
            logger.info("closing watch client (queue full) to %{public}:%d", this.url.host, this.url.port || 6379);
            client.quit();
        }else{
            this.watchClientQueue.push(client);
            this.cleanupWatchClientQueueTimer = JSTimer.scheduledTimerWithInterval(JSTimeInterval.minutes(5), this.cleanupWatchClientQueue, this);
        }
    },

    cleanupWatchClientQueueTimer: null,

    cleanupWatchClientQueue: function(){
        if (this.watchClientQueue === null){
            return;
        }
        if (this.cleanupWatchClientQueueTimer !== null){
            this.cleanupWatchClientQueueTimer.invalidate();
            this.cleanupWatchClientQueueTimer = null;
        }
        var client;
        while (this.watchClientQueue.length > 0){
            client = this.watchClientQueue.pop();
            logger.info("closing watch client (cleanup) to %{public}:%d", this.url.host, this.url.port || 6379);
            client.quit();
        }
    },

    exclusiveSave: function(id, change, completion){
        var watchClient = this.dequeueReusableWatchClient();
        var maxRetires = 30;
        var waitInterval = JSTimeInterval.milliseconds(20);
        var retires = 0;
        var store = this;
        var trySave = function(){
            try{
                watchClient.watch(id, function(error){
                    if (error !== null){
                        logger.error("Failure calling redis watch: %{error}", error);
                        watchClient.quit();
                        completion(false);
                        return;
                    }
                    try{
                        watchClient.get(id, function(error, json){
                            if (error !== null){
                                logger.error("Failure calling redis get: %{error}", error);
                                watchClient.quit();
                                completion(false);
                                return;
                            }
                            var object = null;
                            try{
                                object = JSON.parse(json);
                            }catch (e){
                                logger.error("Failure parsing object json: %{error}", error);
                                watchClient.quit();
                                completion(false);
                                return;
                            }
                            try{
                                watchClient.ttl(id, function(error, ttl){
                                    if (error !== null){
                                        logger.error("Failure calling redis ttl: %{error}", error);
                                        watchClient.quit();
                                        completion(false);
                                        return;
                                    }
                                    try{
                                        change(object, function(changedObject){
                                            if (changedObject === null){
                                                watchClient.quit();
                                                completion(false);
                                                return;
                                            }
                                            var changedJSON = null;
                                            try{
                                                changedJSON = JSON.stringify(changedObject);
                                            }catch (e){
                                                logger.error("Failed to serialize object for redis: %{error}", e);
                                                watchClient.quit();
                                                completion(false);
                                                return;
                                            }
                                            var args = [id, changedJSON];
                                            if (ttl > 0){
                                                args.push("EX");
                                                args.push(ttl);
                                            }
                                            try{
                                                watchClient.multi().set(args).exec(function(error, results){
                                                    if (error !== null){
                                                        logger.error("Failure calling redis multi/set/exec: %{error}", error);
                                                        watchClient.quit();
                                                        completion(false);
                                                        return;
                                                    }
                                                    if (results === null){
                                                        // null results means the transaction failed, so it's our signal to retry
                                                        ++retires;
                                                        if (retires > maxRetires){
                                                            store.enqueueReusableWatchClient(watchClient);
                                                            completion(true);
                                                            return;
                                                        }
                                                        JSTimer.scheduledTimerWithInterval(waitInterval, trySave);
                                                        waitInterval = Math.min(1, waitInterval * 2);
                                                        return;
                                                    }
                                                    store.enqueueReusableWatchClient(watchClient);
                                                    completion(true);
                                                });
                                            }catch (e){
                                                logger.error("Error thrown calling redis multi/set/exec: %{error}", e);
                                                watchClient.quit();
                                                completion(false);
                                            }
                                        });
                                    }catch (e){
                                        logger.error("Error thrown calling change function: %{error}", error);
                                        watchClient.quit();
                                        completion(false);
                                    }
                                });
                            }catch (e){
                                logger.error("Error thrown calling redis ttl: %{error}", error);
                                watchClient.quit();
                                completion(false);
                            }
                        });
                    }catch (e){
                        logger.error("Error thrown calling redis get: %{error}", error);
                        watchClient.quit();
                        completion(false);
                    }
                });
            }catch (e){
                logger.error("Error thrown calling redis watch: %{error}", e);
                watchClient.quit();
                completion(false);
            }
        };
        trySave();
    },

    saveChange: function(change, completion){
        try{
            var script = change.redisStoreLuaScript();
            var value = change.object[change.property];
            this.client.eval([script, 1, change.object.id, change.property, value].concat(change.operands), function(error, result){
                if (error !== null){
                    completion(false);
                    return;
                }
                completion(result == "OK");
            });
        }catch (e){
            logger.error("Failed to update redis object: %{error}", e);
            completion(false);
        }
    }

});

DBObjectChange.definePropertiesFromExtensions({

    redisStoreLuaScript: function(){
        var script = function(lines){
            return [
                "local o = cjson.decode(redis.call('get', KEYS[1]))",
                "if o['dbkitSecure'] ~= nil then",
                "  return 'ENC'",
                "end",
            ].join("\n") + lines.join("n") + [
                "local json = cjson.encode(o)",
                // FIXME: empty arrays get encoed as empty dictionaries
                // We could replace {} with [], but that might change string
                // values and might incorrectly change values that are supposed
                // to be empty maps
                "local ttl = redis.call('ttl', KEYS[1])",
                "if ttl >= 0 then",
                "  return redis.call('set', KEYS[1], json, 'EX', ttl)",
                "end",
                "return redis.call('set', KEYS[1], json)"
            ].join("\n");
        };
        if (this.operator === DBObjectChange.Operator.set){
            return script([
                "o[ARGV[1]] = ARGV[2]"
            ]);
        }else if (this.operator === DBObjectChange.Operator.increment){
            return script([
                "o[ARGV[1]] += ARGV[3]"
            ]);
        }else if (this.operator === DBObjectChange.Operator.insert){
            return script([
                "table.insert(o[ARGV[1]], ARGV[3], ARGV[2])"
            ]);
        }else if (this.operator === DBObjectChange.Operator.delete){
            return script([
                "local i = ARGV[3]",
                "local a = o[ARGV[1]]",
                "if a[i] != ARGV[2] then",
                "  i = -1",
                "  for j = 0, #a do",
                "    if a[j] == ARGV[2] then",
                "      i = j",
                "      break",
                "    end",
                "  end",
                "end",
                "if i > 0 then",
                "  table.remove(a, i)",
                "end"
            ]);
        }else{
            throw new Error("Unsupported change operator: %s".sprintf(this.operator));
        }
    }

});