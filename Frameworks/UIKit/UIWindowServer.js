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
'use strict';

(function(){

var logger = JSLog("uikit", "windowServer");

JSClass("UIWindowServer", JSObject, {

    windowStack: null,
    displayServer: null,
    textInputManager: null,
    keyWindow: null,
    mainWindow: null,
    menuBar: JSDynamicProperty('_menuBar', null),
    screen: null,
    mouseLocation: null,
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
        this.windowStack = [];
        this._windowsById = {};
        this._normalLevelRange = JSRange.Zero;
        this._mouseIdleTimer = JSTimer.initWithInterval(1.25, false, this._mouseDidIdle, this);
        this.mouseLocation = JSPoint.Zero;
        this.device = UIDevice.shared;
    },

    stop: function(){
        this.displayServer.stop();
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
            }
        }
    },

    makeWindowKey: function(window){
        this.makeWindowMain(window);
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
            }
            this.textInputManager.windowDidChangeResponder(this.keyWindow);
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
        if (this._normalLevelRange.location === 0 && window.level == UIWindow.Level.back){
            this.updateRootWindowInsets(window);
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
                    this.textInputManager.windowDidChangeResponder(this.keyWindow);
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

    _previousEventWindow: null,

    _beginWindowOrderChange: function(){
        if (this._previousEventWindow !== null){
            return;
        }
        this._previousEventWindow = this.windowForEventAtLocation(this.mouseLocation);
    },

    _endWindowOrderChange: function(){
        if (this._previousEventWindow === null){
            return;
        }
        var previousEventWindow = this._previousEventWindow;
        var currentEventWindow = this.windowForEventAtLocation(this.mouseLocation);
        this._previousEventWindow = null;
        this._createTrackingEventsForWindowLevelChangeAtLocation(this.mouseLocation, previousEventWindow, currentEventWindow);
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
    },

    layoutWindow: function(window){
        if (window.level === UIWindow.Level.back){
            window.frame = window._screen.frame;
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

    updateRootWindowInsets: function(rootWindow){
        var insets = JSInsets.Zero;
        if (this._menuBar !== null && this._menuBar.isOpaque){
            insets.top = this._menuBar.frame.size.height;
            rootWindow.contentInsets = insets;
        }
    },

    // -----------------------------------------------------------------------
    // MARK: - Text Input Coordination

    windowDidChangeResponder: function(window){
        this.textInputManager.windowDidChangeResponder(window);
    },

    // -----------------------------------------------------------------------
    // MARK: - Cursor Managment

    viewDidChangeCursor: function(view, cursor){
        // subclasses should override
    },

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
            this.updateRootWindowInsets(this.windowStack[0]);
        }
    },

    // -----------------------------------------------------------------------
    // MARK: - Tooltips

    showTooltipForView: function(view, screenLocation){
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

    hideTooltip: function(){
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
            while (view !== null && view.tooltip === null){
                view = view.superview;
            }
            if (view === this._tooltipSourceView){
                shouldHideTooltip = false;
            }
        }
        if (shouldHideTooltip){
            this.hideTooltip();
            if (view !== null && view.tooltip !== null){
                this.showTooltipForView(view, this.mouseLocation);
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
        var event = UIEvent.initKeyEventWithType(type, timestamp, this.keyWindow, key, keyCode, modifiers);
        if (this.shouldDraggingSessionHandleKey(event)){
            this.handleDraggingKeyEvent(event);
        }else{
            this._sendEventToApplication(event, this.keyWindow.application);
        }
    },

    // -----------------------------------------------------------------------
    // MARK: - Finding Windows by Location

    windowAtScreenLocation: function(location){
        var _window;
        var locationInWindow;
        for (var i = this.windowStack.length - 1; i >= 0; --i){
            _window = this.windowStack[i];
            locationInWindow = _window.convertPointFromScreen(location);
            if (_window.containsPoint(locationInWindow)){
                return _window;
            }
        }
        return null;
    },

    windowForEventAtLocation: function(location){
        var _window;
        var locationInWindow;
        for (var i = this.windowStack.length - 1; i >= 0; --i){
            _window = this.windowStack[i];
            if (_window.receivesAllEvents){
                return _window;
            }
            locationInWindow = _window.convertPointFromScreen(location);
            if (_window.containsPoint(locationInWindow)){
                return _window;
            }
        }
        return null;
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
            logger.warn("Ignoring mouse event: %d".sprintf(type));
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

        var event;
        var targetWindow = this.mouseEventWindow;

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
            event = UIEvent.initMouseEventWithType(type, timestamp, targetWindow, targetWindow.convertPointFromScreen(location), modifiers, clickCount);
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

    mouseDidMove: function(timestamp){
        this._mouseIdleTimer.invalidate();
        this._leftClickCount = 0;
        this._rightClickCount = 0;
        if (this._draggingSession !== null){
            this.draggingSessionDidChangeLocation();
        }else{
            if (this.mouseDownCount === 0){
                if (this._tooltipWindow === null){
                    this._mouseIdleTimer.schedule();
                }else{
                    this.updateTooltip();
                }
            }else{
                if (this.isLeftMouseDown){
                    this.createMouseEvent(UIEvent.Type.leftMouseDragged, timestamp, this.mouseLocation);
                }
                if (this.isRightMouseDown){
                    this.createMouseEvent(UIEvent.Type.rightMouseDragged, timestamp, this.mouseLocation);
                }
            }
        }
    },

    _mouseDidIdle: function(){
        var window = this.windowForEventAtLocation(this.mouseLocation);
        if (window !== null){
            var view = window.hitTest(window.convertPointFromScreen(this.mouseLocation));
            while (view !== null && view.tooltip === null){
                view = view.superview;
            }
            if (view !== null && view.tooltip !== null){
                this.showTooltipForView(view, this.mouseLocation);
            }
        }
    },

    // -----------------------------------------------------------------------
    // MARK: - Mouse Tracking

    viewDidChangeMouseTracking: function(view, trackingType){
        // subclasses should override
    },

    createMouseTrackingEvent: function(type, timestamp, location, modifiers, view, force){
        if (!force && !this._shouldCreateTrackingEventForView(view)){
            return;
        }
        var event = UIEvent.initMouseEventWithType(type, timestamp, view.window, view.window.convertPointFromScreen(location), modifiers, 0);
        event.trackingView = view;
        this._sendEventToApplication(event, view.window.application);
    },

    _shouldCreateTrackingEventForView: function(view){
        // Mouse tracking events are only sent to the key and main windows when the mouse is not down
        // TODO: allow this behavior to be adjusted with tracking options
        if (view.window !== this.keyWindow && view.window !== this.mainWindow && !view.window.shouldReceiveTrackingInBack){
            return false;
        }
        if (this.mouseEventWindow !== null){
            return false;
        }
        return true;
    },

    _createTrackingEventsForWindowLevelChangeAtLocation: function(location, previousWindow, currentWindow){
        if (currentWindow === previousWindow){
            return;
        }
        var view;
        if (previousWindow !== null && (previousWindow.objectID in this._windowsById)){
            view = this._trackingViewInWindowAtLocation(previousWindow, location);
            if (view !== null){
                this.createMouseTrackingEvent(UIEvent.Type.mouseExited, -1, location, UIEvent.Modifier.none, view, true);
            }
        }
        if (currentWindow !== null && (currentWindow.objectID in this._windowsById)){
            view = this._trackingViewInWindowAtLocation(currentWindow, location);
            if (view !== null){
                this.createMouseTrackingEvent(UIEvent.Type.mouseEntered, -1, location, UIEvent.Modifier.none, view, true);
            }
        }
    },

    _trackingViewInWindowAtLocation: function(window, location){
        var view = window.hitTest(window.convertPointFromScreen(location));
        if (view === null){
            return null;
        }
        while (view.superview !== null && ((view.mouseTrackingType & UIView.MouseTracking.enterAndExit) === 0)){
            view = view.superview;
        }
        if ((view.mouseTrackingType & UIView.MouseTracking.enterAndExit) !== 0){
            return view;
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

    handleDraggingKeyEvent: function(event){
        switch (event.type){
            case UIEvent.Type.keyDown:
                switch (event.key){
                    case UIEvent.Key.escape:
                        // Resetting the entire mouse state.  If we only stopped the drag
                        // session, mouse move events would be directed to the view that
                        // started the drag, and it likely will just start another drag
                        this.resetMouseState();
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

    createTouchEvent: function(type, timestamp, changedTouchDescriptors){
        var touchWindow = null;
        var touch;
        var descriptor;
        var location;
        var i, l;
        if (this.activeTouchEvent === null){
            this.activeTouchEvent = UIEvent.initTouchEventWithType(type, timestamp);
        }
        var applicationsById = {};
        for (i = 0, l = changedTouchDescriptors.length; i < l; ++i){
            descriptor = changedTouchDescriptors[i];
            touch = this.activeTouchEvent.touchForIdentifier(descriptor.identifier);
            touchWindow = this.windowForEventAtLocation(descriptor.location);
            if (touchWindow === null){
                touchWindow = touch.window;
            }
            location = touchWindow.convertPointFromScreen(descriptor.location);
            if (touch === null){
                touch = UITouch.initWithIdentifier(descriptor.identifier, timestamp, touchWindow, location);
                this.activeTouchEvent.addTouch(touch);
            }else{
                touch.update(this._touchPhaseForEventType(type), timestamp, touchWindow, location);
            }
            applicationsById[touchWindow.application.objectID] = touchWindow.application;
        }
        this.activeTouchEvent.updateTouches(type, timestamp);

        // Dispatch the event to the application(s)
        for (var id in applicationsById){
            this._sendEventToApplication(this.activeTouchEvent, applicationsById[id]);
        }

        // Clear the active touch memeber if all touches have ended
        if ((type === UIEvent.Type.touchesEnded) || (type === UIEvent.Type.touchesCanceled)){
            var hasActiveTouch = false;
            for (i = 0, l = this.activeTouchEvent.touches.length; i < l && !hasActiveTouch; ++i){
                hasActiveTouch = this.activeTouchEvent.touches[i].isActive();
            }
            if (!hasActiveTouch){
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
    }

});

})();