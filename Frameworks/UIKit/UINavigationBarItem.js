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

// #import "UIButton.js"
// #import "UIImageView.js"
// #import "UILabel.js"
/* global UIApplication */
'use strict';

JSClass("UINavigationBarItem", JSObject, {

    title: JSDynamicProperty('_title', null),
    accessibilityTitle: JSDynamicProperty('_accessibilityTitle', null),
    image: JSDynamicProperty('_image', null),
    target: JSDynamicProperty('_target', null),
    action: JSDynamicProperty('_action', null),
    enabled: JSDynamicProperty('_enabled', true),
    view: JSDynamicProperty('_view', null),

    initWithImage: function(image, action, target){
        this._image = image;
        this._target = target;
        this._action = action;
        this._commonItemInit();
    },

    initWithView: function(view){
        this._view = view;
        this._commonItemInit();
    },

    initWithSpec: function(spec){
        UINavigationBarItem.$super.initWithSpec.call(this, spec);
        if (spec.containsKey('title')){
            this._title = spec.valueForKey("title");
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
        if (spec.containsKey('target')){
            this._target = spec.valueForKey("target");
        }
        if (spec.containsKey('action')){
            this._action = spec.valueForKey("action");
        }
        this._commonItemInit();
    },

    _commonItemInit: function(){
        if (this._view && this._view.isKindOfClass(UIControl)){
            this._view.addAction("performAction", this);
        }
    },

    performAction: function(){
        if (this._action !== null){
            UIApplication.shared.sendAction(this._action, this._target, this);
        }
    },

    setEnabled: function(enabled){
        this._enabled = enabled;
        if (this._view !== null && this._view.isKindOfClass(UIControl)){
            this._view.enabled = this.enabled;
        }
    }

});