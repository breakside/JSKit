// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #import "JSObject.js"
// #import "JSColor.js"
// #import "JSPath.js"
// #import "JSFont.js"
'use strict';

(function(){

JSClass("JSContext", JSObject, {

    // ----------------------------------------------------------------------
    // MARK: - Creating a Context

    init: function(){
        this.state = Object.create(this.$class.State);
        this.stack = [];
    },

    // ----------------------------------------------------------------------
    // MARK: - Constructing Paths

    path: null,

    createPath: function(){
        return JSPath.init();
    },

    /// Starts a new path, discarding any previous path
    beginPath: function(){
        this.path = this.createPath();
    },

    beginPathIfNeeded: function(){
        if (this.path === null){
            this.beginPath();
        }
    },

    moveToPoint: function(x, y){
        this.beginPathIfNeeded();
        this.path.moveToPoint(JSPoint(x, y), this.state.transform);
    },

    addLineToPoint: function(x, y){
        this.beginPathIfNeeded();
        this.path.addLineToPoint(JSPoint(x, y), this.state.transform);
    },

    addRect: function(rect){
        this.beginPathIfNeeded();
        this.path.addRect(rect, this.state.transform);
    },

    addRoundedRect: function(rect, cornerRadius){
        this.beginPathIfNeeded();
        this.path.addRoundedRect(rect, cornerRadius, this.state.transform);
    },

    addArc: function(center, radius, startAngle, endAngle, clockwise){
        this.beginPathIfNeeded();
        this.path.addArc(center, radius, startAngle, endAngle, clockwise, this.state.transform);
    },

    addArcUsingTangents: function(tangent1End, tangent2End, radius){
        this.beginPathIfNeeded();
        this.path.addArcUsingTangents(tangent1End, tangent2End, radius, this.state.transform);
    },

    addCurveToPoint: function(point, control1, control2){
        this.beginPathIfNeeded();
        this.path.addCurveToPoint(point, control1, control2, this.state.transform);
    },

    addQuadraticCurveToPoint: function(point, control){
        this.beginPathIfNeeded();
        // FIXME: not exactly a quadradic
        this.path.addCurveToPoint(point, control, point, this.state.transform);
    },

    addEllipseInRect: function(rect){
        this.beginPathIfNeeded();
        this.path.addEllipseInRect(rect, this.state.transform);
    },

    addPath: function(path){
        this.beginPathIfNeeded();
        var i, l;
        var j, k;
        var subpath;
        var segment;
        for (i = 0, l = path.subpaths.length; i < l; ++i){
            subpath = path.subpaths[i];
            this.moveToPoint(subpath.firstPoint.x, subpath.firstPoint.y);
            for (j = 0, k = subpath.segments.length; j < k; ++j){
                segment = subpath.segments[j];
                if (segment.type === JSPath.SegmentType.line){
                    this.addLineToPoint(segment.end.x, segment.end.y);
                }else if (segment.type === JSPath.SegmentType.curve){
                    this.addCurveToPoint(segment.curve.p2, segment.curve.cp1, segment.curve.cp2);
                }
            }
            if (subpath.closed){
                this.closePath();
            }
        }
    },

    closePath: function(){
        if (this.path !== null){
            this.path.closeSubpath();
        }
    },

    // ----------------------------------------------------------------------
    // MARK: - Drawing the Current Path

    drawPath: function(drawingMode){
        switch (drawingMode){
            case JSContext.DrawingMode.fill:
                break;
            case JSContext.DrawingMode.evenOddFill:
                break;
            case JSContext.DrawingMode.stroke:
                break;
            case JSContext.DrawingMode.fillStroke:
                break;
            case JSContext.DrawingMode.evenOddFillStroke:
                break;
        }
    },

    fillPath: function(fillRule){
        this.drawPath(fillRule === JSContext.FillRule.evenOdd ? JSContext.DrawingMode.evenOddFill : JSContext.DrawingMode.fill);
    },

    strokePath: function(){
        this.drawPath(JSContext.DrawingMode.stroke);
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

    drawLinearGradient: function(gradient, rect){
    },

    drawRadialGradient: function(gradient, rect, r0, r1){
    },

    // ----------------------------------------------------------------------
    // MARK: - Text

    setTextMatrix: function(textMatrix){
        this.state.textMatrix = JSAffineTransform(textMatrix);
    },

    setCharacterSpacing: function(spacing){
        this.state.characterSpacing = spacing;
    },

    setFont: function(font){
        this.state.font = font;
    },

    setTextDrawingMode: function(textDrawingMode){
        this.state.textDrawingMode = textDrawingMode;
    },

    showGlyphs: function(glyphs){
    },

    showText: function(text){
        var glyphs = this.state.font.glyphsForString(text);
        this.showGlyphs(glyphs);
    },

    // ----------------------------------------------------------------------
    // MARK: - Fill, Stroke, Shadow Colors

    setAlpha: function(alpha){
        this.state.alpha = alpha;
    },

    setFillColor: function(fillColor){
        this.state.fillColor = fillColor;
    },

    setStrokeColor: function(strokeColor){
        this.state.strokeColor = strokeColor;
    },

    setShadow: function(offset, blur, color){
        this.state.shadowOffset = JSPoint(offset);
        this.state.shadowBlur = blur;
        this.state.shadowColor = color;
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
        this.rotateBy(degrees / 180 * Math.PI);
    },

    translateBy: function(tx, ty){
        this.concatenate(JSAffineTransform.Translated(tx, ty));
    },

    concatenate: function(transform){
        this.state.transform = transform.concatenatedWith(this.state.transform);
    },

    // ----------------------------------------------------------------------
    // MARK: - Drawing Options

    setLineWidth: function(lineWidth){
        this.state.lineWidth = lineWidth;
    },

    setLineCap: function(lineCap){
        this.state.lineCap = lineCap;
    },

    setLineJoin: function(lineJoin){
        this.state.lineJoin = lineJoin;
    },

    setMiterLimit: function(miterLimit){
        this.state.miterLimit = miterLimit;
    },

    setLineDash: function(phase, lengths){
        this.state.lineDashPhase = phase;
        this.state.lineDashArray = JSCopy(lengths);
    },

    // ----------------------------------------------------------------------
    // MARK: - Graphics State

    state: null,
    stack: null,

    save: function(){
        this.stack.push(this.state);
        this.state = Object.create(this.state);
    },

    restore: function(){
        if (this.stack.length > 0){
            this.state = this.stack.pop();
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
    stroke: 1,
    fillStroke: 2
};

JSContext.ellipseCurveMagic = JSPath.ellipseCurveMagic;

JSContext.State = {

    transform: JSAffineTransform.Identity,

    alpha: 1,
    fillColor: JSColor.black,
    strokeColor: JSColor.black,

    lineWidth: 1.0,
    lineCap: JSContext.LineCap.butt,
    lineJoin: JSContext.LineJoin.miter,
    miterLimit: 10.0,
    lineDashArray: [],
    lineDashPhase: 0,

    shadowOffset: JSPoint.Zero,
    shadowBlur: 0,
    shadowColor: JSColor.black,

    font: null,
    textMatrix: JSAffineTransform.Identity,
    characterSpacing: 0,
    textDrawingMode: JSContext.TextDrawingMode.fill,

};

})();