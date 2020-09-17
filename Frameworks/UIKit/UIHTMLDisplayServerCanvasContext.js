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
        this.bounds = JSRect.Zero;
    },

    initForDocument: function(document){
        UIHTMLDisplayServerCanvasContext.$super.init.call(this);
        this.element = document.createElement('div');
        this.element.setAttribute("role", "none presentation");
        this.style = this.element.style;
        this.style.position = 'absolute';
        this.style.boxSizing = 'border-box';
        this.style.mozBoxSizing = 'border-box';
        this.style.touchAction = 'none';
        this.state.clips = [];
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
            this.borderElement.setAttribute("role", "none presentation");
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
        element.style.position = "absolute";
        element.style.left = "%dpx".sprintf(rect.origin.x);
        element.style.top = "%dpx".sprintf(rect.origin.y);
        element.style.width = "%dpx".sprintf(rect.size.width);
        element.style.height = "%dpx".sprintf(rect.size.height);
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
            canvasElement.setAttribute("role", "none presentation");
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
            for (i = 0, l = this.stack.length; i < l; ++i){
                this._canvasContextAdoptState(this._canvasContext, this.stack[i], scale);
                this._canvasContext.save();
                this._canvasContext._restoreCount++;
            }
            this._canvasContextAdoptState(this._canvasContext, this.state, scale);
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
        context.lineDashOffset = state.lineDashPhase;
        context.setLineDash(state.lineDashArray);
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
            this.trackingElement.setAttribute("role", "none presentation");
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

    createPath: function(){
        return UIHTMLDisplayServerCanvasContextPath.initWritingToContext(this);
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
        imageElement.style.backgroundColor = this.state.fillColor ? this.state.fillColor.cssString() : '';
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
            if (this.state.isClipped){
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
            imageElement.setAttribute("role", "none presentation");
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
        var transform = this.state.transform.translatedBy(rect.origin.x, rect.origin.y).concatenatedWith(boundsTransform);
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
        UIHTMLDisplayServerCanvasContext.$super.setFont.call(this, font);
        if (this._canvasContext){
            this._canvasContext.font = font ? font.cssString() : '';
        }
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

    setAlpha: function(alpha){
        UIHTMLDisplayServerCanvasContext.$super.setAlpha.call(this, alpha);
        if (this._canvasContext){
             this._canvasContext.globalAlpha = alpha;
        }
    },

    setFillColor: function(fillColor){
        UIHTMLDisplayServerCanvasContext.$super.setFillColor.call(this, fillColor);
        if (this._canvasContext){
            this._canvasContext.fillStyle = fillColor ? fillColor.cssString() : '';
        }
    },

    setStrokeColor: function(strokeColor){
        UIHTMLDisplayServerCanvasContext.$super.setStrokeColor.call(this, strokeColor);
        if (this._canvasContext){
            this._canvasContext.strokeStyle = strokeColor ? strokeColor.cssString() : '';
        }
    },

    setShadow: function(offset, blur, color){
        UIHTMLDisplayServerCanvasContext.$super.setShadow.call(this, offset, blur, color);
        if (this._canvasContext){
            this._canvasContext.shadowOffsetX = offset.x;
            this._canvasContext.shadowOffsetY = offset.y;
            this._canvasContext.shadowBlur = blur * this.deviceScale;
            this._canvasContext.shadowColor = color ? color.cssString() : '';
        }
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
        if (this.path !== null){
            this.state.clips.push({arguments: args, operations: this.path.canvasOperations(this.canvasContext, this.state.transform)});
            this.state.isClipped = true;
            this.beginPath();
        }
    },

    // ----------------------------------------------------------------------
    // MARK: - Transformations

    concatenate: function(transform){
        UIHTMLDisplayServerCanvasContext.$super.concatenate.call(this, transform);
        if (this._canvasContext){
            this._canvasContext.transform(transform.a, transform.b, transform.c, transform.d, transform.tx, transform.ty);
        }
    },

    // ----------------------------------------------------------------------
    // MARK: - Drawing Options

    setLineWidth: function(lineWidth){
        UIHTMLDisplayServerCanvasContext.$super.setLineWidth.call(this, lineWidth);
        if (this._canvasContext){
            this._canvasContext.lineWidth = lineWidth;
        }
    },

    setLineCap: function(lineCap){
        UIHTMLDisplayServerCanvasContext.$super.setLineCap.call(this, lineCap);
        if (this._canvasContext){
            this._canvasContext.lineCap = lineCap;
        }
    },

    setLineJoin: function(lineJoin){
        UIHTMLDisplayServerCanvasContext.$super.setLineJoin.call(this, lineJoin);
        if (this._canvasContext){
            this._canvasContext.lineJoin = lineJoin;
        }
    },

    setMiterLimit: function(miterLimit){
        UIHTMLDisplayServerCanvasContext.$super.setMiterLimit.call(this, miterLimit);
        if (this._canvasContext){
            this._canvasContext.miterLimit = miterLimit;
        }
    },

    setLineDash: function(phase, lengths){
        UIHTMLDisplayServerCanvasContext.$super.setLineDash.call(this, phase, lengths);
        if (this._canvasContext){
            this._canvasContext.lineDashOffset = phase;
            this._canvasContext.setLineDash(lengths);
        }
    },

    // ----------------------------------------------------------------------
    // MARK: - Accessibility

    accessibilityFocusListener: null,
    accessibilityMousedownListener: null,

    setAccessibility: function(accessibility){
        var ariaRole = ariaRoleForAccessibility(accessibility);
        if (ariaRole !== null){
            this.element.setAttribute("role", ariaRole);
        }else{
            this.element.removeAttribute("role");
        }
        this.element.id = "accessibility-%d".sprintf(accessibility.objectID);
        switch (ariaRole){
            case "button":
            case "tab":
            case "checkbox":
            case "radio":
            case "textbox":
            case "searchbox":
                this.element.setAttribute("tabindex", "0");
                this.element.style.outline = "none";
                if (this.accessibilityFocusListener !== null){
                    this.element.removeEventListener("focus", this.accessibilityFocusListener);
                }
                if (this.accessibilityMousedownListener !== null){
                    this.element.removeEventListener("mousedown", this.accessibilityMousedownListener);
                }
                this.accessibilityFocusListener = function(e){
                    var responder = accessibility.accessibilityResponder;
                    if (responder && responder.isKindOfClass(UIView)){
                        if (responder.window !== null){
                            responder.window.firstResponder = responder;
                        }
                    }
                };
                this.accessibilityMousedownListener = function(e){
                    // We don't want mousedown to focus the element
                    // Unfortunately, this prevents the element from working with drag and drop
                    e.preventDefault();
                };
                this.element.addEventListener("focus", this.accessibilityFocusListener);
                this.element.addEventListener("mousedown", this.accessibilityMousedownListener);
                break;
            // case "application":
            //     this.element.setAttribute("tabindex", "0");
            //     break;
        }
        this.updateAccessibilityLabel(accessibility);
        this.updateAccessibilityValue(accessibility);
        this.updateAccessibilitySelected(accessibility);
        this.updateAccessibilityExpanded(accessibility);
        this.updateAccessibilityHidden(accessibility);
        this.updateAccessibilityEnabled(accessibility);
        var menu = accessibility.accessibilityMenu;
        if (menu !== null && menu !== undefined){
            this.element.setAttribute("aria-haspopup", "menu");
        }
        var orientation = accessibility.accessibilityOrientation;
        if (orientation !== null && orientation !== undefined){
            this.element.setAttribute("aria-orientation", orientation === UIAccessibility.Orientation.horizontal ? "horizontal" : "vertical");
        }
        if (accessibility.accessibilityRole === UIAccessibility.Role.window && ariaRole == "application"){
            this.element.setAttribute("aria-roledescription", "window");
        }
        var level = accessibility.accessibilityLevel;
        if (level !== null && level !== undefined){
            this.element.setAttribute("aria-level", level);
        }
    },

    updateAccessibilityLabel: function(accessibility){
        var label = accessibility.accessibilityLabel;
        var hint = accessibility.accessibilityHint;
        if (hint !== null && hint !== undefined){
            if (label === null && label !== undefined){
                label = hint;
            }else{
                label += ",  " + hint;
            }
        }
        if (label !== null && label !== undefined){
            this.element.setAttribute("aria-label", label);
        }else{
            this.element.removeAttribute("aria-label");
        }
    },

    updateAccessibilityValue: function(accessibility){
        var checked = accessibility.accessibilityChecked;
        if (checked !== null && checked !== undefined){
            switch (checked){
                case UIAccessibility.Checked.on:
                    this.element.removeAttribute("aria-valuemin");
                    this.element.removeAttribute("aria-valuemax");
                    this.element.removeAttribute("aria-valuenow");
                    this.element.removeAttribute("aria-valuetext");
                    this.element.setAttribute("aria-checked", "true");
                    return;
                case UIAccessibility.Checked.off:
                    this.element.removeAttribute("aria-valuemin");
                    this.element.removeAttribute("aria-valuemax");
                    this.element.removeAttribute("aria-valuenow");
                    this.element.removeAttribute("aria-valuetext");
                    this.element.setAttribute("aria-checked", "false");
                    return;
                case UIAccessibility.Checked.mixed:
                    this.element.removeAttribute("aria-valuemin");
                    this.element.removeAttribute("aria-valuemax");
                    this.element.removeAttribute("aria-valuenow");
                    this.element.removeAttribute("aria-valuetext");
                    this.element.setAttribute("aria-checked", "mixed");
                    return;
            }
        }
        var range = accessibility.valueRange;
        var value = accessibility.accessibilityValue;
        if (range !== null && range !== undefined && typeof(value) == "number"){
            this.element.removeAttribute("aria-checked");
            this.element.removeAttribute("aria-valuetext");
            this.element.setAttribute("aria-valuemin", range.location);
            this.element.setAttribute("aria-valuemax", range.end);
            this.element.setAttribute("aria-valuenow", value);
            return;
        }
        this.element.removeAttribute("aria-checked");
        this.element.removeAttribute("aria-valuemin");
        this.element.removeAttribute("aria-valuemax");
        this.element.removeAttribute("aria-valuenow");
        if (value !== null && value !== undefined){
            this.element.setAttribute("aria-valuetext", value);
        }else{
            this.element.removeAttribute("aria-valuetext");
        }
    },

    updateAccessibilitySelected: function(accessibility){
        var selected = accessibility.accessibilitySelected;
        if (selected === null || selected === undefined){
            this.element.removeAttribute("aria-selected");
        }else{
            var value = selected ? "true" : "false";
            if (this.element.getAttribute("aria-selected") !== value){
                this.element.setAttribute("aria-selected", value);
            }
        }
    },

    updateAccessibilityExpanded: function(accessibility){
        var expanded = accessibility.accessibilityExpanded;
        if (expanded === null || expanded === undefined){
            this.element.removeAttribute("aria-expanded");
        }else{
            var value = expanded ? "true" : "false";
            if (this.element.getAttribute("aria-expanded") !== value){
                this.element.setAttribute("aria-expanded", value);
            }
        }
    },

    updateAccessibilityEnabled: function(accessibility){
        var enabled = accessibility.accessibilityEnabled;
        if (enabled === false){
            this.element.setAttribute("aria-disabled", "true");
        }else{
            this.element.removeAttribute("aria-disabled");
        }
    },

    updateAccessibilityHidden: function(accessibility){
        var hidden = accessibility.accessibilityHidden;
        if (hidden === true){
            this.element.setAttribute("aria-hidden", "true");
        }else{
            this.element.removeAttribute("aria-hidden");
        }
    },

    updateAccessibilityFocus: function(accessibility){
        this.element.focus();
        // if (focusedAccessibility === null || focusedAccessibility === undefined){
        //     this.element.removeAttribute("aria-activedescendant");
        // }else{
        //     this.element.setAttribute("aria-activedescendant", "accessibility-%d".sprintf(focusedAccessibility.objectID));
        // }
    },

    // ----------------------------------------------------------------------
    // MARK: - Graphics State

    save: function(){
        UIHTMLDisplayServerCanvasContext.$super.save.call(this);
        if (this._canvasContext){
            this._canvasContext.save();
            this._canvasContext._restoreCount++;
        }
        this.state.clips = [];
    },

    restore: function(){
        UIHTMLDisplayServerCanvasContext.$super.restore.call(this);
        if (this._canvasContext){
            this._canvasContext.restore();
            this._canvasContext._restoreCount--;
        }
    },

});

UIHTMLDisplayServerCanvasContext.State = Object.create(JSContext.State, {

    clips: {
        writable: true,
        value: null,
    },

    isClipped: {
        writable: true,
        value: false
    }

});

JSClass("UIHTMLDisplayServerCanvasContextPath", JSPath, {

    initWritingToContext: function(context){
        UIHTMLDisplayServerCanvasContextPath.$super.init.call(this);
        this.context = context;
        this.context.canvasContext.beginPath();
    },

    moveToPoint: function(point, transform){
        UIHTMLDisplayServerCanvasContextPath.$super.moveToPoint.call(this, point, transform);
        this.context.canvasContext.moveTo(point.x, point.y);
    },

    addLineToPoint: function(point, transform){
        UIHTMLDisplayServerCanvasContextPath.$super.addLineToPoint.call(this, point, transform);
        this.context.canvasContext.lineTo(point.x, point.y);
    },

    addCurveToPoint: function(point, control1, control2, transform){
        UIHTMLDisplayServerCanvasContextPath.$super.addCurveToPoint.call(this, point, control1, control2, transform);
        this.context.canvasContext.bezierCurveTo(control1.x, control1.y, control2.x, control2.y, point.x, point.y);
    },

    closeSubpath: function(){
        UIHTMLDisplayServerCanvasContextPath.$super.closeSubpath.call(this);
        this.context.canvasContext.closePath();
    },

    canvasOperations: function(prototype, transform){
        var operations = [];
        var i, l;
        var j, k;
        var subpath;
        var segment;
        var point;
        var cp1;
        var cp2;
        for (i = 0, l = this.subpaths.length; i < l; ++i){
            subpath = this.subpaths[i];
            point = transform.convertPointToTransform(subpath.firstPoint);
            operations.push({method: prototype.moveTo, arguments: [point.x, point.y]});
            for (j = 0, k = subpath.segments.length; j < k; ++j){
                segment = subpath.segments[j];
                if (segment.type === JSPath.SegmentType.line){
                    point = transform.convertPointToTransform(segment.end);
                    operations.push({method: prototype.lineTo, arguments: [point.x, point.y]});
                }else if (segment.type === JSPath.SegmentType.curve){
                    point = transform.convertPointToTransform(segment.curve.p2);
                    cp1 = transform.convertPointToTransform(segment.curve.cp1);
                    cp2 = transform.convertPointToTransform(segment.curve.cp2);
                    operations.push({method: prototype.bezierCurveTo, arguments: [cp1.x, cp1.y, cp2.x, cp2.y, point.x, point.y]});
                }
            }
            if (subpath.closed){
                operations.push({method: prototype.closePath, arguments: []});
            }
        }
        return operations;
    }

});

var ariaRoleForAccessibility = function(accessibility){
    switch (accessibility.accessibilityRole){
        case UIAccessibility.Role.application:
            return "application";
        case UIAccessibility.Role.activityIndicator:
            return "progressbar";
        case UIAccessibility.Role.button:
            switch (accessibility.accessibilitySubrole){
                case UIAccessibility.Subrole.tab:
                    return "tab";
            }
            return "button";
        case UIAccessibility.Role.checkbox:
            return "checkbox";
        case UIAccessibility.Role.image:
            return "img";
        case UIAccessibility.Role.list:
            return "list";
        case UIAccessibility.Role.menu:
            return "menu";
        case UIAccessibility.Role.menuBar:
            return "menubar";
        case UIAccessibility.Role.menuBarItem:
            return "button";
        case UIAccessibility.Role.menuItem:
            switch (accessibility.accessibilitySubrole){
                case UIAccessibility.Subrole.separator:
                    return "separator";
                case UIAccessibility.Subrole.menuItemRadio:
                    return "menuitemradio";
                case UIAccessibility.Subrole.menuItemCheckbox:
                    return "menuitemcheckbox";
            }
            return "menuitem";
        case UIAccessibility.Role.outline:
            return "treegrid";
        case UIAccessibility.Role.group:
            return "group";
        case UIAccessibility.Role.window:
            switch (accessibility.accessibilitySubrole){
                case UIAccessibility.Subrole.alert:
                    return "alertdialog";
                case UIAccessibility.Subrole.dialog:
                    return "dialog";
                case UIAccessibility.Subrole.tooltip:
                    return "tooltip";
            }
            return "dialog"; // wish I could do "window", but it's abstract
        case UIAccessibility.Role.popover:
            return "dialog";
        case UIAccessibility.Role.comboBox:
            return "combobox";
        case UIAccessibility.Role.grid:
            return "grid";
        case UIAccessibility.Role.cell:
            return "gridcell";
        case UIAccessibility.Role.progressIndicator:
            return "progressbar";
        case UIAccessibility.Role.scrollBar:
            return "scrollbar";
        case UIAccessibility.Role.radioButton:
            return "radio";
        case UIAccessibility.Role.radioGroup:
            return "radiogroup";
        case UIAccessibility.Role.textField:
            switch (accessibility.accessibilitySubrole){
                case UIAccessibility.Subrole.searchField:
                    return "searchbox";
                // "password" is part of ARIA 2.0
                // case UIAccessibility.Subrole.secureTextField:
                //     return "password";
            }
            return "textbox";
        case UIAccessibility.Role.toolbar:
            return "toolbar";
        case UIAccessibility.Role.link:
            return "link";
        case UIAccessibility.Role.row:
            return "row";
        case UIAccessibility.Role.incrementor:
            return "spinbutton";
        case UIAccessibility.Role.popupButton:
            // Button seems more correct than listbox
            // since options are part of a menu that
            // appears when the user presses the button
            return "button";
        case UIAccessibility.Role.disclosureTriangle:
            return "button";
        case UIAccessibility.Role.header:
            // Button seems more correct than listbox
            // since options are part of a menu that
            // appears when the user presses the button
            return "heading";
        case UIAccessibility.Role.tabGroup:
            return "tablist";
        case UIAccessibility.Role.text:
            return null;
        case UIAccessibility.Role.browser:
            // treegrid??
        case UIAccessibility.Role.colorWell:
            // button??
        case UIAccessibility.Role.column:
        case UIAccessibility.Role.drawer:
        case UIAccessibility.Role.growArea:
        case UIAccessibility.Role.handle:
        case UIAccessibility.Role.helpTag:
        case UIAccessibility.Role.layoutArea:
        case UIAccessibility.Role.layoutItem:
        case UIAccessibility.Role.levelIndicator:
        case UIAccessibility.Role.matte:
        case UIAccessibility.Role.menuButton:
        case UIAccessibility.Role.pageRole:
        case UIAccessibility.Role.relevanceIndicator:
        case UIAccessibility.Role.ruler:
        case UIAccessibility.Role.rulerMarker:
        case UIAccessibility.Role.scrollArea:
        case UIAccessibility.Role.sheet:
        case UIAccessibility.Role.slider:
        case UIAccessibility.Role.splitGroup:
        case UIAccessibility.Role.splitter:
        case UIAccessibility.Role.systemWide:
        case UIAccessibility.Role.table:
        case UIAccessibility.Role.textArea:
        case UIAccessibility.Role.unknown:
        case UIAccessibility.Role.valueIndicator:
            break;
    }
    return null;
};

// Unused ARIA roles
// alert
// article
// banner
// columnheader
// complementary
// contentinfo
// definition
// directory
// document
// feed
// figure
// form
// listbox
// listitem
// log
// main
// marquee
// math
// menuitemcheckbox
// menuitemradio
// navigation
// note
// option
// region
// rowgroup
// rowheader
// search
// slider
// status
// switch
// table
// tabpanel
// term
// timer
// tree
// treeitem

})();