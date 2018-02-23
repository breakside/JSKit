// #import "Foundation/Foundation.js"
// #import "ServerKit/SKHTTPResponderContext.js"
/* global JSClass, JSObject, JSReadOnlyProperty, SKHTTPResponder, SKHTTPResponderContext */
'use strict';

JSClass("SKHTTPResponder", JSObject, {

    request: JSReadOnlyProperty('_request', null),
    context: JSReadOnlyProperty('_context', null),

    initWithRequest: function(request, context){
        this._request = request;
        this._context = context;
    }

});