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
    }

});