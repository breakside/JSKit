// #import Foundation
// #import "UIResponder.js"
// #import "UIWindowServer.js"
// #import "UIPlatform.js"
// #import "UIDevice.js"
'use strict';

(function(){

var shared = null;

var logger = JSLog("uikit", "application");

JSClass('UIApplication', UIResponder, {

    // MARK: - Initialization & Startup

    initWithWindowServer: function(windowServer){
        if (shared){
            throw new Error("UIApplication.init: one application already initialized, and only one may exist");
        }
        logger.info("Creating application");
        shared = this;
        this.windowServer = windowServer;
        this._windowsById = {};
        this.bundle = JSBundle.mainBundle;
        this.environment = this.bundle.info.UIApplicationEnvironment;
    },

    deinit: function(){
        shared = null;
    },

    launchOptions: function(){
        return {};
    },

    setup: function(){
        logger.info("Setup");
        this.setupFonts();
        this.setupDelegate();
    },

    setupFonts: function(){
        logger.info("Setup fonts");
        var descriptors = JSFont.registerBundleFonts(this.bundle);
        var systemFontName = this.bundle.info[UIApplication.InfoKeys.systemFont];
        if (systemFontName){
            JSFont.registerSystemFontResource(systemFontName);
        }else{
            logger.warn("No system font name");
        }
        for (var i = 0, l = descriptors.length; i < l; ++i){
            this.windowServer.displayServer.registerBundleFontDescriptor(descriptors[i]);
        }
        if (this.windowServer.device.primaryPointerType === UIUserInterface.PointerType.touch){
            logger.info("Touch device, increasing font sizes by 120%");
            for (var size in JSFont.Size){
                JSFont.Size[size] = Math.round(JSFont.Size[size] * 1.2);
            }
        }
    },

    setupDelegate: function(){
        if (!this.delegate){
            if (UIApplication.InfoKeys.mainSpec in this.bundle.info){
                var mainSpecName = this.bundle.info[UIApplication.InfoKeys.mainSpec];
                var mainUIFile = null;
                if (typeof(mainSpecName) == 'object'){
                    logger.info("Variable main spec file depending on device type");
                    if (this.windowServer.device.primaryPointerType === UIUserInterface.PointerType.touch && mainSpecName.touch){
                        logger.info("Looking for touch spec");
                        mainUIFile = JSSpec.initWithResource(mainSpecName.touch);
                        if (mainUIFile !== null){
                            logger.info("Found touch spec");
                        }
                    }
                    mainSpecName = mainSpecName.default;
                }
                if (mainUIFile === null){
                    if (!mainSpecName){
                        throw new Error("UIApplication: Info is missing a valid UIMainSpec name");
                    }
                    mainUIFile = JSSpec.initWithResource(mainSpecName);
                }
                if (mainUIFile === null){
                    throw new Error("UIApplication: Cannot find resource named by UIMainSpec");
                }
                this.delegate = mainUIFile.filesOwner;
            }else if (this.bundle.info[UIApplication.InfoKeys.applicationDelegate]){
                var delegateClass = JSClass.FromName(this.bundle.info[UIApplication.InfoKeys.applicationDelegate]);
                this.delegate = delegateClass.init();
            }else{
                throw new Error("UIApplication: Info is missing required key '%s' or '%s'".sprintf(UIApplication.InfoKeys.mainSpec, UIApplication.InfoKeys.applicationDelegate));
            }
        }
    },

    run: function(callback){
        // User Defaults are enabled by default, but can be disabled in Info
        var needsUserDefaults = this.bundle.info[UIApplication.InfoKeys.requiresUserDefaults] !== false;
        // File Manager is enabled by default, but can be disabled in Info; however, needing user defaults implies needing file manager
        var needsFileManager = needsUserDefaults || (this.bundle.info[UIApplication.InfoKeys.requiresFileManager] !== false);

        if (needsFileManager){
            logger.info("Need file manager");
            JSFileManager.shared.open(function UIApplication_fileManagerDidOpen(state){
                logger.info("File manager state: %d", state);
                try{
                    switch (state){
                        case JSFileManager.State.success:
                            if (needsUserDefaults){
                                logger.info("Need user defaults");
                                JSUserDefaults.shared.open(function UIApplication_userDefaultsDidOpen(){
                                    logger.info("User defaults opened");
                                    try{
                                        this._launch(callback);
                                    }catch (e){
                                        callback(e);
                                    }
                                }, this);
                            }else{
                                this._launch(callback);
                            }
                            break;
                        case JSFileManager.State.genericFailure:
                            if (JSFileManager.shared.error){
                                throw JSFileManager.shared.error;
                            }
                            throw new Error("Failed to open filesystem");
                        case JSFileManager.State.conflictingVersions:
                            throw new Error("JSKIT_CLOSE_OTHER_INSTANCES");
                    }
                }catch(e){
                    callback(e);
                }
            }, this);
        }else{
            try{
                this._launch(callback);
            }catch(e){
                callback(e);
            }
        }
    },

    _stopCalled: false,

    stop: function(completion, target){
        if (this._stopCalled){
            return;
        }
        this._stopCalled = true;
        logger.info("Stopping application");
        var _close = function(){
            JSUserDefaults.shared.close(function(){
                completion.call(target);
            });
        };
        if (this.delegate && this.delegate.applicationWillTerminate){
            this.delegate.applicationWillTerminate(_close);
        }else{
            _close();
        }
    },

    update: function(){
    },

    _launch: function(callback){
        this.setup();
        var launchOptions = this.launchOptions();
        if (!this.delegate){
            throw new Error("No application delegate defined");
        }
        if (!this.delegate.applicationDidFinishLaunching){
            throw new Error("ApplicationDelegate does not implement applicationDidFinishLaunching()");
        }
        this.delegate.applicationDidFinishLaunching(this, launchOptions);
        if (this.windowServer.windowStack.length === 0){
            throw new Error("No window initiated on application launch.  ApplicationDelegate needs to show a window during .applicationDidFinishLaunching()");
        }
        callback(null);
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

    // MARK: - Menu

    mainMenu: JSReadOnlyProperty(),

    getMainMenu: function(){
        var menuBar = this.windowServer.menuBar;
        if (menuBar){
            return menuBar.menu;
        }
        return null;
    },

    // MARK: - Sending Events & Actions

    sendEvent: function(event){
        if (event.category === UIEvent.Category.key && event.type === UIEvent.Type.keyDown && UIPlatform.shared && event.hasModifier(UIPlatform.shared.commandModifier)){
            var mainMenu = this.mainMenu;
            if (mainMenu){
                if (mainMenu.performKeyEquivalent(event)){
                    return;
                }
            }
        }
        var windows = event.windows;
        for (var i = 0, l = windows.length; i < l; ++i){
            windows[i].sendEvent(event);
        }
    },

    firstTargetForAction: function(action, target, sender){
        if (target === null){
            if (this.mainWindow !== null){
                target = this.mainWindow.firstResponder || this.mainWindow || this;
            }else{
                target = this;
            }
        }
        if (target.targetForAction && typeof(target.targetForAction) === 'function'){
            target = target.targetForAction(action, sender);
        }
        return target;
    },

    sendAction: function(action, target, sender, event){
        if (sender === undefined || sender === null){
            sender = this;
        }
        if (typeof(action) === 'function'){
            if (target === null){
                target = undefined;
            }
            action.call(target, sender, event);
        }else{
            if (target === undefined){
                target = null;
            }
            target = this.firstTargetForAction(action, target, sender);
            if (target !== null){
                target[action](sender, event);
            }
        }
    },

    targetForAction: function(action, sender){
        var target = UIApplication.$super.targetForAction.call(this, action, sender);
        if (target !== null){
            return target;
        }
        if (this.delegate && this.delegate.canPerformAction(action, sender)){
            return this.delegate;
        }
        return null;
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
    },

    openURL: function(url, options){
    }

});

UIApplication.InfoKeys = {
    launchOptions: "UIApplicationLaunchOptions",
    mainSpec: "UIMainSpec",
    applicationDelegate: "UIApplicationDelegate",
    systemFont: "UIApplicationSystemFont",
    requiresUserDefaults: "UIApplicationRequiresUserDefaults",
    requiresFileManager: "UIApplicationRequiresFileManager"
};

UIApplication.LaunchOptions = {
    state: "UIApplicationLaunchOptionState"
};

Object.defineProperty(UIApplication, 'shared', {
    configurable: true,
    get: function UIApplication_getSharedApplication(){
        return shared;
    }
});

UIApplication.LaunchFailureReason = {
    exception: 'Exception',
    filestyemNotAvailable: 'File System Not Available',
    upgradeRequiresNoOtherInstances: 'Upgrade Requires No Other Instances'
};

})();
