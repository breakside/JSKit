// #import "UIKit/UIAnimation.js"
/* global JSClass, UIAnimation, JSDynamicProperty */
'use strict';

JSClass('UIAnimationGroup', UIAnimation, {
    animations: null,
    layer: JSDynamicProperty('_layer', null),
    isComplete: false,

    init: function(){
        this.animations = [];
    },

    getLayer: function(){
        return this._layer;
    },

    addAnimation: function(animation){
        this.animations.push(animation);
        animation.layer = this._layer;
    },

    setLayer: function(layer){
        this._layer = layer;
        var animation;
        for (var i = 0, l = this.animations.length; i < l; ++i){
            animation = this.animations[i];
            animation.layer = layer;
        }
    },

    updateForTime: function(t){
        var animation;
        var allComplete = true;
        for (var i = 0, l = this.animations.length; i < l; ++i){
            animation = this.animations[i];
            animation.updateForTime(t);
            if (allComplete && !animation.isComplete){
                allComplete = false;
            }
        }
        this.isComplete = allComplete;
    }
});