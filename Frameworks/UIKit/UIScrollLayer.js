// #import "UIKit/UILayer.js"
/* global JSClass, UILayer, UIScrollLayer, UILayerAnimatedProperty, JSPoint, JSSize, JSRect, JSInsets */
'use strict';

JSClass("UIScrollLayer", UILayer, {

    contentInsets: UILayerAnimatedProperty(),
    contentOffset: UILayerAnimatedProperty(),
    contentSize: UILayerAnimatedProperty(),
    scrollVertically: true,
    scrollHorizontally: true,

    _didScroll: function(){
        if (this.delegate && this.delegate.scrollLayerDidScroll){
            this.delegate.scrollLayerDidScroll(this);
        }
    },

    setContentOffset: function(offset){
        if (!this.model.contentOffset.isEqual(offset)){
            this._addImplicitAnimationForKey('contentOffset');
            this.model.contentOffset = JSPoint(offset);
            this._updateBoundsForContentOffset();
            this.didChangeProperty('contentOffset');
            this._didScroll();
        }
    },

    _updateBoundsForContentOffset: function(){
        this.bounds = JSRect(JSPoint(this.model.contentOffset.x - this.contentInsets.left, this.model.contentOffset.y - this.contentInsets.top), this.model.bounds.size);
    },

    setContentInsets: function(insets){
        this._addImplicitAnimationForKey('contentInsets');
        this.model.contentInsets = JSInsets(insets);
        this._updateBoundsForContentOffset();
        this.didChangeProperty('contentInsets');
    },

    setContentSize: function(size){
        this._addImplicitAnimationForKey('contentSize');
        this.model.contentSize = JSSize(size);
        var maxOffset = JSPoint(
            Math.max(0, this.model.contentSize.width + this.contentInsets.left + this.contentInsets.right - this.model.bounds.size.width),
            Math.max(0, this.model.contentSize.height + this.contentInsets.top + this.contentInsets.bottom - this.model.bounds.size.height)
        );
        if (maxOffset.x > this.model.contentOffset.x || maxOffset.y > this.model.contentOffset.y){
            this.contentOffset = JSPoint(Math.min(maxOffset.x, this.model.contentOffset.x), Math.min(maxOffset.y, this.model.contentOffset.y));
        }
        this.didChangeProperty('contentSize');
    }

});

UIScrollLayer.Properties = Object.create(UILayer.Properties);
UIScrollLayer.Properties.contentInsets = JSInsets.Zero;
UIScrollLayer.Properties.contentOffset = JSPoint.Zero;
UIScrollLayer.Properties.contentSize = JSInsets.Zero;