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
// #import "UIAnimationTransaction.js"
// #import "UIBasicAnimation.js"
// #import "UIDisplayServer.js"
// #feature Math.min
// #feature Math.max
'use strict';

JSGlobalObject.UILayerAnimatedProperty = function(){
    if (this === undefined){
        return new UILayerAnimatedProperty();
    }
};

UILayerAnimatedProperty.prototype = Object.create(JSCustomProperty.prototype);

UILayerAnimatedProperty.prototype.define = function(C, key, extensions){
    var setterName = C.nameOfSetMethodForKey(key);
    var setter = extensions[setterName];
    var getter = function UILayer_getAnimatableProperty(){
        return this.model[key];
    };
    if (!setter){
        setter = function UILayer_setAnimatableProperty(value){
            if (value === this.model[key]){
                return;
            }
            this._addImplicitAnimationForKey(key);
            this.model[key] = value;
            this.didChangeProperty(key);
        };
        Object.defineProperty(C.prototype, setterName, {
            configurable: true,
            enumerable: false,
            value: setter
        });
    }
    Object.defineProperty(C.prototype, key, {
        configurable: false,
        enumerable: false,
        set: setter,
        get: getter
    });
};

JSClass("UILayer", JSObject, {
    frame:              UILayerAnimatedProperty(), 
    bounds:             UILayerAnimatedProperty(),
    position:           UILayerAnimatedProperty(),
    anchorPoint:        UILayerAnimatedProperty(),
    transform:          UILayerAnimatedProperty(),
    hidden:             UILayerAnimatedProperty(),
    alpha:              UILayerAnimatedProperty(),
    backgroundColor:    UILayerAnimatedProperty(),
    backgroundGradient: UILayerAnimatedProperty(),
    borderWidth:        UILayerAnimatedProperty(),
    borderColor:        UILayerAnimatedProperty(),
    maskedBorders:      UILayerAnimatedProperty(),
    cornerRadius:       UILayerAnimatedProperty(),
    maskedCorners:      UILayerAnimatedProperty(),
    shadowColor:        UILayerAnimatedProperty(),
    shadowOffset:       UILayerAnimatedProperty(),
    shadowRadius:       UILayerAnimatedProperty(),
    clipsToBounds:      JSDynamicProperty('_clipsToBounds', false),
    model:              null,
    presentation:       null,
    superlayer:         null,
    sublayers:          null,
    sublayerIndex:      null,
    animationsByKey:    null,
    animationCount:     0,
    _displayServer:     null,
    delegate:           null,
    needsDisplayOnBoundsChange: false,

    init: function(){
        this.sublayers = [];
        this.animationsByKey = {};
        this.model = Object.create(this.$class.Properties);
        this.presentation = this.model;
    },

    // -------------------------------------------------------------------------
    // MARK: - Size and Layout

    setPosition: function(position){
        // When the position changes, the frame origin will also change by the same delta.
        // Since position and frame are in the same coordinate system, and are affected by the
        // same transformations, we can simply move the frame's origin rather than recalculate it entirely.
        this._addImplicitAnimationForKey('position');
        var dx = position.x - this.model.position.x;
        var dy = position.y - this.model.position.y;
        var origin = JSPoint(this.model.frame.origin.x + dx, this.model.frame.origin.y + dy);
        this.model.position = JSPoint(position);
        this.model.frame = JSRect(origin, this.model.frame.size);
        this.didChangeProperty('position');
    },

    setAnchorPoint: function(anchorPoint){
        if (!anchorPoint.isEqual(this.model.anchorPoint)){
            // When the anchor point changes, the position remains constant and we have to recalculate the frame
            this._addImplicitAnimationForKey('anchorPoint');
            this.model.anchorPoint = JSPoint(anchorPoint);
            this._recalculateFrame();
            this.didChangeProperty('anchorPoint');
        }
    },

    setFrame: function(frame){
        var oldFrame = this.model.frame;
        this.model.frame = JSRect(frame);
        if (!frame.size.isEqual(oldFrame.size)){
            // When the frame size changes, the bounds and position needs to be recalculated
            var oldBounds = this.model.bounds;
            this._addImplicitAnimationForKey('bounds');
            this._addImplicitAnimationForKey('position');
            this._recalculateBounds(oldFrame.size);
            this._recalculatePosition();
            this.setNeedsLayout();
            this.didChangeProperty('bounds.size');
            this.didChangeSize();
        }else{
            // When just the origin changes, we only need to update the position, and can
            // do a simple delta offset instead of a full recalculation
            this._addImplicitAnimationForKey('position');
            var dx = frame.origin.x - oldFrame.origin.x;
            var dy = frame.origin.y - oldFrame.origin.y;
            this.model.position = JSPoint(this.model.position.x + dx, this.model.position.y + dy);
        }
        this.didChangeProperty('position');
    },

    setBounds: function(bounds){
        // When the bounds origin changes, it's like a scrolling view, and we need to update the sublayers
        // When the bounds change size, the position and frame both need to be recalculated accordingly
        var oldBounds = this.model.bounds;
        var changedSize = !bounds.size.isEqual(oldBounds.size);
        if (changedSize){
            this._addImplicitAnimationForKey('bounds');
            this._addImplicitAnimationForKey('position');
            this.model.bounds = JSRect(bounds);
            this._recalculatePosition();
            // Frame calculation depends on the recaculated position, so it must be done second
            this._recalculateFrame();
            this.setNeedsLayout();
            this.didChangeProperty('position');
            this.didChangeProperty('bounds.size');
            this.didChangeSize();
        }
        if (!bounds.origin.isEqual(oldBounds.origin)){
            if (!changedSize){
                this._addImplicitAnimationForKey('bounds');
                this.model.bounds = JSRect(bounds);
            }
            this.didChangeProperty('bounds.origin');
        }
    },

    getClipsToBounds: function(){
        return this._clipsToBounds;
    },

    setClipsToBounds: function(clipsToBounds){
        this._clipsToBounds = clipsToBounds;
        this.didChangeProperty('clipsToBounds');
    },

    setTransform: function(transform){
        // When the transform changes, the frame needs to be recalculated.  The position, however, does
        // not change.  The transform essentially defines a new relationship between the position and frame
        this._addImplicitAnimationForKey('transform');
        this.model.transform = JSAffineTransform(transform);
        this._recalculateFrame();
        this.didChangeProperty('transform');
    },

    _recalculateFrame: function(){
        this.model.frame = this._convertRectToSuperlayer(this.model.bounds);
    },

    _recalculatePosition: function(){
        var bounds = this.model.bounds;
        var anchorPoint = this.model.anchorPoint;
        var pointInBounds = JSPoint(bounds.origin.x + bounds.size.width * anchorPoint.x, bounds.origin.y + bounds.size.height * anchorPoint.y);
        this.model.position = this._convertPointToSuperlayer(pointInBounds);
    },

    _recalculateBounds: function(oldFrameSize){
        if (this.model.transform.isIdentity){
            this.model.bounds = new JSRect(this.model.bounds.origin, this.model.frame.size);
        }else{
            var sx = this.model.frame.size.width / oldFrameSize.width;
            var sy = this.model.frame.size.height / oldFrameSize.height;
            // FIXME: hmmmm....
        }
    },

    didChangeProperty: function(keyPath){
        if (this._displayServer !== null){
            this._displayServer.layerDidChangeProperty(this, keyPath);
        }
    },

    didChangeSize: function(){
        if (this.needsDisplayOnBoundsChange){
            this.setNeedsDisplay();
        }
        if (this.delegate && this.delegate.layerDidChangeSize){
            this.delegate.layerDidChangeSize(this);
        }
    },

    setHidden: function(hidden){
        if (hidden === this.model.hidden){
            return;
        }
        this._addImplicitAnimationForKey("hidden");
        this.model.hidden = hidden;
        this.didChangeProperty("hidden");
        if (this.delegate && this.delegate.layerDidChangeVisibility){
            this.delegate.layerDidChangeVisibility(this);
        }
    },

    borderPath: function(transform){
        var path = JSPath.init();
        var rect = this.bounds;
        var cornerRadius = this.cornerRadius;
        var maskedBorders = this.maskedBorders;
        var inset = this.borderWidth / 2;
        if (inset > 0){
            cornerRadius -= inset;
            var insets = JSInsets(inset);
            if ((maskedBorders & JSPath.Sides.minX) === 0){
                insets.left = 0;
            }
            if ((maskedBorders & JSPath.Sides.minY) === 0){
                insets.top = 0;
            }
            if ((maskedBorders & JSPath.Sides.maxX) === 0){
                insets.right = 0;
            }
            if ((maskedBorders & JSPath.Sides.maxY) === 0){
                insets.bottom = 0;
            }
            rect = rect.rectWithInsets(insets);
        }
        path.addRectWithSidesAndCorners(rect, maskedBorders, this.maskedCorners, this.cornerRadius, transform);
        return path;
    },

    backgroundPath: function(transform){
        var path = JSPath.init();
        path.addRectWithSidesAndCorners(this.bounds, UILayer.Sides.all, this.maskedCorners, this.cornerRadius, transform);
        return path;
    },

    // -------------------------------------------------------------------------
    // MARK: - Shadows

    setShadowOffset: function(shadowOffset){
        if (shadowOffset === this.model.shadowOffset){
            return;
        }
        this._addImplicitAnimationForKey('shadowOffset');
        this.model.shadowOffset = JSPoint(shadowOffset);
        this.didChangeProperty('shadowOffset');
    },

    // -------------------------------------------------------------------------
    // MARK: - Adding and Removing Sublayers

    addSublayer: function(sublayer){
        return this.insertSublayerAtIndex(sublayer, this.sublayers.length);
    },

    insertSublayerAtIndex: function(sublayer, index){
        var i, l;
        if (sublayer.superlayer === this){
            if (sublayer.sublayerIndex === index || sublayer.sublayerIndex === index - 1){
                return sublayer;
            }
            for (i = sublayer.sublayerIndex + 1, l = this.sublayers.length; i < l; ++i){
                this.sublayers[i].sublayerIndex -= 1;
            }
            this.sublayers.splice(sublayer.sublayerIndex,1);
            if (index > sublayer.sublayerIndex){
                --index;
            }
        }
        this.sublayers.splice(index, 0, sublayer);
        sublayer.sublayerIndex = index;
        for (i = sublayer.sublayerIndex + 1, l = this.sublayers.length; i < l; ++i){
            this.sublayers[i].sublayerIndex += 1;
        }
        sublayer.superlayer = this;
        // TODO: set needs layout if sublayer has constraints?
        if (this._displayServer !== null){
            this._displayServer.layerInserted(sublayer);
        }
        return sublayer;
    },

    insertSublayerBelowSibling: function(sublayer, sibling){
        if (sibling.superlayer !== this){
            throw Error('Cannot insert sublayer [%s] in view [%s] because sibling view [%s] is not a valid sublayer.');
        }
        return this.insertSublayerAtIndex(sublayer, sibling.sublayerIndex);
    },

    insertSublayerAboveSibling: function(sublayer, sibling){
        if (sibling.superlayer !== this){
            throw Error('Cannot insert sublayer [%s] in view [%s] because sibling view [%s] is not a valid sublayer.');
        }
        return this.insertSublayerAtIndex(sublayer, sibling.sublayerIndex + 1);
    },

    removeSublayer: function(sublayer){
        if (sublayer.superlayer === this){
            if (this._displayServer !== null){
                this._displayServer.layerRemoved(sublayer);
            }
            for (var i = sublayer.sublayerIndex + 1, l = this.sublayers.length; i < l; ++i){
                this.sublayers[i].sublayerIndex -= 1;
            }
            this.sublayers.splice(sublayer.sublayerIndex,1);
            sublayer.superlayer = null;
            sublayer.sublayerIndex = null;
        }
    },

    removeFromSuperlayer: function(){
        if (this.superlayer){
            this.superlayer.removeSublayer(this);
        }
    },

    removeAllSublayers: function(){
        for (var i = this.sublayers.length - 1; i >= 0; --i){
            this.sublayers[i].removeFromSuperlayer();
        }
        this.sublayers = [];
    },

    // -------------------------------------------------------------------------
    // MARK: - Coordinate conversion

    convertPointToLayer: function(point, layer){
        if (layer === this){
            return point;
        }
        if (layer.superlayer === this){
            return layer._convertPointFromSuperlayer(point);
        }
        if (this.superlayer === layer){
            return this._convertPointToSuperlayer(point);
        }
        return this._convertPointToLayer(point, layer);
    },

    convertPointFromLayer: function(point, layer){
        return layer.convertPointToLayer(point, this);
    },

    convertRectToLayer: function(rect, layer){
        if (layer === this){
            return rect;
        }
        var p0 = this.convertPointToLayer(rect.origin, layer);
        if (p0 !== null){
            var p1 = this.convertPointToLayer(JSPoint(rect.origin.x + rect.size.width, rect.origin.y), layer);
            var p2 = this.convertPointToLayer(JSPoint(rect.origin.x, rect.origin.y + rect.size.height), layer);
            var p3 = this.convertPointToLayer(JSPoint(rect.origin.x + rect.size.width ,rect.origin.y + rect.size.height), layer);
            var minX = Math.min(p0.x, p1.x, p2.x, p3.x);
            var maxX = Math.max(p0.x, p1.x, p2.x, p3.x);
            var minY = Math.min(p0.y, p1.y, p2.y, p3.y);
            var maxY = Math.max(p0.y, p1.y, p2.y, p3.y);
            return JSRect(minX, minY, maxX - minX, maxY - minY);
        }
        return null;
    },

    convertRectFromLayer: function(rect, layer){
        return layer.convertRectToLayer(rect, this);
    },

    _convertRectToSuperlayer: function(rect){
        if (this.model.transform.isIdentity){
            var origin = JSPoint(this.model.position);
            origin.x -= this.model.bounds.size.width * this.model.anchorPoint.x;
            origin.y -= this.model.bounds.size.height * this.model.anchorPoint.y;
            return JSRect(origin, this.model.bounds.size);
        }else{
            var p0 = this._convertPointToSuperlayer(rect.origin);
            var p1 = this._convertPointToSuperlayer(JSPoint(rect.origin.x + rect.size.width, rect.origin.y));
            var p2 = this._convertPointToSuperlayer(JSPoint(rect.origin.x, rect.origin.y + rect.size.height));
            var p3 = this._convertPointToSuperlayer(JSPoint(rect.origin.x + rect.size.width, rect.origin.y + rect.size.height));
            var minX = Math.min(p0.x, p1.x, p2.x, p3.x);
            var maxX = Math.max(p0.x, p1.x, p2.x, p3.x);
            var minY = Math.min(p0.y, p1.y, p2.y, p3.y);
            var maxY = Math.max(p0.y, p1.y, p2.y, p3.y);
            return JSRect(minX, minY, maxX - minX, maxY - minY);
        }
    },

    transformFromSuperlayer: function(){
        if (this.model.transform.isIdentity){
            return JSAffineTransform.Translated(this.model.frame.origin.x - this.model.bounds.origin.x, this.model.frame.origin.y - this.model.bounds.origin.y);
        }
        return this._transformFromSuperlayer();
    },

    _convertPointToSuperlayer: function(point){
        if (this.model.transform.isIdentity){
            return JSPoint(
                point.x + this.model.frame.origin.x - this.model.bounds.origin.x,
                point.y + this.model.frame.origin.y - this.model.bounds.origin.y
            );
        }
        var transform = this._transformFromSuperlayer();
        return transform.convertPointFromTransform(point);
    },

    _convertPointFromSuperlayer: function(superlayerPoint){
        if (this.model.transform.isIdentity){
            return JSPoint(
                superlayerPoint.x - this.model.frame.origin.x + this.model.bounds.origin.x,
                superlayerPoint.y - this.model.frame.origin.y + this.model.bounds.origin.y
            );
        }
        var transform = this._transformFromSuperlayer();
        return transform.convertPointToTransform(superlayerPoint);
    },

    _transformFromSuperlayer: function(){
        return this._transformFromSuperlayerUsingProperties(this.model);
    },

    _presentationTransformFromSuperlayer: function(){
        return this._transformFromSuperlayerUsingProperties(this.presentation);
    },

    _transformFromSuperlayerUsingProperties: function(properties){
        var anchorX = properties.bounds.size.width * properties.anchorPoint.x;
        var anchorY = properties.bounds.size.height * properties.anchorPoint.y;
        var positionTransform = JSAffineTransform.Translated(properties.position.x, properties.position.y);
        var transform = properties.transform.concatenatedWith(positionTransform).translatedBy(-anchorX - properties.bounds.origin.x, -anchorY - properties.bounds.origin.y);
        return transform;
    },

    _convertPointToLayer: function(point, layer){
        var ourStack = [];
        var otherStack = [];
        var stackLayer = this;
        while (stackLayer !== null){
            ourStack.push(stackLayer);
            stackLayer = stackLayer.superlayer;
        }
        stackLayer = layer;
        while (stackLayer !== null){
            otherStack.push(stackLayer);
            stackLayer = stackLayer.superlayer;
        }
        while (ourStack.length > 0 && otherStack.length > 0 && ourStack[ourStack.length - 1] === otherStack[otherStack.length - 1]){
            ourStack.pop();
            otherStack.pop();
        }
        var convertedPoint = JSPoint(point);
        var i, l;
        for (i = 0, l = ourStack.length; i < l; ++i){
            stackLayer = ourStack[i];
            convertedPoint = stackLayer._convertPointToSuperlayer(convertedPoint);
        }
        for (i = otherStack.length - 1; i >= 0; --i){
            stackLayer = otherStack[i];
            convertedPoint = stackLayer._convertPointFromSuperlayer(convertedPoint);
        }
        return convertedPoint;
    },

    // -------------------------------------------------------------------------
    // MARK: - Hit Testing

    containsPoint: function(point){
        return point.x >= this.model.bounds.origin.x && point.y >= this.model.bounds.origin.y && point.x < this.model.bounds.origin.x + this.model.bounds.size.width && point.y < this.model.bounds.origin.y + this.model.bounds.size.height;
    },

    hitTest: function(locationInLayer){
        var sublayer;
        var locationInSublayer;
        var hit = null;
        for (var i = this.sublayers.length - 1; i >= 0 && hit === null; --i){
            sublayer = this.sublayers[i];
            locationInSublayer = this.convertPointToLayer(locationInLayer, sublayer);
            if (!sublayer.hidden && sublayer.presentation.alpha > 0 && (!sublayer.clipsToBounds || sublayer.containsPoint(locationInSublayer))){
                hit = sublayer.hitTest(locationInSublayer);
            }
        }
        if (hit === null && this.containsPoint(locationInLayer)){
            hit = this;
        }
        return hit;
    },

    // -------------------------------------------------------------------------
    // MARK: - Animations

    addAnimationForKey: function(animation, key){
        if (this.animationCount === 0){
            // This is a trick to make our presentation match our model, except in those
            // cases that will be overwritten by animations.
            this.presentation = Object.create(this.model);
        }
        if (!(key in this.animationsByKey)){
            ++this.animationCount;
        }
        var parts = key.split('.');
        // We need to make sure we're updating a copy on the presentation, so we don't
        // inadvertently update the model too
        if (parts[0] in this.presentation && !this.presentation.hasOwnProperty(parts[0])){
            var value = this.presentation[parts[0]];
            this.presentation[parts[0]] = this.copyOfValue(value);
        }
        this.animationsByKey[key] = animation;
        animation.layer = this;
        if (!UIAnimationTransaction.currentTransaction){
            this.setNeedsAnimation();
        }
    },

    copyOfValue: function(value){
        if (value instanceof JSPoint){
            return JSPoint(value);
        }
        if (value instanceof JSSize){
            return JSSize(value);
        }
        if (value instanceof JSRect){
            return JSRect(value);
        }
        if (value instanceof JSAffineTransform){
            JSAffineTransform(value.a, value.b, value.c, value.d, value.tx, value.ty);
        }
        return value;
    },

    setNeedsAnimation: function(){
        if (this._displayServer !== null){
            this._displayServer.setLayerNeedsAnimation(this);
        }
    },

    removeAnimation: function(animation, updatingModel){
        var foundKey = null;
        for (var key in this.animationsByKey){
            if (this.animationsByKey[key] === animation){
                foundKey = key;
                break;
            }
        }
        if (foundKey !== null){
            if (updatingModel){
                var parts = foundKey.split('.');
                if (parts[0] in this.presentation){
                    JSSetDottedName(this, parts[0], JSResolveDottedName(this.presentation, parts[0]));
                }
            }
            this.removeAnimationForKey(foundKey);
        }
    },

    removeAnimationForKey: function(key){
        --this.animationCount;
        if (this.animationCount === 0){
            // If we're all done with animations, reset our presentation to be identical to our model
            this.presentation = this.model;
        }else{
            // If we still have animations remaining, selectively clear out this animation's
            // presentation values so we fall back through to model values
            var parts = key.split('.');
            if (parts[0] in this.presentation){
                if (parts.length == 1){
                    delete this.presentation[parts[0]];
                }else{
                    // If we're dealing with a sub-property, there could be other active animations that
                    // are altering other sub-properties of the same top-sublayerIndex property.  While we could
                    // check for others, there doesn't seem to be much benefit, so just overwrite this
                    // animation's presentation property with the model property.
                    JSSetDottedName(this.presentation, key, JSResolveDottedName(this.model, key));
                }
            }
        }
        delete this.animationsByKey[key];
    },

    _addImplicitAnimationForKey: function(key){
        var transaction = UIAnimationTransaction.currentTransaction;
        if (transaction && !(key in this.animationsByKey)){
            var animation = UIBasicAnimation.initWithKeyPath(key);
            animation.fromValue = this[key];
            this.addAnimationForKey(animation, key);
            transaction.addAnimation(animation);
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Layout

    _needsLayout: false,

    setNeedsLayout: function(){
        if (this._displayServer !== null){
            this._displayServer.setLayerNeedsLayout(this);
        }else{
            this._needsLayout = true;
        }
    },

    needsLayout: function(){
        return this._displayServer !== null ? this._displayServer.layerNeedsLayout(this) : this._needsLayout;
    },

    layoutIfNeeded: function(){
        if (this._displayServer !== null){
            this._displayServer.layoutLayerIfNeeded(this);
        }else if (this._needsLayout){
            this.layout();
        }
        for (var i = 0, l = this.sublayers.length; i < l; ++i){
            this.sublayers[i].layoutIfNeeded();
        }
    },

    layout: function(){
        this._needsLayout = false;
        if (this.delegate !== null && this.delegate.layoutSublayersOfLayer !== undefined){
            this.delegate.layoutSublayersOfLayer(this);
        }else{
            this.layoutSublayers();
        }
    },

    layoutSublayers: function(){
    },

    sizeToFit: function(){
        this.sizeToFitSize(JSSize(Number.MAX_VALUE, Number.MAX_VALUE));
    },

    sizeToFitSize: function(maxSize){
        var size = JSSize(this.bounds.size);
        if (size.width > maxSize.width){
            size.width = maxSize.width;
        }
        if (size.height > maxSize.height){
            size.height = maxSize.height;
        }
        this.bounds = JSRect(this.bounds.origin, size);
    },

    // -------------------------------------------------------------------------
    // MARK: - Display

    _needsDisplay: false,

    setNeedsDisplay: function(){
        if (this._displayServer !== null){
            this._displayServer.setLayerNeedsDisplay(this);
        }else{
            this._needsDisplay = true;
        }
    },

    displayIfNeeded: function(){
        if (this._displayServer !== null){
            this._displayServer.displayLayerIfNeeded(this);
        }
    },

    display: function(){
        if (this._displayServer !== null){
            var context = this._displayServer.contextForLayer(this);
            this._renderInContextImmediately(context, false);
        }
    },

    drawInContext: function(context){
    },

    _drawInContext: function(context){
        if (this.delegate && this.delegate.drawLayerInContext){
            this.delegate.drawLayerInContext(this, context);
        }else{
            this.drawInContext(context);
        }
    },

    renderInContext: function(context){
        if (this._displayServer !== null){
            var displayContext = this._displayServer.contextForLayer(this);
            if (context === displayContext){
                this.setNeedsDisplay();
                return;
            }
        }
        this._renderInContextImmediately(context, true);
    },

    _renderInContextImmediately: function(context, includeSublayers){
        var hidden = this.presentation.hidden;
        if (!hidden || context.drawsHiddenLayers){
            context.drawLayer(this);
        }
        if (includeSublayers && !hidden){
            var sublayer;
            var transform;
            for (var i = 0, l = this.sublayers.length; i < l; ++i){
                sublayer = this.sublayers[i];
                if (!sublayer.hidden){
                    context.save();
                    transform = sublayer._presentationTransformFromSuperlayer();
                    context.concatenate(transform);
                    sublayer.renderInContext(context);
                    context.restore();
                }
            }
        }
    }

});

UILayer.Corners = JSPath.Corners;
UILayer.Sides = JSPath.Sides;

UILayer.Properties = {
    frame                   : JSRect.Zero,
    bounds                  : JSRect.Zero,
    position                : JSPoint.Zero,
    anchorPoint             : JSPoint.UnitCenter,
    transform               : JSAffineTransform.Identity,
    hidden                  : false,
    alpha                   : 1.0,
    backgroundColor         : null,
    backgroundGradient      : null,
    borderWidth             : null,
    borderColor             : null,
    maskedBorders           : UILayer.Sides.all,
    cornerRadius            : null,
    maskedCorners           : UILayer.Corners.all,
    shadowColor             : null,
    shadowOffset            : JSPoint.Zero,
    shadowRadius            : 0.0
};

UILayer.Path = {
    background: 0,
    border: 1,
    shadow: 2
};

JSContext.definePropertiesFromExtensions({

    drawsHiddenLayers: false,

    drawLayer: function(layer){
        var properties = layer.presentation;

        this.save();

        // Global drawing options
        this.setAlpha(properties.alpha);

        var backgroundPath = JSPath.init();
        backgroundPath.addRectWithSidesAndCorners(layer.bounds, UILayer.Sides.all, properties.maskedCorners, properties.cornerRadius);

        // Shadow
        if (properties.shadowColor !== null && (properties.shadowRadius > 0 || properties.shadowOffset.x != 0 || properties.shadowOffset.y !== 0)){
            this.save();
            this.beginPath();
            this.addPath(backgroundPath);
            this.setFillColor(properties.shadowColor);
            this.setShadow(properties.shadowOffset, properties.shadowRadius, properties.shadowColor.colorWithAlpha(1));
            this.fillPath();
            this.restore();
        }

        // Background
        if (properties.backgroundColor !== null || properties.backgroundGradient !== null){
            this.save();
            this.beginPath();
            this.addPath(backgroundPath);
            this.clip();
            if (properties.backgroundColor !== null){
                this.setFillColor(properties.backgroundColor);
                this.fillRect(properties.bounds);
            }
            if (properties.backgroundGradient){
                this.drawLinearGradient(properties.backgroundGradient, properties.bounds);
            }
            this.restore();
        }

        // Custom Drawing
        this.save();
        if (layer._clipsToBounds){
            this.beginPath();
            this.addPath(backgroundPath);
            this.clip();
        }
        layer._drawInContext(this);
        this.restore();

        // Border
        if (properties.borderWidth > 0 && properties.borderColor !== null){
            this.save();
            this.beginPath();
            this.addPath(backgroundPath);
            this.clip();
            this.beginPath();
            var borderPath = JSPath.init();
            borderPath.addRectWithSidesAndCorners(layer.bounds, properties.maskedBorders, properties.maskedCorners, properties.cornerRadius);
            this.addPath(borderPath);
            this.setStrokeColor(properties.borderColor);
            this.setLineWidth(properties.borderWidth * 2);
            this.strokePath();
            this.restore();
        }

        this.restore();
    }
});