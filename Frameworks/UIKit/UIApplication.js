// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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

    initWithBundle: function(bundle, windowServer){
        if (shared){
            throw new Error("UIApplication.init: one application already initialized, and only one may exist");
        }
        this.bundle = bundle;
        this.setupLogging();
        logger.info("Creating application");
        shared = this;
        this.windowServer = windowServer;
        if (this.bundle.info.UIUserInterfaceStyle === "light"){
            this.windowServer.darkModeEnabled = false;
        }
        this._windows = [];
        this.windowServer.postNotificationForAccessibilityElement(UIAccessibility.Notification.elementCreated, this);
    },

    bundle: null,
    environment: null,

    // MARK: - Initialization & Startup

    initWithWindowServer: function(windowServer){
        this.initWithBundle(JSBundle.mainBundle, windowServer);
    },

    deinit: function(){
        shared = null;
        JSFont.unregisterAllFonts();
    },

    launchOptions: function(){
        return {};
    },

    setup: function(completion, target){
        logger.info("Setup");
        this.setupTimeZones(function(error){
            if (error === null){
                this.setupFonts(function(error){
                    if (error === null){
                        try{
                            this.setupDelegate();
                        }catch (e){
                            error = e;
                        }
                    }
                    completion.call(target, error);
                }, this);
            }else{
                completion.call(target, error);
            }
        }, this);
    },

    setupLogging: function(){
        var logging = this.bundle.info.JSLogging;
        if (!logging){
            return;
        }
    },

    setupTimeZones: function(completion, target){
        var subdirectory = (this.bundle.info.JSTimeZoneInfo || "tz") + ".zoneinfo";
        var metadata = this.bundle.metadataForResourceName("Contents", "json", subdirectory);
        if (metadata === null){
            completion.call(target, null);
            return;
        }
        var contents = metadata.value;
        metadata = this.bundle.metadataForResourceName(contents.tzif, null, subdirectory);
        this.bundle.getResourceData(metadata, function(tzif){
            if (tzif === null){
                completion.call(target, new Error("Cannot read timezone data resource"));
            }else{
                JSTimeZone.importZoneInfo({
                    tzif: tzif,
                    map: contents.map
                });
                completion.call(target, null);
            }
        });
    },

    setupFonts: function(completion, target){
        logger.info("Setup fonts");
        var descriptors = JSFont.registerBundleFonts(this.bundle);
        var systemFontName = this.bundle.info[UIApplication.InfoKeys.systemFont];
        if (systemFontName){
            JSFont.registerSystemFontResource(systemFontName);
        }else{
            logger.warn("No system font name");
        }
        if (this.windowServer.device.primaryPointerType === UIUserInterface.PointerType.touch){
            logger.info("Touch device, increasing font sizes by 120%");
            for (var size in JSFont.Size){
                JSFont.Size[size] = Math.round(JSFont.Size[size] * 1.2);
            }
        }
        this.registerFontDescriptors(descriptors, function(error){
            completion.call(target, error);
        }, this);
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

    run: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNull);
        }
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
                                        this._launch(completion, target);
                                    }catch (e){
                                        completion.call(target, e);
                                    }
                                }, this);
                            }else{
                                this._launch(completion, target);
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
                    completion.call(target, e);
                }
            }, this);
        }else{
            try{
                this._launch(completion, target);
            }catch(e){
                completion.call(target, e);
            }
        }
        return completion.promise;
    },

    _stopCalled: false,

    stop: function(completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        if (this._stopCalled){
            completion.call(target);
        }else{
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
        }
        return completion.promise;
    },

    update: function(){
    },

    _launch: function(completion, target){
        this.setup(function(error){
            if (error !== null){
                completion.call(target, error);
                return;
            }
            try{
                var launchOptions = this.launchOptions();
                if (!this.delegate){
                    throw new Error("No application delegate defined");
                }
                if (!this.delegate.applicationDidFinishLaunching){
                    throw new Error("ApplicationDelegate does not implement applicationDidFinishLaunching()");
                }
                logger.info("Calling delegate.applicationDidFinishLaunching");
                this.delegate.applicationDidFinishLaunching(this, launchOptions);
                var windows = this.windowServer.windowsForApplication(this);
                if (windows.length === 0){
                    throw new Error("No window initiated on application launch.  ApplicationDelegate needs to show a window during .applicationDidFinishLaunching()");
                }
            }catch (e){
                completion.call(target, e);
                return;
            }
            completion.call(target, null);
        }, this);
    },

    // MARK: - Managing Windows

    mainWindow: JSReadOnlyProperty(),
    keyWindow: JSReadOnlyProperty(),
    windows: JSReadOnlyProperty("_windows", null),
    windowServer: null,

    getMainWindow: function(){
        var main = this.windowServer.mainWindow;
        if (main !== null && main.application === this){
            return main;
        }
        return null;
    },

    getKeyWindow: function(){
        var key = this.windowServer.keyWindow;
        if (key !== null && key.application === this){
            return key;
        }
        return null;
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

    shortcutMenu: null,

    // MARK: - State

    state: JSDynamicProperty("_state", null),

    setState: function(state){
        this._state = state; 
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
            if (this.shortcutMenu !== null){
                if (this.shortcutMenu.performKeyEquivalent(event)){
                    return;
                }
            }
        }
        if (event.category === UIEvent.Category.touches){
            var sentWindowIds = new Set();
            var window;
            var touches = event.touches;
            for (var i = 0, l = touches.length; i < l; ++i){
                window = touches[i].window;
                if (!sentWindowIds.has(window.objectID)){
                    window.sendEvent(event);
                    sentWindowIds.add(window.objectID);
                }
            }
        }else{
            event.window.sendEvent(event);
        }
    },

    firstTargetForAction: function(action, target, sender){
        if (target === null){
            if (this.keyWindow !== null){
                target = this.keyWindow.firstResponder || this.keyWindow;
            }else if (this.mainWindow !== null){
                target = this.mainWindow.firstResponder || this.mainWindow;
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

    convertsTouchesToMouseEvents: false,

    touchesBegan: function(touches, event){
        if (this.convertsTouchesToMouseEvents){
            // The application should be the final responder, so if a touch gets
            // all the way here, it means nothing handled it, and we should try
            // to re-send it as a mouse event to see if something handles that
            var touch = touches[0];
            var location = touch.window.convertPointToScreen(touch.locationInWindow);
            this.windowServer.createMouseEvent(UIEvent.Type.leftMouseDown, event.timestamp, location);
        }else{
            UIApplication.$super.touchesBegan.call(this, touches, event);
        }
    },

    touchesMoved: function(touches, event){
        if (this.convertsTouchesToMouseEvents){
            var touch = touches[0];
            var location = touch.window.convertPointToScreen(touch.locationInWindow);
            this.windowServer.createMouseEvent(UIEvent.Type.leftMouseDragged, event.timestamp, location);
        }else{
            UIApplication.$super.touchesMoved.call(this, touches, event);
        }
    },

    touchesEnded: function(touches, event){
        if (this.convertsTouchesToMouseEvents){
            var touch = touches[0];
            var location = touch.window.convertPointToScreen(touch.locationInWindow);
            this.windowServer.createMouseEvent(UIEvent.Type.leftMouseUp, event.timestamp, location);
        }else{
            UIApplication.$super.touchesEnded.call(this, touches, event);
        }
    },

    touchesCanceled: function(touches, event){
        if (this.convertsTouchesToMouseEvents){
            var touch = touches[0];
            var location = touch.window.convertPointToScreen(touch.locationInWindow);
            this.windowServer.createMouseEvent(UIEvent.Type.leftMouseUp, event.timestamp, location);
        }else{
            UIApplication.$super.touchesCanceled.call(this, touches, event);
        }
    },

    // MARK: - Fonts

    registerFontDescriptor: function(descriptor, completion, target){
        return this.registerFontDescriptors([descriptor], completion, target);
    },

    registerFontDescriptors: function(descriptors, completion, target){
        return this.windowServer.displayServer.registerFontDescriptors(descriptors, completion, target);
    },

    // MARK: - URLs

    openURL: function(url, options){
    },

    // MARK: - Environment

    getenv: function(name, defaultValue){
        return this.environment.get(name, defaultValue);
    },

    // Visibility
    isAccessibilityElement: true,
    accessibilityHidden: false,
    accessibilityLayer: null,
    accessibilityFrame: JSReadOnlyProperty(),

    // Role
    accessibilityRole: UIAccessibility.Role.application,
    accessibilitySubrole: null,

    // Label
    accessibilityIdentifier: null,
    accessibilityLabel: JSReadOnlyProperty(),
    accessibilityHint: null,

    // Value
    accessibilityValue: null,
    accessibilityValueRange: null,
    accessibilityChecked: null,

    // Properties
    accessibilityTextualContext: null,
    accessibilityMenu: null,
    accessibilityRowIndex: null,
    accessibilitySelected: null,
    accessibilityExpanded: null,
    accessibilityOrientation: null,
    accessibilityEnabled: null,

    // Children
    accessibilityParent: null,
    accessibilityElements: JSReadOnlyProperty(),

    getAccessibilityFrame: function(){
        return this.windowServer.screen.frame;
    },

    getAccessibilityLabel: function(){
        return this.bundle.localizedStringForInfoKey("UIApplicationTitle");
    },

    getAccessibilityElements: function(){
        return this.windows;
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
