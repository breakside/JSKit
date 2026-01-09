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

// #import Foundation
// #import "UIEvent.js"
// #import "UICursor.js"
// #import "UILayer.js"
// #import "UIView.js"
// #import "UITooltipWindow.js"
// #import "UIDraggingSession.js"
// #import "UIUserInterface.js"
// #import "UIColorSpace.js"
// #import "UIScreen.js"
'use strict';

(function(){

var logger = JSLog("uikit", "windowServer");

JSClass("UIWindowServer", JSObject, {

    windowStack: null,
    displayServer: null,
    textInputManager: null,
    keyWindow: null,
    mainWindow: null,
    screen: null,
    mouseLocation: null,
    fullKeyboardAccessEnabled: false,
    darkModeEnabled: true,
    lightModeEnabled: true,
    _windowsById: null,
    _mouseIdleTimer: null,
    _tooltipWindow: null,
    _tooltipSourceView: null,
    _draggingSession: null,
    activeEvent: JSReadOnlyProperty('_activeEvent', null),
    _normalLevelRange: null,

    // -----------------------------------------------------------------------
    // MARK: - Creating a Window Server

    init: function(){
        this._traitCollection = UITraitCollection.init();
        this._traitCollection.accessibilityContrast = UIUserInterface.Contrast.normal;
        this._traitCollection.userInterfaceStyle = UIUserInterface.Style.light;
        this.windowStack = [];
        this._windowsById = {};
        this._normalLevelRange = JSRange.Zero;
        this._mouseIdleTimer = JSTimer.initWithInterval(1.25, false, this._mouseDidIdle, this);
        this.mouseLocation = JSPoint.Zero;
        this.device = UIDevice.shared;
        this.accessibilityNotificationCenter = JSNotificationCenter.init();
    },

    stopped: false,

    stop: function(graceful){
        if (this.stopped){
            return;
        }
        try{
            this.displayServer.stop();
            if (graceful){
                var window;
                for (var i = this.windowStack.length - 1; i >= 0; --i){
                    window = this.windowStack[i];
                    if (window.viewController){
                        window.viewController.viewWillDisappear(false);
                        window.viewController.viewDidDisappear(false);
                    }else if (window._contentViewController !== null){
                        window._contentViewController.viewWillDisappear(false);
                        window._contentViewController.viewDidDisappear(false);
                    }
                }
            }
        }finally{
            this.stopped = true;
        }
    },

    // -----------------------------------------------------------------------
    // MARK: - Inserting and Removing Windows

    orderWindowFront: function(window){
        this._insertWindowIfNeeded(window);
        var toLevel;
        switch (window.level){
            case UIWindow.Level.back:
                toLevel = this._normalLevelRange.location - 1;
                break;
            case UIWindow.Level.normal:
                toLevel = this._normalLevelRange.end - 1;
                break;
            case UIWindow.Level.front:
                toLevel = this.windowStack.length - 1;
                break;
        }
        if (toLevel === window.subviewIndex){
            return;
        }
        if (toLevel < window.subviewIndex){
            throw new Error("orderFront will result in backwards movement of window");
        }
        this._beginWindowOrderChange();
        for (var i = toLevel; i >= 0; --i){
            if (this.windowStack[i] === window){
                this.windowStack.splice(i, 1);
                window.subviewIndex = window.layer.sublayerIndex = toLevel;
                this.windowStack.splice(toLevel, 0, window);
                this.displayServer.windowInserted(window);
                break;
            }
            this.windowStack[i].subviewIndex = this.windowStack[i].layer.sublayerIndex = i - 1;
        }
        this._endWindowOrderChange();
    },

    makeWindowMain: function(window){
        if (this.mainWindow === window){
            return;
        }
        if (window === null ||window.canBecomeMainWindow()){
            var original = this.mainWindow;
            this.mainWindow = window;
            if (original !== null){
                original.resignMain();
            }
            if (this.mainWindow !== null){
                this.mainWindow.becomeMain();
                this.postNotificationForAccessibilityElement(UIAccessibility.Notification.mainWindowChanged, this.mainWindow);
            }
        }
    },

    makeWindowKey: function(window){
        if (window !== null){
            this.makeWindowMain(window);
        }
        if (this.keyWindow === window){
            return;
        }
        if (window === null || window.canBecomeKeyWindow()){
            var original = this.keyWindow;
            this.keyWindow = window;
            if (original !== null){
                original.resignKey();
            }
            if (this.keyWindow !== null){
                this.keyWindow.becomeKey();
                this.postNotificationForAccessibilityElement(UIAccessibility.Notification.keyWindowChanged, this.keyWindow);
            }
            this.windowDidChangeResponder(this.keyWindow);
        }
    },

    _insertWindowIfNeeded: function(window){
        if (window.objectID in this._windowsById){
            return;
        }
        // Special case for the first normal window inserted when there isn't a back window yet.
        // We assume it's the main back window, saving the developer from having to specify
        if (this._normalLevelRange.location === 0 && window.level === UIWindow.Level.normal){
            window.level = UIWindow.Level.back;
        }
        this._beginWindowOrderChange();
        this._windowsById[window.objectID] = window;
        switch (window.level){
            case UIWindow.Level.back:
                window.subviewIndex = window.layer.sublayerIndex = this._normalLevelRange.location;
                this._normalLevelRange.location += 1;
                break;
            case UIWindow.Level.normal:
                window.subviewIndex = window.layer.sublayerIndex = this._normalLevelRange.end;
                this._normalLevelRange.length += 1;
                break;
            case UIWindow.Level.front:
                window.subviewIndex = window.layer.sublayerIndex = this.windowStack.length;
                break;
        }
        window._screen = this.screen;
        this.layoutWindow(window);
        this.windowStack.splice(window.subviewIndex, 0, window);
        for (var i = window.subviewIndex + 1; i < this.windowStack.length; ++i){
            this.windowStack[i].subviewIndex = this.windowStack[i].layer.sublayerIndex = i;
        }
        this.displayServer.windowInserted(window);
        this._endWindowOrderChange();
        if (window.receivesAllEvents && this.mouseEventWindow !== null && window.layer.sublayerIndex > this.mouseEventWindow.layer.sublayerIndex){
            window.adoptMouseEvents(this.mouseEventWindow);
            this.mouseEventWindow.cancelMouseEvents();
            this.mouseEventWindow = window;
        }
    },

    windowRemoved: function(window){
        if (!(window.objectID in this._windowsById)){
            return;
        }
        this._beginWindowOrderChange();
        delete this._windowsById[window.objectID];
        var i;
        for (i = this.windowStack.length - 1; i >= 0; --i){
            if (this.windowStack[i] === window){
                this.windowStack.splice(i, 1);
                this.displayServer.windowRemoved(window);
                window._screen = null;
                if (window === this._mouseTrackingWindow){
                    this._mouseTrackingWindow = null;
                }
                break;
            }
            this.windowStack[i].subviewIndex = this.windowStack[i].layer.sublayerIndex = i - 1;
        }
        switch (window.level){
            case UIWindow.Level.back:
                this._normalLevelRange.location -= 1;
                break;
            case UIWindow.Level.normal:
                this._normalLevelRange.length -= 1;
                break;
        }
        if (window === this.keyWindow){
            var newKeyWindow = null;
            for (i = window.subviewIndex - 1; i >= 0; --i){
                if (this.windowStack[i].canBecomeKeyWindow()){
                    newKeyWindow = this.windowStack[i];
                    this.windowDidChangeResponder(this.keyWindow);
                    break;
                }
            }
            this.makeWindowKey(newKeyWindow);
        }
        if (window === this.mainWindow){
            var newMainWindow = null;
            for (i = window.subviewIndex - 1; i >= 0; --i){
                if (this.windowStack[i].canBecomeMainWindow()){
                    newMainWindow = this.windowStack[i];
                    break;
                }
            }
            this.makeWindowMain(newMainWindow);
        }
        if (window === this.mouseEventWindow){
            this.mouseEventWindow = this.windowForEventAtLocation(this.mouseLocation);
            if (this.mouseEventWindow !== null){
                this.mouseEventWindow.adoptMouseEvents(window);
                window.cancelMouseEvents();
            }
        }
        this._endWindowOrderChange();
    },

    _beginWindowOrderChange: function(){
    },

    _endWindowOrderChange: function(){
    },

    // -----------------------------------------------------------------------
    // MARK: - Screen Coordination

    screenDidChangeFrame: function(oldFrame){
        if (this._menuBar){
            this._menuBar.frame = JSRect(0, 0, this.screen.frame.size.width, this._menuBar.frame.size.height);
        }
        var window;
        for (var i = 0, l = this.windowStack.length; i < l; ++i){
            window = this.windowStack[i];
            this.layoutWindow(window);
        }
        JSNotificationCenter.shared.post(UIScreen.Notification.frameChanged, this, {screen: this.screen});
    },

    layoutWindow: function(window){
        if (window === this._accessibilityHighlightWindow){
            window.frame = window._screen.frame;
        }else if (window instanceof UIRootWindow){
            window.frame = window._screen.frame;
            var insets = JSInsets.Zero;
            if (this._menuBar !== null && this._menuBar.isOpaque){
                insets.top = this._menuBar.frame.size.height;
            }
            window.contentInsets = insets;
        }else{
            // TODO: make sure nothing has moved off screen
        }
    },

    updateScreenAvailableInsets: function(){
        var insets = JSInsets.Zero;
        if (this._menuBar !== null){
            insets.top = this._menuBar.frame.size.height + 1;
        }
        this.screen.availableInsets = insets;
    },

    // -----------------------------------------------------------------------
    // MARK: - Text Input Coordination

    windowDidChangeResponder: function(window){
        this.textInputManager.windowDidChangeResponder(window);
        if (window !== null){
            this.postNotificationForAccessibilityElement(UIAccessibility.Notification.firstResponderChanged, window);
        }
    },

    windowDidReaffirmFirstResponder: function(window){
    },

    // -----------------------------------------------------------------------
    // MARK: - Cursor Managment

    hideCursor: function(){
        // subclasses should override
    },

    unhideCursor: function(){
        // subclasses should override
    },

    setCursor: function(cursor){
        // subclasses should override
    },

    // -----------------------------------------------------------------------
    // MARK: - Menu Bar
    
    menuBar: JSDynamicProperty('_menuBar', null),

    setMenuBar: function(menuBar){
        if (this._menuBar){
            this._menuBar.close();
        }
        this._menuBar = menuBar;
        if (this._menuBar){
            this._menuBar.frame = JSRect(0, 0, this.screen.frame.size.width, this._menuBar.frame.size.height);
            this._menuBar.layoutIfNeeded();
            this._menuBar.open();
        }
        this.updateScreenAvailableInsets();
        if (this.windowStack.length > 0 && this._normalLevelRange.location > 0){
            this.layoutWindow(this.windowStack[0]);
        }
    },

    // -----------------------------------------------------------------------
    // MARK: - Tooltips

    _hideTooltipInterval: 0.15,

    showTooltipForView: function(view, screenLocation){
        if (this._tooltipWindow !== null){
            this.hideTooltip();
        }
        var safeArea = view.window.screen.frame.rectWithInsets(3);

        this._tooltipSourceView = view;
        this._tooltipWindow = UITooltipWindow.initWithString(view.tooltip, JSSize(safeArea.size.width * 0.3, safeArea.size.height));

        var origin = JSPoint(screenLocation);
        origin.y += 20; // Accounting for cursor

        if (origin.y + this._tooltipWindow.frame.size.height >= safeArea.origin.y + safeArea.size.height){
            origin.y = screenLocation.y - this._tooltipWindow.frame.size.height;
        }

        if (origin.y < safeArea.origin.y){
            origin.y = safeArea.origin.y;
            origin.x += 20; // Accounting for cursor, since we're probably overlapping after this y-origin adjustment
        }

        if (origin.x + this._tooltipWindow.frame.size.width >= safeArea.origin.x + safeArea.size.width){
            origin.x = safeArea.origin.x + safeArea.size.width - this._tooltipWindow.frame.size.width;
        }
        if (origin.x < safeArea.origin.x){
            origin.x = safeArea.origin.x;
        }

        this._tooltipWindow.frame = JSRect(origin, this._tooltipWindow.frame.size);
        this._tooltipWindow.orderFront();
    },

    _hideTooltipTimer: null,

    _scheduleHideTooltip: function(){
        if (this._hideTooltipTimer === null){
            this._hideTooltipTimer = JSTimer.scheduledTimerWithInterval(this._hideTooltipInterval, this.hideTooltip, this);
        }
    },

    hideTooltip: function(){
        if (this._hideTooltipTimer !== null){
            this._hideTooltipTimer.invalidate();
            this._hideTooltipTimer = null;
        }
        this._tooltipWindow.close();
        this._tooltipWindow = null;
        this._tooltipSourceView = null;
    },

    updateTooltip: function(){
        if (this._tooltipWindow === null){
            return;
        }
        var window = this.windowForEventAtLocation(this.mouseLocation);
        var shouldHideTooltip = true;
        var view = null;
        if (window !== null){
            view = window.hitTest(window.convertPointFromScreen(this.mouseLocation));
            while (view !== null && (view.tooltip === null || view.tooltip === "")){
                view = view.superview;
            }
            if (view === this._tooltipSourceView){
                shouldHideTooltip = false;
            }
        }
        if (shouldHideTooltip){
            if (view !== null && view.tooltip !== null && view.tooltip !== ""){
                this.showTooltipForView(view, this.mouseLocation);
            }else{
                this._scheduleHideTooltip();
            }
        }
    },

    // -----------------------------------------------------------------------
    // MARK: - Sending Events

    _eventQueue: null,

    _sendEventToApplication: function(event, application){
        if (this._activeEvent === null){
            this._eventQueue = [event];
            while (this._eventQueue.length > 0){
                this._activeEvent = this._eventQueue.pop();
                application.sendEvent(this._activeEvent);
            }
            this._activeEvent = null;
        }else{
            this._eventQueue.push(event);
        }
    },

    // -----------------------------------------------------------------------
    // MARK: - Keyboard Events

    createKeyEvent: function(type, timestamp, key, keyCode, modifiers){
        if (this._accessibilityHighlightWindow !== null){
            if (type === UIEvent.Type.keyDown){
                if (key === UIEvent.Key.up){
                    this._accessibilityHighlightWindow.contentView.level += 1;
                    return;
                }
                if (key === UIEvent.Key.down){
                    if (this._accessibilityHighlightWindow.contentView.level > 0){
                        this._accessibilityHighlightWindow.contentView.level -= 1;
                    }
                    return;
                }
            }
        }
        var keyWindow = this.windowForKeyEvent();
        if (keyWindow !== null){
            var event = UIEvent.initKeyEventWithType(type, timestamp, keyWindow, key, keyCode, modifiers);
            if (this.shouldDraggingSessionHandleKey(event)){
                this.handleDraggingKeyEvent(event);
            }else{
                this._sendEventToApplication(event, keyWindow.application);
            }
        }
    },

    // -----------------------------------------------------------------------
    // MARK: - Finding Windows by Location

    windowAtScreenLocation: function(location){
        var _window;
        var locationInWindow;
        for (var i = this.windowStack.length - 1; i >= 0; --i){
            _window = this.windowStack[i];
            if (!_window.hidden){
                locationInWindow = _window.convertPointFromScreen(location);
                if (_window.containsPoint(locationInWindow)){
                    return _window;
                }
            }
        }
        return null;
    },

    windowForEventAtLocation: function(location){
        var locationInWindow;
        var window;
        for (var i = this.windowStack.length - 1; i >= 0; --i){
            window = this.windowStack[i];
            if (!window.hidden){
                if (window.receivesAllEvents){
                    return window;
                }
                locationInWindow = window.convertPointFromScreen(location);
                if (window.userInteractionEnabled && window.containsPoint(locationInWindow)){
                    return window;
                }
            }
        }
        return null;
    },

    windowForKeyEvent: function(){
        var stopIndex = 0;
        if (this.keyWindow !== null){
            stopIndex = this.keyWindow.subviewIndex;
        }
        var window;
        for (var i = this.windowStack.length - 1; i >= stopIndex; --i){
            window = this.windowStack[i];
            if (window.receivesAllEvents){
                return window;
            }
            if (window === this.keyWindow){
                return window;
            }
        }
        return null;
    },

    windowsForApplication: function(application){
        var windows = [];
        var window;
        for (var i = 0, l = this.windowStack.length; i < l; ++i){
            window = this.windowStack[i];
            if (window.application === application){
                windows.push(window);
            }
        }
        return windows;
    },

    // -----------------------------------------------------------------------
    // MARK: - Mouse Events

    isLeftMouseDown: false,
    isRightMouseDown: false,
    mouseDownCount: 0,
    mouseEventWindow: null,
    _leftClickCount: 0,
    _rightClickCount: 0,
    _previousLeftClickTimestamp: 0,
    _previousRightClickTimestamp: 1,
    _previousMouseEventWindow: null,

    createMouseEvent: function(type, timestamp, location, modifiers){
        var isADown = false;
        var isAnUp = false;
        var ignore = false;
        var clickCount = 0;
        switch (type){
            case UIEvent.Type.leftMouseDown:
                isADown = true;
                ignore = this.isLeftMouseDown;
                this.isLeftMouseDown = true;
                break;
            case UIEvent.Type.rightMouseDown:
                isADown = true;
                ignore = this.isLeftMouseDown;
                this.isRightMouseDown = true;
                break;
            case UIEvent.Type.leftMouseUp:
                isAnUp = true;
                ignore = !this.isLeftMouseDown;
                this.isLeftMouseDown = false;
                break;
            case UIEvent.Type.rightMouseUp:
                isAnUp = true;
                ignore = !this.isRightMouseDown;
                this.isRightMouseDown = false;
                break;
        }

        if (ignore){
            logger.info("Ignoring mouse event: %d".sprintf(type));
            return;
        }

        var event;
        var targetWindow;
        var locationInWindow;

        // window resizing is handled by the window server itself, rather than
        // passing events to windows
        if (this._windowResizeWindow !== null && this._windowResizeMouseEventData === null && type === UIEvent.Type.leftMouseDown && this.mouseDownCount === 0){
            locationInWindow = this._windowResizeWindow.convertPointFromScreen(location);
            var resizeOperation = this.windowResizeHitTest(this._windowResizeWindow, locationInWindow);
            if (resizeOperation !== UIWindowServer.ResizeOperation.none){
                this._mouseIdleTimer.invalidate();
                if (this._tooltipWindow !== null){
                    this.hideTooltip();
                }
                this._leftClickCount = 1;
                this._rightClickCount = 0;
                this.mouseDownCount = 1;
                this.mouseEventWindow = null;
                this._previousMouseEventWindow = null;
                this._windowResizeMouseEventData = {
                    operation: resizeOperation,
                    location0: JSPoint(location)
                };
            }else{
                if (this._windowResizeCursor !== null){
                    this._windowResizeCursor.pop();
                    this._windowResizeCursor = null;
                }
                this._windowResizeWindow = null;
            }
        }
        if (this._windowResizeMouseEventData !== null){
            if (locationInWindow === undefined || locationInWindow === null){
                locationInWindow = this._windowResizeWindow.convertPointFromScreen(location);
            }
            event = UIEvent.initMouseEventWithType(type, timestamp, this._windowResizeWindow, locationInWindow, modifiers, this._leftClickCount);
            this.handleWindowResizeMouseEvent(event, location);
            if (type === UIEvent.Type.leftMouseUp){
                this._leftClickCount = 0;
                this.mouseDownCount = 0;
                this._windowResizeMouseEventData = null;
                this.sendMouseTrackingEvents(timestamp, modifiers);
            }
            return;
        }

        if (isADown){
            this._mouseIdleTimer.invalidate();
            if (this._tooltipWindow !== null){
                this.hideTooltip();
            }
            if (this.mouseDownCount === 0 && this._draggingSession === null){
                this.mouseEventWindow = this.windowForEventAtLocation(location);
                if (this.mouseEventWindow !== this._previousMouseEventWindow){
                    this._leftClickCount = 0;
                    this._rightClickCount = 0;
                }
                this._previousMouseEventWindow = null;
            }
            ++this.mouseDownCount;
        }

        switch (type){
            case UIEvent.Type.leftMouseDown:
                if (timestamp - this._previousLeftClickTimestamp > UIEvent.doubleClickInterval){
                    this._leftClickCount = 0;
                }
                ++this._leftClickCount;
                clickCount = this._leftClickCount;
                this._previousLeftClickTimestamp = timestamp;
                break;
            case UIEvent.Type.leftMouseUp:
                clickCount = this._leftClickCount;
                if (timestamp - this._previousLeftClickTimestamp > UIEvent.doubleClickInterval){
                    this._leftClickCount = 0;
                }
                this._previousLeftClickTimestamp = timestamp;
                break;
            case UIEvent.Type.rightMouseDown:
                if (timestamp - this._previousRightClickTimestamp > UIEvent.doubleClickInterval){
                    this._rightClickCount = 0;
                }
                clickCount = this._rightClickCount;
                this._previousRightClickTimestamp = timestamp;
                break;
            case UIEvent.Type.rightMouseUp:
                clickCount = this._rightClickCount;
                if (timestamp - this._previousRightClickTimestamp > UIEvent.doubleClickInterval){
                    this._rightClickCount = 0;
                }
                this._previousRightClickTimestamp = timestamp;
                break;
        }

        targetWindow = this.mouseEventWindow;

        if (isAnUp){
            --this.mouseDownCount;
            if (this.mouseDownCount === 0){
                this._previousMouseEventWindow = this.mouseEventWindow;
                this.mouseEventWindow = null;
            }
        }

        if (this._draggingSession !== null){
            if (type == UIEvent.Type.leftMouseUp && this.mouseDownCount === 0){
                if (this._draggingSession.isActive){
                    this.draggingSessionDidPerformOperation();
                    return;
                }
                this.cancelDraggingSession();
            }
        }
        if (targetWindow !== null){
            locationInWindow = targetWindow.convertPointFromScreen(location);
            event = UIEvent.initMouseEventWithType(type, timestamp, targetWindow, locationInWindow, modifiers, clickCount);
            this._sendEventToApplication(event, targetWindow.application);
        }
    },

    createScrollEvent: function(type, timestamp, location, dx, dy, modifiers){
        var targetWindow = this.windowForEventAtLocation(location);
        if (targetWindow !== null){
            var event = UIEvent.initScrollEventWithType(type, timestamp, targetWindow, targetWindow.convertPointFromScreen(location), dx, dy, modifiers);
            this._sendEventToApplication(event, targetWindow.application);
        }
    },

    createGestureEvent: function(type, timestamp, location, phase, value, modifiers){
        var targetWindow = this.windowForEventAtLocation(location);
        if (targetWindow !== null){
            var event = UIEvent.initGestureEventWithType(type, timestamp, targetWindow, targetWindow.convertPointFromScreen(location), phase, value, modifiers);
            this._sendEventToApplication(event, targetWindow.application);
        }
    },

    resetMouseState: function(timestamp){
        if (this._draggingSession !== null){
            // stop the dragging session immediately because we don't want the
            // mouse up to be interpreted as a drop
            this.cancelDraggingSession();
        }
        if (this.isRightMouseDown){
            this.createMouseEvent(UIEvent.Type.rightMouseUp, timestamp, this.mouseLocation);
        }
        if (this.isLeftMouseDown){
            this.createMouseEvent(UIEvent.Type.leftMouseUp, timestamp, this.mouseLocation);
        }
    },

    mouseDidMove: function(timestamp, modifiers){
        this._mouseIdleTimer.invalidate();
        this._leftClickCount = 0;
        this._rightClickCount = 0;
        if (this._draggingSession !== null){
            this.draggingSessionDidChangeLocation();
        }else{
            if (this.mouseDownCount === 0){
                this.sendMouseTrackingEvents(timestamp, modifiers);
                if (this._tooltipWindow === null){
                    this._mouseIdleTimer.schedule();
                }else{
                    this.updateTooltip();
                }
            }else{
                if (this.isLeftMouseDown){
                    this.createMouseEvent(UIEvent.Type.leftMouseDragged, timestamp, this.mouseLocation, modifiers);
                }
                if (this.isRightMouseDown){
                    this.createMouseEvent(UIEvent.Type.rightMouseDragged, timestamp, this.mouseLocation, modifiers);
                }
            }
        }
        if (this._accessibilityHighlightWindow !== null){
            this._accessibilityHighlightWindow.contentView.level = 0;
            this._accessibilityHighlightWindow.contentView.setNeedsDisplay();
        }
    },

    _mouseDidIdle: function(){
        var window = this.windowForEventAtLocation(this.mouseLocation);
        if (window !== null){
            var view = window.hitTest(window.convertPointFromScreen(this.mouseLocation));
            while (view !== null && (view.tooltip === null || view.tooltip === "")){
                view = view.superview;
            }
            if (view !== null && view.tooltip !== null && view.tooltip !== ""){
                this.showTooltipForView(view, this.mouseLocation);
            }
        }
    },

    // -----------------------------------------------------------------------
    // MARK: - Mouse Tracking

    _mouseTrackingWindow: null,

    sendMouseTrackingEvents: function(timestamp, modifiers){
        var mouseTrackingWindow = null;
        var resizeWindow = null;
        var windowIndex;
        var window;
        var location;
        var event;
        var hasWindowReceivingAllEvents = false;
        var hasSeenMainWindow = false;
        var resizeOperation = UIWindowServer.ResizeOperation.none;
        for (windowIndex = this.windowStack.length - 1; windowIndex >= 0 && mouseTrackingWindow === null; --windowIndex){
            window = this.windowStack[windowIndex];
            if (!window.hidden){
                location = window.convertPointFromScreen(this.mouseLocation);
                hasWindowReceivingAllEvents = hasWindowReceivingAllEvents || window.receivesAllEvents;
                if (window.userInteractionEnabled){
                    if (!hasSeenMainWindow){
                        resizeOperation = this.windowResizeHitTest(window, location);
                    }
                    if (resizeOperation !== UIWindowServer.ResizeOperation.none){
                        mouseTrackingWindow = window;
                    }else if (window.containsPoint(location)){
                        mouseTrackingWindow = window;
                    }
                }
                hasSeenMainWindow = hasSeenMainWindow || window === this.mainWindow;
            }
        }
        if (hasWindowReceivingAllEvents && mouseTrackingWindow !== null && !mouseTrackingWindow.receivesAllEvents){
            mouseTrackingWindow = null;
            resizeOperation = UIWindowServer.ResizeOperation.none;
        }
        if (resizeOperation !== UIWindowServer.ResizeOperation.none){
            resizeWindow = mouseTrackingWindow;
            mouseTrackingWindow = null;
        }
        if (this._mouseTrackingWindow !== null){
            if (mouseTrackingWindow !== this._mouseTrackingWindow){
                this._mouseTrackingWindow.sendMouseTrackingEvents(this._mouseTrackingWindow.convertPointFromScreen(this.mouseLocation), timestamp, modifiers, true);
            }
        }
        this._mouseTrackingWindow = mouseTrackingWindow;
        if (this._mouseTrackingWindow !== null){
            this._mouseTrackingWindow.sendMouseTrackingEvents(this._mouseTrackingWindow.convertPointFromScreen(this.mouseLocation), timestamp, modifiers, false);
        }
        var resizeCursor = null;
        if (resizeOperation !== UIWindowServer.ResizeOperation.none){
            resizeCursor = this.cursorForWindowResizeOperation(resizeWindow, resizeOperation);
        }
        if (resizeCursor !== this._windowResizeCursor){
            if (this._windowResizeCursor !== null){
                this._windowResizeCursor.pop();
            }
            this._windowResizeCursor = resizeCursor;
            if (this._windowResizeCursor !== null){
                this._windowResizeCursor.push();
            }
        }
        this._windowResizeWindow = resizeWindow;
    },

    _windowResizeCursor: null,
    _windowResizeWindow: null,
    _windowResizeMouseEventData: null,
    _windowResizeWidthInside: 4,
    _windowResizeWidthOutside: 4,

    windowResizeHitTest: function(window, location){
        if (location === null){
            return UIWindowServer.ResizeOperation.none;
        }
        if (!window._canResizeWidth && !window._canResizeHeight){
            return UIWindowServer.ResizeOperation.none;
        }
        var resizeView = window;
        if (window._resizeView !== null){
            resizeView = window._resizeView;
            location = window.convertPointToView(location, resizeView);
        }
        var resizeFrame = resizeView.bounds;
        var cornerSize = Math.max(resizeView.cornerRadius, this._windowResizeWidthInside);
        if (location.y < resizeFrame.origin.y - this._windowResizeWidthOutside){
            return UIWindowServer.ResizeOperation.none;
        }
        if (location.x < resizeFrame.origin.x - this._windowResizeWidthOutside){
            return UIWindowServer.ResizeOperation.none;
        }
        if (location.y > resizeFrame.origin.y + resizeFrame.size.height + this._windowResizeWidthOutside){
            return UIWindowServer.ResizeOperation.none;
        }
        if (location.x > resizeFrame.origin.x + resizeFrame.size.width + this._windowResizeWidthOutside){
            return UIWindowServer.ResizeOperation.none;
        }
        if (window._canResizeWidth && window._canResizeHeight){
            if ((location.y <= resizeFrame.origin.y + cornerSize) && (location.x <= resizeFrame.origin.x + cornerSize)){
                return UIWindowServer.ResizeOperation.topLeft;
            }
            if ((location.y <= resizeFrame.origin.y + cornerSize) && (location.x >= resizeFrame.origin.x + resizeFrame.size.width - cornerSize)){
                return UIWindowServer.ResizeOperation.topRight;
            }
            if ((location.y >= resizeFrame.origin.y + resizeFrame.size.height - cornerSize) && (location.x >= resizeFrame.origin.x + resizeFrame.size.width - cornerSize)){
                return UIWindowServer.ResizeOperation.bottomRight;
            }
            if ((location.y >= resizeFrame.origin.y + resizeFrame.size.height - cornerSize) && (location.x <= resizeFrame.origin.x + cornerSize)){
                return UIWindowServer.ResizeOperation.bottomLeft;
            }
        }
        if (window._canResizeWidth){
            if (location.x <= resizeFrame.origin.x + this._windowResizeWidthInside){
                return UIWindowServer.ResizeOperation.left;
            }
            if (location.x >= resizeFrame.origin.x + resizeFrame.size.width - this._windowResizeWidthInside){
                return UIWindowServer.ResizeOperation.right;
            }
        }
        if (window._canResizeHeight){
            if (location.y <= resizeFrame.origin.y + this._windowResizeWidthInside){
                return UIWindowServer.ResizeOperation.top;
            }
            if (location.y >= resizeFrame.origin.y + resizeFrame.size.height - this._windowResizeWidthInside){
                return UIWindowServer.ResizeOperation.bottom;
            }
        }
        return UIWindowServer.ResizeOperation.none;
    },

    handleWindowResizeMouseEvent: function(event, location){
        var frame;
        // FIXME: assuming no scale or rotation in window.transform
        if (event.type === UIEvent.Type.leftMouseDown){
            frame = event.window._resizeView !== null ? event.window._resizeView.bounds : event.window.bounds;
            this._windowResizeMouseEventData.frame0 = event.window.untransformedFrame;
            this._windowResizeMouseEventData.maximumResize = JSSize(
                event.window.maximumSize.width - frame.size.width,
                event.window.maximumSize.height - frame.size.height
            );
            this._windowResizeMouseEventData.minimumResize = JSSize(
                event.window.minimumSize.width - frame.size.width,
                event.window.minimumSize.height - frame.size.height
            );
        }else if (event.type === UIEvent.Type.leftMouseDragged){
            var diff = location.subtracting(this._windowResizeMouseEventData.location0);
            var over;
            var resizeOperation = this._windowResizeMouseEventData.operation;
            frame = JSRect(this._windowResizeMouseEventData.frame0);
            if (resizeOperation === UIWindowServer.ResizeOperation.top || resizeOperation === UIWindowServer.ResizeOperation.topLeft  || resizeOperation === UIWindowServer.ResizeOperation.topRight){
                if (diff.y < 0 && diff.y < -this._windowResizeMouseEventData.maximumResize.height){
                    diff.y = -this._windowResizeMouseEventData.maximumResize.height;
                }else if (diff.y > 0 && diff.y > -this._windowResizeMouseEventData.minimumResize.height){
                    diff.y = -this._windowResizeMouseEventData.minimumResize.height;
                }
                frame.origin.y += diff.y;
                frame.size.height -= diff.y;
            }else if (resizeOperation === UIWindowServer.ResizeOperation.bottom || resizeOperation === UIWindowServer.ResizeOperation.bottomLeft  || resizeOperation === UIWindowServer.ResizeOperation.bottomRight){
                if (diff.y > 0 && diff.y > this._windowResizeMouseEventData.maximumResize.height){
                    diff.y = this._windowResizeMouseEventData.maximumResize.height;
                }else if (diff.y < 0 && diff.y < this._windowResizeMouseEventData.minimumResize.height){
                    diff.y = this._windowResizeMouseEventData.minimumResize.height;
                }
                frame.size.height += diff.y;
            }
            if (resizeOperation === UIWindowServer.ResizeOperation.left || resizeOperation === UIWindowServer.ResizeOperation.topLeft  || resizeOperation === UIWindowServer.ResizeOperation.bottomLeft){
                if (diff.x < 0 && diff.x < -this._windowResizeMouseEventData.maximumResize.width){
                    diff.x = -this._windowResizeMouseEventData.maximumResize.width;
                }else if (diff.x > 0 && diff.x > -this._windowResizeMouseEventData.minimumResize.width){
                    diff.x = -this._windowResizeMouseEventData.minimumResize.width;
                }
                frame.origin.x += diff.x;
                frame.size.width -= diff.x;
            }else if (resizeOperation === UIWindowServer.ResizeOperation.right || resizeOperation === UIWindowServer.ResizeOperation.topRight  || resizeOperation === UIWindowServer.ResizeOperation.bottomRight){
                if (diff.x > 0 && diff.x > this._windowResizeMouseEventData.maximumResize.width){
                    diff.x = this._windowResizeMouseEventData.maximumResize.width;
                }else if (diff.x < 0 && diff.x < this._windowResizeMouseEventData.minimumResize.width){
                    diff.x = this._windowResizeMouseEventData.minimumResize.width;
                }
                frame.size.width += diff.x;
            }
            event.window.untransformedFrame = frame;
            event.window._windowServerDidResize(this._windowResizeMouseEventData.frame0);
        }
    },

    cursorForWindowResizeOperation: function(window, resizeOperation){
        // TODO: consider window transform
        if (resizeOperation === UIWindowServer.ResizeOperation.top){
            return UICursor.resizeNorthSouth;
        }
        if (resizeOperation === UIWindowServer.ResizeOperation.left){
            return UICursor.resizeEastWest;
        }
        if (resizeOperation === UIWindowServer.ResizeOperation.bottom){
            return UICursor.resizeNorthSouth;
        }
        if (resizeOperation === UIWindowServer.ResizeOperation.right){
            return UICursor.resizeEastWest;
        }
        if (resizeOperation === UIWindowServer.ResizeOperation.topLeft){
            return UICursor.resizeNorthWestSouthEast;
        }
        if (resizeOperation === UIWindowServer.ResizeOperation.topRight){
            return UICursor.resizeNorthEastSouthWest;
        }
        if (resizeOperation === UIWindowServer.ResizeOperation.bottomLeft){
            return UICursor.resizeNorthEastSouthWest;
        }
        if (resizeOperation === UIWindowServer.ResizeOperation.bottomRight){
            return UICursor.resizeNorthWestSouthEast;
        }
        return null;
    },

    // -----------------------------------------------------------------------
    // MARK: - Drag and Drop

    createDraggingSessionWithItems: function(items, event, view){
        if (event.type != UIEvent.Type.leftMouseDragged){
            throw new Error("Cannot create drag session with event type: %d", event.type);
        }
        var session = UIDraggingSession.initWithItems(items, event, view);
        this.startDraggingSession(session);
        return session;
    },

    startDraggingSession: function(session){
        if (this._draggingSession !== null){
            this.cancelDraggingSession();
            logger.warn("Creating a new dragging session with one already active.");
        }
        this._draggingSession = session;
        if (this._tooltipWindow !== null){
            this.hideTooltip();
        }
    },

    cancelDraggingSession: function(){
        this._draggingSession.cancel();
        this._draggingSession = null;
    },

    draggingSessionDidChangeLocation: function(){
        if (!this._draggingSession.isActive){
            return;
        }
        this._draggingSession._screenLocation = JSPoint(this.mouseLocation);
        var window = this.windowForEventAtLocation(this.mouseLocation);
        var operation = UIDragOperation.none;
        if (window !== null){
            var view = window.hitTest(window.convertPointFromScreen(this.mouseLocation));
            while (view !== null && !this._draggingSession.isValidDestination(view)){
                view = view.superview;
            }
            if (view !== this._draggingSession.destination){
                if (this._draggingSession.destination !== null){
                    this._draggingSession.destination.draggingExited(this._draggingSession);
                }

                this._draggingSession.destination = view;
                if (this._draggingSession.destination !== null){
                    operation = this._draggingSession.destination.draggingEntered(this._draggingSession);
                }
            }else if (this._draggingSession.destination !== null){
                operation = this._draggingSession.destination.draggingUpdated(this._draggingSession);
            }
        }
        this._draggingSession.operation = operation & this._draggingSession.allowedOperations;
    },

    draggingSessionDidPerformOperation: function(){
        if (!this._draggingSession.isActive){
            this._draggingSession.operation = UIDragOperation.none;
        }
        this._draggingSession.end();
        this._draggingSession = null;
    },

    shouldDraggingSessionHandleKey: function(){
        return this._draggingSession !== null;
    },

    shouldCancelDragOnEscape: function(){
        return true;
    },

    handleDraggingKeyEvent: function(event){
        switch (event.type){
            case UIEvent.Type.keyDown:
                switch (event.key){
                    case UIEvent.Key.escape:
                        // Resetting the entire mouse state.  If we only stopped the drag
                        // session, mouse move events would be directed to the view that
                        // started the drag, and it likely will just start another drag
                        if (this.shouldCancelDragOnEscape()){
                            this.resetMouseState();
                        }
                        break;
                    case UIEvent.Key.option:
                        // prefer copy
                        break;
                }
                break;
            case UIEvent.Type.keyUp:
                switch (event.key){
                    case UIEvent.Key.option:
                        // remove copy preference
                        break;
                }
                break;
        }
    },

    // -----------------------------------------------------------------------
    // MARK: - Touch Events

    activeTouchEvent: null,

    createTouchEvent: function(type, timestamp, changedTouchDescriptors, touchIdentifiers){
        var window;
        var touch;
        var descriptor;
        var location;
        var i, l;
        var phase = this._touchPhaseForEventType(type);

        if (this.activeTouchEvent !== null){
            if (this.activeTouchEvent.removeUnreferencedTouches(touchIdentifiers) > 0){
                logger.warn("removed unreferenced touches");
            }
            if (this.activeTouchEvent.touches.length === 0){
                this.activeTouchEvent = null;
            }
        }

        // Create or update the active touch event
        if (this.activeTouchEvent === null){
            if (type != UIEvent.Type.touchesBegan){
                logger.info("Ignoring touch event: %d", type);
                return;
            }
            this.activeTouchEvent = UIEvent.initTouchEventWithType(type, timestamp);
        }else{
            this.activeTouchEvent.updateTouches(type, timestamp);
        }

        // Add or update touches
        if (type === UIEvent.Type.touchesBegan){
            for (i = 0, l = changedTouchDescriptors.length; i < l; ++i){
                descriptor = changedTouchDescriptors[i];
                touch = this.activeTouchEvent.touchForIdentifier(descriptor.identifier);
                if (touch !== null){
                    logger.warn("multiple began events for touch %{public}", touch.identifier);
                    continue;
                }
                window = this.windowForEventAtLocation(descriptor.location);
                if (window !== null){
                    location = window.convertPointFromScreen(descriptor.location);
                    touch = UITouch.initWithIdentifier(descriptor.identifier, timestamp, window, location);
                    this.activeTouchEvent.addTouch(touch);
                }
            }
        }else{
            for (i = 0, l = changedTouchDescriptors.length; i < l; ++i){
                descriptor = changedTouchDescriptors[i];
                touch = this.activeTouchEvent.touchForIdentifier(descriptor.identifier);
                if (touch === null){
                    logger.warn("no touch found for identifier %{public}", descriptor.identifier);
                    continue;
                }
                location = touch.window.convertPointFromScreen(descriptor.location);
                touch.update(phase, timestamp, location);
            }
        }

        // Dispatch the event to the application(s)
        var touches = this.activeTouchEvent.touches;
        var sentApplicationIds = new Set();
        for (i = 0, l = touches.length; i < l; ++i){
            touch = touches[i];
            if (!sentApplicationIds.has(touch.window.application.objectID)){
                this._sendEventToApplication(this.activeTouchEvent, touch.window.application);
                sentApplicationIds.add(touch.window.application.objectID);
            }
        }

        // Clear the active touch memeber if all touches have ended
        if (type === UIEvent.Type.touchesCanceled || type === UIEvent.Type.touchesEnded){
            this.activeTouchEvent.removeCompletedTouches();
            if (this.activeTouchEvent.touches.length === 0){
                this.activeTouchEvent = null;
            }
        }
    },

    _touchPhaseForEventType: function(type){
        switch(type){
            case UIEvent.Type.touchesBegan:
                return UITouch.Phase.began;
            case UIEvent.Type.touchesMoved:
                return UITouch.Phase.moved;
            case UIEvent.Type.touchesEnded:
                return UITouch.Phase.ended;
            case UIEvent.Type.touchesCanceled:
                return UITouch.Phase.canceled;
        }
    },

    // -----------------------------------------------------------------------
    // MARK: - Accessibility

    accessibilityNotificationCenter: null,

    postNotificationForAccessibilityElement: function(notificationName, accessibilityElement){
        this.accessibilityNotificationCenter.post(notificationName, accessibilityElement);
    },

    postNotificationsForAccessibilityElementCreated: function(element){
        this.postNotificationForAccessibilityElement(UIAccessibility.Notification.elementCreated, element);
        var children = element.accessibilityElements;
        var child;
        if (children !== null && children !== undefined){
            for (var i = 0, l = children.length; i < l; ++i){
                child = children[i];
                if (!child.isKindOfClass(UIView)){
                    this.postNotificationsForAccessibilityElementCreated(child);   
                }
            }
        }
    },

    postNotificationsForAccessibilityElementDestroyed: function(element){
        this.postNotificationForAccessibilityElement(UIAccessibility.Notification.elementDestroyed, element);
        var children = element.accessibilityElements;
        var child;
        if (children !== null && children !== undefined){
            for (var i = 0, l = children.length; i < l; ++i){
                child = children[i];
                if (!child.isKindOfClass(UIView)){
                    this.postNotificationsForAccessibilityElementDestroyed(child);
                }
            }
        }
    },

    accessibilityHighlightEnabled: JSDynamicProperty("_accessibilityHighlightEnabled", false),

    setAccessibilityHighlightEnabled: function(enabled){
        this._accessibilityHighlightEnabled = enabled;
        if (enabled){
            if (this._accessibilityHighlightWindow === null){
                this._accessibilityHighlightWindow = UIWindow.initWithStyler(UIWindow.Styler.custom);
                this._accessibilityHighlightWindow.backgroundColor = null;
                this._accessibilityHighlightWindow.contentView = UIWindowServerAccessibilityHighlightView.init();
                this._accessibilityHighlightWindow.userInteractionEnabled = false;
                this._accessibilityHighlightWindow.level = UIWindow.Level.front;
                this._accessibilityHighlightWindow.frame = this.screen.frame;
                this._accessibilityHighlightWindow.orderFront();
            }
        }else{
            if (this._accessibilityHighlightWindow !== null){
                this._accessibilityHighlightWindow.close();
                this._accessibilityHighlightWindow = null;
            }
        }
    },

    _accessibilityHighlightWindow: null,

    // -----------------------------------------------------------------------
    // MARK: - Traits

    traitCollection: JSDynamicProperty("_traitCollection", null),

    setTraitCollection: function(traitCollection){
        if (this._traitCollection.isEqual(traitCollection)){
            return;
        }
        this._traitCollection = traitCollection;
        UIColorSpace.setTraitCollection(traitCollection);
        if (this.windowStack.length > 0){
            var window;
            for (var i = 0, l = this.windowStack.length; i < l; ++i){
                window = this.windowStack[i];
                window._setTraitCollection(this._traitCollection.traitsWithSize(window.bounds.size));
            }
            this.setNeedsRedisplay();
        }
    },

    userInterfaceStyle: JSDynamicProperty("_userInterfaceStyle", UIUserInterface.Style.unspecified),

    setUserInterfaceStyle: function(userInterfaceStyle){
        this._userInterfaceStyle = userInterfaceStyle;
        this.traitCollection = this._traitCollection.traitsWithUserInterfaceStyle(this.effectiveUserInterfaceStyle);
    },

    effectiveUserInterfaceStyle: JSReadOnlyProperty(),

    getEffectiveUserInterfaceStyle: function(){
        if (!this.darkModeEnabled){
            return UIUserInterface.Style.light;
        }
        if (!this.lightModeEnabled){
            return UIUserInterface.Style.dark;
        }
        if (this._userInterfaceStyle !== UIUserInterface.Style.unspecified){
            return this._userInterfaceStyle;
        }
        return this.systemUserInterfaceStyle;
    },

    systemUserInterfaceStyle: JSReadOnlyProperty(),

    getSystemUserInterfaceStyle: function(){
        return UIUserInterface.Style.light;
    },

    accessibilityContrast: JSDynamicProperty("_accessibilityContrast", UIUserInterface.Contrast.unspecified),

    setAccessibilityContrast: function(accessibilityContrast){
        this._accessibilityContrast = accessibilityContrast;
        this.traitCollection = this._traitCollection.traitsWithContrast(this.effectiveAccessibilityContrast);
    },

    effectiveAccessibilityContrast: JSReadOnlyProperty(),

    getEffectiveAccessibilityContrast: function(){
        if (this._accessibilityContrast !== UIUserInterface.Contrast.unspecified){
            return this._accessibilityContrast;
        }
        return this.systemAccessibilityContrast;
    },

    systemAccessibilityContrast: JSReadOnlyProperty(),

    getSystemAccessibilityContrast: function(){
        return UIUserInterface.Contrast.normal;
    },

    _needsRedisplay: false,

    setNeedsRedisplay: function(){
        if (this._needsRedisplay){
            return;
        }
        this._needsRedisplay = true;
        var i, l;
        var layers = [];
        var window;
        for (i = 0, l = this.windowStack.length; i < l; ++i){
            window = this.windowStack[i];
            layers.push(window.layer);
        }
        var layer;
        var sublayer;
        while (layers.length > 0){
            layer = layers.shift();
            layer.setNeedsRedisplay();
            for (i = 0, l = layer.sublayers.length; i < l; ++i){
                layers.push(layer.sublayers[i]);
            }
        }
        this.displayServer.schedule(function(){
            this._needsRedisplay = false;
        }, this);
    },

    windowDidChangeTitle: function(window){
    }

});

UIWindowServer.ResizeOperation = {
    none: 0,
    top: 1,
    left: 2,
    bottom: 3,
    right: 4,
    topLeft: 5,
    topRight: 6,
    bottomLeft: 7,
    bottomRight: 8
};

JSClass("UIWindowServerAccessibilityHighlightView", UIView, {

    framesetter: JSLazyInitProperty(function(){
        var framesetter = JSTextFramesetter.init();
        return framesetter;
    }),

    font: JSLazyInitProperty(function(){
        return JSFont.systemFontOfSize(JSFont.Size.detail);
    }),

    level: JSDynamicProperty("_level", 0),

    setLevel: function(level){
        this._level = level;
        this.setNeedsDisplay();
    },

    drawLayerInContext: function(layer, context){
        if (this._windowServer === null){
            return;
        }
        var location = this._windowServer.mouseLocation;
        var window = this._windowServer.windowForEventAtLocation(location);
        if (window === null){
            return;
        }
        var view = window.hitTest(location);
        while (view !== null && (!view.isAccessibilityElement || view.accessibilityHidden)){
            view = view.superview;
        }
        var level = 0;
        while (view !== null && level < this._level){
            view = view.superview;
            while (view !== null && (!view.isAccessibilityElement || view.accessibilityHidden)){
                view = view.superview;
            }
            ++level;
        }
        if (view === null){
            return;
        }
        var color = JSColor.highlight;
        var textColor = JSColor.highlightedText;
        var width = 2;
        var halfWidth = width / 2;
        var rect = view.convertRectToScreen(view.bounds);
        var maxRect = this.bounds.rectWithInsets(halfWidth);
        var outlineRect = rect.rectWithInsets(-halfWidth).intersectingRect(maxRect);
        var text = view.accessibilityIdentifier;
        context.save();
        context.setStrokeColor(color);
        context.setLineWidth(width);
        context.setLineJoin(JSContext.LineJoin.round);
        context.beginPath();
        context.addRect(outlineRect);
        context.strokePath();
        context.restore();
        if (text){
            this.framesetter.attributedString = JSAttributedString.initWithString("#" + text, {font: this.font});
            var textFrame = this.framesetter.createFrame(JSSize(0, 0), JSRange(0, this.framesetter.attributedString.string.length), 1);
            var textRect = JSRect(rect.origin, textFrame.size);
            context.save();
            context.setFillColor(color);
            context.fillRect(textRect);
            context.setFillColor(textColor);
            textFrame.drawInContextAtPoint(context, textRect.origin);
            context.restore();
        }
    },

});

})();