// #import ServerKit
// #import "Responders/RootContext.js"
/* global JSClass, SKHTTPResponder, RootResponder, SocketRoute, RootContext */
'use strict';

JSClass('RootResponder', SKHTTPResponder, {

    get: function(){
    }

});

RootResponder.contextClass = RootContext;