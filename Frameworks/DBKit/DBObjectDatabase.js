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
// #import "DBEphemeralObjectStore.js"
/* global DBSecureObjectDatabase */
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
    },

    id: function(table){
        var chunks = Array.prototype.slice.call(arguments, 1);
        if (chunks.length === 0){
            chunks.push(UUID.init());
        }
        var hash = new JSSHA1Hash();
        var chunk;
        hash.start();
        for (var i = 0, l = chunks.length; i < l; ++i){
            chunk = chunks[i];
            if (typeof(chunk) == "string"){
                chunk = chunk.utf8();
            }else if (chunk instanceof UUID){
                chunk = chunk.bytes;
            }
            if (!(chunk instanceof JSData)){
                throw new Error("id components must be JSData, String, or UUID");
            }
            hash.add(chunk);
        }
        hash.finish();
        var hex = hash.digest().hexStringRepresentation();
        return table + '_' + hex;
    },

    tableForId: function(id){
        return id.substr(0, id.length - 41);
    },

    object: function(id, completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        if (!this.isValidId(id)){
            completion.call(target, null);
        }else{
            this.store.object(id, completion, target);
        }
        return completion.promise;
    },

    requiredObject: function(id, errorfn, errorArg1){
        var errorArgs = Array.prototype.slice.call(arguments, 2);
        var db = this;
        return new Promise(function(resolve, reject){
            db.object(id).then(resolve);
        }).then(function(object){
            if (object === null){
                throw errorfn.apply(undefined, errorArgs);
            }
            return object;
        });
    },

    save: function(obj, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        if (!this.isValidId(obj.id)){
            completion.call(target, false);
            return;
        }
        this.store.save(obj, completion, target);
        return completion.promise;
    },

    saveExpiring: function(obj, lifetimeInSeconds, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        if (!this.isValidId(obj.id)){
            completion.call(target, false);
            return;
        }
        if (this.store.isKindOfClass(DBEphemeralObjectStore)){
            this.store.saveExpiring(obj, lifetimeInSeconds, completion, target);
        }else{
            logger.error("Cannot save expiring object in a persistent data store");
            JSRunLoop.main.schedule(completion, target, false);
        }
        return completion.promise;
    },

    delete: function(id, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        if (!this.isValidId(id)){
            completion.call(target, false);
            return;
        }
        this.store.delete(id, completion, target);
        return completion.promise;
    },

    secure: JSReadOnlyProperty('_secure', null),

    setKeystore: function(keystore){
        if (keystore === null){
            this._secure = null;
        }else{
            this._secure = DBSecureObjectDatabase.initWithKeystore(keystore, this.store);
        }
    },

    isValidId: function(id){
        if (id === undefined){
            return false;
        }
        if (id === null){
            return false;
        }
        if (typeof(id) !== "string"){
            return false;
        }
        if (id.length === 0){
            return false;
        }
        return true;
    }

});

})();