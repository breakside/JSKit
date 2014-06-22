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
    shadowRadius            : null,     // float

    renderer                : null,     // implements UIView.RendererProtocol
    propertiesNeedingDisplay: null,     // dictionary

    _animationValues        : null,

    // -------------------------------------------------------------------------
    // MARK: - Initialization

    init: function(){
        this.initWithFrame(JSRect(0,0,100,100));
    },

    initWithFrame: function(frame){
        UIView.$super.init.call(this);
        this._initWithFrame(frame);
    },

    _initWithFrame: function(frame){
        this._animationValues = {};
        this.renderer = this._getRenderer();
        this.propertiesNeedingDisplay = {};
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

    _getRenderer: function(){
        if (this.rendererClass){
            return this.rendererClass.init();
        }
        throw Error("No '%' renderer class defined for class: %s".sprintf(UIViewRenderingEnvironment, this.$class));
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
        this.renderer.viewDidAddSubview(this, subview);
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
            for (var i = subview.level + 1, l = this.subviews.length; i < l; ++i){
                this.subviews[i].level -= 1;
            }
            this.renderer.viewDidRemoveSubview(this, subview);
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
    // MARK: - Size and Layout

    setHidden: function(hidden){
        this._hidden = hidden;
        this._setNeedsPropertyDisplay('hidden');
    },

    setCenter: function(center){
        this._center = center;
        var frame = this.frame;
        this.frame = JSRect(center.x - frame.width / 2.0, center.y - frame.height / 2.0, frame.width, frame.height);
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
        }
    },

    layoutIfNeeded: function(){
        if (this.objectID in UIView._layoutQueue){
            this.layoutSubviews();
            delete UIView._layoutQueue[this.objectID];
        }
    },

    layoutSubviews: function(){
    },

    _setNeedsPropertyDisplay: function(property){
        this.propertiesNeedingDisplay[property] = true;
        this.setNeedsDisplay();
    },

    _setAnimationValueForKey: function(key, value){
        if (key in this._animationValues){
            this._animationValues[key].value = value;
            this._setNeedsPropertyDisplay(key);
        }
    },

    _clearAnimationValueForKey: function(key){
        if (key in this._animationValues){
            delete this._animationValues[key];
            this._setNeedsPropertyDisplay(key);
        }
    },

    rendererValueForKey: function(key){
        if (key in this._animationValues){
            return this._animationValues[key].value;
        }
        return this[key];
    }

});

UIView.RenderProtocol = JSProtocol.$extend({

    viewCanStartReceivingEvents:    ['view'],
    viewDidAddSubview:              ['view', 'subview'],
    viewDidRemoveSubview:           ['view', 'subview'],
    drawView:                       ['view']

});

UIView.registerRenderer = function(rendererClass){
    if (rendererClass.matchesCurrentEnvironment()){
        this.prototype.rendererClass = rendererClass;
    }
};

UIView.defineAnimatableProperty = function(key){
    var setterName = this.nameOfSetMethodForKey(key);
    var silentKey = this.nameOfSilentPropertyForKey(key);
    var setter = function UIView_setAnimatableProperty(value){
        if (UIView._currentAnimationQueue !== null){
            var queue = UIView._currentAnimationQueue;
            if (!(this.objectID in queue)){
                queue[this.objectID] = {
                    view: this,
                    properties: {}
                };
            }
            var properties = queue[this.objectID].properties;
            if (!(key in properties)){
                properties[key] = {
                    start: this[key],
                    value: this[key]
                };
            }
            this._animationValues[key] = properties[key];
        }
        this[silentKey] = value;
        if (key in this._animationValues){
            this._animationValues[key].end = value;
        }
        this._setNeedsPropertyDisplay(key);
    };
    Object.defineProperty(this.prototype, setterName, {
        configurable: true,
        enumerable: false,
        value: setter
    });
    this.definePropertyForSetter(key, this.prototype[key], setter);
};

UIView.defineAnimatableProperty('frame');
UIView.defineAnimatableProperty('transform');
UIView.defineAnimatableProperty('opacity');
UIView.defineAnimatableProperty('backgroundColor');
UIView.defineAnimatableProperty('borderWidth');
UIView.defineAnimatableProperty('borderColor');
UIView.defineAnimatableProperty('borderRadius');
UIView.defineAnimatableProperty('shadowOffset');
UIView.defineAnimatableProperty('shadowColor');
UIView.defineAnimatableProperty('shadowRadius');

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
    // Start by updating any animations
    var animation;
    var callbacks = [];
    var i, l;
    var id, key;
    // We'll count backwards here because we might remove elements from the array while looping.
    // Couting backwards ensures the removal won't mess up the iteration
    for (i = UIView._animations.length - 1; i >= 0; --i){
        animation = UIView._animations[i];
        if (!animation.t0){
            animation.t0 = t;
        }
        animation.timeProgress = Math.max(0, Math.min(1, (t - animation.t0) / animation.duration));
        animation.progress = animation.timingFunction(animation.timeProgress);
        var entry;
        var property;
        if (animation.timeProgress >= 1){
            for (id in animation.queue){
                entry = animation.queue[id];
                for (key in entry.properties){
                    property = entry.properties[key];
                    entry.view._clearAnimationValueForKey(key);
                }
            }
            var index = UIView._animations.indexOf(animation);
            if (index >= 0){
                UIView._animations.splice(index, 1);
            }
            if (animation.callback){
                callbacks.push(animation.callback);
            }
        }else{
            for (id in animation.queue){
                entry = animation.queue[id];
                for (key in entry.properties){
                    property = entry.properties[key];
                    entry.view._setAnimationValueForKey(key, UIView._interpolateValue(property.start, property.end, animation.timeProgress, animation.progress));
                }
            }
        }
    }

    // Then flush the display queue
    for (id in UIView._displayQueue){
        UIView._displayQueue[id]._display();
    }
    UIView._displayQueue = {};

    // Request a new frame if still animating
    UIView._displayFrameRequestID = null;
    if (UIView._animations.length > 0){
        UIView._requestDisplayFrame();
    }

    // Call any animation callbacks
    for (i = 0, l = callbacks.length; i < l; ++i){
        callbacks[i]();
    }
};
