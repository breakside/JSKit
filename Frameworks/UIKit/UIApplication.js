// #import "Foundation/Foundation.js"
// #import "UIKit/UIResponder.js"
// #import "UIKit/UIWindowServer.js"
/* global JSGlobalObject, JSClass, JSObject, UIResponder, UIApplication, UIWindowServer, JSBundle, JSFont, JSSpec, JSDynamicProperty, JSReadOnlyProperty, UIEvent  */
'use strict';

(function(){

var sharedApplication = null;

JSClass('UIApplication', UIResponder, {

    // MARK: - Initialization & Startup

    initWithWindowServer: function(windowServer){
        if (sharedApplication){
            throw new Error("UIApplication.init: one application already initialized, and only one may exist");
        }
        sharedApplication = this;
        this.windowServer = windowServer;
        this._windowsById = {};
    },

    deinit: function(){
        sharedApplication = null;
    },

    launchOptions: function(){
        return {};
    },

    run: function(){
        var launchOptions = this.launchOptions();
        if (this.delegate && this.delegate.applicationDidFinishLaunching){
            this.delegate.applicationDidFinishLaunching(this, launchOptions);
        }
    },

    // MARK: - Managing Windows

    mainWindow: JSReadOnlyProperty(),
    keyWindow: JSReadOnlyProperty(),
    windows: JSReadOnlyProperty(),
    windowServer: null,

    getWindows: function(){
        return this.windowServer.windowStack;
    },

    getMainWindow: function(){
        return this.windowServer.mainWindow;
    },

    getKeyWindow: function(){
        return this.windowServer.keyWindow;
    },

    // MARK: - Sending Events & Actions

    sendEvent: function(event){
        var windows = event.windows;
        for (var i = 0, l = windows.length; i < l; ++i){
            windows[i].sendEvent(event);
        }
    },

    firstTargetForAction: function(action, target, sender){
        if (target === null){
            if (this.mainWindow !== null){
                target = this.mainWindow.firstResponder || this.mainWindow;
            }
        }
        if (target !== null && target.targetForAction && typeof(target.targetForAction) === 'function'){
            target = target.targetForAction(action, sender);
        }
        return target;
    },

    sendAction: function(action, target, sender){
        if (sender === undefined){
            sender = this;
        }
        if (target === undefined){
            target = null;
        }
        target = this.firstTargetForAction(action, target, sender);
        if (target !== null){
            target[action](sender);
        }
    },

    // MARK: - Touch Event Conversion

    touchesBegan: function(touches, event){
        // The application should be the final responder, so if a touch gets
        // all the way here, it means nothing handled it, and we should try
        // to re-send it as a mouse event to see if something handles that
        var touch = touches[0];
        var location = touch.window.convertPointToScreen(touch.locationInWindow);
        this.windowServer.createMouseEvent(UIEvent.Type.leftMouseDown, event.timestamp, location);
    },

    touchesMoved: function(touches, event){
        var touch = touches[0];
        var location = touch.window.convertPointToScreen(touch.locationInWindow);
        this.windowServer.createMouseEvent(UIEvent.Type.leftMouseDragged, event.timestamp, location);
    },

    touchesEnded: function(touches, event){
        var touch = touches[0];
        var location = touch.window.convertPointToScreen(touch.locationInWindow);
        this.windowServer.createMouseEvent(UIEvent.Type.leftMouseUp, event.timestamp, location);
    },

    touchesCanceled: function(touches, event){
        var touch = touches[0];
        var location = touch.window.convertPointToScreen(touch.locationInWindow);
        this.windowServer.createMouseEvent(UIEvent.Type.leftMouseUp, event.timestamp, location);
    }

});

UIApplication.InfoKeys = {
    MainDefinitionResource: "UIMainDefinitionResource",
    ApplicationDelegate: "UIApplicationDelegate",
};

UIApplication.LaunchOptions = {
    state: "UIApplicationLaunchOptionState"
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
    JSFont.registerSystemFontResource(info.UIApplicationSystemFont);
    if (info[UIApplication.InfoKeys.MainDefinitionResource]){
        var mainUIFile = JSSpec.initWithResource(info[UIApplication.InfoKeys.MainDefinitionResource]);
        application.delegate = mainUIFile.filesOwner();
    }else if (info[UIApplication.InfoKeys.ApplicationDelegate]){
        var delegateClass = JSClass.FromName(info[UIApplication.InfoKeys.ApplicationDelegate]);
        application.delegate = delegateClass.init();
    }else{
        throw new Error("UIApplicationMain: Info is missing required key '%s' or '%s'".sprintf(UIApplication.InfoKeys.MainDefinitionResource, UIApplication.InfoKeys.ApplicationDelegate));
    }
    application.run();
};

})();
