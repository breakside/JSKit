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
        // 1. To simplify spec coding, any subviews specified there for the scroll view
        //    will be moved to the contentView instead.  The common use case by far is
        //    to add subviews to the content view, not the scroll view itself, which typically
        //    only contains the fixed content view and scrollers.
        //    Make this move before calling $super.initWithSpec, otherwise $super will add the
        //    subviews to the scroll view itself.
        var contentSubviews = [];
        if ('subviews' in values){
            if ('contentView' in values){
                values.contentView.subviews = values.subviews;
            }else{
                contentSubviews = values.subviews;
            }
        }
        UIScrollView.$super.initWithSpec.call(this, spec, values);

        // 2. If the content view and scrollers are specified in the spec, create them
        //    before doing the _commonScrollViewInit, so it won't try to create them itself.
        //    These properties are optional in the spec, and are typically only provided if
        //    the user wants to provide specialized customization
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

        // 3. Finish the work from step #1 after _commonScrollViewInit, when we can be sure that
        //    a contentView has been created
        for (var i = 0, l = contentSubviews.length; i < l; ++i){
            this._contentView.addSubview(spec.resolvedValue(contentSubviews[i]));
        }

        // 4. Handle all the other properties
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

        // Only create the content view and scrollers if the haven't already been created
        // by a specialized init function like initWithSpec.
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

        // 3. Save the min/max values for other methods to use
        this._minContentOffset = JSPoint(minX, minY);
        this._maxContentOffset = JSPoint(maxX, maxY);

        // 4. Show/hide scrollers
        this._verticalScroller.hidden = !showsVerticalScroller;
        this._horizontalScroller.hidden = !showsHorizontalScroller;

        // 5. Set scroller knob sizes and positions
        // The calculations are are fairly straightfoward:
        // - knob proportion is the size of the visible area divided by the total scrollable size including insets
        // - value is the amount we've scrolled divided by the total amount we can scroll
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
        this._verticalScroller.frame = JSRect(
            this.bounds.size.width - this._verticalScroller.frame.size.width,
            this.contentInsets.top,
            this._verticalScroller.frame.size.width,
            this.bounds.size.height - this.contentInsets.top - this.contentInsets.bottom - (this._horizontalScroller.hidden ? 0 : this._horizontalScroller.frame.size.height)
        );
        this._horizontalScroller.frame = JSRect(
            this.contentInsets.left,
            this.bounds.size.height - this._contentInsets.bottom - this._horizontalScroller.frame.size.height,
            this.bounds.size.width - this.contentInsets.left - this.contentInsets.right - (this._verticalScroller.hidden ? 0 : this._verticalScroller.frame.size.width),
            this._horizontalScroller.frame.size.height
        );
        this._contentView.frame = JSRect(JSPoint.Zero, this._contentFrameSize);
    },

    layerDidChangeSize: function(layer){
        if (this._contentView === null){
            return;
        }
        this._updateScrollers();
        // If we changed size, our offset may now be invalid, so re-sanitize it
        this.contentOffset = this._sanitizedOffset(this._contentOffset);
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
        // When adjusting the content insets, we'll attempt to adjust the content offset accordingly
        // so the content doesn't shift.  This is especially useful when the insets are fisrt set and the
        // offset is 0,0.  In that case we want the offset to change to -inset.left,-inset.top so it's still
        // scroll to the very top.
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
        // After setting the content size, our offset may be invalid, so re-sanitize it.
        // NOTE: this will be a no-op if the offset is still valid.
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
    // MARK: - Scrolling

    scrollToRect: function(rect, position){
        rect = this.convertRectToView(rect, this.contentView);
        if (position === UIScrollView.ScrollPosition.auto){
            // Auto position means choose top if the target is above the current offset,
            // bottom if the target is below the offset, or nothing if the target is fully visible
            if (rect.origin.y < this.contentView.bounds.origin.y){
                position = UIScrollView.ScrollPosition.top;
            }else if (rect.origin.y + rect.size.height > this.contentView.bounds.origin.y + this.contentView.bounds.size.height){
                position = UIScrollView.ScrollPosition.bottom;
            }
        }
        var scrollPoint = this.contentOffset;
        switch (position){
            case UIScrollView.ScrollPosition.auto:
                // Only get here if the target is fully visible, in which case we don't move at all
                break;
            case UIScrollView.ScrollPosition.top:
                scrollPoint = JSPoint(0, rect.origin.y);
                break;
            case UIScrollView.ScrollPosition.bottom:
                scrollPoint = JSPoint(0, rect.origin.y + rect.size.height - this.contentView.bounds.size.height);
                break;
            case UIScrollView.ScrollPosition.middle:
                scrollPoint = JSPoint(0, rect.origin.y + rect.size.height / 2.0 - this.contentView.bounds.size.height / 2.0);
                break;
        }
        this.contentOffset = scrollPoint;
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
    },

    touchesBegan: function(touches, event){
    },

    touchesMoved: function(touches, event){
    },

    touchesEnded: function(touches, event){
    },

    touchesCanceled: function(touches, event){
    }

});

UIScrollView.ScrollPosition = {
    auto: 0,
    top: 1,
    bottom: 2,
    middle: 3
};