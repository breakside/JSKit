// #import "Foundation/Foundation.js"
// #import "UIKit/UIResponder.js"
// #import "UIKit/UIWindowServer.js"
/* global JSGlobalObject, JSClass, JSObject, UIResponder, UIApplication, UIWindowServer, JSPropertyList, JSSpec, JSClassFromName, JSDynamicProperty, JSReadOnlyProperty, UIEvent  */
'use strict';

JSClass('UIApplication', UIResponder, {

    keyWindow: JSDynamicProperty('_keyWindow', null),
    windows: null,

    init: function(){
        if (UIApplication._sharedApplication){
            throw new Error("UIApplication.init: one application already initialized, and only one may exist");
        }
        UIApplication._sharedApplication = this;
        this._firstResponder = this;
        this.windows = [];
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
        UIWindowServer.defaultServer.windowInserted(window);
    },

    windowRemoved: function(window){
        for (var i = this.windows.length - 1; i >= 0; --i){
            if (this.windows[i] === window){
                this.windows.splice(i, 1);
                break;
            }
        }
        UIWindowServer.defaultServer.windowRemoved(window);
    },

    sendEvent: function(event){
        if (event.window){
            event.window.sendEvent(event);
        }
    }

});

UIApplication.InfoPlistName  = "Info";

UIApplication.InfoKeys = {
    MainDefinitionFile: "UIMainDefinitionFile",
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

JSGlobalObject.UIApplicationMain = function UIApplicationMain(infoPlistName){
    var application = UIApplication.sharedApplication;
    if (infoPlistName !== null){
        if (infoPlistName === undefined) infoPlistName = UIApplication.InfoPlistName;
        var info = JSPropertyList.initWithResource(infoPlistName);
        if (info[UIApplication.InfoKeys.MainDefinitionFile]){
            var mainUIFile = JSSpec.initWithResource(info[UIApplication.InfoKeys.MainDefinitionFile]);
            application.delegate = mainUIFile.filesOwner();
        }else if (info[UIApplication.InfoKeys.ApplicationDelegate]){
            var delegateClass = JSClassFromName(info[UIApplication.InfoKeys.ApplicationDelegate]);
            application.delegate = delegateClass.init();
        }else{
            throw new Error("UIApplicationMain: %s missing required key '%s' or '%s'".sprintf(infoPlistName, UIApplication.InfoKeys.MainDefinitionFile, UIApplication.InfoKeys.ApplicationDelegate));
        }
    }
    application.run();
};
