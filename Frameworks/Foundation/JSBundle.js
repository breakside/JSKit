// #import "Foundation/JSObject.js"
/* global JSClass, JSObject, JSBundle */
'use strict';

JSClass('JSBundle', JSObject, {

    _dict: null,

    initWithIdentifier: function(identifier){
        this.identifier = identifier;
        var dict = JSBundle.bundles[this.identifier];
        if (dict === undefined){
            throw new Error("Bundle not found: %s".sprintf(this.identifier));
        }
        this.initWithDictionary(dict);
    },

    initWithDictionary: function(dict){
        this._dict = dict;
    },

    metadataForResourceName: function(name, ext, subdirectory){
        var lookupKey = name;
        if (ext !== undefined && ext !== null){
            lookupKey += '.' + ext;
        }
        if (subdirectory !== undefined && subdirectory !== null){
            lookupKey = subdirectory + '/' + lookupKey;
        }
        var lookup = this._dict.ResourceLookup.global;
        var hits = lookup[lookupKey];
        if (hits !== undefined){
            return this._dict.Resources[hits[0]];
        }
        var devlang = this._dict.Info[JSBundle.InfoKeys.developmentLanguage];
        var langs = [];
        // TODO: add user-preferred languages
        if (devlang !== undefined){
            langs.push(devlang);
        }
        for (var i = 0, l = langs.length; i < l; ++i){
            lookup = this._dict.ResourceLookup[langs[i]];
            if (lookup){
                hits = lookup[lookupKey];
                if (hits !== undefined){
                    return this._dict.Resources[hits[0]];
                }
            }
        }
        return null;
    },

    getResourceData: function(metadata){
    },

    info: function(){
        return this._dict.Info;
    },

    fonts: function(){
        var fonts = [];
        for (var i = 0, l = this._dict.Fonts.length; i < l; ++i){
            fonts.push(this._dict.Resources[this._dict.Fonts[i]]);
        }
        return fonts();
    }

});

JSBundle.InfoKeys = {
    developmentLanguage: 'JSDevelopmentLanguage'
};

JSBundle.bundles = {};
JSBundle.mainBundleIdentifier = null;

JSBundle.Type = {
    object: 'object',
    image: 'image',
    font: 'font'
};

Object.defineProperty(JSBundle, 'mainBundle', {
    configurable: true,
    enumerable: false,
    get: function JSBundle_getMainBundle(){
        var bundle = JSBundle.initWithIdentifier(JSBundle.mainBundleIdentifier);
        Object.defineProperty(JSBundle, 'mainBundle', {
            configurable: false,
            enumerable: false,
            value: bundle
        });
        return bundle;
    }
});