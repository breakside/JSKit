// #import "JSObject.js"
'use strict';

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
        var obj = this.objectsByID[id];
        if (obj !== undefined){
            completion.call(target, obj);
            return completion.promise;
        }
        this.loadObjectForID(id, function(obj){
            this.addObjectForID(obj, id);
            completion.call(target, obj);
        }, this);
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

    loadObjectForID: function(completion, target){
        completion.call(target, null);
    },

});