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

// #import "UIControl.js"
/* global UIMenuItem */
'use strict';

JSClass("UIToolbarItem", JSObject, {

    toolbar: null,
    identifier: 0,
    title: JSDynamicProperty('_title', null),
    accessibilityTitle: JSDynamicProperty('_accessibilityTitle', null),
    tooltip: JSDynamicProperty('_tooltip', null),
    image: JSDynamicProperty('_image', null),
    target: JSDynamicProperty('_target', null),
    action: JSDynamicProperty('_action', null),
    enabled: JSDynamicProperty('_enabled', true),
    view: JSDynamicProperty('_view', null),
    minimumSize: JSDynamicProperty('_minimumSize', null),
    maximumSize: JSDynamicProperty('_maximumSize', null),
    menuFormRepresentation: null,

    initWithIdentifier: function(identifier){
        this.identifier = identifier;
        this._commonItemInit();
    },

    initWithImage: function(image, action, target){
        this._image = image;
        this._target = target;
        this._action = action;
        this._commonItemInit();
    },

    initWithView: function(view, action, target){
        this._view = view;
        this._target = target || null;
        this._action = action || null;
        this._commonItemInit();
    },

    initWithSpec: function(spec){
        UIToolbarItem.$super.initWithSpec.call(this, spec);
        if (spec.containsKey('identifier')){
            this.identifier = spec.valueForKey("identifier", UIToolbarItem.Identifier);
        }
        if (spec.containsKey('title')){
            this._title = spec.valueForKey("title");
        }
        if (spec.containsKey('tooltip')){
            this._tooltip = spec.valueForKey("tooltip");
        }
        if (spec.containsKey('image')){
            this._image = spec.valueForKey("image", JSImage);
        }
        if (spec.containsKey('view')){
            this._view = spec.valueForKey("view", UIView);
        }
        if (spec.containsKey('enabled')){
            this._enabled = spec.valueForKey("enabled");
        }
        if (spec.containsKey('minimumSize')){
            this._minimumSize = spec.valueForKey("minimumSize", JSSize);
        }
        if (spec.containsKey('maximumSize')){
            this._maximumSize = spec.valueForKey("maximumSize", JSSize);
        }
        if (spec.containsKey('target')){
            this._target = spec.valueForKey("target");
        }
        if (spec.containsKey('action')){
            this._action = spec.valueForKey("action");
        }
        if (spec.containsKey('menuFormRepresentation')){
            this.menuFormRepresentation = spec.valueForKey("menuFormRepresentation", UIMenuItem);
        }
        this._commonItemInit();
    },

    _commonItemInit: function(){
        if (this._view !== null){
            if (this._minimumSize === null){
                var size = JSSize(this._view.intrinsicSize);
                if (size.width == UIView.noIntrinsicSize){
                    size.width = this._view.frame.size.width;
                }
                this._minimumSize = size;
            }
            if (this._maximumSize === null){
                this._maximumSize = JSSize(this._minimumSize);
            }
        }
        if (this._view && this._view.isKindOfClass(UIControl)){
            this._view.addAction("performAction", this);
        }
    },

    performAction: function(){
        if (this._action !== null){
            this.toolbar.window.application.sendAction(this._action, this._target, this);
        }
    },

    validate: function(){
        if (this.action === null || typeof(this.action) === 'function'){
            return;
        }
        var target = this.toolbar.window.application.firstTargetForAction(this.action, this.target, this);
        this.enabled = target !== null && target.canPerformAction(this.action);
    },

    setEnabled: function(enabled){
        this._enabled = enabled;
        if (this._view !== null && this._view.isKindOfClass(UIControl)){
            this._view.enabled = this.enabled;
        }
    }

});

UIToolbarItem.Identifier = {
    custom: 0,
    space: 1,
    flexibleSpace: 2
};