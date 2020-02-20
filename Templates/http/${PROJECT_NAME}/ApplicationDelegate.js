// #import ServerKit
'use strict';

JSClass("ApplicationDelegate", JSObject, {

    httpServer: JSOutlet(),

    applicationDidFinishLaunching: function(application, launchOptions){
        this.httpServer.port = launchOptions.port;
        this.httpServer.run();
    },

    serverDidCreateContextForRequest: function(server, context, request){
    }

});