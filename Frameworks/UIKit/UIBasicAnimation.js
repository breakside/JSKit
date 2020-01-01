// #import "UIPropertyAnimation.js"
/* global JSClass, UIPropertyAnimation, JSLazyInitProperty, UIBasicAnimation, UIAnimation, JSDynamicProperty, JSResolveDottedName, JSPoint, JSSize, JSRect, JSAffineTransform, JSColor */
'use strict';

(function(){

JSClass('UIBasicAnimation', UIPropertyAnimation, {
    timingFunction: null,
    duration: JSDynamicProperty('_duration', 0.25),
    delay: JSDynamicProperty('_delay', 0),
    fromValue: JSDynamicProperty('_fromValue', null),
    toValue: JSDynamicProperty('_toValue', null),
    interpolation: JSLazyInitProperty('_createInterpolation'),
    _pauseCount: 0,
    _state: null,

    initWithKeyPath: function(keyPath){
        UIBasicAnimation.$super.initWithKeyPath.call(this, keyPath);
        this.timingFunction = UIAnimation.Timing.linear;
        this._state = new AnimationState();
    },

    getPercentComplete: function(){
        return this._state.currentPercentage;
    },

    setPercentComplete: function(percentComplete){
        if (this._pauseCount > 0){
            this._state.currentPercentage = percentComplete;
        }
    },

    updateForTime: function(t){
        if (this._pauseCount > 0){
            return;
        }
        this._state.update(t, this._delay, this._duration);
        var progress = this.timingFunction(this._state.currentPercentage);
        this.isComplete = this._state.isComplete();
        this._updateContext[this._updateProperty] = this.interpolation(this._fromValue, this._toValue, progress);
    },

    reverse: function(){
        if (this._pauseCount > 0){
            var orignalEnding = this._state.endingPercentage;
            this._state.endingPercentage = this._state.startingPercentage;
            this._state.startingPercentage = orignalEnding;
        }
    },

    pause: function(){
        ++this._pauseCount;
    },

    resume: function(){
        if (this._pauseCount === 0){
            return;
        }
        --this._pauseCount;
        if (this._pauseCount === 0 && this._state.currentTime !== 0){
            this._state.needsReset = true;
        }
    },

    _createInterpolation: function(){
        return UIAnimation.interpolationForValues(this._fromValue, this._toValue);
    }

});

var AnimationState = function(){
    if (this === undefined){
        return new AnimationState();
    }
};

AnimationState.prototype = {
    startingTime: 0,
    endingTime: 0,
    currentTime: 0,
    startingPercentage: 0,
    endingPercentage: 1,
    currentPercentage: 0,
    needsReset: false,

    update: function(t, delay, duration){
        if (this.currentTime === 0){
            this.startingTime = t + delay;
            this.endingTime = this.startingTime + duration;
        }else if (this.needsReset){
            var delayRemaining = Math.max(0, this.startingTime - this.currentTime);
            var timeRemaining = duration * (this.endingPercentage - this.currentPercentage) / (this.endingPercentage - this.startingPercentage);
            this.endingTime = t + delayRemaining + timeRemaining;
            this.startingTime = this.endingTime - duration;
        }
        this.currentTime = t;
        var timePercentage = (this.currentTime - this.startingTime) / (this.endingTime - this.startingTime);
        timePercentage = Math.min(1, Math.max(0, timePercentage));
        this.currentPercentage = this.startingPercentage + (this.endingPercentage - this.startingPercentage) * timePercentage;
    },

    isComplete: function(){
        if (this.endingPercentage >= this.startingPercentage){
            return this.currentPercentage >= this.endingPercentage;
        }
        return this.currentPercentage <= this.startingPercentage;
    }
};

})();