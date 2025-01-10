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
// jshint browser: true
'use strict';

(function(){

var logger = JSLog("imagekit", "htmlbitmap");

JSClass("IKHTMLCanvasBitmapContext", IKBitmapContext, {

    canvasElement: null,
    canvasContext: null,

    // ----------------------------------------------------------------------
    // MARK: - Creating a Context

    initWithDocument: function(document, size){
        IKHTMLCanvasBitmapContext.$super.init.call(this);
        this.size = JSSize(Math.ceil(size.width), Math.ceil(size.height));
        this.canvasElement = document.createElement("canvas");
        this.canvasElement.width = this.size.width;
        this.canvasElement.height = this.size.height;
        this.canvasContext = this.canvasElement.getContext('2d');
        this.operationQueue = [];
    },

    _bitmap: function(completion, target){
        this.enqueueOperation(function(state, opCompletion, opTarget){
            var imageData = this.canvasContext.getImageData(0, 0, this.size.width, this.size.height);
            var bitmap = IKBitmap.initWithData(new Uint8Array(imageData.data.buffer, 0, imageData.data.length), this.size);
            opCompletion.call(opTarget);
            completion.call(target, bitmap);
        });
    },

    image: function(encoding, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var canvas = this.canvasElement;
        this.enqueueOperation(function(state, opCompletion, opTarget){
            var type;
            switch (encoding){
                default:
                case IKBitmap.Format.png:
                    type = "image/png";
                    break;
                case IKBitmap.Format.jpeg:
                    type = "image/jpeg";
                    break;
            }
            canvas.toBlob(function(blob){
                opCompletion.call(opTarget);
                var reader = new FileReader();
                reader.addEventListener("loadend", function(){
                    if (reader.error){
                        logger.error("Error reading blob: %{error}", reader.error);
                        completion.call(target, null);
                        return;
                    }
                    var data = JSData.initWithBuffer(reader.result);
                    var image = JSImage.initWithData(data);
                    completion.call(target, image);
                });
                reader.readAsArrayBuffer(blob);
            }, type, this.lossyCompressionQuality);
        });
        return completion.promise;
    },

    // ----------------------------------------------------------------------
    // MARK: - Operations

    operationQueue: null,

    enqueueOperation: function(operation){
        var state = {
            transform: this.state.transform,
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
        this.canvasContext.setTransform(
            operation.state.transform.a,
            operation.state.transform.b,
            operation.state.transform.c,
            operation.state.transform.d,
            operation.state.transform.tx,
            operation.state.transform.ty
        );
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
            this.canvasContext.shadowBlur = operation.state.shadowBlur * operation.state.transform.a;
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
            this.canvasContext.setTransform(1, 0, 0, 1, 0, 0);
            this.canvasContext.beginPath();
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
                var scale = Math.ceil(Math.max(state.transform.a, state.transform.b));
                var maskCanvas = this.canvasContext.canvas.ownerDocument.createElement("canvas");
                maskCanvas.width = maskImage.size.width * scale;
                maskCanvas.height = maskImage.size.height * scale;
                var maskContext = maskCanvas.getContext('2d');
                maskContext.fillStyle = state.fillColor.cssString();
                maskContext.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
                maskContext.globalCompositeOperation = 'destination-in';
                maskContext.drawImage(imgElement, 0, 0, maskCanvas.width, maskCanvas.height);
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
                var scale = Math.ceil(Math.max(state.transform.a, state.transform.b));
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
            var canvasGradient = this.canvasContext.createLinearGradient(gradient.start.x, gradient.start.y, gradient.end.x, gradient.end.y);
            var stop;
            for (var i = 0, l = gradient.stops.length; i < l; ++i){
                stop = gradient.stops[i];
                canvasGradient.addColorStop(stop.position, stop.color.cssString());
            }
            this.canvasContext.fillStyle = canvasGradient;
            this.canvasContext.fillRect(0, 0, 1, 1);
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
            this.canvasContext.fillRect(0, 0, 1, 1);
            completion.call(target);
        });
    },

    // ----------------------------------------------------------------------
    // MARK: - Text

    showGlyphs: function(glyphs){
        var text = this.state.font.stringForGlyphs(glyphs);
        this.showText(text);
        // this.enqueueOperation(function(state, completion, target){
        //     if (!state.textMatrix.isIdentity){
        //         // Canvas2D doens't have a concept of a text transform, so we'll just
        //         // add it to the base transform.
        //         // - Be sure to adjust the lineWidth for the new scale
        //         this.canvasContext.lineWidth = this.canvasContext.lineWidth / Math.abs(state.textMatrix.d);
        //         this.canvasContext.transform(
        //             state.textMatrix.a,
        //             state.textMatrix.b,
        //             state.textMatrix.c,
        //             state.textMatrix.d,
        //             state.textMatrix.tx,
        //             state.textMatrix.ty
        //         );
        //     }
        //     var glyph;
        //     var text;
        //     var width;
        //     var font = state.font;
        //     for (var i = 0, l = glyphs.length; i < l; ++i){
        //         glyph = glyphs[i];
        //         text = font.stringForGlyphs([glyph]);
        //         if (state.textDrawingMode == JSContext.TextDrawingMode.fill || state.textDrawingMode == JSContext.TextDrawingMode.fillStroke){
        //             this.canvasContext.fillText(text, 0, 0);
        //         }
        //         if (state.textDrawingMode == JSContext.TextDrawingMode.stroke || state.textDrawingMode == JSContext.TextDrawingMode.fillStroke){
        //             this.canvasContext.strokeText(text, 0, 0);
        //         }
        //         width = font.widthOfGlyph(glyph) + state.characterSpacing;
        //         this.canvasContext.translate(width, 0);
        //     }

        //     completion.call(target);
        // });
    },

    showText: function(text){
        this.enqueueOperation(function(state, completion, target){
            if (!state.textMatrix.isIdentity){
                // Canvas2D doens't have a concept of a text transform, so we'll just
                // add it to the base transform.
                // - Be sure to adjust the lineWidth for the new scale
                this.canvasContext.lineWidth = this.canvasContext.lineWidth / Math.abs(state.textMatrix.d);
                this.canvasContext.transform(
                    state.textMatrix.a,
                    state.textMatrix.b,
                    state.textMatrix.c,
                    state.textMatrix.d,
                    state.textMatrix.tx,
                    state.textMatrix.ty
                );
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
            this.canvasContext.setTransform(1, 0, 0, 1, 0, 0);
            this.canvasContext.beginPath();
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

    // ----------------------------------------------------------------------
    // MARK: - State

    // Because of our operation queue design, the only reason we need to
    // handle save/restore is to have the canvas context keep track of the
    // current clipping path(s).
    // Alternatively, we could keep track ourself, and apply a stack of clips
    // when we set the rest of the state before operation.run, but this seems
    // easier and unlikely to have a major impact on performance.

    save: function(){
        IKHTMLCanvasBitmapContext.$super.save.call(this);
        this.enqueueOperation(function(state, completion, target){
            this.canvasContext.save();
            completion.call(target);
        });
    },

    restore: function(){
        IKHTMLCanvasBitmapContext.$super.restore.call(this);
        this.enqueueOperation(function(state, completion, target){
            this.canvasContext.restore();
            completion.call(target);
        });
    }

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
    imgElement.setAttribute("crossorigin", "anonymous");
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

IKBitmapContext.definePropertiesFromExtensions({
    initWithSize: function(size){
        return IKHTMLCanvasBitmapContext.initWithDocument(document, size);
    },
});

IKBitmapContext.defineInitMethod("initWithSize");

})();