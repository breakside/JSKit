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
        var promises = [];
        var id;
        for (var i = 0, l = ids.length; i < l; ++i){
            id = ids[i];
            promises.push(this.object(id));
        }
        Promise.all(promises).then(function(objects){
            for (var i = objects.length - 1; i >= 0; --i){
                if (objects[i] === null){
                    objects[i].splice(i, 1);
                }
            }
            completion.call(target, objects);
        }, function(){
            completion.call(target, []);
        });
        return completion.promise;
    },

    loadObjectForID: function(completion, target){
        completion.call(target, null);
    },

});