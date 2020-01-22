// #import ServerKit
// #import "RootContext.js"
'use strict';

JSClass('RootResponder', SKHTTPResponder, {

    contextClass: RootContext,

    get: function(){
        var greeting = {message: "Hello, world!"};
        this.sendObject(greeting);
    }

});