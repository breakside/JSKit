// #import "UIControl.js"
// #import "UIViewPropertyAnimator.js"
// #import "UIDevice.js"
'use strict';

JSClass("UIScroller", UIControl, {

    knob: JSReadOnlyProperty('_knob', null),
    value: JSDynamicProperty('_value', 0),
    knobProportion: JSDynamicProperty('_knobProportion', 1),
    direction: JSReadOnlyProperty('_direction', 0),
    floats: JSReadOnlyProperty(),

    initWithDirection: function(direction, styler){
        this._direction = direction;
        if (styler){
            this.initWithStyler(styler);
        }else{
            this.init();
        }
    },

    initWithSpec: function(spec){
        UIScroller.$super.initWithSpec.call(this, spec);
        if (spec.containsKey('direction')){
            this._direction = spec.valueForKey("direction", UIScroller.Direction);
        }
    },

    commonUIControlInit: function(){
        UIScroller.$super.commonUIControlInit.call(this);
        this._knob = UIView.init();
        this.addSubview(this._knob);
        if (this._styler === null){
            this._styler = UIScroller.Styler.lightContent;
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

    setKnobProportion: function(knobProportion){
        if (knobProportion !== this._knobProportion){
            this._knobProportion = knobProportion;
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
        this.sendActionsForEvents(UIControl.Event.primaryAction | UIControl.Event.valueChanged);
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
        this.sendActionsForEvents(UIControl.Event.primaryAction | UIControl.Event.valueChanged);
    },

    _pageAfter: function(){
        this.value = Math.min(1, this._value + this._knobProportion);
        this.sendActionsForEvents(UIControl.Event.primaryAction | UIControl.Event.valueChanged);
    },

    getFloats: function(){
        return this._styler.floats;
    },

    knobActive: JSReadOnlyProperty(null, null, 'isKnobActive'),

    isKnobActive: function(){
        return (this._state & UIScroller.State.knobActive) === UIScroller.State.knobActive;
    },

    _setKnobActive: function(isKnobActive){
        this.toggleStates(UIScroller.State.knobActive, isKnobActive);
    }

});

UIScroller.State = Object.create(UIControl.State, {
    knobActive: {value: UIControl.State.firstUserState},
    firstUserState: {value: UIControl.State.firstUserState << 1, configurable: true}
});

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
    knobColor: null,
    knobGradient: null,
    trackColor: null,
    trackGradient: null,
    trackBorderColor: null,
    trackBorderWidth: 1,

    init: function(){
        this.knobInsets = JSInsets(2, 3, 2, 2);
        var maxKnobWidth = this.expandedSize - this.knobInsets.left - this.knobInsets.right;
        this.minimumKnobLength = maxKnobWidth * 2;
        this.trackColor = JSColor.initWithWhite(0, 0.1);
        this.trackBorderColor = JSColor.initWithWhite(0, 0.15);
        this.knobColor = JSColor.initWithWhite(0, 0.6);
        if (UIDevice.shared.primaryPointerType === UIUserInterface.PointerType.touch){
            this.collapsedSize = 8;
        }
    },

    setExpanded: function(scroller, expanded){
        if (expanded === scroller.stylerProperties.expanded){
            return;
        }
        scroller.stylerProperties.expanded = expanded;
        if (expanded){
            var animator = UIViewPropertyAnimator.initWithDuration(0.1);
            var styler = this;
            animator.addAnimations(function(){
                styler._layoutTrackAndNobIndicator(scroller);
                scroller.stylerProperties.trackLayer.alpha = 1;
            });
            animator.start();
        }else{
            this._layoutTrackAndNobIndicator(scroller);
            scroller.stylerProperties.trackLayer.alpha = 0;
        }
    },

    initializeControl: function(scroller){
        scroller.stylerProperties.hideAnimator = null;
        scroller.stylerProperties.trackLayer = UILayer.init();
        scroller.layer.insertSublayerBelowSibling(scroller.stylerProperties.trackLayer, scroller._knob.layer);
        scroller.stylerProperties.trackLayer.backgroundColor = this.trackColor;
        scroller.stylerProperties.trackLayer.borderColor = this.trackBorderColor;
        scroller.stylerProperties.trackLayer.borderWidth = this.trackBorderWidth;
        scroller.stylerProperties.trackLayer.maskedBorders = scroller.direction === UIScroller.Direction.vertical ? UILayer.Sides.minX : UILayer.Sides.minY;
        scroller.stylerProperties.knobIndicatorLayer = UILayer.init();
        scroller.stylerProperties.knobIndicatorLayer.backgroundColor = this.knobColor;
        scroller.stylerProperties.knobIndicatorLayer.cornerRadius = this.expandedSize;
        scroller._knob.layer.addSublayer(scroller.stylerProperties.knobIndicatorLayer);
        if (scroller.direction === UIScroller.Direction.vertical){
            scroller.bounds = JSRect(0, 0, this.expandedSize, 0);
            scroller.stylerProperties.knobIndicatorLayer.backgroundGradient = this.knobGradient;
            scroller.stylerProperties.trackLayer.backgroundGradient = this.trackGradient;
        }else{
            if (this.knobGradient !== null){
                scroller.stylerProperties.knobIndicatorLayer.backgroundGradient = this.knobGradient.rotated(-Math.PI / 2);
            }
            if (this.trackGradient !== null){
                scroller.stylerProperties.trackLayer.backgroundGradient = this.trackGradient.rotated(-Math.PI / 2);
            }
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
            verticalFrame.origin.x,
            verticalFrame.size.height,
            verticalFrame.size.width
        );
    },

    _layoutTrackAndNobIndicator: function(scroller){
        if (scroller.stylerProperties.expanded){
            scroller.stylerProperties.trackLayer.frame = scroller.bounds;
            if (scroller.direction === UIScroller.Direction.vertical){
                scroller.stylerProperties.knobIndicatorLayer.frame = scroller._knob.bounds.rectWithInsets(this.knobInsets);
            }else{
                scroller.stylerProperties.knobIndicatorLayer.frame = scroller._knob.bounds.rectWithInsets(this.knobInsets.left, this.knobInsets.top, this.knobInsets.right, this.knobInsets.bottom);
            }
        }else{
            var knobInsets = JSInsets(this.knobInsets);
            knobInsets.left += this.expandedSize - this.collapsedSize;
            if (scroller.direction === UIScroller.Direction.vertical){
                scroller.stylerProperties.trackLayer.frame = scroller.bounds.rectWithInsets(0, this.expandedSize - this.collapsedSize, 0, 0);
                scroller.stylerProperties.knobIndicatorLayer.frame = scroller._knob.bounds.rectWithInsets(knobInsets);
            }else{
                scroller.stylerProperties.trackLayer.frame = scroller.bounds.rectWithInsets(this.expandedSize - this.collapsedSize, 0, 0, 0);
                scroller.stylerProperties.knobIndicatorLayer.frame = scroller._knob.bounds.rectWithInsets(knobInsets.left, knobInsets.top, knobInsets.right, knobInsets.bottom);
            }
        }
    },

    layoutControl: function(scroller){
        scroller._knob.frame = this._getKnobFrame(scroller);
        scroller._knob.cornerRadius = scroller.direction === UIScroller.Direction.vertical ? scroller._knob.frame.size.width / 2.0 : scroller._knob.frame.size.height / 2.0;
        this._layoutTrackAndNobIndicator(scroller);
        this._cancelHide(scroller);
        if (!scroller.stylerProperties.expanded){
            if (scroller.over){
                this.setExpanded(scroller, true);
            }else{
                this._hideAnimated(scroller);
            }
        }else{
            if (!scroller.over){
                this._hideAnimated(scroller);
            }
        }
    },

    updateControl: function(scroller){
        var expanded = scroller.active || (scroller.over && scroller.layer.presentation.alpha > 0);
        if (expanded){
            this._cancelHide(scroller);
            this.setExpanded(scroller, true);
        }else if (scroller.stylerProperties.expanded){
            this._hideAnimated(scroller);
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
        if (scroller.stylerProperties.hideAnimator !== null){
            return;
        }
        if (scroller.hidden){
            return;
        }
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

UIScroller.Styler = Object.defineProperties({}, {
    lightContent: {
        configurable: true,
        get: function UIScroller_getLightContentStyler(){
            var styler = UIScrollerDefaultStyler.init();
            Object.defineProperty(this, 'lightContent', {writable: true, value: styler});
            return styler;
        },
        set: function UIScroller_setLightContentStyler(styler){
            Object.defineProperty(this, 'lightContent', {writable: true, value: styler});
        }
    },
    darkContent: {
        configurable: true,
        get: function UIScroller_getDarkContentStyler(){
            var styler = UIScrollerDefaultStyler.init();
            styler.trackColor = JSColor.initWithWhite(1, 0.05);
            styler.trackBorderColor = JSColor.initWithWhite(1, 0.15);
            styler.knobColor = JSColor.initWithWhite(1, 0.6);
            Object.defineProperty(this, 'darkContent', {writable: true, value: styler});
            return styler;
        },
        set: function UIScroller_setDarkContentStyler(styler){
            Object.defineProperty(this, 'darkContent', {writable: true, value: styler});
        }
    }
});