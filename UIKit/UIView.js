// #import "Foundation/Foundation.js"
// #import "Foundation/CoreTypes.js"
// #import "JSKit/JSObject.js"
// #import "JSKit/JSProtocol.js"
// #import "UIKit/UIView+HTMLRenderer.js" /delay

JSClass('UIView', JSObject, {

    // -------------------------------------------------------------------------
    // MARK: - Properties

    window                  : null,     // UIWindow
    superview               : null,     // UIView
    level                   : null,     // int
    subviews                : null,     // Array
    propertiesNeedingDisplay: null,     // dictionary
    layer                   : null,     // UILayer

    // -------------------------------------------------------------------------
    // MARK: - Initialization

    init: function(){
        this.initWithFrame(JSRect(0,0,100,100));
    },

    initWithConstraintBox: function(constraintBox){
        this.initWithFrame(JSRect(0, 0, 100, 100));
        this.constraintBox = constraintBox;
    },

    initWithFrame: function(frame){
        UIView.$super.init.call(this);
        this._initWithFrame(frame);
    },

    _initWithFrame: function(frame){
        this.layer = this.$class.layerClass.init();
        this.subviews = [];
        this.frame = frame;
        this.backgroundColor = JSColor.whiteColor();
    },

    initWithSpec: function(spec){
        UIView.$super.initWithSpec.call(this, spec);
        var frame;
        if ("frame.margin" in spec){
            frame = JSRectMakeWithMargin.apply(JSRectMakeWithMargin, spec.margin.parseNumberArray());
        }else if ("frame" in spec){
            frame = JSRect.apply(JSGlobalObject, spec.frame.parseNumberArray());
        }else{
            frame = JSRect(0,0,100,100);
        }
        this._initWithFrame(frame);
        if ("subviews" in spec){
            for (var i = 0, l = spec.subviews.length; i < l; ++i){
                this.addSubview(spec.subviews[i]);
            }
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Adding and Removing Subviews

    addSubview: function(subview){
        return this.insertSubviewAtIndex(subview, this.subviews.length);
    },

    insertSubviewAtIndex: function(subview, index){
        var i, l;
        if (subview.superview === this){
            for (i = subview.level + 1, l = this.subviews.length; i < l; ++i){
                this.subviews[i].level -= 1;
            }
            this.subviews.splice(subview.level,1);
            if (index > subview.level){
                --index;
            }
        }
        this.subviews.splice(index, 0, subview);
        subview.level = index;
        for (i = subview.level + 1, l = this.subviews.length; i < l; ++i){
            this.subviews[i].level += 1;
        }
        subview.superview = this;
        subview.setWindow(this.window);
        this._resizeSubview(subview, this._frame);
        this.layer.insertSublayerAtIndex(subview.layer, index);
        UIRenderer.defaultRenderer.viewInserted(subview);
        return subview;
    },

    insertSubviewBeforeSibling: function(subview, sibling){
        if (sibling.superview !== this){
            throw Error('Cannot insert subview [%s] in view [%s] because sibling view [%s] is not a valid subview.');
        }
        return this.insertSubviewAtIndex(sibling.level);
    },

    insertSubviewAfterSibling: function(subview, sibling){
        if (sibling.superview !== this){
            throw Error('Cannot insert subview [%s] in view [%s] because sibling view [%s] is not a valid subview.');
        }
        return this.insertSubviewAtIndex(sibling.level + 1);
    },

    removeSubview: function(subview){
        if (subview.superview === this){
            UIRenderer.defaultRenderer.viewRemoved(subview);
            this.layer.removeSublayer(subview.layer);
            for (var i = subview.level + 1, l = this.subviews.length; i < l; ++i){
                this.subviews[i].level -= 1;
            }
            this.subviews.splice(subview.level,1);
            subview.superview = null;
            subview.setWindow(null);
            subview.level = null;
        }
    },

    removeFromSuperview: function(){
        if (this.superview){
            this.superview.removeSubview(this);
        }
    },

    removeAllSubviews: function(){
        for (var i = 0, l = this.subviews.length; i < l; ++i){
            this.subview.removeFromSuperview();
        }
        this.subviews = [];
    },

    // -------------------------------------------------------------------------
    // MARK: - Window

    setWindow: function(window){
        if (window != this._window){
            this._window = window;
            for (var i = 0, l = this.subviews.length; i < l; ++i){
                this.subviews[i].window = window;
            }
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Display

    setNeedsDisplay: function(){
        if (!(this.objectID in UIView._displayQueue)){
            UIView._displayQueue[this.objectID] = this;
            UIView._requestDisplayFrame();
        }
    },

    displayIfNeeded: function(){
        if (this.objectID in UIView._displayQueue){
            this._display();
            delete UIView._displayQueue[this.objectID];
        }
    },

    _display: function(){
        this.renderer.drawView(this);
        this.propertiesNeedingDisplay = {};
    },

    setNeedsLayout: function(){
        if (!(this.objectID in UIView._layoutQueue)){
            UIView._layoutQueue[this.objectID] = this;
            UIView._requestDisplayFrame();
        }
    },

    layoutIfNeeded: function(){
        if (this.objectID in UIView._layoutQueue){
            this._layout();
            delete UIView._layoutQueue[this.objectID];
        }
    },

    _layout: function(){
        this.layoutSubviews();
    },

    layoutSubviews: function(){
    }

});

UIView.layerClass = UILayer;

UIView.defineLayerPropertyForKey = function(key){
    Object.defineProperty(this.prototype, key, {
        configurable: false,
        enumerable: false,
        set: function UIView_setLayerProperty(value){
            this.layer[key] = value;
        },
        get: function UIView_getLayerProperty(value){
            return this.layer[value];
        }
    });
};

UIView.defineLayerProperty('frame');
UIView.defineLayerProperty('center');
UIView.defineLayerProperty('constraintBox');
UIView.defineLayerProperty('transform');
UIView.defineLayerProperty('hidden');
UIView.defineLayerProperty('opacity');
UIView.defineLayerProperty('backgroundColor');
UIView.defineLayerProperty('backgroundGradient');
UIView.defineLayerProperty('borderWidth');
UIView.defineLayerProperty('borderColor');
UIView.defineLayerProperty('borderRadius');
UIView.defineLayerProperty('shadowColor');
UIView.defineLayerProperty('shadowOffset');
UIView.defineLayerProperty('shadowRadius');

UIView.animateWithDuration = function(duration, animations, callback){
    var options = {
        delay: 0,
        duration: duration,
        timingFunction: UIView.linearTimingFunction
    };
    UIView.animateWithOptions(options, animations, callback);
};

UIView.animateWithOptions = function(options, animations, callback){
    var animation = {
        delay: options.delay || 0,
        duration: options.duration || 0,
        timingFunction: options.timingFunction || UIView.linearTimingFunction,
        callback: callback,
        queue: {}
    };
    // Consider time numbers under 20 to be in seconds, and implicitly convert to milliseconds
    if (animation.duration < 20){
        animation.duration *= 1000;
    }
    if (animation.delay < 20){
        animation.delay *= 1000;
    }
    UIView._currentAnimationQueue = animation.queue;
    animations();
    UIView._currentAnimationQueue = null;
    if (animation.delay){
        JSGlobalObject.setTimeout(function UIView_animateAfterDelay(){
            UIView._animations.push(animation);
            UIView._requestDisplayFrame();
        }, animation.delay);
    }else{
        UIView._animations.push(animation);
        UIView._requestDisplayFrame();
    }
};

UIView.linearTimingFunction = function(t){
    return t;
};

UIView._displayQueue = {};
UIView._displayFrameRequestID = null;
UIView._layoutQueue = {};
UIView._currentAnimationQueue = null;
UIView._animations = [];

UIView._requestDisplayFrame = function(){
    if (UIView._displayFrameRequestID === null){
        UIView._displayFrameRequestID = JSGlobalObject.requestAnimationFrame(UIView._displayFrame);
    }
};

UIView._interpolateValue = function(start, end, t, x){
    if (start === undefined || end === undefined || start === null || end === null){
        return start;
    }
    if (typeof(start) === 'number'){
        return start + (end - start) * x;
    }
    if (start instanceof JSPoint){
        return JSPoint(
            UIView._interpolateValue(start.x, end.x, t, x),
            UIView._interpolateValue(start.y, end.y, t, x)
        );
    }
    if (start instanceof JSSize){
        return JSSize(
            UIView._interpolateValue(start.width, end.width, t, x),
            UIView._interpolateValue(start.height, end.height, t, x)
        );
    }
    if (start instanceof JSRect){
        return JSRect(
            UIView._interpolateValue(start.origin.x, end.origin.x, t, x),
            UIView._interpolateValue(start.origin.y, end.origin.y, t, x),
            UIView._interpolateValue(start.size.width, end.size.width, t, x),
            UIView._interpolateValue(start.size.height, end.size.height, t, x)
        );
    }
    if (start instanceof JSAffineTransform){
        return JSAffineTransform(
            UIView._interpolateValue(start.a, end.a, t, x),
            UIView._interpolateValue(start.b, end.b, t, x),  // FIXME: this probably isn't the right interpolation for rotation/skew
            UIView._interpolateValue(start.c, end.c, t, x),  // FIXME: this probably isn't the right interpolation for rotation/skew
            UIView._interpolateValue(start.d, end.d, t, x),
            UIView._interpolateValue(start.tx, end.tx, t, x),
            UIView._interpolateValue(start.ty, end.ty, t, x)
        );
    }
    if (start instanceof Array){
        if (start.length != end.length){
            return start;
        }
        var result = [];
        for (var i = 0, l = start.length; i < l; ++i){
            result[i] = UIView._interpolateValue(start[i], end[i], t, x);
        }
        return result;
    }
    if (start.isKindOfClass && start.isKindOfClass(JSColor)){
        if (start.colorSpace != end.colorSpace){
            return start;
        }
        return JSColor.initWithSpaceAndComponents(start.colorSpace, UIView._interpolateValue(start.components, end.components, t, x));
    }
    return start;
};

UIView._displayFrame = function(t){
};
