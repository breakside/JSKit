function JSPropertyList(){
}

JSPropertyList.prototype = {
    
    initWithResource: function(resourceName){
        this.$super.init.call(this);
        var obj = JSApplication.sharedApplication.contentsOfResource(resourceName);
        if (obj){
            for (var i in obj){
                this[i] = obj[i];
            }
        }
        return this;
    },
    
};

JSPropertyList.$extends(JSObject);

JSPropertyListKeyMainUIDefinitionFile   = "JSMainUIDefinitionFile";
JSPropertyListKeyApplicationDelegate    = "JSApplicationDelegate";
