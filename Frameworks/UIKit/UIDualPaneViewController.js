// #import "UIKit/UIViewController.js"
/* global JSClass, JSRect, JSColor, UICursor, JSReadOnlyProperty, JSDynamicProperty, UIViewController, UIDualPaneViewController, JSPoint, UIView, _UIDualPaneView, _UIDualPaneDividerView, JSConstraintBox, UIViewPropertyAnimator */
'use strict';

JSClass("UIDualPaneViewController", UIViewController, {

    leadingPaneViewController: JSDynamicProperty('_leadingPaneViewController', null),
    mainContentViewControlller: JSDynamicProperty('_mainContentViewController', null),
    trailingPaneViewController: JSDynamicProperty('_trailingPaneViewController', null),

    leadingPaneOpen: JSReadOnlyProperty(null, null, 'isLeadingPaneOpen'),
    trailingPaneOpen: JSReadOnlyProperty(null, null, 'isTrailingPaneOpen'),

    doublePaneView: JSReadOnlyProperty(),
    _defaultViewClass: "_UIDualPaneView",

    initWithSpec: function(spec, values){
        UIDualPaneViewController.$super.initWithSpec.call(this, spec, values);
        if ('leadingPaneViewController' in values){
            this._leadingPaneViewController = spec.resolvedValue(values.leadingPaneViewController);
        }
        if ('trailingPaneViewController' in values){
            this._trailingPaneViewController = spec.resolvedValue(values.trailingPaneViewController);
        }
        if ('mainContentViewController' in values){
            this._mainContentViewController = spec.resolvedValue(values.mainContentViewController);
        }
        if ('view' in values){
            // Set properties that can't really be defined in the spec because
            // we always want them to be the same thing.  This ensures they're
            // populated and set correctly when the view is loaded from the spec
            if (this._leadingPaneViewController !== null){
                values.view.leadingView = this._leadingPaneViewController.view;
            }
            if (this._trailingPaneViewController){
                values.view.trailingView = this._trailingPaneViewController.view;
            }
            values.view.mainView = this._mainContentViewController.view;
        }
    },

    getDoublePaneView: function(){
        return this._view;
    },

    loadView: function(){
        var leadingView = null;
        var trailingView = null;
        var mainView = null;
        if (this._leadingPaneViewController !== null){
            leadingView = this._leadingPaneViewController.view;
        }
        if (this._trailingPaneViewController){
            trailingView = this._trailingPaneViewController.view;
        }
        if (this._mainContentViewController){
            mainView = this._mainContentViewController.view;
        }
        this._view = _UIDualPaneView.initWithViews(leadingView, mainView, trailingView);
    },

    hideLeadingPane: function(animated){
        if (this.doublePaneView.leadingViewOpen){
            this.toggleLeadingPane(animated);
        }
    },

    showLeadingPane: function(animated){
        if (!this.doublePaneView.leadingViewOpen){
            this.toggleLeadingPane(animated);
        }
    },

    _leadingPaneAnimator: null,

    toggleLeadingPane: function(animated){
        var percentRemaining = 1;
        if (this._leadingPaneAnimator !== null){
            this._leadingPaneAnimator.stop();
            percentRemaining = this._leadingPaneAnimator.percentComplete;
            this._leadingPaneAnimator = null;
        }
        if (!animated){
            this.doublePaneView.leadingViewOpen = !this.doublePaneView.leadingViewOpen;
        }else{
            var animator = UIViewPropertyAnimator.initWithDuration(0.15 * percentRemaining);
            var self = this;
            this.doublePaneView.leadingViewOpen = !this.doublePaneView.leadingViewOpen;
            animator.addAnimations(function(){
                self.doublePaneView.layoutIfNeeded();
            });
            animator.addCompletion(function(){
                self._leadingPaneAnimator = null;
            });
            this._leadingPaneAnimator = animator;
            animator.start();
        }
    },

    isLeadingPaneOpen: function(){
        return this.doublePaneView.leadingViewOpen;
    },

    isTrailingPaneOpen: function(){
        return this.doublePaneView.trailingViewOpen;
    },

    hideTrailingPane: function(animated){
        if (this.doublePaneView.trailingViewOpen){
            this.toggleTrailingPane(animated);
        }
    },

    showTrailingPane: function(animated){
        if (!this.doublePaneView.trailingViewOpen){
            this.toggleTrailingPane(animated);
        }
    },

    _trailingPaneAnimator: null,

    toggleTrailingPane: function(animated){
        var percentRemaining = 1;
        if (this._trailingPaneAnimator !== null){
            this._trailingPaneAnimator.stop();
            percentRemaining = this._trailingPaneAnimator.percentComplete;
            this._trailingPaneAnimator = null;
        }
        if (!animated){
            this.doublePaneView.trailingViewOpen = !this.doublePaneView.trailingViewOpen;
            // TODO: viewWillAppear/viewDidAppear
        }else{
            var animator = UIViewPropertyAnimator.initWithDuration(0.15 * percentRemaining);
            var self = this;
            this.doublePaneView.trailingViewOpen = !this.doublePaneView.trailingViewOpen;
            animator.addAnimations(function(){
                self.doublePaneView.layoutIfNeeded();
            });
            animator.addCompletion(function(){
                self._trailingPaneAnimator = null;
            });
            this._trailingPaneAnimator = animator;
            animator.start();
        }
    },

    didTogglePane: function(){
    },

});

JSClass("_UIDualPaneView", UIView, {

    leadingView: JSDynamicProperty('_leadingView', null),
    mainView: JSDynamicProperty('_mainView', null),
    trailingView: JSDynamicProperty('_trailingView', null),

    leadingViewOpen: JSDynamicProperty('_leadingViewOpen', true, 'isLeadingViewOpen'),
    trailingViewOpen: JSDynamicProperty('_trailingViewOpen', true, 'isTrailingViewOpen'),

    vertical: JSDynamicProperty('_isVertical', false, 'isVertical'),

    minimumLeadingSize: JSDynamicProperty('_minimumLeadingSize', 150),
    minimumTrailingSize: JSDynamicProperty('_minimumTrailingSize', 150),
    minimumMainSize: JSDynamicProperty('_minimumMainSize', 400),
    maximumLeadingSize: JSDynamicProperty('_maximumLeadingSize', 350),
    maximumTrailingSize: JSDynamicProperty('_maximumTrailingSize', 350),

    leadingFloats: JSDynamicProperty('_leadingFloats', false),
    trailingFloats: JSDynamicProperty('_trailingFloats', false),

    leadingCollapses: JSDynamicProperty('_leadingCollapses', false),
    trailingCollapses: JSDynamicProperty('_trailingCollapses', false),

    leadingSize: JSDynamicProperty('_leadingSize', 200),
    trailingSize: JSDynamicProperty('_trailingSize', 200),

    leadingDividerColor: JSDynamicProperty(),
    trailingDividerColor: JSDynamicProperty(),

    _leadingDividerView: null,
    _trailingDividerView: null,

    initWithViews: function(leadingView, mainView, trailingView){
        _UIDualPaneView.$super.init.call(this);
        this._leadingView = leadingView;
        this._mainView = mainView;
        this._trailingView = trailingView;
        this._commonDualPaneInit();
    },

    initWithSpec: function(spec, values){
        _UIDualPaneView.$super.initWithSpec.call(this, spec, values);
        if ('leadingView' in values){
            this._leadingView = spec.resolvedValue(values.leadingView);
        }
        if ('trailingView' in values){
            this._trailingView = spec.resolvedValue(values.trailingView);
        }
        if ('mainView' in values){
            this._mainView = spec.resolvedValue(values.mainView);
        }
        if ('vertical' in values){
            this._isVertical = spec.resolvedValue(values.vertical);
        }
        if ('leadingFloats' in values){
            this._leadingFloats = spec.resolvedValue(values.leadingFloats);
        }
        if ('trailingFloats' in values){
            this._trailingFloats = spec.resolvedValue(values.trailingFloats);
        }
        if ('leadingCollapses' in values){
            this._leadingCollapses = spec.resolvedValue(values.leadingCollapses);
        }
        if ('trailingCollapses' in values){
            this._trailingCollapses = spec.resolvedValue(values.trailingCollapses);
        }
        if ('leadingSize' in values){
            this._leadingSize = spec.resolvedValue(values.leadingSize);
        }
        if ('trailingSize' in values){
            this._trailingSize = spec.resolvedValue(values.trailingSize);
        }
        if ('minimumLeadingSize' in values){
            this._minimumLeadingSize = spec.resolvedValue(values.minimumLeadingSize);
        }
        if ('minimumTrailingSize' in values){
            this._minimumTrailingSize = spec.resolvedValue(values.minimumTrailingSize);
        }
        if ('minimumMainSize' in values){
            this._minimumMainSize = spec.resolvedValue(values.minimumMainSize);
        }
        if ('maximumLeadingSize' in values){
            this._maximumLeadingSize = spec.resolvedValue(values.maximumLeadingSize);
        }
        if ('maximumTrailingSize' in values){
            this._maximumTrailingSize = spec.resolvedValue(values.maximumTrailingSize);
        }
        if ('leadingViewOpen' in values){
            this._leadingViewOpen = spec.resolvedValue(values.leadingViewOpen);
        }
        if ('trailingViewOpen' in values){
            this._trailingViewOpen = spec.resolvedValue(values.trailingViewOpen);
        }
        this._commonDualPaneInit();

        // after common init because the setters rely on objects that common init creates
        if ('leadingDividerColor' in values){
            this.leadingDividerColor = spec.resolvedValue(values.leadingDividerColor, "JSColor");
        }
        if ('trailingDividerColor' in values){
            this.trailingDividerColor = spec.resolvedValue(values.trailingDividerColor, "JSColor");
        }
    },

    _commonDualPaneInit: function(){
        this._leadingDividerView = _UIDualPaneDividerView.initWithSizes(1, 5, this._isVertical);
        this._trailingDividerView = _UIDualPaneDividerView.initWithSizes(1, 5, this._isVertical);
        this._leadingDividerView.vertical = this._isVertical;
        this._trailingDividerView.vertical = this._isVertical;
        this.addSubview(this._mainView);
        if (this._leadingView !== null){
            this._leadingView.clipsToBounds = true;
            this.addSubview(this._leadingView);
        }else{
            this._leadingViewOpen = false;
        }
        if (this._trailingView !== null){
            this._trailingView.clipsToBounds = true;
            this.addSubview(this._trailingView);
        }else{
            this._trailingViewOpen = false;
        }
        this.addSubview(this._leadingDividerView);
        this.addSubview(this._trailingDividerView);
    },

    setLeadingViewOpen: function(isOpen){
        if (isOpen != this._leadingViewOpen && this._leadingView !== null){
            this._leadingViewOpen = isOpen;
            this.setNeedsLayout();
            this.viewController.didTogglePane();
        }
    },

    setTrailingViewOpen: function(isOpen){
        if (isOpen != this._trailingViewOpen && this._trailingView !== null){
            this._trailingViewOpen = isOpen;
            this.setNeedsLayout();
            this.viewController.didTogglePane();
        }
    },

    setVertical: function(isVertical){
        this._isVertical = isVertical;
        this._leadingDividerView.vertical = isVertical;
        this._trailingDividerView.vertical = isVertical;
        this.setNeedsLayout();
    },

    setLeadingSize: function(size){
        this._leadingSize = size;
        this.setNeedsLayout();
    },

    setTrailingSize: function(size){
        this._trailingSize = size;
        this.setNeedsLayout();
    },

    setLeadingFloats: function(floats){
        this._leadingFloats = floats;
        this.setNeedsLayout();
    },

    setTrailingFloats: function(floats){
        this._trailingFloats = floats;
        this.setNeedsLayout();
    },

    setLeadingDividerColor: function(color){
        this._leadingDividerView.color = color;
    },

    getLeadingDividerColor: function(){
        return this._leadingDividerView.color;
    },

    setTrailingDividerColor: function(color){
        this._trailingDividerView.color = color;
    },

    getTrailingDividerColor: function(){
        return this._trailingDividerView.color;
    },

    setLeadingView: function(leadingView){
        if (leadingView === this._leadingView){
            return;
        }
        if (this._leadingView !== null){
            this._leadingView.removeFromSuperview();
        }
        if (leadingView !== null){
            leadingView.clipsToBounds = true;
            this.insertSubviewBeforeSibling(leadingView, this._leadingDividerView);
        }
        this._leadingView = leadingView;
        this.setNeedsLayout();
    },

    setTrailingView: function(trailingView){
        if (trailingView === this._trailingView){
            return;
        }
        if (this._trailingView !== null){
            this._trailingView.removeFromSuperview();
        }
        if (trailingView !== null){
            trailingView.clipsToBounds = true;
            this.insertSubviewBeforeSibling(trailingView, this._leadingDividerView);
        }
        this._trailingView = trailingView;
        this.setNeedsLayout();
    },

    setMainView: function(mainView){
        if (mainView === this._mainView){
            return;
        }
        if (this._mainView !== null){
            this._mainView.removeFromSuperview();
        }
        this.insertSubviewBeforeSibling(mainView, this._leadingView);
        this._mainView = mainView;
        this.setNeedsLayout();
    },

    layoutSubviews: function(){
        if (this._isVertical){
            this._layoutVertical();
        }else{
            this._layoutHorizontal();
        }
    },

    _layoutHorizontal: function(){
        var x = 0;
        var size = this.bounds.size;
        if (!this._leadingViewOpen){
            x -= this._leadingSize + this._leadingDividerView.layoutSize;
        }
        if (this._leadingView !== null){
            this._leadingView.frame = JSRect(x, 0, this._leadingSize, size.height);
        }
        x += this._leadingSize;
        this._leadingDividerView.frame = JSRect(x - this._leadingDividerView.layoutAdjustment, 0, 5, size.height);
        x += this._leadingDividerView.layoutSize;
        if (this.leadingFloats){
            x = 0;
        }
        var mainSize = size.width - x;
        if (mainSize < this._minimumMainSize){
            mainSize = this._minimumMainSize;
        }
        if (this._trailingViewOpen && !this.trailingFloats){
            mainSize -= this._trailingDividerView.layoutSize + this._trailingSize;
        }
        this._mainView.frame = JSRect(x, 0, mainSize, size.height);
        x += mainSize;
        if (this.trailingFloats && this._trailingViewOpen){
            x -= this._trailingSize + this._trailingDividerView.layoutSize;
        }
        this._trailingDividerView.frame = JSRect(x - this._trailingDividerView.layoutAdjustment, 0, 5, size.height);
        x += this._trailingDividerView.layoutSize;
        if (this._trailingView !== null){
            this._trailingView.frame = JSRect(x, 0, this._trailingSize, size.height);
        }
    },

    _layoutVertical: function(){
        var y = 0;
        var size = this.bounds.size;
        if (!this._leadingViewOpen){
            y -= this._leadingSize + this._leadingDividerView.layoutSize;
        }
        if (this._leadingView !== null){
            this._leadingView.frame = JSRect(0, y, size.width, this._leadingSize);
        }
        y += this._leadingSize;
        this._leadingDividerView.frame = JSRect(0, y - this._leadingDividerView.layoutAdjustment, size.width, 5);
        y += this._leadingDividerView.layoutSize;
        if (this.leadingFloats){
            y = 0;
        }
        var mainSize = size.height - y;
        if (mainSize < this._minimumMainSize){
            mainSize = this._minimumMainSize;
        }
        if (this._trailingViewOpen && !this.trailingFloats){
            mainSize -= this._trailingDividerView.layoutSize + this._trailingSize;
        }
        this._mainView.frame = JSRect(0, y, size.width, mainSize);
        y += mainSize;
        if (this.trailingFloats && this._trailingViewOpen){
            y -= this._trailingSize + this._trailingDividerView.layoutSize;
        }
        this._trailingDividerView.frame = JSRect(0, y - this._trailingDividerView.layoutAdjustment, size.width, 5);
        y += this._trailingDividerView.layoutSize;
        if (this._trailingView !== null){
            this._trailingView.frame = JSRect(0, y, size.width, this._trailingSize);
        }
    },

    _startingLocationInDivider: null,

    beginDeviderResize: function(divider, location){
        this._startingLocationInDivider = JSPoint(location);
        if (divider == this._leadingDividerView){
            this._previousLeadingSize = this._leadingSize;
        }else{
            this._previousTrailingSize = this._trailingSize;
        }
    },

    endDividerResize: function(divider){
        if (divider == this._leadingDividerView){
            if (!this._leadingViewOpen){
                this.leadingSize = this._previousLeadingSize;
            }
        }else{
            if (!this._trailingViewOpen){
                this.trailingSize = this._previousTrailingSize;
            }
        }
    },

    dividerDragged: function(divider, location){
        var z, dividerSize, boundsSize, dividerZ;
        if (this._isVertical){
            z = location.y;
            dividerZ = this._startingLocationInDivider.y;
            dividerSize = divider.frame.size.height;
            boundsSize = this.bounds.size.height;
        }else{
            z = location.x;
            dividerZ = this._startingLocationInDivider.x;
            dividerSize = divider.frame.size.width;
            boundsSize = this.bounds.size.width;
        }
        if (divider === this._leadingDividerView){
            var maximumLeadingSize = boundsSize - this._minimumMainSize;
            if (this._trailingViewOpen){
                maximumLeadingSize -= this._trailingSize;
            }
            if (this._maximumLeadingSize < maximumLeadingSize){
                maximumLeadingSize = this._maximumLeadingSize;
            }
            var leadingSize = z - dividerZ + divider.layoutAdjustment;
            if (this._leadingCollapses && leadingSize < this._minimumLeadingSize / 2){
                if (this._leadingViewOpen){
                    this.leadingViewOpen = false;
                }
            }else{
                if (!this._leadingViewOpen){
                    this.leadingViewOpen = true;
                }
                if (leadingSize >= this._minimumLeadingSize && leadingSize <= maximumLeadingSize){
                    this._leadingSize = leadingSize;
                    this.setNeedsLayout();
                }
            }
        }else if (divider === this._trailingDividerView){
            var maximumTrailingSize = boundsSize - this._minimumMainSize;
            if (this._leadingViewOpen){
                maximumTrailingSize -= this._leadingSize;
            }
            if (this._maximumTrailingSize < maximumTrailingSize){
                maximumTrailingSize = this._maximumTrailingSize;
            }
            var trailingSize = boundsSize - z + dividerZ - divider.layoutAdjustment;
            if (this._trailingCollapses && trailingSize < this._minimumTrailingSize / 2){
                if (this._trailingViewOpen){
                    this.trailingViewOpen = false;
                }
            }else{
                if (!this._trailingViewOpen){
                    this.trailingViewOpen = true;
                }
                if (trailingSize >= this._minimumTrailingSize && trailingSize <= maximumTrailingSize){
                    this._trailingSize = trailingSize;
                    this.setNeedsLayout();
                }
            }
        }
        this.layoutIfNeeded();
    }

});

JSClass("_UIDualPaneDividerView", UIView, {

    layoutSize: 1,
    hitSize: 5,
    lineView: null,
    layoutAdjustment: JSReadOnlyProperty(),
    vertical: JSDynamicProperty('_isVertical', false, 'isVertical'),
    color: JSDynamicProperty(),

    initWithSizes: function(layoutSize, hitSize, vertical){
        this.init();
        this.lineView = UIView.init();
        this.hitSize = hitSize;
        this.vertical = vertical;
        this.lineView.backgroundColor = JSColor.blackColor();
        this.addSubview(this.lineView);
    },

    setColor: function(color){
        this.lineView.backgroundColor = color;
    },

    getColor: function(){
        return this.lineView.backgroundColor;
    },

    setVertical: function(isVertical){
        this._isVertical = isVertical;
        if (isVertical){
            this.lineView.constraintBox = JSConstraintBox({height: this.layoutSize, left: 0, right: 0});
            this.cursor = UICursor.resizeUpDown;
        }else{
            this.lineView.constraintBox = JSConstraintBox({width: this.layoutSize, top: 0, bottom: 0});
            this.cursor = UICursor.resizeLeftRight;
        }
    },

    getLayoutAdjustment: function(){
        return (this.hitSize - this.layoutSize) / 2;
    },

    mouseDown: function(event){
        this.cursor.push();
        this.superview.beginDeviderResize(this, event.locationInView(this));
    },

    mouseUp: function(event){
        this.cursor.pop();
        this.superview.endDividerResize(this);
    },

    mouseDragged: function(event){
        this.superview.dividerDragged(this, event.locationInView(this.superview));
    }
});