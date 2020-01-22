// #import "SKHTTPResponder.js"
'use strict';

JSClass("SKHTTPResourceResponder", SKHTTPResponder, {

    metadata: null,
    bundle: null,

    initWithResourceMetadata: function(bundle, metadata, request, context){
        SKHTTPResourceResponder.$super.initWithRequest.call(this, request, context);
        this.metadata = metadata;
        this.bundle = bundle;
    },

    get: function(){
        // FIXME: node-specific call shouldn't be in env-generic file
        var path = this.bundle.getNodePath(this.metadata);
        this.sendFile(path, this.metadata.mimetype, this.metadata.hash);
    }

});