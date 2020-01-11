// #import "UIScrollView.js"
// #import "UICursor.js"
/* global JSClass, JSColor, JSRect, JSSize, JSPoint, JSReadOnlyProperty, JSDynamicProperty, UIView, UICursor, UIScrollView, UIBrowserView, _UIBrowserDividerView */
'use strict';

JSClass("UIBrowserView", UIScrollView, {

    // --------------------------------------------------------------------
    // MARK: - Creating A Browser View

    initWithFrame: function(frame){
        UIBrowserView.$super.initWithFrame.call(this, frame);
        this._commonBrowserInit();
    },

    initWithSpec: function(spec){
        UIBrowserView.$super.initWithSpec.call(this, spec);
        if (spec.containsKey('dividerSize')){
            this._dividerSize = spec.valueForKey("dividerSize");
        }
        if (spec.containsKey('dividerColor')){
            this._dividerColor = spec.valueForKey("dividerColor", JSColor);
        }
        this._commonBrowserInit();
    },

    _commonBrowserInit: function(){
        this._views = [];
        this._dividerViews = [];
        this.scrollsVertically = false;
        if (this._dividerColor === null){
            this._dividerColor = JSColor.initWithWhite(0, 1-224/255.0);
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Column Views

    _views: null,
    _dividerViews: null,

    dividerSize: JSDynamicProperty('_dividerSize', 1),
    dividerColor: JSDynamicProperty('_dividerColor', null),

    pushView: function(view){
        this._views.push(view);
        this.contentView.addSubview(view);
        var divider = this._createDividerView();
        this._dividerViews.push(divider);
        this.contentView.addSubview(divider);
        this.setNeedsLayout();
        this.layoutIfNeeded();
        this.contentOffset = JSPoint(this.contentSize.width - this.contentView.bounds.size.width, 0);
    },

    popView: function(){
        this.popViews(1);
    },

    popViews: function(count){
        var view;
        var divider;
        while (this._views.length > 0 && count > 0){
            view = this._views.pop();
            divider = this._dividerViews.pop();
            view.removeFromSuperview();
            divider.removeFromSuperview();
            --count;
        }
    },

    setDividerSize: function(dividerSize){
        this._dividerSize = dividerSize;
        this.setNeedsLayout();
    },

    setDividerColor: function(dividerColor){
        this._dividerColor = dividerColor;
        for (var i = 0, l = this._dividerViews.length; i < l; ++i){
            this._dividerViews[i].color = dividerColor;
        }
    },

    _createDividerView: function(){
        var divider = _UIBrowserDividerView.initWithSizes(Math.max(5, this._dividerSize), this._dividerSize);
        divider._browserView = this;
        divider.color = this._dividerColor;
        return divider;
    },

    beginDeviderResize: function(divider, location){
        // TODO: resize
    },

    dividerDragged: function(divider, location){
        // TODO: resize
    },

    endDividerResize: function(divider){
        // TODO: resize
    },

    // --------------------------------------------------------------------
    // MARK: - Layout

    layoutSubviews: function(){
        UIBrowserView.$super.layoutSubviews.call(this);
        var view;
        var divider;
        var x = 0;
        var h = this.contentView.bounds.size.height;
        for (var i = 0, l = this._views.length; i < l; ++i){
            view = this._views[i];
            divider = this._dividerViews[i];
            view.frame = JSRect(x, 0, view.frame.size.width, h);
            x += view.frame.size.width;
            divider.frame = JSRect(x, 0, this._dividerSize, h);
            x += this._dividerSize;
        }
        this.contentSize = JSSize(Math.max(x, this.contentOffset.x + this.contentView.bounds.size.width), h);
    }

});


JSClass("_UIBrowserDividerView", UIView, {

    layoutSize: 1,
    hitSize: 5,
    lineView: null,
    layoutAdjustment: JSReadOnlyProperty(),
    color: JSDynamicProperty(),
    _browserView: null,

    initWithSizes: function(layoutSize, hitSize){
        this.init();
        this.lineView = UIView.init();
        this.hitSize = hitSize;
        this.lineView.backgroundColor = JSColor.blackColor;
        this.addSubview(this.lineView);
        this.cursor = UICursor.resizeLeftRight;
    },

    setColor: function(color){
        this.lineView.backgroundColor = color;
    },

    getColor: function(){
        return this.lineView.backgroundColor;
    },

    layoutSubviews: function(){
        _UIBrowserDividerView.$super.layoutSubviews.call(this);
        this.lineView.frame = JSRect((this.hitSize - this.layoutSize) / 2, 0, this.layoutSize, this.bounds.size.height);
    },

    getLayoutAdjustment: function(){
        return (this.hitSize - this.layoutSize) / 2;
    },

    mouseDown: function(event){
        this.cursor.push();
        this._browserView.beginDeviderResize(this, event.locationInView(this));
    },

    mouseUp: function(event){
        this.cursor.pop();
        this._browserView.endDividerResize(this);
    },

    mouseDragged: function(event){
        this._browserView.dividerDragged(this, event.locationInView(this._browserView));
    }
});