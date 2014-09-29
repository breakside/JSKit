// #import "JSKit/JSObject.js"

var _UILayerProperties = {
    frame                   : null,     // JSRect
    center                  : null,     // JSPoint
    constraintBox           : null,     // JSConstraintBox
    transform               : JSAffineTransform.Identity,
    hidden                  : false,
    opacity                 : 1.0,
    backgroundColor         : null,     // JSColor
    backgroundGradient      : null,     // JSGradient
    borderWidth             : null,     // float
    borderColor             : null,     // JSColor
    borderRadius            : null,     // float
    shadowColor             : null,     // JSColor
    shadowOffset            : null,     // JSPoint
    shadowRadius            : null      // float
};

JSClass("UILayer", JSObject, {
    properties: null,
    presentationLayer: null,
    superlayer: null,
    sublayers: null,
    level: null,
    animationsByKey: null,

    init: function(){
        this.presentationLayer = this;
        this.sublayers = [];
        this.animationsByKey = {};
        this.properties = Object.create(_UILayerProperties);
    },

    clone: function(){
        var layer = this.$class.init();
        layer.properties.frame = this.properties.frame;
        layer.properties.transform = this.properties.transform;
        layer.properties.hidden = this.properties.hidden;
        layer.properties.opacity = this.properties.opacity;
        layer.properties.backgroundColor = this.properties.backgroundColor;
        layer.properties.backgroundGradient = this.properties.backgroundGradient;
        layer.properties.borderWidth = this.properties.borderWidth;
        layer.properties.borderColor = this.properties.borderColor;
        layer.properties.borderRadius = this.properties.borderRadius;
        layer.properties.shadowColor = this.properties.shadowColor;
        layer.properties.shadowOffset = this.properties.shadowOffset;
        layer.properties.shadowRadius = this.properties.shadowRadius;
        return layer;
    },

    // -------------------------------------------------------------------------
    // MARK: - Size and Layout

    setCenter: function(center){
        var frame = this.properties.frame;
        this.properties.center = center;
        this.properties.frame = JSRect(center.x - frame.width / 2.0, center.y - frame.height / 2.0, frame.width, frame.height);
    },

    setFrame: function(frame){
        this.properties.frame = frame;
        this.properties.center = JSPoint(frame.origin.x + frame.width / 2.0, frame.origin.y + frame.height / 2.0);
        for (var i = 0, l = this.sublayers.length; i < l; ++i){
            this._resizeSublayer(this.sublayers[i], frame);
        }
    },

    setConstraintBox: function(constraintBox){
        this.properties.constraintBox = constraintBox;
        if (this.superview){
            this.superview._resizeSublayer(this, this.superview._frame);
        }
    },

    _resizeSublayer: function(sublayer, superframe){
        if (sublayer.properties.constraintBox){
            var box = sublayer.properties.constraintBox;
            var frame = JSRect();
            if (box.height){
                frame.size.height = box.height;
            }else if (box.top && box.bottom){
                frame.size.height = superframe.size.height - box.top - box.bottom;
            }else{
                frame.size.height = 0;
                // TODO: get intrinsic height
            }
            if (box.top){
                frame.origin.y = sublayer.constraintBox.top;
            }else if (box.bottom){
                frame.origin.y = superframe.size.height - frame.size.height - box.bottom;
            }else{
                frame.origin.y = (superframe.size.height - frame.size.height) / 2.0;
            }
            if (box.width){
                frame.size.width = box.width;
            }else if (box.left && box.right){
                frame.size.width = superframe.size.width - box.left - box.right;
            }else{
                frame.size.width = 0;
                // TODO: get intrinsic width
            }
            if (box.left){
                frame.origin.x = sublayer.constraintBox.left;
            }else if (box.right){
                frame.origin.x = superframe.size.width - frame.size.width - box.right;
            }else{
                frame.origin.x = (superframe.size.width - frame.size.width) / 2.0;
            }
            sublayer.frame = frame;
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
        this.animationsByKey[key] = animation;
    },

    removeAnimationForKey: function(key){
        delete this.animationsByKey[key];
    }
});

UILayer.defineAnimatedPropertyForKey = function(key){
    var setterName = this.nameOfSetMethodForKey(key);
    var setter = function UILayer_setAnimatableProperty(value){
        if (UIRenderer.animationQueue){
            var animation = UIAnimation.initWithKeyPath(key);
            animation.fromValue = this.properties[key];
            animation.toValue = value;
            this.addAnimationForKey(animation, key);
            if (!(this.objectID in UIRenderer.animationQueue)){
                UIRenderer.animationQueue.push(this);
            }
        }
        this.properties[key] = value;
    };
    Object.defineProperty(this.prototype, setterName, {
        configurable: true,
        enumerable: false,
        value: setter
    });
    this.definePropertyForSetter(key, this.prototype[key], setter);
};

