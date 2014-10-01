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
        this.properties = Object.create(UILayer.Properties);
    },

    initWithModelLayer: function(modelLayer){
        this.modelLayer = modelLayer;
        this.properties = Object.create(modelLayer.properties);
        // TODO: sublayers, etc.
        // TODO: protect against updating modelLayer when setting sub-properties of structs (e.g., frame.origin.x)
    },

    // -------------------------------------------------------------------------
    // MARK: - Size and Layout

    setPosition: function(position){
        this.properties.position = position;
        this._updateFrameToPosition();
        UIRenderer.defaultRenderer.setLayerNeedsRenderForKey(this, 'frame');
    },

    'setPosition.x': function(x){
        this.properties.position.x = x;
        this._updateFrameToPosition();
        UIRenderer.defaultRenderer.setLayerNeedsRenderForKey(this, 'frame.origin.x');
    },

    'setPosition.y': function(y){
        this.properties.position.y = y;
        this._updateFrameToPosition();
        UIRenderer.defaultRenderer.setLayerNeedsRenderForKey(this, 'frame.origin.y');
    },

    setAnchorPoint: function(anchorPoint){
        this.properties.anchorPoint = anchorPoint;
        this._updatePositionToFrameAndAnchorPoint();
    },

    'setAnchorPoint.x': function(x){
        this.properties.anchorPoint.x = x;
        this._updatePositionToFrameAndAnchorPoint();
    },

    'setAnchorPoint.y': function(y){
        this.properties.anchorPoint.y = y;
        this._updatePositionToFrameAndAnchorPoint();
    },

    setFrame: function(frame){
        var oldSize = this.properties.frame.size;
        this.properties.frame = frame;
        this._updatePositionToFrameAndAnchorPoint();
        var id;
        if (!this.constraintBox){
            UIRenderer.defaultRenderer.setLayerNeedsRenderForKey(this, 'frame');
        }
        this._updateSublayersAfterSizeChange(oldSize, frame.size);
    },

    _updateFrameToPosition: function(){
        var position = this.properties.position;
        var frame = this.properties.frame;
        var point = this.properties.anchorPoint;
        this.properties.frame = JSRect(position.x - frame.width * point.x, position.y - frame.height * point.y, frame.width, frame.height);
    },

    _updatePositionToFrameAndAnchorPoint: function(){
        var point = this.properties.anchorPoint;
        var frame = this.properties.frame;
        this.properties.position = JSPoint(frame.origin.x + frame.width * point.x, frame.origin.y + frame.height * point.y);
    },

    setConstraintBox: function(constraintBox){
        this.properties.constraintBox = constraintBox;
        UIRenderer.defaultRenderer.setLayerNeedsRenderForKey('constraintBox');
        if (this.superlayer){
            var oldSize = this.properties.frame.size;
            this._updateFrameAfterSuperSizeChange(this.superlayer.properties.frame.size);
            this._updateSublayersAfterSizeChange(oldSize, this.properties.frame.size);
        }
    },

    _updateSublayersAfterSizeChange: function(oldSize, newSize){
        // FIXME: a sublayer could be updated twice if it's in both lists
        var id;
        if (oldSize.width != newSize.width){
            for (id in this._sublayersDependentOnWidth){
                this._sublayersDependentOnWidth[id]._updateFrameAfterSuperSizeChange(newSize);
            }
        }
        if (oldSize.height != newSize.height){
            for (id in this._sublayersDependentOnHeight){
                this._sublayersDependentOnHeight[id]._updateFrameAfterSuperSizeChange(newSize);
            }
        }
    },

    _updateFrameAfterSuperSizeChange: function(supersize){
        var dependsOnWidth = false;
        var dependsOnHeight = false;
        if (this.properties.constraintBox){
            var box = this.properties.constraintBox;
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
                frame.origin.y = this.properties.constraintBox.top;
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
                frame.origin.x = this.properties.constraintBox.left;
            }else if (box.right){
                frame.origin.x = supersize.width - frame.size.width - box.right;
                dependsOnWidth = true;
            }else{
                frame.origin.x = (supersize.width - frame.size.width) / 2.0;
                dependsOnWidth = true;
            }
            this.frame = frame;
            this._updatePositionToFrameAndAnchorPoint();
            UIRenderer.defaultRenderer.setLayerNeedsRenderForKey('superlayer.frame.size');
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
            this.presentationLayer = this.$class.initWithModelLayer(this);
        }
        if (!(key in this.animationsByKey)){
            ++this.animationCount;
        }
        this.animationsByKey[key] = animation;
        if (!UIAnimationTransaction.currentTransaction){
            UIRenderer.defaultRenderer.layerNeedsAnimation(this);
        }
    },

    removeAnimationForKey: function(key){
        --this.animationCount;
        if (this.animationCount === 0){
            this.presentationLayer = null;
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
            animation.fromValue = this.properties[key];
            animation.duration = transaction.duration;
            this.addAnimationForKey(animation, key);
            transaction.addAnimation(animation);
        }
        if (originalSetter){
            originalSetter();
        }else{
            this.properties[key] = value;
            UIRenderer.defaultRenderer.setLayerNeedsRenderForKey(this, key);
        }
    };
    var getter;
    if (key.indexOf('.') >= 0){
        getter = function UILayer_getAnimatableCompoundProperty(){
            return JSResolveDottedName(key, this);
        };
    }else{
        getter = function UILayer_getAnimatableProperty(){
            return this.properties[key];
        };
    }
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
UILayer.defineAnimatedPropertyForKey('frame.origin.x');
UILayer.defineAnimatedPropertyForKey('frame.origin.y');
UILayer.defineAnimatedPropertyForKey('frame.size.width');
UILayer.defineAnimatedPropertyForKey('frame.size.height');
UILayer.defineAnimatedPropertyForKey('position');
UILayer.defineAnimatedPropertyForKey('position.x');
UILayer.defineAnimatedPropertyForKey('position.y');
UILayer.defineAnimatedPropertyForKey('anchorPoint');
UILayer.defineAnimatedPropertyForKey('anchorPoint.x');
UILayer.defineAnimatedPropertyForKey('anchorPoint.y');
UILayer.defineAnimatedPropertyForKey('constraintBox');
UILayer.defineAnimatedPropertyForKey('constraintBox.top');
UILayer.defineAnimatedPropertyForKey('constraintBox.right');
UILayer.defineAnimatedPropertyForKey('constraintBox.bottom');
UILayer.defineAnimatedPropertyForKey('constraintBox.left');
UILayer.defineAnimatedPropertyForKey('constraintBox.width');
UILayer.defineAnimatedPropertyForKey('constraintBox.height');
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
