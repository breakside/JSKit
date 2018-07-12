// #import "UIKit/UIAnimation.js"
/* global JSClass, UIAnimation */
'use strict';

JSClass("UICustomAnimation", UIAnimation, {

    _action: null,
    _target: null,

    initWithAction: function(action, target){
        this._action = action;
        this._target = target;
    },

    updateForTime: function(t){
        if (!this.isComplete){
            this._percentComplete = this._action.call(this._target, t) || 0;
        }
    }

});
