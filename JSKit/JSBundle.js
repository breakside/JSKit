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

    contentsOfResource: function(resource){
        if (this.hasResource(resource)){
            return this.resources[resource];
        }
        throw Error("JSApplication.contentsOfResource: resource '%s' not found".sprintf(resource));
    },

    hasResource: function(resource){
        return resource in this.resources;
    }

});

JSBundle._mainBundle = null;

Object.defineProperty(JSBundle, 'mainBundle', {
  get: function(){
    if (!JSBundle._mainBundle){
      JSBundle._mainBundle = JSBundle.initWithIdentifier('__main__');
    }
    return JSBundle._mainBundle;
  }
});