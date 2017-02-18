// #import "Foundation/JSObject.js"
/* global JSClass, JSObject, JSBundle */
'use strict';

JSClass('JSBundle', JSObject, {

    identifier: null,
    resources: null,
    fonts: null,

    initWithIdentifier: function(identifier){
        this.identifier = identifier;
        if (!(this.identifier in JSBundle.bundles)){
            throw new Error("Bundle not found: %s".sprintf(this.identifier));
        }
        this.resources = JSBundle.bundles[this.identifier].Resources;
        this.fonts = JSBundle.bundles[this.identifier].Fonts;
    },

    info: function(){
        return JSBundle.bundles[this.identifier].Info;
    },

    resourceNamed: function(name, kind){
        var resources = this.resourcesNamed(name);
        for (var i = 0; i < resources.length; ++i){
            if (resources[i].kind == kind){
                return resources[i];
            }
        }
    },

    resourcesNamed: function(name){
        if (this.hasResource(name)){
            return this.resources[name];
        }
        throw new Error("JSBundle.resourcesNamed: resource '%s' not found".sprintf(name));
    },

    hasResource: function(name){
        return name in this.resources;
    }

});

JSBundle.bundles = {};
JSBundle.mainBundleIdentifier = null;

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