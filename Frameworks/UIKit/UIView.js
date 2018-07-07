// #import "Foundation/Foundation.js"
// #import "UIKit/UIResponder.js"
// #import "UIKit/UILayer.js"
// #import "UIKit/UIAnimation.js"
// #import "UIKit/UIDraggingDestination.js"
// #import "UIKit/UILayoutConstraint.js"
/* global JSGlobalObject, JSClass, JSObject, JSCopy, JSInsets, JSSize, UIViewLayerProperty, UIResponder, UIView, UILayer, UIColor, JSCustomProperty, JSDynamicProperty, JSRect, JSPoint, JSColor, UIAnimation, UIAnimationTransaction, JSReadOnlyProperty, UIWindowServer, UIDragOperation, UILayoutConstraint, UILayoutAttribute, UILayoutRelation */
'use strict';

JSGlobalObject.UIViewLayerProperty = function(){
    if (this === undefined){
        return new UIViewLayerProperty();
    }
};

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
    // MARK: - Creating a View

    init: function(){
        this.initWithFrame(JSRect(0,0,100,100));
    },

    initWithLayer: function(layer){
        this._commonViewInitWithLayer(layer);
        this.frame = JSRect(0,0,100,100);
    },

    initWithFrame: function(frame){
        this._commonViewInit();
        this.frame = frame;
    },

    initWithSpec: function(spec, values){
        UIView.$super.initWithSpec.call(this, spec, values);
        this._commonViewInit();
        if ("frame" in values){
            this.frame = JSRect.apply(undefined, values.frame.parseNumberArray());
        }else{
            this.frame = JSRect(0, 0, 100, 100);
        }
        if ("backgroundColor" in values){
            this.backgroundColor = spec.resolvedValue(values.backgroundColor, "JSColor");
        }
        if ("backgroundGradient" in values){
            this.backgroundGradient = spec.resolvedValue(values.backgroundGradient, "JSGradient");
        }
        if ("borderColor" in values){
            this.borderColor = spec.resolvedValue(values.borderColor, "JSColor");
        }
        if ("borderWidth" in values){
            this.borderWidth = spec.resolvedValue(values.borderWidth);
        }
        if ("shadowColor" in values){
            this.shadowColor = spec.resolvedValue(values.shadowColor, "JSColor");
        }
        if ("shadowRadius" in values){
            this.shadowRadius = spec.resolvedValue(values.shadowRadius);
        }
        if ("shadowOffset" in values){
            this.shadowOffset = JSPoint.apply(undefined, values.shadowOffset.parseNumberArray());
        }
        if ("maskedBorders" in values){
            this.maskedBorders = spec.resolvedValue(values.maskedBorders);
        }
        if ("cornerRadius" in values){
            this.cornerRadius = spec.resolvedValue(values.cornerRadius);
        }
        if ("maskedCorners" in values){
            this.maskedCorners = spec.resolvedValue(values.maskedCorners);
        }
        if ("tooltip" in values){
            this.tooltip = spec.resolvedValue(values.tooltip);
        }
        if ("nextKeyView" in values){
            this.nextKeyView = spec.resolvedValue(values.nextKeyView);
        }
        var i, l;
        if ("subviews" in values){
            for (i = 0, l = values.subviews.length; i < l; ++i){
                var subview = spec.resolvedValue(values.subviews[i], "UIView");
                this.addSubview(subview);
            }
        }
        if ("constraints" in values){
            for (i = 0, l = values.constraints.length; i < l; ++i){
                if (values.constraints[i].firstItem == '<self>'){
                    values.constraints[i].firstItem = this;
                }
                if (values.constraints[i].secondItem == '<self>'){
                    values.constraints[i].secondItem = this;
                }
                var constraint = spec.resolvedValue(values.constraints[i], "UILayoutConstraint");
                this.addConstraint(constraint);
            }
        }else{
            if ("width" in values){
                this.addConstraint(UILayoutConstraint.initWithOptions({
                    firstItem: this,
                    firstAttribute: UILayoutAttribute.width,
                    constant: spec.resolvedValue(values.width), 
                }));
            }
            if ("height" in values){
                this.addConstraint(UILayoutConstraint.initWithOptions({
                    firstItem: this,
                    firstAttribute: UILayoutAttribute.height,
                    constant: spec.resolvedValue(values.height), 
                }));
            }
        }
    },

    _commonViewInit: function(){
        var layer = this.$class.layerClass.init();
        this._commonViewInitWithLayer(layer);
    },

    _commonViewInitWithLayer: function(layer){
        this.layer = layer;
        this.layer.delegate = this;
        this.subviews = [];
        this._registeredDraggedTypes = [];
        this._constraints = [];
    },

    // -------------------------------------------------------------------------
    // MARK: - Styling

    alpha: UIViewLayerProperty(),
    backgroundColor: UIViewLayerProperty(),
    backgroundGradient: UIViewLayerProperty(),
    borderWidth: UIViewLayerProperty(),
    borderColor: UIViewLayerProperty(),
    maskedBorders: UIViewLayerProperty(),
    cornerRadius: UIViewLayerProperty(),
    maskedCorners: UIViewLayerProperty(),
    shadowColor: UIViewLayerProperty(),
    shadowOffset: UIViewLayerProperty(),
    shadowRadius: UIViewLayerProperty(),
    cursor: JSDynamicProperty('_cursor', null),
    tooltip: null,

    // -------------------------------------------------------------------------
    // MARK: - Underlying Layer

    layer: null,

    // -------------------------------------------------------------------------
    // MARK: - Superview

    superview: null,
    subviewIndex: null,

    // -------------------------------------------------------------------------
    // MARK: - Adding and Removing Subviews

    subviews: null,

    addSubview: function(subview){
        return this._insertSubviewAtIndex(subview, this.subviews.length, this.layer.sublayers.length);
    },

    insertSubviewAtIndex: function(subview, index){
        var layerIndex;
        if (index < this.subviews.length){
            layerIndex = this.subviews[index].layer.sublayerIndex;
        }else{
            layerIndex = this.layer.sublayers.length;
        }
        this._insertSubviewAtIndex(subview, index, layerIndex);
    },

    insertSubviewBeforeSibling: function(subview, sibling){
        if (sibling.superview !== this){
            throw Error('Cannot insert subview [%s] in view [%s] because sibling view [%s] is not a valid subview.');
        }
        return this._insertSubviewAtIndex(subview, sibling.subviewIndex, sibling.layer.sublayerIndex);
    },

    insertSubviewAfterSibling: function(subview, sibling){
        if (sibling.superview !== this){
            throw Error('Cannot insert subview [%s] in view [%s] because sibling view [%s] is not a valid subview.');
        }
        return this._insertSubviewAtIndex(subview, sibling.subviewIndex + 1, sibling.layer.sublayerIndex + 1);
    },

    removeSubview: function(subview){
        if (subview.superview === this){
            this.layer.removeSublayer(subview.layer);
            for (var i = subview.subviewIndex + 1, l = this.subviews.length; i < l; ++i){
                this.subviews[i].subviewIndex -= 1;
            }
            this.subviews.splice(subview.subviewIndex,1);
            subview.superview = null;
            subview.setWindow(null);
            subview.subviewIndex = null;
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

    _insertSubviewAtIndex: function(subview, index, layerIndex){
        var i, l;
        if (subview.superview === this){
            for (i = subview.subviewIndex + 1, l = this.subviews.length; i < l; ++i){
                this.subviews[i].subviewIndex -= 1;
            }
            this.subviews.splice(subview.subviewIndex,1);
            if (index > subview.subviewIndex){
                --index;
            }
        }else if (subview.superview){
            subview.removeFromSuperview();
        }
        this.subviews.splice(index, 0, subview);
        subview.subviewIndex = index;
        for (i = subview.subviewIndex + 1, l = this.subviews.length; i < l; ++i){
            this.subviews[i].subviewIndex += 1;
        }
        subview.superview = this;
        subview.setWindow(this.window);
        this.layer.insertSublayerAtIndex(subview.layer, layerIndex);
        return subview;
    },

    // -------------------------------------------------------------------------
    // MARK: - Window

    window: JSDynamicProperty('_window', null),
    nextKeyView: null,

    setWindow: function(window){
        if (window != this._window){
            var lastWindowServer = null;
            var newWindowServer = null;
            if (this._window !== null){
                lastWindowServer = this._window.windowServer;
            }
            if (window !== null){
                newWindowServer = window.windowServer;
            }
            if (lastWindowServer !== newWindowServer){
                if (this.cursor !== null){
                    if (lastWindowServer !== null){
                        lastWindowServer.viewDidChangeCursor(this, null);
                    }
                    if (newWindowServer !== null){
                        newWindowServer.viewDidChangeCursor(this, this.cursor);
                    }
                }
                if (this.mouseTrackingType !== UIView.MouseTracking.none){
                    if (lastWindowServer !== null){
                        lastWindowServer.viewDidChangeMouseTracking(this, UIView.MouseTracking.none);
                    }
                    if (newWindowServer !== null){
                        newWindowServer.viewDidChangeMouseTracking(this, this.mouseTrackingType);
                    }
                }
            }
            this._window = window;
            for (var i = 0, l = this.subviews.length; i < l; ++i){
                this.subviews[i].window = window;
            }
        }
    },

    getWindow: function(){
        return this._window;
    },

    setCursor: function(cursor){
        this._cursor = cursor;
        if (this.window !== null && this.window.windowServer !== null){
            this.window.windowServer.viewDidChangeCursor(this, this.cursor);
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - View Controller

    viewController: null,

    // -------------------------------------------------------------------------
    // MARK: - Layout

    frame: UIViewLayerProperty(),
    bounds: UIViewLayerProperty(),
    position: UIViewLayerProperty(),
    anchorPoint: UIViewLayerProperty(),
    transform: UIViewLayerProperty(),
    hidden: UIViewLayerProperty(),
    clipsToBounds: UIViewLayerProperty(),

    setNeedsLayout: function(){
        this.layer.setNeedsLayout();
    },

    layoutIfNeeded: function(){
        this.layer.layoutIfNeeded();
    },

    layoutSubviews: function(){
        this.layer.layoutSublayers();
        this._satisfyConstraints();
    },

    _layoutSubviewsAndNotify: function(){
        this.layoutSubviews();
        if (this.viewController){
            this.viewController.viewDidLayoutSubviews();
        }
    },

    layoutSublayersOfLayer: function(layer){
        this._updateConstraints();
        this._layoutSubviewsAndNotify();
    },

    sizeToFit: function(){
        this.layer.sizeToFit();
    },

    sizeToFitSize: function(maxSize){
        this.layer.sizeToFitSize(maxSize);
    },

    firstBaselineOffsetFromTop: JSReadOnlyProperty(),
    lastBaselineOffsetFromBottom: JSReadOnlyProperty(),
    intrinsicSize: JSReadOnlyProperty(),

    getFirstBaselineOffsetFromTop: function(){
        return 0;
    },

    getLastBaselineOffsetFromBottom: function(){
        return 0;
    },

    getIntrinsicSize: function(){
        return JSSize(UIView.noIntrinsicSize, UIView.noIntrinsicSize);
    },

    invalidateIntrinsicSize: function(){
        this._needsIntrinsicSizeConstraintUpdate = true;
    },

    // -------------------------------------------------------------------------
    // MARK: - Constraints

    constraints: JSReadOnlyProperty('_constraints', null),

    contentHuggingPriority: UILayoutPriority.defaultLow,
    contentCompressionResistancePriority: UILayoutPriority.defaultHigh,

    addConstraint: function(constraint){
        this._constraints.push(constraint);
        this.setNeedsLayout();
    },

    removeConstraint: function(constraint){
        var index = this._constraints.indexOf(constraint);
        if (index >= 0){
            this._constraints.splice(index, 1);
            this.setNeedsLayout();
        }
    },

    constrainedSize: JSReadOnlyProperty(),

    layoutFittingSize: function(size){
    },

    _intrinsicWidthHuggingConstraint: null,
    _intrinsicWidthResistConstraint: null,
    _intrinsicHeightHuggingConstraint: null,
    _intrinsicHeightResistConstraint: null,

    _needsIntrinsicSizeConstraintUpdate: true,

    _updateConstraints: function(){
        if (this._needsIntrinsicSizeConstraintUpdate){
            this._updateIntrinsicSizeConstraints();
            this._needsIntrinsicSizeConstraintUpdate = false;
        }
    },

    _updateIntrinsicSizeConstraints: function(){
        var intrinsicSize = this.intrinsicSize;
        if (intrinsicSize.width != UIView.noIntrinsicSize){
            if (this._intrinsicWidthHuggingConstraint){
                this._intrinsicWidthHuggingConstraint.constant = intrinsicSize.width;
            }else{
                this._intrinsicWidthHuggingConstraint = UILayoutConstraint.initWithOptions({
                    firstItem: this,
                    firstAttribute: UILayoutAttribute.width,
                    relation: UILayoutRelation.lessThanOrEqual,
                    priority: this.contentHuggingPriority,
                    constant: intrinsicSize.width
                });
                this._intrinsicWidthHuggingConstraint.active = true;
            }
            if (this._intrinsicWidthResistConstraint){
                this._intrinsicWidthResistConstraint.constant = intrinsicSize.width;
            }else{
                this._intrinsicWidthResistConstraint = UILayoutConstraint.initWithOptions({
                    firstItem: this,
                    firstAttribute: UILayoutAttribute.width,
                    relation: UILayoutRelation.greaterThanOrEqual,
                    priority: this.contentCompressionResistancePriority,
                    constant: intrinsicSize.width
                });
                this._intrinsicWidthResistConstraint.active = true;
            }
        }else{
            if (this._intrinsicWidthHuggingConstraint){
                this._intrinsicWidthHuggingConstraint.active = false;
                this._intrinsicWidthHuggingConstraint = null;
            }
            if (this._intrinsicWidthResistConstraint){
                this._intrinsicWidthResistConstraint.active = false;
                this._intrinsicWidthResistConstraint = null;
            }
        }
        if (intrinsicSize.height != UIView.noIntrinsicSize){
            if (this._intrinsicHeightHuggingConstraint){
                this._intrinsicHeightHuggingConstraint.constant = intrinsicSize.height;
            }else{
                this._intrinsicHeightHuggingConstraint = UILayoutConstraint.initWithOptions({
                    firstItem: this,
                    firstAttribute: UILayoutAttribute.height,
                    relation: UILayoutRelation.lessThanOrEqual,
                    priority: this.contentHuggingPriority,
                    constant: intrinsicSize.height
                });
                this._intrinsicHeightHuggingConstraint.active = true;
            }
            if (this._intrinsicHeightResistConstraint){
                this._intrinsicHeightResistConstraint.constant = intrinsicSize.height;
            }else{
                this._intrinsicHeightResistConstraint = UILayoutConstraint.initWithOptions({
                    firstItem: this,
                    firstAttribute: UILayoutAttribute.height,
                    relation: UILayoutRelation.greaterThanOrEqual,
                    priority: this.contentCompressionResistancePriority,
                    constant: intrinsicSize.height
                });
                this._intrinsicHeightResistConstraint.active = true;
            }
        }else{
            if (this._intrinsicHeightHuggingConstraint){
                this._intrinsicHeightHuggingConstraint.active = false;
                this._intrinsicHeightHuggingConstraint = null;
            }
            if (this._intrinsicHeightResistConstraint){
                this._intrinsicHeightResistConstraint.active = false;
                this._intrinsicHeightResistConstraint = null;
            }
        }
    },

    _satisfyConstraints: function(){
    },

    _getValueForLayoutAttribute: function(attribute){
        switch (attribute){
            case UILayoutAttribute.left:
                return this.bounds.origin.x;
            case UILayoutAttribute.right:
                return this.bounds.origin.x + this.bounds.size.width;
            case UILayoutAttribute.top:
                return this.bounds.origin.y;
            case UILayoutAttribute.bottom:
                return this.bounds.origin.y + this.bounds.size.height;
            case UILayoutAttribute.width:
                return this.bounds.size.width;
            case UILayoutAttribute.height:
                return this.bounds.size.height;
            case UILayoutAttribute.centerX:
                return this.bounds.origin.x + this.bounds.size.width / 2;
            case UILayoutAttribute.centerY:
                return this.bounds.origin.y + this.bounds.size.height / 2;
            case UILayoutAttribute.lastBaseline:
                return this.bounds.origin.y + this.bounds.size.height - this.lastBaselineOffsetFromBottom;
            case UILayoutAttribute.firstBaseline:
                return this.bounds.origin.y + this.firstBaselineOffsetFromTop;
        }
        return 0;
    },

    // -------------------------------------------------------------------------
    // MARK: - Display

    setNeedsDisplay: function(){
        this.layer.setNeedsDisplay();
    },

    // -------------------------------------------------------------------------
    // MARK: - Responder & Mouse Tracking

    mouseTrackingType: 0,
    isMultipleTouchEnabled: false,

    isFirstResponder: function(){
        return this.window !== null && this.window.firstResponder === this;
    },

    getNextResponder: function(){
        if (this.viewController !== null){
            return this.viewController;
        }
        return this.superview;
    },

    startMouseTracking: function(trackingType){
        this.mouseTrackingType = trackingType;
        if (this.window !== null){
            var windowServer = this.window.windowServer;
            windowServer.viewDidChangeMouseTracking(this, this.mouseTrackingType);
        }
    },

    stopMouseTracking: function(){
        this.mouseTrackingType = UIView.MouseTracking.none;
        if (this.window !== null){
            var windowServer = this.window.windowServer;
            windowServer.viewDidChangeMouseTracking(this, this.mouseTrackingType);
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Drag & Drop Source

    beginDraggingSessionWithItems: function(items, event){
        if (this.window === null){
            return;
        }
        return this.window.windowServer.createDraggingSessionWithItems(items, event, this);
    },

    draggingSessionEnded: function(session, operation){

    },

    // -------------------------------------------------------------------------
    // MARK: - Drag & Drop Destination

    registerForDraggedTypes: function(pasteboardTypes){
        for (var i = 0, l = pasteboardTypes.length; i < l; ++i){
            this._registeredDraggedTypes.push(pasteboardTypes[i]);
        }
    },

    unregisterDraggedTypes: function(){
        this._registeredDraggedTypes = [];
    },

    registeredDraggedTypes: JSDynamicProperty('_registeredDraggedTypes', null),

    draggingEntered: function(){
        return UIDragOperation.none;
    },

    draggingUpdated: function(){
        return UIDragOperation.none;
    },

    draggingExited: function(){
    },

    performDragOperation: function(){
    },

    // -------------------------------------------------------------------------
    // MARK: - Coordinate conversion

    convertPointToView: function(point, view){
        if (view !== null && view.window === this.window){
            return this.layer.convertPointToLayer(point, view.layer);
        }
        if (this.window !== null){
            var ourWindowPoint = this.layer.convertPointToLayer(point, this.window.layer);
            var screenPoint = this.window.convertPointToScreen(ourWindowPoint);
            if (view !== null){
                if (view.window !== null){
                    var otherWindowPoint = view.window.convertPointFromScreen(screenPoint);
                    return view.window.layer.convertPointToLayer(otherWindowPoint, view.layer);
                }
                return null;
            }
            return screenPoint;
        }
        return null;
    },

    convertPointFromView: function(point, view){
        return view.convertPointToView(point, this);
    },

    convertRectToView: function(rect, view){
        if (view.window === this.window){
            return this.layer.convertRectToLayer(rect, view.layer);
        }
    },

    convertRectFromView: function(rect, view){
        return view.convertRectToView(rect, this);
    },

    convertPointFromScreen: function(point){
        if (this.window === null){
            return null;
        }
        var p = this.window.convertPointFromScreen(point);
        if (p === null){
            return null;
        }
        return this.convertPointFromView(p, this.window);
    },

    convertPointToScreen: function(point){
        if (this.window === null){
            return null;
        }
        return this.window.convertPointToScreen(this.convertPointToView(point, this.window));
    },

    convertRectFromScreen: function(rect){
        if (this.window === null){
            return null;
        }
        var r = this.window.convertRectFromScreen(rect);
        if (r === null){
            return null;
        }
        return this.convertRectFromView(r, this.window);
    },

    convertRectToScreen: function(rect){
        if (this.window === null){
            return null;
        }
        return this.window.convertRectToScreen(this.convertRectToView(rect, this.window));
    },

    // -------------------------------------------------------------------------
    // MARK: - Hit Testing

    containsPoint: function(point){
        return this.layer.containsPoint(point);
    },

    hitTest: function(locationInView){
        var subview;
        var locationInSubview;
        var hit = null;
        for (var i = this.subviews.length - 1; i >= 0 && hit === null; --i){
            subview = this.subviews[i];
            locationInSubview = this.layer.convertPointToLayer(locationInView, subview.layer);
            if (!subview.hidden && subview.layer.presentation.alpha > 0 && (!subview.clipsToBounds || subview.containsPoint(locationInSubview))){
                hit  = subview.hitTest(locationInSubview);
            }
        }
        if (hit === null && this.containsPoint(locationInView)){
            hit = this;
        }
        return hit;
    },

    // -------------------------------------------------------------------------
    // MARK: - Restoration

    restorationIdentifier: null,

});

UIView.MouseTracking = {
    none: 0,
    move: 1,
    enterAndExit: 2,
    all: 3
};

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
    animations();
    UIAnimationTransaction.commit();
};

UIView.noIntrinsicSize = -1;
