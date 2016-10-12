// #import "Foundation/Foundation.js"
// #import "UIKit/UIEvent.js"
/* global JSClass, JSObject, UIWindowServer, UIEvent, JSPoint */
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
    }

});

Object.defineProperty(UIWindowServer, 'defaultServer', {
    configurable: true,
    get: function UIWindowServer_lazyInitDefault(){
        var defaultServer = UIWindowServer.init();
        Object.defineProperty(UIWindowServer, 'defaultServer', {
            value: defaultServer
        });
        return defaultServer;
    }
});