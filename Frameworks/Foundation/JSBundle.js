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

    info: function(){
        return this._dict.Info;
    },

    resourceNamed: function(name, kind){
        var resources = this.resourcesNamed(name);
        for (var i = 0; i < resources.length; ++i){
            if (resources[i].kind == kind){
                return resources[i];
            }
        }
        return null;
    },

    resourcesNamed: function(name){
        if (this.hasResource(name)){
            return this._dict.Resources[name];
        }
        throw new Error("JSBundle.resourcesNamed: resource '%s' not found".sprintf(name));
    },

    hasResource: function(name){
        return name in this._dict.Resources;
    }

});

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