// #import "Foundation/JSRunLoop.js"
/* global JSRunLoop, window, Promise */
'use strict';

(function(){

JSRunLoop.definePropertiesFromExtensions({

    _queue: null,

    _environmentInit: function(){
        this._queue = [];
    },

    _flushQueue: function(){
        var job;
        var queue = this._queue;
        this._queue = [];
        for (var i = 0, l = queue.length; i < l; ++i){
            job = queue[i];
            job.action.apply(job.target, job.args);
        }
    },

    schedule: function(action, target){
        this._queue.push({action: action, target: target, args: Array.prototype.slice.call(arguments, 2)});
        if (this._queue.length === 1){
            this._scheduleQueueFlush();
        }
    }

});

if (window.Promise){

    JSRunLoop.definePropertiesFromExtensions({
        _scheduleQueueFlush: function(){
            var loop = this;
            var promise = new Promise(function(resolve, reject){
                resolve();
            });
            promise.then(function(){
                loop._flushQueue();
            });
        }
    });

}else{

    // IE 11 doesn't do promises, but it can do setImmediate, which is just as good

    JSRunLoop.definePropertiesFromExtensions({
        _scheduleQueueFlush: function(){
            var loop = this;
            window.setImmediate(function(){
                loop._flushQueue();
            });
        }
    });

}

})();