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
// #import "UIApplication.js"
// #import "UIMenuBar.js"
// #import "UIWindow.js"
'use strict';

JSClass("UIScene", JSObject, {

    menuBar: null,
    windowStack: JSReadOnlyProperty('_windowStack'),
    application: null,

    init: function(){
        this._commonInit();
    },

    initWithSpec: function(spec){
        UIScene.$super.initWithSpec.call(this, spec);
        this._commonInit();
        if (spec.containsKey('menuBar')){
            this.menuBar = spec.valueForKey("menuBar", UIMenuBar);
        }
        if (spec.containsKey('windowStack')){
            var window;
            var windowStack = spec.valueForKey('windowStack');
            for (var i = 0, l = windowStack.length; i < l; ++i){
                window = windowStack.valueForKey(i, UIWindow);
                this.addWindow(window);
            }
        }
    },

    addWindow: function(window){
        window._scene = this;
        this._windowStack.push(window);
    },

    _commonInit: function(){
        this.application = UIApplication.shared;
        this._windowStack = [];
    },

    show: function(){
        if (UIScene._visible !== null){
            UIScene._visible.close();
        }
        UIScene._visible = this;
        if (this.menuBar){
            this.application.windowServer.menuBar = this.menuBar;
        }
        var window = null;
        for (var i = 0, l = this._windowStack.length; i < l; ++i){
            window = this._windowStack[i];
            window.orderFront();
        }
        if (window !== null){
            window.makeKey();
        }
    },

    close: function(){
        var windowServer = this.application.windowServer;
        if (this.menuBar){
            windowServer.menuBar = null;
        }
        var window;
        for (var i = windowServer.windowStack.length - 1; i >= 0; --i){
            window = windowServer.windowStack[i];
            window.close();
        }
        UIScene._visible = null;
    },

});

UIScene._visible = null;

Object.defineProperty(UIScene, 'visible', {
    get: function UIScene_getVisible(){
        return UIScene._visible;
    }
});