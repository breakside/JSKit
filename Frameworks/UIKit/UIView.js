// #import "Foundation/Foundation.js"
// #import "UIKit/UIResponder.js"
// #import "UIKit/UILayer.js"
// #import "UIKit/UIRenderer.js"
// #import "UIKit/UIAnimation.js"
/* global JSClass, JSObject, UIResponder, UIView, UILayer, UIColor, JSCustomProperty, JSRect, JSPoint, JSConstraintBox, JSColor, UIRenderer, UIAnimation, UIAnimationTransaction, JSReadOnlyProperty */
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

JSClass('UIView', UIResponder, {

    // -------------------------------------------------------------------------
    // MARK: - Properties

    viewController:     null,     // UIViewController
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
    // MARK: - Creating a View

    init: function(){
        this.initWithFrame(JSRect(0,0,100,100));
    },

    initWithConstraintBox: function(constraintBox){
        this._commonViewInit();
        this.frame = JSRect(0, 0, 100, 100);
        this.constraintBox = constraintBox;
    },

    initWithFrame: function(frame){
        this._commonViewInit();
        this.frame = frame;
    },

    initWithSpec: function(spec, values){
        UIView.$super.initWithSpec.call(this, spec, values);
        this._commonViewInit();
        this.frame = JSRect(0, 0, 100, 100);
        this.constraintBox = null;
        if ("constraintBox" in values){
            this.constraintBox = values.constraintBox;
        }else if ("constraintBox.margin" in values){
            this.constraintBox = JSConstraintBox.Margin.apply(undefined, values['constraintBox.margin'].parseNumberArray());
        }else if ("frame" in values){
            this.frame = JSRect.apply(undefined, values.frame.parseNumberArray());
        }
        if ("backgroundColor" in values){
            this.backgroundColor = spec.resolvedValue(values.backgroundColor);
        }
        if ("subviews" in values){
            for (var i = 0, l = values.subviews.length; i < l; ++i){
                var subview = spec.resolvedValue(values.subviews[i]);
                this.addSubview(subview);
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
    },

    // -------------------------------------------------------------------------
    // MARK: - UIResponder

    isFirstResponder: function(){
        return this.window !== null && this.window.firstResponder === this;
    },

    getNextResponder: function(){
        if (this.viewController !== null){
            return this.viewController;
        }
        return this.superview;
    },

    // -------------------------------------------------------------------------
    // MARK: - Coordinate conversion

    convertPointToView: function(point, view){
        return view.convertPointFromView(point, this);
    },

    convertPointFromView: function(point, view){
        if (this.window !== null){
            var windowPoint = this.window.convertPointFromView(point, view);
            return this.window.convertPointToView(windowPoint, this);
        }
        return JSPoint.Zero;
    },

    convertRectToView: function(rect, view){
        // FIXME: what about transform?
        return view.convertRectFromView(rect, this);
    },

    convertRectFromView: function(rect, view){
        // FIXME: what about transform?
        return JSRect(this.convertPointFromView(rect.origin, view), rect.size);
    },

    isPointInsideView: function(point){
        return point.x >= 0 && point.y >= 0 && point.x < this.frame.size.width && point.y < this.frame.size.height;
    },

    hitTest: function(locationInView){
        var subview;
        var locationInSubview;
        for (var i = this.subviews.length - 1; i >= 0; --i){
            locationInSubview = JSPoint(locationInView.x - subview.frame.origin.x, locationInView.y - subview.frame.origin.y);
            if (subview.isPointInsideView(locationInSubview)){
                return subview.hitTest(locationInSubview);
            }
        }
        return this;
    },

    // MARK: - Private Methods

    // MARK: Init helpers

    _commonViewInit: function(){
        this.layer = this.$class.layerClass.init();
        this.layer.delegate = this;
        this.subviews = [];
        this.backgroundColor = JSColor.whiteColor();
    },

    // MARK: Subview management helpers

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
