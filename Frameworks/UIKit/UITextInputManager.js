// #import "Foundation/Foundation.js"
/* global JSClass, JSObject */
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