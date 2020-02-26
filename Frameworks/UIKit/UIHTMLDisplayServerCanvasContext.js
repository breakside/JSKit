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

// #import Foundation
// #import "UIHTMLDisplayServerContext.js"
// jshint browser: true
'use strict';

(function(){

JSClass("UIHTMLDisplayServerCanvasContext", UIHTMLDisplayServerContext, {

    hasDragEvents: true,
    style: null,

    firstSublayerNodeIndex: 0,
    layerManagedNodeCount: 0,

    // --------------------------------------------------------------------
    // MARK: - Creating a Context

    initScreenInContainer: function(containerElement){
        this.initForDocument(containerElement.ownerDocument);
        this.style.top = '0';
        this.style.left = '0';
        this.style.bottom = '0';
        this.style.right = '0';
    },

    initForScreenContext: function(screenContext){
        this.initForDocument(screenContext.element.ownerDocument);
        this.layerManagedNodeCount = this.element.childNodes.length;
        this.firstSublayerNodeIndex = this.layerManagedNodeCount;
        this.propertiesNeedingUpdate = {
            size: true,
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
        this._currentPath = [];
        this._stack = [];
        this._state = Object.create(StatePrototype, {
            clips: {
                value: []
            }
        });
        this.bounds = JSRect.Zero;
    },

    initForDocument: function(document){
        UIHTMLDisplayServerCanvasContext.$super.init.call(this);
        this.element = document.createElement('div');
        this.style = this.element.style;
        this.style.position = 'absolute';
        this.style.boxSizing = 'border-box';
        this.style.mozBoxSizing = 'border-box';
        this.style.touchAction = 'none';
    },

    // --------------------------------------------------------------------
    // MARK: - Destroying a Context

    destroy: function(){
        this.trackingElement = null;
        this.style = null;
        UIHTMLDisplayServerCanvasContext.$super.destroy.call(this);
    },

    // --------------------------------------------------------------------
    // MARK: - Size & Position

    setOrigin: function(origin){
        this.style.top = origin.y + 'px';
        this.style.left = origin.x + 'px';
    },

    setSize: function(size){
        // No need to set size becuase it's only called on the root context, which
        // we anchor to top/right/bottom/left
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
        var canvasContext;
        for (i = 0, l = this._canvasElements.length; i < l; ++i){
            canvasContext = this._canvasElements[i].getContext('2d');
            for (; canvasContext._restoreCount >= 0; --canvasContext._restoreCount){
                canvasContext.restore();
            }
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

    updateHTMLProperty_size: function(layer){
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
            canvasElement.style.pointerEvents = 'none';
            this._canvasElements.push(canvasElement);
        }
        var element = this._canvasElements[this._canvasElementIndex];
        ++this._canvasElementIndex;
        return element;
    },

    deviceScale: JSReadOnlyProperty(),

    getDeviceScale: function(){
        return this.element.ownerDocument.defaultView.devicePixelRatio || 1;
    },

    getCanvasContext: function(){
        if (!this._canvasContext){
            var scale = this.deviceScale;
            // FIXME: scale should account for any transform ancestor layers
            var canvas = this._dequeueReusableCanvasElement();
            canvas.width = this.bounds.size.width * scale;
            canvas.height = this.bounds.size.height * scale;
            this._insertChildElement(canvas);
            this._canvasContext = canvas.getContext('2d');
            this._canvasContext.save();
            this._canvasContext._restoreCount = 1;
            if (scale != 1){
                this._canvasContext.scale(scale, scale);
            }
            this._canvasContext.translate(-this.bounds.origin.x, -this.bounds.origin.y);
            this._canvasContext.save();
            this._canvasContext._restoreCount++;

            // Catch up to current state
            // - If this is the first state, some state udpate (like set color) are
            //   done without creating a canvasContext, because it might not be necessary
            //   depending on the subsequent drawing operation.
            // - If this is not the first canvas element we've added, then
            //   we need to make sure its state agrees with the state of the
            //   previous canvas
            var i, l;
            for (i = 0, l = this._stack.length; i < l; ++i){
                this._canvasContextAdoptState(this._canvasContext, this._stack[i], scale);
                this._canvasContext.save();
                this._canvasContext._restoreCount++;
            }
            this._canvasContextAdoptState(this._canvasContext, this._state, scale);
        }
        return this._canvasContext;
    },

    _canvasContextAdoptState: function(context, state, scale){
        context.globalAlpha = state.alpha;
        context.fillStyle = state.fillColor ? state.fillColor.cssString() : '';
        context.strokeStyle = state.strokeColor ? state.strokeColor.cssString() : '';
        context.shadowOffsetX = state.shadowOffset.x;
        context.shadowOffsetY = state.shadowOffset.y;
        context.shadowBlur = state.shadowBlur;
        context.shadowColor = state.shadowColor ? state.shadowColor.cssString() : '';
        context.lineWidth = state.lineWidth;
        context.lineCap = state.lineCap;
        context.lineJoin = state.lineJoin;
        context.miterLimit = state.miterLimit;
        context.lineDashOffset = state.lineDash[0];
        context.setLineDash(state.lineDash[1]);
        var transform = state.transform.concatenatedWith(JSAffineTransform.Scaled(scale, scale));
        context.setTransform(transform.a, transform.b, transform.c, transform.d, transform.tx, transform.ty);
        context.font = state.font ? state.font.cssString() : '';
        var clip;
        var op;
        for (var i = 0, l = state.clips.length; i < l; ++i){
            clip = state.clips[i];
            for (var j = 0, k = clip.operations.length; j < k; ++j){
                op = clip.operations[j];
                op.method.apply(context, op.arguments);
            }
            context.clip.apply(context, clip.arguments);
            context.beginPath();
        }
    },

    // ----------------------------------------------------------------------
    // MARK: - Tracking

    trackingElement: null,
    trackingListener: null,

    startMouseTracking: function(trackingType, listener, layer){
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

    setCursor: function(cursor){
        if (cursor === null){
            this.element.style.cursor = '';
            return;
        }
        var cssCursorStrings = cursor.cssStrings();
        // UICursor.cssStrings() returns a set of css strings, one of which
        // should work in our browser, but some of which may fail because they
        // use commands specific to other browsers.  The failure looks like
        // style.cursor is an empty string, so we'll keep going until it's
        // not an empty string, or we're out of options
        for (var i = 0, l = cssCursorStrings.length; i < l; ++i){
            this.element.style.cursor = cssCursorStrings[i];
            if (this.element.style.cursor !== ''){
                break;
            }
        }
    },

    // ----------------------------------------------------------------------
    // MARK: - Sublayers

    insertSublayerContext: function(sublayer, context){
        var insertIndex = this.firstSublayerNodeIndex + sublayer.sublayerIndex;
        // If we're moving within the same node, we need to be careful about the index
        // calculations.  For example, if context.element is currently at index 4, and it's
        // moving to index 7, that 7 was calculated assuming that index 4 was removed.  So it
        // really should be 8 in the DOM since our element is still in there.  But we can't just
        // add 1 because the same doesn't hold if we're moving down in index, like from 7 to 4.
        // So the easiest thing to do is remove our element from the parent first.  Alternatively,
        // we could find the current index with Array.indexOf(), and conditionally add 1 if moving up.
        // I doubt there's a big performance difference.
        if (context.element.parentNode === this.element){
            this.element.removeChild(context.element);
        }
        if (insertIndex < this.element.childNodes.length){
            if (context.element !== this.element.childNodes[insertIndex]){
                this.element.insertBefore(context.element, this.element.childNodes[insertIndex]);
            }
        }else{
            this.element.appendChild(context.element);
        }
    },

    // ----------------------------------------------------------------------
    // MARK: - Constructing Paths

    beginPath: function(){
        this.canvasContext.beginPath();
        this._currentPath = [];
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
        var imageElement = this._dequeueReusableImageElement();
        this._positionImageElement(imageElement, maskImage, rect);
        var url = maskImage.htmlURLString();
        var cssURL = "url('" + url + "')";
        imageElement.style.maskImage = cssURL;
        imageElement.style.maskSize = '100% 100%';
        imageElement.style.webkitMaskImage = cssURL;
        imageElement.style.webkitMaskSize = '100% 100%';
        imageElement.style.backgroundColor = this._state.fillColor ? this._state.fillColor.cssString() : '';
        this._insertChildElement(imageElement);
    },

    strokeRect: function(rect){
        this.canvasContext.strokeRect(rect.origin.x, rect.origin.y, rect.size.width, rect.size.height);
        this.beginPath();
    },

    // ----------------------------------------------------------------------
    // MARK: - Images

    _imageElements: null,
    _imageElementIndex: 0,

    drawImage: function(image, rect){
        if (image !== null){
            var url = image.htmlURLString();
            // FIXME: proof of concept, but really shouldn't do async
            // drawing to a reusable canvas.
            //
            // Better long term solution is likely to have image data
            // already prepped so we can do sync drawing for all images,
            // regardless of clipping path
            if (this._state.isClipped){
                var img = this.element.ownerDocument.createElement('img');
                this._canvasContext = null;
                var context = this.canvasContext;
                this._canvasContext = null;
                img.onload = function(){
                    context.drawImage(img, rect.origin.x, rect.origin.y, rect.size.width, rect.size.height);
                    img.onload = null;
                };
                for (var i = 0; i <= context._restoreCount; ++i){
                    context.save();
                }
                img.src = url;
                return;
            }
            var imageElement = this._dequeueReusableImageElement();
            this._positionImageElement(imageElement, image, rect);
            var cssURL = "url('" + url + "')";
            var caps = image.capInsets;
            if (caps !== null){
                imageElement.style.borderWidth = '%dpx %dpx %dpx %dpx'.sprintf(caps.top, caps.right, caps.bottom, caps.left);
                imageElement.style.borderImage = cssURL + " %d %d %d %d fill stretch".sprintf(caps.top * image.scale, caps.right * image.scale, caps.bottom * image.scale, caps.left * image.scale);
            }else{
                imageElement.style.backgroundImage = cssURL;
                imageElement.style.backgroundSize = '100% 100%';
            }
            this._insertChildElement(imageElement);
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
        element.style.backgroundColor = '';
        element.style.backgroundImage = '';
        element.style.backgroundSize = '';
        element.style.borderWidth = '';
        element.style.borderImage = '';
        element.style.maskImage = '';
        element.style.maskSize = '';
        element.style.webkitMaskImage = '';
        element.style.webkitMaskSize = '';
        element.style.pointerEvents = 'none';
        return element;
    },

    _positionImageElement: function(imageElement, image, rect){
        var boundsTransform = JSAffineTransform.Translated(-this.bounds.origin.x, -this.bounds.origin.y);
        var transform = this._state.transform.translatedBy(rect.origin.x, rect.origin.y).concatenatedWith(boundsTransform);
        var size = JSSize(image.size);
        if (image.capInsets){
            size.width = rect.size.width;
            size.height = rect.size.height;
        }
        transform = transform.scaledBy(rect.size.width / size.width, rect.size.height / size.height);
        imageElement.style.top = '0';
        imageElement.style.left = '0';
        imageElement.style.transformOrigin = 'top left';
        imageElement.style.width = size.width + 'px';
        imageElement.style.height = size.height + 'px';
        imageElement.style.transform = 'matrix(%f, %f, %f, %f, %f, %f)'.sprintf(transform.a, transform.b, transform.c, transform.d, transform.tx, transform.ty);
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

    setFont: function(font){
        this._state.font = font;
        if (this._canvasContext){
            this._canvasContext.font = font ? font.cssString() : '';
        }
    },

    setCharacterSpacing: function(spacing){
        this._state.characterSpacing = spacing;
    },

    setTextMatrix: function(textMatrix){
        this._state.textMatrix = textMatrix;
    },

    setTextDrawingMode: function(textDrawingMode){
        this._state.textDrawingMode = textDrawingMode;
    },

    showGlyphs: function(glyphs){
        var tm = this._state.textMatrix;
        var width;
        var glyph;
        var text;
        var font = this._state.font;
        this.save();
        this.setLineWidth(this.canvasContext.lineWidth / Math.abs(tm.d));
        this.concatenate(tm);
        for (var i = 0, l = glyphs.length; i < l; ++i){
            glyph = glyphs[i];
            text = font.stringForGlyphs([glyph]);
            if (this._state.textDrawingMode == JSContext.TextDrawingMode.fill || this._state.textDrawingMode == JSContext.TextDrawingMode.fillStroke){
                this.canvasContext.fillText(text, 0, 0);
            }
            if (this._state.textDrawingMode == JSContext.TextDrawingMode.stroke || this._state.textDrawingMode == JSContext.TextDrawingMode.fillStroke){
                this.canvasContext.strokeText(text, 0, 0);
            }
            width = font.widthOfGlyph(glyph) + this._state.characterSpacing;
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
        if (this._state.characterSpacing !== 0){
            this._showSpacedText(text);
            return;
        }

        // If character spacing is zero, then it's far more effient to just paint
        // the text we were given all at once.
        var tm = this._state.textMatrix;
        var nonIdentityMatrix = !tm.isIdentity;
        if  (nonIdentityMatrix){
            // Canvas2D doens't have a concept of a text transform, so we'll just
            // add it to the base transform.
            // - Be sure to adjust the lineWidth for the new scale
            this.save();
            this.setLineWidth(this.canvasContext.lineWidth / Math.abs(tm.d));
            this.concatenate(tm);
        }
        if (this._state.textDrawingMode == JSContext.TextDrawingMode.fill || this._state.textDrawingMode == JSContext.TextDrawingMode.fillStroke){
            this.canvasContext.fillText(text, 0, 0);
        }
        if (this._state.textDrawingMode == JSContext.TextDrawingMode.stroke || this._state.textDrawingMode == JSContext.TextDrawingMode.fillStroke){
            this.canvasContext.strokeText(text, 0, 0);
        }
        // Debugging
        // this.canvasContext.save();
        // this.setFillColor(JSColor.initWithRGBA(1,0,0,0.4));
        // this.fillRect(JSRect(0, -this._state.font.ascender, this._state.font.lineHeight, this._state.font.lineHeight));
        // this.canvasContext.restore();
        if (nonIdentityMatrix){
            this.restore();
        }
    },

    _showSpacedText: function(text){
        var tm = this._state.textMatrix;
        var width;
        var font = this._state.font;
        this.save();
        this.setLineWidth(this.canvasContext.lineWidth / Math.abs(tm.d));
        this.concatenate(tm);
        var iterator = text.unicodeIterator();
        while (iterator.character !== null){
            if (this._state.textDrawingMode == JSContext.TextDrawingMode.fill || this._state.textDrawingMode == JSContext.TextDrawingMode.fillStroke){
                this.canvasContext.fillText(iterator.character.utf16, 0, 0);
            }
            if (this._state.textDrawingMode == JSContext.TextDrawingMode.stroke || this._state.textDrawingMode == JSContext.TextDrawingMode.fillStroke){
                this.canvasContext.strokeText(iterator.character.utf16, 0, 0);
            }
            width = font.widthOfCharacter(iterator.character) + this._state.characterSpacing;
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
        this._state.alpha = alpha;
        if (this._canvasContext){
             this._canvasContext.globalAlpha = alpha;
        }
    },

    setFillColor: function(fillColor){
        UIHTMLDisplayServerCanvasContext.$super.setFillColor.call(this, fillColor);
        if (this._canvasContext){
            this._canvasContext.fillStyle = fillColor ? fillColor.cssString() : '';
        }
        this._state.fillColor = fillColor;
    },

    setStrokeColor: function(strokeColor){
        UIHTMLDisplayServerCanvasContext.$super.setStrokeColor.call(this, strokeColor);
        if (this._canvasContext){
            this._canvasContext.strokeStyle = strokeColor ? strokeColor.cssString() : '';
        }
        this._state.strokeColor = strokeColor;
    },

    setShadow: function(offset, blur, color){
        if (this._canvasContext){
            this._canvasContext.shadowOffsetX = offset.x;
            this._canvasContext.shadowOffsetY = offset.y;
            this._canvasContext.shadowBlur = blur * this.deviceScale;
            this._canvasContext.shadowColor = color ? color.cssString() : '';
        }
        this._state.shadowOffset = offset;
        this._state.shadowBlur = blur;
        this._state.shadowColor = color;
    },

    // ----------------------------------------------------------------------
    // MARK: - Clipping

    clip: function(fillRule){
        var args = [];
        if (fillRule == JSContext.FillRule.evenOdd){
            this.canvasContext.clip('evenodd');
            args.push('evenodd');
        }else{
            this.canvasContext.clip();
        }
        this._state.clips.push({arguments: args, operations: JSCopy(this._currentPath)});
        this._state.isClipped = true;
        this.beginPath();
    },

    // ----------------------------------------------------------------------
    // MARK: - Transformations

    scaleBy: function(sx, sy){
        if (this._canvasContext){
            this._canvasContext.scale(sx, sy);
        }
        this._state.transform = this._state.transform.scaledBy(sx, sy);
    },

    rotateBy: function(angle){
        if (this._canvasContext){
            this._canvasContext.rotate(angle);
        }
        this._state.transform = this._state.transform.rotatedBy(angle);
    },

    translateBy: function(tx, ty){
        if (this._canvasContext){
            this._canvasContext.translate(tx, ty);
        }
        this._state.transform = this._state.transform.translatedBy(tx, ty);
    },

    concatenate: function(transform){
        if (this._canvasContext){
            this._canvasContext.transform(transform.a, transform.b, transform.c, transform.d, transform.tx, transform.ty);
        }
        this._state.transform = transform.concatenatedWith(this._state.transform);
    },

    // ----------------------------------------------------------------------
    // MARK: - Drawing Options

    setLineWidth: function(lineWidth){
        if (this._canvasContext){
            this._canvasContext.lineWidth = lineWidth;
        }
        this._state.lineWidth = lineWidth;
    },

    setLineCap: function(lineCap){
        if (this._canvasContext){
            this._canvasContext.lineCap = lineCap;
        }
        this._state.lineWidth = lineCap;
    },

    setLineJoin: function(lineJoin){
        if (this._canvasContext){
            this._canvasContext.lineJoin = lineJoin;
        }
        this._state.lineJoin = lineJoin;
    },

    setMiterLimit: function(miterLimit){
        if (this._canvasContext){
            this._canvasContext.miterLimit = miterLimit;
        }
        this._state.miterLimit = miterLimit;
    },

    setLineDash: function(phase, lengths){
        if (this._canvasContext){
            this._canvasContext.lineDashOffset = phase;
            this._canvasContext.setLineDash(lengths);
        }
        this._state.lineDash = [phase, lengths];
    },

    // ----------------------------------------------------------------------
    // MARK: - Graphics State

    save: function(){
        if (this._canvasContext){
            this._canvasContext.save();
            this._canvasContext._restoreCount++;
        }
        this._stack.push(this._state);
        this._state = Object.create(this._state, {
            clips: {
                value: []
            }
        });
    },

    restore: function(){
        if (this._canvasContext){
            this._canvasContext.restore();
            this._canvasContext._restoreCount--;
        }
        if (this._stack.length > 0){
            this._state = this._stack.pop();
        }
    },

});

var StatePrototype = {
    alpha: 1,
    font: null,
    transform: JSAffineTransform.Identity,
    textMatrix: JSAffineTransform.Identity,
    characterSpacing: 0,
    textDrawingMode: JSContext.TextDrawingMode.fill,
    fillColor: JSColor.black,
    strokeColor: JSColor.black,
    shadowOffset: JSPoint.Zero,
    shadowBlur: 0,
    shadowColor: null,
    lineWidth: 0,
    miterLimit: 10,
    lineCap: JSContext.LineCap.butt,
    lineJoin: JSContext.LineJoin.miter,
    lineDash: [0, []],
    clips: null,
    isClipped: false
};

})();