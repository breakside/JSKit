// #import "UIPropertyAnimation.js"
/* global JSClass, UIPropertyAnimation, UIAnimationTransaction, JSLazyInitProperty, UIBasicAnimation, UIAnimation, JSDynamicProperty, JSResolveDottedName, JSSetDottedName, JSPoint, JSSize, JSRect, JSAffineTransform, JSColor */
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
        var transaction = UIAnimationTransaction.currentTransaction;
        if (transaction){
            this.duration = transaction.duration;
            this.delay = transaction.delay;
            this.timingFunction = transaction.timingFunction;
        }
    },

    getPercentComplete: function(){
        return this._state.currentPercentage;
    },

    setPercentComplete: function(percentComplete){
        this.pause();
        this._state.currentPercentage = percentComplete;
        this._updatePresentation();
        this.resume();
    },

    updateForTime: function(t){
        if (this._pauseCount > 0){
            return;
        }
        this._state.update(t, this._delay, this._duration);
        this._updatePresentation();
    },

    reverse: function(){
        this.pause();
        var to = this._toValue;
        this._toValue = this._fromValue;
        this._fromValue = to;
        this._state.currentPercentage = (1 - this._state.currentPercentage);
        JSSetDottedName(this.layer.model, this.keyPath, this._toValue);
        this.resume();
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

    _updatePresentation: function(){
        var progress = this.timingFunction(this._state.currentPercentage);
        this.isComplete = this._state.isComplete();
        this._updateContext[this._updateProperty] = this.interpolation(this._fromValue, this._toValue, progress);
    },

    _createInterpolation: function(){
        if (this._toValue === null){
            this._toValue = JSResolveDottedName(this.layer.model, this.keyPath);
        }
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
    currentTime: -1,
    startingPercentage: 0,
    endingPercentage: 1,
    currentPercentage: 0,
    needsReset: false,

    update: function(t, delay, duration){
        var timeRemaining;
        if (this.currentTime === -1){
            this.needsReset = false;
            if (this.currentPercentage > 0){
                timeRemaining = duration * (this.endingPercentage - this.currentPercentage) / (this.endingPercentage - this.startingPercentage);
                this.endingTime = t + timeRemaining;
                this.startingTime = this.endingTime - duration;
            }else{
                this.startingTime = t + delay;
                this.endingTime = this.startingTime + duration;
            }
        }else if (this.needsReset){
            var delayRemaining = Math.max(0, this.startingTime - this.currentTime);
            timeRemaining = duration * (this.endingPercentage - this.currentPercentage) / (this.endingPercentage - this.startingPercentage);
            this.endingTime = t + delayRemaining + timeRemaining;
            this.startingTime = this.endingTime - duration;
            this.needsReset = false;
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
        return this.currentPercentage <= this.endingPercentage;
    }
};

})();