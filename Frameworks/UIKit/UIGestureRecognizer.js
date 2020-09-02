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
// #import "UIResponder.js"
'use strict';

JSClass("UIGestureRecognizer", JSObject, {

    init: function(){
        this.actions = [];
    },

    initWithAction: function(action, target){
        this.init();
        this.addAction(action, target);
    },

    initWithSpec: function(spec){
        UIGestureRecognizer.$super.initWithSpec.call(this, spec);
        var target, action;
        if (spec.containsKey("action")){
            target = spec.valueForKey("target") || null;
            action = spec.valueForKey("action");
            if (!target.isKindOfClass(UIResponder)){
                throw new Error("Action target must be a UIResponder: %s.%s".sprintf(spec.unmodifiedValueForKey("target"), spec.unmodifiedValueForKey("action")));
            }
            this.addAction(action, target);
        }
        if (spec.containsKey("actions")){
            var actionInfo;
            var actions = spec.valueForKey("actions");
            for (var i = 0, l = actions.length; i < l; ++i){
                actionInfo = actions.valueForKey(i);
                if (actionInfo.containsKey("target")){
                    target = actionInfo.valueForKey("target");
                }else{
                    target = null;
                }
                action = actionInfo.valueForKey("action");
                this.addAction(action, target);
            }
        }
    },

    view: null,
    enabled: true,
    state: JSReadOnlyProperty('_state', 0),

    _setState: function(state, event){
        if (state !== this._state || state === UIGestureRecognizer.State.changed){
            this._state = state;
            switch (this._state){
                case UIGestureRecognizer.State.began:
                    this.sendActions(event);
                    break;
                case UIGestureRecognizer.State.changed:
                    this.sendActions(event);
                    break;
                case UIGestureRecognizer.State.ended:
                    this.sendActions(event);
                    this._state = UIGestureRecognizer.State.possible;
                    break;
                case UIGestureRecognizer.State.canceled:
                    this.sendActions(event);
                    this._state = UIGestureRecognizer.State.possible;
                    break;
                case UIGestureRecognizer.State.failed:
                    this._state = UIGestureRecognizer.State.possible;
                    break;
                case UIGestureRecognizer.State.recognized:
                    this.sendActions(event);
                    this._state = UIGestureRecognizer.State.possible;
                    break;
            }
        }
    },

    // MARK: - Actions

    actions: null,

    addAction: function(action, target){
        var index = this.indexOfAction(action, target);
        if (index < 0){
            this.actions.push({action: action, target: target});
        }
    },

    removeAction: function(action, target){
        var index = this.indexOfAction(action, target);
        if (action >= 0){
            this.actions.splice(index, 1);
        }
    },

    indexOfAction: function(action, target){
        for (var i = 0, l = this.actions.length; i < l; ++i){
            if (this.actions[i].action === action && this.actions[i].target === target){
                return i;
            }
        }
        return -1;
    },

    sendActions: function(event){
        var actionInfo;
        for (var i = 0, l = this.actions.length; i < l; ++i){
            actionInfo = this.actions[i];
            this.sendAction(actionInfo.action, actionInfo.target, event);
        }
    },

    sendAction: function(action, target, event){
        this.view.window.application.sendAction(action, target, this, event);
    },

    // MARK: - Events

    touchesBegan: function(touches, event){
    },

    touchesEnded: function(touches, event){
    },

    touchesMoved: function(touches, event){
    },

    touchesCanceled: function(touches, event){
    }

});

UIGestureRecognizer.State = {
    possible: 0,
    began: 1,
    changed: 2,
    canceled: 3,
    failed: 4,
    recognized: 5
};