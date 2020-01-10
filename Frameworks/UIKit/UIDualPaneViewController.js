// #import "UIViewController.js"
/* global JSClass, JSRect, JSColor, JSDeepCopy, JSUserDefaults, UICursor, JSReadOnlyProperty, JSDynamicProperty, UIViewController, UIDualPaneViewController, JSPoint, UIView, _UIDualPaneView, _UIDualPaneDividerView, UIViewPropertyAnimator */
'use strict';

JSClass("UIDualPaneViewController", UIViewController, {

    leadingPaneViewController: JSDynamicProperty('_leadingPaneViewController', null),
    mainContentViewController: JSDynamicProperty('_mainContentViewController', null),
    trailingPaneViewController: JSDynamicProperty('_trailingPaneViewController', null),

    leadingPaneOpen: JSReadOnlyProperty(null, null, 'isLeadingPaneOpen'),
    trailingPaneOpen: JSReadOnlyProperty(null, null, 'isTrailingPaneOpen'),

    doublePaneView: JSReadOnlyProperty(),
    _defaultViewClass: "_UIDualPaneView",

    initWithSpec: function(spec, values){
        if ('leadingPaneViewController' in values){
            this._leadingPaneViewController = spec.resolvedValue(values.leadingPaneViewController);
        }
        if ('trailingPaneViewController' in values){
            this._trailingPaneViewController = spec.resolvedValue(values.trailingPaneViewController);
        }
        if ('mainContentViewController' in values){
            this._mainContentViewController = spec.resolvedValue(values.mainContentViewController);
        }
        UIDualPaneViewController.$super.initWithSpec.call(this, spec, values);
        if (this._leadingPaneViewController !== null){
            this.addChildViewController(this._leadingPaneViewController);
        }
        if (this._trailingPaneViewController !== null){
            this.addChildViewController(this._trailingPaneViewController);
        }
        if (this._mainContentViewController !== null){
            this.addChildViewController(this._mainContentViewController);
        }
    },

    viewDidLoad: function(){
        if (this._mainContentViewController !== null && this._view.mainView === null){
            this._view.mainView = this._mainContentViewController.view;
        }
        if (this._leadingPaneViewController !== null && this._view.leadingView === null){
            this._view.leadingView = this._leadingPaneViewController.view;
        }
        if (this._trailingPaneViewController !== null && this._view.trailingView === null){
            this._view.trailingView = this._trailingPaneViewController.view;
        }
    },

    setLeadingPaneViewController: function(leadingPaneViewController){
        if (this._leadingPaneViewController !== null){
            this._leadingPaneViewController.removeFromParentViewController();
        }
        this._leadingPaneViewController = leadingPaneViewController;
        if (this._leadingPaneViewController){
            this.addChildViewController(this._leadingPaneViewController);
        }
        if (this._view !== null){
            var view = null;
            if (this._leadingPaneViewController !== null){
                view = this._leadingPaneViewController.view;
            }
            this._view.leadingView = view;
        }
    },

    setTrailingPaneViewController: function(trailingPaneViewController){
        if (this._trailingPaneViewController !== null){
            this._trailingPaneViewController.removeFromParentViewController();
        }
        this._trailingPaneViewController = trailingPaneViewController;
        if (this._trailingPaneViewController){
            this.addChildViewController(this._trailingPaneViewController);
        }
        if (this._view !== null){
            var view = null;
            if (this._trailingPaneViewController !== null){
                view = this._trailingPaneViewController.view;
            }
            this._view.trailingView = view;
        }
    },

    setMainContentViewController: function(mainContentViewController){
        if (this._mainContentViewController !== null){
            this._mainContentViewController.removeFromParentViewController();
        }
        this._mainContentViewController = mainContentViewController;
        if (this._mainContentViewController){
            this.addChildViewController(this._mainContentViewController);
        }
        if (this._view !== null){
            var view = null;
            if (this._mainContentViewController !== null){
                view = this._mainContentViewController.view;
            }
            this._view.mainView = view;
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
        var willAppear = !this.doublePaneView.leadingViewOpen;
        if (willAppear){
            this._leadingPaneViewController.viewWillAppear(animated);
        }else{
            this._leadingPaneViewController.viewWillDisappear(animated);
        }
        if (!animated){
            this.doublePaneView.leadingViewOpen = !this.doublePaneView.leadingViewOpen;
            // TODO: view did appear/disappear, but only after the next display frame
        }else{
            // make sure to apply any pending layouts before doing the animation,
            // otherwise the pending layouts will get caught up in the animation
            this.doublePaneView.layoutIfNeeded();
            var animator = UIViewPropertyAnimator.initWithDuration(0.15 * percentRemaining);
            var self = this;
            this.doublePaneView.leadingViewOpen = !this.doublePaneView.leadingViewOpen;
            animator.addAnimations(function(){
                self.doublePaneView.layoutIfNeeded();
            });
            animator.addCompletion(function(){
                self._leadingPaneAnimator = null;
                if (willAppear){
                    self._leadingPaneViewController.viewDidAppear(animated);
                }else{
                    self._leadingPaneViewController.viewDidDisappear(animated);
                }
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
            // make sure to apply any pending layouts before doing the animation,
            // otherwise the pending layouts will get caught up in the animation
            this.doublePaneView.layoutIfNeeded();
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

    leadingCollapsedSize: JSDynamicProperty('_leadingCollapsedSize', 0),
    trailingCollapsedSize: JSDynamicProperty('_trailingCollapsedSize', 0),

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
        if ('leadingCollapsedSize' in values){
            this._leadingCollapsedSize = spec.resolvedValue(values.leadingCollapsedSize);
        }
        if ('trailingCollapsedSize' in values){
            this._trailingCollapsedSize = spec.resolvedValue(values.trailingCollapsedSize);
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
        if ('autosaveName' in values){
            this.autosaveName = spec.resolvedValue(values.autosaveName);
        }
    },

    _commonDualPaneInit: function(){
        this._leadingDividerView = _UIDualPaneDividerView.initWithSizes(1, 5, this._isVertical);
        this._trailingDividerView = _UIDualPaneDividerView.initWithSizes(1, 5, this._isVertical);
        if (this._mainView !== null){
            this.addSubview(this._mainView);
        }
        if (this._leadingView !== null){
            this._leadingView.clipsToBounds = true;
            this.addSubview(this._leadingView);
        }
        if (this._trailingView !== null){
            this._trailingView.clipsToBounds = true;
            this.addSubview(this._trailingView);
        }
        this.addSubview(this._leadingDividerView);
        this.addSubview(this._trailingDividerView);
    },

    setLeadingViewOpen: function(isOpen){
        if (isOpen != this._leadingViewOpen){
            this._leadingViewOpen = isOpen;
            if (this._leadingView !== null){
                this.setNeedsLayout();
                this.viewController.didTogglePane();
                this._autosaveToUserDefaults();
            }
        }
    },

    setTrailingViewOpen: function(isOpen){
        if (isOpen != this._trailingViewOpen){
            this._trailingViewOpen = isOpen;
            if (this._trailingView !== null){
                this.setNeedsLayout();
                this.viewController.didTogglePane();
                this._autosaveToUserDefaults();
            }
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
            this.insertSubviewBelowSibling(leadingView, this._leadingDividerView);
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
            this.insertSubviewBelowSibling(trailingView, this._leadingDividerView);
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
        var sibling = this._leadingView;
        if (!sibling){
            sibling = this._trailingView;
        }
        if (!sibling){
            sibling = this._leadingDividerView;
        }
        this.insertSubviewBelowSibling(mainView, sibling);
        this._mainView = mainView;
        this.setNeedsLayout();
    },

    layoutSubviews: function(){
        _UIDualPaneView.$super.layoutSubviews.call(this);
        if (this._isVertical){
            this._layoutVertical();
        }else{
            this._layoutHorizontal();
        }
    },

    _getBestFitLayout: function(availableSize){
        var leadingFlex = 0;
        var trailingFlex = 0;
        var leadingSize = this._leadingSize;
        var trailingSize = this._trailingSize;
        var mainSize = this._minimumMainSize;
        var size = 0;
        if (!this._leadingFloats){
            if (this._leadingViewOpen && this._leadingView !== null){
                leadingFlex = leadingSize - this._minimumLeadingSize;
                size += this._leadingSize + this._leadingDividerView.layoutSize;
            }else if (this._leadingCollapsedSize > 0){
                size += this._leadingCollapsedSize + this._leadingDividerView.layoutSize;
            }
        }
        if (!this._trailingFloats){
            if (this._trailingViewOpen && this._trailingView !== null){
                trailingFlex = trailingSize - this._minimumTrailingSize;
                size += this._trailingSize + this._trailingDividerView.layoutSize;
            }else if (this._trailingCollapsedSize > 0){
                size += this._trailingCollapsedSize + this._trailingDividerView.layoutSize;
            }
        }
        size += mainSize;
        var over = size - availableSize;
        var totalFlex = leadingFlex + trailingFlex;
        if (over < 0){
            mainSize -= over;
        }else if (totalFlex > 0){
            if (totalFlex < over){
                over = totalFlex;
            }
            var cut = Math.floor(over * leadingFlex / totalFlex);
            leadingSize -= cut;
            over -= cut;
            trailingSize -= over;
        }

        var offset = 0;
        if (!this._leadingViewOpen || this._leadingView === null){
            offset -= leadingSize + this._leadingDividerView.layoutSize;
            if (this._leadingCollapsedSize > 0){
                offset += this._leadingCollapsedSize + this._leadingDividerView.layoutSize;
            }
        }
        var leadingOffset = offset;
        if (this.leadingFloats){
            offset = 0;
        }else{
            offset += leadingSize + this._leadingDividerView.layoutSize;
        }
        var mainOffset = offset;
        if (this.trailingFloats && this._trailingViewOpen && this._trailingView !== null){
            offset -= this._trailingSize;
        }else{
            offset += mainSize + this._trailingDividerView.layoutSize;
        }
        var trailingOffset = offset;

        return {
            leadingOffset: leadingOffset,
            leadingSize: leadingSize,
            mainOffset: mainOffset,
            mainSize: mainSize,
            trailingOffset: trailingOffset,
            trailingSize: trailingSize
        };
    },

    _layoutHorizontal: function(){
        var layout = this._getBestFitLayout(this.bounds.size.width);
        var height = this.bounds.size.height;
        var dividerSize = 5;
        if (this._leadingView !== null){
            this._leadingView.frame = JSRect(layout.leadingOffset, 0, layout.leadingSize, height);
        }
        this._leadingDividerView.frame = JSRect(layout.leadingOffset + layout.leadingSize - this._leadingDividerView.layoutAdjustment, 0, this._leadingDividerView.hitSize, height);
        if (this._mainView !== null){
            this._mainView.frame = JSRect(layout.mainOffset, 0, layout.mainSize, height);
        }
        this._trailingDividerView.frame = JSRect(layout.trailingOffset - this._trailingDividerView.layoutAdjustment - this._trailingDividerView.layoutSize, 0, this._trailingDividerView.hitSize, height);
        if (this._trailingView !== null){
            this._trailingView.frame = JSRect(layout.trailingOffset, 0, layout.trailingSize, height);
        }
    },

    _layoutVertical: function(){
        var layout = this._getBestFitLayout(this.bounds.size.height);
        var width = this.bounds.size.width;
        var dividerSize = 5;
        if (this._leadingView !== null){
            this._leadingView.frame = JSRect(0, layout.leadingOffset, width, layout.leadingSize);
        }
        this._leadingDividerView.frame = JSRect(0, layout.leadingOffset + layout.leadingSize - this._leadingDividerView.layoutAdjustment, width, this._leadingDividerView.hitSize);
        if (this._mainView !== null){
            this._mainView.frame = JSRect(0, layout.mainOffset, width, layout.mainSize);
        }
        this._trailingDividerView.frame = JSRect(0, layout.trailingOffset - this._trailingDividerView.layoutAdjustment - this._trailingDividerView.layoutSize, width, this._trailingDividerView.hitSize);
        if (this._trailingView !== null){
            this._trailingView.frame = JSRect(0, layout.trailingOffset, width, layout.trailingSize);
        }
    },

    _startingLocationInDivider: null,

    beginDeviderResize: function(divider, location){
        this._startingLocationInDivider = JSPoint(location);
        if (divider == this._leadingDividerView){
            this._previousLeadingSize = this._leadingSize;
            if (!this._leadingViewOpen){
                this._leadingSize = this._minimumLeadingSize;
            }
        }else{
            this._previousTrailingSize = this._trailingSize;
            if (!this._trailingViewOpen){
                this._trailingSize = this._minimumTrailingSize;
            }
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
        this._autosaveToUserDefaults();
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
    },

    // -------------------------------------------------------------------------
    // MARK: - Autosaving

    autosaveName: JSDynamicProperty('_autosaveName', null),

    setAutosaveName: function(autosaveName){
        this._autosaveName = autosaveName;
        this._loadAutosavedFromUserDefaults();
    },

    _autosaveToUserDefaults: function(){
        if (this.autosaveName === null){
            return;
        }
        JSUserDefaults.shared.setValueForKey({
            leadingSize: this._leadingSize,
            trailingSize: this._trailingSize,
            leadingOpen: this._leadingViewOpen,
            trailingOpen: this._trailingViewOpen
        }, this._autosaveName);
    },

    _loadAutosavedFromUserDefaults: function(){
        if (this.autosaveName === null){
            return;
        }
        var values = JSUserDefaults.shared.valueForKey(this.autosaveName);
        if (values !== null){
            this._leadingSize = values.leadingSize;
            this._trailingSize = values.trailingSize;
            this._leadingViewOpen = values.leadingOpen;
            this._trailingViewOpen = values.trailingOpen;
        }
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
        this.lineView.backgroundColor = JSColor.blackColor;
        this.addSubview(this.lineView);
    },

    setColor: function(color){
        this.lineView.backgroundColor = color;
    },

    getColor: function(){
        return this.lineView.backgroundColor;
    },

    layoutSubviews: function(){
        _UIDualPaneDividerView.$super.layoutSubviews.call(this);
        if (this._isVertical){
            this.lineView.frame = JSRect(0, (this.hitSize - this.layoutSize) / 2, this.bounds.size.width, this.layoutSize);
        }else{
            this.lineView.frame = JSRect((this.hitSize - this.layoutSize) / 2, 0, this.layoutSize, this.bounds.size.height);
        }
    },

    setVertical: function(isVertical){
        this._isVertical = isVertical;
        if (isVertical){
            this.cursor = UICursor.resizeUpDown;
        }else{
            this.cursor = UICursor.resizeLeftRight;
        }
        this.setNeedsLayout();
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