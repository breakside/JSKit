// #import Foundation
'use strict';

JSClass("UITouch", JSObject, {

    identifier: JSReadOnlyProperty('_identifier', 0),
    phase: JSReadOnlyProperty('_phase', 0),
    timestamp: JSReadOnlyProperty('_timestamp', 0),
    window: JSReadOnlyProperty('_window', null),
    locationInWindow: JSReadOnlyProperty('_locationInWindow', null),

    initWithIdentifier: function(identifier, timestamp, window, location){
        this._identifier = identifier;
        this._phase = UITouch.Phase.began;
        this._timestamp = timestamp;
        this._window = window;
        this._locationInWindow = location;
    },

    update: function(phase, timestamp, window, location){
        this._phase = phase;
        this._timestamp = timestamp;
        this._window = window;
        this._locationInWindow = location;
    },

    locationInView: function(view){
        return this.window.convertPointToView(this._locationInWindow, view);
    },

    isActive: function(){
        return this.phase == UITouch.Phase.began || this.phase == UITouch.Phase.moved;
    }

});

UITouch.Phase = {
    began: 0,
    moved: 1,
    ended: 2,
    canceled: 3
};