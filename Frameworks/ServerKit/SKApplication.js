// #import "Foundation/Foundation.js"
/* global JSGlobalObject, JSClass, JSObject, SKApplication, JSFont, JSBundle, JSSpec */
'use strict';

(function(){

var sharedApplication = null;

JSClass('SKApplication', JSObject, {

    launchOptions: null,

    init: function(){
        if (sharedApplication){
            throw new Error("SKApplication.init: one application already initialized, and only one may exist");
        }
        sharedApplication = this;
        this.parseLaunchOptions();
    },

    deinit: function(){
        sharedApplication = null;
    },

    run: function(){
        if (this.delegate && this.delegate.applicationDidFinishLaunching){
            this.delegate.applicationDidFinishLaunching(this, this.launchOptions);
        }
    },

    parseLaunchOptions: function(){
        var info = JSBundle.mainBundle.info();
        var optionDefinitions = info[SKApplication.InfoKeys.LaunchOptions];
        var rawArguments = this.rawProcessArguments();
        this.launchOptions = SKApplication.ParseLaunchOptions(optionDefinitions, rawArguments);
    },

    rawProcessArguments: function(){
        return [];
    },

});

SKApplication.ParseLaunchOptions = function(optionDefinitions, rawArguments){
    var options = {};
    var rawArgument;
    var optionDefinition;
    var optionName;
    var value;
    for (var i = 1; i < rawArguments.length; ++i){
        rawArgument = rawArguments[i];
        if (rawArgument.length > 2 && rawArgument.charAt(0) == '-' && rawArgument.charAt(1) == '-'){
            optionName = rawArgument.substr(2);
            optionDefinition = optionDefinitions[optionName];
            if (!optionDefinition){
                throw Error("Unknown argument: %s".sprintf(rawArgument));
            }
            if (optionDefinition.kind == "flag"){
                options[optionName] = true;
            }else if (i < rawArguments.length - 1){
                ++i;
                value = rawArguments[i];
                if (value.length > 1 && value.charAt(0) == '-'){
                    throw Error("Missing value for argument: %s".sprintf(rawArgument));
                }
                if (optionDefinition.kind == "integer"){
                    options[optionName] = parseInt(value);
                }else{
                    options[optionName] = value;
                }
            }else{
                throw Error("Missing value for argument: %s".sprintf(rawArgument));
            }
        }
    }
    for (optionName in optionDefinitions){
        if (!(optionName in options)){
            if ('default' in optionDefinitions[optionName]){
                options[optionName] = optionDefinitions[optionName].default;
            }else if (optionDefinitions[optionName].required && optionDefinitions[optionName].kind != "flag"){
                throw Error("Missing required argument: --%s".sprintf(optionName));
            }
        }
    }
    return options;
};

SKApplication.InfoKeys = {
    MainDefinitionResource: "SKMainDefinitionResource",
    ApplicationDelegate: "SKApplicationDelegate",
    LaunchOptions: "SKApplicationLaunchOptions",
};

Object.defineProperty(SKApplication, 'sharedApplication', {
    configurable: true,
    get: function SKApplication_getSharedApplication(){
        return sharedApplication;
    }
});

JSGlobalObject.SKApplicationMain = function SKApplicationMain(){
    var application = SKApplication.init();
    JSFont.registerBundleFonts(JSBundle.mainBundle);
    var info = JSBundle.mainBundle.info();
    if (info[SKApplication.InfoKeys.MainDefinitionResource]){
        var mainUIFile = JSSpec.initWithResource(info[SKApplication.InfoKeys.MainDefinitionResource]);
        application.delegate = mainUIFile.filesOwner();
    }else if (info[SKApplication.InfoKeys.ApplicationDelegate]){
        var delegateClass = JSClass.FromName(info[SKApplication.InfoKeys.ApplicationDelegate]);
        application.delegate = delegateClass.init();
    }else{
        throw new Error("SKApplicationMain: Info is missing required key '%s' or '%s'".sprintf(SKApplication.InfoKeys.MainDefinitionResource, SKApplication.InfoKeys.ApplicationDelegate));
    }
    application.run();
};

})();
