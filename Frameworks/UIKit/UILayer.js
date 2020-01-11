// #import Foundation
// #import "UIAnimationTransaction.js"
// #import "UIBasicAnimation.js"
// #import "UIDisplayServer.js"
// #feature Math.min
// #feature Math.max
/* global JSGlobalObject, UILayerAnimatedProperty, JSCustomProperty, JSReadOnlyProperty, JSDynamicProperty, JSClass, JSObject, JSInsets, UILayer, UIDisplayServer, JSRect, JSPoint, JSSize, JSAffineTransform, UIAnimationTransaction, UIBasicAnimation, JSSetDottedName, JSResolveDottedName, JSContext */
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
        if (this.delegate && this.delegate.layerDidChangeSize){
            this.delegate.layerDidChangeSize(this);
        }
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

    _convertPointToSuperlayer: function(point){
        var superlayerPoint = JSPoint(point.x - this.model.bounds.origin.x, point.y - this.model.bounds.origin.y);
        if (this.model.transform.isIdentity){
            superlayerPoint.x += this.model.frame.origin.x;
            superlayerPoint.y += this.model.frame.origin.y;
        }else{
            var transform = this._transformFromSuperlayer();
            superlayerPoint = transform.convertPointFromTransform(superlayerPoint);
        }
        return superlayerPoint;
    },

    _convertPointFromSuperlayer: function(superlayerPoint){
        var point = JSPoint(superlayerPoint);
        if (this.model.transform.isIdentity){
            point.x -= this.model.frame.origin.x;
            point.y -= this.model.frame.origin.y;
        }else{
            var transform = this._transformFromSuperlayer();
            point = transform.convertPointToTransform(point);
        }
        point.x += this.model.bounds.origin.x;
        point.y += this.model.bounds.origin.y;
        return point;
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
        var transform = properties.transform.concatenatedWith(positionTransform).translatedBy(-anchorX, -anchorY);
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
                    context.concatCTM(transform);
                    sublayer.renderInContext(context);
                    context.restore();
                }
            }
        }
    }

});

UILayer.Corners = {
    none: 0,
    minXminY: 1 << 0,
    minXmaxY: 1 << 1,
    maxXminY: 1 << 2,
    maxXmaxY: 1 << 3,
    all: 0xF,

    initWithSpec: function(spec){
        var i,l;
        var corners = UILayer.Corners.none;
        var option;
        if (spec.numberValue !== null){
            return spec.numberValue;
        }
        if (spec.stringValue !== null){
            var options = spec.stringValue.split('|');
            for (i = 0, l = options.length; i < l; ++i){
                option = options[i];
                if (option in UILayer.Corners){
                    corners |= UILayer.Corners[option];
                }
            }
            return corners;
        }
        if (spec.length !== null){
            for (i = 0, l = spec.length; i < l; ++i){
                option = spec;
                if (option in UILayer.Corners){
                    corners |= UILayer.Corners[option];
                }
            }
            return corners;
        }
        return corners;
    }
};

UILayer.Corners.minX = UILayer.Corners.minXminY | UILayer.Corners.minXmaxY;
UILayer.Corners.maxX = UILayer.Corners.maxXminY | UILayer.Corners.maxXmaxY;
UILayer.Corners.minY = UILayer.Corners.minXminY | UILayer.Corners.maxXminY;
UILayer.Corners.maxY = UILayer.Corners.minXmaxY | UILayer.Corners.maxXmaxY;

UILayer.Sides = {
    none: 0,
    minX: 1 << 0,
    maxX: 1 << 1,
    minY: 1 << 2,
    maxY: 1 << 3,
    all: 0xF,

    initWithSpec: function(spec){
        var i,l;
        var sides = UILayer.Sides.none;
        var option;
        if (spec.numberValue !== null){
            return spec.numberValue;
        }
        if (spec.stringValue !== null){
            var options = spec.stringValue.split('|');
            for (i = 0, l = options.length; i < l; ++i){
                option = options[i];
                if (option in UILayer.Sides){
                    sides |= UILayer.Sides[option];
                }
            }
            return sides;
        }
        if (spec.length !== null){
            for (i = 0, l = spec.length; i < l; ++i){
                option = spec;
                if (option in UILayer.Sides){
                    sides |= UILayer.Sides[option];
                }
            }
            return sides;
        }
        return sides;
    }
};

UILayer.Sides.minYmaxY = UILayer.Sides.minY | UILayer.Sides.maxY;
UILayer.Sides.minXmaxX = UILayer.Sides.minX | UILayer.Sides.maxX;

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
        if (properties.shadowColor){
            this.setShadow(properties.shadowOffet, properties.shadowBlur, properties.shadowColor);
        }

        // Background
        this.drawBackgroundForLayerProperties(properties);

        // Custom Drawing
        this.save();
        if (layer._clipsToBounds){
            this.clip();
        }
        layer._drawInContext(this);
        this.restore();

        // Border
        this.drawBorderForLayerProperties(properties);

        this.restore();
    },

    drawBackgroundForLayerProperties: function(properties){
        if (properties.backgroundColor === null && properties.backgroundGradient === null){
            return;
        }
        this.beginPath();
        this.addBorderPathForLayerProperties(properties, UILayer.Path.background);
        if (properties.backgroundColor){
            this.save();
            this.setFillColor(properties.backgroundColor);
            this.fillPath();
            this.restore();
        }
        if (properties.backgroundGradient){
            this.save();
            this.clip();
            this.drawLinearGradient(properties.backgroundGradient, 0, properties.bounds.size.height);
            this.restore();
        }
    },

    drawBorderForLayerProperties: function(properties){
        if (properties.borderWidth > 0 && properties.borderColor !== null){
            this.beginPath();
            this.addBorderPathForLayerProperties(properties, UILayer.Path.border);
            this.save();
            this.setStrokeColor(properties.borderColor);
            this.setLineWidth(properties.borderWidth);
            this.strokePath();
            this.restore();
        }
    },

    addBorderPathForLayerProperties: function(properties, path){
        var maskedBorders = properties.maskedBorders;
        var insetHalfBorderWidth = properties.borderWidth > 0;
        switch (path){
            case UILayer.Path.background:
                maskedBorders = UILayer.Sides.all;
                insetHalfBorderWidth = insetHalfBorderWidth && properties.borderColor.alpha === 1;
                break;
            case UILayer.Path.border:
                break;
            case UILayer.Path.shadow:
                maskedBorders = UILayer.Sides.all;
                insetHalfBorderWidth = false;
                break;
        }
        var rect = JSRect(0, 0, properties.bounds.size.width, properties.bounds.size.height);
        var cornerRadius = properties.cornerRadius;
        if (insetHalfBorderWidth){
            var halfBorderWidth = properties.borderWidth / 2;
            cornerRadius -= halfBorderWidth;
            var insets = JSInsets(halfBorderWidth);
            if ((maskedBorders & UILayer.Sides.minX) === 0){
                insets.left = 0;
            }
            if ((maskedBorders & UILayer.Sides.minY) === 0){
                insets.top = 0;
            }
            if ((maskedBorders & UILayer.Sides.maxX) === 0){
                insets.right = 0;
            }
            if ((maskedBorders & UILayer.Sides.maxY) === 0){
                insets.bottom = 0;
            }
            rect = rect.rectWithInsets(insets);
        }
        if (cornerRadius <= 0 || properties.maskedCorners == UILayer.Corners.none){
            cornerRadius = 0;
        }

        if (maskedBorders == UILayer.Sides.all && properties.maskedCorners == UILayer.Corners.all){
            this.addRoundedRect(rect, cornerRadius);
        }else{
            var halfWidth = rect.size.width / 2;
            var halfHeight = rect.size.height / 2;
            if (cornerRadius > halfWidth){
                cornerRadius = halfWidth;
            }
            if (cornerRadius > halfHeight){
                cornerRadius = halfHeight;
            }
            var magicRadius = JSContext.ellipseCurveMagic * cornerRadius;

            var p1, p2, cp1, cp2;

            if ((properties.maskedCorners & UILayer.Corners.minXminY) == UILayer.Corners.minXminY){
                p1 = JSPoint(rect.origin.x, rect.origin.y + cornerRadius);
                p2 = JSPoint(rect.origin.x + cornerRadius, rect.origin.y);
                cp1 = JSPoint(p1.x, p1.y - magicRadius);
                cp2 = JSPoint(p2.x - magicRadius, p2.y);
                this.moveToPoint(p1.x, p1.y);
                if ((maskedBorders & (UILayer.Sides.minX | UILayer.Sides.minY)) == (UILayer.Sides.minX | UILayer.Sides.minY)){
                    this.addCurveToPoint(p2, cp1, cp2);
                }else{
                    this.moveToPoint(p2.x, p2.y);
                }
            }else{
                this.moveToPoint(rect.origin.x, rect.origin.y);
            }

            if ((properties.maskedCorners & UILayer.Corners.maxXminY) == UILayer.Corners.maxXminY){
                p1 = JSPoint(rect.origin.x + rect.size.width - cornerRadius, rect.origin.y);
                p2 = JSPoint(rect.origin.x + rect.size.width, rect.origin.y + cornerRadius);
                cp1 = JSPoint(p1.x + magicRadius, p1.y);
                cp2 = JSPoint(p2.x, p2.y - magicRadius);
                if (maskedBorders & UILayer.Sides.minY){
                    this.addLineToPoint(p1.x, p1.y);
                }else{
                    this.moveToPoint(p1.x, p1.y);
                }
                if ((maskedBorders & (UILayer.Sides.maxX | UILayer.Sides.minY)) == (UILayer.Sides.maxX | UILayer.Sides.minY)){
                    this.addCurveToPoint(p2, cp1, cp2);
                }else{
                    this.moveToPoint(p2.x, p2.y);
                }
            }else{
                if (maskedBorders & UILayer.Sides.minY){
                    this.addLineToPoint(rect.origin.x + rect.size.width, rect.origin.y);
                }else{
                    this.moveToPoint(rect.origin.x + rect.size.width, rect.origin.y);
                }
            }

            if ((properties.maskedCorners & UILayer.Corners.maxXmaxY) == UILayer.Corners.maxXmaxY){
                p1 = JSPoint(rect.origin.x + rect.size.width, rect.origin.y + rect.size.height - cornerRadius);
                p2 = JSPoint(rect.origin.x + rect.size.width - cornerRadius, rect.origin.y + rect.size.height);
                cp1 = JSPoint(p1.x, p1.y + magicRadius);
                cp2 = JSPoint(p2.x + magicRadius, p2.y);
                if (maskedBorders & UILayer.Sides.maxX){
                    this.addLineToPoint(p1.x, p1.y);
                }else{
                    this.moveToPoint(p1.x, p1.y);
                }
                if ((maskedBorders & (UILayer.Sides.maxX | UILayer.Sides.maxY)) == (UILayer.Sides.maxX | UILayer.Sides.maxY)){
                    this.addCurveToPoint(p2, cp1, cp2);
                }else{
                    this.moveToPoint(p2.x, p2.y);
                }
            }else{
                if (maskedBorders & UILayer.Sides.maxX){
                    this.addLineToPoint(rect.origin.x + rect.size.width, rect.origin.y + rect.size.height);
                }else{
                    this.moveToPoint(rect.origin.x + rect.size.width, rect.origin.y + rect.size.height);
                }
            }

            if ((properties.maskedCorners & UILayer.Corners.minXmaxY) == UILayer.Corners.minXmaxY){
                p1 = JSPoint(rect.origin.x + cornerRadius, rect.origin.y + rect.size.height);
                p2 = JSPoint(rect.origin.x, rect.origin.y + rect.size.height - cornerRadius);
                cp1 = JSPoint(p1.x - magicRadius, p1.y);
                cp2 = JSPoint(p2.x, p2.y + magicRadius);
                if (maskedBorders & UILayer.Sides.maxY){
                    this.addLineToPoint(p1.x, p1.y);
                }else{
                    this.moveToPoint(p1.x, p1.y);
                }
                if ((maskedBorders & (UILayer.Sides.minX | UILayer.Sides.maxY)) == (UILayer.Sides.minX | UILayer.Sides.maxY)){
                    this.addCurveToPoint(p2, cp1, cp2);
                }else{
                    this.moveToPoint(p2.x, p2.y);
                }
            }else{
                if (maskedBorders & UILayer.Sides.maxY){
                    this.addLineToPoint(rect.origin.x, rect.origin.y + rect.size.height);
                }else{
                    this.moveToPoint(rect.origin.x, rect.origin.y + rect.size.height);
                }
            }

            if ((properties.maskedCorners & UILayer.Corners.minXminY) == UILayer.Corners.minXminY){
                p1 = JSPoint(rect.origin.x, rect.origin.y + cornerRadius);
                if (maskedBorders & UILayer.Sides.minX){
                    this.addLineToPoint(p1.x, p1.y);
                }else{
                    this.moveToPoint(p1.x, p1.y);
                }
            }else{
                if (maskedBorders & UILayer.Sides.minX){
                    this.addLineToPoint(rect.origin.x, rect.origin.y);
                }
            }

            if (this.maskedBorders & UILayer.Sides.minX){
                this.closePath();
            }
        }
    }
});