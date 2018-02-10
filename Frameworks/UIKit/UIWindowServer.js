// #import "Foundation/Foundation.js"
// #import "UIKit/UIEvent.js"
/* global JSClass, JSObject, UIWindowServer, UIEvent, JSPoint, UIWindowServerInit */
'use strict';

JSClass("UIWindowServer", JSObject, {

    application: null,
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
        return UIWindowServer.defaultServer;
    }
});