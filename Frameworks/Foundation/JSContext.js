// #import "Foundation/JSObject.js"
// #import "Foundation/JSColor.js"
/* global JSClass, JSObject, JSDynamicProperty, JSColor, JSContext, JSCopy, JSCustomProperty */
'use strict';

function StateProperty(){
    if (this === undefined){
        return new StateProperty();
    }
}

StateProperty.prototype = Object.create(JSCustomProperty.prototype);

StateProperty.prototype.define = function(C, key, extensions){
    var setterName = C.nameOfSetMethodForKey(key);
    var getter = function JSContext_getStateProperty(){
        return this.state[key];
    };
    var setter = function JSContext_setStateProperty(value){
        this.state[key] = value;
    };
    Object.defineProperty(C.prototype, setterName, {
        configurable: false,
        enumerable: false,
        value: setter
    });
    Object.defineProperty(C.prototype, key, {
        configurable: false,
        enumerable: false,
        set: setter,
        get: getter
    });
};

JSClass("JSContext", JSObject, {

    // state

    alpha:          StateProperty(),
    fillColor:      StateProperty(),
    strokeColor:    StateProperty(),
    lineWidth:      StateProperty(),
    lineCap:        StateProperty(),
    lineJoin:       StateProperty(),
    lineDash:       StateProperty(),
    miterLimit:     StateProperty(),
    shadowColor:    StateProperty(),
    shadowOffset:   StateProperty(),
    shadowBlur:     StateProperty(),

    _stateStack: null,

    init: function(){
        this._state = Object.create(this.$class.StateProperties);
        this._stateStack = [];
    },

    save: function(){
        this._stateStack.push(this._state);
        this._state = JSCopy(this._state);
    },

    restore: function(){
        if (this._stateStack.length){
            this._state = this._stateStack.pop();
        }
    },

    // Paths

    beginPath: function(){
    },

    closePath: function(){
    },

    addArc: function(x, y, radius, startAngle, endAngle, clockwise){
    },

    addArcToPoint: function(x1, y1, x2, y2, radius){
    },

    addCurveToPoint: function(cp1x, cp1y, cp2x, cp2y, x, y){
    },

    addLineToPoint: function(x, y){
    },

    addQuadraticCurveToPoint: function(cpx, cpy, x, y){
    },

    addRect: function(rect){
    },

    moveToPoint: function(x, y){
    },

    addEllipseInRect: function(rect){
    },

    // Painting

    clearRect: function(rect){
    },

    drawPath: function(drawingMode){
    },

    eoFillPath: function(){
    },

    fillPath: function(){
    },

    fillRect: function(rect){
    },

    fillEllipseInRect: function(rect){
    },

    strokePath: function(){
    },

    strokeRect: function(rect){
    },

    strokeEllipseInRect: function(rect){
    },

    // Transforms

    scaleCTM: function(sx, sy){
    },

    rotateCTM: function(angle){
    },

    translateCTM: function(tx, ty){
    },

    concatCTM: function(transform){
    },

    // Images

    drawImage: function(rect, image){
    },

    drawLinearGradient: function(gradient, p1, p2){
    },

    drawRadialGradient: function(gradient, p1, r1, p2, r2){
    },

});

JSContext.LineCap = {
    Butt: 'butt',
    Round: 'round',
    Square: 'square'
};

JSContext.LineJoin = {
    Round: 'round',
    Bevel: 'bevel',
    Miter: 'miter'
};

JSContext.StateProperties = {
    alpha:          1.0,
    fillColor:      null,
    strokeColor:    null,
    lineWidth:      1.0,
    lineCap:        JSContext.LineCap.Butt,
    lineJoin:       JSContext.LineJoin.Miter,
    lineDash:       null,
    miterLimit:     null,
    shadowColor:    null,
    shadowOffset:   null,
    shadowBlur:     null
};

function JSContextLineDash(phase, segments){
    if (this === undefined){
        return new JSContextLineDash(phase, segments);
    }else{
        if (phase instanceof JSContextLineDash){
            this.phase = phase.phase;
            this.segments = phase.segments;
        }else{
            this.phase = phase;
            this.segments = segments;
        }
    }
}

JSContextLineDash.prototype = {
    phase: null,
    segments: null
};