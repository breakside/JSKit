// #import "Foundation/Foundation.js"
// #import "UIKit/UIAnimationTransaction.js"
// #import "UIKit/UIBasicAnimation.js"
// #import "UIKit/UIDisplayServer.js"
// #feature Math.min
// #feature Math.max
/* global JSCustomProperty, JSDynamicProperty, JSClass, JSObject, UILayer, UIDisplayServer, JSRect, JSPoint, JSSize, JSConstraintBox, JSAffineTransform, UIAnimationTransaction, UIBasicAnimation, JSSetDottedName, JSResolveDottedName, JSContext */
'use strict';

function UILayerAnimatedProperty(){
    if (this === undefined){
        return new UILayerAnimatedProperty();
    }
}

UILayerAnimatedProperty.prototype = Object.create(JSCustomProperty.prototype);

UILayerAnimatedProperty.prototype.define = function(C, key, extensions){
    var setterName = C.nameOfSetMethodForKey(key);
    var setter = extensions[setterName];
    var getter = function UILayer_getAnimatableProperty(){
        return this.model[key];
    };
    if (!setter){
        setter = function UILayer_setAnimatableProperty(value){
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
    constraintBox:      UILayerAnimatedProperty(),
    transform:          UILayerAnimatedProperty(),
    hidden:             UILayerAnimatedProperty(),
    alpha:              UILayerAnimatedProperty(),
    backgroundColor:    UILayerAnimatedProperty(),
    backgroundGradient: UILayerAnimatedProperty(),
    borderWidth:        UILayerAnimatedProperty(),
    borderColor:        UILayerAnimatedProperty(),
    cornerRadius:       UILayerAnimatedProperty(),
    shadowColor:        UILayerAnimatedProperty(),
    shadowOffset:       UILayerAnimatedProperty(),
    shadowRadius:       UILayerAnimatedProperty(),
    clipsToBounds:      JSDynamicProperty('_clipsToBounds'),
    model:              null,
    presentation:       null,
    superlayer:         null,
    sublayers:          null,
    level:              null,
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
        // When the anchor point changes, the position remains constant and we have to recalculate the frame
        this._addImplicitAnimationForKey('anchorPoint');
        this.model.anchorPoint = anchorPoint;
        this._recalculateFrame();
        this.didChangeProperty('anchorPoint');
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
            this.model.position.x += dx;
            this.model.position.y += dy;
        }
        this.didChangeProperty('position');
    },

    setConstraintBox: function(constraintBox){
        // When the constraint box changes, the frame (and therefore position and bounds) will
        // likely change.  superview.layoutSubviews will adjust as necessary
        this.model.constraintBox = JSConstraintBox(constraintBox);
        if (this.superlayer !== null){
            this.superlayer.setNeedsLayout();
        }
    },

    setBounds: function(bounds){
        // When the bounds origin changes, it's like a scrolling view, and we need to update the sublayers
        // When the bounds change size, the position and frame both need to be recalculated accordingly
        var oldBounds = this.model.bounds;
        this.model.bounds = JSRect(bounds);
        if (!bounds.size.isEqual(oldBounds.size)){
            this._addImplicitAnimationForKey('bounds');
            this._addImplicitAnimationForKey('position');
            this._recalculatePosition();
            // Frame calculation depends on the recaculated position, so it must be done second
            this._recalculateFrame();
            this.didChangeProperty('position');
            this.didChangeProperty('bounds.size');
            this.didChangeSize();
        }
        if (!bounds.origin.isEqual(oldBounds.origin)){
            this.boundsOriginDidChange();
        }
    },

    getClipsToBounds: function(){
        return this._clipsToBounds;
    },

    setClipsToBounds: function(clipsToBounds){
        this._clipsToBounds = true;
        this.didChangeProperty('clipsToBounds');
    },

    boundsOriginDidChange: function(){
        if (this._displayServer !== null){
            for (var i = 0, l = this.sublayers.length; i < l; ++i){
                this._displayServer.setLayerNeedsReposition(this.sublayers[i]);
            }
        }
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
    // MARK: - Adding and Removing Sublayers

    addSublayer: function(sublayer){
        return this.insertSublayerAtIndex(sublayer, this.sublayers.length);
    },

    insertSublayerAtIndex: function(sublayer, index){
        var i, l;
        if (sublayer.superlayer === this){
            for (i = sublayer.level + 1, l = this.sublayers.length; i < l; ++i){
                this.sublayers[i].level -= 1;
            }
            this.sublayers.splice(sublayer.level,1);
            if (index > sublayer.level){
                --index;
            }
        }
        this.sublayers.splice(index, 0, sublayer);
        sublayer.level = index;
        for (i = sublayer.level + 1, l = this.sublayers.length; i < l; ++i){
            this.sublayers[i].level += 1;
        }
        sublayer.superlayer = this;
        if (sublayer.model.constraintBox){
            sublayer.frame = this._frameForConstraintBox(sublayer.model.constraintBox);
        }
        if (this._displayServer !== null){
            this._displayServer.layerInserted(sublayer);
        }
        return sublayer;
    },

    insertSublayerBeforeSibling: function(sublayer, sibling){
        if (sibling.superlayer !== this){
            throw Error('Cannot insert sublayer [%s] in view [%s] because sibling view [%s] is not a valid sublayer.');
        }
        return this.insertSublayerAtIndex(sibling.level);
    },

    insertSublayerAfterSibling: function(sublayer, sibling){
        if (sibling.superlayer !== this){
            throw Error('Cannot insert sublayer [%s] in view [%s] because sibling view [%s] is not a valid sublayer.');
        }
        return this.insertSublayerAtIndex(sibling.level + 1);
    },

    removeSublayer: function(sublayer){
        if (sublayer.superlayer === this){
            if (this._displayServer !== null){
                this._displayServer.layerRemoved(sublayer);
            }
            for (var i = sublayer.level + 1, l = this.sublayers.length; i < l; ++i){
                this.sublayers[i].level -= 1;
            }
            this.sublayers.splice(sublayer.level,1);
            sublayer.superlayer = null;
            sublayer.level = null;
        }
    },

    removeFromSuperlayer: function(){
        if (this.superlayer){
            this.superlayer.removeSublayer(this);
        }
    },

    removeAllSublayers: function(){
        for (var i = 0, l = this.sublayers.length; i < l; ++i){
            this.sublayer.removeFromSuperlayer();
        }
        this.sublayers = [];
    },

    // -------------------------------------------------------------------------
    // MARK: - Coordinate conversion

    convertPointToLayer: function(point, layer){
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
        var p0 = this.convertPointToLayer(rect.origin, layer);
        if (p0 !== null){
            var p1 = this.convertPointToLayer(JSPoint(rect.origin.x + rect.size.width, rect.origin.y), layer);
            var p2 = this.convertPointToLayer(JSPoint(rect.origin.x, rect.origin.y + rect.size.height), layer);
            var p3 = this.convertPointToLayer(JSPoint(rect.origin.x + rect.size.width ,rect.origin + rect.size.height), layer);
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
        var anchorX = this.bounds.size.width * this.anchorPoint.x;
        var anchorY = this.bounds.size.height * this.anchorPoint.y;
        var positionTransform = JSAffineTransform.Translated(this.model.position.x, this.model.position.y);
        var transform = this.model.transform.concatenatedWith(positionTransform).translatedBy(-anchorX, -anchorY);
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
        var commonAncestor = null;
        while (ourStack.length > 0 && otherStack.length > 0 && ourStack[ourStack.length - 1] === otherStack[otherStack.length - 1]){
            commonAncestor = ourStack.pop();
            otherStack.pop();
        }
        if (layer === null || commonAncestor !== null){
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
        }
        return null;
    },

    // -------------------------------------------------------------------------
    // MARK: - Hit Testing

    containsPoint: function(point){
        return point.x >= this.model.bounds.origin.x && point.y >= this.model.bounds.origin.y && point.x < this.model.bounds.origin.x + this.model.bounds.size.width && point.y < this.model.bounds.origin.y + this.model.bounds.size.height;
    },

    hitTest: function(locationInView){
        var sublayer;
        var locationInSublayer;
        for (var i = this.sublayers.length - 1; i >= 0; --i){
            sublayer = this.sublayers[i];
            locationInSublayer = this.convertPointToLayer(locationInView, sublayer);
            if (sublayer.containsPoint(locationInSublayer)){
                return sublayer.hitTest(locationInSublayer);
            }
        }
        return this;
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
        // If we have a sub-property, we need to make sure we're updating a copy on the presentation, so we don't
        // inadvertently update the model too
        if (parts > 1 && parts[0] in this.presentation && this.presentation[parts[0]] && !this.presentation.hasOwnProperty(parts[0])){
            var value = this.presentation[parts[0]];
            if (value instanceof JSPoint){
                this.presentation[parts[0]] = JSPoint(value.x, value.y);
            }else if (value instanceof JSSize){
                this.presentation[parts[0]] = JSSize(value.width, value.height);
            }else if (value instanceof JSRect){
                this.presentation[parts[0]] = JSRect(value.origin.x, value.origin.y, value.size.width, value.size.height);
            }else if (value instanceof JSConstraintBox){
                this.presentation[parts[0]] = JSConstraintBox({top: value.top, right: value.right, bottom: value.bottom, left: value.left, width: value.width, height: value.height});
            }else if (value instanceof JSAffineTransform){
                this.presentation[parts[0]] = JSAffineTransform(value.a, value.b, value.c, value.d, value.tx, value.ty);
            }else{
                this.presentationLayer[parts[0]] = this.copyOfProperty(parts[0]);
            }
        }else if (key in this.presentation && !this.presentation.hasOwnProperty(key)){
            this.presentation[key] = this.model[key];
        }
        this.animationsByKey[key] = animation;
        animation.layer = this;
        if (!UIAnimationTransaction.currentTransaction && this._displayServer !== null){
            this._displayServer.setLayerNeedsAnimation(this);
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
                    // are altering other sub-properties of the same top-level property.  While we could
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
            animation.duration = transaction.duration;
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
    },

    layout: function(){
        if (this.delegate !== null && this.delegate.layoutSublayersOfLayer !== undefined){
            this.delegate.layoutSublayersOfLayer(this);
        }else{
            this.layoutSublayers();
        }
    },

    layoutSublayers: function(){
        var sublayer;
        for (var i = 0, l = this.sublayers.length; i < l; ++i){
            sublayer = this.sublayers[i];
            if (sublayer.model.constraintBox !== null){
                sublayer.frame = this._frameForConstraintBox(sublayer.model.constraintBox);
            }
        }
    },

    _frameForConstraintBox: function(constraintBox){
        return UILayer.FrameForConstraintBoxInBounds(constraintBox, this.model.bounds);
    },

    // -------------------------------------------------------------------------
    // MARK: - Display

    setNeedsDisplay: function(){
        if (this._displayServer !== null){
            this._displayServer.setLayerNeedsDisplay(this);
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
            this._renderInContext(context, false);
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
        this._renderInContext(context, true);
    },

    _renderInContext: function(context, includeSublayers){
        context.drawLayerProperties(this);
        if (this.presentation.hidden) return;
        this._drawInContext(context);
        if (includeSublayers){
            var sublayer;
            var transform;
            for (var i = 0, l = this.sublayers.length; i < l; ++i){
                sublayer = this.sublayers[i];
                context.save();
                transform = sublayer._transformFromSuperlayer();
                context.concatCTM(transform);
                sublayer.renderInContext(context);
                context.restore();
            }
        }
    },

    _isDisplayContext: function(context){
        if (this._displayServer !== null){
            var displayContext = this._displayServer.contextForLayer(this);
            return context === displayContext;
        }
        return false;
    }

});

UILayer.FrameForConstraintBoxInBounds = function(constraintBox, bounds){
    var frame = new JSRect();
    if (constraintBox.height !== undefined){
        frame.size.height = constraintBox.height;
    }else if (constraintBox.top !== undefined && constraintBox.bottom !== undefined){
        frame.size.height = bounds.size.height - constraintBox.top - constraintBox.bottom;
    }else{
        frame.size.height = 0;
        // TODO: get intrinsic height
    }
    if (constraintBox.top !== undefined){
        frame.origin.y = constraintBox.top;
    }else if (constraintBox.bottom !== undefined){
        frame.origin.y = bounds.size.height - frame.size.height - constraintBox.bottom;
    }else{
        frame.origin.y = (bounds.size.height - frame.size.height) / 2.0;
    }
    if (constraintBox.width !== undefined){
        frame.size.width = constraintBox.width;
    }else if (constraintBox.left !== undefined && constraintBox.right !== undefined){
        frame.size.width = bounds.size.width - constraintBox.left - constraintBox.right;
    }else{
        frame.size.width = 0;
        // TODO: get intrinsic width
    }
    if (constraintBox.left !== undefined){
        frame.origin.x = constraintBox.left;
    }else if (constraintBox.right !== undefined){
        frame.origin.x = bounds.size.width - frame.size.width - constraintBox.right;
    }else{
        frame.origin.x = (bounds.size.width - frame.size.width) / 2.0;
    }
    return frame;
};

UILayer.Properties = {
    frame                   : JSRect.Zero,
    bounds                  : JSRect.Zero,
    position                : JSPoint.Zero,
    anchorPoint             : JSPoint.UnitCenter,
    constraintBox           : null,
    transform               : JSAffineTransform.Identity,
    hidden                  : false,
    alpha                   : 1.0,
    backgroundColor         : null,
    backgroundGradient      : null,
    borderWidth             : null,
    borderColor             : null,
    cornerRadius            : null,
    shadowColor             : null,
    shadowOffset            : JSSize.Zero,
    shadowRadius            : 0.0
};

JSContext.definePropertiesFromExtensions({
    drawLayerProperties: function(layer){
        var properties = layer.presentation;
        if (properties.hidden) return;
        var bounds = JSRect(0, 0, properties.bounds.size.width, properties.bounds.size.height);
        this.save();
        this.alpha = properties.alpha;
        if (properties.transform !== JSAffineTransform.Identity){
            this.concatCTM(properties.transform);
        }
        if (properties.shadowColor){
            this.shadowColor = properties.shadowColor;
            this.shadowOffset = properties.shadowOffset;
            this.shadowBlur = properties.shadowRadius;
        }
        if (properties.cornerRadius){
            // TODO: cornerRadius
        }else{
            if (properties.backgroundColor){
                this.fillColor = properties.backgroundColor;
                this.fillRect(properties.bounds);
            }
            if (properties.backgroundGradient){
                this.drawLinearGradient(properties.backgroundGradient, properties.bounds.origin.y, properties.bounds.origin.y + properties.bounds.size.height);
                // TODO: raidal gradients, horizontal linear?
            }
            this.shadowColor = null;
            if (properties.borderWidth){
                this.lineWidth = properties.borderWidth;
                this.lineColor = properties.borderColor;
                this.strokeRect(properties.bounds.rectWithInsets(properties.borderWidth / 2.0));
            }
        }
        this.restore();
    }
});