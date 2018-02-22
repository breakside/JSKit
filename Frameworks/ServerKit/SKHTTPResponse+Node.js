// #import "ServerKit/SKHTTPResponse.js"
/* global SKHTTPResponse */
'use strict';

SKHTTPResponse.definePropertiesFromExtensions({

    _nodeResponse: null,

    initWithNodeResponse: function(nodeResponse){
        this._nodeResponse = nodeResponse;
    },

    getStatusCode: function(){
        return this._nodeResponse.statusCode;
    },

    setStatusCode: function(statusCode){
        this._nodeResponse.statusCode = statusCode;
    },

    complete: function(){
        this._nodeResponse.end();
    }

});