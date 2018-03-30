// #import "Foundation/JSObject.js"
// #import "Foundation/JSColor.js"
/* global JSClass, JSObject, JSDynamicProperty, JSAffineTransform, JSPoint, JSColor, JSContext, JSCustomProperty */
'use strict';

(function(){

var TWO_PI = Math.PI * 2;
var HALF_PI = Math.PI / 2;
var CIRCLE_CURVE_MAGIC = 0.551784;

function StateProperty(){
    if (this === undefined){
        return new StateProperty();
    }
}

StateProperty.prototype = Object.create(JSCustomProperty.prototype);

StateProperty.prototype.define = function(C, publicKey, extensions){
    var getterName = C.nameOfGetMethodForKey(publicKey);
    var setterName = C.nameOfSetMethodForKey(publicKey);
    var getter = extensions[getterName];
    if (!getter){
        getter = function JSContext_getStateProperty(){
            return this._state[publicKey];
        };
    }
    var setter = extensions[setterName];
    if (!setter){
        setter = function JSContext_setStateProperty(value){
            this._state[publicKey] = value;
        };   
    }
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
        this._clearPoints();
    },

    moveToPoint: function(point){
        this._rememberPoint(point);
    },

    addLineToPoint: function(point){
        this._rememberPoint(point);
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
        var magicRadius = CIRCLE_CURVE_MAGIC * cornerRadius;

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
        if (radius === 0){
            return;
        }
        var p1 = JSPoint(center.x + radius * Math.cos(startAngle), center.y + radius * Math.sin(startAngle));
        this.moveToPoint(p1.x, p1.y);
        if (startAngle === endAngle){
            return;
        }
        if (clockwise){
            this._addClockwiseArc(center, radius, startAngle, startAngle - endAngle);
        }else{
            this._addAntiClockwiseArc(center, radius, startAngle, endAngle - startAngle);
        }
    },

    _addClockwiseArc: function(center, radius, startAngle, sweep){
        if (sweep <= -TWO_PI || sweep > TWO_PI){
            sweep = TWO_PI;
        }else if (sweep <= 0){
            sweep += TWO_PI;
        }
        var transform = JSAffineTransform.Identity;
        transform = transform.translatedBy(center.x, center.y);
        transform = transform.scaledBy(radius, radius);
        transform = transform.rotatedBy(startAngle);
        var p2;
        var c1;
        var c2;
        while (sweep >= HALF_PI){
            p2 = JSPoint(0, -1);
            c1 = JSPoint(1, -CIRCLE_CURVE_MAGIC);
            c2 = JSPoint(CIRCLE_CURVE_MAGIC, -1);
            this.addCurveToPoint(transform.convertPointFromTransform(p2), transform.convertPointFromTransform(c1), transform.convertPointFromTransform(c2));
            transform = transform.rotatedBy(-HALF_PI);
            sweep -= HALF_PI;
        }
        if (sweep > 0){
            transform = transform.rotatedBy(-sweep / 2);
            p2 = JSPoint(Math.cos(sweep / 2), -Math.sin(sweep / 2));
            c2 = JSPoint((4 - p2.x) / 3, ((1 - p2.x) * (3 - p2.x)) / (3 * p2.y));
            c1 = JSPoint(c2.x, -c2.y);
            this.addCurveToPoint(transform.convertPointFromTransform(p2), transform.convertPointFromTransform(c1), transform.convertPointFromTransform(c2));
        }
    },

    _addAntiClockwiseArc: function(center, radius, startAngle, sweep){
        if (sweep <= -TWO_PI || sweep > TWO_PI){
            sweep = TWO_PI;
        }else if (sweep <= 0){
            sweep += TWO_PI;
        }
        var transform = JSAffineTransform.Identity;
        transform = transform.translatedBy(center.x, center.y);
        transform = transform.scaledBy(radius, radius);
        transform = transform.rotatedBy(startAngle);
        var p2;
        var c1;
        var c2;
        while (sweep >= HALF_PI){
            p2 = JSPoint(0, 1);
            c1 = JSPoint(1, CIRCLE_CURVE_MAGIC);
            c2 = JSPoint(CIRCLE_CURVE_MAGIC, 1);
            this.addCurveToPoint(transform.convertPointFromTransform(p2), transform.convertPointFromTransform(c1), transform.convertPointFromTransform(c2));
            transform = transform.rotatedBy(HALF_PI);
            sweep -= HALF_PI;
        }
        if (sweep > 0){
            transform = transform.rotatedBy(sweep / 2);
            p2 = JSPoint(Math.cos(sweep / 2), Math.sin(sweep / 2));
            c2 = JSPoint((4 - p2.x) / 3, ((1 - p2.x) * (3 - p2.x)) / (3 * p2.y));
            c1 = JSPoint(c2.x, -c2.y);
            this.addCurveToPoint(transform.convertPointFromTransform(p2), transform.convertPointFromTransform(c1), transform.convertPointFromTransform(c2));
        }
    },

    addArcUsingTangents: function(tangent1End, tangent2End, radius){
        if (this._lastPoint === null){
            this._rememberPoint(tangent1End);
        }
        var p0 = JSPoint(this._lastPoint);
        var p1 = JSPoint(tangent1End);
        var p2 = JSPoint(tangent2End);

        if (radius === 0 || p0.isEqual(p1) || p1.isEqual(p2)){
            this.addLineToPoint(p1.x, p1.y);
            return;
        }

        if ((p0.x == p1.x == p2.x) || (p0.y == p1.y == p2.y)){
            this.addLineToPoint(p1.x, p1.y);
            return;
        }

        // TODO: calculate values
        var startAngle;
        var endAngle;
        var center;
        this.addArc(center, radius, startAngle, endAngle, false);
    },

    addCurveToPoint: function(point, control1, control2){
        this._rememberPoint(point);
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
        if (this._firstPoint !== null){
            this._rememberPoint(this._firstPoint);
        }
    },

    _firstPoint: null,
    _lastPoint: null,

    _clearPoints: function(){
        this._firstPoint = null;
        this._lastPoint = null;
    },

    _rememberPoint: function(point){
        if (this._firstPoint === null){
            this._firstPoint = JSPoint(point);
        }
        this._lastPoint = JSPoint(point);
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

})();