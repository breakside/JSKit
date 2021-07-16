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

JSClass("IKNodeBitmapContext", IKBitmapContext, {

    data: null,
    state: null,
    stack: null,

    // ----------------------------------------------------------------------
    // MARK: - Creating a Context

    initWithDocument: function(document, pixelSize){
        IKNodeBitmapContext.$super.initWithPixelSize(pixelSize);
        this.data = JSData.initWithLength(pixelSize.width * pixelSize.height * 4);
    },

    bitmap: function(completion, target){
        var bitmap = IKBitmap.initWithData(this.data, this.size);
        return bitmap;
    },

    // ----------------------------------------------------------------------
    // MARK: - Drawing the Current Path

    drawPath: function(drawingMode){
        switch (drawingMode){
            case JSContext.DrawingMode.fill:
                this._fillPath(this.path, this.state, JSContext.FillRule.winding);
                break;
            case JSContext.DrawingMode.evenOddFill:
                this._fillPath(this.path, this.state, JSContext.FillRule.evenOdd);
                break;
            case JSContext.DrawingMode.stroke:
                this._strokePath(this.path, this.state);
                break;
            case JSContext.DrawingMode.fillStroke:
                this._fillPath(this.path, this.state, JSContext.FillRule.winding);
                this._strokePath(this.path, this.state);
                break;
            case JSContext.DrawingMode.evenOddFillStroke:
                this._fillPath(this.path, this.state, JSContext.FillRule.evenOdd);
                this._strokePath(this.path, this.state);
                break;
        }
        this.beginPath();
    },

    _fillPath: function(path, state, fillRule){
        var rgbaColor = state.fillColor.rgbaColor();
        var r = Math.round(rgbaColor.components[0] * 255);
        var g = Math.round(rgbaColor.components[1] * 255);
        var b = Math.round(rgbaColor.components[2] * 255);
        var a = Math.round(rgbaColor.components[3] * state.alpha * 255);
        this._fillPathWithRGBA(path, r, g, b, a, fillRule);
    },

    _fillPathWithRGBA: function(path, r, g, b, a, fillRule){
        var origin = JSPoint(
            Math.max(0, Math.floor(path.boundingRect.origin.x)),
            Math.max(0, Math.floor(path.boundingRect.origin.y))
        );
        var size = JSSize(
            Math.min(this.size.width, Math.ceil(path.boundingRect.origin.x + path.boundingRect.size.width) - origin.x),
            Math.min(this.size.height, Math.ceil(path.boundingRect.origin.y + path.boundingRect.size.height) - origin.y)
        );
        var end = origin.adding(JSPoint(size.width, size.height));
        var i = (this.bounds.origin.y * this.size.width + this.bounds.origin.x) * 4;
        var stride = this.size.width - size.width;
        var point = JSPoint(origin);
        var subsamples = 3;
        var hit = 1/subsamples/subsamples;
        var d = 1 / (subsamples + 1);
        var p = 0;
        for (; point.y < end.y; point.y += 1){
            for (point.x = origin.x; point.x < end.x; point.x += 1, i += 4){
                point.y += d;
                for (var sy = 0; sy < subsamples; ++sy, point.y += d){
                    point.x += d;
                    for (var sx = 0; sx < subsamples; ++sx, point.x += d){
                        if (path.containsPoint(point, fillRule)){
                            p += hit;
                        }
                    }
                    point.x -= 1;
                }
                point.y -= 1;
                this._blend(i, r, g, b, Math.round(a * p));
            }
            i += stride;
        }
    },

    _blend: function(redIndex, sr, sg, sb, sa){
        if (sa === 0){
            return;
        }
        if (sa === 255){
            this.data[redIndex] = sr;
            this.data[redIndex + 1] = sg;
            this.data[redIndex + 2] = sb;
            this.data[redIndex + 3] = sa;
            return;
        }
        var dr = this.data[redIndex];
        var dg = this.data[redIndex + 1];
        var db = this.data[redIndex + 2];
        var da = this.data[redIndex + 3];
        
        sa /= 255.0;
        da /= 255.0;
        var q = da * (1 - sa);

        var a = sa + q;
        var r = (sr/255.0 + dr/255.0*q) / a;
        var g = (sg/255.0 + dg/255.0*q) / a;
        var b = (sb/255.0 + db/255.0*q) / a;

        this.data[redIndex] = Math.round(r * 255);
        this.data[redIndex + 1] = Math.round(g * 255);
        this.data[redIndex + 2] = Math.round(b * 255);
        this.data[redIndex + 3] = Math.round(a * 255);
    },

    _strokePath: function(path, state){
        // TODO: dashes
        var outlines = path.pathThatFillsStroke(state.lineWidth, state.lineCap, state.lineJoin, state.miterLimit, state.transform);
        var stateForFilling = Object.create(state);
        stateForFilling.fillColor = state.strokeColor;
        this._fillPath(path, stateForFilling, JSContext.FillRule.winding);
    },

    // ----------------------------------------------------------------------
    // MARK: - Drawing Shapes

    clearRect: function(rect){
        var path = JSPath.init();
        path.moveToPoint(rect.origin);
        path.addLineToPoint(rect.origin.adding(JSPoint(rect.size.width, 0)));
        path.addLineToPoint(rect.origin.adding(JSPoint(rect.size.width, rect.size.height)));
        path.addLineToPoint(rect.origin.adding(JSPoint(0, rect.size.height)));
        path.closeSubpath();
        // TODO: clear everything in the path
        this.beginPath();
    },

    fillMaskedRect: function(rect, maskImage){
        // TODO:
    },

    // ----------------------------------------------------------------------
    // MARK: - Images

    drawImage: function(image, rect){
        // TODO: get image data immediately
        // TODO: handle svg images
    },

    drawBitmap: function(bitmap, rect){
        // TODO: smoothing
        this.save();
        this.scaleBy(bitmap.size.width / rect.size.width, bitmap.size.height  / rect.size.height);
        var r, g, b, a;
        var squarePath = JSPath.init();
        squarePath.moveToPoint(JSPoint.Zero);
        squarePath.addLineToPoint(JSPoint(1, 0));
        squarePath.addLineToPoint(JSPoint(1, 1));
        squarePath.addLineToPoint(JSPoint(0, 1));
        squarePath.close();
        var p1 = squarePath.subpaths[0].firstPoint;
        var p2 = squarePath.subpaths[0].segments[0].end;
        var p3 = squarePath.subpaths[0].segments[1].end;
        var p4 = squarePath.subpaths[0].segments[2].end;
        for (var i = 0; p1.y < bitmap.size.height; ++p1.y, ++p2.y, ++p3.y, ++p4.y){
            for (p1.x = 0, p2.x = 1, p3.x = 1, p4.x = 0; p1.x < bitmap.size.width; ++p1.x, ++p2.x, ++p3.x, ++p4.x){
                r = bitmap.data[i++];
                g = bitmap.data[i++];
                b = bitmap.data[i++];
                a = bitmap.data[i++];
                this._fillPathWithRGBA(squarePath, r, g, b, a, JSContext.FillRule.winding);
            }
        }
        this.restore();
    },

    // ----------------------------------------------------------------------
    // MARK: - Gradients

    drawLinearGradient: function(gradient, rect){
        // TODO:
    },

    drawRadialGradient: function(gradient, rect, r0, r1){
        // TODO:
    },

    // ----------------------------------------------------------------------
    // MARK: - Text

    showGlyphs: function(glyphs){
        var tm = this.state.textMatrix;
        var width;
        var glyph;
        var text;
        var font = this.state.font;
        this.save();
        this.setLineWidth(this.canvasContext.lineWidth / Math.abs(tm.d));
        this.concatenate(tm);
        var path = JSPath.init();
        for (var i = 0, l = glyphs.length; i < l; ++i){
            glyph = glyphs[i];
            // TODO: add glyph to path
            width = font.widthOfGlyph(glyph) + this.state.characterSpacing;
            this.translateBy(width, 0);
        }
        if (this.state.textDrawingMode == JSContext.TextDrawingMode.fill || this.state.textDrawingMode == JSContext.TextDrawingMode.fillStroke){
            this._fillPath(path, this.state, JSContext.FillRule.winding);
        }
        if (this.state.textDrawingMode == JSContext.TextDrawingMode.stroke || this.state.textDrawingMode == JSContext.TextDrawingMode.fillStroke){
            this._strokePath(path, this.state);
        }
        this.restore();
    },

    // ----------------------------------------------------------------------
    // MARK: - Clipping

    clip: function(fillRule){
        // TODO:
    }

});

})();