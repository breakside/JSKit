// #import "Foundation/Foundation.js"
// #import "UIKit/UIEvent.js"
/* global JSClass, JSObject, UIWindowServer, UIEvent, JSPoint, UIWindowServerInit */
'use strict';

JSClass("UIWindowServer", JSObject, {

    windowStack: null,

    init: function(){
        this.windowStack = [];
    },

    windowInserted: function(window){
        this.windowStack.push(window);
    },

    windowRemoved: function(window){
        for (var i = this.windowStack.length - 1; i >= 0; --i){
            if (this.windowStack[i] === window){
                this.windowStack.splice(i, 1);
                break;
            }
        }
    },

    windowAtScreenLocation: function(location){
        var _window;
        var locationInWindow;
        for (var i = this.windowStack.length - 1; i >= 0; --i){
            _window = this.windowStack[i];
            locationInWindow = JSPoint(location.x - _window.frame.origin.x, location.y - _window.frame.origin.y);
            if (_window.isPointInsideView(locationInWindow)){
                return _window;
            }
        }
        return null;
    },

    mouseDownWindow: null,

    createMouseEvent: function(type, timestamp, location){
        if (this.mouseDownWindow === null && (type == UIEvent.Type.LeftMouseDown || type == UIEvent.Type.RightMouseDown)){
            this.mouseDownWindow = UIWindowServer.defaultServer.windowAtScreenLocation(location);
        }
        if (this.mouseDownWindow !== null){
            var event = UIEvent.initMouseEventWithType(type, timestamp, this.mouseDownWindow, this.mouseDownWindow.convertPointFromScreen(location));
            this.mouseDownWindow.application.sendEvent(event);
        }
        if (type == UIEvent.Type.LeftMouseUp){
            this.mouseDownWindow = null;
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
        return UIWindowServer.defaultServer;
    }
});