// #import "Foundation/Foundation.js"
// #import "UIKit/UIResponder.js"
// #import "UIKit/UIWindowServer.js"
/* global JSGlobalObject, JSClass, JSObject, UIResponder, UIApplication, UIWindowServer, JSBundle, JSFont, JSSpec, JSClassFromName, JSDynamicProperty, JSReadOnlyProperty, UIEvent  */
'use strict';

(function(){

var sharedApplication = null;

JSClass('UIApplication', UIResponder, {

    keyWindow: JSDynamicProperty(),
    windows: null,
    windowServer: null,

    initWithWindowServer: function(windowServer){
        if (sharedApplication){
            throw new Error("UIApplication.init: one application already initialized, and only one may exist");
        }
        sharedApplication = this;
        this.windows = [];
        this.windowServer = windowServer;
        this.windowServer.application = this;
    },

    deinit: function(){
        sharedApplication = null;
    },

    run: function(){
        if (this.delegate && this.delegate.applicationDidFinishLaunching){
            this.delegate.applicationDidFinishLaunching();
        }
    },

    getKeyWindow: function(){
        return this.windowServer.keyWindow;
    },

    setKeyWindow: function(window){
        this.windowServer.keyWindow = window;
    },

    windowInserted: function(window){
        this.windows.push(window);
        this.windowServer.windowInserted(window);
    },

    windowRemoved: function(window){
        for (var i = this.windows.length - 1; i >= 0; --i){
            if (this.windows[i] === window){
                this.windows.splice(i, 1);
                break;
            }
        }
        this.windowServer.windowRemoved(window);
    },

    sendEvent: function(event){
        if (event.window){
            event.window.sendEvent(event);
        }
    },

    sendAction: function(action, target, sender){
        if (sender === undefined){
            sender = this;
        }
        if (target === undefined){
            target = null;
            var window = this.keyWindow;
            if (window !== null){
                var responder = window.firstResponder;
                if (responder !== null){
                    target = responder.targetForAction(action, sender);
                }
            }
        }
        if (target !== null){
            target[action](sender);
        }
    }

});

UIApplication.InfoPlistName  = "Info";

UIApplication.InfoKeys = {
    MainDefinitionResource: "UIMainDefinitionResource",
    ApplicationDelegate: "UIApplicationDelegate",
};

Object.defineProperty(UIApplication, 'sharedApplication', {
    configurable: true,
    get: function UIApplication_getSharedApplication(){
        return sharedApplication;
    }
});

JSGlobalObject.UIApplicationMain = function UIApplicationMain(){
    var application = UIApplication.initWithWindowServer(UIWindowServer.defaultServer);
    JSFont.registerBundleFonts(JSBundle.mainBundle);
    var info = JSBundle.mainBundle.info();
    if (info[UIApplication.InfoKeys.MainDefinitionResource]){
        var mainUIFile = JSSpec.initWithResource(info[UIApplication.InfoKeys.MainDefinitionResource]);
        application.delegate = mainUIFile.filesOwner();
    }else if (info[UIApplication.InfoKeys.ApplicationDelegate]){
        var delegateClass = JSClassFromName(info[UIApplication.InfoKeys.ApplicationDelegate]);
        application.delegate = delegateClass.init();
    }else{
        throw new Error("UIApplicationMain: Info is missing required key '%s' or '%s'".sprintf(UIApplication.InfoKeys.MainDefinitionResource, UIApplication.InfoKeys.ApplicationDelegate));
    }
    application.run();
};

})();
