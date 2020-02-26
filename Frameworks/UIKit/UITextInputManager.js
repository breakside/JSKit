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
'use strict';

JSClass('UITextInputManager', JSObject, {

    textInputClient: null,

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

    // insertText: function(text){
    // },

    // insertNewline: function(){
    // },

    // insertTab: function(){
    // },

    // insertBacktab: function(){
    // },

    // deleteBackward: function(){
    // },

    // deleteWordBackward: function(){
    // },

    // deleteToBeginningOfLine: function(){
    // },

    // deleteToBeginningOfDocument: function(){
    // },

    // deleteForward: function(){
    // },

    // deleteWordForward: function(){
    // },

    // deleteToEndOfLine: function(){
    // },

    // deleteToEndOfDocument: function(){
    // },

    // deleteAll: function(){
    // },

    // moveBackward: function(){
    // },

    // moveWordBackward: function(){
    // },

    // moveToBeginningOfLine: function(){
    //     if (!this.responder){
    //         return;
    //     }
    //     if (this.responder.moveToBeginningOfLine){
    //         this.responder.moveToBeginningOfLine();
    //         return;
    //     }
    // },

    // moveUp: function(){
    //     if (!this.responder){
    //         return;
    //     }
    //     if (this.responder.moveUp){
    //         this.responder.moveUp();
    //         return;
    //     }
    // },

    // moveToBeginningOfDocument: function(){
    //     if (!this.responder){
    //         return;
    //     }
    //     if (this.responder.moveToBeginningOfDocument){
    //         this.responder.moveToBeginningOfDocument();
    //         return;
    //     }
    // },

    // moveForward: function(){
    // },

    // moveWordForward: function(){
    // },

    // moveToEndOfLine: function(){
    // },

    // moveDown: function(){
    // },

    // moveToEndOfDocument: function(){
    // },

    // moveBackwardAndModifySelection: function(){
    // },

    // moveWordBackwardAndModifySelection: function(){
    // },

    // moveToBeginningOfLineAndModifySelection: function(){
    // },

    // moveUpAndModifySelection: function(){
    // },

    // moveToBeginningOfDocumentAndModifySelection: function(){
    // },

    // moveForwardAndModifySelection: function(){
    // },

    // moveWordForwardAndModifySelection: function(){
    // },

    // moveToEndOfLineAndModifySelection: function(){
    // },

    // moveDownAndModifySelection: function(){
    // },

    // moveToEndOfDocumentAndModifySelection: function(){
    // },

    // selectAll: function(){
    // },

});