// #import ServerKit
// #import "RootContext.js"
/* global JSClass, SKHTTPResponder, RootResponder, SocketRoute, RootContext */
'use strict';

JSClass('RootResponder', SKHTTPResponder, {

    contextClass: RootResponder,

    get: function(){
        var greeting = {message: "Hello, world!"};
        this.sendObject(greeting);
    }

});