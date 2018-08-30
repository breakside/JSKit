// #import "Foundation/JSObject.js"
/* global JSClass, JSObject, JSReadOnlyProperty, JSDynamicProperty */
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

    _registerItem: function(item){
        var stack;
        if (this._activeGroup === null){
            if (this._isUndoing){
                stack = this._redoStack;
            }else{
                if (!this._isRedoing){
                    this._redoStack = [];
                }
                stack = this._undoStack;
            }
            if (this._maximumNumberOfUndos > 0 && stack.length > this._maximumNumberOfUndos){
                stack.shift();
            }
        }else{
            stack = this._activeGroup.children;
        }
        stack.push(item);
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
        // set name on top of stack
    },

    titleForUndoMenuItem: JSReadOnlyProperty(),

    getTitleForUndoMenuItem: function(){
        var name = null;
        if (name !== null){
            return "Undo %s".sprintf(name);
        }
        return "Undo";
    },

    titleForRedoMenuItem: JSReadOnlyProperty(),

    getTitleForRedoMenuItem: function(){
        var name = null;
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

    invoke: function(manager){
        manager.beginUndoGrouping();
        var child;
        for (var i = this.children.length - 1; i >= 0; --i){
            child = this.children[i];
            child.invoke(manager);
        }
        manager.endUndoGrouping();
    }

};

})();