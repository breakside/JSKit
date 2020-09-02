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
// #import "UITouch.js"
'use strict';

JSClass('UIEvent', JSObject, {

    locationInWindow: JSReadOnlyProperty('_locationInWindow', null),
    timestamp: JSReadOnlyProperty('_timestamp', 0.0),
    window: JSReadOnlyProperty('_window', null),
    category: JSReadOnlyProperty('_category', -1),
    type: JSReadOnlyProperty('_type', -1),
    key: JSReadOnlyProperty('_key', -1),
    keyCode: JSReadOnlyProperty('_keyCode', -1),
    touches: JSReadOnlyProperty('_touches', null),
    trackingView: null,
    modifiers: JSReadOnlyProperty('_modifiers', 0),
    clickCount: JSReadOnlyProperty('_clickCount', 0),
    scrollingDelta: JSReadOnlyProperty('_scrollingDelta', null),
    phase: JSReadOnlyProperty('_phase', 0),
    magnification: JSReadOnlyProperty('_magnification', 1),
    rotation: JSReadOnlyProperty('_rotation', 0),

    initMouseEventWithType: function(type, timestamp, window, location, modifiers, clickCount){
        this._category = UIEvent.Category.mouse;
        this._type = type;
        this._timestamp = timestamp;
        this._window = window;
        this._locationInWindow = location;
        this._touches = [];
        this._modifiers = modifiers || UIEvent.Modifier.none;
        this._clickCount = clickCount;
    },

    initKeyEventWithType: function(type, timestamp, window, key, keyCode, modifiers){
        this._category = UIEvent.Category.key;
        this._type = type;
        this._timestamp = timestamp;
        this._window = window;
        this._key = key;
        this._keyCode = keyCode;
        this._touches = [];
        this._modifiers = modifiers || UIEvent.Modifier.none;
    },

    initTouchEventWithType: function(type, timestamp){
        this._category = UIEvent.Category.touches;
        this._type = type;
        this._timestamp = timestamp;
        this._touches = [];
    },

    initScrollEventWithType: function(type, timestamp, window, location, deltaX, deltaY, modifiers){
        this._category = UIEvent.Category.scroll;
        this._type = type;
        this._timestamp = timestamp;
        this._window = window;
        this._locationInWindow = location;
        this._scrollingDelta = JSPoint(deltaX, deltaY);
        this._touches = [];
        this._modifiers = modifiers || UIEvent.Modifier.none;
    },

    initGestureEventWithType: function(type, timestamp, window, location, phase, value, modifiers){
        this._category = UIEvent.Category.gesture;
        this._type = type;
        this._timestamp = timestamp;
        this._window = window;
        this._locationInWindow = location;
        this._phase = phase;
        switch (type){
            case UIEvent.Type.magnify:
                this._magnification = value;
                break;
            case UIEvent.Type.rotate:
                this._rotation = value;
                break;
        }
        this._touches = [];
        this._modifiers = modifiers || UIEvent.Modifier.none;
    },

    addTouch: function(touch){
        this._touches.push(touch);
    },

    removeTouch: function(touch){
        for (var i = this._touches.length - 1; i >= 0; --i){
            if (this._touches[i].identifier == touch.identifier){
                this._touches.splice(i, 1);
                break;
            }
        }
    },

    removeCompletedTouches: function(){
        for (var i = this._touches.length - 1; i >= 0; --i){
            if (this._touches[i].phase == UITouch.Phase.ended || this._touches[i].phase == UITouch.Phase.canceled){
                this._touches.splice(i, 1);
            }
        }
    },

    updateTouches: function(type, timestamp){
        this._timestamp = timestamp;
        this._type = type;
        for (var i = 0, l = this._touches.length; i < l; ++i){
            this._touches[i].changed = false;
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

    changedTouchesInWindow: function(window){
        var touches = this.touchesInWindow(window);
        for (var i = touches.length - 1; i >= 0; --i){
            if (!touches[i].changed){
                touches.splice(i, 1);
            }
        }
        return touches;
    },

    locationInView: function(view){
        return this.window.convertPointToView(this._locationInWindow, view);
    },

    hasModifier: function(modifier){
        return (this._modifiers & modifier) == modifier;
    }

});

UIEvent.minimumTimestamp = -Number.MAX_VALUE;

UIEvent.Category = {
    mouse: 0,
    key: 1,
    touches: 2,
    scroll: 3,
    gesture: 4
};

UIEvent.Type = {
    leftMouseDown: 0,
    leftMouseUp: 1,
    leftMouseDragged: 2,
    rightMouseDown: 3,
    rightMouseUp: 4,
    rightMouseDragged: 5,
    mouseMoved: 6,
    mouseEntered: 7,
    mouseExited: 8,
    keyDown: 9,
    keyUp: 10,
    touchesBegan: 11,
    touchesMoved: 12,
    touchesEnded: 13,
    touchesCanceled: 14,
    scrollWheel: 15,
    magnify: 16,
    rotate: 17
};

UIEvent.Phase = {
    none: 0,
    began: 1,
    changed: 2,
    ended: 3
};

UIEvent.Modifier = {
    none:    0,
    command: 1 << 0,
    control: 1 << 1,
    shift:   1 << 2,
    option:  1 << 3
};

UIEvent.Modifier.optionControl = UIEvent.Modifier.option | UIEvent.Modifier.control;
UIEvent.Modifier.optionShift = UIEvent.Modifier.option | UIEvent.Modifier.shift;
UIEvent.Modifier.optionControlShift = UIEvent.Modifier.option | UIEvent.Modifier.control | UIEvent.Modifier.shift;
UIEvent.Modifier.controlShift = UIEvent.Modifier.control | UIEvent.Modifier.shift;

UIEvent.doubleClickInterval = 0.2;

UIEvent.Key = {
    unidentified: "Unidentified",

    // Modifiers
    option: "Alt",
    control: "Control",
    command: "Meta",
    shift: "Shift",
    function: "Fn",

    // Editing
    enter: "Enter",
    tab: "Tab",
    backspace: "Backspace",
    delete: "Delete",

    // Arrows
    down: "ArrowDown",
    left: "ArrowLeft",
    right: "ArrowRight",
    up: "ArrowUp",

    // Actions
    escape: "Escape",

    // Undo & Redo
    redo: "Redo",
    undo: "Undo",

    // Navigation
    end: "End",
    home: "Home",
    pageDown: "PageDown",
    pageUp: "PageUp",

    // Locks
    capsLock: "CapsLock",
    functionLock: "FnLock",
    numberLock: "NumLock",
    scrollLock: "ScrollLock",
    symbol: "Symbol",
    symbolLock: "SymbolLock",

    // Misc
    clear: "Clear",
    copy: "Copy",
    cut: "Cut",
    eraseToEndOfField: "EraseEof",
    extendSelection: "ExSel",
    insert: "Insert",
    paste: "Paste",
    cursorSelect: "CrSel"
};