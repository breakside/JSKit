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

// #import "UITextInputManager.js"
// #import "UIEvent.js"
// #import "UIPlatform.js"
// #feature 'key' in KeyboardEvent.prototype
/* global UIHTMLTextInputManager */
// jshint browser: true
'use strict';

(function(){

JSClass("UIKeyBindings", JSObject, {

    initWithBindings: function(bindings){
        this.bindingsByKey = {};
        for (var i = 0, l = bindings.length; i < l; ++i){
            this.addBinding(bindings[i]);
        }
    },

    bindingsByKey: null,

    actionForEvent: function(event){
        var shortcuts = this.bindingsByKey[event.key];
        if (shortcuts === undefined){
            return null;
        }
        var shortcut;
        for (var i = 0, l = shortcuts.length; i < l; ++i){
            shortcut = shortcuts[i];
            if (event.modifiers === shortcut.modifiers){
                return shortcut.action;
            }
        }
        return  null;
    },

    addBinding: function(binding){
        if (!this.bindingsByKey[binding.key]){
            this.bindingsByKey[binding.key] = [];
        }
        this.bindingsByKey[binding.key].push(binding);
    }

});

})();