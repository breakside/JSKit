// #import ServerKit
/* global JSClass, JSObject, SKApplicationDelegate */
'use strict';

JSClass("ApplicationDelegate", JSObject, {

    httpServer: null,

    applicationDidFinishLaunching: function(application, launchOptions){
        this.httpServer.port = launchOptions.port;
        this.httpServer.run();
    },

    serverDidCreateContextForRequest: function(server, context, request){
    }

});