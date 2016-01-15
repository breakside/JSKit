// #import "UIKit/UIPropertyAnimation.js"
/* global JSClass, UIPropertyAnimation, UIAnimation, JSResolveDottedName, JSPoint, JSSize, JSRect, JSAffineTransform, JSColor */
'use strict';

JSClass('UIBasicAnimation', UIPropertyAnimation, {
    timingFunction: UIAnimation.linearTimingFunction,
    duration: null,
    fromValue: null,
    toValue: null,
    _fromValue: null,
    _toValue: null,
    _interpolation: null,
    _t0: null,
    _timeProgress: null,
    _progress: null,

    updateForTime: function(t){
        if (this._t0 === null){
            this._t0 = t;
        }
        this._timeProgress = Math.max(0, Math.min(1, (t - this._t0) / this.duration));
        this._progress = this.timingFunction(this._timeProgress);
        if (this._timeProgress >= 1){
            this.isComplete = true;
        }else{
            this._updateLayer();
        }
    },

    _updateLayer: function(){
        var from = this.fromValue;
        var to = this.toValue || JSResolveDottedName(this.layer.model, this.keyPath);
        if (!this._interpolation || from != this._fromValue || to != this._toValue){
            this._fromValue = from;
            this._toValue = to;
            this._determineInterpolation();
        }
        this._updateContext[this._updateProperty] = this._interpolation(from, to, this._progress);
    },

    _determineInterpolation: function(){
        if (this._fromValue === undefined || this._toValue === undefined || this._fromValue === null || this._toValue === null){
            this._interpolation = UIAnimation.interpolateNull;
        }else if (typeof(this._fromValue) === 'number'){
            this._interpolation = UIAnimation.interpolateNumber;
        }else if (this._fromValue instanceof JSPoint){
            this._interpolation = UIAnimation.interpolatePoint;
        }else if (this._fromValue instanceof JSSize){
            this._interpolation = UIAnimation.interpolateSize;
        }else if (this._fromValue instanceof JSRect){
            this._interpolation = UIAnimation.interpolateRect;
        }else if (this._fromValue instanceof JSAffineTransform){
            this._interpolation = UIAnimation.interpolateAffineTransform;
        }else if (this._fromValue.isKindOfClass && this._fromValue.isKindOfClass(JSColor)){
            if (this._fromValue.components.length == 1){
                this._interpolation = UIAnimation.interpolate1Color;
            }else if (this._fromValue.components.length == 2){
                this._interpolation = UIAnimation.interpolate2Color;
            }else if (this._fromValue.components.length == 3){
                this._interpolation = UIAnimation.interpolate3Color;
            }else if (this._fromValue.components.length == 4){
                this._interpolation = UIAnimation.interpolate4Color;
            }else{
                this._interpolation = UIAnimation.interpolateNull;
            }
        }else{
            this._interpolation = UIAnimation.interpolateNull;
        }
    }
});