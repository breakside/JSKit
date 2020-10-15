// #import "DBPersistentObjectStore.js"
// #import "DBID.js"
// jshint node: true
'use strict';

var logger = JSLog("service", "mongodb");

JSClass("DBMongoStore", DBPersistentObjectStore, {

    initWithURL: function(url, mongodb){
        if (mongodb === undefined){
            try{
                mongodb = require('mongodb');
            }catch (e){
                throw new Error("Cannot create a mongodb object store because mongodb is not installed.  Add 'mongodb' as a package dependency.");
            }
        }
        var store = this;
        var databaseName = url.pathComponents[1];
        url = url.copy();
        url.path = null;
        this.connectedPromise = new Promise(function(resolve, reject){
            mongodb.MongoClient.connect(url, function(error, client){
                if (error){
                    logger.error(error);
                    reject(error);
                }else{
                    store.client = client;
                    store.database = client.db(databaseName);
                    resolve();
                }
            });
        });
    },

    ready: function(){
        return this.connectedPromise;
    },

    connectedPromise: null,
    client: null,
    database: null,

    object: function(id, completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        try{
            var collection = this.database.collection(DBID.tableForID(id));
            var cursor = collection.find({_id: id});
            cursor.next(function(error, mongoObject){
                if (error){
                    logger.error("Error fetching mongo object: %{error}", error);
                    completion.call(target, null);
                }else{
                    if (mongoObject === null){
                        completion.call(target, null);
                    }else{
                        var object = JSCopy(mongoObject);
                        object.id = object._id;
                        delete object._id;
                        completion.call(target, object);
                    }
                }
            });
        }catch (e){
            logger.error("Failed to get mongo object: %{error}", e);
            completion.call(target, null);
        }
        return completion.promise;
    },

    save: function(object, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        try{
            var collection = this.database.collection(DBID.tableForID(object.id));
            var mongoObject = JSCopy(object);
            mongoObject._id = object.id;
            delete object.id;
            collection.replaceOne({_id: mongoObject._id}, mongoObject, {upsert: true}, function(error){
                if (error){
                    logger.error("Error saving mongo object: %{error}", error);
                    completion.call(target, false);
                }else{
                    completion.call(target, true);
                }
            });
        }catch (e){
            logger.error("Failed to save mongo object: %{error}", e);
            completion.call(target, false);
        }
        return completion.promise;
    },

    delete: function(id, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        try{
            var collection = this.database.collection(DBID.tableForID(id));
            collection.deleteOne({_id: id}, {}, function(error){
                if (error){
                    logger.error("Error deleting mongo object: %{error}", error);
                    completion.call(target, false);
                }else{
                    completion.call(target, true);
                }
            });
        }catch (e){
            logger.error("Failed to delete mongo object: %{error}", e);
            completion.call(target, false);
        }
        return completion.promise;
    }

});