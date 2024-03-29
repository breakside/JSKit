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
// #feature setTimeout
// #feature setInterval
'use strict';

JSClass("JSTimer", JSObject, {

    interval: JSReadOnlyProperty('_interval', 0),
    repeats: JSReadOnlyProperty('_repeats', false),
    _action: null,
    _target: undefined,
    _id: null,

    initWithInterval: function(interval, repeats, action, target){
        this._interval = interval;
        this._repeats = repeats;
        this._action = action;
        this._target = target;
    },

    schedule: function(){
        if (this._id === null && this._action !== null){
            var intervalInMilliseconds = Math.round(this._interval * 1000);
            if (this._repeats){
                this._id = JSGlobalObject.setInterval((function JSTimer_interval(t){
                    this._action.call(this._target);
                }).bind(this), intervalInMilliseconds);
            }else{
                this._id = JSGlobalObject.setTimeout((function JSTimer_timeout(t){
                    this._id = null;
                    this._action.call(this._target);
                }).bind(this), intervalInMilliseconds);
            }
        }
    },

    invalidate: function(){
        if (this._id !== null){
            if (this._repeats){
                JSGlobalObject.clearInterval(this._id);
            }else{
                JSGlobalObject.clearTimeout(this._id);
            }
            this._id = null;
        }
    }

});

JSTimer.scheduledTimerWithInterval = function(interval, action, target){
    var timer = JSTimer.initWithInterval(interval, false, action, target);
    timer.schedule();
    return timer;
};

JSTimer.scheduledRepeatingTimerWithInterval = function(interval, action, target){
    var timer = JSTimer.initWithInterval(interval, true, action, target);
    timer.schedule();
    return timer;
};

JSTimer.waitInterval = function(interval){
    return new Promise(function(resolve, reject){
        JSTimer.scheduledTimerWithInterval(interval, resolve);
    });
};