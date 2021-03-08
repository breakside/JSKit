// #import ServerKit
'use strict';

JSClass("ApplicationDelegate", JSObject, {

    httpServer: JSOutlet(),

    applicationDidFinishLaunching: function(application, launchOptions){
        this.httpServer.port = launchOptions.port;
        this.httpServer.run();
    },

    applicationWillTerminate: async function(application, signal){
        await this.httpServer.stop();
    },

    serverDidCreateContextForRequest: function(server, context, request){
    }

});