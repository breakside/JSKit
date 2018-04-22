// #import "Foundation/Foundation.js"
// #import "UIKit/UIPasteboard.js"
// #import "UIKit/UIDraggingSource.js"
// #import "UIKit/UIDraggingDestination.js"
/* global JSClass, JSObject, JSReadOnlyProperty, JSPoint, UIPasteboard, UIDragOperation */
'use strict';

JSClass("UIDraggingSession", JSObject, {

    screenLocation: JSReadOnlyProperty('_screenLocation', null),
    pasteboard: JSReadOnlyProperty('_pasteboard', null),
    source: null,
    destination: null,
    allowedOperations: UIDragOperation.all,
    operation: UIDragOperation.none,
    isActive: true,

    initWithItems: function(items, event, view){
        this._screenLocation = JSPoint(event.window.convertPointToScreen(event.locationInWindow));
        this._pasteboard = UIPasteboard.init();
        this.source = view;
        var item;
        for (var i = 0, l = items.length; i < l; ++i){
            item = items[i];
            this._pasteboard.setValueForType(item.value, item.type);
        }
    },

    end: function(){
        if (this.source !== null){
            this.source.draggingSessionEnded(this, this.operation);
        }
        if (this.destination){
            if (this.operation === UIDragOperation.none){
                this.destination.draggingExited(this);
            }else{
                this.destination.performDragOperation(this, this.operation);
            }
        }
    },

    initWithPasteboard: function(pasteboard, screenLocation){
        this._screenLocation = JSPoint(screenLocation);
        this._pasteboard = pasteboard;
    },

    isValidDestination: function(destination){
        return this._pasteboard.containsAnyType(destination.registeredDraggedTypes);
    },

});