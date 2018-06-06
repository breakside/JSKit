// #import "ServerKit/ServerKit.js"
/* global JSClass, JSObject, SKApplicationDelegate */
'use strict';

JSClass("ApplicationDelegate", JSObject, {

    httpServer: null,

    applicationDidFinishLaunching: function(application, launchOptions){
        this.httpServer.port = launchOptions.port;
        this.httpServer.run();
    }

});