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
            completion = Promise.completion();
        }
        if (id === null || id === undefined){
            completion.call(target, null);
            return completion.promise;
        }
        var obj = this.objectsByID[id];
        if (obj !== undefined){
            completion.call(target, obj);
            return completion.promise;
        }
        var graph = this;
        this.loadObjectForID(id, function(obj){
            graph.addObjectForID(obj, id);
            if (obj !== null && obj.awakeInGraph){
                var promise = obj.awakeInGraph(graph);
                if (promise instanceof Promise){
                    promise.then(function(){
                        completion.call(target, obj);
                    });
                    return;
                }
            }
            completion.call(target, obj);
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