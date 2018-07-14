// #import "Foundation/Foundation.js"
// #import "UIKit/UIEvent.js"
/* global JSClass, JSObject, UIPlatform, UIPlatformMac, UIPlatformWindows, UIEvent, JSBundle */
'use strict';

(function(){

JSClass("UIPlatform", JSObject, {

    identifier: null,
    commandModifier: UIEvent.Modifiers.command,

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
    win: UIEvent.Modifiers.control,
    mac: UIEvent.Modifiers.command
};

var OrderedModifiers = {
    win: [UIEvent.Modifiers.option, UIEvent.Modifiers.shift, UIEvent.Modifiers.command, UIEvent.Modifiers.control],
    mac: [UIEvent.Modifiers.option, UIEvent.Modifiers.control, UIEvent.Modifiers.shift, UIEvent.Modifiers.command]
};

var ModifierNames = {};
ModifierNames[UIEvent.Modifiers.option] = "option";
ModifierNames[UIEvent.Modifiers.control] = "control";
ModifierNames[UIEvent.Modifiers.command] = "command";
ModifierNames[UIEvent.Modifiers.shift] = "shift";

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