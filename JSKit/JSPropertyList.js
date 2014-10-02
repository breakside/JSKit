// #import "JSKit/JSObject.js"
// #import "JSKit/JSBundle.js"

JSClass('JSPropertyList', JSObject, {
    initWithResource: function(resourceName){
        var obj = JSBundle.mainBundle.contentsOfResource(resourceName);
        this.initWithObject(obj);
    },
    initWithObject: function(obj){
        if (obj){
            for (var i in obj){
                this[i] = obj[i];
            }
        }
    }
});

var JSPropertyListKeys = {
    MainUIDefinitionFile: "JSMainUIDefinitionFile",
    ApplicationDelegate: "JSApplicationDelegate"
};
