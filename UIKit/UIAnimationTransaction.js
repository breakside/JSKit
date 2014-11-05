// #import "JSKit/JSKit.js"
// #import "UIKit/UIRenderer.js"
/* global JSClass, JSObject, UIAnimationTransaction, UIRenderer */
'use strict';

JSClass('UIAnimationTransaction', JSObject, {
    duration: 0.25,
    delay: 0,
    completionFunction: null,
    timingFunction: null,
    animationCount: 0,
    animations: null,

    init: function(){
        this._animationCompleteBound = this.animationComplete.bind(this);
        this.animations = [];
    },

    addAnimation: function(animation){
        animation.completionFunction = this._animationCompleteBound;
        ++this.animationCount;
        this.animations.push(animation);
    },

    animationComplete: function(animation){
        --this.animationCount;
        if (this.animationCount === 0 && this.completionFunction){
            this.completionFunction();
        }
    },

    flush: function(){
        var animation;
        for (var i = 0, l = this.animations.length; i < l; ++i){
            animation = this.animations[i];
            UIRenderer.defaultRenderer.setLayerNeedsAnimation(animation.layer);
        }
    }
});

UIAnimationTransaction.currentTransaction = null;
UIAnimationTransaction.stack = [];
UIAnimationTransaction.committed = [];

UIAnimationTransaction.begin = function(){
    var transaction = UIAnimationTransaction.init();
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
            transaction.flush();
        }
    }else{
        UIAnimationTransaction.currentTransaction = UIAnimationTransaction.stack[UIAnimationTransaction.stack.length - 1];
    }
};