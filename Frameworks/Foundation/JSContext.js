// #import "JSObject.js"
// #import "JSColor.js"
'use strict';

(function(){

JSClass("JSContext", JSObject, {

    // ----------------------------------------------------------------------
    // MARK: - Creating a Context

    init: function(){
    },

    // ----------------------------------------------------------------------
    // MARK: - Constructing Paths

    /// Starts a new path, discarding any previous path
    beginPath: function(){
        this._discardPath();
    },

    _discardPath: function(){
        this._clearPoints();
    },

    moveToPoint: function(x, y){
        this._rememberPoint(JSPoint(x, y));
    },

    addLineToPoint: function(x, y){
        this._rememberPoint(JSPoint(x, y));
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
        var magicRadius = JSContext.ellipseCurveMagic * cornerRadius;

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
        if (radius < 0){
            throw new Error("Negative radius not allowed in addArc");
        }

        // Start by either moving to or drawing a line to the starting ponit of the arc
        var p1 = JSPoint(center.x + radius * Math.cos(startAngle), center.y + radius * Math.sin(startAngle));
        if (this._lastPoint === null){
            this.moveToPoint(p1.x, p1.y);
        }else{
            this.addLineToPoint(p1.x, p1.y);
        }

        // If there's no radius, then there's nothing left to do
        if (radius === 0){
            return;
        }

        // Figure out how much of an angle we're going to draw
        var direction = clockwise ? 1 : -1;
        var sweep = direction * (endAngle - startAngle);

        // If the sweep is against the specified direction (negative), adjust it to be
        // the corresponding positive angle.  Note that a counter-direction
        // sweep can never result in an etire circle.
        while (sweep <= 0){
            sweep += TWO_PI;
        }

        // If the sweep is more than a complete circle, just make it a
        // complete circle since any more will overdraw.
        if (sweep > TWO_PI){
            sweep = TWO_PI;
        }

        // The arc points much easier to express in unit-circle coordinates,
        // so we'll make a transform that can convert from unit-circle coordinates
        // to our coordinates.  Note that we could instead encode the transform
        // directly into the context, but that would generate more instructions
        // (in a case such as PDF) and require the reader to do more calculations
        // on its end.
        var transform = JSAffineTransform.Identity;
        transform = transform.translatedBy(center.x, center.y);
        transform = transform.scaledBy(radius, radius);
        transform = transform.rotatedBy(startAngle);
        var p2;
        var c1;
        var c2;

        // Our arc algorithm handles angles less than 90 degrees.  For sweeps
        // greater than 90 degrees, we can do quarter-circles at a time using
        // the ellipse magic number until we're left with only a sweep less than 90.
        while (sweep >= HALF_PI){
            p2 = JSPoint(0, direction);
            c1 = JSPoint(1, direction * JSContext.ellipseCurveMagic);
            c2 = JSPoint(JSContext.ellipseCurveMagic, direction);
            this.addCurveToPoint(transform.convertPointFromTransform(p2), transform.convertPointFromTransform(c1), transform.convertPointFromTransform(c2));
            transform = transform.rotatedBy(direction * HALF_PI);
            sweep -= HALF_PI;
        }

        // If there's any < 90 degree sweep remaining, use the arc-specific
        // curve derivation.
        if (sweep > 0){
            // Derviation at https://www.tinaja.com/glib/bezcirc2.pdf
            transform = transform.rotatedBy(direction * sweep / 2);
            p2 = JSPoint(Math.cos(sweep / 2), direction * Math.sin(sweep / 2));
            c2 = JSPoint((4 - p2.x) / 3, ((1 - p2.x) * (3 - p2.x)) / (3 * p2.y));
            c1 = JSPoint(c2.x, -c2.y);
            this.addCurveToPoint(transform.convertPointFromTransform(p2), transform.convertPointFromTransform(c1), transform.convertPointFromTransform(c2));
        }
    },

    addArcUsingTangents: function(tangent1End, tangent2End, radius){
        // Bail if the raduis is negative
        if (radius <= 0){
            throw new Error("Negative radius not allowed in addArcUsingTangents");
        }

        // The tangent line logic expects there to be a starting point on the current subpath.
        // If there isn't one, add one at the first point given.
        // Note: this will cause an early exit because p0 and p1 will be the same
        // and making an arc requires three unique points in order to figure two
        // tangent lines.
        if (this._lastPoint === null){
            this._rememberPoint(tangent1End);
        }

        // Setup our three main points that create two interescting tangent lines
        var p0 = JSPoint(this._lastPoint);
        var p1 = JSPoint(tangent1End);
        var p2 = JSPoint(tangent2End);

        // If there's no radius, or if any two points are equal, we don't have
        // enough information to make an arc, so just make line to p1 and stop
        if (radius === 0 || p0.isEqual(p1) || p1.isEqual(p2)){
            this.addLineToPoint(p1.x, p1.y);
            return;
        }

        // Setup a couple vectors representing our two line directions
        var v1 = JSPoint(p1.x - p0.x, p1.y - p0.y);
        var v2 = JSPoint(p1.x - p2.x, p1.y - p2.y);

        // Use the vectors to figure slope and intercepts of our lines.
        // If all points are on the same line, the two slopes and intercepts
        // will be equivalent.  In this case, there's no angle in which to place
        // the circle/arc.  So just make a line to p1 and stop.
        var slope1 = v1.y / v1.x;
        var slope2 = v2.y / v2.x;
        var intercept1 = p1.y - p1.x * slope1;
        var intercept2 = p1.y - p1.x * slope2;
        if (slope1 == slope2 && intercept1 == intercept2){
            this.addLineToPoint(p1.x, p1.y);
            return;
        }

        // Figure out starting and ending angles, making them both positive for
        // uniformity.
        var a1 = Math.atan(slope1);
        if (a1 < 0){
            a1 += TWO_PI;
        }
        var a2 = Math.atan(slope2);
        if (a2 < 0){
            a2 += TWO_PI;
        }

        // By definition, the circle we draw will have a center that is exactly half way
        // through the angle formed by our tangent lines.  The angle can be found with a little
        // vector math (the dot product of the two vectors divided by the product of their magnitues
        // equals the cosine of the angle).
        var angleAtP1 = Math.acos((v1.x * v2.x + v1.y * v2.y) / (Math.sqrt(v1.x * v1.x + v1.y * v1.y) * Math.sqrt(v2.x * v2.x + v2.y * v2.y)));

        // Once we know the angle, we know there's a right triangle formed by p1, center, and either
        // tangent point.  Since we know the radius, simple trig
        var distanceFromP1ToCenter = radius / Math.sin(angleAtP1 / 2);
        var distanceFromP1ToEitherT = distanceFromP1ToCenter * Math.cos(angleAtP1 / 2);

        // Figure the tangent points and center point of the circle.
        // Because we started with an atan() call, which can't tell the difference between
        // mirrored angles, we do a check to see which side of p1 we're on, and add 180 degrees
        // if necesary.  Also, figure the start and end angles by adding or subtracting 90 degrees
        // from the tangent lines, again considering which way things are actually oriented.
        var t1, t2;
        if (p1.x >= p0.x){
            t1 = JSPoint(p1.x - distanceFromP1ToEitherT * Math.cos(a1), p1.y - distanceFromP1ToEitherT * Math.sin(a1));
        }else{
            t1 = JSPoint(p1.x - distanceFromP1ToEitherT * Math.cos(a1 + Math.PI), p1.y - distanceFromP1ToEitherT * Math.sin(a1 + Math.PI));
        }
        if (p1.x >= p2.x){
            t2 = JSPoint(p1.x - distanceFromP1ToEitherT * Math.cos(a2), p1.y - distanceFromP1ToEitherT * Math.sin(a2));
        }else{
            t2 = JSPoint(p1.x - distanceFromP1ToEitherT * Math.cos(a2 + Math.PI), p1.y - distanceFromP1ToEitherT * Math.sin(a2 + Math.PI));
        }

        // Figure the center point
        var center11, center12, center21, center22;
        center11 = JSPoint(t1.x + radius * Math.cos(a1 + HALF_PI), t1.y + radius * Math.sin(a1 + HALF_PI));
        center12 = JSPoint(t1.x + radius * Math.cos(a1 - HALF_PI), t1.y + radius * Math.sin(a1 - HALF_PI));
        center21 = JSPoint(t2.x + radius * Math.cos(a2 + HALF_PI), t2.y + radius * Math.sin(a2 + HALF_PI));
        center22 = JSPoint(t2.x + radius * Math.cos(a2 - HALF_PI), t2.y + radius * Math.sin(a2 - HALF_PI));

        var center, startAngle, endAngle;
        var min = center11.distanceToPoint(center21);
        center = center11;
        startAngle = a1 - HALF_PI;
        endAngle = a2 - HALF_PI;
        var d = center12.distanceToPoint(center21);
        if (d < min){
            min = d;
            center = center12;
            startAngle = a1 + HALF_PI;
            endAngle = a2 - HALF_PI;
        }
        d = center11.distanceToPoint(center22);
        if (d < min){
            min = d;
            center = center11;
            startAngle = a1 - HALF_PI;
            endAngle = a2 + HALF_PI;
        }
        d = center12.distanceToPoint(center22);
        if (d < min){
            min = d;
            center = center12;
            startAngle = a1 + HALF_PI;
            endAngle = a2 + HALF_PI;
        }

        // For debugging, draws the points, lines and circle, which helps show
        // where we think things are and why we're drawing an arc where we draw it.
        // this.save();
        // this.setLineWidth(0.5);
        // this.setStrokeColor(JSColor.initWithRGBA(0.9, 0.0, 0.0, 1.0));
        // this.strokeEllipseInRect(JSRect(center.x - radius, center.y - radius, radius * 2, radius * 2));
        // this.beginPath();
        // this.setLineWidth(0.75);
        // this.setStrokeColor(JSColor.initWithRGBA(0, 0, 0.9, 1.0));
        // this.moveToPoint(t1.x, t1.y);
        // this.addLineToPoint(p1.x, p1.y);
        // this.addLineToPoint(t2.x, t2.y);
        // this.strokePath();
        // this.beginPath();
        // this.setStrokeColor(JSColor.initWithRGBA(0.9, 0.0, 0.0, 1.0));
        // this.setLineWidth(0.5);
        // this.moveToPoint(p0.x, p0.y);
        // this.addLineToPoint(p1.x, p1.y);
        // this.addLineToPoint(p2.x, p2.y);
        // this.strokePath();
        // this.beginPath();
        // this.setFillColor(JSColor.initWithRGBA(0, 0, 0.9, 1.0));
        // this.fillEllipseInRect(JSRect(p0.x - 1.5, p0.y - 1.5, 3, 3));
        // this.setFillColor(JSColor.initWithRGBA(0, 0.9, 0.9, 1.0));
        // this.fillEllipseInRect(JSRect(p1.x - 1.5, p1.y - 1.5, 3, 3));
        // this.setFillColor(JSColor.initWithRGBA(0, 0.9, 0.0, 1.0));
        // this.fillEllipseInRect(JSRect(p2.x - 1.5, p2.y - 1.5, 3, 3));
        // this.setFillColor(JSColor.initWithRGBA(0.9, 0.0, 0.0, 1.0));
        // this.fillEllipseInRect(JSRect(t1.x - 1.5, t1.y - 1.5, 3, 3));
        // this.setFillColor(JSColor.initWithRGBA(0.9, 0.9, 0.0, 1.0));
        // this.fillEllipseInRect(JSRect(t2.x - 1.5, t2.y - 1.5, 3, 3));
        // this.setFillColor(JSColor.initWithRGBA(0.4, 0.4, 0.4, 1.0));
        // this.fillEllipseInRect(JSRect(center11.x - 1.5, center11.y - 1.5, 3, 3));
        // this.setFillColor(JSColor.initWithRGBA(0, 0, 0, 1.0));
        // this.fillEllipseInRect(JSRect(center12.x - 1.5, center12.y - 1.5, 3, 3));
        // this.setFillColor(JSColor.initWithRGBA(0.9, 0, 0, 1.0));
        // this.fillEllipseInRect(JSRect(center21.x - 0.5, center21.y - 0.5, 3, 3));
        // this.setFillColor(JSColor.initWithRGBA(0, 0, 0.9, 1.0));
        // this.fillEllipseInRect(JSRect(center22.x - 0.5, center22.y - 0.5, 3, 3));
        // this.restore();
        // this.beginPath();

        // Adjust our start and end angles and figure out if the shortest
        // distance is clockwise or counter clockwise.
        // Note: we could swap the angles and always arc in a fixed direction,
        // but I think it makes more sense to always arc from p0 to p2.
        if (startAngle < 0){
            startAngle += TWO_PI;
        }
        if (endAngle < 0){
            endAngle += TWO_PI;
        }
        var clockwise;
        if (startAngle > endAngle){
            clockwise = startAngle - endAngle >= Math.PI;
        }else{
            clockwise = endAngle - startAngle <= Math.PI;
        }
        this.moveToPoint(t1.x, t1.y);
        this.addArc(center, radius, startAngle, endAngle, clockwise);
    },

    addCurveToPoint: function(point, control1, control2){
        this._rememberPoint(point);
    },

    addQuadraticCurveToPoint: function(point, control){
        // FIXME: not exactly a quadradic
        this.addCurveToPoint(point, control, point);
    },

    addEllipseInRect: function(rect){
        var halfWidth = rect.size.width / 2.0;
        var halfHeight = rect.size.height / 2.0;
        var magic = JSContext.ellipseCurveMagic;
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

    fillMaskedRect: function(rect, maskImage){
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

    setTextMatrix: function(textMatrix){
    },

    setCharacterSpacing: function(spacing){
    },

    setFont: function(font){
    },

    setTextDrawingMode: function(textDrawingMode){
    },

    showGlyphs: function(glyphs){
    },

    showText: function(text){
    },

    // ----------------------------------------------------------------------
    // MARK: - Fill, Stroke, Shadow Colors

    setAlpha: function(alpha){
    },

    setFillColor: function(fillColor){
    },

    setStrokeColor: function(strokeColor){
    },

    setShadow: function(offset, blur, color){
    },

    // ----------------------------------------------------------------------
    // MARK: - Clipping

    clip: function(fillRule){
    },

    // ----------------------------------------------------------------------
    // MARK: - Transformations

    scaleBy: function(sx, sy){
        this.concatenate(JSAffineTransform.Scaled(sx, sy));
    },

    rotateBy: function(angle){
        this.concatenate(JSAffineTransform.Rotated(angle));
    },

    rotateByDegrees: function(degrees){
        this.rotate(degrees / 180 * Math.PI);
    },

    translateBy: function(tx, ty){
        this.concatenate(JSAffineTransform.Translated(tx, ty));
    },

    concatenate: function(transform){
    },

    // ----------------------------------------------------------------------
    // MARK: - Drawing Options

    setLineWidth: function(lineWidth){
    },

    setLineCap: function(lineCap){
    },

    setLineJoin: function(lineJoin){
    },

    setMiterLimit: function(miterLimit){
    },

    setLineDash: function(phase, lengths){
    },

    // ----------------------------------------------------------------------
    // MARK: - Graphics State

    save: function(){
    },

    restore: function(){
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
    stroke: 1,
    fillStroke: 2
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

var TWO_PI = Math.PI * 2;
var HALF_PI = Math.PI / 2;

// percentage between two points where a bezier control point should be placed
// in order to best approximate an ellipse, or circle in the ideal case.
// Derivation at https://www.tinaja.com/glib/ellipse4.pdf
JSContext.ellipseCurveMagic = 0.551784;

})();