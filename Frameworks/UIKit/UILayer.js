// #import "Foundation/Foundation.js"
// #import "UIKit/UIAnimationTransaction.js"
// #import "UIKit/UIBasicAnimation.js"
// #import "UIKit/UIDisplayServer.js"
// #feature Math.min
// #feature Math.max
/* global JSCustomProperty, JSClass, JSObject, UILayer, UIDisplayServer, JSRect, JSPoint, JSSize, JSConstraintBox, JSAffineTransform, UIAnimationTransaction, UIBasicAnimation, JSSetDottedName, JSResolveDottedName*/
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
            UIDisplayServer.defaultServer.setLayerNeedsDisplayForProperty(this, key);
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
    model:              null,
    presentation:       null,
    superlayer:         null,
    sublayers:          null,
    level:              null,
    animationsByKey:    null,
    animationCount:     0,
    _sublayersDependentOnWidth: null,
    _sublayersDependentOnHeight: null,

    init: function(){
        this.sublayers = [];
        this._sublayersDependentOnWidth = {};
        this._sublayersDependentOnHeight = {};
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
        UIDisplayServer.defaultServer.setLayerNeedsDisplayForProperty(this, 'position');
    },

    setAnchorPoint: function(anchorPoint){
        // When the anchor point changes, the position remains constant and we have to recalculate the frame
        this._addImplicitAnimationForKey('anchorPoint');
        this.model.anchorPoint = anchorPoint;
        this._recalculateFrame();
        UIDisplayServer.defaultServer.setLayerNeedsDisplayForProperty(this, 'anchorPoint');
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
            this._layoutSublayersAfterBoundsChange(oldBounds);
            UIDisplayServer.defaultServer.setLayerNeedsDisplayForProperty(this, 'bounds');
            UIDisplayServer.defaultServer.setLayerNeedsDisplayForProperty(this, 'position');
        }else{
            // When just the origin changes, we only need to update the position, and can
            // do a simple delta offset instead of a full recalculation
            this._addImplicitAnimationForKey('position');
            var dx = frame.origin.x - oldFrame.origin.x;
            var dy = frame.origin.y - oldFrame.origin.y;
            this.model.position.x += dx;
            this.model.position.y += dy;
            UIDisplayServer.defaultServer.setLayerNeedsDisplayForProperty(this, 'position');
        }
    },

    setConstraintBox: function(constraintBox){
        // When the constraint box changes, the frame (and therefore position and bounds) will
        // likely change.  _layoutAfterConstraintBoxChange will make any updates as necessary
        this.model.constraintBox = JSConstraintBox(constraintBox);
        this._layoutAfterConstraintBoxChange();
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
            UIDisplayServer.defaultServer.setLayerNeedsDisplayForProperty(this, 'bounds');
            UIDisplayServer.defaultServer.setLayerNeedsDisplayForProperty(this, 'position');
        }
        this._layoutSublayersAfterBoundsChange(oldBounds);
    },

    setTransform: function(transform){
        // When the transform changes, the frame needs to be recalculated.  The position, however, does
        // not change.  The transform essentially defines a new relationship between the position and frame
        this._addImplicitAnimationForKey('transform');
        this.model.transform = JSAffineTransform(transform);
        this._recalculateFrame();
        UIDisplayServer.defaultServer.setLayerNeedsDisplayForProperty(this, 'transform');
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

    _layoutAfterConstraintBoxChange: function(){
        if (this.superlayer){
            this._layoutAfterSuperSizeChange();
        }
    },

    _layoutSublayersAfterBoundsChange: function(oldBounds){
        // TODO: coordinate with display server about moving layers around
        var id;
        var updated = {};
        if (oldBounds.size.width != this.model.bounds.width){
            for (id in this._sublayersDependentOnWidth){
                this._sublayersDependentOnWidth[id]._layoutAfterSuperSizeChange();
                updated[id] = true;
            }
        }
        if (oldBounds.size.height != this.model.bounds.height){
            for (id in this._sublayersDependentOnHeight){
                if (!(id in updated)){
                    this._sublayersDependentOnHeight[id]._layoutAfterSuperSizeChange();
                }
            }
        }
    },

    _layoutAfterSuperSizeChange: function(size){
        var supersize = this.superlayer === null ? size : this.superlayer.model.bounds.size;
        var dependsOnWidth = false;
        var dependsOnHeight = false;
        if (this.model.constraintBox){
            var box = this.model.constraintBox;
            var frame = JSRect();
            if (box.height !== undefined){
                frame.size.height = box.height;
            }else if (box.top !== undefined && box.bottom !== undefined){
                frame.size.height = supersize.height - box.top - box.bottom;
                dependsOnHeight = true;
            }else{
                frame.size.height = 0;
                // TODO: get intrinsic height
            }
            if (box.top !== undefined){
                frame.origin.y = this.model.constraintBox.top;
            }else if (box.bottom !== undefined){
                frame.origin.y = supersize.height - frame.size.height - box.bottom;
                dependsOnHeight = true;
            }else{
                frame.origin.y = (supersize.height - frame.size.height) / 2.0;
                dependsOnHeight = true;
            }
            if (box.width !== undefined){
                frame.size.width = box.width;
            }else if (box.left !== undefined && box.right !== undefined){
                frame.size.width = supersize.width - box.left - box.right;
                dependsOnWidth = true;
            }else{
                frame.size.width = 0;
                // TODO: get intrinsic width
            }
            if (box.left !== undefined){
                frame.origin.x = this.model.constraintBox.left;
            }else if (box.right !== undefined){
                frame.origin.x = supersize.width - frame.size.width - box.right;
                dependsOnWidth = true;
            }else{
                frame.origin.x = (supersize.width - frame.size.width) / 2.0;
                dependsOnWidth = true;
            }
            this.setFrame(frame);
        }else{
            dependsOnHeight = false;
            dependsOnWidth = false;
        }
        if (this.superlayer){
            if (dependsOnWidth){
                if (!(this.objectID in this.superlayer._sublayersDependentOnWidth)){
                    this.superlayer._sublayersDependentOnWidth[this.objectID] = this;
                }
            }else{
                if (this.objectID in this.superlayer._sublayersDependentOnWidth){
                    delete this.superlayer._sublayersDependentOnWidth[this.objectID];
                }
            }
            if (dependsOnHeight){
                if (!(this.objectID in this.superlayer._sublayersDependentOnHeight)){
                    this.superlayer._sublayersDependentOnHeight[this.objectID] = this;
                }
            }else{
                if (this.objectID in this.superlayer._sublayersDependentOnHeight){
                    delete this.superlayer._sublayersDependentOnHeight[this.objectID];
                }
            }
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
        if (sublayer.constraintBox){
            sublayer._layoutAfterSuperSizeChange();
        }
        UIDisplayServer.defaultServer.layerInserted(sublayer);
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
            UIDisplayServer.defaultServer.layerRemoved(sublayer);
            for (var i = sublayer.level + 1, l = this.sublayers.length; i < l; ++i){
                this.sublayers[i].level -= 1;
            }
            this.sublayers.splice(sublayer.level,1);
            sublayer.superlayer = null;
            sublayer.level = null;
            if (sublayer.objectID in this._sublayersDependentOnWidth){
                delete this._sublayersDependentOnWidth[sublayer.objectID];
            }
            if (sublayer.objectID in this._sublayersDependentOnHeight){
                delete this._sublayersDependentOnHeight[sublayer.objectID];
            }
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
        if (!UIAnimationTransaction.currentTransaction){
            UIDisplayServer.defaultServer.setLayerNeedsAnimation(this);
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
    // MARK: - Display

    setNeedsDisplay: function(){
        UIDisplayServer.defaultServer.setLayerNeedsDisplay(this);
    },

    displayIfNeeded: function(){
        UIDisplayServer.defaultServer.displayLayerIfNeeded(this);
    },

    setNeedsLayout: function(){
        UIDisplayServer.defaultServer.setLayerNeedsLayout(this);
    },

    layout: function(){
        this.layoutSublayers();
    },

    layoutSublayers: function(){
    },

    drawInContext: function(context){
        if (this.delegate && this.delegate.drawLayerInContext){
            this.delegate.drawLayerInContext(this, context);
        }
    },

    renderInContext: function(context){
        if (this.hidden) return;
        this.drawBasePropertiesInContext(context);
        this.drawInContext(context);
        var sublayer;
        for (var i = 0, l = this.sublayers.length; i < l; ++i){
            sublayer = this.sublayers[i];
            context.save();
            context.translate(sublayer.frame.origin.x, sublayer.frame.origin.y);
            context.concatCTM(sublayer.transform);
            sublayer.renderInContext(context);
            context.restore();
        }
    },

    drawBasePropertiesInContext: function(context){
        if (this.hidden) return;
        var bounds = JSRect(0, 0, this.bounds.size.width, this.bounds.size.height);
        context.save();
        context.alpha = this.alpha;
        if (this.transform !== JSAffineTransform.Identity){
            context.concatCTM(this.transform);
        }
        if (this.shadowColor){
            context.shadowColor = this.shadowColor;
            context.shadowOffset = this.shadowOffset;
            context.shadowBlur = this.shadowRadius;
        }
        if (this.cornerRadius){
            // TODO: cornerRadius
        }else{
            if (this.backgroundColor){
                context.fillColor = this.backgroundColor;
                context.fillRect(this.bounds);
            }
            if (this.backgroundGradient){
                context.drawLinearGradient(this.backgroundGradient, this.bounds.origin.y, this.bounds.origin.y + this.bounds.size.height);
                // TODO: raidal gradients, horizontal linear?
            }
            context.shadowColor = null;
            if (this.borderWidth){
                context.lineWidth = this.borderWidth;
                context.lineColor = this.borderColor;
                context.strokeRect(this.bounds.rectWithInsets(this.borderWidth / 2.0));
            }
        }
        context.restore();
    },

});

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
