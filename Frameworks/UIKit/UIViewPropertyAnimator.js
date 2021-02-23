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

    addAnimations: function(animations, target){
        if (this._transaction !== null){
            throw new Error("Cannot add animations after animator has started");
        }
        this.animationBlocks.push({animations: animations, target: target});
    },

    addCompletion: function(completion, target){
        if (this._transaction !== null){
            throw new Error("Cannot add completion block after animator has started");
        }
        this.completionBlocks.push({completion: completion, target: target});
    },

    _completeAnimations: function(){
        if (this._transaction !== null){
            this._percentComplete = this._transaction.percentComplete;
            this._transaction = null;
        }
        var block;
        for (var i = 0, l = this.completionBlocks.length; i < l; ++i){
            block = this.completionBlocks[i];
            block.completion.call(block.target);
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
        var block;
        for (var i = 0, l = this.animationBlocks.length; i < l; ++i){
            block = this.animationBlocks[i];
            block.animations.call(block.target);
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
        if (this._transaction === null){
            return;
        }
        this.stop();
        this._completeAnimations();
    }

});