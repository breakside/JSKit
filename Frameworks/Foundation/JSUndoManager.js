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

// #import "JSObject.js"
'use strict';

(function(){

JSClass("JSUndoManager", JSObject, {

    // --------------------------------------------------------------------
    // MARK: - Creating an Undo Manager

    init: function(){
        this._undoStack = [];
        this._redoStack = [];
        this._groupStack = [];
    },

    // --------------------------------------------------------------------
    // MARK: - Checking Undo Status

    canUndo: JSReadOnlyProperty(),
    canRedo: JSReadOnlyProperty(),

    getCanUndo: function(){
        return this._undoStack.length > 0;
    },

    getCanRedo: function(){
        return this._redoStack.length > 0;
    },

    _isUndoing: false,
    _isRedoing: false,

    // --------------------------------------------------------------------
    // MARK: - Registering Undo Actions

    registerUndo: function(target, action){
        var registration = new JSUndoRegistration(target, action, Array.prototype.slice.call(arguments, 2));
        this._registerItem(registration);
    },

    _activeGroup: null,
    _groupStack: null,

    beginUndoGrouping: function(){
        var group = new JSUndoGroup();
        this._registerItem(group);
        if (this._activeGroup !== null){
            this._groupStack.push(this._activeGroup);
        }
        this._activeGroup = group;
    },

    endUndoGrouping: function(){
        if (this._activeGroup === null){
            throw new Error("Calling endUndoGrouping without a balanced beginUndoGrouping");
        }
        if (this._groupStack.length > 0){
            this._activeGroup = this._groupStack.pop();
        }else{
            this._activeGroup = null;
        }
    },

    clear: function(){
        this._undoStack = [];
        this._redoStack = [];
        this._groupStack = [];
        this._activeGroup = null;
    },

    _registerItem: function(item){
        if (!this._isUndoing && !this._isRedoing){
            this._redoStack = [];
        }
        var stack = this._getCurrentStack();
        stack.push(item);
        if (this._maximumNumberOfUndos > 0 && stack.length > this._maximumNumberOfUndos){
            stack.shift();
        }
    },

    _getCurrentStack: function(){
        if (this._activeGroup !== null){
            return this._activeGroup.children;
        }
        if (this._isUndoing){
            return this._redoStack;
        }
        return this._undoStack;
    },

    maximumNumberOfUndos: JSDynamicProperty('_maximumNumberOfUndos', 0),

    setMaximumNumberOfUndos: function(maximumNumberOfUndos){
        this._maximumNumberOfUndos = maximumNumberOfUndos;
        if (this._maximumNumberOfUndos > 0 && this._undoStack.length > this._maximumNumberOfUndos){
            this._undoStack.splice(0, this._undoStack.length - this._maximumNumberOfUndos);
        }
    },

    _undoStack: null,
    _redoStack: null,

    // --------------------------------------------------------------------
    // MARK: - Performing Undo and Redo

    undo: function(){
        if (this._activeGroup !== null){
            throw new Error("Calling undo without closing all groups");
        }
        if (this._undoStack.length === 0){
            return;
        }
        try{
            this._isUndoing = true;
            this._invokeTopItemOnStack(this._undoStack);
        }finally{
            this._isUndoing = false;
        }
    },

    redo: function(){
        if (this._redoStack.length === 0){
            return;
        }
        try{
            this._isRedoing = true;
            this._invokeTopItemOnStack(this._redoStack);
        }finally{
            this._isRedoing = false;
        }
    },

    _invokeTopItemOnStack: function(stack){
        var item = stack.pop();
        item.invoke(this);
    },

    // --------------------------------------------------------------------
    // MARK: - Managing the Undo and Redo Menu Items

    setActionName: function(actionName){
        var stack = this._getCurrentStack();
        if (stack.length > 0){
            stack[stack.length - 1].actionName = actionName;
        }
    },

    undoActionName: JSReadOnlyProperty(),
    redoActionName: JSReadOnlyProperty(),
    titleForUndoMenuItem: JSReadOnlyProperty(),
    titleForRedoMenuItem: JSReadOnlyProperty(),

    getUndoActionName: function(){
        return this._getActionNameFromStack(this._undoStack);
    },

    getRedoActionName: function(){
        return this._getActionNameFromStack(this._redoStack);
    },

    _getActionNameFromStack: function(stack){
        if (stack.length > 0){
            return stack[stack.length - 1].actionName;
        }
        return null;
    },

    getTitleForUndoMenuItem: function(){
        var name = this.undoActionName;
        if (name !== null){
            return "Undo %s".sprintf(name);
        }
        return "Undo";
    },

    getTitleForRedoMenuItem: function(){
        var name = this.redoActionName;
        if (name !== null){
            return "Redo %s".sprintf(name);
        }
        return "Redo";
    }

});

var JSUndoRegistration = function(target, action, args){
    if (this === undefined){
        return new JSUndoRegistration(target, action, args);
    }
    this.target = target;
    this.action = action;
    this.args = args;
};

JSUndoRegistration.prototype = {

    actionName: null,

    invoke: function(manager){
        this.action.apply(this.target, this.args);
    }
};

var JSUndoGroup = function(){
    if (this === undefined){
        return new JSUndoGroup();
    }
    this.children = [];
};

JSUndoGroup.prototype = {

    actionName: null,

    invoke: function(manager){
        manager.beginUndoGrouping();
        var child;
        for (var i = this.children.length - 1; i >= 0; --i){
            child = this.children[i];
            child.invoke(manager);
        }
        manager.endUndoGrouping();
        manager.setActionName(this.actionName);
    }

};

})();