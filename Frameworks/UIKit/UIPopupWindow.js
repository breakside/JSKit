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

// #import "UIWindow.js"
// #import "UIViewPropertyAnimator.js"
// #import "JSColor+UIKit.js"
'use strict';

JSClass("UIPopupWindow", UIWindow, {

    showsSourceArrow: JSDynamicProperty('_showsSourceArrow', false),
    sourceArrowSize: JSDynamicProperty('_sourceArrowSize', 10),
    sourceSpacing: JSDynamicProperty('_sourceSpacing', 0),
    sourceView: null,
    isUserMovable: false,
    placement: 0,
    canBecomeKey: true,
    _widthTracksContent: true,
    _heightTracksContent: true,
    _actualArrowSize: 0,

    _commonWindowInit: function(){
        if (this._styler === null){
            this._styler = UIPopupWindow.Styler.default;
        }
        if (this._contentInsets === null){
            this._contentInsets = JSInsets(10);
        }
        UIPopupWindow.$super._commonWindowInit.call(this);
    },

    setShowsSourceArrow: function(showsSourceArrow){
        if (showsSourceArrow === this._showsSourceArrow){
            return;
        }
        if (this._isOpen){
            var frame = JSRect(this.untransformedFrame);
            if (this.placement === UIPopupWindow.Placement.left){
                if (this._showsSourceArrow){
                    frame.size.width -= this._actualArrowSize;
                }else{
                    frame.size.width += this._actualArrowSize;
                }
            }else if (this.placement === UIPopupWindow.Placement.right){
                if (this._showsSourceArrow){
                    frame.size.width -= this._actualArrowSize;
                    frame.origin.x += this._actualArrowSize;
                    if (this._downLocation !== null){
                        this._downLocation.x -= this._actualArrowSize;
                    }
                }else{
                    frame.size.width += this._actualArrowSize;
                    frame.origin.x -= this._actualArrowSize;
                    if (this._downLocation !== null){
                        this._downLocation.x += this._actualArrowSize;
                    }
                }
            }else if (this.placement === UIPopupWindow.Placement.above){
                if (this._showsSourceArrow){
                    frame.size.height -= this._actualArrowSize;
                }else{
                    frame.size.height += this._actualArrowSize;
                }
            }else if (this.placement === UIPopupWindow.Placement.below){
                if (this._showsSourceArrow){
                    frame.size.height -= this._actualArrowSize;
                    frame.origin.y += this._actualArrowSize;
                    if (this._downLocation !== null){
                        this._downLocation.y -= this._actualArrowSize;
                    }
                }else{
                    frame.size.height += this._actualArrowSize;
                    frame.origin.y -= this._actualArrowSize;
                    if (this._downLocation !== null){
                        this._downLocation.x += this._actualArrowSize;
                    }
                }
            }
            this.untransformedFrame = frame;
        }
        this._showsSourceArrow = showsSourceArrow;
        this._styler.updateWindow(this);
        if (this._isOpen && !this._showsSourceArrow){
            JSNotificationCenter.shared.post("UIPopupWindowDidDetachFromSource", this);
        }
    },

    setSourceArrowSize: function(sourceArrowSize){
        this._sourceArrowSize = sourceArrowSize;
        this._styler.updateWindow(this);
    },

    setSourceSpacing: function(sourceSpacing){
        this._sourceSpacing = sourceSpacing;
        this._styler.updateWindow(this);
    },

    canBecomeMainWindow: function(){
        return false;
    },

    canBecomeKeyWindow: function(){
        return this.canBecomeKey;
    },

    openAdjacentToView: function(view, preferredPlacement, animated){
        if (animated === undefined){
            animated = true;
        }
        var sourceBounds = view.bounds;
        if (view.sourceRectForPopupWindow){
            sourceBounds = view.sourceRectForPopupWindow(this);
        }
        var sourceFrame = view.convertRectToScreen(sourceBounds).rectWithInsets(-this._sourceSpacing);
        var safeFrame = view.window.screen.availableFrame.rectWithInsets(20);

        // Size to our content's preferred size
        this.sizeToFit();
        var frame = JSRect(this.frame);
        var placement = preferredPlacement;

        // Adjust for the arrow, if necessary
        // NOTE: we may not honor the perferred placement, but will only change
        // under to over, left to right, or the reverses.  So we know before any
        // adjustment whether the arrow size adds to the height or width.
        if (this._showsSourceArrow){
            if (placement == UIPopupWindow.Placement.below || placement == UIPopupWindow.Placement.above){
                this._actualArrowSize = Math.min(this._sourceArrowSize, (frame.size.width - this._styler.cornerRadius - this._styler.cornerRadius) / 2);
                frame.size.height += this._actualArrowSize;
            }else if (placement == UIPopupWindow.Placement.left || placement == UIPopupWindow.Placement.right){
                this._actualArrowSize = Math.min(this._sourceArrowSize, (frame.size.height - this._styler.cornerRadius - this._styler.cornerRadius) / 2);
                frame.size.width += this._actualArrowSize;
            }
        }

        // Make any adjustments
        // - if the popup won't fit in the perferred placement,
        //   and there's much more room in the other direction,
        //   switch to the other directio
        var available = JSInsets(
            sourceFrame.origin.y - safeFrame.origin.y,
            sourceFrame.origin.x - safeFrame.origin.x,
            (safeFrame.origin.y + safeFrame.size.height) - (sourceFrame.origin.y + sourceFrame.size.height),
            (safeFrame.origin.x + safeFrame.size.width) - (sourceFrame.origin.x + sourceFrame.size.width)
        );
        if (placement == UIPopupWindow.Placement.below){
            if (frame.size.height > available.bottom){
                if (available.top >= available.bottom * 2){
                    placement = UIPopupWindow.Placement.above;
                }else if (available.right >= frame.size.width){
                    placement = UIPopupWindow.Placement.right;
                }else if (available.left >= frame.size.width){
                    placement = UIPopupWindow.Placement.left;
                }else if (available.top >= frame.size.height){
                    placement = UIPopupWindow.Placement.top;
                }
            }
        }else if (placement == UIPopupWindow.Placement.above){
            if (frame.size.height > available.top){
                if (available.bottom >= available.top * 2){
                    placement = UIPopupWindow.Placement.below;
                }else if (available.bottom >= frame.size.height){
                    placement = UIPopupWindow.Placement.below;
                }
            }
        }else if (placement == UIPopupWindow.Placement.left){
            if (frame.size.width > available.left){
                if (available.right >= frame.size.width){
                    placement = UIPopupWindow.Placement.right;
                }else if ((this.windowServer.mouseLocation.x - safeFrame.origin.x) < frame.size.width){
                    placement = UIPopupWindow.Placement.right;
                }
            }
        }else if (placement == UIPopupWindow.Placement.right){
            if (frame.size.width > available.right){
                if (available.left >= frame.size.width){
                    placement = UIPopupWindow.Placement.left;
                }else if ((safeFrame.origin.x + safeFrame.size.width - this.windowServer.mouseLocation.x) < frame.size.width){
                    placement = UIPopupWindow.Placement.left;
                }
            }
        }

        // Place the window and adjust its size if necessary
        if (placement == UIPopupWindow.Placement.below){
            if (frame.size.height > available.bottom){
                frame.size.height = available.bottom;
            }
            frame.origin.y = sourceFrame.origin.y + sourceFrame.size.height;
        }else if (placement == UIPopupWindow.Placement.above){
            if (frame.size.height > available.top){
                frame.size.height = available.top;
            }
            frame.origin.y = sourceFrame.origin.y - frame.size.height;
        }else if (placement == UIPopupWindow.Placement.left){
            if (frame.size.width > available.left){
                sourceFrame = JSRect(
                    Math.max(safeFrame.origin.x + frame.size.width, this.windowServer.mouseLocation.x),
                    sourceFrame.origin.y,
                    1,
                    sourceFrame.size.height
                );
            }
            frame.origin.x = sourceFrame.origin.x - frame.size.width;
        }else if (placement == UIPopupWindow.Placement.right){
            if (frame.size.width > available.right){
                sourceFrame = JSRect(
                    Math.min(safeFrame.origin.x + safeFrame.size.width - frame.size.width, this.windowServer.mouseLocation.x) - 1,
                    sourceFrame.origin.y,
                    1,
                    sourceFrame.size.height
                );
            }
            frame.origin.x = sourceFrame.origin.x + sourceFrame.size.width;
        }

        if (placement == UIPopupWindow.Placement.below || placement == UIPopupWindow.Placement.above){
            frame.origin.x = sourceFrame.origin.x + Math.floor(sourceFrame.size.width / 2) - frame.size.width / 2;
            if (frame.origin.x + frame.size.width > safeFrame.origin.x + safeFrame.size.width){
                frame.origin.x = safeFrame.origin.x + safeFrame.size.width - frame.size.width;
            }
            if (frame.origin.x < safeFrame.origin.x){
                frame.origin.x = safeFrame.origin.x;
                if (frame.size.width > safeFrame.size.width){
                    frame.size.width = safeFrame.size.width;
                }
            }
        }else if (placement == UIPopupWindow.Placement.left || placement == UIPopupWindow.Placement.right){
            frame.origin.y = sourceFrame.origin.y + Math.floor(sourceFrame.size.height / 2) - frame.size.height / 2;
            if (frame.origin.y + frame.size.height > safeFrame.origin.y + safeFrame.size.height){
                frame.origin.y = safeFrame.origin.y + safeFrame.size.height - frame.size.height;
            }
            if (frame.origin.y < safeFrame.origin.y){
                frame.origin.y = safeFrame.origin.y;
                if (frame.size.height > safeFrame.size.height){
                    frame.size.height = safeFrame.size.height;
                }
            }
        }

        // Figure out the anchor point
        if (placement == UIPopupWindow.Placement.below){
            this.anchorPoint = JSPoint(
                (sourceFrame.center.x - frame.origin.x) / frame.size.width,
                0
            );
        }else if (placement == UIPopupWindow.Placement.above){
            this.anchorPoint = JSPoint(
                (sourceFrame.center.x - frame.origin.x) / frame.size.width,
                1
            );
        }else if (placement == UIPopupWindow.Placement.left){
            this.anchorPoint = JSPoint(
                1,
                (sourceFrame.center.y - frame.origin.y) / frame.size.height
            );
        }else if (placement == UIPopupWindow.Placement.right){
            this.anchorPoint = JSPoint(
                0,
                (sourceFrame.center.y - frame.origin.y) / frame.size.height
            );
        }
        // Adjust the anchor point to ensure that our arrow never overflows a corner
        var min, max;
        if (this._showsSourceArrow){
            if (placement == UIPopupWindow.Placement.below || placement == UIPopupWindow.Placement.above){
                min = (this._styler.cornerRadius + this._actualArrowSize) / frame.size.width;
                if (this.anchorPoint.x < min){
                    this.anchorPoint = JSPoint(min, this.anchorPoint.y);
                }else if (this.anchorPoint.x > (1 - min)){
                    this.anchorPoint = JSPoint(1 - min, this.anchorPoint.y);
                }
            }else if (placement == UIPopupWindow.Placement.left || placement == UIPopupWindow.Placement.right){
                min = (this._styler.cornerRadius + this._actualArrowSize) / frame.size.height;
                if (this.anchorPoint.y < min){
                    this.anchorPoint = JSPoint(this.anchorPoint.x, min);
                }else if (this.anchorPoint.y > (1 - min)){
                    this.anchorPoint = JSPoint(this.anchorPoint.x, 1 - min);
                }
            }
        }

        this.placement = placement;
        this.frame = frame;
        this.sourceView = view;

        // Create animated opening, closing
        if (animated){
            var scale = 10 / frame.size.width;
            var window = this;
            if (this.openAnimator === null){
                var openAnimator = UIViewPropertyAnimator.initWithDuration(0.15, UIAnimation.Timing.bounce);
                openAnimator.addAnimations(function(){
                    window.transform = JSAffineTransform.Identity;
                });
                this.openAnimator = openAnimator;
                this.transform = JSAffineTransform.Scaled(scale, scale);
            }
            if (this.closeAnimator === null){
                var closeAnimator = UIViewPropertyAnimator.initWithDuration(0.1);
                closeAnimator.addAnimations(function(){
                    window.transform = JSAffineTransform.Scaled(scale, scale);
                });
                this.closeAnimator = closeAnimator;
            }
        }

        this.makeKeyAndOrderFront();
    },

    repositionSourceArrow: function(){
        var view = this.sourceView;
        if (view === null){
            return;
        }
        var sourceFrame = view.convertRectToScreen(view.bounds);
        var frame = this.untransformedFrame;
        if (sourceFrame === null){
            this.sourceView = null;
            this.showsSourceArrow = false;
            return;
        }
        var x, y;
        var minY = frame.origin.y + this.styler.cornerRadius + this._actualArrowSize;
        var maxY = frame.origin.y + frame.size.height - this.styler.cornerRadius - this._actualArrowSize;
        var minX = frame.origin.x + this.styler.cornerRadius + this._actualArrowSize;
        var maxX = frame.origin.x + frame.size.width - this.styler.cornerRadius - this._actualArrowSize;
        if (this.placement === UIPopupWindow.Placement.left){
            x = sourceFrame.origin.x - this._sourceSpacing;
            if (Math.abs(frame.origin.x + frame.size.width - x) < 1){
                y = sourceFrame.center.y;
                if (y >= minY && y <= maxY){
                    this.anchorPoint = JSPoint(1, (y - frame.origin.y) / frame.size.height);
                    this.untransformedFrame = frame;
                    this.setNeedsLayout();
                }else{
                    this.sourceView = null;
                    this.showsSourceArrow = false;
                }
            }else{
                this.sourceView = null;
                this.showsSourceArrow = false;
            }
        }else if (this.placement === UIPopupWindow.Placement.right){
            x = sourceFrame.origin.x + sourceFrame.size.width + this._sourceSpacing;
            if (Math.abs(frame.origin.x - x) < 1){
                y = sourceFrame.center.y;
                if (y >= minY && y <= maxY){
                    this.anchorPoint = JSPoint(0, (y - frame.origin.y) / frame.size.height);
                    this.untransformedFrame = frame;
                    this.setNeedsLayout();
                }else{
                    this.sourceView = null;
                    this.showsSourceArrow = false;
                }
            }else{
                this.sourceView = null;
                this.showsSourceArrow = false;
            }
        }else if (this.placement === UIPopupWindow.Placement.above){
            y = sourceFrame.origin.y - this._sourceSpacing;
            if (Math.abs(frame.origin.y + frame.size.height - y) < 1){
                x = sourceFrame.center.x;
                if (x >= minX && x <= maxX){
                    this.anchorPoint = JSPoint((x - frame.origin.x) / frame.size.width, 1);
                    this.untransformedFrame = frame;
                    this.setNeedsLayout();
                }else{
                    this.sourceView = null;
                    this.showsSourceArrow = false;
                }
            }else{
                this.sourceView = null;
                this.showsSourceArrow = false;
            }
        }else if (this.placement === UIPopupWindow.Placement.below){
            y = sourceFrame.origin.y + sourceFrame.size.height + this._sourceSpacing;
            if (Math.abs(frame.origin.y - y) < 1){
                x = sourceFrame.center.x;
                if (x >= minX && x <= maxX){
                    this.anchorPoint = JSPoint((x - frame.origin.x) / frame.size.width, 0);
                    this.untransformedFrame = frame;
                    this.setNeedsLayout();
                }else{
                    this.sourceView = null;
                    this.showsSourceArrow = false;
                }
            }else{
                this.sourceView = null;
                this.showsSourceArrow = false;
            }
        }
    },

    openCenteredInView: function(view, animated){
        if (animated === undefined){
            animated = true;
        }
        var sourceFrame = view.convertRectToScreen(view.bounds);
        var safeFrame = view.window.screen.availableFrame.rectWithInsets(20);

        this.sizeToFit();
        var frame = JSRect(this.frame);
        if (frame.size.width > safeFrame.size.width){
            frame.size.width = safeFrame.size.width;
        }
        if (frame.size.height > safeFrame.size.height){
            frame.size.height = safeFrame.size.height;
        }
        this.showsSourceArrow = false;
        this.frame = frame;
        this.anchorPoint = JSPoint(0.5, 0.5);
        this.position = sourceFrame.center;

        // Create animated opening, closing
        if (animated){
            var scale = 10 / frame.size.width;
            var window = this;
            if (this.openAnimator === null){
                var openAnimator = UIViewPropertyAnimator.initWithDuration(0.15, UIAnimation.Timing.bounce);
                openAnimator.addAnimations(function(){
                    window.transform = JSAffineTransform.Identity;
                });
                this.openAnimator = openAnimator;
                this.transform = JSAffineTransform.Scaled(scale, scale);
            }
            if (this.closeAnimator === null){
                var closeAnimator = UIViewPropertyAnimator.initWithDuration(0.1);
                closeAnimator.addAnimations(function(){
                    window.transform = JSAffineTransform.Scaled(scale, scale);
                });
                this.closeAnimator = closeAnimator;
            }
        }
        this.makeKeyAndOrderFront();
    },

    close: function(){
        UIPopupWindow.$super.close.call(this);
        this.sourceView = null;
    },

    modalIndicationClosesWindow: false,

    _modalAnimator: null,

    indicateModalStatus: function(){
        if (this.modalIndicationClosesWindow){
            if (this.openAnimator.percentComplete > 0.9){
                this.close();
            }
            return;
        }
        UIPopupWindow.$super.indicateModalStatus.call(this);
    },

    accessibilityRole: UIAccessibility.Role.popover,

    minimumMoveDistance: 10,

    mouseDragged: function(event){
        if (this._showsSourceArrow && this._isMoving){
            var frameBeforeMoving = this.frame;
            var location = this.convertPointToScreen(event.locationInWindow);
            var distance = this._downLocation ? location.distanceToPoint(this._downLocation) : JSPoint.Zero;
            UIPopupWindow.$super.mouseDragged.call(this, event);
            this._didMove = distance >= this.minimumMoveDistance;
            if (this._didMove){
                this.showsSourceArrow = false;
            }else{
                this.frame = frameBeforeMoving;
            }
        }else{
            UIPopupWindow.$super.mouseDragged.call(this, event);
        }
    },

    _windowServerDidResize: function(frameBeforeResize){
        UIPopupWindow.$super._windowServerDidResize.call(this);
        if (this._showsSourceArrow){
            var frameBeforeReposition = JSRect(this.untransformedFrame);
            this.repositionSourceArrow();
            if (!this._showsSourceArrow){
                var frameAfterReposition = this.untransformedFrame;
                frameBeforeResize.origin.x += frameAfterReposition.origin.x - frameBeforeReposition.origin.x;
                frameBeforeResize.origin.y += frameAfterReposition.origin.y - frameBeforeReposition.origin.y;
                frameBeforeResize.size.width += frameAfterReposition.size.width - frameBeforeReposition.size.width;
                frameBeforeResize.size.height += frameAfterReposition.size.height - frameBeforeReposition.size.height;
            }
        }
    },

});

JSClass("UIPopupWindowStyler", UIWindowStyler, {

    showsSourceArrow: true,
    sourceArrowSize: 10,
    sourceSpacing: 0,
    shadowRadius: 0,
    cornerRadius: 0,
    backgroundColor: null,
    borderColor: null,
    borderWidth: 0,
    shadowColor: null,
    shadowOffset: null,

    init: function(){
        UIPopupWindowStyler.$super.init.call(this);
        this.backgroundColor = JSColor.window;
        this.shadowColor = JSColor.windowShadow;
        this.shadowOffset = JSPoint.Zero;
        this.shadowRadius = UIWindow.Styler.default.shadowRadius;
        this.cornerRadius = UIWindow.Styler.default.cornerRadius;
    },

    initializeWindow: function(window){
        UIPopupWindowStyler.$super.initializeWindow.call(this, window);
        window._showsSourceArrow = this.showsSourceArrow;
        window._sourceArrowSize = this.sourceArrowSize;
        window._sourceSpacing  = this.sourceSpacing;
        this.updateWindow(window);
    },

    updateWindow: function(window){
        var popupBacking = window.stylerProperties.popupBacking;
        var popupArrow = window.stylerProperties.popupArrow;
        if (window._showsSourceArrow){
            if (!popupBacking){
                window.stylerProperties.popupBacking = popupBacking = UIView.init();
                window.insertSubviewAtIndex(popupBacking, 0);
                window.setNeedsLayout();
            }
            if (!popupArrow){
                window.stylerProperties.popupArrow = popupArrow = _UIPopupWindowArrowView.init();
                window.insertSubviewAboveSibling(popupArrow, popupBacking);
                window.setNeedsLayout();
            }
            window.backgroundColor = null;
            window.shadowColor = null;
            window.cornerRadius = 0;
            window.clipsToBounds = false;
            popupBacking.backgroundColor = this.backgroundColor;
            popupBacking.borderColor = this.borderColor;
            popupBacking.borderWidth = this.borderWidth;
            popupBacking.shadowColor = this.shadowColor;
            popupBacking.shadowRadius = this.shadowRadius;
            popupBacking.shadowOffset = this.shadowOffset;
            popupBacking.cornerRadius = this.cornerRadius;
            popupArrow.fillColor = this.backgroundColor;
            popupArrow.lineWidth = this.borderWidth;
            popupArrow.lineColor = this.borderColor;
        }else{
            window.backgroundColor = this.backgroundColor;
            window.shadowColor = this.shadowColor;
            window.shadowRadius = this.shadowRadius;
            window.shadowOffset = this.shadowOffset;
            window.cornerRadius = this.cornerRadius;
            window.borderColor = this.borderColor;
            window.borderWidth = this.borderWidth;
            window.clipsToBounds = true;
            if (popupBacking){
                popupBacking.removeFromSuperview();
                window.stylerProperties.popupBacking = null;
            }
            if (popupArrow){
                popupArrow.removeFromSuperview();
                window.stylerProperties.popupArrow = null;
            }
        }
    },

    layoutWindow: function(window){
        UIPopupWindowStyler.$super.layoutWindow.call(this, window);
        var contentInsets = JSInsets(window.contentInsets);
        if (window._showsSourceArrow){
            var popupBacking = window.stylerProperties.popupBacking;
            var popupArrow = window.stylerProperties.popupArrow;
            var arrowSize = window._actualArrowSize + window.borderWidth;
            var anchorPosition = JSPoint(window.bounds.size.width * window.anchorPoint.x, window.bounds.size.height * window.anchorPoint.y);
            if (window.placement == UIPopupWindow.Placement.below){
                contentInsets.top += window._actualArrowSize;
                if (popupBacking){
                    popupBacking.frame = window.bounds.rectWithInsets(window._actualArrowSize, 0, 0, 0);
                }
                if (popupArrow){
                    popupArrow.transform = JSAffineTransform.Identity;
                }
            }else if (window.placement == UIPopupWindow.Placement.above){
                contentInsets.bottom += window._actualArrowSize;
                if (popupBacking){
                    popupBacking.frame = window.bounds.rectWithInsets(0, 0, window._actualArrowSize, 0);
                }
                if (popupArrow){
                    popupArrow.transform = JSAffineTransform.RotatedDegrees(180);
                }
            }else if (window.placement == UIPopupWindow.Placement.left){
                contentInsets.right += window._actualArrowSize;
                if (popupBacking){
                    popupBacking.frame = window.bounds.rectWithInsets(0, 0, 0, window._actualArrowSize);
                }
                if (popupArrow){
                    popupArrow.transform = JSAffineTransform.RotatedDegrees(90);
                }
            }else if (window.placement == UIPopupWindow.Placement.right){
                contentInsets.left += window._actualArrowSize;
                if (popupBacking){
                    popupBacking.frame = window.bounds.rectWithInsets(0, window._actualArrowSize, 0, 0);
                }
                if (popupArrow){
                    popupArrow.transform = JSAffineTransform.RotatedDegrees(-90);
                }
            }
            if (popupArrow){
                popupArrow.bounds = JSRect(0, 0, arrowSize + arrowSize + this.borderWidth + this.borderWidth, arrowSize + this.borderWidth);
                popupArrow.position = anchorPosition;
                popupArrow.anchorPoint = JSPoint(0.5, 0);
            }
            window._resizeView = popupBacking;
        }else{
            window._resizeView = null;
        }
        window._contentView.frame = window.bounds.rectWithInsets(contentInsets);
    },

});

JSClass("_UIPopupWindowArrowView", UIView, {

    fillColor: JSDynamicProperty('_fillColor', null),
    lineColor: JSDynamicProperty('_lineColor', null),
    lineWidth: JSDynamicProperty('_lineWidth', 0),

    setFillColor: function(fillColor){
        this._fillColor = fillColor;
        this.setNeedsDisplay();
    },

    setLineColor: function(lineColor){
        this._lineColor = lineColor;
        this.setNeedsDisplay();
    },

    setLineWidth: function(lineWidth){
        this._lineWidth = lineWidth;
        this.setNeedsDisplay();
    },

    drawLayerInContext: function(layer, context){
        if (this._fillColor === null && this._strokeColor === null){
            return;
        }
        context.setLineWidth(this._lineWidth);
        if (this._lineColor !== null && this._lineWidth > 0){
            context.setStrokeColor(this._lineColor);
        }
        if (this._fillColor !== null){
            context.setFillColor(this._fillColor);
        }
        var drawingMode;
        if (this._fillColor !== null && this._strokeColor !== null && this._lineWidth > 0){
            drawingMode = JSContext.DrawingMode.fillStroke;
        }else if (this._fillColor !== null){
            drawingMode = JSContext.DrawingMode.fill;
        }else{
            drawingMode = JSContext.DrawingMode.stroke;
        }
        var bounds = this.bounds;
        var miter = Math.sqrt(2) * this._lineWidth / 2;
        context.beginPath();
        context.addRect(bounds);
        context.clip();
        context.beginPath();
        context.moveToPoint(miter, bounds.size.height);
        context.addLineToPoint(bounds.size.width / 2, miter);
        context.addLineToPoint(bounds.size.width - miter, bounds.size.height);
        context.drawPath(drawingMode);
    }

});

UIPopupWindow.Placement = {
    above: 0,
    below: 1,
    left: 2,
    right: 3
};

UIPopupWindow.Styler = Object.create({}, {

    default: {
        configurable: true,
        get: function UIPopupWindow_getDefaultStyler(){
            var styler = UIPopupWindowStyler.init();
            Object.defineProperty(this, 'default', {configurable: true, value: styler});
            return styler;
        },
        set: function UIPopupWindow_setDefaultStyler(styler){
            Object.defineProperty(this, 'default', {configurable: true, value: styler});
        }
    }

});