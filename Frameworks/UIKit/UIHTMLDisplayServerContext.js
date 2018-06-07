// #import "Foundation/Foundation.js"
// #import "UIKit/UIView.js"
/* global JSClass, JSContext, JSObject, UIHTMLDisplayServerContext, JSCustomProperty, JSDynamicProperty, JSLazyInitProperty, JSPoint, JSContextLineDash, UIView */
'use strict';

function HTMLCanvasProperty(name){
    if (this === undefined){
        return new HTMLCanvasProperty(name);
    }else{
        this.name = name;
    }
}

HTMLCanvasProperty.prototype = Object.create(JSCustomProperty.prototype);

HTMLCanvasProperty.prototype.define = function(C, key, extensions){
    var ckey = this.name || key;
    Object.defineProperty(C.prototype, key, {
        configurable: false,
        enumerable: false,
        set: function HTMLCanvasProperty_set(value){
            this.canvasContext[ckey] = value;
        },
        get: function HTMLCanvasProperty_get(){
            return this.canvasContext[ckey];
        }
    });
};

function HTMLCanvasMethod(name){
    if (this === undefined){
        return new HTMLCanvasMethod(name);
    }else{
        this.name = name;
    }
}

HTMLCanvasMethod.prototype = Object.create(JSCustomProperty.prototype);

HTMLCanvasMethod.prototype.define = function(C, key, extensions){
    var ckey = this.name || key;
    Object.defineProperty(C.prototype, key, {
        configurable: false,
        enumerable: false,
        get: function HTMLCanvasMethod_get(){
            return this.canvasContext[ckey];
        }
    });
};

JSClass("UIHTMLDisplayServerContext", JSContext, {

    element: null,
    borderElement: null,
    trackingElement: null,
    sublayerElement: null,
    style: null,
    canvasContext: JSDynamicProperty('_canvasContext', null),
    propertiesNeedingUpdate: null,
    needsFullDisplay: false,
    layerManagedNodeCount: 0,
    layerManagedTopNodeCount: 0,
    firstSublayerNodeIndex: 0,
    _childInsertionIndex: 0,
    _canvasElements: null,
    _canvasElementIndex: 0,
    _imageElements: null,
    _imageElementIndex: 0,
    _externalElements: null,
    _previousExternalElements: null,
    _hasRenderedOnce: false,

    initWithElementUnmodified: function(element){
        UIHTMLDisplayServerContext.$super.init.call(this);
        this.element = element;
        this.sublayerElement = this.element;
        this.style = element.style;
        this.propertiesNeedingUpdate = {};
        this._imageElements = [];
        this._canvasElements = [];
        this._externalElements = [];
        this._previousExternalElements = [];
        this._fontStack = [];
    },

    initWithElement: function(element){
        this.initWithElementUnmodified(element);
    },

    destroy: function(){
        this.element = null;
        this.style = null;
    },

    resetForDisplay: function(){
        this._canvasElementIndex = 0;
        this._imageElementIndex = 0;
        this._childInsertionIndex = this.layerManagedNodeCount;
        var i, l;
        for (i = 0, l = this._canvasElements.length; i < l; ++i){
            this._canvasElements[i].getContext('2d').clearRect(0, 0, this._canvasElements[i].width, this._canvasElements[i].height);
        }
        this._previousExternalElements = this._externalElements;
        this._externalElements = [];
    },

    cleanupAfterDisplay: function(){
        var i;
        for (i = this._canvasElements.length - 1; i >= this._canvasElementIndex; --i){
            this._canvasElements[i].parentNode.removeChild(this._canvasElements[i]);
            this._canvasElements.splice(i, 1);
        }
        for (i = this._imageElements.length - 1; i >= this._imageElementIndex; --i){
            this._imageElements[i].parentNode.removeChild(this._imageElements[i]);
            this._imageElements.splice(i, 1);
        }
        for (i = this._previousExternalElements.length - 1; i >= 0; --i){
            if (this._externalElements.indexOf(this._previousExternalElements[i]) < 0){
                this._previousExternalElements[i].parentNode.removeChild(this._previousExternalElements[i]);
                this._previousExternalElements.splice(i, 1);
            }
        }
        this._previousExternalElements = [];
        this.firstSublayerNodeIndex = this._childInsertionIndex;
    },

    addExternalElement: function(element){
        this._externalElements.push(element);
        this._insertChildElement(element);
    },

    _insertChildElement: function(element){
        // FIXME: added element should inherit current state transform
        if (this._childInsertionIndex < this.element.childNodes.length){
            if (element !== this.element.childNodes[this._childInsertionIndex]){
                this.element.insertBefore(element, this.element.childNodes[this._childInsertionIndex]);
            }
        }else{
            if (element.parentNode !== this.element){
                this.element.appendChild(element);
            }
        }
        ++this._childInsertionIndex;
        this._canvasContext = null;
    },

    _dequeueReusableCanvasElement: function(){
        if (this._canvasElementIndex == this._canvasElements.length){
            var canvasElement = this.element.ownerDocument.createElement('canvas');
            canvasElement.style.position = 'absolute';
            canvasElement.style.width = '100%';
            canvasElement.style.height = '100%';
            this._canvasElements.push(canvasElement);
        }
        var element = this._canvasElements[this._canvasElementIndex];
        ++this._canvasElementIndex;
        return element;
    },

    getCanvasContext: function(){
        // FIXME: needs to respect state of any prior canvas
        if (!this._canvasContext){
            var scale = this.element.ownerDocument.defaultView.devicePixelRatio || 1;
            var canvas = this._dequeueReusableCanvasElement();
            canvas.width = this.size.width * scale;
            canvas.height = this.size.height * scale;
            this._insertChildElement(canvas);
            this._canvasContext = canvas.getContext('2d');
            if (scale != 1){
                this._canvasContext.scale(scale, scale);
            }
        }
        return this._canvasContext;
    },

    updateSize: function(size){
        this.style.width = size.width + 'px';
        this.style.height = size.height + 'px';
        this.size = size;
    },

    // ----------------------------------------------------------------------
    // MARK: - Tracking

    startMouseTracking: function(trackingType, listener){
        if (this.trackingElement === null){
            this.trackingElement = this.element.ownerDocument.createElement('div');
            this.trackingElement.style.position = 'absolute';
            this.trackingElement.style.top = '0';
            this.trackingElement.style.left = '0';
            this.trackingElement.style.bottom = '0';
            this.trackingElement.style.right = '0';
            this.trackingElement.dataset.tag = "tracking";
            this.element.appendChild(this.trackingElement);
        }else if (this.trackingListener !== null){
            this.trackingElement.removeEventListener('mouseenter', this.trackingListener);
            this.trackingElement.removeEventListener('mouseleave', this.trackingListener);
            this.trackingElement.removeEventListener('mousemove', this.trackingListener);
        }
        this.trackingListener = listener;
        if (trackingType & UIView.MouseTracking.enterAndExit){
            this.trackingElement.addEventListener('mouseenter', this.trackingListener);
            this.trackingElement.addEventListener('mouseleave', this.trackingListener);
        }
        if (trackingType & UIView.MouseTracking.move){
            this.trackingElement.addEventListener('mousemove', this.trackingListener);
        }
    },

    stopMouseTracking: function(){
        if (this.trackingElement === null || this.trackingListener === null){
            return;
        }
        this.trackingElement.removeEventListener('mouseenter', this.trackingListener);
        this.trackingElement.removeEventListener('mouseleave', this.trackingListener);
        this.trackingElement.removeEventListener('mousemove', this.trackingListener);
        this.trackingElement.parentNode.removeChild(this.trackingElement);
        this.trackingElement = null;
        this.trackingListener = null;
    },

    // ----------------------------------------------------------------------
    // MARK: - Constructing Paths

    beginPath: function(){
        this.canvasContext.beginPath();
    },

    moveToPoint: function(x, y){
        this.canvasContext.moveTo(x, y);
    },

    addLineToPoint: function(x, y){
        this.canvasContext.lineTo(x, y);
    },

    addRect: function(rect){
        this.canvasContext.rect(rect.origin.x, rect.origin.y, rect.size.width, rect.size.height);
    },

    addArc: function(center, radius, startAngle, endAngle, clockwise){
        this.canvasContext.arc(center.x, center.y, radius, startAngle, endAngle, !clockwise);
    },

    addArcUsingTangents: function(tangent1End, tangent2End, radius){
        this.canvasContext.arcTo(tangent1End.x, tangent1End.y, tangent2End.x, tangent2End.y, radius);
    },

    addCurveToPoint: function(point, control1, control2){
        this.canvasContext.bezierCurveTo(control1.x, control1.y, control2.x, control2.y, point.x, point.y);
    },

    addQuadraticCurveToPoint: function(point, control){
        this.canvasContext.quadraticCurveTo(control.x, control.y, point.x, point.y);
    },

    closePath: function(){
        this.canvasContext.closePath();
    },

    // ----------------------------------------------------------------------
    // MARK: - Drawing the Current Path

    fillPath: function(fillRule){
        if (fillRule == JSContext.FillRule.evenOdd){
            throw new Error("UIHTMLDisplayServerContext.eoFillPath not implemented");
        }
        this.canvasContext.fill();
    },

    strokePath: function(){
        this.canvasContext.stroke();
    },

    // ----------------------------------------------------------------------
    // MARK: - Drawing Shapes

    clearRect: function(rect){
        this.canvasContext.clearRect(rect.origin.x, rect.origin.y, rect.size.width, rect.size.height);
    },

    fillRect: function(rect){
        this.canvasContext.fillRect(rect.origin.x, rect.origin.y, rect.size.width, rect.size.height);
    },

    strokeRect: function(rect){
        this.canvasContext.strokeRect(rect.origin.x, rect.origin.y, rect.size.width, rect.size.height);
    },

    // ----------------------------------------------------------------------
    // MARK: - Images

    drawImage: function(image, rect){
        if (image !== null){
            var url = image.htmlURLString();
            if (url){
                var imageElement = this._dequeueReusableImageElement();
                imageElement.style.top = rect.origin.y + 'px';
                imageElement.style.left = rect.origin.x + 'px';
                imageElement.style.width = rect.size.width + 'px';
                imageElement.style.height = rect.size.height + 'px';
                var cssURL = "url('" + url + "')";
                var box = image.stretchBox;
                if (box !== null){
                    imageElement.style.backgroundColor = '';
                    imageElement.style.backgroundImage = '';
                    imageElement.style.maskImage = '';
                    imageElement.style.maskSize = '';
                    imageElement.style.webkitMaskImage = '';
                    imageElement.style.webkitMaskSize = '';
                    imageElement.style.borderWidth = '%dpx %dpx %dpx %dpx'.sprintf(box.top, box.right, box.bottom, box.left);
                    imageElement.style.borderImage = cssURL + " %d %d %d %d fill stretch".sprintf(box.top * image.scale, box.right * image.scale, box.bottom * image.scale, box.left * image.scale);
                }else if (image.templateColor !== null){
                    imageElement.backgroundImage = '';
                    imageElement.style.borderWidth = '';
                    imageElement.style.borderImage = '';
                    imageElement.style.maskImage = cssURL;
                    imageElement.style.maskSize = '100% 100%';
                    imageElement.style.webkitMaskImage = cssURL;
                    imageElement.style.webkitMaskSize = '100% 100%';
                    imageElement.style.backgroundColor = image.templateColor.cssString();
                }else{
                    imageElement.style.backgroundColor = '';
                    imageElement.style.backgroundImage = cssURL;
                    imageElement.style.backgroundSize = '100% 100%';
                    imageElement.style.borderWidth = '';
                    imageElement.style.borderImage = '';
                    imageElement.style.maskImage = '';
                    imageElement.style.maskSize = '';
                    imageElement.style.webkitMaskImage = '';
                    imageElement.style.webkitMaskSize = '';
                }
                this._insertChildElement(imageElement);
            }else{
                // TODO: draw to canvas using putImageData
            }
        }
    },

    _dequeueReusableImageElement: function(){
        if (this._imageElementIndex == this._imageElements.length){
            var imageElement = this.element.ownerDocument.createElement('div');
            imageElement.style.position = 'absolute';
            imageElement.style.borderColor = 'transparent';
            imageElement.style.boxSizing = 'border-box';
            imageElement.style.mozBoxSizing = 'border-box';
            this._imageElements.push(imageElement);
        }
        var element = this._imageElements[this._imageElementIndex];
        ++this._imageElementIndex;
        return element;
    },

    // ----------------------------------------------------------------------
    // MARK: - Gradients

    drawLinearGradient: function(gradient, start, end){
        // TODO:
    },

    drawRadialGradient: function(gradient, startCenter, startRadius, endCenter, endRadius){
        // TODO:
    },

    // ----------------------------------------------------------------------
    // MARK: - Text

    _textDrawingMode: JSContext.TextDrawingMode.fill,

    setFont: function(font){
        this.canvasContext.font = font.cssString();
        this._font = font;
    },

    setTextDrawingMode: function(textDrawingMode){
        this._textDrawingMode = textDrawingMode;
    },

    showGlyphs: function(glyphs, points){
        var text = this._font.stringForGlyphs(glyphs);
        if (this._textDrawingMode == JSContext.TextDrawingMode.fill || this._textDrawingMode == JSContext.TextDrawingMode.fillStroke){
            this.canvasContext.fillText(text, points[0].x, points[0].y);
        }
        if (this._textDrawingMode == JSContext.TextDrawingMode.stroke || this._textDrawingMode == JSContext.TextDrawingMode.fillStroke){
            this.canvasContext.strokeText(text, points[0].x, points[0].y);
        }
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
        UIHTMLDisplayServerContext.$super.setFillColor.call(this, fillColor);
        this.canvasContext.fillStyle = fillColor ? fillColor.cssString() : '';
    },

    setStrokeColor: function(strokeColor){
        UIHTMLDisplayServerContext.$super.setStrokeColor.call(this, strokeColor);
        this.canvasContext.strokeStyle = strokeColor ? strokeColor.cssString() : '';
    },

    setShadow: function(offset, blur, color){
        this.canvasContext.shadowOffsetX = offset.x;
        this.canvasContext.shadowOffsetY = offset.y;
        this.canvasContext.shadodwBlur = blur;
        this.canvasContext.shadowColor = color ? color.cssString() : '';
    },

    // ----------------------------------------------------------------------
    // MARK: - Clipping

    clip: function(fillRule){
        if (fillRule == JSContext.FillRule.evenOdd){
            throw new Error("UIHTMLDisplayServerContext does not support even-odd clipping");
        }
        this.canvasContext.clip();
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
        if (this._canvasContext){
            this._canvasContext.save();
        }
        this._fontStack.push(this._font);
    },


    restore: function(){
        if (this._canvasContext){
            this._canvasContext.restore();
        }
        this._font = this._fontStack.pop();
    },

    // ----------------------------------------------------------------------
    // MARK: - HTML Shortcuts

    drawLayerProperties: function(layer){
        var needsBorderElement = this.borderElement === null && layer.presentation.borderWidth > 0;
        if (needsBorderElement){
            // TODO: could possibly use outline with a negative outline-offset value
            // instead of a separate element.  Needs investigation.  Browser support?  Behavior?
            this.borderElement = this.element.ownerDocument.createElement('div');
            if (this.trackingElement !== null){
                this.element.insertBefore(this.borderElement, this.trackingElement);
            }else{
                this.element.appendChild(this.borderElement);
            }
            this.borderElement.style.position = 'absolute';
            this.borderElement.style.top = '0';
            this.borderElement.style.left = '0';
            this.borderElement.style.bottom = '0';
            this.borderElement.style.right = '0';
            this.borderElement.dataset.tag = "border";
        }

        if (!this._hasRenderedOnce){
            layer.updateAllHTMLProperties(this);
            this._hasRenderedOnce = true;
        }else{
            var methodName;
            for (var keyPath in this.propertiesNeedingUpdate){
                methodName = 'updateHTMLProperty_' + keyPath;
                if (layer[methodName]){
                    layer[methodName](this);
                }else{
                    throw new Error("UIHTMLDisplayServerContext could not find html display method for keyPath '%s'".sprintf(keyPath));
                }
            }
            this.propertiesNeedingUpdate = {};
        }
    }

});