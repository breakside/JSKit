// #import "JSObject.js"
// #import "JSCalendar.js"
/* global JSClass, JSObject, JSReadOnlyProperty, JSLocale, JSCalendar */
'use strict';

JSClass("JSLocale", JSObject, {

    identifier: JSReadOnlyProperty('_identifier', null),
    identifierWithoutExtensions: JSReadOnlyProperty('_identifierWithoutExtension', null),
    languageCode: JSReadOnlyProperty('_languageCode', null),
    regionCode: JSReadOnlyProperty('_regionCode', null),
    scriptCode: JSReadOnlyProperty('_scriptCode', null),
    extensions: JSReadOnlyProperty('_extensions', null),
    decimalSeparator: JSReadOnlyProperty('_decimalSeparator', '.'),
    groupingSeparator: JSReadOnlyProperty('_decimalSeparator', ','),
    calendarIdentifier: JSReadOnlyProperty('_calendarIdentifier', JSCalendar.Identifier.gregorian),

    initWithIdentifier: function(identifier){
        if (identifier === null){
            return null;
        }
        if (identifier in JSLocale._localesByIdentifier){
            return JSLocale._localesByIdentifier[identifier];
        }
        identifier = identifier.replace(/_/g, '-');
        var parts = identifier.split('-');
        this._languageCode = parts[0].toLowerCase();
        this._extensions = [];

        var part = parts.shift();
        if (part.length != 2){
            return null;
        }
        this._languageCode = part.toLowerCase();

        var allowed = {
            script: true,
            region: true,
            extensions: true
        };

        while (parts.length > 0){
            part = parts.shift();
            if (part.length == 1 && allowed.extensions){
                if (part == 'u'){
                    this._extensions = parts;
                    parts = [];
                }else{
                    return null;
                }
                allowed.extensions = false;
                allowed.region = false;
                allowed.script = false;
            }else if (part.length == 2 && allowed.region){
                this._regionCode = part.toUpperCase();
                allowed.script = false;
                allowed.region = false;
            }else if (part.length == 4 && allowed.script){
                this._scriptCode = part.toLowerCase().capitalizedString();
                allowed.script = false;
            }else{
                return null;
            }
        }

        this._identifierWithoutExtension = this._languageCode;
        if (this.scriptCode !== null){
            this._identifierWithoutExtension += '-' + this.scriptCode;
        }
        if (this.regionCode !== null){
            this._identifierWithoutExtension += '-' + this.regionCode;
        }
        this._identifier = this._identifierWithoutExtension;
        if (this._extensions.length > 0){
            this._identifier += '-u-' + this._extensions.join('-');
        }
        if (this._identifier in JSLocale._localesByIdentifier){
            return JSLocale._localesByIdentifier[this._identifier];
        }
        JSLocale._localesByIdentifier[this._identifier] = this;
    },

    isLessSpecificThan: function(other){
        if (other.regionCode !== null && this.regionCode === null){
            return true;
        }
        if (other.scriptCode !== null && this.scriptCode === null){
            return true;
        }
        return false;
    }

});

JSLocale._localesByIdentifier = {};

JSLocale.ClearCache = function(){
    JSLocale._localesByIdentifier = {};
};

JSLocale._preferredLanguages = [];

Object.defineProperties(JSLocale, {

    preferredLanguages: {
        get: function JSLocale_getPreferredLanguages(){
            return JSLocale._preferredLanguages;
        },
        set: function JSLocale_setPreferredLanguages(preferredLanguages){
            JSLocale._preferredLanguages = preferredLanguages;
        }
    },

    current: {
        configurable: true,
        get: function JSLocale_getCurrent(){
            var locale = JSLocale.initWithIdentifier(JSLocale._preferredLanguages[0]);
            Object.defineProperty(JSLocale, 'current', locale);
            return locale;
        }
    }

});