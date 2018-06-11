// #import "UIKit/UIControl.js"
/* global JSClass, UIView, JSDynamicProperty, JSReadOnlyProperty, UIScroller, UIControl, JSRect, UIControlStyler, UIScrollerStyler, UIScrollerDefaultStyler, JSInsets, JSSize, JSPoint, JSColor */
'use strict';

JSClass("UIScroller", UIControl, {

    knob: JSReadOnlyProperty('_knob', null),
    value: JSDynamicProperty('_value', 0),
    knobProportion: JSDynamicProperty('_knobProportion', 1),
    direction: JSReadOnlyProperty('_direction', 0),

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
        this._styler.initializeControl(this);
    },

    setValue: function(value){
        if (value !== this._value){
            this._value = value;
            this.setNeedsLayout();
        }
    },

    mouseDown: function(event){
    },

    mouseDragged: function(event){
    },

    mouseUp: function(event){
    },

    mouseEntered: function(event){
    },

    mouseExited: function(event){
    }

});

UIScroller.Direction = {
    vertical: 0,
    horizontal: 1
};

JSClass("UIScrollerStyler", UIControlStyler, {

    // NOTE: insets and cap sizes are always specified as if the styler is operating on a vertical scroller
    knobInsets: null,
    knobCapSizes: null

});

JSClass("UIScrollerDefaultStyler", UIScrollerStyler, {

    collapsedSize: 7,
    expandedSize: 15,

    init: function(){
        this.knobInsets = JSInsets(1, 1);
        var maxKnobWidth = this.expandedSize - this.knobInsets.left - this.knobInsets.right;
        this.knobCapSizes = JSInsets(Math.ceil(maxKnobWidth / 2.0));
    },

    initializeControl: function(scroller){
        scroller.knob.backgroundColor = JSColor.blackColor().colorWithAlpha(0.6);
        if (scroller.direction === UIScroller.Direction.vertical){
            scroller.bounds = JSRect(0, 0, this.collapsedSize, 0);
        }else{
            scroller.bounds = JSRect(0, 0, 0, this.collapsedSize);
        }
    },

    _getVerticalTrackSize: function(scroller){
        if (scroller._direction === UIScroller.Direction.vertical){
            return JSSize(scroller.bounds.size.width, scroller.bounds.size.height);
        }
        return JSSize(scroller.bounds.size.height, scroller.bounds.size.width);
    },

    _getVerticalKnobFrame: function(scroller){
        var trackSize = this._getVerticalTrackSize(scroller);
        trackSize.height -= this.knobInsets.top + this.knobInsets.bottom;
        var knobSize = JSSize(trackSize.width - this.knobInsets.left - this.knobInsets.right, trackSize.height * scroller._knobProportion);
        var minKobHeight = this.knobCapSizes.top + this.knobCapSizes.bottom;
        if (knobSize.height < minKobHeight){
            knobSize.height = minKobHeight;
        }
        var minY = this.knobInsets.top;
        var maxY = minY + trackSize.height - knobSize.height;
        var y = minY + (maxY - minY) * scroller._value;
        return JSRect(
            this.knobInsets.left,
            y,
            knobSize.width,
            knobSize.height
        );
    },

    _getKnobFrame: function(control){
        var verticalFrame = this._getVerticalKnobFrame(control);
        if (control.direction === UIScroller.Direction.vertical){
            return verticalFrame;
        }
        return JSRect(
            verticalFrame.origin.y,
            verticalFrame.origin.x,
            verticalFrame.size.height,
            verticalFrame.size.width
        );
    },

    layoutControl: function(control){
        control._knob.frame = this._getKnobFrame(control);
        control._knob.cornerRadius = control.direction === UIScroller.Direction.vertical ? control._knob.frame.size.width / 2.0 : control._knob.frame.size.height / 2.0;
    }

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