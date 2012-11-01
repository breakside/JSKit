// #import "Foundation/JSObject.js"

function JSImage(){
}

JSImage.prototype = {
    
    resource: null,
    
    initWithResource: function(resource){
        this.resource = resource;
        var resourceInfo = JSApplication.sharedApplication.infoForResource(this.resource);
        this.width = resourceInfo.width;
        this.height = resourceInfo.height;
    },
    
    initWithStretchableResource: function(resource){
    },
    
};

JSImage.$extends(JSObject);
