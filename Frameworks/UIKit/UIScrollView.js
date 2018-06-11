// #import "UIKit/UIView.js"
/* global JSClass, UIView, UIScrollView, JSDynamicProperty, JSInsets, JSProtocol, JSReadOnlyProperty, UIScroller, UIControl, JSPoint, JSRect, JSSize */
'use strict';

JSProtocol("UIScrollViewDelegate", JSProtocol, {

    scrollViewDidScroll: ['scrollView']

});

JSClass('UIScrollView', UIView, {

    // --------------------------------------------------------------------
    // MARK: - Creating a Scroll View

    initWithFrame: function(frame){
        UIScrollView.$super.initWithFrame.call(this, frame);
        this._commonScrollViewInit();
    },

    initWithSpec: function(spec, values){
        UIScrollView.$super.initWithSpec.call(this, spec, values);
        if ('contentView' in values){
            this._contentView = spec.resolvedValue(values.contentView, "UIView");
        }
        if ('verticalScroller' in values){
            this._verticalScroller = spec.resolvedValue(values.verticalScroller, "UIScroller");
        }
        if ('horizontalScroller' in values){
            this._horizontalScroller = spec.resolvedValue(values.horizontalScroller, "UIScroller");
        }
        this._commonScrollViewInit();
        if ('contentInsets' in values){
            this.contentInsets = JSInsets.apply(undefined, values.contentInsets.parseNumberArray());
        }
        if ('contentSize' in values){
            this.contentSize = JSSize.apply(undefined, values.contentSize.parseNumberArray());
        }
        if ('scrollsVertically' in values){
            this._scrollsVertically = spec.resolvedValue(values.scrollsVertically);
        }
        if ('scrollsHorizontally' in values){
            this._scrollsHorizontally = spec.resolvedValue(values.scrollsHorizontally);
        }
        if ('delaysContentTouches' in values){
            this._delaysContentTouches = spec.resolvedValue(values.delaysContentTouches);
        }
        if ('styler' in values){
            this.styler = spec.resolvedValue(values.styler);
        }
    },

    _commonScrollViewInit: function(){
        this.clipsToBounds = true;
        if (this._contentView === null){
            this._contentView = UIView.initWithFrame(this.bounds);
        }
        if (this._horizontalScroller === null){
            this._horizontalScroller = UIScroller.init();
        }
        if (this._verticalScroller === null){
            this._verticalScroller = UIScroller.init();
        }
        this._contentView.clipsToBounds = true;
        this._contentOffset = JSPoint.Zero;
        this._contentSize = JSSize.Zero;
        this._contentInsets = JSInsets.Zero;
        this._maxContentOffset = JSPoint.Zero;
        this._horizontalScroller.addTargetedActionForEvent(this, this._horizontalScrollerValueChanged, UIControl.Event.valueChanged);
        this._verticalScroller.addTargetedActionForEvent(this, this._verticalScrollerValueChanged, UIControl.Event.valueChanged);
        this.addSubview(this._contentView);
        this.addSubview(this._verticalScroller);
        this.addSubview(this._horizontalScroller);
    },

    // --------------------------------------------------------------------
    // MARK: - Delegate

    delegate: null,

    // --------------------------------------------------------------------
    // MARK: - Styler

    styler: JSDynamicProperty('_styler', null),

    setStyler: function(styler){
        this._horizontalScroller.styler = styler;
        this._verticalScroller.styler = styler;
    },

    // --------------------------------------------------------------------
    // MARK: - Scrollers

    verticalScroller: JSReadOnlyProperty('_verticalScroller', null),
    horizontalScroller: JSReadOnlyProperty('_horizontalScroller', null),
    scrollsVertically: JSDynamicProperty('_scrollsVertically', true),
    scrollsHorizontally: JSDynamicProperty('_scrollsHorizontally', true),
    delaysContentTouches: false,

    _updateScrollers: function(){
        this._verticalScroller.knobProportion = Math.min(1, this.bounds.size.height / this._contentSize.height);
        this._horizontalScroller.knobProportion = Math.min(1, this.bounds.size.width / this._contentSize.width);
        this._verticalScroller.value = this._contentOffset.y / this._maxContentOffset.y;
        this._horizontalScroller.value = this._contentOffset.x / this._maxContentOffset.x;
    },

    // --------------------------------------------------------------------
    // MARK: - Layout

    layoutSubviews: function(){
        this._verticalScroller.hidden = !this._scrollsVertically || this._maxContentOffset.y <= this.bounds.size.height;
        this._horizontalScroller.hidden = !this._scrollsHorizontally || this._maxContentOffset.x <= this.bounds.size.width;
        this._contentView.frame = JSRect(JSPoint(this._contentInsets.left, this._contentInsets.top), this.bounds.size);
        this._verticalScroller.frame = JSRect(this.bounds.size.width - this._verticalScroller.frame.size.width, 0, this._verticalScroller.frame.size.width, this.bounds.size.height - (this._horizontalScroller.hidden ? 0 : this._horizontalScroller.frame.size.height));
        this._horizontalScroller.frame = JSRect(0, this.bounds.size.height - this._horizontalScroller.frame.size.height, this.bounds.size.width, this._horizontalScroller.frame.size.height - (this._verticalScroller.hidden ? 0 : this._verticalScroller.frame.size.width));
    },

    layerDidChangeSize: function(layer){
        this._updateMaxContentOffset();
        this._updateScrollers();
    },

    _updateBoundsForContentOffset: function(){
        this.contentView.bounds = JSRect(JSPoint(this._contentOffset.x - this.contentInsets.left, this._contentOffset.y - this.contentInsets.top), this.contentView.bounds.size);
    },

    // --------------------------------------------------------------------
    // MARK: - Content Size, Offset, and Insets

    contentView: JSReadOnlyProperty('_contentView', null),
    contentInsets: JSDynamicProperty('_contentInsets', null),
    contentOffset: JSDynamicProperty('_contentOffset', null),
    contentSize: JSDynamicProperty('_contentSize', null),
    _maxContentOffset: null,

    setContentInsets: function(contentInsets){
        this._contentInsets = JSInsets(contentInsets);
        this._updateMaxContentOffset();
        this._updateScrollers();
        this.setNeedsLayout();
    },

    setContentOffset: function(contentOffset){
        if (!this._contentOffset.isEqual(contentOffset)){
            this._contentOffset = this._sanitizedOffset(contentOffset);
            this._updateBoundsForContentOffset();
            this._updateScrollers();
            this._didScroll();
        }
    },

    setContentOffsetAnimated: function(contentOffset){
        var scrollView = this;
        UIView.animateWithDuration(0.25, function(){
            scrollView.contentOffset = contentOffset;
        });
    },

    setContentSize: function(contentSize){
        this._contentSize = JSSize(contentSize);
        this._updateMaxContentOffset();
        this._updateScrollers();
        this.contentOffset = JSPoint(Math.min(this._maxContentOffset.x, this._contentOffset.x), Math.min(this._maxContentOffset.y, this._contentOffset.y));
    },

    _updateMaxContentOffset: function(){
        this._maxContentOffset = JSPoint(
            this._contentInsets.left + this._contentSize.width + this._contentInsets.right - this.contentView.bounds.size.width,
            this._contentInsets.top + this._contentSize.height + this._contentInsets.bottom - this.contentView.bounds.size.height
        );
    },

    _sanitizedOffset: function(offset){
        offset = JSPoint(offset);
        if (!this.scrollsHorizontally){
            offset.x = this._contentOffset.x;
        }else if (offset.x < 0){
            offset.x = 0;
        }else if (offset.x > this._maxContentOffset.x){
            offset.x = this._maxContentOffset.x;
        }
        if (!this.scrollsVertically){
            offset.y = this._contentOffset.y;
        }else if (offset.y < 0){
            offset.y = 0;
        }else if (offset.y > this._maxContentOffset.y){
            offset.y = this._maxContentOffset.y;
        }
        return offset;
    },

    // --------------------------------------------------------------------
    // MARK: - Scroll Events

    hitTest: function(locationInView){
        if (this.delaysContentTouches){
            return this;
        }
        return UIScrollView.$super.hitTest.call(this, locationInView);
    },

    _didScroll: function(){
        if (this.delegate && this.delegate.scrollViewDidScroll){
            this.delegate.scrollViewDidScroll(this);
        }
    },

    scrollWheel: function(event){
        var d = JSPoint(event.scrollingDelta);
        var abs = JSPoint(Math.abs(d.x), Math.abs(d.y));
        if (abs.x > 2 * abs.y){
            d.y = 0;
        }else if (abs.y > 2 * abs.x){
            d.x = 0;
        }
        this.contentOffset = JSPoint(this._contentOffset.x + d.x, this._contentOffset.y + d.y);
    },

    _horizontalScrollerValueChanged: function(scroller){
        var x = this._maxContentOffset.x * scroller.value;
        this.contentOffset = JSPoint(x, this._contentOffset.y);
    },

    _verticalScrollerValueChanged: function(scroller){
        var y = this._maxContentOffset.y * scroller.value;
        this.contentOffset = JSPoint(this._contentOffset.x, y);
    }

});