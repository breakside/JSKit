// #import "UIAnimation.js"
// #import "UIAnimationTransaction.js"
'use strict';

JSClass("UIViewPropertyAnimator", JSObject, {

    duration: JSReadOnlyProperty('_duration', 0),
    timingFunction: JSReadOnlyProperty('_timingFunction', null),
    animationBlocks: null,
    completionBlocks: null,
    percentComplete: JSDynamicProperty(),
    _transaction: null,
    _percentComplete: 0,

    initWithDuration: function(duration, timingFunction){
        this._duration = duration;
        this._timingFunction = timingFunction || UIAnimation.Timing.linear;
        this.animationBlocks = [];
        this.completionBlocks = [];
        this._completeAnimationsBound = this._completeAnimations.bind(this);
    },

    getPercentComplete: function(){
        if (this._transaction === null){
            return this._percentComplete;
        }
        return this._transaction.percentComplete;
    },

    setPercentComplete: function(percentComplete){
        if (this._transaction === null){
            this._percentComplete = percentComplete;
        }
        this._transaction.percentComplete = percentComplete;
    },

    addAnimations: function(animations){
        if (this._transaction !== null){
            throw new Error("Cannot add animations after animator has started");
        }
        this.animationBlocks.push(animations);
    },

    addCompletion: function(completion){
        if (this._transaction !== null){
            throw new Error("Cannot add completion block after animator has started");
        }
        this.completionBlocks.push(completion);
    },

    _completeAnimations: function(){
        this._transaction = null;
        for (var i = 0, l = this.completionBlocks.length; i < l; ++i){
            this.completionBlocks[i]();
        }
    },

    start: function(delay){
        if (this._transaction !== null){
            return;
        }
        var transaction = UIAnimationTransaction.begin();
        transaction.delay = delay || 0;
        transaction.duration = this._duration;
        transaction.timingFunction = this._timingFunction;
        transaction.completionFunction = this._completeAnimationsBound;
        for (var i = 0, l = this.animationBlocks.length; i < l; ++i){
            this.animationBlocks[i]();
        }
        this._transaction = transaction;
        UIAnimationTransaction.commit();
    },

    pause: function(){
        if (this._transaction !== null){
            this._transaction.pause();
        }
    },

    resume: function(){
        if (this._transaction !== null){
            this._transaction.resume();
        }
    },

    reverse: function(){
        if (this._transaction !== null){
            this._transaction.reverse();
        }
    },

    stop: function(){
        if (this._transaction === null){
            return;
        }
        this._transaction.stop();
        this._percentComplete = this._transaction.percentComplete;
        this._transaction = null;
    },

    stopAndCallCompletions: function(){
        this.stop();
        this._completeAnimations();
    }

});