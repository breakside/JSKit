// #import "UIKit/UIView.js"
/* global JSClass, UIView, UIControl */
'use strict';

JSClass("UIControl", UIView, {

    _actionsByEvent: null,

    init: function(){
        UIControl.$super.init.call(this);
        this.commonUIControlInit();
    },

    initWithFrame: function(frame){
        UIControl.$super.initWithFrame.call(this, frame);
        this.commonUIControlInit();
    },

    initWithSpec: function(spec){
        UIControl.$super.initWithSpec.call(this, spec);
        this.commonUIControlInit();
    },

    initWithConstraintBox: function(box){
        UIControl.$super.initWithConstraintBox.call(this, box);
        this.commonUIControlInit();
    },

    commonUIControlInit: function(){
        this._actionsByEvent = {};
    },

    addTargetedAction: function(target, action){
        this.addTargetedActionForEvent(target, action, UIControl.Event.PrimaryAction);
    },

    addAction: function(action){
        this.addActionForEvent(action, UIControl.Event.PrimaryAction);
    },

    addTargetedActionForEvent: function(target, action, controlEvent){
        return this.addActionForEvent(action.bind(target), controlEvent);
    },

    addActionForEvent: function(action, controlEvent){
        var actions = this._actionsByEvent[controlEvent];
        if (!actions){
            actions = [];
            this._actionsByEvent[controlEvent] = actions;
        }
        actions.push(action);
        return action;
    },

    removeActionForEvent: function(action, controlEvent){
        var actions = this._actionsByEvent[controlEvent];
        if (actions){
            for (var i = actions.length - 1; i >= 0; --i){
                if (actions[i] === action){
                    actions.splice(i, 1);
                }
            }
        }
    },

    sendActionsForEvent: function(controlEvent){
        var actions = this._actionsByEvent[controlEvent];
        if (actions){
            for (var i = 0; i < actions.length; ++i){
                actions[i](this);
            }
        }
    }

});

UIControl.Event = {
    PrimaryAction: 0,
    ValueChanged: 1,
    EditingDidBegin: 2,
    EditingChanged: 3,
    EditingDidEnd: 4
};