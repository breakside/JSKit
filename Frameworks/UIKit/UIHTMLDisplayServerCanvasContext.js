// #import "Foundation/Foundation.js"
// #import "UIKit/UIHTMLDisplayServerContext.js"
/* global JSClass, JSContext, UIHTMLDisplayServerContext, JSRect, JSObject, UILayer, UIHTMLDisplayServerCanvasContext, JSCustomProperty, JSDynamicProperty, JSLazyInitProperty, JSPoint, JSContextLineDash, UIView */
'use strict';

JSClass("UIHTMLDisplayServerCanvasContext", UIHTMLDisplayServerContext, {

    drawsHiddenLayers: true,

    // --------------------------------------------------------------------
    // MARK: - Creating a Context

    initWithElementUnmodified: function(element){
        UIHTMLDisplayServerCanvasContext.$super.initWithElementUnmodified.call(this, element);
        this.propertiesNeedingUpdate = {
            bounds: true,
            transform: true,
            hidden: true,
            clipsToBounds: true,
            alpha: true,
            backgroundColor: true,
            backgroundGradient: true,
            borderWidth: true,
            borderColor: true,
            cornerRadius: true,
            shadow: true
        };
        this._imageElements = [];
        this._canvasElements = [];
        this._externalElements = [];
        this._previousExternalElements = [];
        this._fontStack = [];
        this.bounds = JSRect.Zero;
    },

    // --------------------------------------------------------------------
    // MARK: - Destroying a Context

    destroy: function(){
        this.trackingElement = null;
        UIHTMLDisplayServerCanvasContext.$super.destroy.call(this);
    },

    // --------------------------------------------------------------------
    // MARK: - Display Lifecycle

    layerDidChangeProperty: function(layer, property){
        switch (property){
            case 'shadowColor':
            case 'shadowOffset':
            case 'shadowRadius':
                this.propertiesNeedingUpdate.shadow = true;
                break;
            case 'maskedCorners':
                this.propertiesNeedingUpdate.cornerRadius = true;
                break;
            case 'maskedBorders':
                this.propertiesNeedingUpdate.borderWidth = true;
                break;
            default:
                this.propertiesNeedingUpdate[property] = true;
                break;
        }
    },

    drawLayer: function(layer){
        if (this.needsCustomDisplay){
            this.resetForDisplay();
        }
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
            // the border element goes on top of all subviews, so we need to
            // disable pointer events or else things like cursors on subviews
            // won't work
            this.borderElement.style.pointerEvents = 'none';
            this.borderElement.dataset.tag = "border";
            // Force update of properties that might have been set, but not drawn,
            // because the border element wasn't created yet
            this.propertiesNeedingUpdate.borderWidth = true;
            this.propertiesNeedingUpdate.borderColor = true;
            if (layer.cornerRadius > 0){
                this.propertiesNeedingUpdate.cornerRadius = true;
            }
        }
        var methodName;
        for (var property in this.propertiesNeedingUpdate){
            methodName = 'updateHTMLProperty_' + property;
            this[methodName](layer);
        }
        this.propertiesNeedingUpdate = {};

        if (this.needsCustomDisplay){
            layer._drawInContext(this);
            this.cleanupAfterDisplay();
            this.needsCustomDisplay = false;
        }
    },

    resetForDisplay: function(){
        this._canvasElementIndex = 0;
        this._imageElementIndex = 0;
        this._canvasContext = null;
        this._childInsertionIndex = this.layerManagedNodeCount;
        var i, l;
        for (i = 0, l = this._canvasElements.length; i < l; ++i){
            this._canvasElements[i].getContext('2d').clearRect(0, 0, this._canvasElements[i].width, this._canvasElements[i].height);
        }
        this._previousExternalElements = this._externalElements;
        this._externalElements = [];
    },

    cleanupAfterDisplay: function(){
        var i, l;
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
        for (i = 0, l = this._canvasElements.length; i < l; ++i){
            this._canvasElements[i].getContext('2d').restore();
        }
        this._previousExternalElements = [];
        this.firstSublayerNodeIndex = this._childInsertionIndex;
    },

    addExternalElementInRect: function(element, rect){
        element.style.left = '%dpx'.sprintf(rect.origin.x);
        element.style.top = '%dpx'.sprintf(rect.origin.y);
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

    _childInsertionIndex: 0,
    _externalElements: null,
    _previousExternalElements: null,

    // ----------------------------------------------------------------------
    // MARK: - HTML Shortcuts

    propertiesNeedingUpdate: null,
    borderElement: null,

    updateHTMLProperty_origin: function(layer){
        this.bounds = layer.presentation.bounds;
        var element;
        var i, l;
        var cssTransform = '';
        if (this.bounds.origin.x !== 0 || this.bounds.origin.y !== 0){
            cssTransform = 'translate(%fpx,%fpx)'.sprintf(-this.bounds.origin.x, -this.bounds.origin.y);
        }
        for (i = 0, l = this._imageElements.length; i < l; ++i){
            element = this._imageElements[i];
            element.style.transform = cssTransform;
        }
        for (i = 0, l = this._externalElements.length; i < l; ++i){
            element = this._externalElements[i];
            element.style.transform = cssTransform;
        }
    },

    updateHTMLProperty_bounds: function(layer){
        this.bounds = layer.presentation.bounds;
        var size = layer.presentation.bounds.size;
        this.style.width = size.width + 'px';
        this.style.height = size.height + 'px';
    },

    updateHTMLProperty_transform: function(layer){
        var transform = layer.presentation.transform;
        var anchorPoint = layer.presentation.anchorPoint;
        if (!transform.isIdentity){
            var cssTransform = 'matrix(%f, %f, %f, %f, %f, %f)'.sprintf(transform.a, transform.b, transform.c, transform.d, transform.tx, transform.ty);
            this.style.transform = cssTransform;
            this.style.transformOrigin = '%f%% %f%% 0'.sprintf(anchorPoint.x * 100, anchorPoint.y * 100);
        }else{
            this.style.transform = '';
            this.style.transformOrigin = '';
        }
    },

    updateHTMLProperty_hidden: function(layer){
        this.style.visibility = layer.presentation.hidden ? 'hidden' : '';
    },

    updateHTMLProperty_clipsToBounds: function(layer){
        this.style.overflow = layer._clipsToBounds ? 'hidden' : '';
    },

    updateHTMLProperty_alpha: function(layer){
        this.style.opacity = layer.presentation.alpha != 1.0 ? layer.presentation.alpha : '';
    },

    updateHTMLProperty_backgroundColor: function(layer){
        this.style.backgroundColor = layer.presentation.backgroundColor ? layer.presentation.backgroundColor.cssString() : '';
    },

    updateHTMLProperty_backgroundGradient: function(layer){
        this.style.backgroundImage = layer.presentation.backgroundGradient ? layer.presentation.backgroundGradient.cssString() : '';
    },

    updateHTMLProperty_borderWidth: function(layer){
        if (layer.presentation.borderWidth){
            var css = '';
            if (layer.presentation.maskedBorders === UILayer.Sides.all){
                css = '%fpx'.sprintf(layer.presentation.borderWidth);
            }else{
                css = '%fpx %fpx %fpx %fpx'.sprintf(
                    (layer.presentation.maskedBorders & UILayer.Sides.minY) ? layer.presentation.borderWidth : 0,
                    (layer.presentation.maskedBorders & UILayer.Sides.maxX) ? layer.presentation.borderWidth : 0,
                    (layer.presentation.maskedBorders & UILayer.Sides.maxY) ? layer.presentation.borderWidth : 0,
                    (layer.presentation.maskedBorders & UILayer.Sides.minX) ? layer.presentation.borderWidth : 0
                );
            }
            this.borderElement.style.borderWidth = css;
            this.borderElement.style.borderStyle = 'solid';
        }else{
            if (this.borderElement !== null){
                this.borderElement.parentNode.removeChild(this.borderElement);
                this.borderElement = null;
            }
        }
    },

    updateHTMLProperty_borderColor: function(layer){
        if (this.borderElement !== null){
            this.borderElement.style.borderColor = layer.presentation.borderColor ? layer.presentation.borderColor.cssString() : '';
        }
    },

    updateHTMLProperty_cornerRadius: function(layer){
        var css = '';
        if (layer.presentation.cornerRadius){
            if (layer.presentation.maskedCorners === UILayer.Corners.all){
                css = '%fpx'.sprintf(layer.presentation.cornerRadius);
            }else{
                css = '%fpx %fpx %fpx %fpx'.sprintf(
                    (layer.presentation.maskedCorners & UILayer.Corners.minXminY) ? layer.presentation.cornerRadius : 0,
                    (layer.presentation.maskedCorners & UILayer.Corners.maxXminY) ? layer.presentation.cornerRadius : 0,
                    (layer.presentation.maskedCorners & UILayer.Corners.maxXmaxY) ? layer.presentation.cornerRadius : 0,
                    (layer.presentation.maskedCorners & UILayer.Corners.minXmaxY) ? layer.presentation.cornerRadius : 0
                );
            }
        }
        this.style.borderRadius = css;
        if (this.borderElement !== null){
            this.borderElement.style.borderRadius = css;
        }
    },

    updateHTMLProperty_shadow: function(layer){
        if (layer.presentation.shadowColor){
            this.style.boxShadow = '%fpx %fpx %fpx %s'.sprintf(layer.shadowOffset.x, layer.shadowOffset.y, layer.shadowRadius, layer.presentation.shadowColor.cssString());
        }else{
            this.style.boxShadow = '';
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Managing Canvas Elements & Context

    canvasContext: JSDynamicProperty('_canvasContext', null),
    _canvasElements: null,
    _canvasElementIndex: 0,

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
            // FIXME: scale should account for any transform on our layer or its ancestor layers
            var canvas = this._dequeueReusableCanvasElement();
            canvas.width = this.bounds.size.width * scale;
            canvas.height = this.bounds.size.height * scale;
            this._insertChildElement(canvas);
            this._canvasContext = canvas.getContext('2d');
            if (scale != 1){
                this._canvasContext.scale(scale, scale);
            }
            this._canvasContext.save();
            this._canvasContext.translate(-this.bounds.origin.x, -this.bounds.origin.y);
        }
        return this._canvasContext;
    },

    // ----------------------------------------------------------------------
    // MARK: - Tracking

    trackingElement: null,
    trackingListener: null,

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

    drawPath: function(drawingMode){
        switch (drawingMode){
            case JSContext.DrawingMode.fill:
                this.canvasContext.fill();
                break;
            case JSContext.DrawingMode.evenOddFill:
                throw new Error("UIHTMLDisplayServerCanvasContext.eoFillPath not implemented");
            case JSContext.DrawingMode.stroke:
                this.canvasContext.stroke();
                break;
            case JSContext.DrawingMode.fillStroke:
                this.canvasContext.fill();
                this.canvasContext.stroke();
                break;
            case JSContext.DrawingMode.evenOddFillStroke:
                throw new Error("UIHTMLDisplayServerCanvasContext.eoFillPath not implemented");
        }
        this.canvasContext.beginPath();
    },

    fillPath: function(fillRule){
        if (fillRule == JSContext.FillRule.evenOdd){
            throw new Error("UIHTMLDisplayServerCanvasContext.eoFillPath not implemented");
        }
        this.canvasContext.fill();
        this.canvasContext.beginPath();
    },

    strokePath: function(){
        this.canvasContext.stroke();
        this.canvasContext.beginPath();
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

    _imageElements: null,
    _imageElementIndex: 0,

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
                var caps = image.capInsets;
                if (caps !== null){
                    imageElement.style.backgroundColor = '';
                    imageElement.style.backgroundImage = '';
                    imageElement.style.maskImage = '';
                    imageElement.style.maskSize = '';
                    imageElement.style.webkitMaskImage = '';
                    imageElement.style.webkitMaskSize = '';
                    imageElement.style.borderWidth = '%dpx %dpx %dpx %dpx'.sprintf(caps.top, caps.right, caps.bottom, caps.left);
                    imageElement.style.borderImage = cssURL + " %d %d %d %d fill stretch".sprintf(caps.top * image.scale, caps.right * image.scale, caps.bottom * image.scale, caps.left * image.scale);
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
        element.style.transform = 'translate(%fpx,%fpx)'.sprintf(-this.bounds.origin.x, -this.bounds.origin.y);
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
        UIHTMLDisplayServerCanvasContext.$super.setFillColor.call(this, fillColor);
        this.canvasContext.fillStyle = fillColor ? fillColor.cssString() : '';
    },

    setStrokeColor: function(strokeColor){
        UIHTMLDisplayServerCanvasContext.$super.setStrokeColor.call(this, strokeColor);
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
            throw new Error("UIHTMLDisplayServerCanvasContext does not support even-odd clipping");
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

});