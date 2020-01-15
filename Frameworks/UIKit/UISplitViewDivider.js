// #import "UIView.js"
/* global JSClass, JSRect, JSColor, UICursor, JSReadOnlyProperty, JSDynamicProperty, JSPoint, UIView, UISplitViewDivider */
'use strict';

JSClass("UISplitViewDivider", UIView, {

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
        this.lineView.backgroundColor = JSColor.black;
        this.addSubview(this.lineView);
    },

    setColor: function(color){
        this.lineView.backgroundColor = color;
    },

    getColor: function(){
        return this.lineView.backgroundColor;
    },

    layoutSubviews: function(){
        UISplitViewDivider.$super.layoutSubviews.call(this);
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