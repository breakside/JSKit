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
        this.infoByKey = {};
    },

    infoByKey: null,
    
    object: function(id, completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        var info = this.infoByKey[id];
        var object = null;
        if (info){
            if (info.expiresAt && info.expiresAt >= JSDate.now){
                delete this.infoByKey[id];
            }else{
                object = info.object;
            }
        }
        JSRunLoop.main.schedule(completion, target, object);
        return completion.promise;
    },

    save: function(object, completion, target){
        return this.saveExpiring(object, 0, completion, target);
    },

    saveExpiring: function(object, lifetimeInSeconds, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        var info = {
             expiresAt: 0,
             object: object
        };
        if (lifetimeInSeconds){
            info.expiresAt = JSDate.now + lifetimeInSeconds;
        }
        JSRunLoop.main.schedule(completion, target, true);
        return completion.promise;
    },

});