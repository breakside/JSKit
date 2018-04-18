// #import "Foundation/Foundation.js"
// #import "UIKit/UIEvent.js"
// #import "UIKit/UICursor.js"
// #import "UIKit/UILayer.js"
// #import "UIKit/UIView.js"
/* global JSClass, JSObject, UIWindowServer, UIEvent, JSPoint, UIWindowServerInit, UITouch, UICursor, UILayer, UIView */
'use strict';

JSClass("UIWindowServer", JSObject, {

    windowStack: null,
    displayServer: null,
    textInputManager: null,
    keyWindow: null,
    mainWindow: null,
    screen: null,
    _menuStack: [],
    _windowsById: null,

    init: function(){
        this.windowStack = [];
        this._menuStack = [];
        this._windowsById = {};
    },

    _previousEventWindow: null,

    _beginWindowLevelChange: function(){
        if (this._previousEventWindow !== null){
            return;
        }
        var location = this._getLastMouseLocation();
        this._previousEventWindow = this.windowForEventAtLocation(location);
    },

    _endWindowLevelChange: function(){
        if (this._previousEventWindow === null){
            return;
        }
        var location = this._getLastMouseLocation();
        var previousEventWindow = this._previousEventWindow;
        var currentEventWindow = this.windowForEventAtLocation(location);
        this._previousEventWindow = null;
        this._createTrackingEventsForWindowLevelChangeAtLocation(location, previousEventWindow, currentEventWindow);
    },

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

    windowDidChangeResponder: function(window){
        this.textInputManager.windowDidChangeResponder(window);
    },

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

    viewDidChangeMouseTracking: function(view, trackingType){
        // subclasses should override
    },

    screenDidChangeFrame: function(){
        var window;
        for (var i = 0, l = this.windowStack.length; i < l; ++i){
            window = this.windowStack[i];
            if (window.constraintBox){
                window.frame = UILayer.FrameForConstraintBoxInBounds(window.constraintBox, window._screen.frame);
            }
        }
    },

    mouseDownWindow: null,
    mouseDownType: null,
    mouseEventWindow: null,

    _getLastMouseLocation: function(){
        return JSPoint.Zero;
    },

    createMouseEvent: function(type, timestamp, location){
        if (this.mouseDownWindow === null && (type === UIEvent.Type.LeftMouseDown || type === UIEvent.Type.RightMouseDown)){
            this.mouseDownWindow = this.mouseEventWindow = this.windowForEventAtLocation(location);
            this.mouseDownType = type;
        }
        var event;
        var targetWindow = this.mouseEventWindow;
        var originalDownWindow = this.mouseDownWindow;
        var downType = this.mouseDownType;
        if ((type === UIEvent.Type.LeftMouseUp && downType === UIEvent.Type.LeftMouseDown) || (type === UIEvent.Type.RightMouseUp && downType === UIEvent.Type.RightMouseDown)){
            this.mouseDownWindow = null;
            this.mouseDownType = null;
            this.mouseEventWindow = null;
        }
        if (targetWindow !== null){
            event = UIEvent.initMouseEventWithType(type, timestamp, targetWindow, targetWindow.convertPointFromScreen(location));
            targetWindow.application.sendEvent(event);
        }
        if ((type === UIEvent.Type.LeftMouseUp && downType === UIEvent.Type.LeftMouseDown) || (type === UIEvent.Type.RightMouseUp && downType === UIEvent.Type.RightMouseDown)){
            // If a mouse down causes a new window to open, like a menu, the resulting mouse up will be sent to the
            // menu window, but we also want to hear about it in the original window in order to do things like update the button state
            if (originalDownWindow !== targetWindow){
                event = UIEvent.initMouseEventWithType(type, timestamp, originalDownWindow, originalDownWindow.convertPointFromScreen(location));
                originalDownWindow.application.sendEvent(event);
            }
        }
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

    createMouseTrackingEvent: function(type, timestamp, location, view, force){
        if (!force && !this._shouldCreateTrackingEventForView(view)){
            return;
        }
        var event = UIEvent.initMouseEventWithType(type, timestamp, view.window, view.window.convertPointFromScreen(location));
        event.trackingView = view;
        view.window.application.sendEvent(event);
    },

    createKeyEvent: function(type, timestamp, keyCode){
        var event = UIEvent.initKeyEventWithType(type, timestamp, this.keyWindow, keyCode);
        this.keyWindow.application.sendEvent(event);
    },

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
            applicationsById[id].sendEvent(this.activeTouchEvent);
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