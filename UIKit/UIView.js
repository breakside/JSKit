// #import "JSKit/JSKit.js"
// #import "UIKit/UILayer.js"
// #import "UIKit/UIRenderer.js"
// #import "UIKit/UIAnimation.js"
/* global JSClass, JSObject, UIView, UILayer, JSCustomProperty, JSRect, JSColor, UIRenderer, UIAnimation, UIAnimationTransaction */
'use strict';

function UIViewLayerProperty(){
    if (this === undefined){
        return new UIViewLayerProperty();
    }
}

UIViewLayerProperty.prototype = Object.create(JSCustomProperty.prototype);

UIViewLayerProperty.prototype.define = function(C, key, extensions){
    Object.defineProperty(C.prototype, key, {
        configurable: false,
        enumerable: false,
        set: function UIView_setLayerProperty(value){
            this.layer[key] = value;
        },
        get: function UIView_getLayerProperty(){
            return this.layer[key];
        }
    });
};

JSClass('UIView', JSObject, {

    // -------------------------------------------------------------------------
    // MARK: - Properties

    window:             null,     // UIWindow
    superview:          null,     // UIView
    level:              null,     // int
    subviews:           null,     // Array
    layer:              null,     // UILayer
    frame:              UIViewLayerProperty(),
    position:           UIViewLayerProperty(),
    anchorPoint:        UIViewLayerProperty(),
    constraintBox:      UIViewLayerProperty(),
    transform:          UIViewLayerProperty(),
    hidden:             UIViewLayerProperty(),
    alpha:              UIViewLayerProperty(),
    backgroundColor:    UIViewLayerProperty(),
    backgroundGradient: UIViewLayerProperty(),
    borderWidth:        UIViewLayerProperty(),
    borderColor:        UIViewLayerProperty(),
    borderRadius:       UIViewLayerProperty(),
    shadowColor:        UIViewLayerProperty(),
    shadowOffset:       UIViewLayerProperty(),
    shadowRadius:       UIViewLayerProperty(),

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
        this._initWithFrame(frame);
    },

    _initWithFrame: function(frame){
        this.layer = this.$class.layerClass.init();
        this.layer.delegate = this;
        this.subviews = [];
        this.frame = frame;
        this.backgroundColor = JSColor.whiteColor();
    },

    initWithSpec: function(spec){
        UIView.$super.initWithSpec.call(this, spec);
        var frame;
        if ("frame.margin" in spec){
            frame = JSRectMakeWithMargin.apply(undefined, spec.margin.parseNumberArray());
        }else if ("frame" in spec){
            frame = JSRect.apply(undefined, spec.frame.parseNumberArray());
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
        return this._insertSubviewAtIndex(subview, this.subviews.length, this.layer.sublayers.length);
    },

    insertSubviewAtIndex: function(subview, index){
        var layerIndex;
        if (index < this.subviews.length){
            layerIndex = this.subviews[index].layer.level;
        }else{
            layerIndex = this.layer.sublayers.length;
        }
        this._insertSubviewAtIndex(subview, index, layerIndex);
    },

    insertSubviewBeforeSibling: function(subview, sibling){
        if (sibling.superview !== this){
            throw Error('Cannot insert subview [%s] in view [%s] because sibling view [%s] is not a valid subview.');
        }
        return this._insertSubviewAtIndex(sibling.level, sibling.layer.level);
    },

    insertSubviewAfterSibling: function(subview, sibling){
        if (sibling.superview !== this){
            throw Error('Cannot insert subview [%s] in view [%s] because sibling view [%s] is not a valid subview.');
        }
        return this._insertSubviewAtIndex(sibling.level + 1, sibling.layer.level + 1);
    },

    _insertSubviewAtIndex: function(subview, index, layerIndex){
        var i, l;
        if (subview.superview === this){
            for (i = subview.level + 1, l = this.subviews.length; i < l; ++i){
                this.subviews[i].level -= 1;
            }
            this.subviews.splice(subview.level,1);
            if (index > subview.level){
                --index;
            }
        }else if (subview.superview){
            subview.removeFromSuperview();
        }
        this.subviews.splice(index, 0, subview);
        subview.level = index;
        for (i = subview.level + 1, l = this.subviews.length; i < l; ++i){
            this.subviews[i].level += 1;
        }
        subview.superview = this;
        subview.setWindow(this.window);
        this.layer.insertSublayerAtIndex(subview.layer, layerIndex);
        UIRenderer.defaultRenderer.viewInserted(subview);
        return subview;
    },

    removeSubview: function(subview){
        if (subview.superview === this){
            this.layer.removeSublayer(subview.layer);
            for (var i = subview.level + 1, l = this.subviews.length; i < l; ++i){
                this.subviews[i].level -= 1;
            }
            this.subviews.splice(subview.level,1);
            subview.superview = null;
            subview.setWindow(null);
            subview.level = null;
            UIRenderer.defaultRenderer.viewRemoved(subview);
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

    setNeedsRedraw: function(){
        UIRenderer.defaultRenderer.setLayerNeedsRedraw(this.layer);
    },

    setNeedsLayout: function(){
        UIRenderer.defaultRenderer.setViewNeedsLayout(this);
    },

    layout: function(){
        this.layoutSubviews();
    },

    layoutSubviews: function(){
    },

    // -------------------------------------------------------------------------
    // MARK: - Display

    drawLayerInContext: function(layer, context){
    }

});

UIView.layerClass = UILayer;

UIView.animateWithDuration = function(duration, animations, callback){
    var options = {
        delay: 0,
        duration: duration,
        timingFunction: UIAnimation.linearTimingFunction
    };
    UIView.animateWithOptions(options, animations, callback);
};

UIView.animateWithOptions = function(options, animations, callback){
    var transaction = UIAnimationTransaction.begin();
    transaction.delay = options.delay || 0;
    transaction.duration = options.duration || 0.25;
    transaction.timingFunction = options.timingFunction || UIAnimation.linearTimingFunction;
    transaction.completionFunction = callback;
    if (transaction.duration < 20){
        transaction.duration *= 1000;
    }
    if (transaction.delay < 20){
        transaction.delay *= 1000;
    }
    animations();
    UIAnimationTransaction.commit();
};
