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
// #import "UIEvent.js"
'use strict';

(function(){

JSClass("UIPlatform", JSObject, {

    identifier: null,
    commandModifier: UIEvent.Modifier.command,

    initWithIdentifier: function(identifier){
        this.identifier = identifier;
        if (this.identifier in CommandModifiers){
            this.commandModifier = CommandModifiers[this.identifier];
        }
        this._cachedModifierStrings = {};
    },

    stringForKeyModifiers: function(modifiers){
        var str = "";
        modifiers = modifiers | this.commandModifier;
        if (!(modifiers in this._cachedModifierStrings)){
            var orderedModifiers = OrderedModifiers[this.identifier];
            for (var i = 0, l = orderedModifiers.length; i < l; ++i){
                if (modifiers & orderedModifiers[i]){
                    str += this._stringForModifierName(ModifierNames[orderedModifiers[i]]);
                }
            }
            this._cachedModifierStrings[modifiers] = str;
        }
        return this._cachedModifierStrings[modifiers];
    },

    _stringForModifierName: function(modifierName){
        var localizationKey = "platform.%s.menu.%s".sprintf(this.identifier, modifierName);
        return lazy.bundle.localizedString(localizationKey);
    },

    _cachedModifierStrings: null,

});

UIPlatform.Identifier = {
    win: 'win',
    mac: 'mac'
};

var CommandModifiers = {
    win: UIEvent.Modifier.control,
    mac: UIEvent.Modifier.command
};

var OrderedModifiers = {
    win: [UIEvent.Modifier.option, UIEvent.Modifier.shift, UIEvent.Modifier.command, UIEvent.Modifier.control],
    mac: [UIEvent.Modifier.option, UIEvent.Modifier.control, UIEvent.Modifier.shift, UIEvent.Modifier.command]
};

var ModifierNames = {};
ModifierNames[UIEvent.Modifier.option] = "option";
ModifierNames[UIEvent.Modifier.control] = "control";
ModifierNames[UIEvent.Modifier.command] = "command";
ModifierNames[UIEvent.Modifier.shift] = "shift";

var lazy = Object.create({}, {

    bundle: {
        configurable: true,
        get: function(){
            Object.defineProperty(this, 'bundle', {value: JSBundle.initWithIdentifier("io.breakside.JSKit.UIKit") });
            return this.bundle;
        }
    },

});

})();