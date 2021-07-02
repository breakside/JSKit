// Copyright 2021 Breakside Inc.
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

// #import "JSObject.js"
// #import "JSProtocol.js"
// #import "JSLog.js"
'use strict';

(function(){

var logger = JSLog("foundation", "objectgraph");

JSProtocol("JSObjectGraphLoading", JSProtocol, {

    awakeInGraph: function(){}

});

JSClass("JSObjectGraph", JSObject, {

    init: function(){
        this.objectsByID = {};
    },

    addObjectForID: function(object, id){
        this.objectsByID[id] = object;
    },

    objectsByID: null,

    object: function(id, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.rejectNonNullSecondArgument);
        }
        if (id === null || id === undefined){
            completion.call(target, null, null);
            return completion.promise;
        }
        var obj = this.objectsByID[id];
        if (obj !== undefined){
            completion.call(target, obj, null);
            return completion.promise;
        }
        var graph = this;
        this.loadObjectForID(id, function(obj, error){
            if (error === undefined){
                error = null;
            }
            if (error === null){
                graph.addObjectForID(obj, id);
                if (obj !== null && obj.awakeInGraph){
                    var promise = obj.awakeInGraph(graph);
                    if (promise instanceof Promise){
                        promise.then(function(){
                            completion.call(target, obj, null);
                        }, function(error){
                            completion.call(target, obj, error);
                        });
                        return;
                    }
                }
            }
            completion.call(target, obj, error);
        });
        return completion.promise;
    },

    objects: function(ids, completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        var index = 0;
        var objects = [];
        var loadNext = function(){
            if (index < ids.length){
                this.object(ids[index], function(result){
                    if (result !== null){
                        objects.push(result);
                    }
                    ++index;
                    loadNext.call(this);
                }, this);
            }else{
                completion.call(target, objects);
            }
        };
        loadNext.call(this);
        return completion.promise;
    },

    loadObjectForID: function(id, completion){
        completion(null);
    },

});

})();