// #import "Foundation/Foundation.js"
// #import "UIKit/UIPasteboard.js"
/* global JSClass, JSObject, JSReadOnlyProperty, JSPoint, UIPasteboard */
'use strict';

JSClass("UIDraggingSession", JSObject, {

    screenLocation: JSReadOnlyProperty('_screenLocation', null),
    pasteboard: JSReadOnlyProperty('_pasteboard', null),

    initWithItems: function(items, event, view){
        this._screenLocation = JSPoint(event.window.convertPointToScreen(event.locationInWindow));
        this._pasteboard = UIPasteboard.init();
        var item;
        for (var i = 0, l = items.length; i < l; ++i){
            item = items[i];
            this._pasteboard.setValueForType(item.value, item.type);
        }
    },

    initWithPasteboard: function(pasteboard, screenLocation){
        this._screenLocation = JSPoint(screenLocation);
        this._pasteboard = pasteboard;
    },

    enumerateItems: function(destination, callback){
    },

    isValidDestination: function(destination){
        return this._pasteboard.containsAnyType(destination.registeredDraggedTypes);
    },

});