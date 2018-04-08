// #import "Foundation/Foundation.js"
// #import "UIKit/UIResponder.js"
// #import "UIKit/UIWindowServer.js"
/* global JSGlobalObject, JSClass, JSObject, UIResponder, UIApplication, UIWindowServer, JSBundle, JSFont, JSSpec, JSDynamicProperty, JSReadOnlyProperty, UIEvent  */
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

    launchOptions: function(){
        return {};
    },

    run: function(){
        var launchOptions = this.launchOptions();
        if (this.delegate && this.delegate.applicationDidFinishLaunching){
            this.delegate.applicationDidFinishLaunching(launchOptions);
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
        var windows = event.windows;
        for (var i = 0, l = windows.length; i < l; ++i){
            windows[i].sendEvent(event);
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
    },

    touchesBegan: function(touches, event){
        // The application should be the final responder, so if a touch gets
        // all the way here, it means nothing handled it, and we should try
        // to re-send it as a mouse event to see if something handles that
        var touch = touches[0];
        var location = touch.window.convertPointToScreen(touch.locationInWindow);
        this.windowServer.createMouseEvent(UIEvent.Type.LeftMouseDown, event.timestamp, location);
    },

    touchesMoved: function(touches, event){
        var touch = touches[0];
        var location = touch.window.convertPointToScreen(touch.locationInWindow);
        this.windowServer.createMouseEvent(UIEvent.Type.LeftMouseDragged, event.timestamp, location);
    },

    touchesEnded: function(touches, event){
        var touch = touches[0];
        var location = touch.window.convertPointToScreen(touch.locationInWindow);
        this.windowServer.createMouseEvent(UIEvent.Type.LeftMouseUp, event.timestamp, location);
    },

    touchesCanceled: function(touches, event){
        var touch = touches[0];
        var location = touch.window.convertPointToScreen(touch.locationInWindow);
        this.windowServer.createMouseEvent(UIEvent.Type.LeftMouseUp, event.timestamp, location);
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
