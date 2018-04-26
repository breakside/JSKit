// #import "Foundation/Foundation.js"
// #import "UIKit/UIDisplayServer.js"
/* global JSClass, JSObject, UIAnimationTransaction, UIDisplayServer */
'use strict';

JSClass('UIAnimationTransaction', JSObject, {
    duration: 250,
    delay: 0,
    completionFunction: null,
    timingFunction: null,
    animationCount: 0,
    animations: null,

    initPrivate: function(){
        this._animationCompleteBound = this._animationComplete.bind(this);
        this.animations = [];
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

    _flush: function(){
        var animation;
        for (var i = 0, l = this.animations.length; i < l; ++i){
            animation = this.animations[i];
            animation.layer.setNeedsAnimation();
        }
    }
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
    }else{
        UIAnimationTransaction.currentTransaction = UIAnimationTransaction.stack[UIAnimationTransaction.stack.length - 1];
    }
};