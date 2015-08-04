// #import "JSKit/JSKit.js"
// #import "UIKit/UIAnimationTransaction.js"
// #import "UIKit/UIBasicAnimation.js"
// #import "UIKit/UIRenderer.js"
/* global JSCustomProperty, JSClass, JSObject, UILayer, UIRenderer, JSRect, JSPoint, JSSize, JSConstraintBox, JSAffineTransform, UIAnimationTransaction, UIBasicAnimation, JSSetDottedName, JSResolveDottedName*/
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
            UIRenderer.defaultRenderer.setLayerNeedsRenderForKeyPath(this, key);
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
    borderRadius:       UILayerAnimatedProperty(),
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
        this.model = Object.create(UILayer.Properties);
        this.presentation = this.model;
    },

    // -------------------------------------------------------------------------
    // MARK: - Size and Layout

    setPosition: function(position){
        this._addImplicitAnimationForKey('position');
        this._addImplicitAnimationForKey('frame');
        this.model.position = position;
        this._updateFrameToPosition();
        UIRenderer.defaultRenderer.setLayerNeedsRenderForKeyPath(this, 'frame');
    },

    setAnchorPoint: function(anchorPoint){
        this._addImplicitAnimationForKey('anchorPoint');
        this._addImplicitAnimationForKey('position');
        this.model.anchorPoint = anchorPoint;
        this._updatePositionToFrameAndAnchorPoint();
    },

    setFrame: function(frame){
        this._addImplicitAnimationForKey('frame');
        this._addImplicitAnimationForKey('position');
        var oldSize = this.model.frame.size;
        this.model.frame = frame;
        this._updatePositionToFrameAndAnchorPoint();
        var id;
        if (!this.constraintBox){
            UIRenderer.defaultRenderer.setLayerNeedsRenderForKeyPath(this, 'frame');
        }
        this._updateSublayersAfterSizeChange(oldSize, frame.size);
    },

    setConstraintBox: function(constraintBox){
        this._addImplicitAnimationForKey('constraintBox');
        this.model.constraintBox = constraintBox;
        UIRenderer.defaultRenderer.setLayerNeedsRenderForKeyPath(this, 'constraintBox');
        this._updateAfterConstraintBoxChange();
    },

    _updateFrameToPosition: function(){
        var position = this.model.position;
        var frame = this.model.frame;
        var point = this.model.anchorPoint;
        this.model.frame = JSRect(position.x - frame.width * point.x, position.y - frame.height * point.y, frame.width, frame.height);
    },

    _updatePositionToFrameAndAnchorPoint: function(){
        var point = this.model.anchorPoint;
        var frame = this.model.frame;
        this.model.position = JSPoint(frame.origin.x + frame.width * point.x, frame.origin.y + frame.height * point.y);
    },

    _updateAfterConstraintBoxChange: function(){
        if (this.superlayer){
            var oldSize = this.model.frame.size;
            this._updateFrameAfterSuperSizeChange(this.superlayer.model.frame.size);
            this._updateSublayersAfterSizeChange(oldSize, this.model.frame.size);
        }
    },

    _updateSublayersAfterSizeChange: function(oldSize, newSize){
        var id;
        var updated = {};
        if (oldSize.width != newSize.width){
            for (id in this._sublayersDependentOnWidth){
                this._sublayersDependentOnWidth[id]._updateFrameAfterSuperSizeChange(newSize);
                updated[id] = true;
            }
        }
        if (oldSize.height != newSize.height){
            for (id in this._sublayersDependentOnHeight){
                if (!(id in updated)){
                    this._sublayersDependentOnHeight[id]._updateFrameAfterSuperSizeChange(newSize);
                }
            }
        }
    },

    _updateFrameAfterSuperSizeChange: function(supersize){
        var dependsOnWidth = false;
        var dependsOnHeight = false;
        if (this.model.constraintBox){
            var box = this.model.constraintBox;
            var frame = JSRect();
            if (box.height !== undefined){
                frame.height = box.height;
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
            this.frame = frame;
            this._updatePositionToFrameAndAnchorPoint();
            UIRenderer.defaultRenderer.setLayerNeedsRenderForKeyPath(this, 'superlayer.frame.size');
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
            sublayer._updateFrameAfterSuperSizeChange(this.frame.size);
        }
        UIRenderer.defaultRenderer.layerInserted(sublayer);
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
            UIRenderer.defaultRenderer.layerRemoved(sublayer);
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
            UIRenderer.defaultRenderer.setLayerNeedsAnimation(this);
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

    setNeedsRedraw: function(){
        UIRenderer.defaultRenderer.setLayerNeedsRedraw(this);
    },

    setNeedsLayout: function(){
        UIRenderer.defaultRenderer.setLayerNeedsLayout(this);
    },

    layout: function(){
        this.layoutSublayers();
    },

    layoutSublayers: function(){
    },

    displayInContext: function(context){
        if (this.hidden) return;
        var bounds = JSRect(0, 0, this.frame.size.width, this.frame.size.height);
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
        if (this.borderRadius){
            // TODO: borderRadius
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
        this.drawInContext(context);
    },

    drawInContext: function(context){
        if (this.delegate && this.delegate.drawLayerInContext){
            this.delegate.drawLayerInContext(this, context);
        }
    },

    renderInContext: function(context){
        if (this.hidden) return;
        this.displayInContext(context);
        var sublayer;
        for (var i = 0, l = this.sublayers.length; i < l; ++i){
            sublayer = this.sublayers[i];
            context.save();
            context.translate(sublayer.frame.origin.x, sublayer.frame.origin.y);
            sublayer.renderInContext(context);
            context.restore();
        }
    }

});

UILayer.Properties = {
    frame                   : JSRect.Zero,
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
    borderRadius            : null,
    shadowColor             : null,
    shadowOffset            : JSSize.Zero,
    shadowRadius            : 0.0
};
