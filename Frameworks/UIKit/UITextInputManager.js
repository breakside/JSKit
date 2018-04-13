// #import "Foundation/Foundation.js"
/* global JSClass, JSObject */
'use strict';

JSClass('UITextInputManager', JSObject, {

    responder: null,
    responderWindow: null,

    windowDidChangeResponder: function(window){
        this.responder = window.firstResponder;
        this.responderWindow = window;
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