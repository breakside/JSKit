// #import "JSKit/JSObject.js"
// #import "JSKit/JSPropertyList.js"

JSClass('JSApplication', JSObject, {

    init: function(){
        if (JSApplication._sharedApplication){
            throw Error("JSApplication.init: one application already initialized, and only one may exist");
        }
        JSApplication._sharedApplication = this;
    },

    launch: function(){
        if (this.delegate && this.delegate.applicationDidFinishLaunching){
            this.delegate.applicationDidFinishLaunching();
        }
    }

});

JSApplication.InfoPlistName  = "Info.plist";

JSApplication._sharedApplication = null;

Object.defineProperty(JSApplication, 'sharedApplication', {
    get: function JSApplication_getSharedApplication(){
        return JSApplication._sharedApplication;
    }
});

function JSApplicationMain(infoPlistName){
    var application = null;
    if (infoPlistName === null){
        JSLog("Running application without using info property list");
        application = JSApplication.init();
    }else{
        if (infoPlistName === undefined) infoPlistName = JSApplication.InfoPlistName;
        var info = JSPropertyList.initWithResource(infoPlistName);
        if (info[JSPropertyListKeys.MainUIDefinitionFile]){
            var mainUIFile = JSSpec.initWithNkib(info[JSPropertyListKeys.MainUIDefinitionFile]);
            application = mainUIFile.filesOwner();
            if (!(application instanceof JSApplication)){
                throw Error("JSApplicationMain: invalid main UI defintion '%s', file's owner must be an instance of JSApplication".sprintf(info[JSPropertyListKeys.MainUIDefintionFile]));
            }
        }else if (info[JSPropertyListKeys.ApplicationDelegate]){
            application = JSApplication.init();
            var delegateClass = JSClassFromName(info[JSPropertyListKeys.ApplicationDelegate]);
            application.delegate = delegateClass.init();
        }else{
            throw Error("JSApplicationMain: %s missing required key '%s' or '%s'".sprintf(infoPlistName, JSPropertyListKeys.MainUIDefinitionFile, JSPropertyListKeys.ApplicationDelegate));
        }
    }
    application.launch();
}
