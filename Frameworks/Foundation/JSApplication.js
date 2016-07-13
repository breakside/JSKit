// #import "Foundation/JSObject.js"
// #import "Foundation/JSPropertyList.js"
// #import "Foundation/JSSpec.js"
/* global JSClass, JSObject, JSApplication, JSPropertyList, JSSpec, JSClassFromName */
'use strict';

JSClass('JSApplication', JSObject, {

    init: function(){
        if (JSApplication._sharedApplication){
            throw new Error("JSApplication.init: one application already initialized, and only one may exist");
        }
        JSApplication._sharedApplication = this;
    },

    launch: function(){
        if (this.delegate && this.delegate.applicationDidFinishLaunching){
            this.delegate.applicationDidFinishLaunching();
        }
    }

});

JSApplication.InfoPlistName  = "Info";

JSApplication._sharedApplication = null;

Object.defineProperty(JSApplication, 'sharedApplication', {
    get: function JSApplication_getSharedApplication(){
        return JSApplication._sharedApplication;
    }
});

function JSApplicationMain(infoPlistName){
    var application = null;
    if (infoPlistName === null){
        application = JSApplication.init();
    }else{
        if (infoPlistName === undefined) infoPlistName = JSApplication.InfoPlistName;
        var info = JSPropertyList.initWithResource(infoPlistName);
        if (info[JSPropertyList.Keys.MainUIDefinitionFile]){
            var mainUIFile = JSSpec.initWithNkib(info[JSPropertyList.Keys.MainUIDefinitionFile]);
            application = mainUIFile.filesOwner();
            if (!(application instanceof JSApplication)){
                throw new Error("JSApplicationMain: invalid main UI defintion '%s', file's owner must be an instance of JSApplication".sprintf(info[JSPropertyList.Keys.MainUIDefintionFile]));
            }
        }else if (info[JSPropertyList.Keys.ApplicationDelegate]){
            application = JSApplication.init();
            var delegateClass = JSClassFromName(info[JSPropertyList.Keys.ApplicationDelegate]);
            application.delegate = delegateClass.init();
        }else{
            throw new Error("JSApplicationMain: %s missing required key '%s' or '%s'".sprintf(infoPlistName, JSPropertyList.Keys.MainUIDefinitionFile, JSPropertyList.Keys.ApplicationDelegate));
        }
    }
    application.launch();
}
