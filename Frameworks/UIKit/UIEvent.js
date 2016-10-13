// #import "Foundation/Foundation.js"
/* global JSClass, JSObject, JSReadOnlyProperty, UIEvent */
'use strict';

JSClass('UIEvent', JSObject, {

    locationInWindow: JSReadOnlyProperty('_locationInWindow', null),
    timestamp: JSReadOnlyProperty('_timestamp', 0.0),
    window: JSReadOnlyProperty('_window', null),
    majorType: JSReadOnlyProperty('_majorType', -1),
    type: JSReadOnlyProperty('_type', -1),

    initMouseEventWithType: function(type, timestamp, window, location){
        this._timestamp = timestamp;
        this._window = window;
        this._locationInWindow = location;
        this._majorType = UIEvent.MajorType.Mouse;
        this._type = type;
    },

    initKeyEventWithTimestamp: function(type, timestamp){
        this._timestamp = timestamp;
        this._majorType = UIEvent.MajorType.Key;
        this._type = type;
    },

    getLocationInWindow: function(){
        return this._locationInWindow;
    },

    locationInView: function(view){
        return this.window.convertPointToView(this._locationInWindow, view);
    },

    getTimestamp: function(){
        return this._timestamp;
    },

    getWindow: function(){
        return this._window;
    },

    getMajorType: function(){
        return this._majorType;
    },

    getType: function(){
        return this._type;
    }

});

UIEvent.doubleClickInterval = 1.0;

UIEvent.MajorType = {
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
};