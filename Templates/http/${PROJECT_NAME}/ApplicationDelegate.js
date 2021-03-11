// #import ServerKit
'use strict';

JSClass("ApplicationDelegate", JSObject, {

    httpServer: JSOutlet(),

    applicationDidFinishLaunching: async function(application, launchOptions){
        // SSL (use for debugging only)
        if (launchOptions["tls-cert"] && launchOptions["tls-key"]){
            this.httpServer.tlsCertificate = await JSFileManager.shared.contentsAtURL(JSFileManager.shared.urlForPath(launchOptions["tls-cert"], application.workingDirectoryURL));
            this.httpServer.tlsPrivateKey = await JSFileManager.shared.contentsAtURL(JSFileManager.shared.urlForPath(launchOptions["tls-key"], application.workingDirectoryURL));
        }

        this.httpServer.port = launchOptions.port;
        this.httpServer.run();
    },

    applicationWillTerminate: async function(application, signal){
        await this.httpServer.stop();
    },

    serverDidCreateContextForRequest: function(server, context, request){
    }

});