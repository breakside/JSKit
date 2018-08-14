// #import "UIKit/UIView.js"
/* global JSClass, UIView, UIStackView, JSSize, JSRect, JSDynamicProperty, JSInsets */
'use strict';

JSClass("UIStackView", UIView, {

    initWithFrame: function(frame){
        UIStackView.$super.initWithFrame.call(this, frame);
        this._commonStackViewInit();
    },

    initWithSpec: function(spec, values){
        UIStackView.$super.initWithSpec.call(this, spec, values);
        this._commonStackViewInit();
        if ('contentInsets' in values){
            this._contentInsets = JSInsets.apply(undefined, values.contentInsets.parseNumberArray());
        }
        if ('viewSpacing' in values){
            this._viewSpacing = spec.resolvedValue(values.viewSpacing);
        }
    },

    _commonStackViewInit: function(){
        this._contentInsets = JSInsets.Zero;
    },

    contentInsets: JSDynamicProperty('_contentInsets', null),

    setContentInsets: function(contentInsets){
        this._contentInsets = JSInsets(contentInsets);
        this.setNeedsLayout();
    },

    viewSpacing: JSDynamicProperty('_viewSpacing', 0),

    setViewSpacing: function(viewSpacing){
        this._viewSpacing = viewSpacing;
        this.setNeedsLayout();
    },

    sizeToFitSize: function(size){
        var view;
        var h = this._contentInsets.top + this._contentInsets.bottom;
        var w = this._contentInsets.left + this._contentInsets.right;
        var subviewSize = JSSize(size.width - w, size.height);
        for (var i = 0, l = this.subviews.length; i < l; ++i){
            view = this.subviews[i];
            view.sizeToFitSize(subviewSize);
            if (!view.hidden){
                h += view.frame.size.height + this._viewSpacing;
            }
        }
        if (i > 0){
            h -= this._viewSpacing;
        }
        this.bounds = JSRect(0, 0, size.width, h);
    },

    layoutSubviews: function(){
        var y = this._contentInsets.top;
        var x = this._contentInsets.left;
        var w = this.bounds.size.width - this._contentInsets.left - this._contentInsets.right;
        var view;
        for (var i = 0, l = this.subviews.length; i < l; ++i){
            view = this.subviews[i];
            view.frame = JSRect(x, y, w, view.frame.size.height);
            if (!view.hidden){
                y += view.frame.size.height + this._viewSpacing;
            }
        }
    },

    subviewsDidChange: function(){
        this.setNeedsLayout();
    }

});