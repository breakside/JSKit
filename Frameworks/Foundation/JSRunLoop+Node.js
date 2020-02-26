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

// #import "JSRunLoop.js"
// jshint node: true
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