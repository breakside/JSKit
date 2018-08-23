// #import "Foundation/Foundation.js"
// #import "UIKit/UIPasteboard.js"
// #import "UIKit/UIDraggingSource.js"
// #import "UIKit/UIDraggingDestination.js"
/* global JSClass, JSObject, JSReadOnlyProperty, JSDynamicProperty, JSPoint, UIPasteboard, UIDragOperation */
'use strict';

JSClass("UIDraggingSession", JSObject, {

    screenLocation: JSReadOnlyProperty('_screenLocation', null),
    pasteboard: JSReadOnlyProperty('_pasteboard', null),
    source: null,
    destination: null,
    allowedOperations: UIDragOperation.all,
    operation: UIDragOperation.none,
    isActive: true,
    image: null,
    imageOffset: JSPoint.Zero,
    _items: null,

    initWithItems: function(items, event, view){
        this._items = items;
        this._screenLocation = JSPoint(event.window.convertPointToScreen(event.locationInWindow));
        this._pasteboard = UIPasteboard.init();
        this.source = view;
        this.writeItemsToPasteboard(this._pasteboard);
    },

    initWithPasteboard: function(pasteboard, screenLocation){
        this._items = [];
        this._screenLocation = JSPoint(screenLocation);
        this._pasteboard = pasteboard;
    },

    writeItemsToPasteboard: function(pasteboard){
        var item;
        for (var i = 0, l = this._items.length; i < l; ++i){
            item = this._items[i];
            if ('stringValue' in item){
                pasteboard.setStringForType(item.stringValue, item.type);
            }else if ('dataValue' in item){
                pasteboard.setDataForType(item.dataValue, item.type);
            }else if ('objectValue' in item){
                pasteboard.setObjectForType(item.objectValue, item.type);
            }else if ('file' in item){
                pasteboard.addFile(item.file);
            }
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

    isValidDestination: function(destination){
        var registeredTypes = destination.registeredDraggedTypes;
        return registeredTypes !== null && registeredTypes.length > 0 && this._pasteboard.containsAnyType(registeredTypes);
    },

    setImage: function(image, offset){
        this.image = image;
        this.imageOffset = JSPoint(offset);
    },

    centerImageScreenLocation: JSReadOnlyProperty(),

    getCenterImageScreenLocation: function(){
        var location = JSPoint(this.screenLocation);
        if (this.image !== null){
            location.x = location.x - this.imageOffset.x + this.image.size.width / 2;
            location.y = location.y - this.imageOffset.y + this.image.size.height / 2;
        }
        return location;
    }

});