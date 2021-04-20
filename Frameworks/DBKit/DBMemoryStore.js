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
'use strict';

JSClass("DBMemoryStore", DBObjectStore, {

    init: function(){
        this.valuesByKey = {};
    },

    valuesByKey: null,
    
    object: function(id, completion){
        var object = this._unexpiredObject(id);
        JSRunLoop.main.schedule(completion, undefined, object);
    },

    _unexpiredObject: function(id){
        var dictionary = this._unexpiredDictionary(id);
        if (dictionary !== null){
            var object = JSDeepCopy(dictionary);
            delete object.dbkitMemoryExpiration;
            return object;
        }
        return null;
    },

    _unexpiredDictionary: function(id){
        var dictionary = this.valuesByKey[id] || null;
        if (dictionary !== null && dictionary.dbkitMemoryExpiration.isPast()){
            this._delete(id);
            return null;
        }
        return dictionary;
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
    },

    saveExpiring: function(object, lifetimeInterval, completion){
        this._saveExpiring(object, lifetimeInterval);
        JSRunLoop.main.schedule(completion, undefined, true);
    },

    _saveExpiring: function(object, lifetimeInterval){
        var dictionary = JSDeepCopy(object);
        if (lifetimeInterval > 0){
            dictionary.dbkitMemoryExpiration = JSDate.initWithTimeIntervalSinceNow(lifetimeInterval);
        }else{
            dictionary.dbkitMemoryExpiration = JSDate.distantFuture;
        }
        this.valuesByKey[object.id] = dictionary;
    },

    incrementExpiring: function(id, lifetimeInterval, completion){
        var object = this._unexpiredObject(id);
        if (object === null){
            object = {id: id, count: 0};
        }
        var result = ++object.count;
        this._saveExpiring(object, lifetimeInterval);
        JSRunLoop.main.schedule(completion, undefined, result);
    },

    exclusiveSave: function(id, change, completion){
        var store = this;
        var maxRetires = 10;
        var retires = 0;
        var tryChange = function(){
            var dictionary = store._unexpiredDictionary(change.object.id);
            var object = null;
            if (dictionary !== null){
                object = JSDeepCopy(dictionary);
                delete object.dbkitMemoryExpiration;
            }
            change(object, function(changedObject){
                if (changedObject === null){
                    completion(false);
                    return;
                }
                var latestDictionary = store._unexpiredDictionary(change.object.id);
                if (latestDictionary === dictionary){
                    var changedDictionary = JSDeepCopy(object);
                    changedDictionary.dbkitMemoryExpiration = latestDictionary !== null ? latestDictionary.dbkitMemoryExpiration : JSDate.distantFuture;
                    store.valuesByKey[changedDictionary.id] = changedDictionary;
                    completion(true);
                }else{
                    ++retires;
                    if (retires > maxRetires){
                        completion(false);
                    }else{
                        tryChange();
                    }
                }
            });
        };
        tryChange();
    },

    saveChange: function(change, completion){
        var dictionary = this._unexpiredDictionary(change.object.id);
        if (dictionary === null){
            completion(false);
            return;
        }
        if (dictionary.dbkitSecure){
            completion(false);
            return;
        }
        var value = change.object[change.property];
        if (change.operator === DBObjectChange.Operator.set){
            dictionary[change.property] = value;
        }else if (change.operator === DBObjectChange.Operator.increment){
            if (isNaN(dictionary[change.property])){
                dictionary[change.property] = 0;
            }
            dictionary[change.property] += change.operands[0];
        }else if (change.operator === DBObjectChange.Operator.insert){
            dictionary[change.property].splice(change.operands[0], 0, value[change.operands[0]]);
        }else if (change.operator === DBObjectChange.Operator.delete){
            dictionary[change.property].splice(change.operands[0], 1);
        }else{
            completion(false);
            return;
        }
        completion(true);
    }

});