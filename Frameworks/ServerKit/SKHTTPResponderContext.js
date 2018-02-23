// #import "Foundation/Foundation.js"
/* global JSClass, JSObject, JSReadOnlyProperty */
'use strict';

JSClass("SKHTTPResponderContext", JSObject, {

    request: JSReadOnlyProperty('_request', null),

    initWithPathComponentMatches: function(pathComponentMatches){
        if (pathComponentMatches !== undefined){
            for (var x in pathComponentMatches){
                this[x] = pathComponentMatches[x];
            }
        }
    }

});