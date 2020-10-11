// #import "DBEphemeralObjectStore.js"
// jshint node: true
'use strict';

var logger = JSLog("service", "redis");

JSClass("DBRedisStore", DBEphemeralObjectStore, {

    initWithURL: function(url, redis){
        if (redis === undefined){
            try{
                redis = require('redis');
            }catch (e){
                throw new Error("Cannot create a redis object store because redis is not installed.  Add 'redis' as a package dependency.");
            }
        }
        this.client = redis.createClient({url: url});
        this.client.on('error', this.handleError.bind(this));
    },

    handleError: function(e){
        logger.error(e);
    },

    client: null,

    object: function(id, completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        var client = this.client;
        client.get(id, function(error, json){
            if (error !== null){
                logger.log("Failed to get redis object: %{error}", error);
                completion.call(target, null);
                return;
            }
            var object = null;
            try{
                object = JSON.parse(json);
            }catch (e){
                logger.log("Failed to parse json from redis: %{error}", error);
                completion.call(target, null);
                return;
            }
            completion.call(target, object);
        });
        return completion.promise;
    },

    save: function(object, completion, target){
        return this.saveExpiring(object, 0, completion, target);
    },

    saveExpiring: function(object, lifetimeInterval, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        var json = null;
        try{
            json = JSON.stringify(object);
        }catch (e){
            logger.error("Failed to serialize object for redis: %{error}", e);
            JSRunLoop.main.schedule(completion, target, false);
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
                completion.call(target, false);
                return;
            }
            completion.call(target, true);
        });
        return completion.promise;
    },

    delete: function(id, completion, target){
        return this._delete(id, completion, target);
    },

    _delete: function(key, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        this.client.del(key, function(error, result){
            if (error !== null){
                completion.call(target, false);
                return;
            }
            completion.call(target, true);
        });
        return completion.promise;
    },

    incrementExpiring: function(id, lifetimeInterval, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var client = this.client;
        client.incr(id, function(error, result){
            if (error !== null){
                completion.call(target, null);
                return;
            }
            if (result === 1){
                client.expire(id, lifetimeInterval, function(error, result){
                    if (error !== null){
                        client.del(id, function(error, result){
                            completion.call(target, null);
                        });
                        return;
                    }
                    completion.call(target, result);
                });
                return;
            }
            completion.call(target, result);
        });
        return completion.promise;
    },

    invalidateIncrementer: function(id, completion, target){
        return this._delete(id, completion, target);
    }

});