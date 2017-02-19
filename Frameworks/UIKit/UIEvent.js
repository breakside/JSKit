// #import "Foundation/Foundation.js"
/* global JSClass, JSObject, JSReadOnlyProperty, UIEvent */
'use strict';

JSClass('UIEvent', JSObject, {

    locationInWindow: JSReadOnlyProperty('_locationInWindow', null),
    timestamp: JSReadOnlyProperty('_timestamp', 0.0),
    window: JSReadOnlyProperty('_window', null),
    category: JSReadOnlyProperty('_category', -1),
    type: JSReadOnlyProperty('_type', -1),
    keyCode: JSReadOnlyProperty('_keyCode', -1),

    initMouseEventWithType: function(type, timestamp, window, location){
        this._timestamp = timestamp;
        this._window = window;
        this._locationInWindow = location;
        this._category = UIEvent.Category.Mouse;
        this._type = type;
    },

    initKeyEventWithType: function(type, timestamp, window, keyCode){
        this._timestamp = timestamp;
        this._window = window;
        this._keyCode = keyCode;
        this._category = UIEvent.Category.Key;
        this._type = type;
    },

    locationInView: function(view){
        return this.window.convertPointToView(this._locationInWindow, view);
    }

});

UIEvent.doubleClickInterval = 1.0;

UIEvent.Category = {
    Mouse: 0,
    Key: 1
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
    KeyUp: 10
};