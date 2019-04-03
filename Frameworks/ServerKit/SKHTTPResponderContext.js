// #import Foundation
// #import "ServerKit/SKHTTPResponse.js"
/* global JSClass, JSObject, JSReadOnlyProperty, JSRunLoop, SKHTTPResponse */
'use strict';

JSClass("SKHTTPResponderContext", JSObject, {

    request: JSReadOnlyProperty('_request', null),

    initWithPathComponentMatches: function(pathComponentMatches){
        if (pathComponentMatches !== undefined){
            for (var x in pathComponentMatches){
                this[x] = pathComponentMatches[x];
            }
        }
    },

    open: function(callback, target){
        callback.call(target, null);
    }

});