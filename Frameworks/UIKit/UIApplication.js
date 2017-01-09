// #import "Foundation/Foundation.js"
// #import "UIKit/UIResponder.js"
// #import "UIKit/UIWindowServer.js"
/* global JSGlobalObject, JSClass, JSObject, UIResponder, UIApplication, UIWindowServer, JSBundle, JSSpec, JSClassFromName, JSDynamicProperty, JSReadOnlyProperty, UIEvent  */
'use strict';

JSClass('UIApplication', UIResponder, {

    keyWindow: JSDynamicProperty('_keyWindow', null),
    windows: null,
    windowServer: null,

    init: function(){
        if (UIApplication._sharedApplication){
            throw new Error("UIApplication.init: one application already initialized, and only one may exist");
        }
        UIApplication._sharedApplication = this;
        this._firstResponder = this;
        this.windows = [];
        this.windowServer = UIWindowServer.defaultServer;
    },

    run: function(){
        if (this.delegate && this.delegate.applicationDidFinishLaunching){
            this.delegate.applicationDidFinishLaunching();
        }
    },

    getKeyWindow: function(){
        return this._keyWindow;
    },

    setKeyWindow: function(window){
        this._keyWindow = window;
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
        var application = UIApplication.init();
        Object.defineProperty(UIApplication, 'sharedApplication', {
            value: application
        });
        return application;
    }
});

JSGlobalObject.UIApplicationMain = function UIApplicationMain(){
    var application = UIApplication.sharedApplication;
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
