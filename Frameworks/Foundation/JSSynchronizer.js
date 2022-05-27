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

// #import "JSObject.js"
// #import "JSTimeInterval.js"
// #import "Promise+JS.js"
// #import "JSTimer.js"
// #import "JSLog.js"
'use strict';

(function(){

var logger = JSLog("foundation", "synchronizer");

JSClass("JSSynchronizer", JSObject, {

    initWithAction: function(action, target){
        this.action = action;
        this.target = target;
        this.state = JSSynchronizer.State.idle;
        this._completions = [];
    },

    state: null,
    pendingInterval: JSTimeInterval.seconds(2),
    successInterval: JSTimeInterval.seconds(2),

    sync: function(completion, target){
        return this._scheduleSync(this.pendingInterval, completion, target);
    },

    syncImmediately: function(completion, target){
        return this._scheduleSync(0, completion, target);
    },

    cancel: function(){
        if (this._pendingTimer !== null){
            this._pendingTimer.invalidate();
            this._pendingTimer = null;
        }
        this._completions = [];
    },

    _scheduleSync: function(interval, completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        this._completions.push({completion: completion, target: target});
        if (this.state === JSSynchronizer.State.working){
            this._syncQueued = true;
        }else{
            this._clearError();
            if (this._pendingTimer !== null){
                this._pendingTimer.invalidate();
            }
            if (interval > 0){
                this._setState(JSSynchronizer.State.pending);
                this._pendingTimer = JSTimer.scheduledTimerWithInterval(interval, this._sync, this);
            }else{
                this._sync();
            }
        }
        return completion.promise;
    },

    _sync: function(){
        this._pendingTimer = null;
        var controller = this;
        var started = false;
        var completed = false;
        var context = {
            started: function JSSynchronizer_sync_context_started(){
                started = true;
            },
            completed: function JSSynchronizer_sync_context_completed(error){
                completed = true;
                if (controller._syncQueued){
                    controller._syncQueued = false;
                    controller._sync();
                }else{
                    if (error === null || error === undefined){
                        controller._setState(JSSynchronizer.State.success);
                    }else{
                        logger.error(error);
                        controller._setState(JSSynchronizer.State.error);
                        controller.error = error;
                    }
                    controller._callCompletions();
                }
            },
        };
        try{
            var promise = this.action.call(this.target, context);
            if (promise instanceof Promise){
                context.started();
                promise.then(function(){
                    context.completed();
                }, function(error){
                    context.completed(error);
                });
            }
        }catch (e){
            logger.error(e);
            this.error = e;
            this._setState(JSSynchronizer.State.error);
            this._callCompletions();
            return;
        }
        if (started){
            if (!completed){
                this._setState(JSSynchronizer.State.working);
            }
        }else{
            this._setState(JSSynchronizer.State.idle);
        }
    },

    _clearError: function(){
        this.error = null;
    },

    _setState: function(state){
        if (state === this.state){
            return;
        }
        this.state = state;
        if (state === JSSynchronizer.State.success){
            if (this.successInterval > 0){
                this._successTimer = JSTimer.scheduledTimerWithInterval(this.successInterval, function(){
                    this._successTimer = null;
                    if (this.state === JSSynchronizer.State.success){
                        this._setState(JSSynchronizer.State.idle);
                    }
                }, this);
            }else{
                this.state = JSSynchronizer.State.idle;
            }
        }else{
            if (this._successTimer !== null){
                this._successTimer.invalidate();
                this._successTimer = null;
            }
        }
    },

    _callCompletions: function(){
        var completion;
        for (var i = 0, l = this._completions.length; i < l; ++i){
            completion = this._completions[i];
            try{
                completion.completion.call(completion.target);
            }catch (e){
                logger.error(e);
            }
        }
        this._completions = [];
    },

    action: null,
    target: null,
    error: null,

    _pendingTimer: null,
    _successTimer: null,
    _syncQueued: false,
    _completions: null,

});

JSSynchronizer.State = {
    idle: 0,
    pending: 1,
    working: 2,
    success: 3,
    error: 4,
};

})();