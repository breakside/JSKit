// #import "UIKit/UIControl.js"
// #import "UIKit/UIViewPropertyAnimator.js"
/* global JSClass, UIView, JSDynamicProperty, JSReadOnlyProperty, UIScroller, UIControl, JSRect, UIControlStyler, UIScrollerStyler, UIScrollerDefaultStyler, JSInsets, JSSize, JSPoint, JSColor, UILayer, JSConstraintBox, JSTimer, UIViewPropertyAnimator */
'use strict';

JSClass("UIScroller", UIControl, {

    knob: JSReadOnlyProperty('_knob', null),
    value: JSDynamicProperty('_value', 0),
    knobProportion: JSDynamicProperty('_knobProportion', 1),
    direction: JSReadOnlyProperty('_direction', 0),
    floats: JSReadOnlyProperty(),

    initWithDirection: function(direction){
        this._direction = direction;
        this.init();
    },

    initWithSpec: function(spec, values){
        UIScroller.$super.initWithSpec.call(this, spec, values);
        if ('direction' in values){
            this._direction = spec.resolvedValue(values.direction);
        }
    },

    commonUIControlInit: function(){
        UIScroller.$super.commonUIControlInit.call(this);
        this._knob = UIView.init();
        this.addSubview(this._knob);
        if (this._styler === null){
            this._styler = UIScroller.defaultStyler;
        }
        this.hasOverState = this._styler.showsOverState;
        this._styler.initializeControl(this);
    },

    setValue: function(value){
        if (value !== this._value){
            this._value = value;
            this.setNeedsLayout();
        }
    },

    _hitPart: function(location){
        if (this._direction === UIScroller.Direction.vertical){
            if (location.y < this._knob.frame.origin.y){
                return UIScroller.Part.before;
            }
            if (location.y < this._knob.frame.origin.y + this._knob.frame.size.height){
                return UIScroller.Part.knob;
            }
            return UIScroller.Part.after;
        }else{
            if (location.x < this._knob.frame.origin.x){
                return UIScroller.Part.before;
            }
            if (location.x < this._knob.frame.origin.x + this._knob.frame.size.width){
                return UIScroller.Part.knob;
            }
            return UIScroller.Part.after;
        }
    },

    mouseDown: function(event){
        var location = event.locationInView(this);
        var part = this._hitPart(location);
        this.active = true;
        switch (part){
            case UIScroller.Part.knob:
                this._setKnobActive(true);
                this._beginScrubbing(location);
                break;
            case UIScroller.Part.before:
            case UIScroller.Part.after:
                this._beginPaging(location);
                break;
        }
    },

    mouseDragged: function(event){
        var location = event.locationInView(this);
        if (this.knobActive){
            this._updateScrubbing(location);
        }else{
            this._updatePaging(location);
        }
    },

    mouseUp: function(event){
        if (this.knobActive){
            this._endScrubbing();
            this._setKnobActive(false);
        }else{
            this._endPaging();
        }
        this.active = false;
    },

    _scrubbingDelta: 0,
    _pagingTimer: null,
    _pagingLocation: null,

    _beginScrubbing: function(location){
        if (this._direction === UIScroller.Direction.vertical){
            this._scrubbingDelta = location.y - this._knob.frame.origin.y;
        }else{
            this._scrubbingDelta = location.x - this._knob.frame.origin.x;
        }
    },

    _updateScrubbing: function(location){
        var minOrigin = 0;
        var maxOrigin;
        var origin;
        if (this._direction === UIScroller.Direction.vertical){
            origin = location.y - this._scrubbingDelta;
            maxOrigin = this.bounds.size.height - this._knob.frame.size.height;
        }else{
            origin = location.x - this._scrubbingDelta;
            maxOrigin = this.bounds.size.width - this._knob.frame.size.width;
        }
        this.value = Math.min(1, Math.max(0, (origin / maxOrigin)));
        this.sendActionsForEvent(UIControl.Event.valueChanged);
    },

    _endScrubbing: function(){
        this._scrubbingDelta = 0;
    },

    _beginPaging: function(location){
        this._pagingLocation = location;
        this._pagingTimer = JSTimer.scheduledTimerWithInterval(0.4, this._repeatPaging, this);
        this._page();
    },

    _updatePaging: function(location){
        this._pagingLocation = location;
        if (this.containsPoint(location)){
            if (this._pagingTimer === null){
                this._repeatPaging();
            }
        }else{
            if (this._pagingTimer !== null){
                this._endPaging();
            }
        }
    },

    _repeatPaging: function(){
        this._pagingTimer = JSTimer.scheduledRepeatingTimerWithInterval(0.05, this._page, this);
    },

    _endPaging: function(){
        if (this._pagingTimer !== null){
            this._pagingTimer.invalidate();
            this._pagingTimer = null;
            this._pagingLocation = null;
        }
    },

    _page: function(){
        var part = this._hitPart(this._pagingLocation);
        switch (part){
            case UIScroller.Part.knob:
                break;
            case UIScroller.Part.before:
                this._pageBefore();
                break;
            case UIScroller.Part.after:
                this._pageAfter();
                break;
        }
    },

    _pageBefore: function(){
        this.value = Math.max(0, this._value - this._knobProportion);
        this.sendActionsForEvent(UIControl.Event.valueChanged);
    },

    _pageAfter: function(){
        this.value = Math.min(1, this._value + this._knobProportion);
        this.sendActionsForEvent(UIControl.Event.valueChanged);
    },

    getFloats: function(){
        return this._styler.floats;
    },

    knobActive: JSReadOnlyProperty(null, null, 'isKnobActive'),

    isKnobActive: function(){
        return (this._state & UIScroller.State.knobActive) === UIScroller.State.knobActive;
    },

    _setKnobActive: function(isKnobActive){
        this._toggleState(UIScroller.State.knobActive, isKnobActive);
    }

});

UIScroller.State = {
    knobActive: UIControl.State.firstUserState,
};

UIScroller.Direction = {
    vertical: 0,
    horizontal: 1
};

UIScroller.Part = {
    none: 0,
    knob: 1,
    before: 2,
    after: 3
};

JSClass("UIScrollerStyler", UIControlStyler, {

    floats: false,

});

JSClass("UIScrollerDefaultStyler", UIScrollerStyler, {

    showsOverState: true,
    floats: true,
    collapsedSize: 12,
    expandedSize: 16,
    // NOTE: insets and cap sizes are always specified as if the styler is operating on a vertical scroller
    knobInsets: null,
    minimumKnobLength: null,

    init: function(){
        this.knobInsets = JSInsets(2, 3, 2, 2);
        var maxKnobWidth = this.expandedSize - this.knobInsets.left - this.knobInsets.right;
        this.minimumKnobLength = maxKnobWidth * 2;
    },

    setExpanded: function(scroller, expaneded){
        if (expaneded === scroller.stylerProperties.expaneded){
            return;
        }
        scroller.stylerProperties.expaneded = expaneded;
        var constraintBox = this.knobInsets.constraintBox();
        if (expaneded){
            scroller.backgroundColor = JSColor.initWithWhite(1, 0.8);
            scroller.borderColor = JSColor.initWithWhite(0, 0.15);
            scroller.borderWidth = 1.0;
            scroller.maskedBorders = scroller.direction === UIScroller.Direction.vertical ? UILayer.Sides.minX : UILayer.Sides.minY;
        }else{
            constraintBox.left += this.expandedSize - this.collapsedSize;
            scroller.backgroundColor = null;
            scroller.borderWidth = 0;
        }
        scroller.stylerProperties.knobIndicatorLayer.constraintBox = constraintBox;
    },

    initializeControl: function(scroller){
        scroller.stylerProperties.hideAnimator = null;
        scroller.stylerProperties.knobIndicatorLayer = UILayer.init();
        scroller.stylerProperties.knobIndicatorLayer.backgroundColor = JSColor.blackColor().colorWithAlpha(0.6);
        scroller.stylerProperties.knobIndicatorLayer.constraintBox = JSConstraintBox({top: this.knobInsets.top, left: this.knobInsets.left, right: this.knobInsets.right, bottom: this.knobInsets.bottom});
        scroller.stylerProperties.knobIndicatorLayer.cornerRadius = this.expandedSize;
        scroller._knob.layer.addSublayer(scroller.stylerProperties.knobIndicatorLayer);
        if (scroller.direction === UIScroller.Direction.vertical){
            scroller.bounds = JSRect(0, 0, this.expandedSize, 0);
        }else{
            scroller.bounds = JSRect(0, 0, 0, this.expandedSize);
        }
        this.setExpanded(scroller, false);
    },

    _getVerticalTrackSize: function(scroller){
        if (scroller._direction === UIScroller.Direction.vertical){
            return JSSize(this.expandedSize, scroller.bounds.size.height);
        }
        return JSSize(this.expandedSize, scroller.bounds.size.width);
    },

    _getVerticalKnobFrame: function(scroller){
        var trackSize = this._getVerticalTrackSize(scroller);
        var knobSize = JSSize(trackSize.width, trackSize.height * scroller._knobProportion);
        if (knobSize.height < this.minimumKnobLength){
            knobSize.height = this.minimumKnobLength;
        }
        var minY = 0;
        var maxY = minY + trackSize.height - knobSize.height;
        var y = minY + (maxY - minY) * scroller._value;
        return JSRect(
            0,
            y,
            knobSize.width,
            knobSize.height
        );
    },

    _getKnobFrame: function(scroller){
        var verticalFrame = this._getVerticalKnobFrame(scroller);
        if (scroller.direction === UIScroller.Direction.vertical){
            return verticalFrame;
        }
        return JSRect(
            verticalFrame.origin.y,
            scroller.bounds.size.height,
            verticalFrame.size.height,
            verticalFrame.size.width
        );
    },

    layoutControl: function(scroller){
        scroller._knob.frame = this._getKnobFrame(scroller);
        scroller._knob.cornerRadius = scroller.direction === UIScroller.Direction.vertical ? scroller._knob.frame.size.width / 2.0 : scroller._knob.frame.size.height / 2.0;
        this._cancelHide(scroller);
        if (!scroller.stylerProperties.expanded){
            if (scroller.over){
                this.setExpanded(scroller, true);
            }else{
                this._hideAnimated(scroller);
            }
        }
    },

    updateControl: function(scroller){
        var expanded = scroller.active || (scroller.over && scroller.layer.presentation.alpha > 0);
        if (expanded){
            this._cancelHide(scroller);
            this.setExpanded(scroller, true);
        }else if (!scroller.stylerProperties.expanded){
            this._hideAnimated(scroller);
        }
        if (scroller.knobActive){
            scroller.stylerProperties.knobIndicatorLayer.backgroundColor = JSColor.redColor().colorWithAlpha(0.6);
        }else{
            scroller.stylerProperties.knobIndicatorLayer.backgroundColor = JSColor.blackColor().colorWithAlpha(0.6);
        }
    },

    _cancelHide: function(scroller){
        if (scroller.stylerProperties.hideAnimator !== null){
            scroller.stylerProperties.hideAnimator.stop();
            scroller.stylerProperties.hideAnimator = null;
        }
        scroller.alpha = 1.0;
    },

    _hideAnimated: function(scroller){
        scroller.stylerProperties.hideAnimator = UIViewPropertyAnimator.initWithDuration(0.3);
        scroller.stylerProperties.hideAnimator.addAnimations(function(){
            scroller.alpha = 0.0;
        });
        var styler = this;
        scroller.stylerProperties.hideAnimator.addCompletion(function(){
            scroller.stylerProperties.hideAnimator = null;
            styler.setExpanded(scroller, false);
        });
        scroller.stylerProperties.hideAnimator.start(1.0);
    },

    _hideAnimator: null

});

Object.defineProperties(UIScrollerDefaultStyler, {
    shared: {
        configurable: true,
        get: function UIScrollerDefaultStyler_getShared(){
            var shared = UIScrollerDefaultStyler.init();
            Object.defineProperty(this, 'shared', {value: shared});
            return shared;
        }
    }
});

Object.defineProperties(UIScroller, {
    defaultStyler: {
        configurable: true,
        get: function UIScroller_getDefaultStyler(){
            Object.defineProperty(UIScroller, 'defaultStyler', {writable: true, value: UIScrollerDefaultStyler.shared});
            return UIScroller.defaultStyler;
        },
        set: function UIScroller_setDefaultStyler(defaultStyler){
            Object.defineProperty(UIScroller, 'defaultStyler', {writable: true, value: defaultStyler});
        }
    }
});