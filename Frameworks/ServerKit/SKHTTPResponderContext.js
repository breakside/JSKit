// #import Foundation
// #import "SKHTTPResponse.js"
'use strict';

JSClass("SKHTTPResponderContext", JSObject, {

    authenticated: null,

    initWithPathComponentMatches: function(pathComponentMatches){
        if (pathComponentMatches !== undefined){
            for (var x in pathComponentMatches){
                this[x] = pathComponentMatches[x];
            }
        }
    },

    open: function(){
        return Promise.resolve();
    }

});