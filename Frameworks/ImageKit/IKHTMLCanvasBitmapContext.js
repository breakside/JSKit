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

// #import "IKBitmapContext.js"
// #import "IKBitmap.js"
'use strict';

(function(){

JSClass("IKHTMLCanvasBitmapContext", IKBitmapContext, {

    canvasElement: null,
    canvasContext: null,
    state: null,
    stack: null,

    // ----------------------------------------------------------------------
    // MARK: - Creating a Context

    initWithDocument: function(document, pixelSize){
        IKHTMLCanvasBitmapContext.$super.initWithPixelSize(pixelSize);
        this.canvasElement = document.createElement("canvas");
        this.canvasElement.width = this.size.width;
        this.canvasElement.height = this.size.height;
        this.canvasContext = this.canvasElement.getContext('2d');
        this.stack = [];
        this.state = Object.create(StatePrototype);
    },

    bitmap: function(){
        var imageData = this.canvasContext.getImageData(0, 0, this.size.width, this.size.height);
        var bitmap = IKBitmap.initWithData(imageData, this.size);
        return bitmap;
    },

    image: function(scale){
        var bitmap = this.bitmap();
        var png = bitmap.encodedData(IKBitmap.Format.png);
        var image = JSImage.initWithData(png, this.size, scale);
        return image;
    },

    // ----------------------------------------------------------------------
    // MARK: - Constructing Paths

    _currentPath: null,

    /// Starts a new path, discarding any previous path
    beginPath: function(){
        this.canvasContext.beginPath();
        this._currentPath = [];
    },

    _discardPath: function(){
        this._currentPath = null;
    },

    moveToPoint: function(x, y){
        this.canvasContext.moveTo(x, y);
        this._currentPath.push({method: this.canvasContext.moveTo, arguments: [x, y]});
    },

    addLineToPoint: function(x, y){
        this.canvasContext.lineTo(x, y);
        this._currentPath.push({method: this.canvasContext.lineTo, arguments: [x, y]});
    },

    addRect: function(rect){
        this.canvasContext.rect(rect.origin.x, rect.origin.y, rect.size.width, rect.size.height);
        this._currentPath.push({method: this.canvasContext.rect, arguments: [rect.origin.x, rect.origin.y, rect.size.width, rect.size.height]});
    },

    addArc: function(center, radius, startAngle, endAngle, clockwise){
        this.canvasContext.arc(center.x, center.y, radius, startAngle, endAngle, !clockwise);
        this._currentPath.push({method: this.canvasContext.arc, arguments: [center.x, center.y, radius, startAngle, endAngle, !clockwise]});
    },

    addArcUsingTangents: function(tangent1End, tangent2End, radius){
        this.canvasContext.arcTo(tangent1End.x, tangent1End.y, tangent2End.x, tangent2End.y, radius);
        this._currentPath.push({method: this.canvasContext.arcTo, arguments: [tangent1End.x, tangent1End.y, tangent2End.x, tangent2End.y, radius]});
    },

    addCurveToPoint: function(point, control1, control2){
        this.canvasContext.bezierCurveTo(control1.x, control1.y, control2.x, control2.y, point.x, point.y);
        this._currentPath.push({method: this.canvasContext.bezierCurveTo, arguments: [control1.x, control1.y, control2.x, control2.y, point.x, point.y]});
    },

    addQuadraticCurveToPoint: function(point, control){
        this.canvasContext.quadraticCurveTo(control.x, control.y, point.x, point.y);
        this._currentPath.push({method: this.canvasContext.quadraticCurveTo, arguments: [control.x, control.y, point.x, point.y]});
    },

    closePath: function(){
        this.canvasContext.closePath();
        this._currentPath.push({method: this.canvasContext.closePath, arguments: []});
    },

    // ----------------------------------------------------------------------
    // MARK: - Drawing the Current Path

    drawPath: function(drawingMode){
        switch (drawingMode){
            case JSContext.DrawingMode.fill:
                this.canvasContext.fill();
                break;
            case JSContext.DrawingMode.evenOddFill:
                this.canvasContext.fill('evenodd');
                break;
            case JSContext.DrawingMode.stroke:
                this.canvasContext.stroke();
                break;
            case JSContext.DrawingMode.fillStroke:
                this.canvasContext.fill();
                this.canvasContext.stroke();
                break;
            case JSContext.DrawingMode.evenOddFillStroke:
                this.canvasContext.fill('evenodd');
                this.canvasContext.stroke();
                break;
        }
        this.beginPath();
    },

    fillPath: function(fillRule){
        if (fillRule == JSContext.FillRule.evenOdd){
            this.canvasContext.fill('evenodd');
        }else{
            this.canvasContext.fill();
        }
        this.beginPath();
    },

    strokePath: function(){
        this.canvasContext.stroke();
        this.beginPath();
    },

    // ----------------------------------------------------------------------
    // MARK: - Drawing Shapes

    clearRect: function(rect){
        this.canvasContext.clearRect(rect.origin.x, rect.origin.y, rect.size.width, rect.size.height);
        this.beginPath();
    },

    fillRect: function(rect){
        this.canvasContext.fillRect(rect.origin.x, rect.origin.y, rect.size.width, rect.size.height);
        this.beginPath();
    },

    fillMaskedRect: function(rect, maskImage){
        var maskCanvas = this.canvasElement.ownerDocument.createElement("canvas");
        maskCanvas.width = maskImage.size.width;
        maskCanvas.height = maskImage.size.height;
        var maskContext = maskCanvas.getContext('2d');
        maskContext.fillStyle = this.canvasContext.fillStyle;
        maskContext.fillRect(0, 0, maskImage.size.width, maskImage.size.height);
        maskContext.globalCompositeOperation = 'destination-in';
        this._drawImageToCanvasContext(maskImage.htmlURLString(), JSRect(JSPoint.Zero, maskImage.size), maskContext);
        this.canvasContext.drawImage(maskCanvas, rect.origin.x, rect.origin.y, rect.size.width, rect.size.height);
    },

    strokeRect: function(rect){
        this.canvasContext.strokeRect(rect.origin.x, rect.origin.y, rect.size.width, rect.size.height);
        this.beginPath();
    },

    // ----------------------------------------------------------------------
    // MARK: - Images

    drawImage: function(image, rect){
        this._drawImageToCanvasContext(image.htmlURLString(), rect, this.canvasContext);
    },

    drawBitmap: function(bitmap, rect){
        var png = bitmap.encodedData(IKBitmap.Format.png);
        this._drawImageToCanvasContext("data:image/png;base64," + png.base64StringRepresentation(), rect, this.canvasContext);
        // this.save();
        // this.scaleBy(bitmap.size.width / rect.size.width, bitmap.size.height  / rect.size.height);
        // var r, g, b, a;
        // var square = JSRect(0, 0, 1, 1);
        // for (var i = 0; square.origin.y < bitmap.size.height; ++square.origin.y){
        //     for (; square.origin.x < bitmap.size.width; ++square.origin.x){
        //         r = bitmap.data[i++] / 255.0;
        //         g = bitmap.data[i++] / 255.0;
        //         b = bitmap.data[i++] / 255.0;
        //         a = bitmap.data[i++] / 255.0;
        //         this.canvasContext.setFillColor(JSColor.initWithRGBA(r, g, b, a));
        //         this.canvasContext.fillRect(square);
        //     }
        // }
        // this.restore();
    },

    _drawImageToCanvasContext: function(src, rect, canvasContext){
        var imgElement = this.canvasElement.ownerDocument.createElement('img');
        imgElement.src = src;
        // FIXME: doesn't work because the image hasn't loaded yet
        canvasContext.drawImage(imgElement, rect.origin.x, rect.origin.y, rect.size.width, rect.size.height);
    },

    // ----------------------------------------------------------------------
    // MARK: - Gradients

    drawLinearGradient: function(gradient, start, end){
        var canvasGradient = this.canvasContext.createLineralGradient(start.x, start.y, end.x, end.y);
        var stop;
        for (var i = 0, l = gradient.stops.length; i < l; ++i){
            stop = gradient.stops[i];
            canvasGradient.addColorStop(stop.position, stop.color.cssString());
        }
        this.canvasContext.save();
        this.canvasContext.fillStyle = canvasGradient;
        // TODO: what do we fill?
        this.canvasContext.restore();
    },

    drawRadialGradient: function(gradient, startCenter, startRadius, endCenter, endRadius){
        // TODO:
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
        this.canvasContext.font = font ? font.cssString() : "";
    },

    setTextDrawingMode: function(textDrawingMode){
        this.state.textDrawingMode = textDrawingMode;
    },

    showGlyphs: function(glyphs){
        var tm = this.state.textMatrix;
        var width;
        var glyph;
        var text;
        var font = this.state.font;
        this.save();
        this.setLineWidth(this.canvasContext.lineWidth / Math.abs(tm.d));
        this.concatenate(tm);
        for (var i = 0, l = glyphs.length; i < l; ++i){
            glyph = glyphs[i];
            text = font.stringForGlyphs([glyph]);
            if (this.state.textDrawingMode == JSContext.TextDrawingMode.fill || this.state.textDrawingMode == JSContext.TextDrawingMode.fillStroke){
                this.canvasContext.fillText(text, 0, 0);
            }
            if (this.state.textDrawingMode == JSContext.TextDrawingMode.stroke || this.state.textDrawingMode == JSContext.TextDrawingMode.fillStroke){
                this.canvasContext.strokeText(text, 0, 0);
            }
            width = font.widthOfGlyph(glyph) + this.state.characterSpacing;
            this.translateBy(width, 0);
        }
        this.restore();
    },

    showText: function(text){
        // If there's a non-zero character spacing specified, we can't use
        // canvasContext.fillText, because Canvas2D has no way of specifying
        // character spacing.  So, we'll use showGlyphs to paint glyph by
        // glyph.
        //
        // Disabled until we have the font cmap stuff working correctly for pdf fonts
        if (this.state.characterSpacing !== 0){
            this._showSpacedText(text);
            return;
        }

        // If character spacing is zero, then it's far more effient to just paint
        // the text we were given all at once.
        var tm = this.state.textMatrix;
        var nonIdentityMatrix = !tm.isIdentity;
        if  (nonIdentityMatrix){
            // Canvas2D doens't have a concept of a text transform, so we'll just
            // add it to the base transform.
            // - Be sure to adjust the lineWidth for the new scale
            this.save();
            this.setLineWidth(this.canvasContext.lineWidth / Math.abs(tm.d));
            this.concatenate(tm);
        }
        if (this.state.textDrawingMode == JSContext.TextDrawingMode.fill || this.state.textDrawingMode == JSContext.TextDrawingMode.fillStroke){
            this.canvasContext.fillText(text, 0, 0);
        }
        if (this.state.textDrawingMode == JSContext.TextDrawingMode.stroke || this.state.textDrawingMode == JSContext.TextDrawingMode.fillStroke){
            this.canvasContext.strokeText(text, 0, 0);
        }
        // Debugging
        // this.canvasContext.save();
        // this.setFillColor(JSColor.initWithRGBA(1,0,0,0.4));
        // this.fillRect(JSRect(0, -this.state.font.ascender, this.state.font.lineHeight, this.state.font.lineHeight));
        // this.canvasContext.restore();
        if (nonIdentityMatrix){
            this.restore();
        }
    },

    _showSpacedText: function(text){
        var tm = this.state.textMatrix;
        var width;
        var font = this.state.font;
        this.save();
        this.setLineWidth(this.canvasContext.lineWidth / Math.abs(tm.d));
        this.concatenate(tm);
        var iterator = text.unicodeIterator();
        while (iterator.character !== null){
            if (this.state.textDrawingMode == JSContext.TextDrawingMode.fill || this.state.textDrawingMode == JSContext.TextDrawingMode.fillStroke){
                this.canvasContext.fillText(iterator.character.utf16, 0, 0);
            }
            if (this.state.textDrawingMode == JSContext.TextDrawingMode.stroke || this.state.textDrawingMode == JSContext.TextDrawingMode.fillStroke){
                this.canvasContext.strokeText(iterator.character.utf16, 0, 0);
            }
            width = font.widthOfCharacter(iterator.character) + this.state.characterSpacing;
            this.translateBy(width, 0);
            iterator.increment();
        }
        this.restore();
    },

    // ----------------------------------------------------------------------
    // MARK: - Fill, Stroke, Shadow Colors

    getAlpha: function(){
        return this.canvasContext.globalAlpha;
    },

    setAlpha: function(alpha){
        this.canvasContext.globalAlpha = alpha;
    },

    setFillColor: function(fillColor){
        this.canvasContext.fillStyle = fillColor ? fillColor.cssString() : '';
    },

    setStrokeColor: function(strokeColor){
        this.canvasContext.strokeStyle = strokeColor ? strokeColor.cssString() : '';
    },

    setShadow: function(offset, blur, color){
        this.canvasContext.shadowOffsetX = offset.x;
        this.canvasContext.shadowOffsetY = offset.y;
        this.canvasContext.shadowBlur = blur * this.deviceScale;
        this.canvasContext.shadowColor = color ? color.cssString() : '';
    },

    // ----------------------------------------------------------------------
    // MARK: - Clipping

    clip: function(fillRule){
        if (fillRule == JSContext.FillRule.evenOdd){
            this.canvasContext.clip('evenodd');
        }else{
            this.canvasContext.clip();
        }
        this.beginPath();
    },

    // ----------------------------------------------------------------------
    // MARK: - Transformations

    scaleBy: function(sx, sy){
        this.canvasContext.scale(sx, sy);
    },

    rotateBy: function(angle){
        this.canvasContext.rotate(angle);
    },

    translateBy: function(tx, ty){
        this.canvasContext.translate(tx, ty);
    },

    concatenate: function(transform){
        this.canvasContext.transform(transform.a, transform.b, transform.c, transform.d, transform.tx, transform.ty);
    },

    // ----------------------------------------------------------------------
    // MARK: - Drawing Options

    setLineWidth: function(lineWidth){
        this.canvasContext.lineWidth = lineWidth;
    },

    setLineCap: function(lineCap){
        this.canvasContext.lineCap = lineCap;
    },

    setLineJoin: function(lineJoin){
        this.canvasContext.lineJoin = lineJoin;
    },

    setMiterLimit: function(miterLimit){
        this.canvasContext.miterLimit = miterLimit;
    },

    setLineDash: function(phase, lengths){
        this.canvasContext.lineDashOffset = phase;
        this.canvasContext.setLineDash(lengths);
    },

    // ----------------------------------------------------------------------
    // MARK: - Graphics State

    save: function(){
        this.canvasContext.save();
        this.stack.push(this.state);
        this.state = Object.create(this.state);
    },

    restore: function(){
        this.canvasContext.restore();
        if (this.stack.length > 0){
            this.state = this.stack.pop();
        }
    },

});

var StatePrototype = {
    font: null,
    textMatrix: JSAffineTransform.Identity,
    characterSpacing: 0,
    textDrawingMode: JSContext.TextDrawingMode.fill,
};

})();