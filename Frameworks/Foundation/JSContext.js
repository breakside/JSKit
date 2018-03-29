// #import "Foundation/JSObject.js"
// #import "Foundation/JSColor.js"
/* global JSClass, JSObject, JSDynamicProperty, JSAffineTransform, JSPoint, JSColor, JSContext, JSCustomProperty */
'use strict';

function StateProperty(){
    if (this === undefined){
        return new StateProperty();
    }
}

StateProperty.prototype = Object.create(JSCustomProperty.prototype);

StateProperty.prototype.define = function(C, publicKey, extensions){
    var setterName = C.nameOfSetMethodForKey(publicKey);
    var getter = function JSContext_getStateProperty(){
        return this._state[publicKey];
    };
    var setter = function JSContext_setStateProperty(value){
        this._state[publicKey] = value;
    };
    getter._JSCustomProperty = this;
    getter._JSCustomPropertyKey = publicKey;
    setter._JSCustomProperty = this;
    setter._JSCustomPropertyKey = publicKey;
    Object.defineProperty(C.prototype, setterName, {
        configurable: true,
        enumerable: false,
        value: setter
    });
    Object.defineProperty(C.prototype, publicKey, {
        configurable: true,
        enumerable: false,
        set: setter,
        get: getter
    });
};

JSClass("JSContext", JSObject, {

    // ----------------------------------------------------------------------
    // MARK: - Creating a Context

    init: function(){
        this._state = Object.create(this.$class.StateProperties);
        this._stateStack = [];
    },

    // ----------------------------------------------------------------------
    // MARK: - Constructing Paths

    beginPath: function(){
    },

    moveToPoint: function(point){
    },

    addLineToPoint: function(point){
    },

    addRect: function(rect){
        this.moveToPoint(rect.origin.x, rect.origin.y);
        this.addLineToPoint(rect.origin.x + rect.size.width, rect.origin.y);
        this.addLineToPoint(rect.origin.x + rect.size.width, rect.origin.y + rect.size.height);
        this.addLineToPoint(rect.origin.x, rect.origin.y + rect.size.height);
        this.closePath();
    },

    addRoundedRect: function(rect, cornerRadius){
        if (cornerRadius <= 0){
            this.addRect(rect);
            return;
        }
        var halfWidth = rect.size.width / 2;
        var halfHeight = rect.size.height / 2;
        if (cornerRadius > halfWidth){
            cornerRadius = halfWidth;
        }
        if (cornerRadius > halfHeight){
            cornerRadius = halfHeight;
        }
        var magic = 0.551784;
        var magicRadius = magic * cornerRadius;

        var p1 = JSPoint(rect.origin.x, rect.origin.y + cornerRadius);
        var p2 = JSPoint(rect.origin.x + cornerRadius, rect.origin.y);
        var cp1 = JSPoint(p1.x, p1.y - magicRadius);
        var cp2 = JSPoint(p2.x - magicRadius, p2.y);
        this.moveToPoint(p1.x, p1.y);
        this.addCurveToPoint(p2, cp1, cp2);

        p1 = JSPoint(rect.origin.x + rect.size.width - cornerRadius, rect.origin.y);
        p2 = JSPoint(rect.origin.x + rect.size.width, rect.origin.y + cornerRadius);
        cp1 = JSPoint(p1.x + magicRadius, p1.y);
        cp2 = JSPoint(p2.x, p2.y - magicRadius);
        this.addLineToPoint(p1.x, p1.y);
        this.addCurveToPoint(p2, cp1, cp2);

        p1 = JSPoint(rect.origin.x + rect.size.width, rect.origin.y + rect.size.height - cornerRadius);
        p2 = JSPoint(rect.origin.x + rect.size.width - cornerRadius, rect.origin.y + rect.size.height);
        cp1 = JSPoint(p1.x, p1.y + magicRadius);
        cp2 = JSPoint(p2.x + magicRadius, p2.y);
        this.addLineToPoint(p1.x, p1.y);
        this.addCurveToPoint(p2, cp1, cp2);

        p1 = JSPoint(rect.origin.x + cornerRadius, rect.origin.y + rect.size.height);
        p2 = JSPoint(rect.origin.x, rect.origin.y + rect.size.height - cornerRadius);
        cp1 = JSPoint(p1.x - magicRadius, p1.y);
        cp2 = JSPoint(p2.x, p2.y + magicRadius);
        this.addLineToPoint(p1.x, p1.y);
        this.addCurveToPoint(p2, cp1, cp2);

        this.closePath();
    },

    addArc: function(center, radius, startAngle, endAngle, clockwise){
    },

    addArcUsingTangents: function(tangent1End, tangent2End, radius){
        // TODO: calculate appropriate values and call addArc
        // TODO: need to know current position
    },

    addCurveToPoint: function(point, control1, control2){
    },

    addQuadraticCurveToPoint: function(point, control){
        this.addCurveToPoint(point, control, point);
    },

    addEllipseInRect: function(rect){
        var halfWidth = rect.size.width / 2.0;
        var halfHeight = rect.size.height / 2.0;
        var magic = 0.551784;
        var magicWidth = magic * halfWidth;
        var magicHeight = magic * halfHeight;
        var p1 = JSPoint(rect.origin.x + halfWidth, rect.origin.y);
        var p2 = JSPoint(rect.origin.x + rect.size.width, rect.origin.y + halfHeight);
        var p3 = JSPoint(rect.origin.x + halfWidth, rect.origin.y + rect.size.height);
        var p4 = JSPoint(rect.origin.x, rect.origin.y + halfHeight);
        var cp1 = JSPoint(p1.x + magicWidth, p1.y);
        var cp2 = JSPoint(p2.x, p2.y - magicHeight);
        var cp3 = JSPoint(p2.x, p2.y + magicHeight);
        var cp4 = JSPoint(p3.x + magicWidth, p3.y);
        var cp5 = JSPoint(p3.x - magicWidth, p3.y);
        var cp6 = JSPoint(p4.x, p4.y + magicHeight);
        var cp7 = JSPoint(p4.x, p4.y - magicHeight);
        var cp8 = JSPoint(p1.x - magicWidth, p1.y);
        this.moveToPoint(p1.x, p1.y);
        this.addCurveToPoint(p2, cp1, cp2);
        this.addCurveToPoint(p3, cp3, cp4);
        this.addCurveToPoint(p4, cp5, cp6);
        this.addCurveToPoint(p1, cp7, cp8);
        this.closePath();
    },

    closePath: function(){
    },

    // ----------------------------------------------------------------------
    // MARK: - Drawing the Current Path

    drawPath: function(drawingMode){
        switch (drawingMode){
            case JSContext.DrawingMode.fill:
                this.fillPath(JSContext.FillRule.winding);
                break;
            case JSContext.DrawingMode.evenOddFill:
                this.fillPath(JSContext.FillRule.evenOdd);
                break;
            case JSContext.DrawingMode.stroke:
                this.strokePath();
                break;
            case JSContext.DrawingMode.fillStroke:
                this.fillPath(JSContext.FillRule.winding);
                this.strokePath();
                break;
            case JSContext.DrawingMode.evenOddFillStroke:
                this.fillPath(JSContext.FillRule.evenOdd);
                this.strokePath();
                break;
        }
    },

    fillPath: function(fillRule){
    },

    strokePath: function(){
    },

    // ----------------------------------------------------------------------
    // MARK: - Drawing Shapes

    clearRect: function(rect){
    },

    fillRect: function(rect){
        this.beginPath();
        this.addRect(rect);
        this.fillPath(JSContext.FillRule.winding);
    },

    fillRoundedRect: function(rect, cornerRadius){
        this.beginPath();
        this.addRoundedRect(rect, cornerRadius);
        this.fillPath(JSContext.FillRule.winding);
    },

    fillEllipseInRect: function(rect){
        this.beginPath();
        this.addEllipseInRect(rect);
        this.fillPath(JSContext.FillRule.winding);
    },

    strokeRect: function(rect){
        this.beginPath();
        this.addRect(rect);
        this.strokePath();
    },

    strokeRoundedRect: function(rect, cornerRadius){
        this.beginPath();
        this.addRoundedRect(rect, cornerRadius);
        this.strokePath();
    },

    strokeEllipseInRect: function(rect){
        this.beginPath();
        this.addEllipseInRect(rect);
        this.strokePath();
    },

    // ----------------------------------------------------------------------
    // MARK: - Images

    drawImage: function(image, rect){
    },

    // ----------------------------------------------------------------------
    // MARK: - Gradients

    drawLinearGradient: function(gradient, start, end){
    },

    drawRadialGradient: function(gradient, startCenter, startRadius, endCenter, endRadius){
    },

    // ----------------------------------------------------------------------
    // MARK: - Text

    textMatrix: JSDynamicProperty('_textMatrix', null),
    textPosition: JSDynamicProperty('_textPosition', null),

    setFont: function(font){
    },

    setTextDrawingMode: function(textDrawingMode){
    },

    showGlyphs: function(glyphs, points){
    },

    // ----------------------------------------------------------------------
    // MARK: - Fill, Stroke, Shadow Colors

    alpha: StateProperty(),

    fillColor: StateProperty(),

    strokeColor: StateProperty(),

    setShadow: function(offset, blur, color){
    },

    // ----------------------------------------------------------------------
    // MARK: - Clipping

    clip: function(fillRule){
    },

    // ----------------------------------------------------------------------
    // MARK: - Transformations

    transformationMatrix: StateProperty(),

    scaleBy: function(sx, sy){
        this.transformationMatrix = this.transformationMatrix.scaledBy(sx, sy);
    },

    rotateBy: function(angle){
        this.transformationMatrix = this.transformationMatrix.rotatedBy(angle);
    },

    rotateByDegrees: function(degrees){
        this.transformationMatrix = this.transformationMatrix.rotatedByDegrees(degrees);
    },

    translateBy: function(tx, ty){
        this.transformationMatrix = this.transformationMatrix.translatedBy(tx, ty);
    },

    concatenate: function(transform){
        this.transformationMatrix = this.transformationMatrix.concatenatedWith(transform);
    },

    // ----------------------------------------------------------------------
    // MARK: - Drawing Options

    lineWidth:      StateProperty(),

    lineCap:        StateProperty(),

    lineJoin:       StateProperty(),

    miterLimit:     StateProperty(),

    setLineDash: function(phase, lengths){
    },

    // ----------------------------------------------------------------------
    // MARK: - Graphics State

    _stateStack: null,

    save: function(){
        this._stateStack.push(this._state);
        this._state = Object.create(this._state);
    },

    restore: function(){
        if (this._stateStack.length){
            this._state = this._stateStack.pop();
        }
    },

});

JSContext.LineCap = {
    butt: 'butt',
    round: 'round',
    square: 'square'
};

JSContext.LineJoin = {
    round: 'round',
    bevel: 'bevel',
    miter: 'miter'
};

JSContext.FillRule = {
    winding: 0,
    evenOdd: 1
};

JSContext.DrawingMode = {
    fill: 0,
    evenOddFill: 1,
    stroke: 2,
    fillStroke: 3,
    evenOddFillStroke: 4
};

JSContext.TextDrawingMode = {
    fill: 0,
    stroke: 1
};

JSContext.StateProperties = {
    alpha:                  1.0,
    fillColor:              JSColor.blackColor(),
    strokeColor:            JSColor.blackColor(),
    transformationMatrix:   JSAffineTransform.Identity,
    lineWidth:              1.0,
    lineCap:                JSContext.LineCap.butt,
    lineJoin:               JSContext.LineJoin.miter,
    miterLimit:             10.0
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