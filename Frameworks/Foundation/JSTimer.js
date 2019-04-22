// #import "JSObject.js"
// #feature setTimeout
// #feature setInterval
/* global JSClass, JSObject, JSReadOnlyProperty, JSTimer, JSGlobalObject */
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