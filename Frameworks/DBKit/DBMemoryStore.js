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

// #import "DBEphemeralObjectStore.js"
'use strict';

JSClass("DBMemoryStore", DBEphemeralObjectStore, {

    init: function(){
        this.valuesByKey = {};
        this.expirationsByKey = {};
    },

    valuesByKey: null,
    expirationsByKey: null,
    
    object: function(id, completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        var object = this.valuesByKey[id] || null;
        var expiration = this.expirationsByKey[id];
        if (expiration !== undefined && expiration <= JSDate.now.timeIntervalSince1970){
            this._delete(id);
            object = null;
        }
        JSRunLoop.main.schedule(completion, target, object);
        return completion.promise;
    },

    save: function(object, completion, target){
        return this.saveExpiring(object, 0, completion, target);
    },

    delete: function(id, completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        this._delete(id);
        JSRunLoop.main.schedule(completion, target, true);
        return completion.promise;
    },

    _delete: function(key){
        delete this.valuesByKey[key];
        delete this.expirationsByKey[key];
    },

    saveExpiring: function(object, lifetimeInterval, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        this.valuesByKey[object.id] = object;
        if (lifetimeInterval > 0){
            this.expirationsByKey[object.id] = JSDate.now.timeIntervalSince1970 + lifetimeInterval;
        }else{
            delete this.expirationsByKey[object.id];
        }
        JSRunLoop.main.schedule(completion, target, true);
        return completion.promise;
    },

});