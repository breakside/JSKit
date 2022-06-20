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

// #import "UIPropertyAnimation.js"
// #import "UIAnimationTransaction.js"
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
        if (this._updateContext === this._layer.presentation && (this._updateProperty === "bounds" || this._updateProperty === "imageFrame")){
            this._layer.setNeedsDisplay();
        }
    },

    _createInterpolation: function(){
        if (this._toValue === null){
            this._toValue = JSResolveDottedName(this.layer.model, this.keyPath);
        }
        if ((this._fromValue instanceof JSColor) && (this._toValue instanceof JSColor)){
            if (this._fromValue.space !== this._toValue.space || !this._fromValue.space.canMixComponents){
                this._fromValue = this._fromValue.rgbaColor();
                this._toValue = this._toValue.rgbaColor();
            }
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