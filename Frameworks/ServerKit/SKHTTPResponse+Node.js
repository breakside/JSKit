// #import "ServerKit/SKHTTPResponse.js"
/* global require, SKHTTPResponse */
'use strict';

var fs = require('fs');

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
    },

    setHeader: function(name, value){
        this._nodeResponse.setHeader(name, value);
    },

    getHeader: function(name){
        return this._nodeResponse.getHeader(name);
    },

    writeData: function(data){
        this._nodeResponse.write(data.nodeBuffer());
    },

    writeFile: function(filePath){
        var fp = fs.createReadStream(filePath);
        fp.pipe(this._nodeResponse); // pipe will call this._nodeResponse.end(), which is the same as calling complete()
    }

});

SKHTTPResponse.defineInitMethod('initWithNodeResponse');