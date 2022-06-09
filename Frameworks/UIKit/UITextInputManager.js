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
// #import "UITextInput.js"
// #import "UIKeyBindings.js"
'use strict';

(function(){

var logger = JSLog("uikit", "text");

JSClass('UITextInputManager', JSObject, {

    initForPlatform: function(platform){
        if (platform === undefined){
            platform = UIPlatform.shared;
        }
        this.keyBindings = UIKeyBindings.initWithBindings(keyBindingsByPlatform[platform.identifier] || []);
    },

    textInputClient: null,
    keyBindings: null,

    windowDidChangeResponder: function(window){
        // If the first responder looks like it conforms to UITextInput, remember it.
        // This ensures that a mobile device will only show a keyboard for something that
        // takes text input, rather than any old responder that can respond to keyDown.
        var responder = null;
        if (window !== null){
            responder = window.firstResponder;
        }
        if (responder && responder.insertText && typeof(responder.insertText) == 'function'){
            this.textInputClient = responder;
        }else{
            this.textInputClient = null;
        }
    },

    sendActionsForEvent: function(event){
        if (this.textInputClient === null){
            return false;
        }
        if (event.type === UIEvent.Type.keyDown){
            var action = this.keyBindings.actionForEvent(event);
            if (action !== null){
                if (this.textInputClient[action]){
                    this.textInputClient[action]();
                    return true;
                }
                return false;
            }
            return false;
        }
        return false;
    },

});

var keyBindingsByPlatform = {};

keyBindingsByPlatform[UIPlatform.Identifier.mac] = [
    {action: "insertNewline",               key: UIEvent.Key.enter,     modifiers: UIEvent.Modifier.none},
    {action: "insertLineBreak",             key: UIEvent.Key.enter,     modifiers: UIEvent.Modifier.control},
    {action: "insertTab",                   key: UIEvent.Key.tab,       modifiers: UIEvent.Modifier.none},
    {action: "insertBacktab",               key: UIEvent.Key.tab,       modifiers: UIEvent.Modifier.shift},

    {action: "deleteBackward",              key: UIEvent.Key.backspace, modifiers: UIEvent.Modifier.none},
    {action: "deleteWordBackward",          key: UIEvent.Key.backspace, modifiers: UIEvent.Modifier.option},
    {action: "deleteWordBackward",          key: UIEvent.Key.backspace, modifiers: UIEvent.Modifier.option | UIEvent.Modifier.control},
    {action: "deleteToBeginningOfLine",     key: UIEvent.Key.backspace, modifiers: UIEvent.Modifier.command},
 // {action: "deleteToBeginningDocument",   key: UIEvent.Key.backspace, modifiers: UIEvent.Modifier.none},
    {action: "deleteForward",               key: UIEvent.Key.delete,    modifiers: UIEvent.Modifier.none},
    {action: "deleteWordForward",           key: UIEvent.Key.delete,    modifiers: UIEvent.Modifier.option},
    {action: "deleteToEndOfLine",           key: UIEvent.Key.delete,    modifiers: UIEvent.Modifier.command},
 // {action: "deleteToEndDocument",         key: UIEvent.Key.delete,    modifiers: UIEvent.Modifier.none},
 // {action: "deleteAll",                   key: UIEvent.Key.backspace, modifiers: UIEvent.Modifier.none},

    {action: "moveBackward",                key: UIEvent.Key.left,      modifiers: UIEvent.Modifier.none},
    {action: "moveWordBackward",            key: UIEvent.Key.left,      modifiers: UIEvent.Modifier.option},
    {action: "moveToBeginningOfLine",       key: UIEvent.Key.left,      modifiers: UIEvent.Modifier.command},
    {action: "moveUp",                      key: UIEvent.Key.up,        modifiers: UIEvent.Modifier.none},
    {action: "moveToBeginningOfDocument",   key: UIEvent.Key.up,        modifiers: UIEvent.Modifier.command},
    {action: "moveToBeginningOfDocument",   key: UIEvent.Key.home,      modifiers: UIEvent.Modifier.none},
    {action: "moveForward",                 key: UIEvent.Key.right,     modifiers: UIEvent.Modifier.none},
    {action: "moveWordForward",             key: UIEvent.Key.right,     modifiers: UIEvent.Modifier.option},
    {action: "moveToEndOfLine",             key: UIEvent.Key.right,     modifiers: UIEvent.Modifier.command},
    {action: "moveDown",                    key: UIEvent.Key.down,      modifiers: UIEvent.Modifier.none},
    {action: "moveToEndOfDocument",         key: UIEvent.Key.down,      modifiers: UIEvent.Modifier.command},
    {action: "moveToEndOfDocument",         key: UIEvent.Key.end,       modifiers: UIEvent.Modifier.none},

    {action: "moveBackwardAndModifySelection",              key: UIEvent.Key.left,      modifiers: UIEvent.Modifier.shift},
    {action: "moveWordBackwardAndModifySelection",          key: UIEvent.Key.left,      modifiers: UIEvent.Modifier.shift | UIEvent.Modifier.option},
    {action: "moveToBeginningOfLineAndModifySelection",     key: UIEvent.Key.left,      modifiers: UIEvent.Modifier.shift | UIEvent.Modifier.command},
    {action: "moveUpAndModifySelection",                    key: UIEvent.Key.up,        modifiers: UIEvent.Modifier.shift},
    {action: "moveToBeginningOfDocumentAndModifySelection", key: UIEvent.Key.up,        modifiers: UIEvent.Modifier.shift | UIEvent.Modifier.command},
    {action: "moveToBeginningOfDocumentAndModifySelection", key: UIEvent.Key.home,      modifiers: UIEvent.Modifier.shift},
    {action: "moveForwardAndModifySelection",               key: UIEvent.Key.right,     modifiers: UIEvent.Modifier.shift},
    {action: "moveWordForwardAndModifySelection",           key: UIEvent.Key.right,     modifiers: UIEvent.Modifier.shift | UIEvent.Modifier.option},
    {action: "moveToEndOfLineAndModifySelection",           key: UIEvent.Key.right,     modifiers: UIEvent.Modifier.shift | UIEvent.Modifier.command},
    {action: "moveDownAndModifySelection",                  key: UIEvent.Key.down,      modifiers: UIEvent.Modifier.shift},
    {action: "moveToEndOfDocumentAndModifySelection",       key: UIEvent.Key.down,      modifiers: UIEvent.Modifier.shift | UIEvent.Modifier.command},
    {action: "moveToEndOfDocumentAndModifySelection",       key: UIEvent.Key.end,       modifiers: UIEvent.Modifier.shift},

    {action: "selectAll",                                   key: "a",                   modifiers: UIEvent.Modifier.command},

    // Emacs-style bindings
    {action: "moveToBeginningOfLine",       key: "a", modifiers: UIEvent.Modifier.control},
    {action: "moveBackward",                key: "b", modifiers: UIEvent.Modifier.control},
    {action: "moveWordBackward",            key: "b", modifiers: UIEvent.Modifier.control | UIEvent.Modifier.option},
    {action: "deleteForward",               key: "d", modifiers: UIEvent.Modifier.control},
    {action: "moveToEndOfLine",             key: "e", modifiers: UIEvent.Modifier.control},
    {action: "moveForward",                 key: "f", modifiers: UIEvent.Modifier.control},
    {action: "moveWordForward",             key: "f", modifiers: UIEvent.Modifier.control | UIEvent.Modifier.option},
    {action: "deleteBackward",              key: "h", modifiers: UIEvent.Modifier.control},
    {action: "deleteToEndOfLine",           key: "k", modifiers: UIEvent.Modifier.control},
    {action: "moveDown",                    key: "n", modifiers: UIEvent.Modifier.control},
    {action: "moveUp",                      key: "p", modifiers: UIEvent.Modifier.control},
];

keyBindingsByPlatform[UIPlatform.Identifier.win] = [
    {action: "insertNewline",               key: UIEvent.Key.enter,     modifiers: UIEvent.Modifier.none},
    {action: "insertLineBreak",             key: UIEvent.Key.enter,     modifiers: UIEvent.Modifier.control},
    {action: "insertTab",                   key: UIEvent.Key.tab,       modifiers: UIEvent.Modifier.none},
    {action: "insertBacktab",               key: UIEvent.Key.tab,       modifiers: UIEvent.Modifier.shift},

    {action: "deleteBackward",              key: UIEvent.Key.backspace, modifiers: UIEvent.Modifier.none},
    {action: "deleteWordBackward",          key: UIEvent.Key.backspace, modifiers: UIEvent.Modifier.control},
 // {action: "deleteToBeginningOfLine",     key: UIEvent.Key.backspace, modifiers: UIEvent.Modifier.command},
 // {action: "deleteToBeginningDocument",   key: UIEvent.Key.backspace, modifiers: UIEvent.Modifier.none},
    {action: "deleteForward",               key: UIEvent.Key.delete,    modifiers: UIEvent.Modifier.none},
    {action: "deleteWordForward",           key: UIEvent.Key.delete,    modifiers: UIEvent.Modifier.control},
 // {action: "deleteToEndOfLine",           key: UIEvent.Key.delete,    modifiers: UIEvent.Modifier.command},
 // {action: "deleteToEndDocument",         key: UIEvent.Key.delete,    modifiers: UIEvent.Modifier.none},
 // {action: "deleteAll",                   key: UIEvent.Key.backspace, modifiers: UIEvent.Modifier.none},

    {action: "moveBackward",                key: UIEvent.Key.left,      modifiers: UIEvent.Modifier.none},
    {action: "moveWordBackward",            key: UIEvent.Key.left,      modifiers: UIEvent.Modifier.control},
    {action: "moveToBeginningOfLine",       key: UIEvent.Key.home,      modifiers: UIEvent.Modifier.none},
    {action: "moveUp",                      key: UIEvent.Key.up,        modifiers: UIEvent.Modifier.none},
    {action: "moveToBeginningOfDocument",   key: UIEvent.Key.home,      modifiers: UIEvent.Modifier.control},
    {action: "moveForward",                 key: UIEvent.Key.right,     modifiers: UIEvent.Modifier.none},
    {action: "moveWordForward",             key: UIEvent.Key.right,     modifiers: UIEvent.Modifier.control},
    {action: "moveToEndOfLine",             key: UIEvent.Key.end,       modifiers: UIEvent.Modifier.none},
    {action: "moveDown",                    key: UIEvent.Key.down,      modifiers: UIEvent.Modifier.none},
    {action: "moveToEndOfDocument",         key: UIEvent.Key.end,       modifiers: UIEvent.Modifier.control},

    {action: "moveBackwardAndModifySelection",              key: UIEvent.Key.left,      modifiers: UIEvent.Modifier.shift},
    {action: "moveWordBackwardAndModifySelection",          key: UIEvent.Key.left,      modifiers: UIEvent.Modifier.shift | UIEvent.Modifier.control},
    {action: "moveToBeginningOfLineAndModifySelection",     key: UIEvent.Key.home,      modifiers: UIEvent.Modifier.shift},
    {action: "moveUpAndModifySelection",                    key: UIEvent.Key.up,        modifiers: UIEvent.Modifier.shift},
    {action: "moveToBeginningOfDocumentAndModifySelection", key: UIEvent.Key.home,      modifiers: UIEvent.Modifier.shift | UIEvent.Modifier.control},
    {action: "moveForwardAndModifySelection",               key: UIEvent.Key.right,     modifiers: UIEvent.Modifier.shift},
    {action: "moveWordForwardAndModifySelection",           key: UIEvent.Key.right,     modifiers: UIEvent.Modifier.shift | UIEvent.Modifier.control},
    {action: "moveToEndOfLineAndModifySelection",           key: UIEvent.Key.end,       modifiers: UIEvent.Modifier.shift},
    {action: "moveDownAndModifySelection",                  key: UIEvent.Key.down,      modifiers: UIEvent.Modifier.shift},
    {action: "moveToEndOfDocumentAndModifySelection",       key: UIEvent.Key.end,       modifiers: UIEvent.Modifier.shift | UIEvent.Modifier.control},

    {action: "selectAll",                                   key: "a",                   modifiers: UIEvent.Modifier.control},
];

})();