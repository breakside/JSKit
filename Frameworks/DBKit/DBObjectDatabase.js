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

// #import Foundation
// #import "DBFileStore.js"
// #import "DBRemoteStore.js"
// #import "DBMemoryStore.js"
// #import "DBID.js"
// #import "DBEncryptedObject.js"
// #import "DBStorableClassResolver.js"
/* global DBSecureObjectDatabase, DBRedisStore, DBMongoStore */
'use strict';

(function(){

var logger = JSLog("dbkit", "database");

JSClass("DBObjectDatabase", JSObject, {

    store: null,

    initWithURL: function(url, fileManager){
        fileManager = fileManager || JSFileManager.shared;
        var store;
        if (fileManager.isFileURL(url)){
            store = DBFileStore.initWithURL(url, fileManager);
        }else if (url.scheme == "redis"){
            if (JSGlobalObject.DBRedisStore){
                store = DBRedisStore.initWithURL(url);
            }else{
                throw new Error("Redis object database not supported for this environment");
            }
        }else if (url.scheme == "mongodb"){
            if (JSGlobalObject.DBMongoStore){
                store = DBMongoStore.initWithURL(url);
            }else{
                throw new Error("Mongodb object database not supported for this environment");
            }
        }else{
            store = DBRemoteStore.initWithURL(url);
        }
        this.initWithObjectStore(store);
    },

    initInMemory: function(){
        var store = DBMemoryStore.init();
        this.initWithObjectStore(store);
    },

    initWithObjectStore: function(store){
        this.store = store;
        this.encryptionDefaults = {
            algorithm: SECCipher.Algorithm.aesCBC,
            keyIdentifer: null,
            keyBitLength: null,
        };
        this.storableClassResolver = DBStorableClassResolver.init();
    },

    id: DBID,

    object: function(id, completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        if (!DBID.isValid(id)){
            completion.call(target, null);
        }else{
            var db = this;
            var handler = function(dictionary){
                var storable = dictionary;
                var storableClass = db.storableClassResolver.classForID(id);
                if (dictionary !== null){
                    if (dictionary.dbkitSecure === true){
                        storable = DBEncryptedObject.initFromStorableDictionary(dictionary);
                        storable.id = dictionary.id;
                        storable.objectClass = storableClass;
                        storable.keystore = db.keystore;
                    }else{
                        if (storableClass !== null){
                            storable = storableClass.initFromStorableDictionary(dictionary);
                            storable.id = dictionary.id;
                        }
                    }
                }
                completion.call(target, storable);
            };
            var promise = this.store.object(id, handler);
            if (promise instanceof Promise){
                promise.then(handler);
            }
        }
        return completion.promise;
    },

    objectOfClass: function(id, cls, completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        if (!DBID.isValid(id)){
            completion.call(target, null);
        }else{
            var idClass = this.storableClassResolver.classForID(id);
            if (idClass !== null && idClass.isSubclassOfClass(cls)){
                this.object(id, completion, target);
            }else{
                completion.call(target, null);
            }
        }
        return completion.promise;
    },

    _pepareStorableForSave: function(storable, completion, target){
        if (storable instanceof DBEncryptedObject){
            storable.keystore = this.keystore;
            storable.encrypt(this.encryptionDefaults.algorithm, this.encryptionDefaults.keyIdentifer, this.encryptionDefaults.keyBitLength, function(success){
                if (!success){
                    completion.call(target, null);
                    return;
                }
                var dictionary = {
                    id: storable.id,
                    dbkitSecure: true,
                };
                storable.encodeToStorableDictionary(dictionary);
                completion.call(target, dictionary);
            }, this);
        }else{
            if (storable.encodeToStorableDictionary){
                var dictionary = {
                    id: storable.id
                };
                storable.encodeToStorableDictionary(dictionary);
                storable = dictionary;
            }
            completion.call(target, storable);
        }
    },

    save: function(storable, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        if (!DBID.isValid(storable.id)){
            logger.error("Cannot save object without a valid id");
            JSRunLoop.main.schedule(completion, target, false);
        }else{
            this._pepareStorableForSave(storable, function(preparedStorable){
                if (preparedStorable === null){
                    completion.call(target, false);
                    return;
                }
                var handler = function(success){
                    completion.call(target, success);
                };
                var promise = this.store.save(preparedStorable, handler);
                if (promise instanceof Promise){
                    promise.then(handler);
                }
            }, this);
        }
        return completion.promise;
    },

    saveExpiring: function(storable, lifetimeInterval, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        if (!DBID.isValid(storable.id)){
            logger.error("Cannot save expiring object without a valid id");
            JSRunLoop.main.schedule(completion, target, false);
        }else if (this.store.saveExpiring){
            this._pepareStorableForSave(storable, function(preparedStorable){
                if (preparedStorable === null){
                    completion.call(target, false);
                    return;
                }
                var handler = function(success){
                    completion.call(target, success);
                };
                var promise = this.store.saveExpiring(preparedStorable, lifetimeInterval, handler);
                if (promise instanceof Promise){
                    promise.then(handler);
                }
            }, this);
        }else{
            logger.error("%{public} does not support saveExpriring", this.store.$class.className);
            JSRunLoop.main.schedule(completion, target, false);
        }
        return completion.promise;
    },

    incrementExpiring: function(id, lifetimeInterval, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        if (!DBID.isValid(id)){
            logger.error("Cannot increment without a valid id");
            JSRunLoop.main.schedule.call(completion, target, null);
        }else if (this.store.incrementExpiring){
            var handler = function(result){
                completion.call(target, result);
            };
            var promise = this.store.incrementExpiring(id, lifetimeInterval, handler);
            if (promise instanceof Promise){
                promise.then(handler);
            }
        }else{
            logger.error("%{public} does not support incrementExpiring", this.store.$class.className);
            JSRunLoop.main.schedule(completion, target, null);
        }
        return completion.promise;
    },

    delete: function(id, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        if (!DBID.isValid(id)){
            logger.error("Cannot delete object without a valid id");
            JSRunLoop.main.schedule(completion, target, false);
        }else{
            var handler = function(success){
                completion.call(target, success);
            };
            var promise = this.store.delete(id, handler);
            if (promise instanceof Promise){
                promise.then(handler);
            }
        }
        return completion.promise;
    },

    encryptionDefaults: null,
    keystore: null,

    setKeystore: function(keystore, defaultKeyIdentifier, keyBitLength){
        this.keystore = keystore;
        this.encryptionDefaults.keyIdentifer = defaultKeyIdentifier;
        this.encryptionDefaults.keyBitLength = keyBitLength;
    },

    storableClassResolver: null,

    registerStorableClass: function(storableClass, prefix){
        this.storableClassResolver.addClassForPrefix(storableClass, prefix);
    }

});

})();