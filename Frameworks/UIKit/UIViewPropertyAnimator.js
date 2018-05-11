// #import "UIKit/UIAnimation.js"
// #import "UIKit/UIAnimationTransaction.js"
/* global JSClass, JSObject, JSReadOnlyProperty, JSDynamicProperty, UIAnimation, UIAnimationTransaction */
'use strict';

JSClass("UIViewPropertyAnimator", JSObject, {

    duration: JSReadOnlyProperty('_duration', 0),
    timingFunction: JSReadOnlyProperty('_timingFunction', null),
    animationBlocks: null,
    completionBlocks: null,
    percentComplete: JSReadOnlyProperty(),
    _transaction: null,
    _percentComplete: 0,

    initWithDuration: function(duration, timingFunction){
        this._duration = duration;
        this._timingFunction = timingFunction || UIAnimation.linearTimingFunction;
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

    addAnimations: function(animations){
        this.animationBlocks.push(animations);
    },

    addCompletion: function(completion){
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

    stop: function(){
        if (this._transaction === null){
            return;
        }
        this._transaction.stop();
        this._percentComplete = this._transaction.percentComplete;
        this._transaction = null;
    }

});