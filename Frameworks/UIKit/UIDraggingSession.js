// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #import Foundation
// #import "UIPasteboard.js"
// #import "UIDraggingSource.js"
// #import "UIDraggingDestination.js"
'use strict';

JSClass("UIDraggingSession", JSObject, {

    screenLocation: JSReadOnlyProperty('_screenLocation', null),
    pasteboard: JSReadOnlyProperty('_pasteboard', null),
    source: null,
    destination: null,
    allowedOperations: UIDragOperation.all,
    operation: UIDragOperation.none,
    isActive: JSDynamicProperty('_isActive', false),
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
                pasteboard.addStringForType(item.stringValue, item.type);
            }else if ('dataValue' in item){
                pasteboard.addDataForType(item.dataValue, item.type);
            }else if ('objectValue' in item){
                pasteboard.addObjectForType(item.objectValue, item.type);
            }else if ('file' in item){
                pasteboard.addFile(item.file);
            }
        }
    },

    setIsActive: function(isActive){
        this._isActive = isActive;
        if (this._isActive && this.source !== null && this.source.draggingSessionDidBecomeActive){
            this.source.draggingSessionDidBecomeActive(this);
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

    cancel: function(){
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
    },

    allowsOperation: function(operation){
        return (this.allowedOperations & operation) == operation;
    }

});