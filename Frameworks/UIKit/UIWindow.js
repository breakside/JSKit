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
// #import "UIApplication.js"
// #import "UITouch.js"
// #import "UIButton.js"
// #import "UILabel.js"
// #import "UIImageView.js"
// #import "UIToolbar.js"
// #import "UIToolbarItem.js"
// #import "UIViewPropertyAnimator.js"
// #import "UIViewController.js"
// #import "UIFocusRingLayer.js"
/* global UISplitView */
'use strict';

(function(){

var logger = JSLog("uikit", "uiwindow");

JSClass('UIWindow', UIView, {

    // -------------------------------------------------------------------------
    // MARK: - Creating a Window

    init: function(){
        UIWindow.$super.init.call(this);
    },

    initWithFrame: function(frame){
        this._application = UIApplication.shared;
        UIWindow.$super.initWithFrame.call(this, frame);
        this._commonWindowInit();
    },

    initWithApplication: function(application){
        this._application = application;
        UIWindow.$super.init.call(this);
        this._commonWindowInit();
    },

    initWithStyler: function(styler){
        this._styler = styler;
        this.init();
    },

    initWithSpec: function(spec){
        this._application = UIApplication.shared;
        UIWindow.$super.initWithSpec.call(this, spec);
        if (spec.containsKey('contentViewController')){
            this.contentViewController = spec.valueForKey("contentViewController", UIViewController);
        }else if (spec.containsKey('contentView')){
            this.contentView = spec.valueForKey("contentView", UIView);
        }
        if (spec.containsKey('styler')){
            this._styler = spec.valueForKey("styler", UIWindow.Styler);
        }
        this._commonWindowInit();
        if (spec.containsKey('contentInsets')){
            this._contentInsets = spec.valueForKey("contentInsets", JSInsets);
        }
        if (spec.containsKey('showsContentSeparator')){
            this.showsContentSeparator = spec.valueForKey("showsContentSeparator");
        }
        if (spec.containsKey('isUserMovable')){
            this.isUserMovable = spec.valueForKey("isUserMovable");
        }
        if (spec.containsKey('isMovableByContent')){
            this.isMovableByContent = spec.valueForKey("isMovableByContent");
        }
        if (spec.containsKey('escapeClosesWindow')){
            this.escapeClosesWindow = spec.valueForKey("escapeClosesWindow");
        }
        if (spec.containsKey('allowsClose')){
            this._allowsClose = spec.valueForKey("allowsClose");
        }
        if (spec.containsKey('firstResponder')){
            this._initialFirstResponder = spec.valueForKey("firstResponder");
        }
        if (spec.containsKey('heightTracksContent')){
            this._heightTracksContent = spec.valueForKey("heightTracksContent");
        }
        if (spec.containsKey('widthTracksContent')){
            this._widthTracksContent = spec.valueForKey("widthTracksContent");
        }
        if (spec.containsKey('title')){
            this.title = spec.valueForKey("title");
        }
        if (spec.containsKey('icon')){
            this.icon = spec.valueForKey("icon", JSImage);
        }
        if (spec.containsKey('autosaveName')){
            this.autosaveName = spec.valueForKey("autosaveName");
        }
        if (spec.containsKey('toolbar')){
            this._toolbar = spec.valueForKey("toolbar", UIToolbar);
        }
        if (spec.containsKey('backgroundColor')){
            this.backgroundColor = spec.valueForKey('backgroundColor', JSColor);
        }
        if (spec.containsKey('shouldReceiveTrackingInBack')){
            this.shouldReceiveTrackingInBack = spec.valueForKey("shouldReceiveTrackingInBack");
        }
    },

    _commonWindowInit: function(){
        this.window = this;
        if (this.backgroundColor === null){
            this.backgroundColor = JSColor.background;
        }
        this.clipsToBounds = true;
        if (this._contentView === null){
            this.contentView = UIView.init();
        }
        if (this._contentInsets === null){
            this._contentInsets = JSInsets.Zero;
        }
        if (this._styler === null){
            if (this.level == UIWindow.Level.back){
                this._styler = UIWindow.Styler.custom;
            }else{
                this._styler = UIWindow.Styler.default;
            }
        }
        this._traitCollection = this.windowServer.traitCollection.traitsWithSize(this.bounds.size);
        this.stylerProperties = {};
        this._styler.initializeWindow(this);
    },

    // -------------------------------------------------------------------------
    // MARK: - Styler

    styler: JSReadOnlyProperty("_styler", null),
    stylerProperties: null,

    // -------------------------------------------------------------------------
    // MARK: - Controls

    title: JSDynamicProperty('_title', null),
    icon: JSDynamicProperty('_icon', null),
    allowsClose: JSDynamicProperty('_allowsClose', true),

    setTitle: function(title){
        this._title = title;
        this.setNeedsLayout();
        this._styler.updateWindow(this);
        this.postAccessibilityNotification(UIAccessibility.Notification.labelChanged);
    },

    setIcon: function(icon){
        this._icon = icon;
        this.setNeedsLayout();
        this._styler.updateWindow(this);
    },

    setAllowsClose: function(allowsClose){
        this._allowsClose = allowsClose;
        this.setNeedsLayout();
        this._styler.updateWindow(this);
    },

    // -------------------------------------------------------------------------
    // MARK: - Toolbar

    toolbar: JSDynamicProperty('_toolbar', null),

    setToolbar: function(toolbar){
        this._toolbar = toolbar;
        this._styler.updateWindow(this);
        this.setNeedsLayout();
    },

    _validateToolbar: function(){
        if (!this._toolbar){
            return;
        }
        this._toolbar.validateItems();
    },

    // -------------------------------------------------------------------------
    // MARK: - Content View

    showsContentSeparator: JSDynamicProperty('_showsContentSeparator', false),
    contentViewController: JSDynamicProperty('_contentViewController', null),
    contentView: JSDynamicProperty('_contentView', null),
    contentInsets: JSDynamicProperty('_contentInsets', null),

    setContentView: function(contentView){
        if (contentView === null){
            contentView = UIView.init();
        }
        if (this._contentView !== null){
            this._contentView.removeFromSuperview();
        }
        this._contentView = contentView;
        this._contentViewController = null;
        if (this._contentView !== null){
            this.addSubview(this._contentView);
        }
        this.setNeedsLayout();
    },

    setContentViewController: function(contentViewController){
        var previousViewController = this._contentViewController;
        if (this._isVisible){
            if (previousViewController !== null){
                previousViewController.scheduleDisappearance();
            }
            if (contentViewController !== null){
                contentViewController.scheduleAppearance();
            }
        }
        if (contentViewController !== null){
            this.contentView = contentViewController.view;
        }
        this._contentViewController = contentViewController;
    },

    setContentInsets: function(contentInsets){
        this._contentInsets = JSInsets(contentInsets);
        this.setNeedsLayout();
    },

    setShowsContentSeparator: function(showsContentSeparator){
        this._showsContentSeparator = showsContentSeparator;
        this.setNeedsLayout();
        this._styler.updateWindow(this);
    },

    heightTracksContent: JSDynamicProperty('_heightTracksContent', false),
    widthTracksContent: JSDynamicProperty('_widthTracksContent', false),

    setHeightTracksContent: function(heightTracksContent){
        this._heightTracksContent = heightTracksContent;
        this.setNeedsLayout();
    },

    setWidthTracksContent: function(widthTracksContent){
        this._widthTracksContent = widthTracksContent;
        this.setNeedsLayout();
    },

    // -------------------------------------------------------------------------
    // MARK: - Layout

    sizeToFit: function(){
        if (this._widthTracksContent || this._heightTracksContent){
            var size = JSSize(Number.MAX_VALUE, Number.MAX_VALUE);
            if (!this._widthTracksContent){
                size.width = this.bounds.size.width - this._contentInsets.left - this._contentInsets.right;
            }
            if (!this._heightTracksContent){
                size.height = this.bounds.size.height - this._contentInsets.top - this._contentInsets.bottom;
            }
            var fitSize;
            if (this.viewController){
                fitSize = this.viewController.contentSizeThatFitsSize(size);
            }else if (this._contentViewController){
                fitSize = this._contentViewController.contentSizeThatFitsSize(size);
            }else{
                this._contentView.sizeToFitSize(size);
                fitSize = this._contentView.frame.size;
            }

            this.bounds = JSRect(
                0,
                0,
                fitSize.width + this._contentInsets.left + this._contentInsets.right,
                fitSize.height + this._contentInsets.top + this._contentInsets.bottom
            );
        }
    },

    setNeedsLayout: function(){
        UIWindow.$super.setNeedsLayout.call(this);
    },

    layoutSubviews: function(){
        UIWindow.$super.layoutSubviews.call(this);
        this._styler.layoutWindow(this);
        this._updatingFocusRing = true;
        this._styler.updateFocusRingInWindow(this, this._focusRingAnimated);
        this._updatingFocusRing = false;
        this._focusRingAnimated = true;
    },

    _updatingFocusRing: false,
    _focusRingAnimated: true,

    invalidateFocusRing: function(animated){
        if (!this._updatingFocusRing){
            this._focusRingAnimated = animated;
            this.setNeedsLayout();
        }
    },

    zIndex: JSDynamicProperty(),

    setZIndex: function(zIndex){
        logger.warn("setting zIndex on UIWindow has no effect");
    },

    getZIndex: function(){
        return 0;
    },

    // -------------------------------------------------------------------------
    // MARK: Traits

    layerDidChangeSize: function(layer){
        UIWindow.$super.layerDidChangeSize.call(this, layer);
        if (this._traitCollection !== null){
            var traits = this._traitCollection.traitsWithSize(this.bounds.size);
            this._setTraitCollection(traits);
        }
    },
    
    traitCollection: JSReadOnlyProperty('_traitCollection', null),

    _setTraitCollection: function(traitCollection){
        var previous = this._traitCollection;
        this._traitCollection = traitCollection;
        if (previous !== null && !previous.isEqual(this._traitCollection)){
            this.traitCollectionDidChange(previous);
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Main Window

    canBecomeMainWindow: function(){
        return true;
    },

    makeMain: function(){
        this.windowServer.makeWindowMain(this);
    },

    becomeMain: function(){
        this._styler.updateWindow(this);
        this._validateToolbar();
    },

    resignMain: function(){
        this._styler.updateWindow(this);
    },

    isMainWindow: JSReadOnlyProperty(),

    getIsMainWindow: function(){
        return this.windowServer.mainWindow === this;
    },

    // -------------------------------------------------------------------------
    // MARK: - Key Window

    canBecomeKeyWindow: function(){
        return true;
    },

    makeKey: function(){
        this.windowServer.makeWindowKey(this);
    },

    becomeKey: function(){
        this._styler.updateWindow(this);
        this.setNeedsLayout();
        this.contentView.windowDidChangeKeyStatus();
        this._validateToolbar();
    },

    resignKey: function(){
        this._styler.updateWindow(this);
        this.setNeedsLayout();
        this.contentView.windowDidChangeKeyStatus();
    },

    isKeyWindow: JSReadOnlyProperty(),

    getIsKeyWindow: function(){
        return this.windowServer.keyWindow === this;
    },

    makeKeyAndOrderFront: function(){
        this.orderFront();
        this.makeKey();
    },

    receivesAllEvents: false,

    // -------------------------------------------------------------------------
    // MARK: - Opening & Closing

    escapeClosesWindow: false,
    openAnimator: null,
    closeAnimator: null,
    _isOpen: false,

    open: function(){
        this.orderFront();
    },

    close: function(){
        if (!this._isOpen){
            return;
        }
        if (this.viewController){
            this.viewController.viewWillDisappear(false);
        }else if (this._contentViewController){
            this._contentViewController.viewWillDisappear(false);
        }
        if (this.openAnimator !== null){
            this.openAnimator.stopAndCallCompletions();
        }
        if (this.closeAnimator !== null){
            var self = this;
            this.closeAnimator.addCompletion(function(){
                self.windowServer.windowRemoved(self);
            });
            this.closeAnimator.start();
        }else{
            this.windowServer.windowRemoved(this);
        }
        this._isOpen = false;
    },

    orderFront: function(){
        if (this._parent && this._parent.modal === this){
            this._parent.orderFront();
        }
        if (!this._isOpen){
            if (this.viewController){
                this.viewController.viewWillAppear(false);
            }else if (this._contentViewController){
                this._contentViewController.viewWillAppear(false);
            }
            this._shouldCallDidAppear = true;
        }
        this.windowServer.orderWindowFront(this);
        if (!this._isOpen){
            if (this.closeAnimator !== null){
                this.closeAnimator.stop();
            }
            this._isOpen = true;
            if (this.openAnimator !== null){
                this.openAnimator.start();
            }
        }
    },

    _shouldCallDidAppear: false,
    _isVisible: false,

    didBecomeVisible: function(){
        var index = this._application._windows.indexOf(this);
        if (index < 0){
            this._application._windows.push(this);
        }
        this._isVisible = true;
        if (this._shouldCallDidAppear){
            this._shouldCallDidAppear = false;
            if (this.viewController){
                this.viewController.viewDidAppear(false);
            }else if (this._contentViewController){
                this._contentViewController.viewDidAppear(false);
            }
        }
        if (this._initialFirstResponder !== null){
            var responder = this._initialFirstResponder;
            this._initialFirstResponder = null;
            this.setFirstResponder(responder);
        }
        if (this.isAccessibilityElement){
            this.postAccessibilityNotification(UIAccessibility.Notification.elementCreated);
        }
    },

    didClose: function(){
        if (this.viewController){
            this.viewController.viewDidDisappear(false);
        }else if (this._contentViewController){
            this._contentViewController.viewDidDisappear(false);
        }
        this._isVisible = false;
        if (this._parent && this._parent.modal === this){
            this._parent._modal = null;
            this._parent._flushTrackingEvents();
        }
        if (this.isAccessibilityElement){
            this.postAccessibilityNotification(UIAccessibility.Notification.elementDestroyed);
        }
        var index = this._application._windows.indexOf(this);
        if (index >= 0){
            this._application._windows.splice(index, 1);
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Window Server

    windowServer: JSReadOnlyProperty(),
    application: JSReadOnlyProperty('_application', null),
    scene: JSReadOnlyProperty('_scene', null),
    screen: JSReadOnlyProperty('_screen', null),
    level: 0,

    getWindowServer: function(){
        if (this._application !== null){
            return this._application.windowServer;
        }
        return null;
    },

    // -------------------------------------------------------------------------
    // MARK: - Modal

    modal: JSDynamicProperty('_modal', null),
    parent: JSReadOnlyProperty('_parent'),

    setModal: function(modal){
        if (this._modal !== null && this._modal._isOpen){
            this._modal.modal = modal;
        }else{
            this._modal = modal;
            this._modal._parent = this;
        }
    },

    _modalAnimator: null,

    indicateModalStatus: function(){
        if (this._modalAnimator !== null){
            return;
        }
        var window = this;
        var transform = this.transform;
        this._modalAnimator = UIViewPropertyAnimator.initWithDuration(0.075);
        this._modalAnimator.addAnimations(function(){
            window.transform = transform.scaledBy(1.15);
        });
        this._modalAnimator.addCompletion(function(){
            window._modalAnimator = UIViewPropertyAnimator.initWithDuration(0.075);
            window._modalAnimator.addAnimations(function(){
                window.transform = transform;
            });
            window._modalAnimator.addCompletion(function(){
                window._modalAnimator = null;
            });
            window._modalAnimator.start();
        });
        this._modalAnimator.start();
    },

    // -------------------------------------------------------------------------
    // MARK: - Events

    isUserMovable: true,
    isMovableByContent: true,
    _downLocation: null,
    _downOrigin: null,
    _isMoving: false,
    _didMove: false,

    mouseDown: function(event){
        // this.setFirstResponder(null);
        if (this.level == UIWindow.Level.normal && this.isUserMovable){
            var contentLocation = event.locationInView(this.contentView);
            if (this.containsPoint(event.locationInWindow) && (this.isMovableByContent || !this.contentView.containsPoint(contentLocation))){
                this._downLocation = this.convertPointToScreen(event.locationInWindow);
                this._downOrigin = JSPoint(this.frame.origin);
                this._isMoving = true;
            }else{
                UIWindow.$super.mouseDown.call(this, event);
            }
        }else{
            UIWindow.$super.mouseDown.call(this, event);
        }
    },

    mouseDragged: function(event){
        if (!this._isMoving){
            UIWindow.$super.mouseDragged.call(this, event);
            return;
        }
        this._didMove = true;
        var location = this.convertPointToScreen(event.locationInWindow);
        var d = JSPoint(location.x - this._downLocation.x, location.y - this._downLocation.y);
        var origin = JSPoint(this._downOrigin.x + d.x, this._downOrigin.y + d.y);
        var safeArea = this.screen.availableFrame;
        var over = JSPoint(origin.x - safeArea.origin.x - safeArea.size.width, origin.y - safeArea.origin.y - safeArea.size.height);
        if (over.x > 0){
            origin.x -= over.x;
        }
        if (over.y > 0){
            origin.y -= over.y;
        }
        if (origin.y < safeArea.origin.y){
            origin.y = safeArea.origin.y;
        }
        this.frame = JSRect(origin, this.frame.size);
    },

    mouseUp: function(){
        if (this._isMoving){
            this._isMoving = false;
            if (this._didMove){
                this._didMove = false;
                this._autosaveToUserDefaults();
            }
        }
        this._downLocation = null;
        this._downOrigin = null;
    },

    keyDown: function(event){
        if (this._allowsClose && this.escapeClosesWindow && event.key == UIEvent.Key.escape && event.modifiers === UIEvent.Modifier.none){
            this.close();
            return;
        }
        if (event.key === UIEvent.Key.tab && (event.modifiers === UIEvent.Modifier.none || event.modifiers === UIEvent.Modifier.shift)){
            if (this.firstResponder !== null){
                if (event.modifiers === UIEvent.Modifier.shift){
                    this.setFirstResponderToKeyViewBeforeView(this.firstResponder);
                }else{
                    this.setFirstResponderToKeyViewAfterView(this.firstResponder);
                }
            }
            return;
        }
        var next = this._nextKeyResponder();
        if (next !== null){
            next.keyDown(event);
        }
    },

    keyUp: function(event){
        var next = this._nextKeyResponder();
        if (next !== null){
            next.keyUp(event);
        }
    },

    _nextKeyResponder: function(){
        var responder = this.getNextResponder();
        if (responder === this._application){
            if (this.isKeyWindow && this.windowServer.mainWindow !== null && this.windowServer.mainWindow !== this){
                return this.windowServer.mainWindow;
            }
        }
        return responder;
    },

    // -------------------------------------------------------------------------
    // MARK: - First Responder

    firstResponder: JSDynamicProperty('_firstResponder', null),
    initialFirstResponder: JSDynamicProperty('_initialFirstResponder', null),

    canBecomeFirstResponder: function(){
        return true;
    },

    getFirstResponder: function(){
        return this._firstResponder;
    },

    setFirstResponder: function(responder){
        if (responder !== null && responder.window !== this){
            responder = null;
        }
        if (responder !== this._firstResponder){
            var previousResponder = this._firstResponder;
            var didResignResponder = true;
            if (previousResponder !== null){
                if (previousResponder.canResignFirstResponder()){
                    this._firstResponder = null;
                    previousResponder.resignFirstResponder();
                    didResignResponder = true;
                }else{
                    didResignResponder = false;
                }
            }
            if (didResignResponder && responder !== null){
                if (responder.canBecomeFirstResponder()){
                    this._firstResponder = responder;
                    responder.becomeFirstResponder();
                }
            }
            if (this._firstResponder !== previousResponder){
                this._validateToolbar();
                this.setNeedsLayout();
                this.windowServer.windowDidChangeResponder(this);
            }
        }else{
            if (responder !== null){
                this.windowServer.windowDidReaffirmFirstResponder(this);
            }
        }
    },

    getNextResponder: function(){
        if (this.viewController !== null){
            return this.viewController;
        }
        return this._application;
    },

    // -------------------------------------------------------------------------
    // MARK: - Key View Loop

    setFirstResponderToKeyViewAfterView: function(view){
        var nextKeyView = view.nextValidKeyView;
        if (nextKeyView !== null){
            this.firstResponder = nextKeyView;
        }
    },

    setFirstResponderToKeyViewBeforeView: function(view){
        var prevousKeyView = view.previousValidKeyView;
        if (prevousKeyView !== null){
            this.firstResponder = prevousKeyView;
        }
    },

    calculateKeyViewLoop: function(){
    },

    // -------------------------------------------------------------------------
    // MARK: - Coordinate Space Conversions

    convertPointFromScreen: function(point){
        if (this._screen === null){
            return null;
        }
        return this.layer._convertPointFromSuperlayer(JSPoint(point.x - this._screen.frame.origin.x, point.y - this.screen.frame.origin.y));
    },

    convertPointToScreen: function(point){
        if (this._screen === null){
            return null;
        }
        point = this.layer._convertPointToSuperlayer(point);
        return JSPoint(point.x + this._screen.frame.origin.x, point.y + this._screen.frame.origin.y);
    },

    convertRectFromScreen: function(rect){
        if (this._screen === null){
            return null;
        }
        return JSRect(this.convertPointFromScreen(rect.origin), rect.size);
    },

    convertRectToScreen: function(rect){
        if (this._screen === null){
            return null;
        }
        return JSRect(this.convertPointToScreen(rect.origin), rect.size);
    },

    // -------------------------------------------------------------------------
    // MARK: - Mouse Tracking

    mouseTrackingViews: null,

    addMouseTrackingView: function(view){
        if (this.mouseTrackingViews === null){
            this.mouseTrackingViews = [];
        }
        var index = this.mouseTrackingViews.indexOf(view);
        if (index < 0){
            this.mouseTrackingViews.push(view);
        }
    },

    removeMouseTrackingView: function(view){
        if (this.mouseTrackingViews === null){
            return;
        }
        var index = this.mouseTrackingViews.indexOf(view);
        if (index >= 0){
            this.mouseTrackingViews.splice(index, 1);
        }
    },

    sendMouseTrackingEvents: function(locationInWindow, timestamp, modifiers, isExiting){
        if (this.mouseTrackingViews === null || this.mouseTrackingViews.length === 0){
            return;
        }
        if (this._modal !== null){
            return;
        }
        var view;
        var area;
        var viewIndex, viewCount;
        var areaIndex, areaCount;
        var location;
        var enters = [];
        var exits = [];
        var moves = [];
        for (viewIndex = 0, viewCount = this.mouseTrackingViews.length; viewIndex < viewCount; ++viewIndex){
            view = this.mouseTrackingViews[viewIndex];
            if (!view.userVisible){
                continue;
            }
            location = this.convertPointToView(locationInWindow, view);
            for (areaIndex = 0, areaCount = view._mouseTrackingAreas.length; areaIndex < areaCount; ++areaIndex){
                area = view._mouseTrackingAreas[areaIndex];
                if (!isExiting && !view.hidden && view.userInteractionEnabled && area.containsPoint(location)){
                    if (!area._entered){
                        area._entered = true;
                        if ((area.trackingType & UIMouseTrackingArea.TrackingType.enterAndExit) !== 0){
                            enters.push(area);
                        }
                    }
                    moves.push(area);
                }else{
                    if (area._entered){
                        area._entered = false;
                        if ((area.trackingType & UIMouseTrackingArea.TrackingType.enterAndExit) !== 0){
                            exits.push(area);
                        }
                    }
                }
            }
        }
        // FIXME: the order could be important here for views that overlap and
        // set cursors.  We'd want the topmost one to be called last for enters
        // and first for exits
        var event;
        if (exits.length > 0){
            event = UIEvent.initMouseEventWithType(UIEvent.Type.mouseExited, timestamp, this, locationInWindow, modifiers, 0);
            for (areaIndex = 0, areaCount = exits.length; areaIndex < areaCount; ++areaIndex){
                area = exits[areaIndex];
                area.mouseExited(event);
            }
            for (areaIndex = 0, areaCount = moves.length; areaIndex < areaCount; ++areaIndex){
                area = moves[areaIndex];
                if (area.cursor !== null){
                    area.cursor.set();
                }
            }
        }
        if (enters.length > 0){
            event = UIEvent.initMouseEventWithType(UIEvent.Type.mouseEntered, timestamp, this, locationInWindow, modifiers, 0);
            for (areaIndex = 0, areaCount = enters.length; areaIndex < areaCount; ++areaIndex){
                area = enters[areaIndex];
                area.mouseEntered(event);
            }
        }
        if (moves.length > 0){
            event = UIEvent.initMouseEventWithType(UIEvent.Type.mouseMoved, timestamp, this, locationInWindow, modifiers, 0);
            for (areaIndex = 0, areaCount = moves.length; areaIndex < areaCount; ++areaIndex){
                area = moves[areaIndex];
                if ((area.trackingType & UIMouseTrackingArea.TrackingType.move) !== 0){
                    area.mouseMoved(event);
                }
            }
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Event Dispatch

    sendEvent: function(event){
        switch (event.category){
            case UIEvent.Category.mouse:
                this._sendMouseEvent(event);
                break;
            case UIEvent.Category.key:
                this._sendKeyEvent(event);
                break;
            case UIEvent.Category.touches:
                this._sendTouchEvent(event);
                break;
            case UIEvent.Category.scroll:
                this._sendScrollEvent(event);
                break;
            case UIEvent.Category.gesture:
                this._sendGestureEvent(event);
                break;
        }
    },

    adoptMouseEvents: function(fromWindow){
        this.mouseEventView = this;
        this.mouseDownType = fromWindow.mouseDownType;
    },

    cancelMouseEvents: function(){
        this.mouseEventView = null;
        this.mouseDownType = null;
    },

    shouldReceiveTrackingInBack: false,

    mouseEventView: null,
    mouseDownType: null,

    _sendMouseEvent: function(event){
        var modal = this._modal;
        while (modal !== null && modal._modal !== null){
            modal = modal._modal;
        }
        if (this.mouseEventView !== null && this.mouseEventView.window !== this){
            this.mouseEventView = null;
        }
        if (modal !== null){
            this.mouseEventView = null;
            if (event.type == UIEvent.Type.mouseEntered || event.type == UIEvent.Type.mouseExited || event.type == UIEvent.mouseMoved){
                this._enqueueTrackingEvent(event);
                return;
            }
            if (event.type == UIEvent.Type.leftMouseDown || event.type == UIEvent.Type.leftMouseDragged || event.type == UIEvent.Type.rightMouseDown || event.type == UIEvent.Type.rightMouseDragged){
                if (modal._isOpen){
                    modal.makeKeyAndOrderFront();
                    modal.indicateModalStatus();
                }
                return;
            }
        }
        if (this.mouseEventView === null && event.type == UIEvent.Type.leftMouseDown || event.type == UIEvent.Type.rightMouseDown){
            this.mouseEventView = this.hitTest(event.locationInWindow) || this;
            this.mouseDownType = event.type;
        }
        var eventTarget = event.trackingView || this.mouseEventView;
        if (eventTarget === null){
            return;
        }
        switch (event.type){
            case UIEvent.Type.leftMouseDown:
                if (this._isOpen){
                    this.makeKeyAndOrderFront();
                }
                eventTarget.mouseDown(event);
                this._validateToolbar();
                break;
            case UIEvent.Type.leftMouseUp:
                eventTarget.mouseUp(event);
                if (this.mouseDownType == UIEvent.Type.leftMouseDown){
                    this.mouseEventView = null;
                }
                this._validateToolbar();
                break;
            case UIEvent.Type.leftMouseDragged:
                eventTarget.mouseDragged(event);
                break;
            case UIEvent.Type.rightMouseDown:
                eventTarget.rightMouseDown(event);
                this._validateToolbar();
                break;
            case UIEvent.Type.rightMouseUp:
                eventTarget.rightMouseUp(event);
                if (this.mouseDownType == UIEvent.Type.rightMouseDown){
                    this.mouseEventView = null;
                }
                this._validateToolbar();
                break;
            case UIEvent.Type.rightMouseDragged:
                eventTarget.rightMouseDragged(event);
                break;
            case UIEvent.Type.mouseEntered:
                eventTarget.mouseEntered(event);
                break;
            case UIEvent.Type.mouseExited:
                eventTarget.mouseExited(event);
                break;
            case UIEvent.Type.mouseMoved:
                eventTarget.mouseMoved(event);
                break;
        }

    },

    _trackingEventQueue: null,

    _enqueueTrackingEvent: function(event){
        if (this._trackingEventQueue === null){
            this._trackingEventQueue = [];
        }
        this._trackingEventQueue.push(event);
    },

    _flushTrackingEvents: function(){
        if (this._trackingEventQueue !== null){
            var event;
            for (var i = 0, l = this._trackingEventQueue.length; i < l; ++i){
                event = this._trackingEventQueue[i];
                this.sendEvent(event);
            }
            this._trackingEventQueue = null;
        }
    },

    _sendScrollEvent: function(event){
        var view = this.hitTest(event.locationInWindow);
        if (view){
            switch (event.type){
                case UIEvent.Type.scrollWheel:
                    view.scrollWheel(event);
                    break;
            }
        }
    },

    _sendGestureEvent: function(event){
        if (this._modal !== null){
            return;
        }
        var view = this.hitTest(event.locationInWindow);
        if (view){
            switch (event.type){
                case UIEvent.Type.magnify:
                    view.magnify(event);
                    break;
                case UIEvent.Type.rotate:
                    view.rotate(event);
                    break;
            }
        }
    },

    _hadModalWhenTouchesBegan: false,

    _sendTouchEvent: function(event){
        var modal = this._modal;
        while (modal !== null && modal._modal !== null){
            modal = modal._modal;
        }
        var i, l;
        if (event.type === UIEvent.Type.touchesBegan){
            if (!event.hasPastTouches()){
                this._hadModalWhenTouchesBegan = modal !== null;
            }
        }
        if (modal !== null){
            if (event.type == UIEvent.Type.touchesEnded){
                if (modal._isOpen && !event.hasFutureTouches() && this._hadModalWhenTouchesBegan){
                    modal.makeKeyAndOrderFront();
                    modal.indicateModalStatus();
                }
            }
            return;
        }
        var j, k;
        // We only dispatch the touches that changed in this version of the event.
        // A view can get all the touches it wants from the event.
        var changedTouches = event.changedTouchesInWindow(this);
        if (changedTouches.length === 0){
            return;
        }
        var touch;
        var view;
        var changedTouchesByView = {};
        for (i = 0, l = changedTouches.length; i < l; ++i){
            touch = changedTouches[i];
            if (touch.view){
                if (!changedTouchesByView[touch.view.objectID]){
                    changedTouchesByView[touch.view.objectID] = [];
                }
                changedTouchesByView[touch.view.objectID].push(touch);
            }
        }
        if (event.type === UIEvent.Type.touchesBegan){
            var allTouches = event.touches;
            var allTouchesByView = {};
            for (i = 0, l = allTouches.length; i < l; ++i){
                touch = allTouches[i];
                if (touch.view){
                    if (!allTouchesByView[touch.view.objectID]){
                        allTouchesByView[touch.view.objectID] = [];
                    }
                    allTouchesByView[touch.view.objectID].push(touch);
                }
            }
            for (i = 0, l = changedTouches.length; i < l; ++i){
                touch = changedTouches[i];
                if (touch.view !== null){
                    logger.warn("beginning touch that already has a view");
                    continue;
                }
                view = this.hitTest(touch.locationInWindow) || this;
                // For views that don't support multiple touch, only the first
                // seen touch will be associated with the view.  If a touch isn't
                // associated with a view here on touchesBegan, the touch will
                // never be sent to any view for any future event.
                if (view.isMultipleTouchEnabled || !allTouchesByView[view.objectID]){
                    allTouchesByView[view.objectID] = [];
                    if (!changedTouchesByView[view.objectID]){
                        changedTouchesByView[view.objectID] = [];
                    }
                    touch.view = view;
                    changedTouchesByView[view.objectID].push(touch);
                    allTouchesByView[view.objectID].push(touch);
                }
            }
        }
        for (var id in changedTouchesByView){
            changedTouches = changedTouchesByView[id];
            view = changedTouches[0].view;
            if (view.window === this){
                switch (event.type){
                    case UIEvent.Type.touchesBegan:
                        view.touchesBegan(changedTouches, event);
                        break;
                    case UIEvent.Type.touchesMoved:
                        view.touchesMoved(changedTouches, event);
                        break;
                    case UIEvent.Type.touchesCanceled:
                        view.touchesCanceled(changedTouches, event);
                        break;
                    case UIEvent.Type.touchesEnded:
                        view.touchesEnded(changedTouches, event);
                        break;
                }
            }
        }
    },

    _sendKeyEvent: function(event){
        var view = this._firstResponder || this;
        if (view){
            switch (event.type){
                case UIEvent.Type.keyDown:
                    view.keyDown(event);
                    break;
                case UIEvent.Type.keyUp:
                    view.keyUp(event);
                    if (this._toolbar !== null){
                        this._queueKeyEventToolbarUpdate();
                    }
                    break;
            }
        }
    },

    _keyEventToolbarValidationTimer: null,

    _queueKeyEventToolbarUpdate: function(){
        if (this._keyEventToolbarValidationTimer !== null){
            this._keyEventToolbarValidationTimer.invalidate();
        }
        this._keyEventToolbarValidationTimer = JSTimer.scheduledTimerWithInterval(0.5, function(){
            this._keyEventToolbarValidationTimer = null;
            this._validateToolbar();
        }, this);
    },

    // -------------------------------------------------------------------------
    // MARK: - Autosaving

    isUsingAutosavedFrame: false,
    autosaveName: JSDynamicProperty('_autosaveName', null),

    setAutosaveName: function(autosaveName){
        this._autosaveName = autosaveName;
        this._loadAutosavedFromUserDefaults();
    },

    _autosaveToUserDefaults: function(){
        if (this.autosaveName === null){
            return;
        }
        JSUserDefaults.shared.setValueForKey({
            frame: [this.position.x - this.bounds.size.width * this.anchorPoint.x, this.position.y - this.bounds.size.height * this.anchorPoint.y, this.bounds.size.width, this.bounds.size.height]
        }, this._autosaveName);
    },

    _loadAutosavedFromUserDefaults: function(){
        if (this.autosaveName === null){
            return;
        }
        var values = JSUserDefaults.shared.valueForKey(this.autosaveName);
        if (values !== null){
            if ('frame' in values){
                this.frame = JSRect.apply(undefined, values.frame);
                this.isUsingAutosavedFrame = true;
            }
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Accessibility

    isAccessibilityElement: true,
    accessibilityRole: UIAccessibility.Role.window,

    getAccessibilityLabel: function(){
        var label = UIWindow.$super.getAccessibilityLabel.call(this);
        if (label !== null){
            return label;
        }
        return this._title;
    },

    getAccessibilityElements: function(){
        var elements = [];
        if (this._toolbar !== null){
            elements.push(this.toolbar);
        }
        if (this.contentView !== null){
            var stack = [this.contentView];
            var view;
            while (stack.length > 0){
                view = stack.shift();
                if (view.isAccessibilityElement){
                    elements.push(view);
                }else{
                    for (var i = 0, l = view.subviews.length; i < l; ++i){
                        stack.push(view.subviews[i]);
                    }
                }
            }
        }
        return elements;
    },

    getAccessibilityParent: function(){
        return this._application;
    }

});

UIWindow.Level = {
    back: -1,
    normal: 0,
    front: 1
};

UIWindow.Styler = Object.create({}, {

    default: {
        configurable: true,
        get: function UIWindow_getDefaultStyler(){
            var styler = UIWindowDefaultStyler.init();
            Object.defineProperty(this, 'default', {configurable: true, value: styler});
            return styler;
        },
        set: function UIWindow_setDefaultStyler(styler){
            Object.defineProperty(this, 'default', {configurable: true, value: styler});
        }
    },

    custom: {
        configurable: true,
        get: function UIWindow_getDefaultStyler(){
            var styler = UIWindowCustomStyler.init();
            Object.defineProperty(this, 'custom', {configurable: true, value: styler});
            return styler;
        },
    },

    tooltip: {
        configurable: true,
        get: function UIWindow_getTooltipStyler(){
            var styler = UITooltipWindowStyler.init();
            Object.defineProperty(this, 'tooltip', {configurable: true, value: styler});
            return styler;
        },
        set: function UIWindow_setTooltipStyler(styler){
            Object.defineProperty(this, 'tooltip', {configurable: true, value: styler});
        }
    },

});

JSClass("UIRootWindow", UIWindow, {

    level: UIWindow.Level.back,

    _commonWindowInit: function(){
        UIRootWindow.$super._commonWindowInit.call(this);
        this.frame = this.application.windowServer.screen.frame;
        this.title = this.application.bundle.localizedStringForInfoKey("UIApplicationTitle");
    },

    isAccessibilityElement: false,

});

JSClass("UIWindowStyler", JSObject, {

    focusRingColor: null,
    focusRingWidth: 3.5,

    init: function(){
        this.focusRingColor = JSColor.highlight;
    },

    initializeWindow: function(window){
        var focusRingLayer = UIFocusRingLayer.init();
        focusRingLayer._domPointerEventsNone = true;
        focusRingLayer.color = this.focusRingColor;
        focusRingLayer.width = this.focusRingWidth;
        focusRingLayer.hidden = true;
        window.layer.addSublayer(focusRingLayer);
        window.stylerProperties.focusRingLayer = focusRingLayer;
        window.stylerProperties.focusRingAnimator = null;
    },

    updateWindow: function(window){
    },

    layoutWindow: function(window){
        window._contentView.frame = window.bounds.rectWithInsets(window._contentInsets);
        window.layer.addSublayer(window.stylerProperties.focusRingLayer);
    },

    _isUpdatingFocusRing: false,

    updateFocusRingInWindow: function(window, animated){
        if (this._isUpdatingFocusRing){
            return;
        }
        this._isUpdatingFocusRing = true;
        this._updateFocusRingInWindow(window, animated);
        this._isUpdatingFocusRing = false;
    },

    _updateFocusRingInWindow: function(window, animated){
        var responder = window.firstResponder;
        var focusRingLayer = window.stylerProperties.focusRingLayer;
        if (!window.isKeyWindow || responder === null || !responder.isKindOfClass(UIView)){
            focusRingLayer.hidden = true;
            return;
        }
        var view = responder;
        var views = [];
        while (view !== window){
            views.push(view);
            view = view.superview;
        }
        view = responder;
        var i;
        for (i = views.length - 2; i >= 0; --i){
            views[i].layoutIfNeeded();
        }
        var path = view.focusRingPath;
        if (path === null){
            focusRingLayer.hidden = true;
            return;
        }
        var layer = view.layer;
        focusRingLayer.hidden = false;
        focusRingLayer.path = path;
        focusRingLayer.position = JSPoint.Zero;
        var transform = JSAffineTransform.Translated(path.boundingRect.center.x, path.boundingRect.center.y);
        var superlayerTransform;
        while (layer !== window.layer){
            superlayerTransform = layer.transformFromSuperlayer();
            transform = transform.concatenatedWith(superlayerTransform);
            layer = layer.superlayer;
        }
        if (window.stylerProperties.focusRingAnimator !== null){
            window.stylerProperties.focusRingAnimator.stop();
        }
        focusRingLayer.transform = transform;
        if (animated){
            focusRingLayer.alpha = 0.1;
            var animator = UIViewPropertyAnimator.initWithDuration(0.15);
            focusRingLayer.transform = transform.scaledBy((focusRingLayer.bounds.size.width + 3 * focusRingLayer.width) / focusRingLayer.bounds.size.width, (focusRingLayer.bounds.size.height + 3 * focusRingLayer.width) / focusRingLayer.bounds.size.height);
            animator.addAnimations(function(){
                focusRingLayer.transform = transform;
                focusRingLayer.alpha = 1.0;
            });
            animator.addCompletion(function(){
                window.stylerProperties.focusRingAnimator = null;
            });
            animator.start();
            window.stylerProperties.focusRingAnimator = animator;
        }else{
            focusRingLayer.alpha = 1.0;
        }
    }

});

JSClass("UIWindowDefaultStyler", UIWindowStyler, {

    _titlebarSize: 22,
    _controlButtonSize: 12,
    _iconSize: 16,
    _iconTitleSpacing: 5,
    activeTitleColor: null,
    inactiveTitleColor: null,
    shadowRadius: 40,
    inactiveShadowRadius: 25,
    cornerRadius: 6,
    backgroundColor: null,
    shadowColor: null,
    titleBackgroundColor: null,
    titleBackgroundGradient: null,
    contentSeparatorColor: null,
    contentSeparatorSize: 1,
    closeButtonImages: null,

    init: function(){
        UIWindowDefaultStyler.$super.init.call(this);
        this.activeTitleColor = JSColor.text;
        this.inactiveTitleColor = JSColor.text.colorWithAlpha(0.3);
        this.shadowColor = JSColor.windowShadow;
        this.backgroundColor = JSColor.window;
        this.titleBackgroundColor = JSColor.initWithUIStyles(JSColor.window.colorLightenedByPercentage(0.5), JSColor.window.colorLightenedByPercentage(0.05));
        this.contentSeparatorColor = JSColor.initWithUIStyles(JSColor.black.colorWithAlpha(0.1), JSColor.black.colorWithAlpha(0.8));
        this.closeButtonImages = {
            inactive: images.closeInactive,
            normal: images.closeNormal,
            over: images.closeOver,
            active: images.closeActive
        };
        this.toolbarTitleColor = JSColor.toolbarTitle;
    },

    initializeWindow: function(window){
        UIWindowDefaultStyler.$super.initializeWindow.call(this, window);
        var closeButton = UIButton.initWithStyler(UIButton.Styler.custom);
        closeButton.setImageForState(this.closeButtonImages.normal, UIControl.State.normal);
        closeButton.setImageForState(this.closeButtonImages.over, UIControl.State.over);
        closeButton.setImageForState(this.closeButtonImages.active, UIControl.State.active);
        closeButton.addAction("close", window);

        var titleBacking = UIView.init();
        titleBacking.borderWidth = 1;
        titleBacking.maskedBorders = UIView.Sides.minY;
        titleBacking.borderColor = JSColor.initWithWhite(1, 0.05);

        var titleLabel = UILabel.init();
        titleLabel.font = titleLabel.font.fontWithWeight(JSFont.Weight.regular);

        var titleBar = UIView.init();

        titleBar.addSubview(closeButton);
        titleBar.addSubview(titleLabel);
        window.addSubview(titleBacking);
        titleBacking.addSubview(titleBar);

        window.stylerProperties.titleBacking = titleBacking;
        window.stylerProperties.closeButton = closeButton;
        window.stylerProperties.titleBar = titleBar;
        window.stylerProperties.titleLabel = titleLabel;
        window.stylerProperties.iconView = null;
        window.stylerProperties.toolbar = null;
        window.stylerProperties.contentSeparatorView = null;

        window.shadowColor = this.shadowColor;
        window.shadowRadius = this.shadowRadius;
        window.cornerRadius = this.cornerRadius;
        window.backgroundColor = this.backgroundColor;

        this.updateWindow(window);
    },

    layoutWindow: function(window){
        UIWindowDefaultStyler.$super.layoutWindow.call(this, window);
        var controlPadding = (this._titlebarSize - this._controlButtonSize) / 2;
        var iconPadding = (this._titlebarSize - this._iconSize) / 2;
        var titleBacking = window.stylerProperties.titleBacking;
        var titleBar = window.stylerProperties.titleBar;
        var closeButton = window.stylerProperties.closeButton;
        var titleLabel = window.stylerProperties.titleLabel;
        var iconView = window.stylerProperties.iconView;
        var toolbar = window.stylerProperties.toolbar;
        var contentSeparatorView = window.stylerProperties.contentSeparatorView;
        var bounds = window.bounds;

        // Title bar
        var y = 0;
        titleBar.frame = JSRect(0, y, bounds.size.width, this._titlebarSize);
        y += this._titlebarSize;
        closeButton.frame = JSRect(controlPadding, controlPadding, this._controlButtonSize, this._controlButtonSize);
        titleLabel.sizeToFit();
        var minX = closeButton.frame.origin.x + closeButton.frame.size.width + controlPadding;
        var maxX = titleBar.bounds.size.width - controlPadding;
        var available = maxX - minX;
        var titleWidth = titleLabel.frame.size.width;
        var iconWidth = 0;
        if (iconView && !iconView.hidden){
            iconWidth = this._iconSize + this._iconTitleSpacing;
        }
        if (titleWidth + iconWidth > available){
            titleLabel.bounds.size = JSSize(Math.max(0, available - iconWidth), titleLabel.bounds.size.height);
        }
        var centerX = titleBar.bounds.size.width / 2;
        var shiftX = minX - (centerX - (titleWidth + iconWidth) / 2);
        if (shiftX > 0){
            centerX += shiftX;
        }
        if (iconView){
            iconView.frame = JSRect(centerX - (titleWidth + iconWidth) / 2, iconPadding, this._iconSize, this._iconSize);
        }
        titleLabel.position = JSPoint(centerX + iconWidth / 2, titleBar.bounds.size.height / 2);

        // Toolbar
        if (toolbar){
            toolbar.frame = JSRect(0, y, bounds.size.width, toolbar.intrinsicSize.height);
            y += toolbar.frame.size.height;
        }

        if (contentSeparatorView){
            contentSeparatorView.frame = JSRect(0, y - this.contentSeparatorSize, bounds.size.width, this.contentSeparatorSize);
        }

        titleBacking.frame = JSRect(0, 0, bounds.size.width, y);
    },

    updateWindow: function(window){
        var titleBacking = window.stylerProperties.titleBacking;
        var closeButton = window.stylerProperties.closeButton;
        var iconView = window.stylerProperties.iconView;
        var titleLabel = window.stylerProperties.titleLabel;
        var titleBar = window.stylerProperties.titleBar;
        closeButton.hidden = !window.allowsClose;
        
        titleLabel.text = window.title || '';

        if (window.icon){
            if (!iconView){
                iconView = UIImageView.init();
                titleBar.insertSubviewBelowSibling(iconView, titleLabel);
                window.stylerProperties.iconView = iconView;
            }
            iconView.image = window.icon;
            iconView.hidden = false;
        }else if (iconView){
            iconView.icon = null;
            iconView.hidden = true;
        }

        if (window.isMainWindow || window.isKeyWindow){
            if (iconView){
                iconView.templateColor = this.activeTitleColor;
            }
            titleLabel.textColor = this.activeTitleColor;
            window.shadowRadius = this.shadowRadius;
        }else{
            if (iconView){
                iconView.templateColor = this.inactiveTitleColor;
            }
            titleLabel.textColor = this.inactiveTitleColor;
            window.shadowRadius = this.inactiveShadowRadius;
        }
        if (window.isMainWindow){
            closeButton.setImageForState(this.closeButtonImages.normal, UIControl.State.normal);
        }else{
            closeButton.setImageForState(this.closeButtonImages.inactive, UIControl.State.normal);
        }

        if (window.toolbar){
            if (window.stylerProperties.toolbar && window.stylerProperties.toolbar !== window.toolbar){
                window.stylerProperties.toolbar.removeFromSuperview();
                window.stylerProperties.toolbar = null;
            }
            if (window.stylerProperties.toolbar === null){
                window.stylerProperties.toolbar = window.toolbar;
                titleBacking.insertSubviewAboveSibling(window.stylerProperties.toolbar, titleBar);
            }
        }else{
            if (window.stylerProperties.toolbar !== null){
                window.stylerProperties.toolbar.removeFromSuperview();
                window.stylerProperties.toolbar = null;
            }
        }

        if (window.showsContentSeparator){
            if (!window.stylerProperties.contentSeparatorView){
                window.stylerProperties.contentSeparatorView = UIView.init();
                window.stylerProperties.contentSeparatorView.backgroundColor = this.contentSeparatorColor;
                titleBacking.addSubview(window.stylerProperties.contentSeparatorView);
            }
            titleBacking.backgroundColor = this.titleBackgroundColor;
            titleBacking.backgroundGradient = this.titleBackgroundGradient;
        }else{
            if (window.stylerProperties.contentSeparatorView){
                window.stylerProperties.contentSeparatorView.removeFromSuperview();
                window.stylerProperties.contentSeparatorView = null;
            }
            titleBacking.backgroundColor = null;
            titleBacking.backgroundGradient = null;
        }

        var topSize = this._titlebarSize;
        if (window.stylerProperties.toolbar){
            topSize += window.stylerProperties.toolbar.intrinsicSize.height;
        }
        window.contentInsets = JSInsets(topSize, 0, 0, 0);
    },

});

JSClass("UIWindowTitlelessStyler", UIWindowStyler, {

    _titlebarSize: 22,
    _controlButtonSize: 12,
    shadowRadius: 40,
    inactiveShadowRadius: 25,
    cornerRadius: 6,
    backgroundColor: null,
    shadowColor: null,
    closeButtonImages: null,

    init: function(){
        UIWindowTitlelessStyler.$super.init.call(this);
        this.shadowColor = JSColor.windowShadow;
        this.backgroundColor = JSColor.window;
        this.closeButtonImages = {
            inactive: images.closeInactive,
            normal: images.closeNormal,
            over: images.closeOver,
            active: images.closeActive
        };
        this.toolbarTitleColor = JSColor.toolbarTitle;
    },

    initWithSpec: function(spec){
        UIWindowTitlelessStyler.$super.initWithSpec.call(this, spec);
        if (spec.containsKey("backgroundColor")){
            this.backgroundColor = spec.valueForKey("backgroundColor", JSColor);
        }else{
            this.backgroundColor = JSColor.window;
        }
        if (spec.containsKey("shadowColor")){
            this.shadowColor = spec.valueForKey("shadowColor", JSColor);
        }else{
            this.shadowColor = JSColor.windowShadow;
        }
        if (spec.containsKey("shadowRadius")){
            this.shadowRadius = spec.valueForKey("shadowRadius", Number);
        }
        if (spec.containsKey("inactiveShadowRadius")){
            this.inactiveShadowRadius = spec.valueForKey("inactiveShadowRadius", Number);
        }
        if (spec.containsKey("cornerRadius")){
            this.cornerRadius = spec.valueForKey("cornerRadius", Number);
        }
        if (spec.containsKey("toolbarTitleColor")){
            this.toolbarTitleColor = spec.valueForKey("toolbarTitleColor", JSColor);
        }else{
            this.toolbarTitleColor = JSColor.toolbarTitle;
        }
        this.closeButtonImages = {
            inactive: images.closeInactive,
            normal: images.closeNormal,
            over: images.closeOver,
            active: images.closeActive
        };
    },

    initializeWindow: function(window){
        UIWindowTitlelessStyler.$super.initializeWindow.call(this, window);
        var closeButton = UIButton.initWithStyler(UIButton.Styler.custom);
        closeButton.setImageForState(this.closeButtonImages.normal, UIControl.State.normal);
        closeButton.setImageForState(this.closeButtonImages.over, UIControl.State.over);
        closeButton.setImageForState(this.closeButtonImages.active, UIControl.State.active);
        closeButton.addAction("close", window);

        var controlsView = UIView.init();
        controlsView.addSubview(closeButton);
        window.addSubview(controlsView);

        window.stylerProperties.controlsView = controlsView;
        window.stylerProperties.closeButton = closeButton;
        window.stylerProperties.toolbar = null;

        window.shadowColor = this.shadowColor;
        window.shadowRadius = this.shadowRadius;
        window.cornerRadius = this.cornerRadius;
        window.backgroundColor = this.backgroundColor;

        this.updateWindow(window);
    },

    layoutWindow: function(window){
        UIWindowTitlelessStyler.$super.layoutWindow.call(this, window);
        var controlsView = window.stylerProperties.controlsView;
        var closeButton = window.stylerProperties.closeButton;
        var toolbar = window.stylerProperties.toolbar;
        var bounds = window.bounds;
        var controlsHeight = this._controlButtonSize * 2;
        if (toolbar){
            controlsHeight = toolbar.frame.size.height;
        }
        var controlPadding = (controlsHeight - this._controlButtonSize) / 2;
        closeButton.frame = JSRect(controlPadding, controlPadding, this._controlButtonSize, this._controlButtonSize);
        controlsView.frame = JSRect(0, 0, controlsHeight, controlsHeight);
        var x = controlsView.bounds.size.width;
        if (window.contentView.isKindOfClass(UISplitView)){
            var splitView = window.contentView;
            x = splitView.leadingView.convertPointToView(JSPoint(splitView.leadingView.bounds.size.width, 0), window).x;
        }
        window.addSubview(controlsView);
        if (toolbar){
            toolbar.frame = JSRect(x, 0, bounds.size.width - x, toolbar.intrinsicSize.height);
            window.insertSubviewBelowSibling(toolbar, controlsView);
        }
    },

    updateWindow: function(window){
        var closeButton = window.stylerProperties.closeButton;
        var controlsView = window.stylerProperties.controlsView;
        closeButton.hidden = !window.allowsClose;

        if (window.isMainWindow || window.isKeyWindow){
            window.shadowRadius = this.shadowRadius;
        }else{
            window.shadowRadius = this.inactiveShadowRadius;
        }
        if (window.isMainWindow){
            closeButton.setImageForState(this.closeButtonImages.normal, UIControl.State.normal);
        }else{
            closeButton.setImageForState(this.closeButtonImages.inactive, UIControl.State.normal);
        }

        if (window.toolbar){
            if (window.stylerProperties.toolbar && window.stylerProperties.toolbar !== window.toolbar){
                window.stylerProperties.toolbar.removeFromSuperview();
                window.stylerProperties.toolbar = null;
            }
            if (window.stylerProperties.toolbar === null){
                window.stylerProperties.toolbar = window.toolbar;
                window.insertSubviewBelowSibling(window.stylerProperties.toolbar, controlsView);
            }
        }else{
            if (window.stylerProperties.toolbar !== null){
                window.stylerProperties.toolbar.removeFromSuperview();
                window.stylerProperties.toolbar = null;
            }
        }

        window.contentInsets = JSInsets.Zero;
    },

});

JSClass("UIWindowCustomStyler", UIWindowStyler, {

});

var images = Object.create({}, {

    bundle: {
        configurable: true,
        get: function(){
            Object.defineProperty(this, 'bundle', {value: JSBundle.initWithIdentifier("io.breakside.JSKit.UIKit") });
            return this.bundle;
        }
    },

    closeInactive: {
        configurable: true,
        get: function(){
            Object.defineProperty(this, 'closeInactive', {value: JSImage.initWithResourceName("UIWindowButtonCloseInactive", this.bundle) });
            return this.closeInactive;
        }
    },

    closeNormal: {
        configurable: true,
        get: function(){
            Object.defineProperty(this, 'closeNormal', {value: JSImage.initWithResourceName("UIWindowButtonCloseNormal", this.bundle) });
            return this.closeNormal;
        }
    },

    closeOver: {
        configurable: true,
        get: function(){
            Object.defineProperty(this, 'closeOver', {value: JSImage.initWithResourceName("UIWindowButtonCloseOver", this.bundle) });
            return this.closeOver;
        }
    },

    closeActive: {
        configurable: true,
        get: function(){
            Object.defineProperty(this, 'closeActive', {value: JSImage.initWithResourceName("UIWindowButtonCloseActive", this.bundle) });
            return this.closeActive;
        }
    }

});

})();