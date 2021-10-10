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

// #import "UIView.js"
// #import "UINavigationBarItem.js"
'use strict';

JSClass("UINavigationItem", JSObject, {

    title: JSDynamicProperty('_title', null),
    view: JSDynamicProperty('_view', null),
    backBarButtonItem: JSDynamicProperty('_backBarButtonItem', null),
    rightBarItems: JSDynamicProperty('_rightBarItems', null),
    leftBarItems: JSDynamicProperty('_leftBarItems', null),
    hidesBackButton: false,
    titleTextAlignment: null,

    init: function(args){
        this._rightBarItems = [];
        this._leftBarItems = [];
    },

    initWithSpec: function(spec){
        UINavigationItem.$super.initWithSpec.call(this, spec);
        if (spec.containsKey("title")){
            this._title = spec.valueForKey("title");
        }
        if (spec.containsKey("view")){
            this._view = spec.valueForKey("view", UIView);
        }
        if (spec.containsKey("backBarButtonItem")){
            this._backBarButtonItem = spec.valueForKey("backBarButtonItem", UINavigationItem);
        }
        if (spec.containsKey("hidesBackButton")){
            this.hidesBackButton = spec.valueForKey("hidesBackButton");
        }
        if (spec.containsKey("titleTextAlignment")){
            this.titleTextAlignment = spec.valueForKey("titleTextAlignment", JSTextAlignment);
        }
        this._rightBarItems = [];
        this._leftBarItems = [];
        var i, l;
        var rightItems = spec.valueForKey("rightBarItems");
        if (rightItems !== null){
            for (i = 0, l = rightItems.length; i < l; ++i){
                this._rightBarItems.push(rightItems.valueForKey(i, UINavigationBarItem));
            }
        }
        var leftItems = spec.valueForKey("leftBarItems");
        if (leftItems !== null){
            for (i = 0, l = leftItems.length; i < l; ++i){
                this._leftBarItems.push(leftItems.valueForKey(i, UINavigationBarItem));
            }
        }
    },

    _navigationBar: null,

    setTitle: function(title){
        this._title = title;
        this._notifyNavigationBar();
    },

    setView: function(view){
        this._view = view;
        this._notifyNavigationBar();
    },

    setBackBarButtonItem: function(backBarButtonItem){
        this._backBarButtonItem = backBarButtonItem;
        this._notifyNavigationBar();
    },

    setRightBarItems: function(items){
        this._rightBarItems = JSCopy(items);
        this._notifyNavigationBar();
    },

    setLeftBarItems: function(items){
        this._leftBarItems = JSCopy(items);
        this._notifyNavigationBar();
    },

    _notifyNavigationBar: function(){
        if (this._navigationBar){
            this._navigationBar.update();
        }
    }

});