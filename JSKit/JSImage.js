// #import "JSKit/JSObject.js"

JSClass('JSImage', JSObject, {

    resource: null,

    initWithResource: function(resource){
        this.resource = resource;
        var resourceInfo = JSApplication.sharedApplication.infoForResource(this.resource);
        this.width = resourceInfo.width;
        this.height = resourceInfo.height;
    },

    initWithStretchableResource: function(resource){
    }

});
