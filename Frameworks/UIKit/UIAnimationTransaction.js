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

// #import Foundation
// #import "UIDisplayServer.js"
'use strict';

JSClass('UIAnimationTransaction', JSObject, {
    duration: 0.25,
    delay: 0,
    completionFunction: null,
    timingFunction: null,
    animationCount: 0,
    animations: null,
    percentComplete: JSDynamicProperty(),

    initPrivate: function(){
        this._animationCompleteBound = this._animationComplete.bind(this);
        this.animations = [];
    },

    getPercentComplete: function(){
        if (this.animations.length === 0){
            return 0;
        }
        return this.animations[0].percentComplete;
    },

    setPercentComplete: function(percentComplete){
        var animation;
        for (var i = 0, l = this.animations.length; i < l; ++i){
            animation = this.animations[i];
            animation.percentComplete = percentComplete;
        }
    },

    addAnimation: function(animation){
        animation.completionFunction = this._animationCompleteBound;
        ++this.animationCount;
        this.animations.push(animation);
    },

    _animationComplete: function(animation){
        --this.animationCount;
        if (this.animationCount === 0 && this.completionFunction){
            this.completionFunction();
        }
    },

    pause: function(){
        var animation;
        for (var i = 0, l = this.animations.length; i < l; ++i){
            animation = this.animations[i];
            animation.pause();
        }
    },

    resume: function(){
        var animation;
        for (var i = 0, l = this.animations.length; i < l; ++i){
            animation = this.animations[i];
            animation.resume();
        }
    },

    reverse: function(){
        var animation;
        for (var i = 0, l = this.animations.length; i < l; ++i){
            animation = this.animations[i];
            animation.reverse();
        }
    },

    stop: function(){
        var animation;
        for (var i = 0, l = this.animations.length; i < l; ++i){
            animation = this.animations[i];
            animation.layer.removeAnimation(animation, true);
        }
    },

    _flush: function(){
        if (this.animations.length === 0){
            if (this.completionFunction){
                this.completionFunction();
            }
            return;
        }
        var animation;
        for (var i = 0, l = this.animations.length; i < l; ++i){
            animation = this.animations[i];
            animation.layer.setNeedsAnimation();
        }
    },
});

UIAnimationTransaction.currentTransaction = null;
UIAnimationTransaction.stack = [];
UIAnimationTransaction.committed = [];

UIAnimationTransaction.begin = function(){
    var transaction = UIAnimationTransaction.initPrivate();
    UIAnimationTransaction.stack.push(transaction);
    UIAnimationTransaction.currentTransaction = transaction;
    return transaction;
};

UIAnimationTransaction.commit = function(){
    var transaction = UIAnimationTransaction.stack.pop();
    UIAnimationTransaction.committed.push(transaction);
    if (UIAnimationTransaction.stack.length === 0){
        UIAnimationTransaction.currentTransaction = null;
        for (var i = 0, l = UIAnimationTransaction.committed.length; i < l; ++i){
            transaction = UIAnimationTransaction.committed[i];
            transaction._flush();
        }
        UIAnimationTransaction.committed = [];
    }else{
        UIAnimationTransaction.currentTransaction = UIAnimationTransaction.stack[UIAnimationTransaction.stack.length - 1];
    }
};