// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #import Foundation
// #import "UIResponder.js"
// #import "UILayer.js"
// #import "UIAnimation.js"
// #import "UIDraggingDestination.js"
// #import "UILayoutConstraint.js"
// #import "UITraitCollection.js"
// #import "UICursor.js"
// #import "UIAccessibility.js"
// #import "UIMouseTrackingArea.js"
// #import "UIVisualEffect.js"
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

    initWithFrame: function(frame){
        this._commonLayerInit();
        this.frame = frame;
    },

    initWithSpec: function(spec){
        UIView.$super.initWithSpec.call(this, spec);
        this._commonLayerInit();
        if (spec.containsKey("frame")){
            this.frame = spec.valueForKey("frame", JSRect);
        }else{
            this.frame = JSRect(0, 0, 100, 100);
        }
        if (spec.containsKey("backgroundColor")){
            this.backgroundColor = spec.valueForKey("backgroundColor", JSColor);
        }
        if (spec.containsKey("backgroundGradient")){
            this.backgroundGradient = spec.valueForKey("backgroundGradient", JSGradient);
        }
        if (spec.containsKey("backgroundVisualEffect")){
            this.backgroundVisualEffect = spec.valueForKey("backgroundVisualEffect", UIVisualEffect);
        }
        if (spec.containsKey("borderColor")){
            this.borderColor = spec.valueForKey("borderColor", JSColor);
        }
        if (spec.containsKey("borderWidth")){
            this.borderWidth = spec.valueForKey("borderWidth", Number);
        }
        if (spec.containsKey("shadowColor")){
            this.shadowColor = spec.valueForKey("shadowColor", JSColor);
        }
        if (spec.containsKey("shadowRadius")){
            this.shadowRadius = spec.valueForKey("shadowRadius", Number);
        }
        if (spec.containsKey("shadowOffset")){
            this.shadowOffset = spec.valueForKey("shadowOffset", JSPoint);
        }
        if (spec.containsKey("contentVisualEffect")){
            this.contentVisualEffect = spec.valueForKey("contentVisualEffect", UIVisualEffect);
        }
        if (spec.containsKey("maskedBorders")){
            this.maskedBorders = spec.valueForKey("maskedBorders", UIView.Sides);
        }
        if (spec.containsKey("cornerRadius")){
            this.cornerRadius = spec.valueForKey("cornerRadius", Number);
        }
        if (spec.containsKey("maskedCorners")){
            this.maskedCorners = spec.valueForKey("maskedCorners", UIView.Corners);
        }
        if (spec.containsKey("tooltip")){
            this.tooltip = spec.valueForKey("tooltip");
        }
        if (spec.containsKey("nextKeyView")){
            this.nextKeyView = spec.valueForKey("nextKeyView");
        }
        if (spec.containsKey("hidden")){
            this.hidden = spec.valueForKey("hidden");
        }
        if (spec.containsKey("alpha")){
            this.alpha = spec.valueForKey("alpha", Number);
        }
        if (spec.containsKey("userInteractionEnabled")){
            this.userInteractionEnabled = spec.valueForKey("userInteractionEnabled");
        }
        if (spec.containsKey("cursor")){
            this.cursor = spec.valueForKey("cursor", UICursor);
        }
        if (spec.containsKey("transform")){
            this.transform = spec.valueForKey("transform", JSAffineTransform);
        }
        if (spec.containsKey("accessibilityRole")){
            this.accessibilityRole = spec.valueForKey("accessibilityRole");
            this.isAccessibilityElement = this.accessibilityRole !== null;
        }
        if (spec.containsKey("accessibilitySubrole")){
            this.accessibilitySubrole = spec.valueForKey("accessibilitySubrole");
            this.isAccessibilityElement = this.accessibilitySubrole !== null;
        }
        if (spec.containsKey("accessibilityIdentifier")){
            this._accessibilityIdentifier = spec.valueForKey("accessibilityIdentifier");
        }
        if (spec.containsKey("accessibilityLabel")){
            this._accessibilityLabel = spec.valueForKey("accessibilityLabel");
        }
        if (spec.containsKey("accessibilityHint")){
            this.accessibilityHint = spec.valueForKey("accessibilityHint");
        }
        if (spec.containsKey("accessibilityHidden")){
            this.accessibilityHidden = spec.valueForKey("accessibilityHidden");
        }
        if (spec.containsKey("tag")){
            this.tag = spec.valueForKey("tag");
        }
        if (spec.containsKey("zIndex")){
            this.zIndex = spec.valueForKey("zIndex", Number);
        }
        var i, l;
        if (spec.containsKey("gestureRecognizers")){
            var recognizers = spec.valueForKey("gestureRecognizers");
            for (i = 0, l = recognizers.length; i < l; ++i){
                var recognizer = recognizers.valueForKey(i);
                this.addGestureRecognizer(recognizers);
            }
        }
        if (spec.containsKey("subviews")){
            var subviews = spec.valueForKey("subviews");
            for (i = 0, l = subviews.length; i < l; ++i){
                var subview = subviews.valueForKey(i, UIView);
                this.addSubview(subview);
            }
        }
        if (spec.containsKey("clipsToBounds")){
            this.clipsToBounds = spec.valueForKey("clipsToBounds");
        }
        // NOTE: constraints are still and work in progress, and aren't actually
        // used yet during layout
        if (spec.containsKey("constraints")){
            var constraintValue;
            var constraints = spec.valueForKey("constraints");
            for (i = 0, l = constraints.length; i < l; ++i){
                var constraint = constraints.valueForKey(i, UILayoutConstraint);
                this.addConstraint(constraint);
            }
        }
    },

    _commonLayerInit: function(){
        this.layer = this.$class.layerClass.init();
        this.layer.delegate = this;
        this.subviews = [];
        this._registeredDraggedTypes = [];
        this._constraints = [];
        this.gestureRecognizers = [];
    },

    // -------------------------------------------------------------------------
    // MARK: - Styling

    alpha: UIViewLayerProperty(),
    backgroundColor: UIViewLayerProperty(),
    backgroundGradient: UIViewLayerProperty(),
    backgroundVisualEffect: UIViewLayerProperty(),
    borderWidth: UIViewLayerProperty(),
    borderColor: UIViewLayerProperty(),
    maskedBorders: UIViewLayerProperty(),
    cornerRadius: UIViewLayerProperty(),
    maskedCorners: UIViewLayerProperty(),
    shadowColor: UIViewLayerProperty(),
    shadowOffset: UIViewLayerProperty(),
    shadowRadius: UIViewLayerProperty(),
    contentVisualEffect: UIViewLayerProperty(),
    zIndex: UIViewLayerProperty(),
    cursor: JSDynamicProperty(),
    tooltip: null,

    // -------------------------------------------------------------------------
    // MARK: - Underlying Layer

    layer: null,

    layerDidChangeVisibility: function(layer){
        if (layer === this.layer){
            this.postAccessibilityNotification(UIAccessibility.Notification.visibilityChanged);
        }
    },

    layerDidChangeZIndexSublayers: function(layer){
        this.zIndexOrderedSubviews = null;
    },

    // -------------------------------------------------------------------------
    // MARK: - Superview

    superview: null,
    subviewIndex: null,

    // -------------------------------------------------------------------------
    // MARK: - Identity

    tag: 0,

    // -------------------------------------------------------------------------
    // MARK: - Adding and Removing Subviews

    subviews: null,

    addSubview: function(subview){
        if (!(subview instanceof UIView)){
            throw new TypeError("addSubview() given view is not a UIView");
        }
        return this._insertSubviewAtIndex(subview, this.subviews.length, this.layer.sublayers.length);
    },

    insertSubviewAtIndex: function(subview, index){
        if (!(subview instanceof UIView)){
            throw new TypeError("insertSubviewAtIndex() given view is not a UIView");
        }
        var layerIndex;
        if (index < this.subviews.length){
            layerIndex = this.subviews[index].layer.sublayerIndex;
        }else{
            layerIndex = this.layer.sublayers.length;
        }
        this._insertSubviewAtIndex(subview, index, layerIndex);
    },

    insertSubviewBelowSibling: function(subview, sibling){
        if (!(subview instanceof UIView)){
            throw new TypeError("insertSubviewBelowSibling() given view is not a UIView");
        }
        if (sibling.superview !== this){
            throw Error('Cannot insert subview [%s] in view [%s] because sibling view [%s] is not a valid subview.');
        }
        return this._insertSubviewAtIndex(subview, sibling.subviewIndex, sibling.layer.sublayerIndex);
    },

    insertSubviewAboveSibling: function(subview, sibling){
        if (!(subview instanceof UIView)){
            throw new TypeError("insertSubviewAboveSibling() given view is not a UIView");
        }
        if (sibling.superview !== this){
            throw Error('Cannot insert subview [%s] in view [%s] because sibling view [%s] is not a valid subview.');
        }
        return this._insertSubviewAtIndex(subview, sibling.subviewIndex + 1, sibling.layer.sublayerIndex + 1);
    },

    removeSubview: function(subview){
        if (!(subview instanceof UIView)){
            throw new TypeError("removeSubview() given subview is not a UIView");
        }
        if (subview.superview === this){
            this.layer.removeSublayer(subview.layer);
            for (var i = subview.subviewIndex + 1, l = this.subviews.length; i < l; ++i){
                this.subviews[i].subviewIndex -= 1;
            }
            this.subviews.splice(subview.subviewIndex,1);
            subview.superview = null;
            subview.setWindow(null);
            subview.subviewIndex = null;
            this.subviewsDidChange();
        }
    },

    removeFromSuperview: function(){
        if (this.superview){
            this.superview.removeSubview(this);
        }
    },

    removeAllSubviews: function(){
        for (var i = this.subviews.length - 1; i >= 0; --i){
            this.subviews[i].removeFromSuperview();
        }
    },

    _insertSubviewAtIndex: function(subview, index, layerIndex){
        var i, l;
        if (subview.superview === this){
            if (subview.subviewIndex === index || subview.subviewIndex === index - 1){
                return subview;
            }
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
        this.subviewsDidChange();
        return subview;
    },

    subviewsDidChange: function(){
    },

    subviewWithTag: function(tag){
        for (var i = 0, l = this.subviews.length; i < l; ++i){
            if (this.subviews[i].tag === tag){
                return this.subviews[i];
            }
        }
        return null;
    },

    isDescendantOfView: function(view){
        if (view === null || view === undefined){
            return false;
        }
        var superview = this.superview;
        while (superview !== null && superview !== view){
            superview = superview.superview;
        }
        return superview !== null && superview === view;
    },

    // -------------------------------------------------------------------------
    // MARK: - Window

    window: JSDynamicProperty('_window', null),

    setWindow: function(window){
        if (window != this._window){
            if (this._window){
                if (this._window.firstResponder === this){
                    this._window.firstResponder = null;
                }
                if (this._mouseTrackingAreas !== null && this._mouseTrackingAreas.length > 0){
                    this._window.removeMouseTrackingView(this);
                }
            }
            this._setWindowServer(window ? window.windowServer : null);
            this._window = window;
            if (this._window){
                if (this._mouseTrackingAreas !== null && this._mouseTrackingAreas.length > 0){
                    this._window.addMouseTrackingView(this);
                }
            }
            for (var i = 0, l = this.subviews.length; i < l; ++i){
                this.subviews[i].window = window;
            }
        }
    },

    getWindow: function(){
        return this._window;
    },

    _windowServer: null,

    _setWindowServer: function(windowServer, includeSubviews){
        if (this._windowServer !== windowServer){
            if (this.isAccessibilityElement){
                if (this._windowServer !== null){
                    this._windowServer.postNotificationsForAccessibilityElementDestroyed(this);
                }
                if (windowServer !== null){
                    windowServer.postNotificationsForAccessibilityElementCreated(this);
                }
            }
            this._windowServer = windowServer;
            if (includeSubviews){
                for (var i = 0, l = this.subviews.length; i < l; ++i){
                    this.subviews[i]._setWindowServer(windowServer, true);
                }
            }
        }
    },

    windowDidChangeKeyStatus: function(){
        for (var i = 0, l = this.subviews.length; i < l; ++i){
            this.subviews[i].windowDidChangeKeyStatus();
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Key View Loop

    nextKeyView: JSDynamicProperty('_nextKeyView', null),
    nextValidKeyView: JSReadOnlyProperty(),
    previousKeyView: JSReadOnlyProperty('_previousKeyView', null),
    previousValidKeyView: JSReadOnlyProperty(),

    setNextKeyView: function(nextKeyView){
        if (this._nextKeyView !== null){
            this._nextKeyView._previousKeyView = this.previousKeyView;
        }
        this._nextKeyView = nextKeyView;
        if (nextKeyView !== null){
            nextKeyView._previousKeyView = this;
        }
    },

    getNextValidKeyView: function(){
        if (this._nextKeyView !== null){
            var hidden = this._nextKeyView.hidden || this._nextKeyView.window === null;
            var superview = this._nextKeyView.superview;
            while (!hidden && superview !== null){
                hidden = superview.hidden;
                superview = superview.superview;
            }
            if (hidden || !this._nextKeyView.canBecomeFirstResponder()){
                return this._nextKeyView.nextValidKeyView;
            }
            return this._nextKeyView;
        }
        return null;
    },

    getPreviousValidKeyView: function(){
        if (this._previousKeyView !== null){
            var hidden = this._previousKeyView.hidden || this._previousKeyView.window === null;
            var superview = this._previousKeyView.superview;
            while (!hidden && superview !== null){
                hidden = superview.hidden;
                superview = superview.superview;
            }
            if (hidden || !this._previousKeyView.canBecomeFirstResponder()){
                return this._previousKeyView.previousValidKeyView;
            }
            return this._previousKeyView;
        }
        return null;
    },

    fullKeyboardAccessEnabled: JSReadOnlyProperty(),

    getFullKeyboardAccessEnabled: function(){
        return this._windowServer !== null && this._windowServer.fullKeyboardAccessEnabled;
    },

    focusRingPath: JSReadOnlyProperty(),

    getFocusRingPath: function(){
        return this.layer.backgroundPath();
    },

    invalidateFocusRingPath: function(animated){
        if (this._window !== null){
            if (this._window.firstResponder === this){
                this._window.invalidateFocusRing(animated);
            }
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - View Controller

    viewController: null,

    // -------------------------------------------------------------------------
    // MARK: Traits
    
    traitCollection: JSReadOnlyProperty(),

    getTraitCollection: function(traitCollection){
        if (this._window !== null){
            return this._window.traitCollection;
        }
        return UITraitCollection.init();
    },

    traitCollectionDidChange: function(previousTraits){
        if (this.viewController){
            this.viewController.traitCollectionDidChange(previousTraits);
        }
        for (var i = 0, l = this.subviews.length; i < l; ++i){
            this.subviews[i].traitCollectionDidChange(previousTraits);
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Layout

    frame: UIViewLayerProperty(),
    untransformedFrame: UIViewLayerProperty(),
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
        if (this._constraints.length > 0){
            // TODO:
        }
    },

    _layoutSubviewsAndNotify: function(){
        this.layoutSubviews();
        if (this.viewController){
            this.viewController.viewDidLayoutSubviews();
        }
    },

    layoutSublayersOfLayer: function(layer){
        this._layoutSubviewsAndNotify();
    },

    sizeToFit: function(){
        this.sizeToFitSize(JSSize(Number.MAX_VALUE, Number.MAX_VALUE));
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

    layerDidChangeSize: function(layer){
        if (layer === this.layer){
            this.invalidateFocusRingPath();
            this.updateMouseTrackingAreas();
        }
    },

    layerDidChangeOrigin: function(layer){
        if (layer === this.layer){
            this.invalidateFocusRingPath();
            this.updateMouseTrackingAreas();
        }
    },

    userVisible: JSReadOnlyProperty(),

    getUserVisible: function(){
        if (this.hidden){
            return false;
        }
        if (this.alpha === 0){
            return false;
        }
        if (this.superview !== null){
            return this.superview.userVisible;
        }
        return true;
    },

    // -------------------------------------------------------------------------
    // MARK: - Constraints

    constraints: JSReadOnlyProperty('_constraints', null),

    contentHuggingPriority: UILayoutPriority.defaultLow,
    contentCompressionResistancePriority: UILayoutPriority.defaultHigh,

    addConstraint: function(constraint){
        constraint._attachToView(this);
        if (constraint._targetItem !== this){
            throw new Error("Cannot add constraint to view because the constraint belongs to another view");
        }
        if (constraint._isActive){
            return;
        }
        constraint._isActive = true;
        this._constraints.push(constraint);
        this.setNeedsLayout();
    },

    removeConstraint: function(constraint){
        var index = this._constraints.indexOf(constraint);
        if (index >= 0){
            this._constraints.splice(index, 1);
            constraint._isActive = false;
            this.setNeedsLayout();
        }
    },

    constrainedSize: JSReadOnlyProperty(),

    layoutFittingSize: function(size){
    },

    _updateConstraints: function(){
        if (this._needsIntrinsicSizeConstraintUpdate){
            this._updateIntrinsicSizeConstraints();
            this._needsIntrinsicSizeConstraintUpdate = false;
        }
    },

    _intrinsicWidthHuggingConstraint: null,
    _intrinsicWidthResistConstraint: null,
    _intrinsicHeightHuggingConstraint: null,
    _intrinsicHeightResistConstraint: null,
    _needsIntrinsicSizeConstraintUpdate: true,

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

    // -------------------------------------------------------------------------
    // MARK: - Display

    setNeedsDisplay: function(){
        this.layer.setNeedsDisplay();
    },

    // -------------------------------------------------------------------------
    // MARK: - Responder
    
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

    keyActive: JSReadOnlyProperty(undefined, undefined, 'isKeyActive'),

    isKeyActive: function(){
        return this.window !== null && this.window.isKeyWindow && this.window.firstResponder === this;
    },

    // -------------------------------------------------------------------------
    // MARK: - Mouse Tracking

    _mouseTrackingAreas: null,

    addMouseTrackingArea: function(trackingArea){
        if (this._mouseTrackingAreas === null){
            this._mouseTrackingAreas = [];
        }
        var index = this._mouseTrackingAreas.indexOf(trackingArea);
        if (index < 0){
            trackingArea.view = this;
            this._mouseTrackingAreas.push(trackingArea);
            if (this._mouseTrackingAreas.length === 1 && this._window !== null){
                this._window.addMouseTrackingView(this);
            }
        }
    },

    removeMouseTrackingArea: function(trackingArea){
        if (this._mouseTrackingAreas !== null){
            var index = this._mouseTrackingAreas.indexOf(trackingArea);
            if (index >= 0){
                if (trackingArea._entered && trackingArea.cursor !== null){
                    trackingArea.cursor.unset();
                }
                trackingArea._entered = false;
                trackingArea.view = null;
                this._mouseTrackingAreas.splice(index, 1);
                if (this._window !== null && this._mouseTrackingAreas.length === 0){
                    this._window.removeMouseTrackingView(this);
                }
            }
        }
    },

    updateMouseTrackingAreas: function(){
        if (this._startStopMouseTrackingArea !== null){
            this._startStopMouseTrackingArea.rect = this.bounds;
        }
        if (this._cursorMouseTrackingArea !== null){
            this._cursorMouseTrackingArea.rect = this.bounds;
        }
    },

    _cursorMouseTrackingArea: null,

    setCursor: function(cursor){
        if (this._cursorMouseTrackingArea === null){
            if (cursor !== null){
                this._cursorMouseTrackingArea = UIMouseTrackingArea.initWithResponder(this, this.bounds, UIMouseTrackingArea.TrackingType.enterAndExit);
                this._cursorMouseTrackingArea.cursor = cursor;
                this.addMouseTrackingArea(this._cursorMouseTrackingArea);
            }
        }else{
            if (cursor !== null){
                this._cursorMouseTrackingArea.cursor = cursor;
                if (this._cursorMouseTrackingArea._entered){
                    cursor.set();
                }
            }else{
                this.removeMouseTrackingArea(this._cursorMouseTrackingArea);
                this._cursorMouseTrackingArea = null;
            }
        }
    },

    getCursor: function(){
        if (this._cursorMouseTrackingArea !== null){
            return this._cursorMouseTrackingArea.cursor;
        }
        return null;
    },

    // legacy/deprecated
    
    mouseTrackingType: JSReadOnlyProperty(),

    getMouseTrackingType: function(){
        if (this._startStopMouseTrackingArea !== null){
            return this._startStopMouseTrackingArea.trackingType;
        }
        return UIView.MouseTracking.none;
    },

    _startStopMouseTrackingArea: null,

    startMouseTracking: function(trackingType){
        if (this._startStopMouseTrackingArea === null){
            this._startStopMouseTrackingArea = UIMouseTrackingArea.initWithResponder(this, this.bounds, trackingType);
            this.addMouseTrackingArea(this._startStopMouseTrackingArea);
        }else{
            this._startStopMouseTrackingArea.trackingType = trackingType;
        }
    },

    stopMouseTracking: function(){
        if (this._startStopMouseTrackingArea !== null){
            this.removeMouseTrackingArea(this._startStopMouseTrackingArea);
            this._startStopMouseTrackingArea = null;
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Drag & Drop Source

    beginDraggingSessionWithItems: function(items, event){
        if (this._windowServer === null){
            return;
        }
        return this._windowServer.createDraggingSessionWithItems(items, event, this);
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

    draggingEntered: function(session){
        return UIDragOperation.none;
    },

    draggingUpdated: function(session){
        return UIDragOperation.none;
    },

    draggingExited: function(session){
    },

    performDragOperation: function(session, operation){
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

    userInteractionEnabled: true,

    zIndexOrderedSubviews: null,

    containsPoint: function(point){
        return this.layer.containsPoint(point);
    },

    hitTest: function(locationInView, event){
        var subview;
        var locationInSubview;
        var hit = null;
        var subviews = this.subviews;
        if (this.layer.numberOfSublayersWithNonZeroZIndex > 0){
            if (this.zIndexOrderedSubviews === null){
                this.zIndexOrderedSubviews = JSCopy(subviews);
                this.zIndexOrderedSubviews.sort(UIView.compareZIndex);
            }
            subviews = this.zIndexOrderedSubviews;
        }
        for (var i = subviews.length - 1; i >= 0 && hit === null; --i){
            subview = subviews[i];
            locationInSubview = this.layer.convertPointToLayer(locationInView, subview.layer);
            if (!subview.hidden && subview.layer.presentation.alpha > 0 && (!subview.clipsToBounds || subview.containsPoint(locationInSubview))){
                hit = subview.hitTest(locationInSubview, event);
            }
        }
        if (hit === null && this.userInteractionEnabled && this.containsPoint(locationInView)){
            hit = this;
        }
        return hit;
    },

    // -------------------------------------------------------------------------
    // MARK: - Gestures

    gestureRecognizers: null,

    addGestureRecognizer: function(gestureRecognizer){
        gestureRecognizer.view = this;
        this.gestureRecognizers.push(gestureRecognizer);
    },

    removeGestureRecognizer: function(gestureRecognizer){
        var index = this.gestureRecognizers.indexOf(gestureRecognizer);
        if (index >= 0){
            gestureRecognizer.view = null;
            this.gestureRecognizers.splice(index, 1);
        }
    },

    touchesBegan: function(touches, event){
        var enabledGestureCount = 0;
        var gestureRecognizer;
        for (var i = 0, l = this.gestureRecognizers.length; i < l; ++i){
            gestureRecognizer = this.gestureRecognizers[i];
            if (gestureRecognizer.enabled){
                ++enabledGestureCount;
                gestureRecognizer.touchesBegan(touches, event);
            }
        }
        if (enabledGestureCount === 0){
            UIView.$super.touchesBegan.call(this, touches, event);
        }
    },

    touchesEnded: function(touches, event){
        var enabledGestureCount = 0;
        var gestureRecognizer;
        for (var i = 0, l = this.gestureRecognizers.length; i < l; ++i){
            gestureRecognizer = this.gestureRecognizers[i];
            if (gestureRecognizer.enabled){
                ++enabledGestureCount;
                gestureRecognizer.touchesEnded(touches, event);
            }
        }
        if (enabledGestureCount === 0){
            UIView.$super.touchesEnded.call(this, touches, event);
        }
    },

    touchesMoved: function(touches, event){
        var enabledGestureCount = 0;
        var gestureRecognizer;
        for (var i = 0, l = this.gestureRecognizers.length; i < l; ++i){
            gestureRecognizer = this.gestureRecognizers[i];
            if (gestureRecognizer.enabled){
                ++enabledGestureCount;
                gestureRecognizer.touchesMoved(touches, event);
            }
        }
        if (enabledGestureCount === 0){
            UIView.$super.touchesMoved.call(this, touches, event);
        }
    },

    touchesCanceled: function(touches, event){
        var enabledGestureCount = 0;
        var gestureRecognizer;
        for (var i = 0, l = this.gestureRecognizers.length; i < l; ++i){
            gestureRecognizer = this.gestureRecognizers[i];
            if (gestureRecognizer.enabled){
                ++enabledGestureCount;
                gestureRecognizer.touchesCanceled(touches, event);
            }
        }
        if (enabledGestureCount === 0){
            UIView.$super.touchesCanceled.call(this, touches, event);
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Restoration

    restorationIdentifier: null,

    // -------------------------------------------------------------------------
    // MARK: - Accessibility

    // Visibility
    isAccessibilityElement: false,
    accessibilityHidden: JSDynamicProperty("_accessibilityHidden", false),
    accessibilityLayer: JSReadOnlyProperty(),
    accessibilityFrame: JSReadOnlyProperty(),

    // Role
    accessibilityRole: null,
    accessibilitySubrole: null,
    accessibilityResponder: JSReadOnlyProperty(),

    // Label
    accessibilityIdentifier: JSDynamicProperty("_accessibilityIdentifier", null),
    accessibilityLabel: JSDynamicProperty("_accessibilityLabel", null),
    accessibilityHint: null,

    // Value
    accessibilityValue: null,
    accessibilityValueRange: null,
    accessibilityChecked: null,
    accessibilityOrientation: null,

    // Properties
    accessibilityTextualContext: null,
    accessibilityMenu: null,
    accessibilityRowCount: null,
    accessibilityColumnCount: null,
    accessibilityRowIndex: null,
    accessibilityColumnIndex: null,
    accessibilitySelected: null,
    accessibilityExpanded: null,
    accessibilityEnabled: null,
    accessibilityLevel: null,
    accessibilityMultiline: null,

    // Children
    accessibilityParent: JSReadOnlyProperty(),
    accessibilityElements: JSReadOnlyProperty(),

    getAccessibilityParent: function(){
        var superview = this.superview;
        while (superview !== null && !superview.isAccessibilityElement){
            superview = superview.superview;
        }
        return superview;
    },

    getAccessibilityElements: function(){
        return [];
    },

    getAccessibilityLayer: function(){
        return this.layer;
    },

    getAccessibilityFrame: function(){
        return this.convertRectToScreen(this.bounds);
    },

    getAccessibilityResponder: function(){
        return this;
    },

    getAccessibilityIdentifier: function(){
        return this._accessibilityIdentifier;
    },

    setAccessibilityIdentifier: function(accessibilityIdentifier){
        if (accessibilityIdentifier === this._accessibilityIdentifier){
            return;
        }
        this._accessibilityIdentifier = accessibilityIdentifier;
        this.postAccessibilityNotification(UIAccessibility.Notification.identifierChanged);
    },

    getAccessibilityLabel: function(){
        return this._accessibilityLabel;
    },

    setAccessibilityLabel: function(accessibilityLabel){
        if (accessibilityLabel === this._accessibilityLabel){
            return;
        }
        this._accessibilityLabel = accessibilityLabel;
        this.postAccessibilityNotification(UIAccessibility.Notification.labelChanged);
    },

    setAccessibilityHidden: function(accessibilityHidden){
        if (accessibilityHidden === this._accessibilityHidden){
            return;
        }
        this._accessibilityHidden = accessibilityHidden;
        this.postAccessibilityNotification(UIAccessibility.Notification.visibilityChanged);
    },

    getAccessibilityHidden: function(){
        return this.hidden || this._accessibilityHidden;
    },

    postAccessibilityNotification: function(notificationName){
        if (this._windowServer === null){
            return;
        }
        if (!this.isAccessibilityElement){
            return;
        }
        this._windowServer.postNotificationForAccessibilityElement(notificationName, this);
    },

    didCreateAccessibilityElement: function(){
    },

    postAccessibilityElementCreatedNotification: function(element){
        this.postAccessibilityNotification(UIAccessibility.Notification.elementCreated, element);
    },

    postAccessibilityElementChangedNotification: function(element){
        this.postAccessibilityNotification(UIAccessibility.Notification.elementChanged, element);
    },

    postAccessibilityElementDestroyedNotification: function(element){
        this.postAccessibilityNotification(UIAccessibility.Notification.elementDestroyed, element);
    },

});

UIView.MouseTracking = UIMouseTrackingArea.TrackingType;

UIView.layerClass = UILayer;

UIView.animateWithDuration = function(duration, animations, callback){
    var options = {
        delay: 0,
        duration: duration,
        timingFunction: UIAnimation.Timing.linear
    };
    UIView.animateWithOptions(options, animations, callback);
};

UIView.animateWithOptions = function(options, animations, callback){
    var transaction = UIAnimationTransaction.begin();
    transaction.delay = options.delay || 0;
    transaction.duration = options.duration || 0.25;
    transaction.timingFunction = options.timingFunction || UIAnimation.Timing.linear;
    transaction.completionFunction = callback;
    animations();
    UIAnimationTransaction.commit();
};

UIView.noIntrinsicSize = -1;

UIView.Corners = UILayer.Corners;
UIView.Sides = UILayer.Sides;

UIView.compareZIndex = function(a, b){
    return a.layer._zIndex - b.layer._zIndex;
};
