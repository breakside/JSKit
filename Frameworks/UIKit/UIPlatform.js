// #import Foundation
// #import "UIKit/UIEvent.js"
/* global JSClass, JSObject, UIPlatform, UIPlatformMac, UIPlatformWindows, UIEvent, JSBundle */
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