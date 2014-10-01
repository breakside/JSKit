// #import "JSKit/JSKit.js"

JSClass('UIAnimation', JSObject, {
    timingFunction: null,
    duration: null,
    completionFunction: null
});



UIAnimation.interpolateNull = function(from, to, progress){
    return from;
};

UIAnimation.interpolateNumber = function(from, to, progress){
     return from + (to - from) * progress;
};

UIAnimation.interpolatePoint = function(from, to, progress){
    return JSPoint(
        from.x + (to.x - from.x) * progress,
        from.y + (to.y - from.y) * progress
    );
};

UIAnimation.interpolateSize = function(from, to, progress){
    return JSSize(
        from.width + (to.width - from.width) * progress,
        from.height + (to.height - from.height) * progress
    );
};

UIAnimation.interpolateRect = function(from, to, progress){
    return JSRect(
        from.origin.x + (to.origin.x - from.origin.x) * progress,
        from.origin.y + (to.origin.y - from.origin.y) * progress,
        from.size.width + (to.size.width - from.size.width) * progress,
        from.size.height + (to.size.height - from.size.height) * progress
    );
};

UIAnimation.interpolateAffineTransform = function(from, to, progress){
    return JSAffineTransform(
        from.a + (to.a - from.a) * progress,
        from.b + (to.b - from.b) * progress,  // FIXME: this probably isn't the right interpolation for rotation/skew
        from.c + (to.c - from.c) * progress,  // FIXME: this probably isn't the right interpolation for rotation/skew
        from.d + (to.d - from.d) * progress,
        from.tx + (to.tx - from.tx) * progress,
        from.ty + (to.ty - from.ty) * progress
    );
};

UIAnimation.interpolate1Color = function(from, to, progress){
    return JSColor.initWithSpaceAndComponents(from.colorSpace, [
        from.components[0] + (to.components[0] - from.components[0]) * progress
    ]);
};

UIAnimation.interpolate2Color = function(from, to, progress){
    return JSColor.initWithSpaceAndComponents(from.colorSpace, [
        from.components[0] + (to.components[0] - from.components[0]) * progress,
        from.components[1] + (to.components[1] - from.components[1]) * progress
    ]);
};

UIAnimation.interpolate3Color = function(from, to, progress){
    return JSColor.initWithSpaceAndComponents(from.colorSpace, [
        from.components[0] + (to.components[0] - from.components[0]) * progress,
        from.components[1] + (to.components[1] - from.components[1]) * progress,
        from.components[2] + (to.components[2] - from.components[2]) * progress
    ]);
};

UIAnimation.interpolate4Color = function(from, to, progress){
    return JSColor.initWithSpaceAndComponents(from.colorSpace, [
        from.components[0] + (to.components[0] - from.components[0]) * progress,
        from.components[1] + (to.components[1] - from.components[1]) * progress,
        from.components[2] + (to.components[2] - from.components[2]) * progress,
        from.components[3] + (to.components[3] - from.components[3]) * progress
    ]);
};


JSClass('UIPropertyAnimation', UIAnimation, {
    keyPath: null,
    initWithKeyPath: function(keyPath){
        self.keyPath = keyPath;
    }
});

JSClass('UIBasicAnimation', UIPropertyAnimation, {
    fromValue: null,
    toValue: null,
    _fromValue: null,
    _toValue: null,
    _interpolation: null,

    updateLayer: function(layer){
        var from = this.fromValue;
        var to = this.toValue || layer[this.keyPath];
        if (!this._interpolation || from != this._fromValue || to != this._toValue){
            this._fromValue = from;
            this._toValue = to;
            this._determinInterpolation();
        }
        layer[this.keyPath] = this._interpolation(from, to, this.progress);
    },

    _determinInterpolation: function(){
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

JSClass('UIAnimationGroup', UIAnimation, {
    animations: null,

    init: function(){
        this.animations = [];
    }
});

JSClass('UIAnimationTransaction', JSObject, {
    duration: 0.25,
    delay: 0,
    completionFunction: null,
    timingFunction: null,
    animationCount: 0,

    init: function(){
        this._animationCompleteBound = this.animationComplete.bind(this);
    },

    addAnimation: function(animation){
        animation.completionFunction = this._animationCompleteBound;
        ++this.animationCount;
    },

    animationComplete: function(animation){
        --this.animationCount;
        if (this.animationCount === 0 && this.completionFunction){
            this.completionFunction();
        }
    }
});

UIAnimationTransaction.currentTransaction = null;
UIAnimationTransaction.stack = [];

UIAnimationTransaction.begin = function(){
    var transaction = UIAnimationTransaction.init();
    UIAnimationTransaction.stack.push(transaction);
    UIAnimationTransaction.currentTransaction = transaction;
    return transaction;
};

UIAnimationTransaction.commit = function(){
    var transaction = UIAnimationTransaction.stack.pop();
    if (UIAnimationTransaction.stack.length === 0){
        UIAnimationTransaction.currentTransaction = null;
    }else{
        UIAnimationTransaction.currentTransaction = UIAnimationTransaction.stack[UIAnimationTransaction.stack.length - 1];
    }
    if (transaction.delay){
        JSGlobalObject.setTimeout(function UIView_animateAfterDelay(){
            UIView._animations.push(animation);
            UIView._requestDisplayFrame();
        }, animation.delay);
    }else{
        UIView._animations.push(animation);
        UIView._requestDisplayFrame();
    }
};

UIAnimation.linearTimingFunction = function(t){
    return t;
};