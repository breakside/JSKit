// #import "JSRunLoop.js"
/* global JSRunLoop, process */
'use strict';

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
            var loop = this;
            process.nextTick(function(){
                loop._flushQueue();
            });
        }
    }

});