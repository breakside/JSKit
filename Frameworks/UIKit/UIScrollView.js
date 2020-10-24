// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #import "UIView.js"
// #import "UIEvent.js"
// #import "UIScroller.js"
'use strict';

JSProtocol("UIScrollViewDelegate", JSProtocol, {

    scrollViewDidScroll: function(scrollView){}

});

JSClass('UIScrollView', UIView, {

    // --------------------------------------------------------------------
    // MARK: - Creating a Scroll View

    initWithFrame: function(frame){
        UIScrollView.$super.initWithFrame.call(this, frame);
        this._commonScrollViewInit();
    },

    initWithSpec: function(spec){
        UIScrollView.$super.initWithSpec.call(this, spec);

        // 1. If any subviews were added directly to this view, we'll move them
        //    to the contentView once it's ready
        var contentSubviews = JSCopy(this.subviews);

        // 2. If the content view and scrollers are specified in the spec, create them
        //    before doing the _commonScrollViewInit, so it won't try to create them itself.
        //    These properties are optional in the spec, and are typically only provided if
        //    the user wants to provide specialized customization
        if (spec.containsKey('contentView')){
            this._contentView = spec.valueForKey("contentView", UIView);
        }
        if (spec.containsKey('verticalScroller')){
            this._verticalScroller = spec.valueForKey("verticalScroller", UIScroller);
        }
        if (spec.containsKey('horizontalScroller')){
            this._horizontalScroller = spec.valueForKey("horizontalScroller", UIScroller);
        }
        if (spec.containsKey('scrollStyler')){
            this._scrollStyler = spec.valueForKey("scrollStyler", UIScroller.Styler);
        }
        this._commonScrollViewInit();

        // 3. Finish the work from step #1 after _commonScrollViewInit, when we can be sure that
        //    a contentView has been created
        for (var i = 0, l = contentSubviews.length; i < l; ++i){
            this._contentView.addSubview(contentSubviews[i]);
        }

        // 4. Handle all the other properties
        if (spec.containsKey('contentInsets')){
            this.contentInsets = spec.valueForKey("contentInsets", JSInsets);
        }
        if (spec.containsKey('contentSize')){
            this.contentSize = spec.valueForKey("contentSize", JSSize);
        }
        if (spec.containsKey('scrollsVertically')){
            this._scrollsVertically = spec.valueForKey("scrollsVertically");
        }
        if (spec.containsKey('scrollsHorizontally')){
            this._scrollsHorizontally = spec.valueForKey("scrollsHorizontally");
        }
        if (spec.containsKey('delaysContentTouches')){
            this._delaysContentTouches = spec.valueForKey("delaysContentTouches");
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
            this._horizontalScroller = UIScroller.initWithDirection(UIScroller.Direction.horizontal, this._scrollStyler);
        }
        if (this._verticalScroller === null){
            this._verticalScroller = UIScroller.initWithDirection(UIScroller.Direction.vertical, this._scrollStyler);
        }
        this._contentView.clipsToBounds = true;
        this._contentOffset = JSPoint.Zero;
        this._contentSize = JSSize.Zero;
        this._contentInsets = JSInsets.Zero;
        this._minContentOffset = JSPoint.Zero;
        this._maxContentOffset = JSPoint.Zero;
        this._horizontalScroller.addAction("_horizontalScrollerValueChanged", this, UIControl.Event.valueChanged);
        this._verticalScroller.addAction("_verticalScrollerValueChanged", this, UIControl.Event.valueChanged);
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

    _scrollStyler: null,

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
        if (this._zoomSpecifiedOffset !== null && this._zoomSpecifiedOffset.y < minY){
            minY = this._zoomSpecifiedOffset.y;
        }
        var maxY = Math.max(minY, this._contentSize.height + this._contentInsets.bottom - this._contentFrameSize.height);
        var showsVerticalScroller = this.scrollsVertically && maxY !== minY;
        if (showsVerticalScroller && !this._verticalScroller.floats){
            this._contentFrameSize.width -= this._verticalScroller.frame.size.width;
        }

        // 2. Figure out if we need to show a horizontal scroller
        var minX = -this._contentInsets.left;
        if (this._zoomSpecifiedOffset !== null && this._zoomSpecifiedOffset.x < minX){
            minX = this._zoomSpecifiedOffset.x;
        }
        var maxX = Math.max(minX, this._contentSize.width + this._contentInsets.right - this._contentFrameSize.width);
        var showsHorizontalScroller = this.scrollsHorizontally && maxX !== minX;
        if (showsHorizontalScroller && !this._horizontalScroller.floats){
            this._contentFrameSize.height -= this._horizontalScroller.frame.size.height;
            if (this.scrollsVertically && !showsVerticalScroller){
                // 3. Because the content frame height has decreased, we may need to show a vertical scroller after all
                maxY = Math.max(0, this._contentSize.height + this._contentInsets.bottom - this._contentFrameSize.height);
                showsVerticalScroller = this.scrollsVertically && maxY !== minY;
                if (showsVerticalScroller && !this._verticalScroller.floats){
                    this._contentFrameSize.width -= this._verticalScroller.frame.size.width;
                    maxX += this._verticalScroller.frame.size.width;
                }
            }
        }

        // 4. Save the min/max values for other methods to use
        this._minContentOffset = JSPoint(minX, minY);
        this._maxContentOffset = JSPoint(maxX, maxY);

        // 5. Show/hide scrollers
        this._verticalScroller.hidden = !showsVerticalScroller;
        this._horizontalScroller.hidden = !showsHorizontalScroller;

        // 6. Set scroller knob sizes and positions
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
        UIScrollView.$super.layerDidChangeSize.call(this, layer);
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
    naturalContentSize: JSReadOnlyProperty(),
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
        if (this._contentSize.isEqual(contentSize)){
            return;
        }
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

    getNaturalContentSize: function(){
        return JSSize(
            this.contentView.bounds.size.width - this.contentInsets.left - this.contentInsets.right,
            this.contentView.bounds.size.height - this.contentInsets.top - this.contentInsets.bottom
        );
    },

    // --------------------------------------------------------------------
    // MARK: - Scrolling

    scrollToRect: function(rect, position){
        var scrollsVertically = this.scrollsVertically && this.contentSize.height > this.contentView.bounds.size.height;
        var scrollsHorizontally = this.scrollsHorizontally && this.contentSize.width > this.contentView.bounds.size.width;
        var contentOffset = JSPoint(this.contentOffset);
        if (position === undefined){
            position = UIScrollView.ScrollPosition.auto;
        }
        if (scrollsVertically && scrollsHorizontally){
            // TODO:
        }else if (scrollsVertically){
            if (position === UIScrollView.ScrollPosition.auto){
                // Auto position means choose top if the target is above the current offset,
                // bottom if the target is below the offset, or nothing if the target is fully visible
                if (rect.origin.y < this.contentView.bounds.origin.y + this._contentInsets.top){
                    position = UIScrollView.ScrollPosition.top;
                }else if (rect.origin.y + rect.size.height > this.contentView.bounds.origin.y + this.contentView.bounds.size.height){
                    position = UIScrollView.ScrollPosition.bottom;
                }
            }
            switch (position){
                case UIScrollView.ScrollPosition.auto:
                    // Only get here if the target is fully visible, in which case we don't move at all
                    break;
                case UIScrollView.ScrollPosition.top:
                    contentOffset.y = rect.origin.y - this._contentInsets.top;
                    break;
                case UIScrollView.ScrollPosition.bottom:
                    contentOffset.y = rect.origin.y + rect.size.height - this.contentView.bounds.size.height;
                    break;
                case UIScrollView.ScrollPosition.middle:
                    contentOffset.y = rect.origin.y + rect.size.height / 2.0 - this.contentView.bounds.size.height / 2.0;
                    break;
            }
        }else if (scrollsHorizontally){
            if (position === UIScrollView.ScrollPosition.auto){
                // Auto position means choose top if the target is above the current offset,
                // bottom if the target is below the offset, or nothing if the target is fully visible
                if (rect.origin.x < this.contentView.bounds.origin.x + this._contentInsets.left){
                    position = UIScrollView.ScrollPosition.top;
                }else if (rect.origin.x + rect.size.width > this.contentView.bounds.origin.x + this.contentView.bounds.size.width){
                    position = UIScrollView.ScrollPosition.bottom;
                }
            }
            switch (position){
                case UIScrollView.ScrollPosition.auto:
                    // Only get here if the target is fully visible, in which case we don't move at all
                    break;
                case UIScrollView.ScrollPosition.top:
                    contentOffset.x = rect.origin.x - this._contentInsets.left;
                    break;
                case UIScrollView.ScrollPosition.bottom:
                    contentOffset.x = rect.origin.x + rect.size.width - this.contentView.bounds.size.width;
                    break;
                case UIScrollView.ScrollPosition.middle:
                    contentOffset.x = rect.origin.x + rect.size.width / 2.0 - this.contentView.bounds.size.width / 2.0;
                    break;
            }
        }
        this.contentOffset = contentOffset;
    },

    scrollToView: function(view, position){
        var rect = this.contentView.convertRectFromView(view.bounds, view);
        this.scrollToRect(rect, position);
    },

    // --------------------------------------------------------------------
    // MARK: - Zooming

    minimumZoomScale: JSDynamicProperty('_minimumZoomScale', 1),
    maximumZoomScale: JSDynamicProperty('_maximumZoomScale', 1),
    _minimumZoomIncrement: 0.01,
    _zoomSpecifiedOffset: null,
    zoomScale: JSDynamicProperty('_zoomScale', 1),

    setZoomScale: function(scale){
        this.setZoomScaleAtLocation(scale, JSPoint.Zero);
    },

    setZoomScaleAtLocation: function(scale, location){
        var view = this._viewForZooming();
        scale = Math.min(Math.max(scale, this._minimumZoomScale), this._maximumZoomScale);
        if (view !== null && Math.abs(scale - this._zoomScale) >= this._minimumZoomIncrement){
            var p0 = view.convertPointFromView(location, this);
            var offsetDelta = this.contentOffset.subtracting(location);
            if (Math.abs(scale - 1) < this._minimumZoomIncrement){
                scale = 1;
            }
            this._zoomScale = scale;
            view.transform = JSAffineTransform.Scaled(this._zoomScale, this._zoomScale);
            var newLocation = this.convertPointFromView(p0, view);
            var newOffset = newLocation.adding(offsetDelta);
            if (scale >= 1){
                this._zoomSpecifiedOffset = null;
            }else{
                this._zoomSpecifiedOffset = newOffset;
            }
            this.contentSize = this.convertRectFromView(view.bounds, view).size;
            this.contentOffset = newOffset;
            // TODO: redraw connection views at new scale
        }
    },

    _viewForZooming: function(){
        return this._contentView.subviews[0] || null;
    },

    canPerformAction: function(action, sender){
        if (action == 'zoomIn' || action == 'zoomOut' || action == 'zoomDefault'){
            if (this._minimumZoomScale == this._maximumZoomScale){
                return false;
            }
            if (action == 'zoomDefault' && this._zoomScale == 1){
                return false;
            }
            if (action == 'zoomIn' &&  this._maximumZoomScale - this._zoomScale < this._minimumZoomIncrement){
                return false;
            }
            if (action == 'zoomOut' && this._zoomScale - this._minimumZoomScale < this._minimumZoomIncrement){
                return false;
            }
            return true;
        }
        return UIScrollView.$super.canPerformAction.call(this, action, sender);
    },

    zoomIn: function(sender){
        var location = this.contentView.frame.center;
        var scale;
        if (this._zoomScale < 1){
            scale = Math.min(1, this._zoomScale + 0.1);
        }else{
            scale = this._zoomScale + 0.2;
        }
        this.setZoomScaleAtLocation(scale, location);
    },

    zoomOut: function(sender){
        var location = this.contentView.frame.center;
        var scale;
        if (this._zoomScale > 1){
            scale = Math.max(1, this._zoomScale - 0.2);
        }else{
            scale = this._zoomScale - 0.1;
        }
        this.setZoomScaleAtLocation(scale, location);
    },

    zoomDefault: function(sender){
        var location = this.contentView.frame.center;
        this.setZoomScaleAtLocation(1, location);
    },

    // --------------------------------------------------------------------
    // MARK: - Scroll Events

    hitTest: function(locationInView){
        return UIScrollView.$super.hitTest.call(this, locationInView);
    },

    _didScroll: function(){
        if (this.delegate && this.delegate.scrollViewDidScroll){
            this.delegate.scrollViewDidScroll(this);
        }
    },

    _zoomScaleWhenMangificationBegan: 1,

    magnify: function(event){
        if (event.phase === UIEvent.Phase.began){
            this._zoomScaleWhenMangificationBegan = this.zoomScale;
        }
        this.setZoomScaleAtLocation(this._zoomScaleWhenMangificationBegan * event.magnification, event.locationInView(this));
    },

    _scrollDistanceZoomFactor: 0.003,
    _accumulatedScrollZoom: 0,

    scrollWheel: function(event){
        if (event.hasModifier(UIEvent.Modifier.control)){
            this._accumulatedScrollZoom -= event.scrollingDelta.y;
            var scaleDelta = this._accumulatedScrollZoom * this._scrollDistanceZoomFactor;
            var scale0 = this.zoomScale;
            this.setZoomScaleAtLocation(scale0 + scaleDelta, event.locationInView(this));
            this._accumulatedScrollZoom -= (this.zoomScale - scale0) / this._scrollDistanceZoomFactor;
        }else{
            var d = JSPoint(event.scrollingDelta);
            var abs = JSPoint(Math.abs(d.x), Math.abs(d.y));
            if (abs.x > 2 * abs.y){
                d.y = 0;
            }else if (abs.y > 2 * abs.x){
                d.x = 0;
            }
            if (this._scrollsHorizontally && d.x !== 0 || this._scrollsVertically && d.y !== 0){
                this.contentOffset = JSPoint(this._contentOffset.x + d.x, this._contentOffset.y + d.y);
            }else{
                // If the requested scroll is not supported by our view, forward the event up the
                // reponder chain, allowing for nested scroll views where one goes vertically and
                // the other goes horizontally.  This is useful for views such as a UIBrowserView.
                UIScrollView.$super.scrollWheel.call(this, event);
            }
        }
    },

    _horizontalScrollerValueChanged: function(scroller){
        var x = this._minContentOffset.x + (this._maxContentOffset.x - this._minContentOffset.x) * scroller.value;
        this.contentOffset = JSPoint(x, this._contentOffset.y);
    },

    _verticalScrollerValueChanged: function(scroller){
        var y = this._minContentOffset.y + (this._maxContentOffset.y - this._minContentOffset.y) * scroller.value;
        this.contentOffset = JSPoint(this._contentOffset.x, y);
    },

    _touchTracking: null,
    _coasting: null,

    _beginTrackingTouches: function(touches, event){
        var velocity = JSPoint.Zero;
        if (this._coasting !== null){
            velocity = this._coasting.velocity;
        }
        this._endCoasting();
        var touch = touches[0];
        var location = touch.locationInView(this);
        this._touchTracking = {
            identifier: touches[0],
            startingLocation: JSPoint(location),
            location: location,
            contentOffset: JSPoint(this.contentOffset),
            timestamp: event.timestamp,
            startingVelocity: velocity,
            velocity: velocity
        };
    },

    _endTrackingTouches: function(){
        this._touchTracking = null;
    },

    _beginCoasting: function(velocity){
        this._coasting = {
            timestamp: -1,
            displayServer: this.layer._displayServer,
            velocity: velocity
        };
        this._coasting.displayServer.schedule(this._displayUpdate, this);
    },

    _endCoasting: function(){
        this._coasting = null;
    },

    touchesBegan: function(touches, event){
        this._beginTrackingTouches(touches, event);
    },

    touchesMoved: function(touches, event){
        if (this._touchTracking === null){
            this._beginTrackingTouches(touches, event);
        }
        var touch = event.touchForIdentifier(this._touchTracking.identifier);
        if (touch === null){
            touch = touches[0];
        }
        var location = touch.locationInView(this);
        var delta = location.subtracting(this._touchTracking.startingLocation);
        var offset = this._touchTracking.contentOffset.subtracting(delta);
        delta = location.subtracting(this._touchTracking.location);
        var dt = event.timestamp - this._touchTracking.timestamp;
        this._touchTracking.location = location;
        this._touchTracking.timestamp = event.timestamp;
        if (dt > 0){
            this._touchTracking.velocity = JSPoint(delta.x / dt, delta.y / dt);
        }
        this.contentOffset = offset;
    },

    touchesEnded: function(touches, event){
        var dt = event.timestamp - this._touchTracking.timestamp;
        if (dt < 0.05){
            this._beginCoasting(this._touchTracking.velocity);
        }
        this._endTrackingTouches();
    },

    touchesCanceled: function(touches, event){
        this._endTrackingTouches();
    },

    _displayUpdate: function(t){
        if (this._coasting === null){
            return;
        }
        if (this._coasting.timestamp < 0){
            this._coasting.timestamp = t;
            this._coasting.displayServer.schedule(this._displayUpdate, this);
            return;
        }
        if ((this.scrollsHorizontally && Math.abs(this._coasting.velocity.x) >= 10) || (this.scrollsVertically && (Math.abs(this._coasting.velocity.y) >= 10))){
            var dt = t - this._coasting.timestamp;
            this._coasting.timestamp = t;
            var delta = JSPoint(this._coasting.velocity.x * dt, this._coasting.velocity.y * dt);
            this.contentOffset = this.contentOffset.subtracting(delta);
            this._coasting.velocity.x *= 0.97;
            this._coasting.velocity.y *= 0.97;
            this._coasting.displayServer.schedule(this._displayUpdate, this);
        }else{
            this._endCoasting();
        }
    },

    isAccessibilityElement: true,
    accessibilityRole: UIAccessibility.Role.scrollArea,

});

UIScrollView.ScrollPosition = {
    auto: 0,
    top: 1,
    bottom: 2,
    middle: 3
};