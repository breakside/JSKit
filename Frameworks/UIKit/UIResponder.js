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

JSClass("UIResponder", JSObject, {

    canBecomeFirstResponder: function(){
        return false;
    },

    canResignFirstResponder: function(){
        return true;
    },

    becomeFirstResponder: function(){
    },

    resignFirstResponder: function(){
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

    mouseEntered: function(event){
        var next = this.getNextResponder();
        if (next !== null){
            next.mouseEntered(event);
        }
    },

    mouseExited: function(event){
        var next = this.getNextResponder();
        if (next !== null){
            next.mouseExited(event);
        }
    },

    mouseMoved: function(event){
        var next = this.getNextResponder();
        if (next !== null){
            next.mouseMoved(event);
        }
    },

    touchesBegan: function(touches, event){
        var next = this.getNextResponder();
        if (next !== null){
            next.touchesBegan(touches, event);
        }
    },

    touchesEnded: function(touches, event){
        var next = this.getNextResponder();
        if (next !== null){
            next.touchesEnded(touches, event);
        }
    },

    touchesMoved: function(touches, event){
        var next = this.getNextResponder();
        if (next !== null){
            next.touchesMoved(touches, event);
        }
    },

    touchesCanceled: function(touches, event){
        var next = this.getNextResponder();
        if (next !== null){
            next.touchesCanceled(touches, event);
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
        if (UIResponder.$super.canPerformAction.call(this, action, sender)){
            var manager;
            if (action === 'undo'){
                manager = this.getUndoManager();
                return manager && manager.canUndo;
            }
            if (action === 'redo'){
                manager = this.getUndoManager();
                return manager && manager.canRedo;
            }
            return true;
        }
        return false;
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
    },

    scrollWheel: function(event){
        var next = this.getNextResponder();
        if (next !== null){
            next.scrollWheel(event);
        }
    },

    magnify: function(event){
        var next = this.getNextResponder();
        if (next !== null){
            next.magnify(event);
        }
    },

    rotate: function(event){
        var next = this.getNextResponder();
        if (next !== null){
            next.rotate(event);
        }
    },

    getUndoManager: function(){
        var next = this.getNextResponder();
        if (next !== null){
            return next.getUndoManager();
        }
        return null;
    },

    undo: function(){
        var manager = this.getUndoManager();
        if (manager !== null){
            manager.undo();
        }
    },

    redo: function(){
        var manager = this.getUndoManager();
        if (manager !== null){
            manager.redo();
        }
    },

});