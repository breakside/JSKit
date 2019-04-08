// #import Foundation
// #import "UIKit/UIView.js"
// #import "UIKit/UIHTMLDisplayServerContext.js"
// #import "UIKit/SVGPathSegList.js"
/* global SVGLength, JSClass, UILayer, JSContext, JSAffineTransform, JSColor, JSObject, UIHTMLDisplayServerContext, UIHTMLDisplayServerSVGContext, JSCustomProperty, JSDynamicProperty, JSLazyInitProperty, JSPoint, JSContextLineDash, UIView, _UIHTMLDisplayServerSVGContextDefs */
'use strict';

(function(){

// Context element
// g
//   shadow?
//   tracking?
//   backgroundColor?
//   backgroundGradient?
//   customDrawing?
//   sublayers?
//     sublayer*
//   border?

JSClass("UIHTMLDisplayServerSVGContext", UIHTMLDisplayServerContext, {

    _trackingIndex: 0,
    _backgroundIndex: 0,
    _backgroundGradientIndex: 0,
    _sublayersIndex: 0,

    // ----------------------------------------------------------------------
    // MARK: - Creating a Context

    initScreenInContainer: function(containerElement){
        UIHTMLDisplayServerSVGContext.$super.init.call(this);
        var doc = containerElement.ownerDocument;
        this.element = doc.createElementNS(SVGNamespace, "svg");
        this.element.setAttribute("version", "1.1");
        this.element.width.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PX, 100);
        this.element.height.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PX, 100);
        this.element.style.pointerEvents = 'none';
        this.element.style.position = 'absolute';
        this.element.style.top = '0';
        this.element.style.left = '0';
        this._definitions = _UIHTMLDisplayServerSVGContextDefs.initWithSVGElement(this.element);
        this.element.appendChild(this._definitions.element);
        this._trackingPath = doc.createElementNS(SVGNamespace, "rect");
        this._trackingPath.x.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_NUMBER, 0);
        this._trackingPath.x.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_NUMBER, 0);
        this._trackingPath.width.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_NUMBER, 100);
        this._trackingPath.height.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_NUMBER, 100);
        this._trackingPath.style.pointerEvents = 'all';
        this._trackingPath.style.visibility = 'hidden';
        this.element.appendChild(this._trackingPath);
        this._sublayersIndex = 2;
    },

    initForScreenContext: function(screenContext){
        UIHTMLDisplayServerSVGContext.$super.init.call(this);
        var doc = screenContext.element.ownerDocument;
        var svg = screenContext.element;
        this.element = doc.createElementNS(SVGNamespace, "g");
        this.originTransform = svg.createSVGTransform();
        this.element.transform.baseVal.appendItem(this.originTransform);
        if (UIHTMLDisplayServerSVGContext.requiresTransformReplace === undefined){
            UIHTMLDisplayServerSVGContext.requiresTransformReplace = this.element.transform.baseVal.getItem(0) !== this.originTransform;
        }

        this._uniqueIdPrefix = "context-" + this.objectID + "-";
        this._definitions = screenContext._definitions;

        this._state = Object.create(State);
        this._stack = [];
        this._usedImageMasksById = {};
        this._usedShadowFiltersById = {};
        this._usedClipPaths = [];
        this._propertiesNeedingUpdate = {
            bounds: true,
            transform: true,
            hidden: true,
            clipsToBounds: true,
            alpha: true,
            background: true,
            borderColor: true,
            borderWidth: true,
            shadow: true
        };
    },

    _definitions: null,

    _uniqueIdPrefix: null,

    destroy: function(){
        this.resetForDisplay();
        if (this._backgroundGradient){
            this._backgroundGradient.parentNode.removeChild(this._backgroundGradient);
        }
        if (this._boundsClipPath){
            this._boundsClipPath.parentNode.removeChild(this._boundsClipPath);
        }
        if (this._shadowFilter){
            this._definitions.releaseShadowFilter(this._shadowFilter);
        }
        UIHTMLDisplayServerSVGContext.$super.destroy.call(this);
    },

    // --------------------------------------------------------------------
    // MARK: - Size & Position

    setOrigin: function(origin){
        this.originTransform.setTranslate(origin.x, origin.y);
        // IE 11 and Edge (pre-Chromium) make a copy of this.originTransform
        // when it's added to the list, contrary to the SVG spec.
        // So, we'll take the extra step of doing a replaceItem.
        if (UIHTMLDisplayServerSVGContext.requiresTransformReplace){
            this.element.transform.baseVal.replaceItem(this.originTransform, 0);
        }
    },

    setSize: function(size){
        // only called for the root context, which has an svg element
        this.element.width.baseVal.value = size.width;
        this.element.height.baseVal.value = size.height;
        if (this._trackingPath){
            this._trackingPath.width.baseVal.value = size.width;
            this._trackingPath.height.baseVal.value = size.height;
        }
    },

    originTransform: null,
    layerTransorm: null,

    // ----------------------------------------------------------------------
    // MARK: - Display Lifecycle

    layerDidChangeProperty: function(layer, property){
        switch (property){
            case 'cornerRadius':
            case 'maskedBorders':
            case 'maskedCorners':
                this._needsBoundsPathsRedraw = true;
                break;
            case 'shadowColor':
            case 'shadowOffset':
            case 'shadowRadius':
                this.propertiesNeedingUpdate.shadow = true;
                break;
            case 'bounds':
                this._propertiesNeedingUpdate.bounds = true;
                this._needsBoundsPathsRedraw = true;
                break;
            case 'borderWidth':
                this._propertiesNeedingUpdate.borderWidth = true;
                this._needsBoundsPathsRedraw = true;
                break;
            case 'backgroundColor':
            case 'backgroundGradient':
                this._propertiesNeedingUpdate.background = true;
                break;
            default:
                this._propertiesNeedingUpdate[property] = true;
                break;
        }
    },

    drawLayer: function(layer){
        if (this.needsCustomDisplay){
            this.resetForDisplay();
        }
        var methodName;
        for (var property in this._propertiesNeedingUpdate){
            methodName = 'updateSVG_' + property;
            this[methodName](layer);
        }
        if (this._needsBoundsPathsRedraw){
            if (this._backgroundPath !== null || this._backgroundGradientPath !== null){
                this._updateBackgroundPath(layer);
            }
            if (this._borderPath !== null){
                this._updateBorderPath(layer);
            }
            if (this._shadowPath !== null){
                this._updateShadowPath(layer);
            }
            if (this._trackingPath !== null){
                this._updateTrackingPath(layer);
            }
            if (this._boundsClipPath !== null){
                this._updateBoundsClipPath(layer);
            }
            this._needsBoundsPathsRedraw = false;
        }
        this._colorFilterIndex = 0;
        if (this.needsCustomDisplay){
            this._state.groupElement = this.element.ownerDocument.createElementNS(SVGNamespace, "g");
            this.element.insertBefore(this._state.groupElement, this.element.childNodes[this._sublayersIndex]);
            if (this._clippedToBounds){
                this._state.groupElement.style.clipPath = 'url(#%s)'.sprintf(this._boundsClipPath.id);
            }
            ++this._sublayersIndex;
            layer._drawInContext(this);
            if (this._stack.length > 0){
                throw new Error("Unbalanced save/restore");
            }
            this.needsCustomDisplay = false;
        }
        this._propertiesNeedingUpdate = {};
        this.cleanupAfterDisplay();
    },

    resetForDisplay: function(){
        if (this._state.groupElement){
            this._state.groupElement.parentNode.removeChild(this._state.groupElement);
            --this._sublayersIndex;
        }
        var i;
        for (i = this._usedClipPaths.length - 1; i >= 0;--i){
            this._usedClipPaths[i].parentNode.removeChild(this._usedClipPaths[i]);
        }
        this._usedClipPaths = [];

        var id;
        for (id in this._usedImageMasksById){
            this._definitions.releaseImageMask(this._usedImageMasksById[id]);
        }
        this._usedImageMasksById = {};

        for (id in this._usedShadowFiltersById){
            this._definitions.releaseShadowFilter(this._usedShadowFiltersById[id]);
        }
        this._usedShadowFiltersById = {};
    },

    cleanupAfterDisplay: function(){
        this._definitions.cleanup();
    },

    // ----------------------------------------------------------------------
    // MARK: - Background, Shadow, Border

    _needsBoundsPathsRedraw: true,

    _shadowPath: null,
    _shadowFilter: null,

    _createShadowPathIfNeeded: function(layer){
        if (this._shadowPath === null){
            this._shadowPath = this.element.ownerDocument.createElementNS(SVGNamespace, "path");
            this._shadowPath.style.fill = 'black';
            this.element.insertBefore(this._shadowPath, this.element.childNodes[0]);
            this._updateShadowPath(layer);
            ++this._trackingIndex;
            ++this._backgroundIndex;
            ++this._backgroundGradientIndex;
            ++this._sublayersIndex;
        }
    },

    _updateShadowPath: function(layer){
        this._shadowPath.pathSegList.clear();
        this._currentPath = this._shadowPath;
        this.addBorderPathForLayerProperties(layer.presentation, UILayer.Path.shadow);
        this._currentPath = null;
    },

    _backgroundPath: null,
    _backgroundGradientPath: null,
    _backgroundGradient: null,

    _createBackgroundPathIfNeeded: function(layer){
        if (this._backgroundPath === null){
            this._backgroundPath = this.element.ownerDocument.createElementNS(SVGNamespace, "path");
            this.element.insertBefore(this._backgroundPath, this.element.childNodes[this._backgroundIndex]);
            this._updateBackgroundPath(layer);
            ++this._backgroundGradientIndex;
            ++this._sublayersIndex;
        }
    },

    _createBackgroundGradientPathIfNeeded: function(layer){
        if (this._backgroundGradientPath === null){
            this._backgroundGradientPath = this.element.ownerDocument.createElementNS(SVGNamespace, "path");
            this.element.insertBefore(this._backgroundGradientPath, this.element.childNodes[this._backgroundGradientIndex]);
            this._updateBackgroundPath(layer);
            ++this._sublayersIndex;
        }
    },

    _createBackgroundGradientIfNecessary: function(layer){
        if (this._backgroundGradient === null){
            this._backgroundGradient = this.element.ownerDocument.createElementNS(SVGNamespace, "linearGradient");
            this._backgroundGradient.id = this._uniqueIdPrefix + 'backgroundGradient';
            this._definitions.element.appendChild(this._backgroundGradient);
        }
    },

    _updateBackgroundPath: function(layer){
        if (this._backgroundPath !== null){
            this._backgroundPath.pathSegList.clear();
            this._currentPath = this._backgroundPath;
            this.addBorderPathForLayerProperties(layer.presentation, UILayer.Path.background);
            this._currentPath = null;
        }
        if (this._backgroundGradientPath !== null){
            this._backgroundGradientPath.pathSegList.clear();
            this._currentPath = this._backgroundGradientPath;
            this.addBorderPathForLayerProperties(layer.presentation, UILayer.Path.background);
            this._currentPath = null;
        }
    },

    _borderPath: null,

    _createBorderPathIfNeeded: function(layer){
        if (this._borderPath === null){
            this._borderPath = this.element.ownerDocument.createElementNS(SVGNamespace, "path");
            this._borderPath.style.fill = 'none';
            this.element.appendChild(this._borderPath);
            this._updateBorderPath(layer);
        }
    },

    _updateBorderPath: function(layer){
        this._borderPath.pathSegList.clear();
        this._currentPath = this._borderPath;
        this.addBorderPathForLayerProperties(layer.presentation, UILayer.Path.border);
        this._currentPath = null;
    },

    // ----------------------------------------------------------------------
    // MARK: - SVG Layer Shortcuts

    _propertiesNeedingUpdate: null,

    updateSVG_bounds: function(layer){
        var size = layer.presentation.bounds.size;
        if (this._boundsClipPathContents){
            this._updateBoundsClipPath(layer);
        }
    },

    updateSVG_origin: function(){
        // TODO: move custom drawing element
    },

    updateSVG_transform: function(layer){
        // Our element has the following transform list
        // origin [layerAnchorPoint layerTransform returnToOrigin]?
        //
        // If the layer's transform is the identity, we only need the
        // origin transform.
        //
        // If the layer's transform is not the identity, we need to
        // perform the transform at the anchor point and then return
        // back to the origin.
        var transform = layer.presentation.transform;
        var l = this.element.transform.baseVal.numberOfItems;
        if (transform.isIdentity){
            --l;
            // remove all but first item (this.originTransform)
            while (l > 0){
                this.element.transform.baseVal.removeItem(l);
                --l;
            }
        }else{
            var anchorPoint = JSPoint(layer.presentation.anchorPoint.x * layer.presentation.bounds.size.width, layer.presentation.anchorPoint.y * layer.presentation.bounds.size.height);
            var t1;
            var t2;
            var t3;
            var matrix = this.element.ownerSVGElement.createSVGMatrix();
            matrix.a = transform.a;
            matrix.b = transform.b;
            matrix.c = transform.c;
            matrix.d = transform.d;
            matrix.e = transform.tx;
            matrix.f = transform.ty;
            if (l == 1){
                t1 = this.element.ownerSVGElement.createSVGTransform();
                t2 = this.element.ownerSVGElement.createSVGTransform();
                t3 = this.element.ownerSVGElement.createSVGTransform();
                this.element.transform.baseVal.appendItem(t1);
                this.element.transform.baseVal.appendItem(t2);
                this.element.transform.baseVal.appendItem(t3);
            }else{
                t1 = this.element.transform.baseVal.getItem(1);
                t2 = this.element.transform.baseVal.getItem(2);
                t3 = this.element.transform.baseVal.getItem(3);
            }
            t1.setTranslate(anchorPoint.x, anchorPoint.y);
            t2.setMatrix(matrix);
            t3.setTranslate(-anchorPoint.x, -anchorPoint.y);
            if (UIHTMLDisplayServerSVGContext.requiresTransformReplace){
                this.element.transform.baseVal.replaceItem(t1, 1);
                this.element.transform.baseVal.replaceItem(t2, 2);
                this.element.transform.baseVal.replaceItem(t3, 3);
            }
        }
    },

    updateSVG_hidden: function(layer){
        this.element.style.visibility = layer.presentation.hidden ? 'hidden' : '';
    },

    _boundsClipPath: null,
    _boundsClipPathContents: null,

    _updateBoundsClipPath: function(layer){
        var bounds = layer.presentation.bounds;
        this._boundsClipPathContents.x.baseVal.value = bounds.origin.x;
        this._boundsClipPathContents.y.baseVal.value = bounds.origin.y;
        this._boundsClipPathContents.width.baseVal.value = bounds.size.width;
        this._boundsClipPathContents.height.baseVal.value = bounds.size.height;
    },

    _clippedToBounds: false,

    updateSVG_clipsToBounds: function(layer){
        this._clippedToBounds = layer.clipsToBounds;
        if (this._clippedToBounds){
            if (!this._boundsClipPath){
                this._boundsClipPath = this.element.ownerDocument.createElementNS(SVGNamespace, "clipPath");
                this._boundsClipPath.id = this._uniqueIdPrefix + "boundsClipPath";
                this._boundsClipPathContents = this.element.ownerDocument.createElementNS(SVGNamespace, "rect");
                this._boundsClipPath.appendChild(this._boundsClipPathContents);
                this._updateBoundsClipPath(layer);
                this._definitions.element.appendChild(this._boundsClipPath);
            }
            if (this._sublayerGroup !== null){
                this._sublayerGroup.style.clipPath = 'url(#%s)'.sprintf(this._boundsClipPath.id);
            }
            if (this._state.groupElement !== null){
                this._state.groupElement.style.clipPath = 'url(#%s)'.sprintf(this._boundsClipPath.id);
            }
        }else{
            if (this._sublayerGroup !== null){
                this._sublayerGroup.style.clipPath = '';
            }
            if (this._state.groupElement !== null){
                this._state.groupElement.style.clipPath = '';
            }
        }
    },

    updateSVG_alpha: function(layer){
        this.element.style.opacity = layer.presentation.alpha != 1.0 ? layer.presentation.alpha : '';
    },

    updateSVG_background: function(layer){
        var color = layer.presentation.backgroundColor;
        if (color !== null){
            this._createBackgroundPathIfNeeded(layer);
            this._backgroundPath.style.fill = color.cssString();
        }else if (this._backgroundPath !== null){
            this._backgroundPath.style.fill = 'none';
        }

        var gradient = layer.presentation.backgroundGradient;
        if (gradient !== null){
            this._createBackgroundGradientPathIfNeeded(layer);
            this._createBackgroundGradientIfNecessary(layer);
            this._backgroundGradient.x1.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PERCENTAGE, gradient.start.x * 100);
            this._backgroundGradient.y1.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PERCENTAGE, gradient.start.y * 100);
            this._backgroundGradient.x2.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PERCENTAGE, gradient.end.x * 100);
            this._backgroundGradient.y2.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PERCENTAGE, gradient.end.y * 100);
            var existingStopCount = this._backgroundGradient.childNodes.length;
            var stop;
            var i = 0;
            for (var position in gradient.stops){
                color = gradient.stops[position];
                if (i < existingStopCount){
                    stop = this._backgroundGradient.childNodes[i];
                }else{
                    stop = this.element.ownerDocument.createElementNS(SVGNamespace, "stop");
                    this._backgroundGradient.appendChild(stop);
                }
                stop.offset.baseVal = position;
                stop.style.stopColor = color.cssString();
                ++i;
            }
            for (var j = existingStopCount - 1; j >= i; --j){
                this._backgroundGradient.removeChild(this._backgroundGradient.childNodes[j]);
            }
            this._backgroundGradientPath.style.fill = 'url(#%s)'.sprintf(this._backgroundGradient.id);
        }else if (this._backgroundGradientPath !== null){
            this._backgroundGradientPath.fill = 'none';
        }
    },

    updateSVG_borderColor: function(layer){
        var color = layer.presentation.borderColor;
        if (color !== null){
            this._createBorderPathIfNeeded(layer);
            this._borderPath.style.stroke = color.cssString();
        }else if (this._borderPath !== null){
            this._borderPath.style.stroke = 'none';
        }
    },

    updateSVG_borderWidth: function(layer){
        var width = layer.presentation.borderWidth;
        if (width > 0){
            this._createBorderPathIfNeeded(layer);
            this._borderPath.style.strokeWidth = width;
        }else if (this._borderPath !== null){
            this._borderPath.style.strokeWidth = '0';
        }
    },

    updateSVG_shadow: function(layer){
        if (this._shadowFilter !== null){
            this._definitions.releaseShadowFilter(this._shadowFilter);
            this._shadowFilter = null;
        }
        var offset = layer.presentation.shadowOffset;
        var radius = layer.presentation.shadowRadius;
        var color = layer.presentation.shadowColor;
        if (color){
            this._shadowFilter = this._definitions.filterForShadow(offset, radius, color);
            this._createShadowPathIfNeeded(layer);
            this._shadowPath.style.filter = "url(#%s)".sprintf(this._shadowFilter.id);
            this._shadowPath.style.visibility = '';
        }else if (this._shadowPath !== null){
            this._shadowPath.style.filter = '';
            this._shadowPath.style.visibility = 'hidden';
        }
    },

    // ----------------------------------------------------------------------
    // MARK: - Tracking

    _trackingPath: null,
    trackingListener: null,

    startMouseTracking: function(trackingType, listener, layer){
        this._createTrackingPathIfNeeded(layer);
        if (this.trackingListener !== null){
            this._trackingPath.removeEventListener('mouseenter', this.trackingListener);
            this._trackingPath.removeEventListener('mouseleave', this.trackingListener);
            this._trackingPath.removeEventListener('mousemove', this.trackingListener);
        }
        this.trackingListener = listener;
        if (trackingType & UIView.MouseTracking.enterAndExit){
            this._trackingPath.addEventListener('mouseenter', this.trackingListener);
            this._trackingPath.addEventListener('mouseleave', this.trackingListener);
        }
        if (trackingType & UIView.MouseTracking.move){
            this._trackingPath.addEventListener('mousemove', this.trackingListener);
        }
    },

    stopMouseTracking: function(){
        if (this.trackingElement === null || this.trackingListener === null){
            return;
        }
        this._trackingPath.removeEventListener('mouseenter', this.trackingListener);
        this._trackingPath.removeEventListener('mouseleave', this.trackingListener);
        this._trackingPath.removeEventListener('mousemove', this.trackingListener);
        this.trackingListener = null;
    },

    _createTrackingPathIfNeeded: function(layer){
        if (this._trackingPath !== null){
            return null;
        }
        this._trackingPath = this.element.ownerDocument.createElementNS(SVGNamespace, "path");
        this._trackingPath.style.pointerEvents = 'visible';
        this._trackingPath.style.fill = 'none';
        this._trackingPath.style.stroke = 'none';
        this._updateTrackingPath(layer);
        this.element.insertBefore(this._trackingPath, this.element.childNodes[this._trackingIndex]);
        ++this._backgroundIndex;
        ++this._backgroundGradientIndex;
        ++this._sublayersIndex;
    },

    _updateTrackingPath: function(layer){
        this._trackingPath.pathSegList.clear();
        this._currentPath = this._trackingPath;
        this.addBorderPathForLayerProperties(layer.presentation, UILayer.Path.shadow);
        this._currentPath = null;
    },

    setCursor: function(cursor, layer){
        if (cursor === null){
            if (this._trackingPath){
                this._trackingPath.style.cursor = '';
            }
            return;
        }
        this._createTrackingPathIfNeeded(layer);
        var cssCursorStrings = cursor.cssStrings();
        // UICursor.cssStrings() returns a set of css strings, one of which
        // should work in our browser, but some of which may fail because they
        // use commands specific to other browsers.  The failure looks like
        // style.cursor is an empty string, so we'll keep going until it's
        // not an empty string, or we're out of options
        for (var i = 0, l = cssCursorStrings.length; i < l; ++i){
            this._trackingPath.style.cursor = cssCursorStrings[i];
            if (this._trackingPath.style.cursor !== ''){
                break;
            }
        }
    },

    // ----------------------------------------------------------------------
    // MARK: - Sublayers

    insertSublayerContext: function(sublayer, context){
        this._createSublayerGroupIfNeeded();
        var insertIndex = sublayer.sublayerIndex;
        // If we're moving within the same node, we need to be careful about the index
        // calculations.  For example, if context.element is currently at index 4, and it's
        // moving to index 7, that 7 was calculated assuming that index 4 was removed.  So it
        // really should be 8 in the DOM since our element is still in there.  But we can't just
        // add 1 because the same doesn't hold if we're moving down in index, like from 7 to 4.
        // So the easiest thing to do is remove our element from the parent first.  Alternatively,
        // we could find the current index with Array.indexOf(), and conditionally add 1 if moving up.
        // I doubt there's a big performance difference.
        if (context.element.parentNode === this._sublayerGroup){
            this._sublayerGroup.removeChild(context.element);
        }
        if (insertIndex < this._sublayerGroup.childNodes.length){
            if (context.element !== this._sublayerGroup.childNodes[insertIndex]){
                this._sublayerGroup.insertBefore(context.element, this._sublayerGroup.childNodes[insertIndex]);
            }
        }else{
            this._sublayerGroup.appendChild(context.element);
        }
    },

    _sublayerGroup: null,

    _createSublayerGroupIfNeeded: function(){
        if (this._sublayerGroup !== null){
            return;
        }
        this._sublayerGroup = this.element.ownerDocument.createElementNS(SVGNamespace, "g");
        this.element.insertBefore(this._sublayerGroup, this.element.childNodes[this._sublayersIndex]);
        if (this._clippedToBounds){
            this._sublayerGroup.style.clipPath = 'url(#%s)'.sprintf(this._boundsClipPath.id);
        }
    },

    // ----------------------------------------------------------------------
    // MARK: - Constructing Paths

    _currentPath: null,

    beginPath: function(){
        UIHTMLDisplayServerSVGContext.$super.beginPath.call(this);
        this._currentPath = this.element.ownerDocument.createElementNS(SVGNamespace, "path");
    },

    _discardPath: function(){
        UIHTMLDisplayServerSVGContext.$super._discardPath.call(this);
        this._currentPath = null;
    },

    moveToPoint: function(x, y){
        if (!this._currentPath){
            this.beginPath();
        }
        UIHTMLDisplayServerSVGContext.$super.moveToPoint.call(this, x, y);
        var seg = this._currentPath.createSVGPathSegMovetoAbs(x, y);
        this._currentPath.pathSegList.appendItem(seg);
    },

    addLineToPoint: function(x, y){
        if (!this._currentPath){
            this.beginPath();
        }
        UIHTMLDisplayServerSVGContext.$super.addLineToPoint.call(this, x, y);
        var seg = this._currentPath.createSVGPathSegLinetoAbs(x, y);
        this._currentPath.pathSegList.appendItem(seg);
    },

    addCurveToPoint: function(point, control1, control2){
        if (!this._currentPath){
            this.beginPath();
        }
        UIHTMLDisplayServerSVGContext.$super.addCurveToPoint.call(this, point, control1, control2);
        var seg = this._currentPath.createSVGPathSegCurvetoCubicAbs(point.x, point.y, control1.x, control1.y, control2.x, control2.y);
        this._currentPath.pathSegList.appendItem(seg);
    },

    addQuadraticCurveToPoint: function(point, control){
        if (!this._currentPath){
            this.beginPath();
        }
        UIHTMLDisplayServerSVGContext.$super.addQuadraticCurveToPoint.call(this, point, control);
        var seg = this._currentPath.createSVGPathSegCurvetoQuadraticAbs(point.x, point.y, control.x, control.y);
        this._currentPath.pathSegList.appendItem(seg);
    },

    closePath: function(){
        if (!this._currentPath){
            this.beginPath();
        }
        UIHTMLDisplayServerSVGContext.$super.closePath.call(this);
        var seg = this._currentPath.createSVGPathSegClosePath();
        this._currentPath.pathSegList.appendItem(seg);
    },

    // ----------------------------------------------------------------------
    // MARK: - Drawing the Current Path

    drawPath: function(drawingMode){
        if (!this._currentPath){
            this.beginPath();
        }
        this._styleElementForDrawingMode(this._currentPath, drawingMode);
        this._state.groupElement.appendChild(this._currentPath);
        this._discardPath();
    },

    fillPath: function(fillRule){
        if (!this._currentPath){
            this.beginPath();
        }
        var drawingMode;
        if (fillRule == JSContext.FillRule.evenOdd){
            drawingMode = JSContext.DrawingMode.evenOddFill;
        }else{
            drawingMode = JSContext.DrawingMode.fill;
        }
        this._styleElementForDrawingMode(this._currentPath, drawingMode);
        this._state.groupElement.appendChild(this._currentPath);
        this._discardPath();
    },

    strokePath: function(){
        if (!this._currentPath){
            this.beginPath();
        }
        this._styleElementForDrawingMode(this._currentPath, JSContext.DrawingMode.stroke);
        this._state.groupElement.appendChild(this._currentPath);
        this._discardPath();
    },

    _styleElementForDrawingMode: function(element, drawingMode){
        var fill = false;
        var stroke = false;
        var fillRule = JSContext.FillRule.winding;
        switch (drawingMode){
            case JSContext.DrawingMode.fill:
                fill = true;
                break;
            case JSContext.DrawingMode.evenOddFill:
                fill = true;
                fillRule = JSContext.FillRule.evenOdd;
                break;
            case JSContext.DrawingMode.stroke:
                stroke = true;
                break;
            case JSContext.DrawingMode.fillStroke:
                fill = true;
                stroke = true;
                break;
            case JSContext.DrawingMode.evenOddFillStroke:
                fill = true;
                stroke = true;
                fillRule = JSContext.FillRule.evenOdd;
                break;
        }

        if (fill){
            element.style.fill = this._state.fillColor ? this._state.fillColor.cssString() : '';
            if (fillRule == JSContext.FillRule.evenOdd){
                element.style.fillRule = 'evenodd';
            }
        }else{
            element.style.fill = 'none';
        }

        if (stroke){
            element.style.stroke = this._state.strokeColor ? this._state.strokeColor.cssString() : '';
            element.style.strokeWidth = this._state.lineWidth;
            if (this._state.lineCap !== JSContext.LineCap.butt){
                element.style.strokeLinecap = this._state.lineCap;
            }
            if (this._state.lineJoin !== JSContext.LineJoin.miter){
                element.style.strokeLinejoin = this._state.lineJoin;
            }
            if (this._state.miterLimit !== 4){
                element.style.strokeMiterlimit = this._state.miterLimit;
            }
            if (this._state.lineDash.lengths.length > 0){
                element.style.strokeDasharray = this._state.lineDash.join(',');
                if (this._state.lineDash.phase !== 0){
                    element.style.strokeDashoffset = this._state.lineDash.phase;
                }
            }
        }else{
            element.style.stroke = 'none';
        }

        if (this._state.shadowColor !== null){
            var shadowFilter = this._definitions.filterForShadow(this._state.shadowOffset, this._state.shadowBlur, this._state.shadowColor);
            element.style.filter = "url(#%s)".sprintf(shadowFilter.id);
            this._usedShadowFiltersById[shadowFilter.id] = shadowFilter;
        }
    },

    // ----------------------------------------------------------------------
    // MARK: - Drawing Shapes

    clearRect: function(rect){
        // clip?
    },

    fillRect: function(rect){
        var svgRect = this.element.ownerDocument.createElementNS(SVGNamespace, "rect");
        svgRect.x.baseVal.value = rect.origin.x;
        svgRect.y.baseVal.value = rect.origin.y;
        svgRect.width.baseVal.value = rect.size.width;
        svgRect.height.baseVal.value = rect.size.height;
        this._styleElementForDrawingMode(svgRect, JSContext.DrawingMode.fill);
        this._state.groupElement.appendChild(svgRect);
        this._discardPath();
    },

    fillMaskedRect: function(rect, maskImage){
        var svgRect = this.element.ownerDocument.createElementNS(SVGNamespace, "rect");
        svgRect.x.baseVal.value = rect.origin.x;
        svgRect.y.baseVal.value = rect.origin.y;
        svgRect.width.baseVal.value = rect.size.width;
        svgRect.height.baseVal.value = rect.size.height;
        this._styleElementForDrawingMode(svgRect, JSContext.DrawingMode.fill);
        var mask = this._definitions.maskForImage(maskImage);
        svgRect.style.mask = 'url(#%s)'.sprintf(mask.id);
        this._state.groupElement.appendChild(svgRect);
        this._usedImageMasksById[mask.id] = mask;
    },

    strokeRect: function(rect){
        var svgRect = this.element.ownerDocument.createElementNS(SVGNamespace, "rect");
        svgRect.x.baseVal.value = rect.origin.x;
        svgRect.y.baseVal.value = rect.origin.y;
        svgRect.width.baseVal.value = rect.size.width;
        svgRect.height.baseVal.value = rect.size.height;
        this._styleElementForDrawingMode(svgRect, JSContext.DrawingMode.stroke);
        this._state.groupElement.appendChild(svgRect);
        this._discardPath();
    },

    // ----------------------------------------------------------------------
    // MARK: - Images

    drawImage: function(image, rect){
        var caps = image.capInsets;
        var url = image.htmlURLString();
        if (caps !== null){
            var htmlDiv = this.element.ownerDocument.createElement('div');
            htmlDiv.style.boxSizing = 'border-box';
            htmlDiv.style.mozBoxSizing = 'border-box';
            htmlDiv.style.width = rect.size.width + 'px';
            htmlDiv.style.height = rect.size.height + 'px';
            htmlDiv.style.borderColor = 'transparent';
            htmlDiv.style.pointerEvents = 'none';
            var cssURL = "url('" + url + "')";
            htmlDiv.style.borderWidth = '%dpx %dpx %dpx %dpx'.sprintf(caps.top, caps.right, caps.bottom, caps.left);
            htmlDiv.style.borderImage = cssURL + " %d %d %d %d fill stretch".sprintf(caps.top * image.scale, caps.right * image.scale, caps.bottom * image.scale, caps.left * image.scale);
            this.addExternalElementInRect(htmlDiv, rect);
        }else{
            var svgImage = this.element.ownerDocument.createElementNS(SVGNamespace, "image");
            svgImage.x.baseVal.value = rect.origin.x;
            svgImage.y.baseVal.value = rect.origin.y;
            svgImage.width.baseVal.value = rect.size.width;
            svgImage.height.baseVal.value = rect.size.height;
            svgImage.setAttribute("preserveAspectRatio", "none");
            svgImage.setAttributeNS("http://www.w3.org/1999/xlink", "href", url);
            this._state.groupElement.appendChild(svgImage);
        }
    },

    _usedImageMasksById: null,

    // ----------------------------------------------------------------------
    // MARK: - Gradients

    drawLinearGradient: function(gradient, start, end){
        // TODO
    },

    drawRadialGradient: function(gradient, startCenter, startRadius, endCenter, endRadius){
        // TODO
    },

    // ----------------------------------------------------------------------
    // MARK: - Text

    setFont: function(font){
        this._state.font = font;
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
        var text = this._state.font.stringForGlyphs(glyphs);
        this.showText(text);
    },

    showText: function(text){
        var textElement = this.element.ownerDocument.createElementNS(SVGNamespace, "text");
        var tspanElement = this.element.ownerDocument.createElementNS(SVGNamespace, "tspan");
        var matrix = this.element.ownerSVGElement.createSVGMatrix();
        matrix.a = this._state.textMatrix.a;
        matrix.b = this._state.textMatrix.b;
        matrix.c = this._state.textMatrix.c;
        matrix.d = this._state.textMatrix.d;
        matrix.e = this._state.textMatrix.tx;
        matrix.f = this._state.textMatrix.ty;
        var transform = this.element.ownerSVGElement.createSVGTransform();
        transform.setMatrix(matrix);
        textElement.transform.baseVal.appendItem(transform);
        textElement.style.font = this._state.font.cssString();
        textElement.style.kerning = "0";
        switch (this._state.textDrawingMode){
            case JSContext.TextDrawingMode.fill:
                textElement.style.fill = this._state.fillColor.cssString();
                break;
            case JSContext.TextDrawingMode.stroke:
                textElement.style.fill = 'none';
                textElement.style.strokeWidth = this._state.lineWidth / Math.abs(this._state.textMatrix.d);
                textElement.style.stroke = this._state.strokeColor.cssString();
                break;
            case JSContext.TextDrawingMode.fillStroke:
                textElement.style.fill = this._state.fillColor.cssString();
                textElement.style.strokeWidth = this._state.lineWidth / Math.abs(this._state.textMatrix.d);
                textElement.style.stroke = this._state.strokeColor.cssString();
                break;
        }
        if (this._state.characterSpacing !== 0){
            textElement.style.letterSpacing = "%0.2f".sprintf(this._state.characterSpacing);
        }
        tspanElement.appendChild(this.element.ownerDocument.createTextNode(text));
        textElement.appendChild(tspanElement);
        this._state.groupElement.appendChild(textElement);
    },

    addExternalElementInRect: function(element, rect){
        if (element.namespaceURI == SVGNamespace){
            var group = this.element.ownerDocument.createElementNS(SVGNamespace, "g");
            var origin = this.element.ownerSVGElement.createSVGTransform();
            origin.setTranslate(rect.origin.x, rect.origin.y);
            group.transform.baseVal.initialize(origin);
            group.appendChild(element);
            this._state.groupElement.appendChild(group);
        }else{
            // NOTE: Safari has issues if element or its decendants
            // - use opacity
            // - use relative positioning
            // - use absolute positioning
            var foreignObject = this.element.ownerDocument.createElementNS(SVGNamespace, "foreignObject");
            foreignObject.x.baseVal.value = rect.origin.x;
            foreignObject.y.baseVal.value = rect.origin.y;
            foreignObject.width.baseVal.value = rect.size.width;
            foreignObject.height.baseVal.value = rect.size.height;
            foreignObject.appendChild(element);
            this._state.groupElement.appendChild(foreignObject);
        }
    },

    // ----------------------------------------------------------------------
    // MARK: - Fill, Stroke, Shadow Colors

    getAlpha: function(){
        return this._state.alpha;
    },

    setAlpha: function(alpha){
        this._state.alpha = alpha;
    },

    setFillColor: function(fillColor){
        this._state.fillColor = fillColor;
    },

    setStrokeColor: function(strokeColor){
        this._state.strokeColor = strokeColor;
    },

    setShadow: function(offset, blur, color){
        this._state.shadowOffset = offset;
        this._state.shadowBlur = blur;
        this._state.shadowColor = color;
    },

    _usedShadowFiltersById: null,

    // ----------------------------------------------------------------------
    // MARK: - Clipping

    _clipPathID: 0,

    clip: function(fillRule){
        // FIXME: needs to consider fill rule
        var clipPath = this.element.ownerDocument.createElementNS(SVGNamespace, "clipPath");
        ++this._clipPathID;
        clipPath.id = this._uniqueIdPrefix + "clip-" + this._clipPathID;
        clipPath.appendChild(this._currentPath);
        this._definitions.element.appendChild(clipPath);
        var group = this.element.ownerDocument.createElementNS(SVGNamespace, "g");
        group.style.clipPath = "url(#%s)".sprintf(clipPath.id);
        group.style.clipRule = fillRule == JSContext.FillRule.evenOdd ? "evenodd" : "nonzero";
        this._state.groupElement.appendChild(group);
        this._state.groupElement = group;
        this._usedClipPaths.push(clipPath);
        this._discardPath();
    },

    _usedClipPaths: null,

    // ----------------------------------------------------------------------
    // MARK: - Transformations

    scaleBy: function(sx, sy){
        var svgTransform = this.element.ownerSVGElement.createSVGTransform();
        svgTransform.setScale(sx, sy);
        this._addTransform(svgTransform);
    },

    rotateBy: function(angle){
        var svgTransform = this.element.ownerSVGElement.createSVGTransform();
        svgTransform.setRotate(angle);
        this._addTransform(svgTransform);
    },

    translateBy: function(tx, ty){
        var svgTransform = this.element.ownerSVGElement.createSVGTransform();
        svgTransform.setTranslate(tx, ty);
        this._addTransform(svgTransform);
    },

    concatenate: function(transform){
        var svgMatrix = this.element.ownerSVGElement.createSVGMatrix();
        svgMatrix.a = transform.a;
        svgMatrix.b = transform.b;
        svgMatrix.c = transform.c;
        svgMatrix.d = transform.d;
        svgMatrix.e = transform.tx;
        svgMatrix.f = transform.ty;
        var svgTransform = this.element.ownerSVGElement.createSVGTransformFromMatrix(svgMatrix);
        this._addTransform(svgTransform);
    },

    _addTransform: function(svgTransform){
        var group = this.element.ownerDocument.createElementNS(SVGNamespace, "g");
        group.transform.baseVal.initialize(svgTransform);
        this._state.groupElement.appendChild(group);
        this._state.groupElement = group;
    },

    // ----------------------------------------------------------------------
    // MARK: - Drawing Options

    setLineWidth: function(lineWidth){
        this._state.lineWidth = lineWidth;
    },

    setLineCap: function(lineCap){
        this._state.lineCap = lineCap;
    },

    setLineJoin: function(lineJoin){
        this._state.lineJoin = lineJoin;
    },

    setMiterLimit: function(miterLimit){
        this._state.miterLimit = miterLimit;
    },

    setLineDash: function(phase, lengths){
        this._state.lineDash = {phase: phase, lengths: lengths};
    },

    // ----------------------------------------------------------------------
    // MARK: - Graphics State

    _state: null,
    _stack: null,

    save: function(){
        var newState = Object.create(this._state);
        this._stack.push(this._state);
        this._state = newState;
    },

    restore: function(){
        if (this._stack.length > 0){
            this._state = this._stack.pop();
        }
    }

});

JSClass("_UIHTMLDisplayServerSVGContextDefs", JSObject, {

    element: null,

    initWithSVGElement: function(svg){
        this.element = svg.ownerDocument.createElementNS(SVGNamespace, "defs");
        this._uniqueIdPrefix = 'defs-' + this.objectID + '-';
        this._createImageMaskFilter();
        this._imageMasksById = {};
        this._unusedImageMaskIds = new Set();
        this._shadowFiltersById = {};
        this._unusedShadowFilters = new Set();
    },

    // MARK: - Image Masking

    _imageMaskFilter: null,
    _imageMasksById: null,
    _unusedImageMaskIds: null,

    _createImageMaskFilter: function(){
        var filter = this.element.ownerDocument.createElementNS(SVGNamespace, "filter");
        filter.id = this._uniqueIdPrefix + "imageMaskFilter";
        var colorMatrix = this.element.ownerDocument.createElementNS(SVGNamespace, "feColorMatrix");
        colorMatrix.setAttribute("in", "SourceAlpha");
        colorMatrix.setAttribute("type", "matrix");
        colorMatrix.setAttribute("values", "0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0");
        filter.appendChild(colorMatrix);
        this.element.appendChild(filter);
        this._imageMaskFilter = filter;
    },

    maskForImage: function(image){
        var maskId = this._uniqueIdPrefix + "imageMask-" + image.objectID;
        var maskInfo = this._imageMasksById[maskId];
        if (!maskInfo){
            var svgImage = this.element.ownerDocument.createElementNS(SVGNamespace, "image");
            svgImage.setAttribute("preserveAspectRatio", "none");
            svgImage.x.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_NUMBER, 0);
            svgImage.y.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_NUMBER, 0);
            svgImage.width.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_NUMBER, 1);
            svgImage.height.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_NUMBER, 1);
            var url = image.htmlURLString();
            svgImage.setAttributeNS("http://www.w3.org/1999/xlink", "href", url);
            svgImage.style.filter = 'url(#%s)'.sprintf(this._imageMaskFilter.id);
            var mask = this.element.ownerDocument.createElementNS(SVGNamespace, "mask");
            mask.setAttribute("maskUnits", "objectBoundingBox");
            mask.x.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_NUMBER, 0);
            mask.y.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_NUMBER, 0);
            mask.width.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_NUMBER, 1);
            mask.height.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_NUMBER, 1);
            mask.setAttribute("maskContentUnits", "objectBoundingBox");
            mask.id = maskId;
            mask.appendChild(svgImage);
            this.element.appendChild(mask);
            maskInfo = {
                useCount: 0,
                mask: mask
            };
            this._imageMasksById[maskId] = maskInfo;
        }
        ++maskInfo.useCount;
        this._unusedImageMaskIds.delete(maskId);
        return maskInfo.mask;
    },

    releaseImageMask: function(mask){
        var maskInfo = this._imageMasksById[mask.id];
        if (maskInfo){
            --maskInfo.useCount;
            if (maskInfo.useCount === 0){
                this._unusedImageMaskIds.add(mask.id);
            }
        }
    },

    // MARK: - Shadows

    _shadowFiltersById: null,
    _unusedShadowFilters: null,

    filterForShadow: function(offset, radius, color){
        var shadowId = this._uniqueIdPrefix + "shadow-%d-%d-%d-%s".sprintf(Math.round(offset.x * 2), Math.round(offset.y * 2), Math.round(radius * 2), color.cssString().replace(/\s/g, '').replace(/[^a-z0-9\.]/g, '_'));
        var shadowInfo = this._shadowFiltersById[shadowId];
        if (!shadowInfo){
            var filter = this.element.ownerDocument.createElementNS(SVGNamespace, "filter");
            filter.id = shadowId;
            filter.setAttribute("filterUnits", "objectBoundingBox");
            filter.x.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_NUMBER, -1);
            filter.y.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_NUMBER, -1);
            filter.width.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_NUMBER, 3);
            filter.height.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_NUMBER, 3);

            var offsetElement = this.element.ownerDocument.createElementNS(SVGNamespace, "feOffset");
            offsetElement.setAttribute("in", "SourceAlpha");
            offsetElement.dx.baseVal = offset.x;
            offsetElement.dy.baseVal = offset.y;

            var blurElement = this.element.ownerDocument.createElementNS(SVGNamespace, "feGaussianBlur");
            blurElement.setStdDeviation(radius / 2, radius / 2);

            var colorElement = this.element.ownerDocument.createElementNS(SVGNamespace, "feColorMatrix");
            colorElement.setAttribute("values", "0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0 0");
            colorElement.setAttribute("type", "matrix");
            var rgba = color.rgbaColor();
            var r = this.element.ownerSVGElement.createSVGNumber();
            var g = this.element.ownerSVGElement.createSVGNumber();
            var b = this.element.ownerSVGElement.createSVGNumber();
            var a = this.element.ownerSVGElement.createSVGNumber();
            r.value = rgba.red;
            g.value = rgba.green;
            b.value = rgba.blue;
            a.value = rgba.alpha;
            colorElement.values.baseVal.replaceItem(r, 4);
            colorElement.values.baseVal.replaceItem(g, 9);
            colorElement.values.baseVal.replaceItem(b, 14);
            colorElement.values.baseVal.replaceItem(a, 18);

            filter.appendChild(offsetElement);
            filter.appendChild(blurElement);
            filter.appendChild(colorElement);
            this.element.appendChild(filter);

            shadowInfo = {
                useCount: 0,
                filter: filter
            };
            this._shadowFiltersById[shadowId] = shadowInfo;
        }
        this._unusedShadowFilters.delete(shadowId);
        ++shadowInfo.useCount;
        return shadowInfo.filter;
    },

    releaseShadowFilter: function(filter){
        var shadowInfo = this._shadowFiltersById[filter.id];
        if (shadowInfo){
            --shadowInfo.useCount;
            if (shadowInfo.useCount === 0){
                this._unusedShadowFilters.add(filter.id);
            }
        }
    },

    // MARK: - Cleanup of unused items

    cleanup: function(){
        // Image masks
        var map = this._imageMasksById;
        this._unusedImageMaskIds.forEach(function(maskId){
            var maskInfo = map[maskId];
            maskInfo.mask.parentNode.removeChild(maskInfo.mask);
            delete map[maskId];
        });
        this._unusedImageMaskIds.clear();

        // shadow filters
        map = this._shadowFiltersById;
        this._unusedShadowFilters.forEach(function(shadowId){
            var shadowInfo = map[shadowId];
            shadowInfo.filter.parentNode.removeChild(shadowInfo.filter);
            delete map[shadowId];
        });
        this._unusedShadowFilters.clear();
    }

});

var SVGNamespace = "http://www.w3.org/2000/svg";

var State = {
    alpha: 1,
    transform: JSAffineTransform.Identity,
    fillColor: JSColor.blackColor,
    strokeColor: JSColor.blackColor,
    lineWidth: 1,
    lineCap: JSContext.LineCap.butt,
    lineJoin: JSContext.LineJoin.miter,
    miterLimit: 10,
    lineDash: {phase: 0, lengths: []},
    shadowOffset: JSPoint.Zero,
    shadowBlur: 0,
    shadowColor: null,
    font: null,
    textMatrix: JSAffineTransform.Identity,
    textDrawingMode: JSContext.TextDrawingMode.fill,
    characterSpacing: 0,
    groupElement: null
};

})();