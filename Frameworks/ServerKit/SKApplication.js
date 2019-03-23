// #import "Foundation/Foundation.js"
/* global JSGlobalObject, JSArguments, JSClass, JSObject, SKApplication, JSFont, JSBundle, JSSpec */
'use strict';

(function(){

var shared = null;

JSClass('SKApplication', JSObject, {

    launchOptions: null,
    bundle: null,

    init: function(){
        if (shared){
            throw new Error("SKApplication.init: one application already initialized, and only one may exist");
        }
        shared = this;
        this.bundle = JSBundle.mainBundle;
        this.parseLaunchOptions();
        this.setup();
    },

    deinit: function(){
        shared = null;
    },

    run: function(){
        if (this.delegate && this.delegate.applicationDidFinishLaunching){
            this.delegate.applicationDidFinishLaunching(this, this.launchOptions);
        }
    },

    parseLaunchOptions: function(){
        var optionDefinitions = this.bundle.info[SKApplication.InfoKeys.LaunchOptions];
        var rawArguments = this.rawProcessArguments();
        this.launchOptions = JSArguments.initWithOptions(optionDefinitions);
        this.launchOptions.parse(rawArguments);
    },

    setup: function(){
        this.setupFonts();
        this.setupDelegate();
    },

    setupFonts: function(){
        JSFont.registerBundleFonts(JSBundle.mainBundle);
    },

    setupDelegate: function(){
        if (this.bundle.info[SKApplication.InfoKeys.MainDefinitionResource]){
            var mainUIFile = JSSpec.initWithResource(this.bundle.info[SKApplication.InfoKeys.MainDefinitionResource]);
            this.delegate = mainUIFile.filesOwner;
        }else if (this.bundle.info[SKApplication.InfoKeys.ApplicationDelegate]){
            var delegateClass = JSClass.FromName(this.bundle.info[SKApplication.InfoKeys.ApplicationDelegate]);
            this.delegate = delegateClass.init();
        }else{
            throw new Error("SKApplication: Info is missing required key '%s' or '%s'".sprintf(SKApplication.InfoKeys.MainDefinitionResource, SKApplication.InfoKeys.ApplicationDelegate));
        }
    },

    rawProcessArguments: function(){
        return [];
    },

});

SKApplication.InfoKeys = {
    MainDefinitionResource: "SKMainDefinitionResource",
    ApplicationDelegate: "SKApplicationDelegate",
    LaunchOptions: "SKApplicationLaunchOptions",
};

Object.defineProperty(SKApplication, 'shared', {
    configurable: true,
    get: function SKApplication_getSharedApplication(){
        return shared;
    }
});

JSGlobalObject.SKApplicationMain = function SKApplicationMain(){
    var application = SKApplication.init();
    application.run();
};

})();
