// #import "Foundation/Foundation.js"
// #import "UIKit/UIEvent.js"
// #import "UIKit/UICursor.js"
// #import "UIKit/UILayer.js"
/* global JSClass, JSObject, UIWindowServer, UIEvent, JSPoint, UIWindowServerInit, UITouch, UICursor, UILayer */
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

    makeMenuKeyAndVisible: function(menu){
        this._menuStack.push(menu);
        this.makeWindowKeyAndVisible(menu.window);
        if (this.mouseEventWindow !== null){
            this.mouseEventWindow = menu.window;
        }
    },

    makeWindowKeyAndVisible: function(window){
        this.windowInserted(window);
        if (window.canBecomeMainWindow()){
            this.mainWindow = window;
        }
        if (window.canBecomeKeyWindow()){
            this.keyWindow = window;
            this.textInputManager.windowDidChangeResponder(window);
        }
        this.orderWindowFront(window);
    },

    windowInserted: function(window){
        if (window.objectID in this._windowsById){
            return;
        }
        this._windowsById[window.objectID] = window;
        window.level = window.layer.level = this.windowStack.length;
        this.windowStack.push(window);
        window._screen = this.screen;
        if (window.constraintBox){
            window.frame = UILayer.FrameForConstraintBoxInBounds(window.constraintBox, window._screen.frame);
        }
        this.displayServer.windowInserted(window);
        // Force layout and display right now so all sizes are correct when viewDidAppear is called
        this.displayServer.updateDisplay();
    },

    windowRemoved: function(window){
        if (!(window.objectID in this._windowsById)){
            return;
        }
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
                    this.textInputManager.windowDidChangeResponder(window);
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
        // TODO: make next window on stack key/main
    },

    orderWindowFront: function(window){
        if (!(window.objectID in this._windowsById)){
            return;
        }
        if (window === this.windowStack[this.windowStack.length - 1]){
            return;
        }
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

    createMouseEvent: function(type, timestamp, location){
        if (this.mouseDownWindow === null && (type === UIEvent.Type.LeftMouseDown || type === UIEvent.Type.RightMouseDown)){
            this.mouseDownWindow = this.mouseEventWindow = this.windowForEventAtLocation(location);
            this.mouseDownType = type;
        }
        var event;
        if (this.mouseEventWindow !== null){
            event = UIEvent.initMouseEventWithType(type, timestamp, this.mouseEventWindow, this.mouseEventWindow.convertPointFromScreen(location));
            this.mouseEventWindow.application.sendEvent(event);
        }
        if ((type === UIEvent.Type.LeftMouseUp && this.mouseDownType === UIEvent.Type.LeftMouseDown) || (type === UIEvent.Type.RightMouseUp && this.mouseDownType === UIEvent.Type.RightMouseDown)){
            // If a mouse down causes a new window to open, like a menu, the resulting mouse up will be sent to the
            // menu window, but we also want to hear about it in the original window in order to do things like update the button state
            if (this.mouseDownWindow !== this.mouseEventWindow){
                event = UIEvent.initMouseEventWithType(type, timestamp, this.mouseDownWindow, this.mouseDownWindow.convertPointFromScreen(location));
                this.mouseDownWindow.application.sendEvent(event);
            }
            this.mouseDownWindow = null;
            this.mouseDownType = null;
            this.mouseEventWindow = null;
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

    createMouseTrackingEvent: function(type, timestamp, location, view){
        if (!this._shouldCreateTrackingEventForView(view)){
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