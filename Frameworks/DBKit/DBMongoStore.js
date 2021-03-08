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
                        object.id = object._id;
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
            delete object.id;
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
    }

});