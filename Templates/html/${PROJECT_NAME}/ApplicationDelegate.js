// #import UIKit
'use strict';

JSClass("ApplicationDelegate", JSObject, {

    window: JSOutlet(),
    mainViewController: JSOutlet(),

    applicationDidFinishLaunching: function(application, launchOptions){
        this.window.makeKeyAndOrderFront();
    }

});