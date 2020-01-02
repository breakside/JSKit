// #import "UIView.js"
/* global JSClass, JSObject, UIView, UIResponder, UIControl, JSReadOnlyProperty, JSDynamicProperty, JSRect, JSSize */
'use strict';

JSClass("UIControl", UIView, {

    // MARK: - Creating a Control

    init: function(){
        this.initWithFrame(JSRect(0, 0, 100, 100));
    },

    initWithStyler: function(styler){
        this._styler = styler;
        this.initWithFrame(JSRect(0, 0, 100, 100));
    },

    initWithFrame: function(frame){
        UIControl.$super.initWithFrame.call(this, frame);
        this.commonUIControlInit();
    },

    initWithSpec: function(spec, values){
        UIControl.$super.initWithSpec.call(this, spec, values);
        if ('styler' in values){
            this._styler = spec.resolvedEnum(values.styler, this.$class.Styler || {});
        }
        this.commonUIControlInit();
        var target;
        var action;
        var event;
        if (('target' in values) && ('action' in values)){
            target = spec.resolvedValue(values.target);
            action = spec.resolvedValue(values.action);
            if (!target.isKindOfClass(UIResponder)){
                throw new Error("Action target must be a UIResponder: %s.%s".sprintf(values.target, values.action));
            }
            this.addAction(action, target);
        }
        if ('actions' in values){
            var actionInfo;
            for (var i = 0, l = values.actions.length; i < l; ++i){
                actionInfo = values.actions[i];
                if (actionInfo.target){
                    target = spec.resolvedValue(actionInfo.target);   
                }else{
                    target = null;
                }
                action = spec.resolvedValue(actionInfo.action);
                event = spec.resolvedEnum(actionInfo.event, this.$class.Event);
                this.addAction(action, target, event);
            }
        }
    },

    commonUIControlInit: function(){
        this._actionsByEvent = {};
        this._state = UIControl.State.normal;
        this.stylerProperties = {};
    },

    // MARK: - Styler

    styler: JSReadOnlyProperty('_styler', null),
    stylerProperties:  null,

    layoutSubviews: function(){
        UIControl.$super.layoutSubviews.call(this);
        if (this._styler !== null){
            this._styler.layoutControl(this);
        }
    },

    drawLayerInContext: function(layer, context){
        if (this._styler !== null){
            this._styler.drawControlLayerInContext(this, layer, context);
        }
    },

    getIntrinsicSize: function(){
        if (this._styler !== null){
            return this._styler.intrinsicSizeOfControl(this);
        }
        return UIControl.$super.getIntrinsicSize.call(this);
    },

    sizeToFit: function(){
        this.sizeToFitSize(JSSize(Number.MAX_VALUE, Number.MAX_VALUE));
    },

    sizeToFitSize: function(size){
        if (this._styler !== null){
            this._styler.sizeControlToFitSize(this, size);
        }else{
            UIControl.$super.sizeToFitSize.call(this, size);
        }
    },

    // MARK: - Actions

    _actionsByEvent: null,

    addAction: function(action, target, controlEvents){
        if (target === undefined){
            target = null;
        }
        if (controlEvents === undefined){
            controlEvents = UIControl.Event.primaryAction;
        }
        var event = 0x1;
        while (controlEvents > 0){
            if (controlEvents & 0x1){
                var actions = this._actionsByEvent[event];
                if (!actions){
                    actions = [];
                    this._actionsByEvent[event] = actions;
                }
                actions.push({action: action, target: target});
            }
            controlEvents >>>= 1;
            event <<= 1;
        }
    },

    removeAction: function(action, target, controlEvents){
        if (target === undefined){
            target = null;
        }
        if (controlEvents === undefined){
            controlEvents = UIControl.Event.primaryAction;
        }
        var event = 0x1;
        while (controlEvents > 0){
            if (controlEvents & 0x1){
                var actions = this._actionsByEvent[event];
                if (actions){
                    for (var i = actions.length - 1; i >= 0; --i){
                        if (actions[i] === action && actions[i].target === target){
                            actions.splice(i, 1);
                        }
                    }
                }
            }
            controlEvents >>>= 1;
            event <<= 1;
        }
    },

    sendActionsForEvents: function(controlEvents, uiEvent){
        var event = 0x1;
        while (controlEvents > 0){
            if (controlEvents & 0x1){
                var actions = this._actionsByEvent[event];
                if (actions){
                    for (var i = 0; i < actions.length; ++i){
                        this.sendAction(actions[i].action, actions[i].target, uiEvent);
                    }
                }
            }
            controlEvents >>>= 1;
            event <<= 1;
        }
    },

    sendAction: function(action, target, uiEvent){
        if (typeof(action) === 'function'){
            action.call(target, this, uiEvent);
        }else{
            this.window.application.sendAction(action, target, this, uiEvent);
        }
    },

    // MARK: - State

    state: JSReadOnlyProperty('_state', null),
    enabled: JSDynamicProperty(null, null, 'isEnabled'),
    over: JSDynamicProperty(null, null, 'isOver'),
    active: JSDynamicProperty(null, null, 'isActive'),
    dropTarget: JSDynamicProperty(null, null, 'isDropTarget'),

    _updateState: function(newState){
        if (newState != this._state){
            var wasEnabled = this.isEnabled();
            this._state = newState;
            var isEnabled = this.isEnabled();
            if (this.hasOverState && wasEnabled != isEnabled){
                if (isEnabled){
                    this.startMouseTracking(UIView.MouseTracking.enterAndExit);
                }else{
                    this.stopMouseTracking();
                }
            }
            this.update();
        }
    },

    update: function(){
        if (this._styler !== null){
            this._styler.updateControl(this);
        }
    },

    toggleStates: function(flag, on){
        var newState = this._state;
        if (on){
            newState |= flag;
        }else{
            newState &= ~flag;
        }
        this._updateState(newState);
    },

    isEnabled: function(){
        return (this._state & UIControl.State.disabled) === 0;
    },

    setEnabled: function(isEnabled){  
        this.toggleStates(UIControl.State.disabled, !isEnabled);
        if (!isEnabled && this.window && this.window.firstResponder === this){
            this.window.firstResponder = null;
        }
    },

    isOver: function(){
        return (this._state & UIControl.State.over) === UIControl.State.over;
    },

    setOver: function(isOver){
        this.toggleStates(UIControl.State.over, isOver);
    },

    isActive: function(){
        return (this._state & UIControl.State.active) === UIControl.State.active;
    },

    setActive: function(isActive){
        this.toggleStates(UIControl.State.active, isActive);
    },

    isDropTarget: function(){
        return (this._state & UIControl.State.dropTarget) === UIControl.State.dropTarget;
    },

    setDropTarget: function(isDropTarget){
        this.toggleStates(UIControl.State.dropTarget, isDropTarget);
    },

    // MARK: - Mouse Tracking

    hasOverState: false,
    _hasSetInitialTracking: false,

    mouseEntered: function(event){
        if (!this.enabled){
            return;
        }
        this.over = true;
    },

    mouseExited: function(event){
        this.over = false;
    },

    rightMouseDown: function(){
        // Do nothing by default, so the event doesn't propagate to the next
        // responder.  Subclasses can override as needed
    },

    setWindow: function(window){
        if (!this._hasSetInitialTracking){
            if (this.hasOverState && this.enabled){
                this.startMouseTracking(UIView.MouseTracking.enterAndExit);
            }
            this._hasSetInitialTracking = true;
        }
        UIControl.$super.setWindow.call(this, window);
    }

});

JSClass("UIControlStyler", JSObject, {

    showsOverState: false,

    initializeControl: function(control){
    },

    updateControl: function(control){
    },

    layoutControl: function(control){
    },

    intrinsicSizeOfControl: function(control){
        return JSSize(UIView.noIntrinsicSize, UIView.noIntrinsicSize);
    },

    sizeControlToFitSize: function(control, size){
        control.layer.sizeToFitSize(size);
    },

    drawControlLayerInContext: function(control, layer, context){
    }

});

UIControl.State = {
    normal:     0,
    over:       1 << 0,
    active:     1 << 1,
    disabled:   1 << 2,
    dropTarget: 1 << 3,
    firstUserState: 1 << 16
};

UIControl.Event = {
    primaryAction:      1 << 0,
    valueChanged:       1 << 1,
    editingDidBegin:    1 << 2,
    editingChanged:     1 << 3,
    editingDidEnd:      1 << 4,
    firstUserEvent:     1 << 16
};