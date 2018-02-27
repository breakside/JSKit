// #import "Foundation/Foundation.js"
// #import "UIKit/UITouch.js"
/* global JSClass, JSObject, JSReadOnlyProperty, UIEvent */
'use strict';

JSClass('UIEvent', JSObject, {

    locationInWindow: JSReadOnlyProperty('_locationInWindow', null),
    timestamp: JSReadOnlyProperty('_timestamp', 0.0),
    window: JSReadOnlyProperty(),
    windows: JSReadOnlyProperty('_windows', null),
    category: JSReadOnlyProperty('_category', -1),
    type: JSReadOnlyProperty('_type', -1),
    keyCode: JSReadOnlyProperty('_keyCode', -1),
    touches: JSReadOnlyProperty('_touches', null),

    initMouseEventWithType: function(type, timestamp, window, location){
        this._timestamp = timestamp;
        this._windows = [window];
        this._locationInWindow = location;
        this._category = UIEvent.Category.Mouse;
        this._type = type;
        this._touches = [];
    },

    initKeyEventWithType: function(type, timestamp, window, keyCode){
        this._timestamp = timestamp;
        this._windows = [window];
        this._keyCode = keyCode;
        this._category = UIEvent.Category.Key;
        this._type = type;
        this._touches = [];
    },

    initTouchEventWithType: function(type, timestamp){
        this._category = UIEvent.Category.Touches;
        this._type = type;
        this._timestamp = timestamp;
        this._windows = [];
        this._touches = [];
    },

    getWindow: function(){
        if (this._windows.length === 1){
            return this._windows[0];
        }
        return null;
    },

    addTouch: function(touch){
        this._touches.push(touch);
        var hasWindow = false;
        for (var i = 0, l = this.windows.length && !hasWindow; i < l; ++i){
            hasWindow = this.windows[i] === touch.window;
        }
        if (!hasWindow){
            this._windows.push(touch.window);
        }
    },

    updateTouches: function(type, timestamp){
        this._timestamp = timestamp;
        this._type = type;
        this._windows = [];
        var windowsById = {};
        for (var i = 0, l = this._touches.length; i < l; ++i){
            if (!windowsById[this._touches[i].window.objectID]){
                this._windows.push(this._touches[i].window);
                windowsById[this._touches[i].window.objectID] = true;
            }
        }
    },

    touchForIdentifier: function(identifier){
        for (var i = 0, l = this._touches.length; i < l; ++i){
            if (this._touches[i].identifier == identifier){
                return this._touches[i];
            }
        }
        return null;
    },

    touchesInWindow: function(window){
        var touches = [];
        for (var i = 0, l = this._touches.length; i < l; ++i){
            if (this._touches[i].window === window){
                touches.push(this.touches[i]);
            }
        }
        return touches;
    },

    locationInView: function(view){
        return this.window.convertPointToView(this._locationInWindow, view);
    },

});

UIEvent.doubleClickInterval = 1.0;

UIEvent.Category = {
    Mouse: 0,
    Key: 1,
    Touches: 2
};

UIEvent.Type = {
    LeftMouseDown: 0,
    LeftMouseUp: 1,
    LeftMouseDragged: 2,
    RightMouseDown: 3,
    RightMouseUp: 4,
    RightMouseDragged: 5,
    MouseMoved: 6,
    MouseEntered: 7,
    MouseExited: 8,
    KeyDown: 9,
    KeyUp: 10,
    TouchesBegan: 11,
    TouchesMoved: 12,
    TouchesEnded: 13,
    TouchesCanceled: 14
};