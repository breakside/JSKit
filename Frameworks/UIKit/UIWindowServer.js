// #import "Foundation/Foundation.js"
// #import "UIKit/UIEvent.js"
// #import "UIKit/UICursor.js"
/* global JSClass, JSObject, UIWindowServer, UIEvent, JSPoint, UIWindowServerInit, UITouch, UICursor */
'use strict';

JSClass("UIWindowServer", JSObject, {

    windowStack: null,
    displayServer: null,
    textInputManager: null,
    keyWindow: null,

    init: function(){
        this.windowStack = [];
    },

    windowInserted: function(window){
        this.windowStack.push(window);
        this.displayServer.layerInserted(window.layer);
        // Force layout and display right now so all sizes are correct when viewDidAppear is called
        this.displayServer.updateDisplay();
    },

    windowRemoved: function(window){
        for (var i = this.windowStack.length - 1; i >= 0; --i){
            if (this.windowStack[i] === window){
                window.windowServer = null;
                this.windowStack.splice(i, 1);
                this.displayServer.layerRemoved(window.layer);
                break;
            }
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
    },

    mouseDownWindow: null,
    mouseDownType: null,

    createMouseEvent: function(type, timestamp, location){
        if (this.mouseDownWindow === null && (type === UIEvent.Type.LeftMouseDown || type === UIEvent.Type.RightMouseDown)){
            this.mouseDownWindow = this.windowAtScreenLocation(location);
            this.mouseDownType = type;
        }
        if (this.mouseDownWindow !== null){
            var event = UIEvent.initMouseEventWithType(type, timestamp, this.mouseDownWindow, this.mouseDownWindow.convertPointFromScreen(location));
            this.mouseDownWindow.application.sendEvent(event);
        }
        if ((type === UIEvent.Type.LeftMouseUp && this.mouseDownType === UIEvent.Type.LeftMouseDown) || (type === UIEvent.Type.RightMouseUp && this.mouseDownType === UIEvent.Type.RightMouseDown)){
            this.mouseDownWindow = null;
            this.mouseDownType = null;
        }
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
            touchWindow = this.windowAtScreenLocation(changedTouchDescriptors[i].location);
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