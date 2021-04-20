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
// #import "DBID.js"
// #import "DBObjectChange.js"
// jshint node: true
'use strict';

var logger = JSLog("service", "mongodb");

JSClass("DBMongoStore", DBObjectStore, {

    connectionURL: null,
    databaseName: null,
    mongodb: null,
    tlsCertificateName: null,

    initWithURL: function(url, mongodb){
        if (mongodb === undefined){
            try{
                mongodb = require('mongodb');
            }catch (e){
                throw new Error("Cannot create a mongodb object store because mongodb is not installed.  Add 'mongodb' as a package dependency.");
            }
        }
        this.mongodb = mongodb;
        this.databaseName = url.pathComponents[1];
        url = url.copy();
        url.path = null;
        this.tlsCertificateName = url.query.get("ssl_ca_certs", null);
        if (this.tlsCertificateName !== null){
            url.query.unset("ssl_ca_certs");
        }else{
            this.tlsCertificateName = url.query.get("tlsCertificateKeyFile", null);
            url.query.unset("tlsCertificateKeyFile");
        }
        this.connectionURL = url;
    },

    open: function(completion){
        var mongodb = this.mongodb;
        var store = this;
        var options = {
            useUnifiedTopology: true
        };
        var promise = Promise.resolve();
        if (this.tlsCertificateName !== null){
            var bundle = JSBundle.initWithIdentifier("io.breakside.JSKit.DBKit");
            switch (this.tlsCertificateName){
                case "rds-combined-ca-bundle.pem":
                    promise = promise.then(function(){
                        return bundle.fileForResourceName(store.tlsCertificateName).readData();
                    }).then(function(data){
                        options.sslValidate = true;
                        options.sslCA = [data.stringByDecodingUTF8()];
                    });
                    break;
                default:
                    throw new Error("Unknown CA %s".sprintf(store.tlsCertificateName));
            }
        }

        promise.then(function(){
            store.client = new mongodb.MongoClient(store.connectionURL.encodedString, options);
            logger.info("MongoDB client connecting to %{public}:%d...", store.connectionURL.host, store.connectionURL.port);
            store.client.connect(function(error, client){
                if (error){
                    store.client = null;
                    logger.error("Failed to open MongoDB connection: %{error}", error);
                    completion(false);
                }else{
                    store.database = client.db(store.databaseName);
                    logger.info("MongoDB client connected to database: %{public}", store.databaseName);
                    completion(true);
                }
                if (store.closeCallback){
                    var fn = store.closeCallback;
                    store.closeCallback = null;
                    store.close(fn);
                }
            });
        }, function(error){
            logger.error(error);
            completion(false);
        });
    },

    closeCallback: null,

    close: function(completion){
        if (this.client !== null){
            if (this.database !== null){
                logger.info("MongoDB client closing");
                this.client.close();
                logger.info("MongoDB client closed");
                completion();
            }else{
                this.closeCallback = completion;
            }
        }else{
            completion();
        }
    },

    client: null,
    database: null,

    object: function(id, completion){
        try{
            var collection = this.database.collection(id.dbidPrefix);
            var cursor = collection.find({_id: id});
            cursor.next(function(error, mongoObject){
                if (error){
                    logger.error("Error fetching mongo object: %{error}", error);
                    completion(null);
                }else{
                    if (mongoObject === null){
                        completion(null);
                    }else{
                        var object = JSCopy(mongoObject);
                        object.id = mongoObject._id;
                        delete object._id;
                        completion(object);
                    }
                }
            });
        }catch (e){
            logger.error("Failed to get mongo object: %{error}", e);
            completion(null);
        }
    },

    save: function(object, completion){
        try{
            var collection = this.database.collection(object.id.dbidPrefix);
            var mongoObject = JSCopy(object);
            mongoObject._id = object.id;
            delete mongoObject.id;
            collection.replaceOne({_id: mongoObject._id}, mongoObject, {upsert: true}, function(error){
                if (error){
                    logger.error("Error saving mongo object: %{error}", error);
                    completion(false);
                }else{
                    completion(true);
                }
            });
        }catch (e){
            logger.error("Failed to save mongo object: %{error}", e);
            completion(false);
        }
    },

    delete: function(id, completion){
        try{
            var collection = this.database.collection(id.dbidPrefix);
            collection.deleteOne({_id: id}, {}, function(error){
                if (error){
                    logger.error("Error deleting mongo object: %{error}", error);
                    completion(false);
                }else{
                    completion(true);
                }
            });
        }catch (e){
            logger.error("Failed to delete mongo object: %{error}", e);
            completion(false);
        }
    },

    exclusiveSave: function(id, change, completion){
        var maxRetires = 30;
        var waitInterval = JSTimeInterval.milliseconds(20);
        var retires = 0;
        var store = this;
        var db = this.database;
        var collection = this.database.collection(id.dbidPrefix);
        var lock = UUID();
        var inserted = false;
        var unlock = function(completion){
            var query = {_id: id, _dbkitlock: lock};
            var update = {$unset: {_dbkitlock: ""}};
            try{
                if (inserted){
                    collection.deleteOne(query, {}, function(error){
                        completion();
                    });
                }else{
                    collection.updateOne(query, {}, function(error){
                        completion();
                    });
                }
            }catch (e){
                logger.error("Error unlocking object: %{error}", e);
                completion();
            }
        };
        var tryLock = function(){
            var query = {_id: id, _dbkitlock: { $exists: false }};
            var update = {$set: {_dbkitlock: lock}};
            var options = {upsert: true};
            try{
                db.updateOne(query, update, options, function(error, result){
                    if (!error && result.matchedCount === 1){
                        inserted = result.upsertedCount === 1;
                        store.object(id, function(obj){
                            if (inserted){
                                obj = null;
                            }
                            try{
                                change(obj, function(obj){
                                    try{
                                        var mongoObject = JSCopy(obj);
                                        mongoObject._id = obj.id;
                                        delete mongoObject.id;
                                        collection.replaceOne({_id: mongoObject._id, _dbkitlock: lock}, mongoObject, {upsert: true}, function(error){
                                            if (error){
                                                logger.error("Error saving mongo object: %{error}", error);
                                                unlock(function(){
                                                    completion(false);
                                                });
                                            }else{
                                                completion(true);
                                            }
                                        });
                                    }catch (e){
                                        logger.error("Error thrown saving mongo object: %{error}", e);
                                        unlock(function(){
                                            completion(false);
                                        });
                                    }
                                });
                            }catch (e){
                                logger.error("Error thrown calling exclusing save change function: %{error}", e);
                                unlock(function(){
                                    completion(false);
                                });
                            }
                        });
                    }else{
                        ++retires;
                        if (retires > maxRetires){
                            completion(false);
                            return;
                        }
                        JSTimeInterval.scheduedTimerWithInterval(waitInterval, tryLock);
                        waitInterval = Math.min(1, waitInterval * 2);
                    }
                });
            }catch (e){
                logger.error("Error thrown locking mongo object: %{error}", e);
                completion(false);
            }
        };
        tryLock();
    },

    saveChange: function(change, completion){
        try{
            var collection = this.database.collection(change.object.id.dbidPrefix);
            var query = {_id: change.object.id, dbkitSecure: {$exists: false}};
            var update = change.mongoStoreUpdate();
            var options = {};
            collection.updateOne(query, update, options, function(error, result){
                if (error){
                    logger.error("Error updating mongo object: %{error}", error);
                    completion(false);
                }else{
                    completion(result.matchedCount === 1);
                }
            });
        }catch (e){
            logger.error("Failed to update mongo object: %{error}", e);
            completion(false);
        }
    }

});

DBObjectChange.definePropertiesFromExtensions({

    mongoStoreUpdate: function(){
        var value = this.object[this.property];
        if (this.operator === DBObjectChange.Operator.set){
            var set = {};
            set[this.property] = value;
            return {
                $set: set
            };
        }else if (this.operator === DBObjectChange.Operator.increment){
            var inc = {};
            inc[this.property] = 1;
            return {
                $inc: inc
            };
        }else if (this.operator === DBObjectChange.Operator.insert){
            var push = {};
            push[this.property] = value[this.index];
            return {
                $push: push
            };
        }else if (this.operator === DBObjectChange.Operator.delete){
            var pull = {};
            pull[this.property] = value[this.index];
            return {
                $pull: pull
            };
        }else{
            throw new Error("Unsupported change operator: %s".sprintf(this.operator));
        }
    }

});