// #import "Foundation/JSObject.js"
// #import "JSKit/JSPropertyList.js"
// #import "JSKit/JSNkib.js"

JSApplicationInfoPlistName  = "Info.plist";

function JSApplication(){
}

JSApplication._sharedApplication = null;

JSApplication.sharedApplication = function(){
    return JSApplication._sharedApplication;
};

JSApplication.prototype = {
    
    init: function(){
        this.$super.init.call(this);
        if (JSApplication._sharedApplication){
            throw Error("JSApplication.init: one application already initialized, and only one may exist");
        }
        JSApplication._sharedApplication = this;
        return this;
    },
    
    launch: function(){
        if (this.delegate && this.delegate.applicationDidFinishLaunching){
            this.delegate.applicationDidFinishLaunching();
        }
    },
    
    infoForResource: function(resource){
        return _JSApplicationResourceInfo[resource];
    },
    
    contentsOfResource: function(resource){
        if (resource in _JSApplicationResources){
            return _JSApplicationResources[resource];
        }
        throw Exception("JSApplication.contentsOfResource: resource '%s' not found".sprintf(resource);
    },
    
    hasResource: function(resource){
        return resource in _JSApplicationResources;
    }
    
};

JSApplication.$extends(JSObject);

function JSApplicationMain(infoPlistName){
    var application = null;
    if (infoPlistName === null){
        JSLog("Running application without using info property list");
        application = JSApplication.alloc().init();
    }else{
        if (infoPlistName === undefined) infoPlistName = JSApplicationInfoPlistName;
        var info = JSPropertyList.alloc().initWithResource(infoPlistName);
        if (info[JSPropertyListKeyMainUIDefinitionFile]){
            var mainUIFile = JSNkib.alloc().initWithNkib(info[JSPropertyListKeyMainUIDefinitionFile]);
            application = mainNkib.filesOwner();
            if (!(application instanceof JSApplication)){
                throw Error("JSApplicationMain: invalid main UI defintion '%s', file's owner must be an instance of JSApplication".sprintf(info[JSPropertyListKeyMainUIDefintionFile]));
            }
        }else if (info[JSPropertyListKeyApplicationDelegate]){
            application = JSApplication.alloc().init();
            var delegateClass = JSClassFromName(info[JSPropertyListKeyApplicationDelegate]);
            application.delegate = delegateClass.alloc().init();
        }else{
            throw Error("JSApplicationMain: %s missing required key '%s' or '%s'".sprintf(infoPlistName, JSPropertyListKeyMainNkibFile, JSPropertyListKeyApplicationDelegate));
        }
    }
    application.launch();
}
