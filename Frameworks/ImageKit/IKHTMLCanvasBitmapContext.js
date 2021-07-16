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

    // ----------------------------------------------------------------------
    // MARK: - Creating a Context

    initWithDocument: function(document, size){
        IKHTMLCanvasBitmapContext.$super.initWithSize(size);
        this.canvasElement = document.createElement("canvas");
        this.canvasElement.width = this.size.width;
        this.canvasElement.height = this.size.height;
        this.canvasContext = this.canvasElement.getContext('2d');
        this.operationQueue = [];
    },

    bitmap: function(completion, target){
        this.enqueueOperation({
            canvasContext: this.canvasContext,
            size: this.size,
            run: function(opCompletion, opTarget){
                var imageData = this.canvasContext.getImageData(0, 0, this.size.width, this.size.height);
                var bitmap = IKBitmap.initWithData(imageData, this.size);
                opCompletion.call(opTarget);
                completion.call(target, bitmap);
            }
        });
    },

    // ----------------------------------------------------------------------
    // MARK: - Operations

    operationQueue: null,

    enqueueOperation: function(operation){
        var state = {
            alpha: this.state.alpha,
            fillColor: this.state.fillColor,
            strokeColor: this.state.strokeColor,
            lineWidth: this.state.lineWidth,
            lineCap: this.state.lineCap,
            lineJoin: this.state.lineJoin,
            miterLimit: this.state.miterLimit,
            lineDashArray: this.state.lineDashArray,
            lineDashPhase: this.state.lineDashPhase,
            shadowOffset: this.state.shadowOffset,
            shadowBlur: this.state.shadowBlur,
            shadowColor: this.state.shadowColor,
            font: this.state.font,
            textMatrix: this.state.textMatrix,
            characterSpacing: this.state.characterSpacing,
            textDrawingMode: this.state.textDrawingMode
        };
        this.operationQueue.push({fn: operation, state: state});
        if (this.operationQueue.length === 1){
            this.runNextOperation();
        }
    },

    runNextOperation: function(){
        var operation = this.operationQueue[0];
        
        // apply state as it was when operation was created
        this.canvasContext.setTransform(operation.state.transform);
        this.canvasContext.globalAlpha = operation.state.alpha;
        if (operation.state.fillColor !== null){
            this.canvasContext.fillStyle = operation.state.fillColor.cssString();
        }
        if (operation.state.strokeColor !== null){
            this.canvasContext.strokeStyle = operation.state.strokeColor.cssString();
        }
        this.canvasContext.lineWidth = operation.state.lineWidth;
        this.canvasContext.lineCap = operation.state.lineCap;
        this.canvasContext.lineJoin = operation.state.lineJoin;
        this.canvasContext.miterLimit = operation.state.miterLimit;
        if (operation.state.lineDashArray !== null && operation.state.lineDashArray.length > 0){
            this.canvasContext.lineDashOffset = operation.state.lineDashPhase;
            this.canvasContext.setLineDash(operation.state.lineDashArray);
        }
        if (operation.state.shadowColor !== null){
            this.canvasContext.shadowColor = operation.state.shadowColor.cssString();
            this.canvasContext.shadowOffsetX = operation.state.shadowOffset.x;
            this.canvasContext.shadowOffsetY = operation.state.shadowOffset.y;
            this.canvasContext.shadowBlur = operation.state.shadowBlur;
        }
        if (operation.state.font !== null){
            this.canvasContext.font = operation.state.font.cssString();
        }

        // call the operation
        operation.fn.call(this, operation.state, function(){
            this.operationQueue.shift();
            if (this.operationQueue.length > 0){
                this.runNextOperation();
            }
        }, this);
    },

    // ----------------------------------------------------------------------
    // MARK: - Drawing the Current Path

    drawPath: function(drawingMode){
        var path = this.path.copy();
        this.enqueueOperation(function(state, completion, target){
            path.addToIKHTMLCanvasContext(this.canvasContext);
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
            completion.call(target);
        });
        this.beginPath();
    },

    // ----------------------------------------------------------------------
    // MARK: - Drawing Shapes

    clearRect: function(rect){
        this.enqueueOperation(function(state, completion, target){
            this.canvasContext.clearRect(rect.origin.x, rect.origin.y, rect.size.width, rect.size.height);
            completion.call(target);
        });
        this.beginPath();
    },

    fillMaskedRect: function(rect, maskImage){
        this.enqueueOperation(function(state, completion, target){
            drawableElementForImage(maskImage, this.canvasContext.canvas.ownerDocument, function(imgElement){
                var maskCanvas = this.canvasContext.canvas.ownerDocument.createElement("canvas");
                maskCanvas.width = maskImage.size.width;
                maskCanvas.height = maskImage.size.height;
                var maskContext = maskCanvas.getContext('2d');
                maskContext.fillStyle = state.fillColor.cssString();
                maskContext.fillRect(0, 0, maskImage.size.width, maskImage.size.height);
                maskContext.globalCompositeOperation = 'destination-in';
                maskContext.drawImage(imgElement, 0, 0, maskImage.size.width, maskImage.size.height);
                this.canvasContext.drawImage(maskCanvas, rect.origin.x, rect.origin.y, rect.size.width, rect.size.height);
                completion.call(target);
            }, this);
        });
    },
    // ----------------------------------------------------------------------
    // MARK: - Images

    drawImage: function(image, rect){
        this.enqueueOperation(function(state, completion, target){
            drawableElementForImage(image, this.canvasContext.canvas.ownerDocument, function(imgElement){
                this.canvasContext.drawImage(imgElement, rect.origin.x, rect.origin.y, rect.size.width, rect.size.height);
                completion.call(target);
            }, this);
        });
    },

    // ----------------------------------------------------------------------
    // MARK: - Gradients

    drawLinearGradient: function(gradient, rect){
        this.enqueueOperation(function(state, completion, target){
            // since all the gradient coordinates are in the unit rectangle,
            // we'll align our transform so the unit rectangle matches rect.
            this.canvasContext.translate(rect.origin.x, rect.origin.y);
            this.canvasContext.scale(rect.size.width, rect.size.height);
            var canvasGradient = this.canvasContext.createLineralGradient(gradient.start.x, gradient.start.y, gradient.end.x, gradient.end.y);
            var stop;
            for (var i = 0, l = gradient.stops.length; i < l; ++i){
                stop = gradient.stops[i];
                canvasGradient.addColorStop(stop.position, stop.color.cssString());
            }
            this.canvasContext.fillStyle = canvasGradient;
            this.canvasContext.fillRect(JSRect(0, 0, 1, 1));
            completion.call(target);
        });
    },

    drawRadialGradient: function(gradient, rect, r0, r1){
        this.enqueueOperation(function(state, completion, target){
            // since all the gradient coordinates are in the unit rectangle,
            // we'll align our transform so the unit rectangle matches rect.
            this.canvasContext.translate(rect.origin.x, rect.origin.y);
            this.canvasContext.scale(rect.size.width, rect.size.height);
            var canvasGradient = this.canvasContext.createRadialGradient(gradient.start.x, gradient.start.y, r0, gradient.end.x, gradient.end.y, r1);
            var stop;
            for (var i = 0, l = gradient.stops.length; i < l; ++i){
                stop = gradient.stops[i];
                canvasGradient.addColorStop(stop.position, stop.color.cssString());
            }
            this.canvasContext.fillStyle = canvasGradient;
            this.canvasContext.fillRect(JSRect(0, 0, 1, 1));
            completion.call(target);
        });
    },

    // ----------------------------------------------------------------------
    // MARK: - Text

    showGlyphs: function(glyphs){
        this.enqueueOperation(function(state, completion, target){
            if (!state.textMatrix.isIdentity){
                // Canvas2D doens't have a concept of a text transform, so we'll just
                // add it to the base transform.
                // - Be sure to adjust the lineWidth for the new scale
                this.canvasContext.lineWidth = this.canvasContext.lineWidth / Math.abs(state.textMatrix.d);
                this.canvasContext.transform(state.textMatrix);
            }
            var glyph;
            var text;
            var width;
            var font = state.font;
            for (var i = 0, l = glyphs.length; i < l; ++i){
                glyph = glyphs[i];
                text = font.stringForGlyphs([glyph]);
                if (state.textDrawingMode == JSContext.TextDrawingMode.fill || state.textDrawingMode == JSContext.TextDrawingMode.fillStroke){
                    this.canvasContext.fillText(text, 0, 0);
                }
                if (state.textDrawingMode == JSContext.TextDrawingMode.stroke || state.textDrawingMode == JSContext.TextDrawingMode.fillStroke){
                    this.canvasContext.strokeText(text, 0, 0);
                }
                width = font.widthOfGlyph(glyph) + state.characterSpacing;
                this.translateBy(width, 0);
            }

            completion.call(target);
        });
    },

    showText: function(text){
        this.enqueueOperation(function(state, completion, target){
            if (!state.textMatrix.isIdentity){
                // Canvas2D doens't have a concept of a text transform, so we'll just
                // add it to the base transform.
                // - Be sure to adjust the lineWidth for the new scale
                this.canvasContext.lineWidth = this.canvasContext.lineWidth / Math.abs(state.textMatrix.d);
                this.canvasContext.transform(state.textMatrix);
            }
            if (state.characterSpacing === 0){
                // If character spacing is zero, then it's far more effient to just paint
                // the text we were given all at once.
                if (state.textDrawingMode == JSContext.TextDrawingMode.fill || state.textDrawingMode == JSContext.TextDrawingMode.fillStroke){
                    this.canvasContext.fillText(text, 0, 0);
                }
                if (state.textDrawingMode == JSContext.TextDrawingMode.stroke || state.textDrawingMode == JSContext.TextDrawingMode.fillStroke){
                    this.canvasContext.strokeText(text, 0, 0);
                }
            }else{
                // If there's a non-zero character spacing specified, we can't use
                // canvasContext.fillText, because Canvas2D has no way of specifying
                // character spacing.  So, we'll paint character by character.
                var width;
                var font = state.font;
                var iterator = text.unicodeIterator();
                while (iterator.character !== null){
                    if (state.textDrawingMode == JSContext.TextDrawingMode.fill || state.textDrawingMode == JSContext.TextDrawingMode.fillStroke){
                        this.canvasContext.fillText(iterator.character.utf16, 0, 0);
                    }
                    if (state.textDrawingMode == JSContext.TextDrawingMode.stroke || state.textDrawingMode == JSContext.TextDrawingMode.fillStroke){
                        this.canvasContext.strokeText(iterator.character.utf16, 0, 0);
                    }
                    width = font.widthOfCharacter(iterator.character) + state.characterSpacing;
                    this.canvasContext.translate(width, 0);
                    iterator.increment();
                }
            }

            completion.call(target);
        });
    },

    // ----------------------------------------------------------------------
    // MARK: - Clipping

    clip: function(fillRule){
        var path = this.path.copy();
        this.enqueueOperation(function(state, completion, target){
            path.addToIKHTMLCanvasContext(this.canvasContext);
            if (fillRule == JSContext.FillRule.evenOdd){
                this.canvasContext.clip('evenodd');
            }else{
                this.canvasContext.clip();
            }
            completion.call(target);
        });
        this.beginPath();
    },

});

JSPath.definePropertiesFromExtensions({

    addToIKHTMLCanvasContext: function(canvasContext){
        var i, l;
        var j, k;
        var subpath;
        var segment;
        var point;
        var cp1;
        var cp2;
        for (i = 0, l = this.subpaths.length; i < l; ++i){
            subpath = this.subpaths[i];
            canvasContext.moveTo(subpath.firstPoint.x, subpath.firstPoint.y);
            for (j = 0, k = subpath.segments.length; j < k; ++j){
                segment = subpath.segments[j];
                if (segment.type === JSPath.SegmentType.line){
                    canvasContext.lineTo(segment.end.x, segment.end.y);
                }else if (segment.type === JSPath.SegmentType.curve){
                    canvasContext.bezierCurveTo(
                        segment.curve.cp1.x,
                        segment.curve.cp1.y,
                        segment.curve.cp2.x,
                        segment.curve.cp2.y,
                        segment.curve.p2.x,
                        segment.curve.p2.y
                    );
                }
            }
            if (subpath.closed){
                canvasContext.closePath();
            }
        }
    }

});

var drawableElementForImage = function(image, domDocument, completion, target){
    var imgElement = domDocument.createElement("img");
    imgElement.src = image.htmlURLString();
    if (imgElement.decode){
        imgElement.decode().finally(function(){
            completion.call(target, imgElement);
        });
    }else{
        var listener = {
            handleEvent: function(event){
                imgElement.removeEventListener("load", listener);
                imgElement.removeEventListener("error", listener);
                completion.call(target, imgElement);
            }
        };
        imgElement.addEventListener("load", listener);
        imgElement.addEventListener("error", listener);
    }
};

})();