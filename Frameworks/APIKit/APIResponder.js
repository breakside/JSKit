// #import Foundation
"use strict";

JSClass("APIResponder", JSObject, {

    initWithRequest: function(request, response, pathParameters, secrets){
        this.request = request;
        this.response = response;
        this.secrets = secrets;
        for (let name in pathParameters){
            if (!(name in this)){
                this[name] = pathParameters[name];
            }
        }
    },

    prepare: async function(){
    },

    objectMethodForRequestMethod: function(requestMethod){
        // Since request.metod is entirely in the caller's control, and since we'll
        // use it to invoke a matching method name on the responder, we need to sanity check
        // the method name so we don't end up calling unexpected/private methods
        // - Disallow calls to base class methods/properties.  The base class does not provide implementations for any http method,
        //   This means the only methods that may be called are ones that are defined in subclasses
        // - Disallow calls to any method starting with underscore.  This provides subclasses with an easy way to have
        //   helper methods that can never be directly invoked.
        // - By nature of using the lowercase method, any sublcass methods named with camelCase cannot be called directly
        var methodName = requestMethod.toLowerCase();
        if (methodName.startsWith('_')){
            return null;
        }
        if (methodName == 'options'){
            return this.options;
        }
        if (methodName in APIResponder.prototype){
            return null;
        }
        return this[methodName] || null;
    }

});