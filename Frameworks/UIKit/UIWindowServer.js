// #import "Foundation/Foundation.js"
// #import "UIKit/UIEvent.js"
// #import "UIKit/UICursor.js"
// #import "UIKit/UILayer.js"
// #import "UIKit/UIView.js"
// #import "UIKit/UITooltipWindow.js"
// #import "UIKit/UIDraggingSession.js"
/* global JSClass, JSObject, UIWindowServer, UIEvent, JSPoint, UIWindowServerInit, UITouch, UICursor, UILayer, UIView, JSTimer, UITooltipWindow, JSSize, JSRect, UIDraggingSession, UIDragOperation, jslog_create */
'use strict';

(function(){

var logger = jslog_create("com.owenshaw.UIKit.WindowServer");

JSClass("UIWindowServer", JSObject, {

    windowStack: null,
    displayServer: null,
    textInputManager: null,
    keyWindow: null,
    mainWindow: null,
    screen: null,
    mouseLocation: null,
    _menuStack: [],
    _windowsById: null,
    _mouseIdleTimer: null,
    _tooltipWindow: null,
    _tooltipSourceView: null,
    _draggingSession: null,
    _activeEvent: null,

    // -----------------------------------------------------------------------
    // MARK: - Creating a Window Server

    init: function(){
        this.windowStack = [];
        this._menuStack = [];
        this._windowsById = {};
        this._mouseIdleTimer = JSTimer.initWithInterval(1.25, false, this._mouseDidIdle, this);
        this.mouseLocation = JSPoint.Zero;
    },

    // -----------------------------------------------------------------------
    // MARK: - Inserting and Removing Windows

    makeMenuVisible: function(menu){
        this._beginWindowLevelChange();
        this._menuStack.push(menu);
        this.makeWindowVisible(menu.window);
        if (this.mouseEventWindow !== null){
            this.mouseEventWindow = menu.window;
        }
        this._endWindowLevelChange();
    },

    makeMenuKeyAndVisible: function(menu){
        this.makeMenuVisible(menu);
        this.makeWindowKey(menu.window);
    },

    makeWindowVisible: function(window){
        this.windowInserted(window);
        this.orderWindowFront(window);
    },

    makeWindowKeyAndVisible: function(window){
        this.makeWindowVisible(window);
        this.makeWindowKey(window);
    },

    makeWindowMain: function(window){
        if (this.mainWindow === window){
            return;
        }
        if (window.canBecomeMainWindow()){
            this.mainWindow = window;
        }
    },

    makeWindowKey: function(window){
        this.makeWindowMain(window);
        if (this.keyWindow === window){
            return;
        }
        if (window.canBecomeKeyWindow()){
            this.keyWindow = window;
            this.textInputManager.windowDidChangeResponder(this.keyWindow);
        }
    },

    windowInserted: function(window){
        if (window.objectID in this._windowsById){
            return;
        }
        this._beginWindowLevelChange();
        this._windowsById[window.objectID] = window;
        window.level = window.layer.level = this.windowStack.length;
        window._screen = this.screen;
        if (window.constraintBox){
            window.frame = UILayer.FrameForConstraintBoxInBounds(window.constraintBox, window._screen.frame);
        }
        this.windowStack.push(window);
        this.displayServer.windowInserted(window);
        this._endWindowLevelChange();
        // Force layout and display right now so all sizes are correct when viewDidAppear is called
        this.displayServer.updateDisplay();
    },

    windowRemoved: function(window){
        if (!(window.objectID in this._windowsById)){
            return;
        }
        this._beginWindowLevelChange();
        delete this._windowsById[window.objectID];
        var i;
        for (i = this._menuStack.length - 1; i >= 0; --i){
            if (this._menuStack[i].window === window){
                this._menuStack.splice(i, 1);
                break;
            }
        }
        for (i = this.windowStack.length - 1; i >= 0; --i){
            if (this.windowStack[i] === window){
                this.windowStack.splice(i, 1);
                this.displayServer.layerRemoved(window.layer);
                window._screen = null;
                break;
            }
            this.windowStack[i].level = this.windowStack[i].layer.level = i - 1;
        }
        if (window === this.keyWindow){
            this.keyWindow = null;
            for (i = this.windowStack.length - 1; i >= 0; --i){
                if (this.windowStack[i].canBecomeKeyWindow()){
                    this.keyWindow = this.windowStack[i];
                    this.textInputManager.windowDidChangeResponder(this.keyWindow);
                    break;
                }
            }
        }
        if (window === this.mainWindow){
            this.mainWindow = null;
            for (i = this.windowStack.length - 1; i >= 0; --i){
                if (this.windowStack[i].canBecomeMainWindow()){
                    this.mainWindow = this.windowStack[i];
                    break;
                }
            }
        }
        if (window === this.mouseEventWindow){
            this.mouseEventWindow = null;
        }
        if (window === this.mouseDownWindow){
            this.mouseDownWindow = null;
        }
        this._endWindowLevelChange();
    },

    orderWindowFront: function(window){
        if (!(window.objectID in this._windowsById)){
            return;
        }
        if (window === this.windowStack[this.windowStack.length - 1]){
            return;
        }
        this._beginWindowLevelChange();
        for (var i = this.windowStack.length - 1; i >= 0; --i){
            if (this.windowStack[i] === window){
                this.windowStack.splice(i, 1);
                window.level = window.layer.level = this.windowStack.length;
                this.windowStack.push(window);
                this.displayServer.layerInserted(window.layer);
                break;
            }
            this.windowStack[i].level = this.windowStack[i].layer.level = i - 1;
        }
        this._endWindowLevelChange();
    },

    _previousEventWindow: null,

    _beginWindowLevelChange: function(){
        if (this._previousEventWindow !== null){
            return;
        }
        this._previousEventWindow = this.windowForEventAtLocation(this.mouseLocation);
    },

    _endWindowLevelChange: function(){
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

    screenDidChangeFrame: function(){
        var window;
        for (var i = 0, l = this.windowStack.length; i < l; ++i){
            window = this.windowStack[i];
            if (window.constraintBox){
                window.frame = UILayer.FrameForConstraintBoxInBounds(window.constraintBox, window._screen.frame);
            }
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
        this._tooltipWindow.makeVisible();
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

    _sendEventToApplication: function(event, application){
        this._activeEvent = event;
        application.sendEvent(event);
        this._activeEvent = null;
    },

    // -----------------------------------------------------------------------
    // MARK: - Keyboard Events

    createKeyEvent: function(type, timestamp, keyCode){
        var event = UIEvent.initKeyEventWithType(type, timestamp, this.keyWindow, keyCode);
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
        if (this._menuStack.length > 0){
            return this._menuStack[this._menuStack.length - 1].window;
        }
        return this.windowAtScreenLocation(location);
    },

    // -----------------------------------------------------------------------
    // MARK: - Mouse Events

    mouseDownWindow: null,
    isLeftMouseDown: false,
    isRightMouseDown: false,
    mouseDownCount: 0,
    mouseEventWindow: null,

    createMouseEvent: function(type, timestamp, location){
        var isADown = false;
        var isAnUp = false;
        var ignore = false;
        switch (type){
            case UIEvent.Type.LeftMouseDown:
                isADown = true;
                ignore = this.isLeftMouseDown;
                this.isLeftMouseDown = true;
                break;
            case UIEvent.Type.RightMouseDown:
                isADown = true;
                ignore = this.isLeftMouseDown;
                this.isRightMouseDown = true;
                break;
            case UIEvent.Type.LeftMouseUp:
                isAnUp = true;
                ignore = !this.isLeftMouseDown;
                this.isLeftMouseDown = false;
                break;
            case UIEvent.Type.RightMouseUp:
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
            if (this.mouseDownCount === 0 && this._draggingSession === null){
                this.mouseDownWindow = this.mouseEventWindow = this.windowForEventAtLocation(location);
            }
            ++this.mouseDownCount;
        }

        var event;
        var targetWindow = this.mouseEventWindow;
        var originalDownWindow = this.mouseDownWindow;

        if (isAnUp){
            --this.mouseDownCount;
            if (this.mouseDownCount === 0){
                this.mouseDownWindow = null;
                this.mouseEventWindow = null;
            }
        }

        if (this._draggingSession !== null){
            if (type == UIEvent.Type.LeftMouseUp){
                this.draggingSessionDidPerformOperation();
            }
        }else{
            if (targetWindow !== null){
                event = UIEvent.initMouseEventWithType(type, timestamp, targetWindow, targetWindow.convertPointFromScreen(location));
                this._sendEventToApplication(event, targetWindow.application);
                /* Need to figure this out, probably still required, but I need a test case
                if ((type === UIEvent.Type.LeftMouseUp && downType === UIEvent.Type.LeftMouseDown) || (type === UIEvent.Type.RightMouseUp && downType === UIEvent.Type.RightMouseDown)){
                    // If a mouse down causes a new window to open, like a menu, the resulting mouse up will be sent to the
                    // menu window, but we also want to hear about it in the original window in order to do things like update the button state
                    if (originalDownWindow !== targetWindow){
                        event = UIEvent.initMouseEventWithType(type, timestamp, originalDownWindow, originalDownWindow.convertPointFromScreen(location));
                        this._sendEventToApplication(event, originalDownWindow.application);
                    }
                }
                */
            }
        }
    },

    resetMouseState: function(timestamp){
        if (this._draggingSession !== null){
            // stop the dragging session immediately because we don't want the
            // mouse up to be interpreted as a drop
            this.stopDraggingSession();
        }
        if (this.isRightMouseDown){
            this.createMouseEvent(UIEvent.Type.RightMouseUp, timestamp, this.mouseLocation);
        }
        if (this.isLeftMouseDown){
            this.createMouseEvent(UIEvent.Type.LeftMouseUp, timestamp, this.mouseLocation);
        }
    },

    mouseDidMove: function(timestamp){
        this._mouseIdleTimer.invalidate();
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
                    this.createMouseEvent(UIEvent.Type.LeftMouseDragged, timestamp, this.mouseLocation);
                }
                if (this.isRightMouseDown){
                    this.createMouseEvent(UIEvent.Type.RightMouseDragged, timestamp, this.mouseLocation);
                }
            }
        }
    },

    _mouseDidIdle: function(){
        var window = this.windowForEventAtLocation(this.mouseLocation);
        if (window !== null){
            var view = window.hitTest(window.convertPointFromScreen(this.mouseLocation));
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

    createMouseTrackingEvent: function(type, timestamp, location, view, force){
        if (!force && !this._shouldCreateTrackingEventForView(view)){
            return;
        }
        var event = UIEvent.initMouseEventWithType(type, timestamp, view.window, view.window.convertPointFromScreen(location));
        event.trackingView = view;
        this._sendEventToApplication(event, view.window.application);
    },

    _shouldCreateTrackingEventForView: function(view){
        // If a menu is open, mouse tracking events are only sent to menu views, regardless of if
        // the mouse is down or up
        if (this._menuStack.length > 0){
            // loop backwards because we're most likely tracking on the topmost menu
            for (var i = this._menuStack.length - 1; i >= 0; --i){
                if (view.window === this._menuStack[i].window){
                    return true;
                }
            }
            return false;
        }
        // Mouse tracking events are only sent to the key and main windows when the mouse is not down
        // TODO: allow this behavior to be adjusted with tracking options
        if (view.window !== this.keyWindow && view.window !== this.mainWindow){
            return false;
        }
        if (this.mouseDownWindow !== null){
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
                this.createMouseTrackingEvent(UIEvent.Type.MouseExited, -1, location, view, true);
            }
        }
        if (currentWindow !== null && (currentWindow.objectID in this._windowsById)){
            view = this._trackingViewInWindowAtLocation(currentWindow, location);
            if (view !== null){
                this.createMouseTrackingEvent(UIEvent.Type.MouseEntered, -1, location, view, true);
            }
        }
    },

    _trackingViewInWindowAtLocation: function(window, location){
        var view = window.hitTest(window.convertPointFromScreen(location));
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
        if (event.type != UIEvent.Type.LeftMouseDragged){
            throw new Error("Cannot create drag session with event type: %d", event.type);
        }
        var session = UIDraggingSession.initWithItems(items, event, view);
        this.startDraggingSession(session);
        return session;
    },

    startDraggingSession: function(session){
        if (this._draggingSession !== null){
            this.stopDraggingSession();
            logger.warn("Creating a new dragging session with one already active.");
        }
        this._draggingSession = session;
        if (this._tooltipWindow !== null){
            this.hideTooltip();
        }
    },

    stopDraggingSession: function(){
        this._draggingSession.operation = UIDragOperation.none;
        this.draggingSessionDidPerformOperation();
    },

    draggingSessionDidChangeLocation: function(){
        if (!this._draggingSession.isActive){
            return;
        }
        var window = this.windowForEventAtLocation(this.mouseLocation);
        var operation = UIDragOperation.none;
        if (window !== null){
            var view = window.hitTest(window.convertPointFromScreen(this.mouseLocation));
            while (view !== null && !this._draggingSession.isValidDestination(view)){
                view = view.superview;
            }
            if (view !== this._draggingSession.destination){
                if (this._draggingSession.destination !== null){
                    this._draggingSession.destination.draggingExited(); // FIXME: arguments
                }
                this._draggingSession.destination = view;
                if (this._draggingSession.destination !== null){
                    operation = this._draggingSession.destination.draggingEntered(); // FIXME: arguments
                }
            }else if (this._draggingSession.destination !== null){
                operation = this._draggingSession.destination.draggingUpdated(); // FIXME: arguments
            }
        }
        this._draggingSession.operation = operation;
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
            case UIEvent.Type.KeyDown:
                switch (event.keyCode){
                    case 27:
                        // Resetting the entire mouse state.  If we only stopped the drag
                        // session, mouse move events would be directed to the view that
                        // started the drag, and it likely will just start another drag
                        this.resetMouseState();
                        break;
                    case 18:
                        // prefer copy
                        break;
                }
                break;
            case UIEvent.Type.KeyUp:
                switch (event.keyCode){
                    case 18:
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
            touchWindow = this.windowForEventAtLocation(changedTouchDescriptors[i].location);
            // FIXME: touchWindow could be null (mobile safari continues reporting moved
            // touches outside of the viewport)
            location = touchWindow.convertPointFromScreen(changedTouchDescriptors[i].location);
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
        if ((type === UIEvent.Type.TouchesEnded) || (type === UIEvent.Type.TouchesCanceled)){
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
            case UIEvent.Type.TouchesBegan:
                return UITouch.Phase.began;
            case UIEvent.Type.TouchesMoved:
                return UITouch.Phase.moved;
            case UIEvent.Type.TouchesEnded:
                return UITouch.Phase.ended;
            case UIEvent.Type.TouchesCanceled:
                return UITouch.Phase.canceled;
        }
    }

});

})();

// Lazy init a property, so the first access is a function call, but subsequent accesses are simple values
Object.defineProperty(UIWindowServer, 'defaultServer', {
    configurable: true,
    enumerable: false,
    get: function UIWindowServer_lazyInitDefaultRenderer(){
        Object.defineProperty(UIWindowServer, 'defaultServer', {
            configurable: false,
            enumerable: false,
            value: UIWindowServerInit()
        });
        UICursor._windowServer = UIWindowServer.defaultServer;
        return UIWindowServer.defaultServer;
    }
});