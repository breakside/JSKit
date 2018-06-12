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
        var contentSubviews = [];
        if ('subviews' in values){
            if ('contentView' in values){
                values.contentView.subviews = values.subviews;
            }else{
                contentSubviews = values.subviews;
            }
        }
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
        for (var i = 0, l = contentSubviews.length; i < l; ++i){
            this._contentView.addSubview(spec.resolvedValue(contentSubviews[i]));
        }
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
            this._horizontalScroller = UIScroller.initWithDirection(UIScroller.Direction.horizontal);
        }
        if (this._verticalScroller === null){
            this._verticalScroller = UIScroller.initWithDirection(UIScroller.Direction.vertical);
        }
        this._contentView.clipsToBounds = true;
        this._contentOffset = JSPoint.Zero;
        this._contentSize = JSSize.Zero;
        this._contentInsets = JSInsets.Zero;
        this._minContentOffset = JSPoint.Zero;
        this._maxContentOffset = JSPoint.Zero;
        this._horizontalScroller.addTargetedActionForEvent(this, this._horizontalScrollerValueChanged, UIControl.Event.valueChanged);
        this._verticalScroller.addTargetedActionForEvent(this, this._verticalScrollerValueChanged, UIControl.Event.valueChanged);
        this.addSubview(this._contentView);
        this.addSubview(this._verticalScroller);
        this.addSubview(this._horizontalScroller);
        this._updateScrollers();
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
        this._contentFrameSize = JSSize(this.bounds.size);

        // 1. Figure out if we need to show a vertical scroller
        var minY = -this._contentInsets.top;
        var maxY = Math.max(0, this._contentSize.height + this._contentInsets.bottom - this._contentFrameSize.height);
        var showsVerticalScroller = this.scrollsVertically && maxY !== 0;
        if (showsVerticalScroller && !this._verticalScroller.floats){
            this._contentFrameSize.width -= this._verticalScroller.frame.size.width;
        }

        // 2. Figure out if we need to show a horizontal scroller
        var minX = -this._contentInsets.left;
        var maxX = Math.max(0, this._contentSize.width + this._contentInsets.right - this._contentFrameSize.width);
        var showsHorizontalScroller = this.scrollsHorizontally && maxX !== 0;
        if (showsHorizontalScroller && !this._horizontalScroller.floats){
            this._contentFrameSize.height -= this._horizontalScroller.frame.size.height;
            if (this.scrollsVertically && !showsVerticalScroller){
                // 3. Because the content frame height has decreased, we may need to show a vertical scroller after all
                maxY = Math.max(0, this._contentSize.height + this._contentInsets.bottom - this._contentFrameSize.height);
                showsVerticalScroller = this.scrollsVertically && maxY !== 0;
                if (showsVerticalScroller && !this._verticalScroller.floats){
                    this._contentFrameSize.width -= this._verticalScroller.frame.size.width;
                    maxX += this._verticalScroller.frame.size.width;
                }
            }
        }

        this._minContentOffset = JSPoint(minX, minY);
        this._maxContentOffset = JSPoint(maxX, maxY);

        this._verticalScroller.hidden = !showsVerticalScroller;
        this._horizontalScroller.hidden = !showsHorizontalScroller;

        this._verticalScroller.knobProportion = Math.min(1, this._contentFrameSize.height / (this._contentSize.height + this._contentInsets.top + this._contentInsets.bottom));
        this._horizontalScroller.knobProportion = Math.min(1, this._contentFrameSize.width / (this._contentSize.width + this._contentInsets.left + this._contentInsets.right));
        if (minY == maxY){
            this._verticalScroller.value = 0;
        }else{
            this._verticalScroller.value = (this._contentOffset.y - minY) / (maxY - minY);
        }
        if (minX == maxX){
            this._horizontalScroller.value = 0;
        }else{
            this._horizontalScroller.value = (this._contentOffset.x - minX) / (maxX - minX);
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Layout

    layoutSubviews: function(){
        this._verticalScroller.frame = JSRect(this.bounds.size.width - this._verticalScroller.frame.size.width, this.contentInsets.top, this._verticalScroller.frame.size.width, this.bounds.size.height - this.contentInsets.top - this.contentInsets.bottom - (this._horizontalScroller.hidden ? 0 : this._horizontalScroller.frame.size.height));
        this._horizontalScroller.frame = JSRect(this.contentInsets.left, this.bounds.size.height - this._contentInsets.bottom - this._horizontalScroller.frame.size.height, this.bounds.size.width - this.contentInsets.left - this.contentInsets.right - (this._verticalScroller.hidden ? 0 : this._verticalScroller.frame.size.width), this._horizontalScroller.frame.size.height);
        this._contentView.frame = JSRect(JSPoint.Zero, this._contentFrameSize);
    },

    layerDidChangeSize: function(layer){
        if (this._contentView === null){
            return;
        }
        this._updateScrollers();
    },

    _updateBoundsForContentOffset: function(){
        this.contentView.bounds = JSRect(this._contentOffset, this._contentView.bounds.size);
    },

    // --------------------------------------------------------------------
    // MARK: - Content Size, Offset, and Insets

    contentView: JSReadOnlyProperty('_contentView', null),
    contentInsets: JSDynamicProperty('_contentInsets', null),
    contentOffset: JSDynamicProperty('_contentOffset', null),
    contentSize: JSDynamicProperty('_contentSize', null),
    _minContentOffset: null,
    _maxContentOffset: null,

    setContentInsets: function(contentInsets){
        var d = JSPoint(this._contentInsets.left - contentInsets.left, this._contentInsets.top - contentInsets.top);
        this._contentInsets = JSInsets(contentInsets);
        this._updateScrollers();
        this.contentOffset = JSPoint(this._contentOffset.x + d.x, this._contentOffset.y + d.y);
        this.setNeedsLayout();
    },

    setContentOffset: function(contentOffset){
        var sanitizedOffset = this._sanitizedOffset(contentOffset);
        if (!this._contentOffset.isEqual(sanitizedOffset)){
            this._contentOffset = sanitizedOffset;
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
        this._updateScrollers();
        this.contentOffset = this._sanitizedOffset(this.contentOffset);
    },

    _sanitizedOffset: function(offset){
        offset = JSPoint(offset);
        if (!this.scrollsHorizontally){
            offset.x = this._contentOffset.x;
        }else if (offset.x < this._minContentOffset.x){
            offset.x = this._minContentOffset.x;
        }else if (offset.x > this._maxContentOffset.x){
            offset.x = this._maxContentOffset.x;
        }
        if (!this.scrollsVertically){
            offset.y = this._contentOffset.y;
        }else if (offset.y < this._minContentOffset.y){
            offset.y = this._minContentOffset.y;
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
        var x = this._minContentOffset.x + (this._maxContentOffset.x - this._minContentOffset.x) * scroller.value;
        this.contentOffset = JSPoint(x, this._contentOffset.y);
    },

    _verticalScrollerValueChanged: function(scroller){
        var y = this._minContentOffset.y + (this._maxContentOffset.y - this._minContentOffset.y) * scroller.value;
        this.contentOffset = JSPoint(this._contentOffset.x, y);
    }

});