// #import "UIView.js"
'use strict';

JSClass("UIStackView", UIView, {

    initWithFrame: function(frame){
        UIStackView.$super.initWithFrame.call(this, frame);
        this._commonStackViewInit();
    },

    initWithSpec: function(spec){
        UIStackView.$super.initWithSpec.call(this, spec);
        this._commonStackViewInit();
        if (spec.containsKey('contentInsets')){
            this._contentInsets = spec.valueForKey("contentInsets", JSInsets);
        }
        if (spec.containsKey('viewSpacing')){
            this._viewSpacing = spec.valueForKey("viewSpacing");
        }
        if (spec.containsKey('axis')){
            this._axis = spec.valueForKey("axis", UIStackView.Axis);
        }
        if (spec.containsKey('distribution')){
            this._distribution = spec.valueForKey("distribution", UIStackView.Distribution);
        }
    },

    _commonStackViewInit: function(){
        this._contentInsets = JSInsets.Zero;
    },

    axis: JSDynamicProperty('_axis', 0),

    setAxis: function(axis){
        this._axis = axis;
        this.setNeedsLayout();
    },

    distribution: JSDynamicProperty('_distribution', 0),

    setDistribution: function(distribution){
        this._distribution = distribution;
        this.setNeedsLayout();
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

    sizeToFit: function(){
        if (this._axis === UIStackView.Axis.horizontal){
            this._sizeToFitSizeHorizontally(JSSize(Number.MAX_VALUE, this.bounds.size.height));
        }else{
            this._sizeToFitSizeVertically(JSSize(this.bounds.size.width, Number.MAX_VALUE));
        }
    },

    sizeToFitSize: function(size){
        if (this._axis === UIStackView.Axis.horizontal){
            this._sizeToFitSizeHorizontally(size);
        }else{
            this._sizeToFitSizeVertically(size);
        }
    },

    _sizeToFitSizeVertically: function(size){
        var view;
        var h = this._contentInsets.top + this._contentInsets.bottom;
        var w = this._contentInsets.left + this._contentInsets.right;
        var subviewSize = JSSize(size.width - w, size.height - h);
        var subviewWidth = 0;
        for (var i = 0, l = this.subviews.length; i < l; ++i){
            view = this.subviews[i];
            view.sizeToFitSize(subviewSize);
            if (!view.hidden){
                h += view.frame.size.height + this._viewSpacing;
                if (view.frame.size.width > subviewWidth){
                    subviewWidth = view.frame.size.width;
                }
            }
        }
        if (i > 0){
            h -= this._viewSpacing;
        }
        this.bounds = JSRect(0, 0, size.width > 0 && size.width < Number.MAX_VALUE ? size.width : subviewWidth + w, h);
    },

    _sizeToFitSizeHorizontally: function(size){
        var view;
        var h = this._contentInsets.top + this._contentInsets.bottom;
        var w = this._contentInsets.left + this._contentInsets.right;
        var subviewSize = JSSize(size.width - w, size.height - h);
        var subviewHeight = 0;
        for (var i = 0, l = this.subviews.length; i < l; ++i){
            view = this.subviews[i];
            view.sizeToFitSize(subviewSize);
            if (!view.hidden){
                w += view.frame.size.width + this._viewSpacing;
                if (view.frame.size.height > subviewHeight){
                    subviewHeight = view.frame.size.height;
                }
            }
        }
        if (i > 0){
            w -= this._viewSpacing;
        }
        this.bounds = JSRect(0, 0, w, size.height > 0 && size.height < Number.MAX_VALUE ? size.height : subviewHeight);
    },

    layoutSubviews: function(){
        if (this._axis === UIStackView.Axis.horizontal){
            this._layoutSubviewsHorizontally();
        }else{
            this._layoutSubviewsVertically();
        }
    },

    _layoutSubviewsVertically: function(){
        var y = this._contentInsets.top;
        var x = this._contentInsets.left;
        var w = this.bounds.size.width - this._contentInsets.left - this._contentInsets.right;
        var i, l;
        var numberOfVisibleSubviews = 0;
        var view;
        for (i = 0, l = this.subviews.length; i < l; ++i){
            view = this.subviews[i];
            if (!view.hidden){
                ++numberOfVisibleSubviews;
            }
        }
        var h = (this.bounds.size.height - this._contentInsets.top - this._contentInsets.bottom - this._viewSpacing * (numberOfVisibleSubviews - 1)) / numberOfVisibleSubviews;
        for (i = 0, l = this.subviews.length; i < l; ++i){
            view = this.subviews[i];
            switch (this.distribution){
                case UIStackView.Distribution.equal:
                    view.frame = JSRect(x, y, w, h);
                    break;
                default:
                    view.frame = JSRect(x, y, w, view.frame.size.height);
                    break;
            }
            if (!view.hidden){
                y += view.frame.size.height + this._viewSpacing;
            }
        }
    },

    _layoutSubviewsHorizontally: function(){
        var y = this._contentInsets.top;
        var x = this._contentInsets.left;
        var h = this.bounds.size.height - this._contentInsets.top - this._contentInsets.bottom;
        var i, l;
        var numberOfVisibleSubviews = 0;
        var view;
        for (i = 0, l = this.subviews.length; i < l; ++i){
            view = this.subviews[i];
            if (!view.hidden){
                ++numberOfVisibleSubviews;
            }
        }
        var w = (this.bounds.size.width - this._contentInsets.left - this._contentInsets.right - this._viewSpacing * (numberOfVisibleSubviews - 1)) / numberOfVisibleSubviews;
        for (i = 0, l = this.subviews.length; i < l; ++i){
            view = this.subviews[i];
            switch (this.distribution){
                case UIStackView.Distribution.equal:
                    view.frame = JSRect(x, y, w, h);
                    break;
                default:
                    view.frame = JSRect(x, y, view.frame.size.width, h);
                    break;
            }
            if (!view.hidden){
                x += view.frame.size.width + this._viewSpacing;
            }
        }
    },

    subviewsDidChange: function(){
        this.setNeedsLayout();
    }

});

UIStackView.Axis = {
    vertical: 0,
    horizontal: 1
};

UIStackView.Distribution = {
    none: 0,
    equal: 1,
};