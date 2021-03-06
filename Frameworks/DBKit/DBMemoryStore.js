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
'use strict';

JSClass("DBMemoryStore", DBObjectStore, {

    init: function(){
        this.valuesByKey = {};
        this.expirationsByKey = {};
    },

    valuesByKey: null,
    expirationsByKey: null,
    
    object: function(id, completion){
        var object = this._unexpiredDictionary(id);
        JSRunLoop.main.schedule(completion, undefined, object);
    },

    _unexpiredDictionary: function(id){
        var object = this.valuesByKey[id] || null;
        var expiration = this.expirationsByKey[id];
        if (expiration !== undefined && expiration <= JSDate.now.timeIntervalSince1970){
            this._delete(id);
            object = null;
        }
        return object;
    },

    save: function(object, completion){
        this.saveExpiring(object, 0, completion);
    },

    delete: function(id, completion){
        this._delete(id);
        JSRunLoop.main.schedule(completion, undefined, true);
    },

    _delete: function(key){
        delete this.valuesByKey[key];
        delete this.expirationsByKey[key];
    },

    saveExpiring: function(object, lifetimeInterval, completion){
        this._saveExpiring(object, lifetimeInterval);
        JSRunLoop.main.schedule(completion, undefined, true);
    },

    _saveExpiring: function(object, lifetimeInterval){
        this.valuesByKey[object.id] = object;
        if (lifetimeInterval > 0){
            this.expirationsByKey[object.id] = JSDate.now.timeIntervalSince1970 + lifetimeInterval;
        }else{
            delete this.expirationsByKey[object.id];
        }
    },

    incrementExpiring: function(id, lifetimeInterval, completion){
        var object = this._unexpiredDictionary(id);
        if (object === null){
            object = {id: id, count: 0};
        }
        var result = ++object.count;
        this._saveExpiring(object, lifetimeInterval);
        JSRunLoop.main.schedule(completion, undefined, result);
    },

    saveChange: function(id, change, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var store = this;
        this.object(id, function(obj){
            obj = change(obj);
            store.save(obj, function(success){
                if (!success){
                    completion.call(target, null);
                    return;
                }
                completion.call(target, obj);
            });
        });
        return completion.promise;
    }

});