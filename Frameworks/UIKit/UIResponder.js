// #import "Foundation/Foundation.js"
/* global JSClass, JSObject, JSReadOnlyProperty */
'use strict';

JSClass("UIResponder", JSObject, {

    canBecomeFirstResponder: function(){
        return false;
    },

    canResignFirstResponder: function(){
        return true;
    },

    becomeFirstResponder: function(){
        return false;
    },

    resignFirstResponder: function(){
        return true;
    },

    isFirstResponder: function(){
        return false;
    },

    getNextResponder: function(){
        return null;
    },

    mouseDown: function(event){
        var next = this.getNextResponder();
        if (next !== null){
            next.mouseDown(event);
        }
    },

    mouseUp: function(event){
        var next = this.getNextResponder();
        if (next !== null){
            next.mouseUp(event);
        }
    },

    mouseDragged: function(event){
        var next = this.getNextResponder();
        if (next !== null){
            next.mouseDragged(event);
        }
    },

    rightMouseDown: function(event){
        var next = this.getNextResponder();
        if (next !== null){
            next.rightMouseDown(event);
        }
    },

    rightMouseUp: function(event){
        var next = this.getNextResponder();
        if (next !== null){
            next.rightMouseUp(event);
        }
    },

    rightMouseDragged: function(event){
        var next = this.getNextResponder();
        if (next !== null){
            next.rightMouseDragged(event);
        }
    },

    keyDown: function(event){
        var next = this.getNextResponder();
        if (next !== null){
            next.keyDown(event);
        }
    },

    keyUp: function(event){
        var next = this.getNextResponder();
        if (next !== null){
            next.keyUp(event);
        }
    },

    canPerformAction: function(action, sender){
        return this[action] !== undefined;
    },

    targetForAction: function(action, sender){
        if (this.canPerformAction(action, sender)){
            return this;
        }
        var next = this.getNextResponder();
        if (next !== null){
            return next.targetForAction(action, sender);
        }
        return null;
    }

});