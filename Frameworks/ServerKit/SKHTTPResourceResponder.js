// #import "ServerKit/SKHTTPResponder.js"
/* global JSClass, SKHTTPResponder, SKHTTPResourceResponder, JSBundle */
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
        var path = this.bundle.getNodePath(this.metadata);
        this.response.sendFile(path, this.metadata.mimetype);
    }

});