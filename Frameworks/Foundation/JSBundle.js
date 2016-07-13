// #import "Foundation/JSObject.js"
/* global JSClass, JSObject, JSBundle */
'use strict';

JSClass('JSBundle', JSObject, {

    identifier: null,
    resources: null,

    initWithIdentifier: function(identifier){
        this.identifier = identifier;
        if (!(this.identifier in JSBundle.bundles)){
            throw new Error("Bundle not found: %s".sprintf(this.identifier));
        }
        this.resources = JSBundle.bundles[this.identifier];
    },

    resourceNamed: function(resource){
        if (this.hasResource(resource)){
            return this.resources[resource];
        }
        throw new Error("JSBundle.resourceNamed: resource '%s' not found".sprintf(resource));
    },

    hasResource: function(resource){
        return resource in this.resources;
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