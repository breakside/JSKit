// #import "UIKit/UIApplication.js"
// #import "UIKit/UIHTMLWindowServer.js"
/* global JSGlobalObject, UIApplication, JSURL, window, UIHTMLWindowServer */
'use strict';

UIApplication.definePropertiesFromExtensions({

    launchOptions: function(){
        var options = {};
        var url = JSURL.initWithString(window.location.href);
        var fragment = url.fragment;
        if (fragment !== null && fragment.length > 0 && fragment[0] == '/'){
            options[UIApplication.LaunchOptions.state] = fragment;
        }
        return options;
    }

});

JSGlobalObject.UIApplicationMain = function(rootElement, bootstrapper){
    var windowServer = UIHTMLWindowServer.initWithRootElement(rootElement);
    var application = UIApplication.initWithWindowServer(windowServer);
    application.setup();
    application.run(function(success){
        if (bootstrapper){
            bootstrapper.applicationLaunchResult(success);
        }
    });
};