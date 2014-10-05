// #import "JSKit/JSObject.js"

JSClass('JSBundle', JSObject, {

    identifier: null,
    resources: null,

    initWithIdentifier: function(identifier){
        this.identifier = identifier;
        if (!(this.identifier in _JSBundles)){
            throw Error("Bundle not found: %s".sprintf(this.identifier));
        }
        this.resources = _JSBundles[this.identifier];
    },

    resourceNamed: function(resource){
        if (this.hasResource(resource)){
            return this.resources[resource];
        }
        throw Error("JSApplication.resourceNamed: resource '%s' not found".sprintf(resource));
    },

    hasResource: function(resource){
        return resource in this.resources;
    }

});

JSBundle.bundles = {};
JSBundle.mainBundle = null;