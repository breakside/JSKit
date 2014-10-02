// #import "JSKit/JSObject.js"

JSClass("UILayer", JSObject, {
    properties: null,
    presentationLayer: null,
    modelLayer: null,
    superlayer: null,
    sublayers: null,
    level: null,
    animationsByKey: null,
    animationCount: 0,
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
        this.model.position = position;
        this._updateFrameToPosition();
        UIRenderer.defaultRenderer.setLayerNeedsRenderForKey(this, 'frame');
    },

    setAnchorPoint: function(anchorPoint){
        this.model.anchorPoint = anchorPoint;
        this._updatePositionToFrameAndAnchorPoint();
    },

    setFrame: function(frame){
        var oldSize = this.model.frame.size;
        this.model.frame = frame;
        this._updatePositionToFrameAndAnchorPoint();
        var id;
        if (!this.constraintBox){
            UIRenderer.defaultRenderer.setLayerNeedsRenderForKey(this, 'frame');
        }
        this._updateSublayersAfterSizeChange(oldSize, frame.size);
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

    setConstraintBox: function(constraintBox){
        this.model.constraintBox = constraintBox;
        UIRenderer.defaultRenderer.setLayerNeedsRenderForKey(this, 'constraintBox');
        this._updateAfterConstraintBoxChange();
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
        var updates = {};
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
            if (box.height){
                frame.height = box.height;
            }else if (box.top && box.bottom){
                frame.size.height = supersize.height - box.top - box.bottom;
                dependsOnHeight = true;
            }else{
                frame.size.height = 0;
                // TODO: get intrinsic height
            }
            if (box.top){
                frame.origin.y = this.model.constraintBox.top;
            }else if (box.bottom){
                frame.origin.y = supersize.height - frame.size.height - box.bottom;
                dependsOnHeight = true;
            }else{
                frame.origin.y = (supersize.height - frame.size.height) / 2.0;
                dependsOnHeight = true;
            }
            if (box.width){
                frame.size.width = box.width;
            }else if (box.left && box.right){
                frame.size.width = supersize.width - box.left - box.right;
                dependsOnWidth = true;
            }else{
                frame.size.width = 0;
                // TODO: get intrinsic width
            }
            if (box.left){
                frame.origin.x = this.model.constraintBox.left;
            }else if (box.right){
                frame.origin.x = supersize.width - frame.size.width - box.right;
                dependsOnWidth = true;
            }else{
                frame.origin.x = (supersize.width - frame.size.width) / 2.0;
                dependsOnWidth = true;
            }
            this.frame = frame;
            this._updatePositionToFrameAndAnchorPoint();
            UIRenderer.defaultRenderer.setLayerNeedsRenderForKey(this, 'superlayer.frame.size');
        }else{
            dependsOnHeight = false;
            dependsOnWidth = false;
        }
        if (this.superlayer){
            if (dependsOnWidth){
                if (!(this.objectID in this._sublayersDependentOnWidth)){
                    this._sublayersDependentOnWidth[this.objectID] = sublayer;
                }
            }else{
                if (this.objectID in this._sublayersDependentOnWidth){
                    delete this._sublayersDependentOnWidth[this.objectID];
                }
            }
            if (dependsOnHeight){
                if (!(this.objectID in this._sublayersDependentOnHeight)){
                    this._sublayersDependentOnHeight[this.objectID] = sublayer;
                }
            }else{
                if (this.objectID in this._sublayersDependentOnHeight){
                    delete this._sublayersDependentOnHeight[sublayer.objectID];
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
            // This is a trick ot make our presentation match our model, except in those
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
        }
        this.animationsByKey[key] = animation;
        if (!UIAnimationTransaction.currentTransaction){
            UIRenderer.defaultRenderer.layerNeedsAnimation(this);
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

    // -------------------------------------------------------------------------
    // MARK: - Display

    setNeedsRedraw: function(){
        UIRenderer.defaultRenderer.setLayerNeedsRedraw(this);
    },

    redrawIfNeeded: function(){
        UIRenderer.defaultRenderer.redrawLayerIfNeeded(this);
    },

    drawInContext: function(context){
    },

    setNeedsLayout: function(){
        UIRenderer.defaultRenderer.setLayerNeedsLayout(this);
    },

    layoutIfNeeded: function(){
        UIRenderer.defaultRenderer.layoutLayerIfNeeded(this);
    },

    layout: function(){
        this.layoutSublayers();
    },

    layoutSublayers: function(){
    }

});

UILayer.Properties = {
    frame                   : JSRect.Zero,
    position                : JSPoint.Zero,
    anchorPoint             : JSPoint.UnitCenter,
    constraintBox           : null,
    transform               : JSAffineTransform.Identity,
    hidden                  : false,
    opacity                 : 1.0,
    backgroundColor         : null,
    backgroundGradient      : null,
    borderWidth             : null,
    borderColor             : null,
    borderRadius            : null,
    shadowColor             : null,
    shadowOffset            : JSSize.Zero,
    shadowRadius            : 0.0
};

UILayer.defineAnimatedPropertyForKey = function(key){
    var setterName = this.nameOfSetMethodForKey(key);
    var originalSetter = this.prototype[setterName];
    var setter = function UILayer_setAnimatableProperty(value){
        var transaction = UIAnimationTransaction.currentTransaction;
        if (transaction && !(key in this.animationsByKey)){
            var animation = UIAnimation.initWithKeyPath(key);
            animation.fromValue = this[key];
            animation.duration = transaction.duration;
            this.addAnimationForKey(animation, key);
            transaction.addAnimation(animation);
        }
        if (originalSetter){
            originalSetter();
        }else{
            // Assuming we have an originalSetter for any dotted key, so we can safely use just key here
            this.model[key] = value;
            UIRenderer.defaultRenderer.setLayerNeedsRenderForKey(this, key);
        }
    };
    var getter = function UILayer_getAnimatableProperty(){
        return this.model[key];
    };
    Object.defineProperty(this.prototype, setterName, {
        configurable: true,
        enumerable: false,
        value: setter
    });
    Object.defineProperty(this.prototype, key, {
        configurable: false,
        enumerable: false,
        setter: setter,
        getter: getter
    });
};

UILayer.defineAnimatedPropertyForKey('frame');
UILayer.defineAnimatedPropertyForKey('position');
UILayer.defineAnimatedPropertyForKey('anchorPoint');
UILayer.defineAnimatedPropertyForKey('constraintBox');
UILayer.defineAnimatedPropertyForKey('transform');
UILayer.defineAnimatedPropertyForKey('hidden');
UILayer.defineAnimatedPropertyForKey('opacity');
UILayer.defineAnimatedPropertyForKey('backgroundColor');
UILayer.defineAnimatedPropertyForKey('backgroundGradient');
UILayer.defineAnimatedPropertyForKey('borderWidth');
UILayer.defineAnimatedPropertyForKey('borderColor');
UILayer.defineAnimatedPropertyForKey('borderRadius');
UILayer.defineAnimatedPropertyForKey('shadowColor');
UILayer.defineAnimatedPropertyForKey('shadowOffset');
UILayer.defineAnimatedPropertyForKey('shadowRadius');
